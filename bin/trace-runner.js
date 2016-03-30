#!/usr/bin/env node
/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview App shim script.
 * Runs a script with tracing enabled, dumping a snapshot at the end.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

var fs = require('fs');
var path = require('path');
var vm = require('vm');

// Load WTF binary. Search a few paths.
// TODO(benvanik): look in ENV?
var searchPaths = [
  '.',
  './build-out',
  '../build-out'
];
var modulePath = path.dirname(module.filename);
var wtfPath = null;
for (var n = 0; n < searchPaths.length; n++) {
  var searchPath = path.join(
      searchPaths[n], 'wtf_node_js_compiled.js');
  searchPath = path.join(modulePath, searchPath);
  if (fs.existsSync(searchPath)) {
    wtfPath = path.relative(modulePath, searchPath);
    break;
  }
}
if (!wtfPath) {
  console.log('Unable to find wtf_node_js_compiled.js');
  process.exit(-1);
  return;
}
var wtf = require(wtfPath.replace('.js', ''));

// Load the target script file.
var filename = path.join(process.cwd(), process.argv[2]);
var code = fs.readFileSync(filename, 'utf8');

// Strip the #!, if present.
if (code[0] == '#') {
  code = code.replace(/^#!.+\n/, '/* hash bang */\n');
}

// Setup process arguments to strip our run script.
// TODO(benvanik): look for -- to split args/etc
var args = process.argv.slice();
args.splice(1, 1);
process.argv = args;
// TODO(benvanik): setup options from command line/etc?
var options = {
  'wtf.trace.session.maximumMemoryUsage': 128 * 1024 * 1024,
  'wtf.trace.mode': 'snapshotting',
  'wtf.trace.target': 'file://'
};

// Make require relative to the input file.
var targetPath = path.dirname(filename);
var originalRequire = require;
function relativeRequire(name) {
  var relativePath = path.join(targetPath, name);
  try {
    return originalRequire(relativePath);
  } catch (e) {
  }
  return originalRequire(name);
};

// Create a new context to run the user code in.
// It must have access to our globals as well as the modified require that
// fixes path issues.
var context = vm.createContext({
  global: global,
  __dirname: targetPath,
  require: relativeRequire,
  console: console,
  module: module,
  process: process,
  wtf: wtf
});

// Starting the tracing framework.
wtf.trace.node.start(options);

// Execute the user script.
vm.runInContext(code, context, filename);
