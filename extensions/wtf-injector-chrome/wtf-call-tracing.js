/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Extension instrumentation script.
 * Manually instruments code for producing wtf-calls files.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

(function(global) {

// console.log utility that doesn't explode when it's not present.
var ENABLE_LOGGING = false;
var log = (ENABLE_LOGGING && window.console) ?
    window.console.log.bind(window.console) : function() {};
var info = window.console && window.console.log ?
    window.console.log.bind(window.console) : function() {};
var warn = window.console && window.console.warn ?
    window.console.warn.bind(window.console) : function() {};


global['wtfi'] = global['wtfi'] || {};


/**
 * The module ID of the next script to be transformed. This must be unique
 * per wtf-calls file.
 * @type {number}
 */
var nextModuleId = 1;


/**
 * Total number of nested activity indicator show requests.
 * @type {number}
 */
var indicatorDepth = 0;


/**
 * Shows the activity indicator.
 * @param {!HTMLDocument} doc Document.
 */
function showActivityIndicator(doc) {
  indicatorDepth++;
  if (indicatorDepth == 1) {
    // Show.
    // TODO(benvanik): talk to content script to show the indicator.
  }
};


/**
 * Hides the activity indicator.
 * @param {!HTMLDocument} doc Document.
 */
function hideActivityIndicator(doc) {
  indicatorDepth--;
  if (!indicatorDepth) {
    // Hide.
    // TODO(benvanik): content script.
  }
};


var resolveCache = null;
/**
 * Resolves a URL to an absolute path.
 * @param {string} baseUrl Base URL.
 * @param {string} url Target URL.
 */
var resolveUrl = function(baseUrl, url) {
  if (!resolveCache) {
    var iframe = document.createElement('iframe');
    document.documentElement.appendChild(iframe);
    var doc = iframe.contentWindow.document;
    var base = doc.createElement('base');
    doc.documentElement.appendChild(base);
    var a = doc.createElement('a');
    doc.documentElement.appendChild(a);
    iframe.parentNode.removeChild(iframe);
    resolveCache = {
      iframe: iframe,
      base: base,
      a: a
    };
  }
  resolveCache.base.href = baseUrl;
  resolveCache.a.href = url;
  return resolveCache.a.href;
};


/**
 * Processes a script element.
 * @param {!HTMLScriptElement} el Input script element.
 * @param {boolean=} opt_synchronous Whether to do fetches synchronously.
 * @param {string=} opt_baseUrl Base URL override.
 * @return {!HTMLScriptElement} Processed script element. Likely the same as the
 *      input element.
 */
function processScript(el, opt_synchronous, opt_baseUrl) {
  var doc = el.ownerDocument;
  if (el.text || el.innerText) {
    // Synchronous block.
    // This happens inline in process so that we can preserve the synchronous
    // behavior.
    log('process of sync script', el);
    showActivityIndicator(doc);
    var resultText = global['wtfi']['process'](
        el.text || el.innerText,
        nextModuleId++,
        global['wtfi']['options']);
    if (el.text) {
      el.text = resultText;
    } else if (el.innerText) {
      el.innerText = resultText;
    }
    hideActivityIndicator(doc);
    el['__wtfi__'] = true;
    return el;
  } else if (el.src && el.src.length && opt_synchronous) {
    // Synchronous src.
    log('process of sync script', el);
    showActivityIndicator(doc);
    var src = opt_baseUrl ? resolveUrl(opt_baseUrl, el.getAttribute('src')) : el.src;
    var xhr = new XMLHttpRequest();
    xhr.onload = function(e) {
      if (xhr.status != 200) {
        return;
      }
      var responseText = xhr.responseText;
      var resultText = global['wtfi']['process'](
          xhr.responseText,
          nextModuleId++,
          global['wtfi']['options'],
          src);
      el['__wtfi__'] = true;
      el.src = null;
      el.text = resultText;
      var loadEvent = new Event('load');
      loadEvent.target = el;
      loadEvent.srcElement = el;
      el.dispatchEvent(loadEvent);
      hideActivityIndicator(doc);
    };
    xhr.open('GET', src, false);
    xhr.send();

    return el;
  } else if (el.src && el.src.length && !opt_synchronous) {
    // Asynchronous src.
    log('process of async script', el);
    showActivityIndicator(doc);
    // Don't actually add the element yet - wait. We fake the add here so that
    // we can replace it with the modified one later.
    var asyncScript = {
      el: el,
      replacementEl: doc.createElement('script'),
      src: opt_baseUrl ? resolveUrl(opt_baseUrl, el.getAttribute('src')) : el.src
    };

    // TODO(benvanik): dispatch to web worker.
    var xhr = new XMLHttpRequest();
    xhr.onload = function(e) {
      if (xhr.status != 200) {
        return;
      }
      var responseText = xhr.responseText;
      var resultText = global['wtfi']['process'](
          xhr.responseText,
          nextModuleId++,
          global['wtfi']['options'],
          asyncScript.src);
      el['__wtfi__'] = true;
      el.src = null;
      el.text = resultText;
      asyncScript.replacementEl.parentNode.replaceChild(
          asyncScript.el, asyncScript.replacementEl);
      var loadEvent = new Event('load');
      loadEvent.target = el;
      loadEvent.srcElement = el;
      el.dispatchEvent(loadEvent);
      hideActivityIndicator(doc);
    };
    xhr.open('GET', asyncScript.src, !opt_synchronous);
    xhr.send();

    // Return replacement <script> - we'll swap it later.
    asyncScript.replacementEl['__wtfi__'] = true;
    return asyncScript.replacementEl;
  } else {
    log('unknown script type', el);
    return el;
  }
};


/**
 * Replaces the <script> tag with our own instrumented version.
 * @param {!Document} doc Target document object.
 * @param {!Window} targetWindow Window.
 */
function injectScriptElement(targetWindow, doc) {
  var Node = targetWindow.Node;
  var HTMLDocument = targetWindow.HTMLDocument;
  var HTMLScriptElement = targetWindow.HTMLScriptElement;
  var proto = HTMLScriptElement.prototype;

  // Listen for sets on innerText.
  // Listen for sets on src.
  // Track when added to DOM via appendChild.

  // Replace appendChild/etc so that we can watch for script adds.
  var originalAppendChild = Node.prototype.appendChild;
  Node.prototype.appendChild = function appendChild(newChild) {
    if (newChild instanceof HTMLScriptElement && !newChild['__wtfi__']) {
      // appendChild(<script>)
      log('appendChild of script', newChild);
      var processedChild = processScript(newChild);
      return originalAppendChild.call(this, processedChild);
    } else {
      return originalAppendChild.apply(this, arguments);
    }
  };
  var originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function insertBefore(newChild, refChild) {
    if (newChild instanceof HTMLScriptElement && !newChild['__wtfi__']) {
      // insertBefore(<script>, ...)
      log('insertBefore of script', newChild);
      var processedChild = processScript(newChild);
      return originalInsertBefore.call(this, processedChild, refChild);
    } else {
      return originalInsertBefore.apply(this, arguments);
    }
  };
  var originalReplaceChild = Node.prototype.replaceChild;
  Node.prototype.replaceChild = function replaceChild(
      newChild, oldChild) {
    if (newChild instanceof HTMLScriptElement && !newChild['__wtfi__']) {
      // replaceChild(<script>, ...)
      log('insertBefore of script', newChild);
      var processedChild = processScript(newChild);
      return originalReplaceChild.call(this, processedChild, oldChild);
    } else {
      return originalReplaceChild.apply(this, arguments);
    }
  };

  // Replace document.createElement so we can hook new script elements.
  // var originalCreateElement = HTMLDocument.prototype.createElement;
  // HTMLDocument.prototype.createElement = function createElement(tagName) {
  //   if (tagName.toLowerCase() == 'script') {
  //     // <script>.
  //     var result = originalCreateElement.apply(this, arguments);
  //     log('could instrument <script>', result);
  //     return result;
  //   } else {
  //     return originalCreateElement.apply(this, arguments);
  //   }
  // };
};


/**
 * Instruments document.write* to look for script additions.
 * @param {!Document} doc Target document object.
 * @param {!Window} targetWindow Window.
 */
function injectDocumentWrite(targetWindow, doc) {
  var stackContainer = new Error();
  function processMarkup(markup) {
    if (markup.indexOf('<script ') == -1) {
      // Probably not a script tag. Ignore.
      return false;
    }

    // Try really hard to get base URLs.
    var baseUrl = arguments.callee.caller.caller['__src'];
    if (!baseUrl) {
      var originalPrepare = Error.prepareStackTrace;
      Error.prepareStackTrace = function(e, callSites) {
        return callSites;
      };
      Error.captureStackTrace(stackContainer);
      var stack = stackContainer.stack;
      Error.prepareStackTrace = originalPrepare;
      baseUrl = stack[2].getFileName();
    }

    // We hackily do this by creating the DOM inside of a non-document-rooted
    // div and query all scripts. This lets us find multiple scripts/etc and
    // not have to worry about parsing HTML ourselves.
    var div = doc.createElement('div');
    div.innerHTML = markup;
    var scripts = div.querySelectorAll('script');
    if (!scripts || !scripts.length) {
      return false;
    }

    log('document.write* of scripts', scripts);

    // Process each script.
    // Since document.write* is synchronous, we must fetch and process inline.
    for (var n = 0; n < scripts.length; n++) {
      var script = scripts[n];
      var processedScript = processScript(script, true, baseUrl);
      // Eval in window context - with our sourceURL tag this lets the code
      // show in the dev tools correctly.
      eval.call(targetWindow, processedScript.text);
    }

    // TODO(benvanik): ensure we aren't eating other stuff that needs to go
    // into the DOM.
    return true;
  };

  var originalDocWrite = doc.write;
  doc.write = function write(markup) {
    if (processMarkup(markup)) {
      return;
    } else {
      return originalDocWrite.apply(this, arguments);
    }
  };
  doc.write['raw'] = originalDocWrite;

  var originalDocWriteLn = doc.writeln;
  doc.writeln = function writeln(line) {
    if (processMarkup(line)) {
      return;
    } else {
      return originalDocWriteLn.apply(this, arguments);
    }
  };
  doc.writeln['raw'] = originalDocWriteLn;
};


/**
 * Scans the current page DOM for <script> elements and swaps them out.
 * @param {!Window} targetWindow Window.
 * @param {!Document} doc Target document object.
 */
function scanPageScripts(targetWindow, doc) {
  // In Firefox we could use this:
  // https://developer.mozilla.org/en-US/docs/Web/API/element.onbeforescriptexecute
  // doc.addEventListener('beforescriptexecute', function(e) {
  //   console.log('before', e);
  // }, true);

  // It's possible to get in the crazy situation where we actually have access
  // to the <script> *before it's done loading*. In that case, we are kind of
  // hosed.

  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      for (var n = 0; n < mutation.addedNodes.length; n++) {
        var node = mutation.addedNodes[n];
        if (node instanceof HTMLScriptElement && !node['__wtfi__'] &&
            !node.getAttribute('__wtfi__')) {
          var processedScript = processScript(node, true);
          if (processedScript != node) {
            node.parentNode.replaceChild(node, processedScript);
          }
        }
      }
    });
  });
  var target = doc.documentElement;
  observer.observe(target, {
    childList: true,
    subtree: true
  });

  // Kill the observer when the document loads so that we don't keep listening
  // for all DOM mutations. The other hooks should catch everything else.
  doc.addEventListener('DOMContentLoaded', function() {
    observer.disconnect();
  }, false);
};


