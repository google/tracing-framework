/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Benchmark runner.
 * This file is used by both node.js and the browser, so do not use any
 * platform-specific APIs.
 *
 * The only safe functions to use:
 * reportBenchmarkResult(benchmarkName, {
 *   runCount: number,
 *   totalTime: number,
 *   userTime: number,
 *   meanTime: number
 * });
 * reportBenchmarkError(msg, opt_benchmarkName);
 *
 * @author benvanik@google.com (Ben Vanik)
 */


(function(global, exports) {

  var Benchmark = global.Benchmark;
  var wtf = global.wtf;
  var isNode = typeof require !== 'undefined';
  var platform = isNode ? 'node' : 'browser';
  if (isNode) {
    Benchmark = require('benchmark');
    wtf = require('../../../build-out/wtf_node_js_compiled');
  }

  /**
   * All registered benchmarks, by name.
   * @type {!Object.<{
   *   name: string,
   *   fn: Function
   * }>}
   */
  var registeredBenchmarks = {};


  /**
   * Defines a benchmark.
   * This should be called from the benchmark script files as loaded. The name
   * given is used for display and test filtering.
   * @param {string} name Benchmark name.
   * @param {Function} fn [description].
   * @param {Array.<string>=} opt_platforms A list of platform strings the test
   *     is valid for. 'node' and 'browser' are supported.
   */
  exports.register = function(name, fn, opt_platforms) {
    // Skip tests not supported.
    if (opt_platforms) {
      var supported = false;
      for (var n = 0; n < opt_platforms.length; n++) {
        if (opt_platforms[n] == platform) {
          supported = true;
          break;
        }
      }
      if (!supported) {
        return;
      }
    }

    registeredBenchmarks[name] = {
      name: name,
      fn: fn
    };
  };


  /**
   * Runs a list of benchmarks.
   * @param {Array.<string>=} opt_names Benchmarks to run. Can include regex
   *     strings if formated as '/foo/i'. Omit to run all benchmarks.
   */
  exports.run = function(opt_names) {
    var suite = new Benchmark.Suite('WTF', {
      'onCycle': function(e) {
        //console.log(e);
      },
      'onError': function(e) {
        console.log(e);
      }
    });

    // TODO(benvanik): support regex names
    var names = opt_names || [];
    if (!names.length) {
      for (var name in registeredBenchmarks) {
        names.push(name);
      }
    }

    // Remove bad entries.
    for (var n = names.length - 1; n >= 0; n--) {
      if (!names[n].length) {
        names.splice(n, 1);
      }
    }

    // Sort test names.
    // TODO(benvanik): sort by namespaces?
    names.sort();

    for (var n = 0; n < names.length; n++) {
      var entry = registeredBenchmarks[names[n]];
      if (!entry) {
        reportBenchmarkError('Benchmark "' + names[n] + '" not found.');
        continue;
      }

      (function(entry) {
        suite.add(entry.name, {
          'fn': entry.fn,
          'setup': function() {
            wtf.trace.reset();
          },
          'teardown': function() {
            wtf.trace.reset();
          },
          'onComplete': function() {
            reportBenchmarkResult(this.name, {
              runCount: this.count,
              totalTime: this.times.elapsed,
              userTime: this.times.elapsed,
              meanTime: this.stats.mean
            });
          }
        });
      })(entry);
    }

    var options = {
      'wtf.trace.mode': 'snapshotting',
      'wtf.trace.target': 'file://',
      'wtf.trace.disableProviders': true
    };
    wtf.trace.prepare(options);
    wtf.trace.start();

    suite.run({
      'async': true,
      'delay': 1,
      'initCount': 10000
    });
  };

}(this, typeof exports === 'undefined' ? this.benchmark = {} : exports));
