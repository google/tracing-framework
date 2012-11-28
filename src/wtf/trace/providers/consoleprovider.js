/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Console Javascript event provider.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.providers.ConsoleProvider');

goog.require('wtf.trace');
goog.require('wtf.trace.Provider');



/**
 * Provides the console API events.
 *
 * @constructor
 * @extends {wtf.trace.Provider}
 */
wtf.trace.providers.ConsoleProvider = function() {
  goog.base(this);

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

  // Track all timers to open scopes.
  // It's very sad we have to do this, but console.time is a flawed API.
  var scopeMap = {};

  // console.time
  var originalTime = console['time'];
  this.injectFunction(console, 'time', function time(timerName) {
    scopeMap[timerName] = wtf.trace.enterScope(timerName);
  });

  // console.timeEnd
  var originalTimeEnd = console['timeEnd'];
  this.injectFunction(console, 'timeEnd', function timeEnd(timerName) {
    var scope = scopeMap[timerName];
    if (scope) {
      scope.leave();
    }
  });
};
