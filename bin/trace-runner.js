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


// // Import Closure Library and deps.js.
// require('../src/wtf/bootstrap/node').importClosureLibrary([
//   'wtf_js-deps.js'
// ]);

// // Disable asserts to reduce performance impact.
// goog.DEBUG = false;
// goog.require('goog.asserts');
// goog.asserts.assert = function(condition) {
//   return condition;
// };

// // Load WTF and configure options.
// goog.require('wtf');
// wtf.NODE = true;
// goog.require('wtf.trace.exports');

require('../build-out/wtf_trace_node_js_compiled');
console.log(wtf);

var filename = path.join(process.cwd(), process.argv[2]);
var args = process.argv.slice(3);
var code = fs.readFileSync(filename, 'utf8');

vm.runInThisContext(code, filename);

process.exit(0);
