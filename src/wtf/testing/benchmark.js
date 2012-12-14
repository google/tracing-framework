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
  if (typeof require !== 'undefined') {
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
   */
  exports.register = function(name, fn) {
    registeredBenchmarks[name] = {
      name: name,
      fn: fn
    };
  };


  /**
   * Runs a list of benchmarks.
   * @param {...string} var_arg A list of benchmark names to run.
   */
  exports.run = function(var_arg) {
    var suite = new Benchmark.Suite('WTF', {
      'onCycle': function(e) {
        //console.log(e);
      },
      'onError': function(e) {
        console.log(e);
      }
    });

    var names = arguments;
    for (var n = 0; n < names.length; n++) {
      var entry = registeredBenchmarks[names[n]];
      if (!entry) {
        reportBenchmarkError('Benchmark "' + names[n] + '" not found.');
        continue;
      }

      suite.add(entry.name, {
        'fn': function() {
          return entry.fn(123, 567);
        },
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
    }

    wtf.trace.start({
      'wtf.trace.mode': 'snapshotting',
      'wtf.trace.target': 'file://'
    });

    suite.run({
      //'async': true,
      'delay': 1,
      'initCount': 10000
    });
  };

}(this, typeof exports === 'undefined' ? this.benchmark = {} : exports));
