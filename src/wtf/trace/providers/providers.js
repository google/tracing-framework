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
goog.require('wtf.trace.providers.BrowserProvider');
goog.require('wtf.trace.providers.ConsoleProvider');
goog.require('wtf.trace.providers.DomProvider');
goog.require('wtf.trace.providers.ImageProvider');
goog.require('wtf.trace.providers.TimingProvider');
goog.require('wtf.trace.providers.WebGLProvider');
goog.require('wtf.trace.providers.WebWorkerProvider');
goog.require('wtf.trace.providers.XhrProvider');


/**
 * Sets up all providers.
 * @param {!wtf.trace.TraceManager} traceManager Trace manager.
 */
wtf.trace.providers.setup = function(traceManager) {
  var options = traceManager.getOptions();

  traceManager.addProvider(
      new wtf.trace.providers.ConsoleProvider(options));
  traceManager.addProvider(
      new wtf.trace.providers.TimingProvider(options));

  // Browser only:
  if (!wtf.NODE) {
    traceManager.addProvider(
        new wtf.trace.providers.DomProvider(options));
    traceManager.addProvider(
        new wtf.trace.providers.ImageProvider(options));
    traceManager.addProvider(
        new wtf.trace.providers.XhrProvider(options));
    traceManager.addProvider(
        new wtf.trace.providers.WebGLProvider(traceManager, options));
    traceManager.addProvider(
        new wtf.trace.providers.WebWorkerProvider(traceManager, options));
    traceManager.addProvider(
        new wtf.trace.providers.BrowserProvider(options));
  }

  // Node only:
};
