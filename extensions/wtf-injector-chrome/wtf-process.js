/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Falafel processing script.
 * This file is designed to be loaded in browser process or in workers.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

(function(global) {

// console.log utility that doesn't explode when it's not present.
var ENABLE_LOGGING = global['ENABLE_LOGGING'] || false;
var log = (ENABLE_LOGGING && global.console) ?
    global.console.log.bind(global.console) : function() {};
var info = global.console && global.console.log ?
    global.console.log.bind(global.console) : function() {};
var warn = global.console && global.console.warn ?
    global.console.warn.bind(global.console) : function() {};


global['wtfi'] = global['wtfi'] || {};


/**
 * Processes source code for instrumentation.
 * @param {string} sourceText Input source text.
 * @param {!Object} options Instrumentation options.
 * @param {string=} opt_url Source URL.
 * @return {string} Transformed source text.
 */
global['wtfi']['process'] = function(
    sourceText, options, opt_url) {
  var instrumentationType = options['type'] || 'calls';
  var trackHeap = instrumentationType == 'memory';
  var trackTime = instrumentationType == 'time';
  var moduleId = options['moduleId'];
  var sourcePrefix = options['sourcePrefix'] || '';

  var falafel = global['wtfi']['falafel'];
  if (!falafel) {
    log('Falafel not found!');
    return sourceText;
  }

  var url = opt_url || 'inline';

  info('processing script ' + url + ' (' + sourceText.length + 'b)...');
  var startTime = Date.now();

  // Attempt to guess the names of functions.
  function getFunctionName(node) {
    function cleanupName(name) {
      return name.replace(/[ \n]/g, '');
    };

    // Simple case of:
    // function foo() {}
    if (node.id) {
      return cleanupName(node.id.name);
    }

    // get foo() {};
    if (node.parent.kind == 'get' || node.parent.kind == 'set') {
      return cleanupName(node.parent.key.name);
    }

    // var foo = function() {};
    if (node.parent.type == 'VariableDeclarator') {
      if (node.parent.id) {
        return cleanupName(node.parent.id.name);
      }
      log('unknown var decl', node.parent);
      return null;
    }

    // {foo: function() {}}
    // {"foo": function() {}}
    // {1: function() {}}
    if (node.parent.type == 'Property') {
      return cleanupName(node.parent.key.name || ''+node.parent.key.value);
    }

    // foo = function() {};
    // Bar.foo = function() {};
    if (node.parent.type == 'AssignmentExpression') {
      // We are the RHS, LHS is something else.
      var left = node.parent.left;
      if (left.type == 'MemberExpression') {
        // Bar.foo = function() {};
        // left.object {type: 'Identifier', name: 'Bar'}
        // left.property {type: 'Identifier', name: 'foo'}
        // Object can be recursive MemberExpression's:
        // Bar.prototype.foo = function() {};
        // left.object {type: 'MemberExpression', ...}
        // left.property {type: 'Identifier', name: 'foo'}
        return cleanupName(left.source());
      } else if (left.type == 'Identifier') {
        return cleanupName(left.name);
      }
      log('unknown assignment LHS', left);
    }

    //log('unknown fn construct', node);

    // TODO(benvanik): support jscompiler prototype alias:
    // _.$JSCompiler_prototypeAlias$$ = _.$something;
    // ...
    // _.$JSCompiler_prototypeAlias$$.$unnamed = function() {};

    // Recognize dart2js names.
    var ret = null;
    while (node.parent != null) {
      node = node.parent;
      if (node.type == 'Property') {
        if (!ret) {
          ret = node.key.name;
        } else {
          ret = node.key.name + '.' + ret;
        }
      }
    }
    return ret;
  };

  function isFunctionBlock(node) {
    var parent = node.parent;

    // function foo() {}
    var isDecl = parent.type == 'FunctionDeclaration';
    // = function [optional]() {}
    var isExpr = parent.type == 'FunctionExpression';
    // get foo() {} / set foo() {}
    var isProperty = parent && parent.parent &&
        parent.parent.kind == 'get' || parent.parent.kind == 'set';

    return isDecl || isExpr || isProperty;
  }

  // Compute an ignore map for fast checks.
  var ignores = {};
  var anyIgnores = false;
  var ignoreArg = options['ignore'] || null;
  if (ignoreArg) {
    if (Array.isArray(ignoreArg)) {
      for (var n = 0; n < ignoreArg.length; n++) {
        ignores[ignoreArg[n]] = true;
        anyIgnores = true;
      }
    } else {
      ignores[ignoreArg] = true;
      anyIgnores = true;
    }
  }

  // Compute ignore pattern.
  var ignorePatternArg = options['ignore-pattern'] || null;
  var ignorePattern = null;
  if (ignorePatternArg) {
    anyIgnores = true;
    ignorePattern = new RegExp(ignorePatternArg);
  }

  // Walk the entire document instrumenting functions.
  var nextFnId = 1;
  var nextAnonymousName = 0;
  var fns = [];
  // We have two modes of rewriting - wrapping the whole function in a try/catch
  // and explicitly handling all return statements. The try/catch mode is more
  // generally correct (since it means we'll always have an "exit" entry), but
  // can't be used in heap tracking mode because try/catch disables
  // optimization, which drammatically changes memory generation behavior.
  var tryCatchMode = !trackHeap && !trackTime;
  try {
    var targetCode = falafel(sourceText, function(node) {
      if (node.type == 'FunctionDeclaration') {
        // TODO(benvanik): find a way to instrument this with the wrapper.
      } else if (
          node.type == 'FunctionExpression' && node.parent.type != 'Property') {
        // Wrap with our wrapper to pass in source info.
        // TODO(benvanik): find a way to remove this.
        node.update('(__wtfw(__wtfb, ' + node.source() + '))');
      } else if (node.type == 'BlockStatement') {
        var parent = node.parent;

        // This may be a property - need to check:
        if (!isFunctionBlock(node)) {
          return;
        }

        // Guess function name or set to some random one.
        var name = getFunctionName(parent);
        if (!name || !name.length) {
          name = 'anon__WTFMID__$' + nextAnonymousName++;
        }

        // Check ignore list.
        if (ignores[name]) {
          return;
        }

        if (ignorePattern && ignorePattern.test(name)) {
          return;
        }

        var fnId = nextFnId++;
        fns.push('__WTFMID__|' + fnId);
        fns.push('"' + name.replace(/\"/g, '\\"') + '"');
        fns.push(node.range[0]);
        fns.push(node.range[1]);

        if (tryCatchMode) {
          node.update([
            '{',
            '__wtfEnter(__WTFMID__|' + fnId + ');',
            'try{' + node.source() + '}finally{',
            '__wtfExit(__WTFMID__|' + fnId + ');',
            '}}'
          ].join(''));
        } else {
          node.update([
            '{',
            'var __wtfId=__WTFMID__|' + fnId + ',__wtfRet;__wtfEnter(__wtfId);',
            node.source(),
            '__wtfExit(__wtfId);',
            '}'
          ].join(''));
        }
      } else if (!tryCatchMode && node.type == 'ReturnStatement') {
        // Walk up to see if this function is ignored.
        if (anyIgnores) {
          var testNode = node.parent;
          while (testNode) {
            if (testNode.type == 'BlockStatement') {
              if (isFunctionBlock(testNode)) {
                var testName = getFunctionName(testNode.parent);
                if (testName && ignores[testName]) {
                  return;
                }
                if (testName && ignorePattern && ignorePattern.test(testName)) {
                  return;
                }
                break;
              }
            }
            testNode = testNode.parent;
          }
        }

        if (node.argument) {
          node.update([
            '{__wtfRet=(',
            node.argument.source(),
            '); __wtfExit(__wtfId);',
            'return __wtfRet;}'
          ].join(''));
        } else {
          node.update('{__wtfExit(__wtfId); return;}');
        }
      } else if (node.type == 'Program') {
        // node.update([
        //   node.source(),
        //   //'\n//@ sourceMappingURL=' + url
        //   //'\n//@ sourceURL=' + url
        // ].join(''))
      }
    });
  } catch(e) {
    warn('Error rewriting code!', e);
    return sourceText;
  }

  // Add in the module map to the code.
  var sourceUrl = url == 'inline' ? url + '__WTFMID__' : url;
  var transformedText = [
    '//# sourceURL=' + sourceUrl,
    sourcePrefix,
    'var __wtfb = "' + (opt_url ? opt_url : '') + '"',
    '__wtfm[__WTFMID__] = {' +
        '"src": "' + url + '",' +
        '"fns": [' + fns.join(',') + ']};',
    targetCode.toString()
  ].join('\n');

  // If we were given a module ID swap it in now.
  if (moduleId !== undefined) {
    transformedText = transformedText.replace(/__WTFMID__/g, moduleId << 24);
  }

  var totalTime = Date.now() - startTime;
  info('  completed in ' + totalTime + 'ms');

  return transformedText;
};


// If we are running in a worker grab falafel and export our trampoline.
if (!global.document) {
  global.onmessage = function(e) {
    var data = e.data;
    var result = global.wtfi.process(
        data.sourceText,
        data.options,
        data.url);
    postMessage({
      moduleId: data.moduleId,
      transformedText: result
    });
  };
}


})(this);
