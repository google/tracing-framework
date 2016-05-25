/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Console JavaScript event provider.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.providers.ConsoleProvider');

goog.require('wtf.trace');
goog.require('wtf.trace.Provider');



/**
 * Provides the console API events.
 *
 * @param {!wtf.util.Options} options Options.
 * @constructor
 * @extends {wtf.trace.Provider}
 */
wtf.trace.providers.ConsoleProvider = function(options) {
  goog.base(this, options);

  this.injectConsoleProfiling_();
};
goog.inherits(wtf.trace.providers.ConsoleProvider, wtf.trace.Provider);


/**
 * Injects console.time/timeEnd functions.
 * @private
 */
wtf.trace.providers.ConsoleProvider.prototype.injectConsoleProfiling_ =
    function() {
  // Don't impersonate console - that would trick code that was looking for more
  // than we implement.
  // TODO(benvanik): implement all of console to make it possible to always
  //     provide these.
  var console = goog.global['console'];
  if (!console) {
    return;
  }

  // Track all timers to open time ranges.
  // It's very sad we have to do this, but console.time is a flawed API.
  var timeRangeMap = {};

  // console.time
  // var originalTime = console['time'];
  this.injectFunction(console, 'time', function time(timerName) {
    timeRangeMap[timerName] = wtf.trace.beginTimeRange(timerName);
  });

  // console.timeEnd
  // var originalTimeEnd = console['timeEnd'];
  this.injectFunction(console, 'timeEnd', function timeEnd(timerName) {
    var timeRange = timeRangeMap[timerName];
    delete timeRangeMap[timerName];
    wtf.trace.endTimeRange(timeRange);
  });

  // console.timeStamp
  var originalTimeStamp = console['timeStamp'];
  if (originalTimeStamp) {
    this.injectFunction(console, 'timeStamp', function timeStamp(name) {
      wtf.trace.timeStamp(name);
    });
  }
};
