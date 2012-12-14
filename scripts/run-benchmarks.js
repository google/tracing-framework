#!/usr/bin/env node
/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview node.js runner.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

var fs = require('fs');
var vm = require('vm');

var benchmark = require('../src/wtf/testing/benchmark');
var benchmarkList = require('../test/benchmarks').value;

global.benchmark = benchmark;
global.wtf = require('../build-out/wtf_node_js_compiled');


function padLeft(value, width) {
  value = String(value);
  while (value.length < width) {
    value = value + ' ';
  }
  return value;
};


function padRight(value, width) {
  value = String(value);
  while (value.length < width) {
    value = ' ' + value;
  }
  return value;
};


var PAD_RIGHT = 14;


/**
 * Logs a benchmark error.
 * @param {string} msg Message.
 * @param {string=} opt_benchmarkName Benchmark that was running when the error
 *     occurred.
 */
global.reportBenchmarkError = function(msg, opt_benchmarkName) {
  console.log(msg);
};


/**
 * Logs a benchmark result.
 * @param {string} benchmarkName Benchmark name.
 * @param {{
 *   runCount: number,
 *   totalTime: number,
 *   userTime: number,
 *   meanTime: number
 * }} data Result data.
 */
global.reportBenchmarkResult = function(benchmarkName, data) {
  console.log(
      padLeft(benchmarkName, 32) + ' ' +
      padRight(data.runCount, PAD_RIGHT) + ' ' +
      padRight((data.totalTime * 1000).toFixed(3) + 'ms', PAD_RIGHT) + ' ' +
      padRight((data.meanTime * 1000).toFixed(5) + 'ms', PAD_RIGHT));
};


// Get the list of tests to run.
var benchmarkNames = process.argv.slice(2);

// Remove bad entries.
for (var n = benchmarkNames.length - 1; n >= 0; n--) {
  if (!benchmarkNames[n].length) {
    benchmarkNames.splice(n, 1);
  }
}

// If nothing provided, run all tests.
if (!benchmarkNames.length) {
  for (var n = 0; n < benchmarkList.length; n++) {
    var entry = benchmarkList[n];
    if (entry) {
      benchmarkNames.push(entry.name);
    }
  }
}

// TODO(benvanik): fuzzy search through testNames - if any contain *, lookup
// deps to find all matching namespaces.

// Sort test names.
// TODO(benvanik): sort by namespaces?
benchmarkNames.sort(function(a, b) {
  return a < b;
});

// Require all benchmark files.
for (var n = 0; n < benchmarkNames.length; n++) {
  var name = benchmarkNames[n];
  var entry = null;
  for (var m = 0; m < benchmarkList.length; m++) {
    if (benchmarkList[m] && benchmarkList[m].name == name) {
      entry = benchmarkList[m];
      break;
    }
  }
  if (entry) {
    var scriptUrl = './test/benchmarks/' + entry.script;
		vm.runInThisContext(fs.readFileSync(scriptUrl), scriptUrl);
  } else {
    reportBenchmarkError('Benchmark entry not found: ' + name);
  }
}

console.log(
      padLeft('[name]', 32) + ' ' +
      padRight('[count]', PAD_RIGHT) + ' ' +
      padRight('[total]', PAD_RIGHT) + ' ' +
      padRight('[mean]', PAD_RIGHT));

// Launch the run.
benchmark.run.apply(null, benchmarkNames);
