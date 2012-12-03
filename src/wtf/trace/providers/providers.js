/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Provider setup/registration utilities.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.providers');

goog.require('wtf');
goog.require('wtf.trace');
goog.require('wtf.trace.providers.ConsoleProvider');
goog.require('wtf.trace.providers.DomProvider');
goog.require('wtf.trace.providers.ExtendedInfoProvider');
goog.require('wtf.trace.providers.TimingProvider');


/**
 * Sets up all providers.
 */
wtf.trace.providers.setup = function() {
  var traceManager = wtf.trace.getTraceManager();
  traceManager.addProvider(new wtf.trace.providers.ConsoleProvider());
  traceManager.addProvider(new wtf.trace.providers.TimingProvider());

  // Browser only:
  if (!wtf.NODE) {
    traceManager.addProvider(new wtf.trace.providers.DomProvider());
    traceManager.addProvider(new wtf.trace.providers.ExtendedInfoProvider());
  }

  // Node only:
};