/**
 * Prepares and instruments the page with the given options.
 * @param {!Object} options Options.
 * @param {Window=} opt_window Target window.
 */
global['wtfi']['prepare'] = function(options, opt_window) {
  global['wtfi']['options'] = options;

  // Only do the shared code init on the top window.
  var targetWindow = opt_window || global;
  var isTop = opt_window ? opt_window === global.top : true;

  var doc = targetWindow.document;
  if (doc) {
    // Running in page.
    runSharedInitCode(targetWindow, options);

    // Inject <script>.
    injectScriptElement(targetWindow, doc);

    // Inject document.write*.
    injectDocumentWrite(targetWindow, doc);

    // Replace any already-existing DOM scripts.
    scanPageScripts(targetWindow, doc);
  } else {
    // Running in worker.
    log('Workers aren\'t supported yet!');
  }
};


// TODO(benvanik): move to external file to share with node/workers/etc.
/**
 * Processes source code for instrumentation.
 * @param {string} sourceText Input source text.
 * @param {number} moduleId Unique module ID.
 * @param {!Object} options Instrumentation options.
 * @return {string} Transformed source text.
 */
global['wtfi']['process'] = function(
    sourceText, moduleId, options, opt_url) {
  var instrumentationType = options['type'] || 'calls';
  var trackHeap = instrumentationType == 'memory';
  var trackTime = instrumentationType == 'time';

  var falafel = global['wtfi']['falafel'];
  if (!falafel) {
    log('Falafel not found!');
    return sourceText;
  }

  var url = opt_url || 'inline';

  info('processing script ' + url + ' (' + sourceText.length + 'b)...');
  var startTime = Date.now();

  // TODO(benvanik): hash and check local storage to see if the source has
  //     already been transformed.

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

    // var foo = function() {};
    if (node.parent.type == 'VariableDeclarator') {
      if (node.parent.id) {
        return cleanupName(node.parent.id.name);
      }
      log('unknown var decl', node.parent);
      return null;
    }

    // foo = function() {};
    // Bar.foo = function() {};
    //
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
      return null;
    }

    //log('unknown fn construct', node);

    // TODO(benvanik): support jscompiler prototype alias:
    // _.$JSCompiler_prototypeAlias$$ = _.$something;
    // ...
    // _.$JSCompiler_prototypeAlias$$.$unnamed = function() {};

    return null;
  };

  function isFunctionBlock(node) {
    var parent = node.parent;

    // function foo() {}
    var isDecl = parent.type == 'FunctionDeclaration';
    // = function [optional]() {}
    var isExpr = parent.type == 'FunctionExpression';

    return isDecl || isExpr;
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
  var nextFnId = (moduleId << 24) + 1;
  var nextAnonymousName = 0;
  var fns = [];
  // We have two modes of rewriting - wrapping the whole function in a try/catch
  // and explicitly handling all return statements. The try/catch mode is more
  // generally correct (since it means we'll always have an "exit" entry), but
  // can't be used in heap tracking mode because try/catch disables
  // optimization, which drammatically changes memory generation behavior.
  var tryCatchMode = !trackHeap && !trackTime;
  var targetCode = falafel(sourceText, function(node) {
    if (node.type == 'FunctionDeclaration') {
      // TODO(benvanik): find a way to instrument this with the wrapper.
    } else if (node.type == 'FunctionExpression') {
      // Wrap with our wrapper to pass in source info.
      // TODO(benvanik): find a way to remove this.
      node.update('__wtfw(__wtfb, ' + node.source() + ')');
    } else if (node.type == 'BlockStatement') {
      var parent = node.parent;
      if (!isFunctionBlock(node)) {
        return;
      }

      // Guess function name or set to some random one.
      var name = getFunctionName(parent);
      if (!name || !name.length) {
        name = 'anon' + moduleId + '$' + nextAnonymousName++;
      }

      // Check ignore list.
      if (ignores[name]) {
        return;
      }

      if (ignorePattern && ignorePattern.test(name)) {
        return;
      }

      var fnId = nextFnId++;
      fns.push(fnId);
      fns.push('"' + name.replace(/\"/g, '\\"') + '"');
      fns.push(node.range[0]);
      fns.push(node.range[1]);

      if (tryCatchMode) {
        node.update([
          '{',
          '__wtfEnter(' + fnId + ');',
          'try{' + node.source() + '}finally{',
          '__wtfExit(' + fnId + ');',
          '}}'
        ].join(''));
      } else {
        node.update([
          '{',
          'var __wtfId=' + fnId + ',__wtfRet;__wtfEnter(__wtfId);',
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

  // Add in the module map to the code.
  var sourceUrl = url == 'inline' ? url + moduleId : url;
  var transformedText = [
    '//# sourceURL=' + sourceUrl,
    'var __wtfb = "' + url + '"',
    '__wtfm[' + moduleId + '] = {' +
        '"src": "' + url + '",' +
        '"fns": [' + fns.join(',') + ']};',
    targetCode.toString()
  ].join('\n');

  // TODO(benvanik): cache the transformed result.

  var totalTime = Date.now() - startTime;
  info('  completed in ' + totalTime + 'ms');

  return transformedText;
};


// TODO(benvanik): clean up, make support nodejs too.
// TODO(benvanik): put in an external file, have a HUD, etc.
/**
 * Runs at prepare time to create global functions/UI/etc.
 * @param {!Window} targetWindow Window.
 * @param {!Object} options Options.
 */
function runSharedInitCode(targetWindow, options) {
  var instrumentationType = options['type'] || 'calls';
  var topWindow = window.top;
  var isTop = targetWindow === topWindow;

  // Add a global tag to let WTF know we are on the page. The extension can
  // then yell at the user for trying to use both at the same time.
  var firstBlock = !targetWindow.__wtfInstrumentationPresent;
  targetWindow.__wtfInstrumentationPresent = true;

  // Add a big warning div to let users know the proxy is active.
  // This is useful for when the proxy is accidentally left enabled.
  if (firstBlock) {
    var div = document.createElement('div');
    div.style.zIndex = 999999;
    div.style.position = 'fixed';
    div.style.left = '50%';
    div.style.top = 0;
    div.style.backgroundColor = 'red';
    div.style.color = 'white';
    div.style.font = '8pt monospace';
    div.style.padding = '3px';
    div.style.userSelect = 'none';
    div.style.webkitUserSelect = 'none';
    div.innerHTML = 'WTF INSTRUMENTATION ENABLED';
    if (document.body) {
      document.body.appendChild(div);
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        document.body.appendChild(div);
      }, false);
    }

    // Check to see if WTF is active on the page.
    // The user shouldn't be trying to trace and instrument at the same time.
    if (global['wtf']) {
      div.innerHTML = 'You must disable WTF to run with instrumentation';
      window.alert('The WTF tracing feature cannot be used on ' +
          'instrumented code. Disable instrumentation and try again.');
    }

    // Add helper buttons.
    var innerDiv = document.createElement('div');
    div.appendChild(innerDiv);
    function addButton(name, tip, code) {
      var a = document.createElement('a');
      a.innerHTML = name;
      a.title = tip;
      a.href = 'javascript:' + code;
      a.style.marginRight = '5px';
      a.style.color = 'white';
      a.style.textDecoration = 'underline';
      innerDiv.appendChild(a);
    };
    addButton('Clear', 'Clear current trace data.', '__resetTrace()');
    addButton('Save', 'Save the trace to a file.', '__saveTrace()');
    addButton('Show', 'Show the trace in the WTF UI.', '__showTrace()');
  }

  var dataMagnitude = 26; // 2^26 = 67 million records
  var dataSize = 1 << dataMagnitude;
  var dataMask = dataSize - 1;
  targetWindow.__wtfm = topWindow.__wtfm || {};
  targetWindow.__wtfd = topWindow.__wtfd || new Int32Array(1 << dataMagnitude);
  targetWindow.__wtfi = topWindow.__wtfi || 0;
  switch (instrumentationType) {
  default:
  case 'calls':
    targetWindow.__wtfEnter = function(id) {
      __wtfd[__wtfi++ & dataMask] = id;
    };
    targetWindow.__wtfExit = function(id) {
      __wtfd[__wtfi++ & dataMask] = -id;
    };
    break;
  case 'memory':
    var getHeapUsage = null;
    try {
      getHeapUsage = new Function('return %GetHeapUsage()');
    } catch (e) {
      window.alert('Launch Chrome with --js-flags=--allow-natives-syntax');
    }
    targetWindow.__wtfEnter = function(id) {
      __wtfd[__wtfi++ & dataMask] = id;
      __wtfd[__wtfi++ & dataMask] = getHeapUsage();
    };
    targetWindow.__wtfExit = function(id) {
      __wtfd[__wtfi++ & dataMask] = -id;
      __wtfd[__wtfi++ & dataMask] = getHeapUsage();
    };
    break;
  case 'time':
    targetWindow.__wtfEnter = function(id) {
      __wtfd[__wtfi++ & dataMask] = id;
      __wtfd[__wtfi++ & dataMask] = targetWindow.performance.now() * 1000;
    };
    targetWindow.__wtfExit = function(id) {
      __wtfd[__wtfi++ & dataMask] = -id;
      __wtfd[__wtfi++ & dataMask] = targetWindow.performance.now() * 1000;
    };
    break;
  }
  targetWindow.__wtfw = function(__wtfb, f) {
    f['__src'] = __wtfb;
    return f;
  };
  targetWindow.__resetTrace = function() {
    targetWindow.__wtfi = 0;
  };
  targetWindow.__grabTrace = function() {
    var euri = window.location.href;
    var etitle =
        window.document.title.replace(/\\/g, '\\\\').replace(/\"/g, '\\"');
    var attributes = '[]';
    switch (instrumentationType) {
    default:
    case 'calls':
      break;
    case 'memory':
      attributes = '[{"name": "heapSize", "units": "bytes"}]';
      break;
    case 'time':
      attributes = '[{"name": "time", "units": "us"}]';
      break;
    }
    var headerText = '{' +
        '"version": 1,' +
        '"context": {"uri": "' + euri + '", "title": "' + etitle + '"},' +
        '"metadata": {' +
        '  "attributes": ' + attributes +
        '},' +
        '"modules": ' + JSON.stringify(targetWindow.__wtfm) + '}';
    var headerLength = headerText.length;
    var header = new Uint8Array(4 + headerLength);
    header[0] = (headerLength) & 0xFF;
    header[1] = (headerLength >>> 8) & 0xFF;
    header[2] = (headerLength >>> 16) & 0xFF;
    header[3] = (headerLength >>> 24) & 0xFF;
    for (var n = 0; n < headerLength; n++) {
      header[4 + n] = headerText.charCodeAt(n) & 0xFF;
    }

    var padLength = 0;
    var i = 4 + headerLength;
    if (i % 4) {
      padLength = 4 - (i % 4);
    }
    var padBytes = new Uint8Array(padLength);

    var contents = new Uint8Array(targetWindow.__wtfd.buffer);
    contents = contents.subarray(0, targetWindow.__wtfi * 4);

    return [
      header,
      padBytes,
      contents
    ];
  };
  targetWindow.__showTrace = function() {
    // Grab trace data and combine into a single buffer.
    var buffers = targetWindow.__grabTrace();
    var totalLength = 0;
    for (var n = 0; n < buffers.length; n++) {
      totalLength += buffers[n].length;
    }
    var buffer = new Uint8Array(totalLength);
    for (var n = 0, o = 0; n < buffers.length; n++) {
      var sourceBuffer = buffers[n];
      for (var m = 0; m < sourceBuffer.length; m++) {
        buffer[o + m] = sourceBuffer[m];
      }
      o += sourceBuffer.length;
    }

    var boundHandler = function(e) {
      if (e.data && e.data['wtf_ipc_connect_token'] &&
          e.data.data && e.data.data['hello'] == true) {
        e.stopPropagation();
        window.removeEventListener('message', boundHandler, true);

        e.source.postMessage({
          'wtf_ipc_connect_token': true,
          'data': {
            'command': 'snapshot',
            'content_types': ['application/x-extension-wtf-calls'],
            'content_sources': [Date.now() + '.wtf-calls'],
            'content_buffers': [buffer],
            'content_length': totalLength
          }
        }, '*');
      }
    };
    window.addEventListener('message', boundHandler, true);
    var uiUrl =
        'http://google.github.com/tracing-framework/bin/app/maindisplay.html';
        //'http://localhost:8080/app/maindisplay-debug.html';
        //'http://localhost:8080/app/maindisplay.html';
    window.open(uiUrl + '?expect_data', '_blank');
  };
  targetWindow.__saveTrace = function(opt_filename) {
    // Grab trace blob URL.
    var buffers = targetWindow.__grabTrace();
    var blob = new Blob(buffers, {
      type: 'application/octet-stream'
    });
    var url = URL.createObjectURL(blob);

    // Fake a download.
    var a = document.createElement('a');
    a.download = opt_filename || (Date.now() + '.wtf-calls');
    a.href = url;
    var e = document.createEvent('MouseEvents');
    e.initMouseEvent(
        'click',
        true, false, window, 0, 0, 0, 0, 0,
        false, false, false, false, 0, null);
    a.dispatchEvent(e);
  };
};


})(this);
