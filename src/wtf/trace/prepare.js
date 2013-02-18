/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Tracing preparation.
 * This file contains the prepare method used to initialize WTF tracing.
 * It's in its own file so that it can depend on files that many otherwise
 * create cycles if it was in wtf.trace.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.prepare');

goog.require('wtf.trace.TraceManager');
goog.require('wtf.trace.providers');


/**
 * Main entry point for the tracing API.
 * This must be called as soon as possible and preferably before any application
 * code is executed (or even included on the page).
 *
 * This method does not setup a tracing session, but prepares the environment
 * for one. It can be called many times but the options provided are not updated
 * once it's been called.
 *
 * @param {Object=} opt_options Options overrides.
 * @return {*} Ignored.
 */
wtf.trace.prepare = function(opt_options) {
  var existingInstance = wtf.trace.TraceManager.getSharedInstance();
  if (existingInstance) {
    // TODO(benvanik): make sure options haven't changed?
    return existingInstance;
  }

  // Setup.
  var traceManager = new wtf.trace.TraceManager(opt_options);
  var options = traceManager.getOptions();

  // Add providers.
  if (!options.getBoolean('wtf.trace.disableProviders', false)) {
    wtf.trace.providers.setup(traceManager);
  }

  // Stash the global object.
  wtf.trace.TraceManager.setSharedInstance(traceManager);

  return traceManager;
};
