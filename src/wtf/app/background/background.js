/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview App background page namespace.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.background');

goog.require('wtf.app.background.BackgroundPage');


/**
 * Current background page.
 * Initialized by {@see wtf.app.background#run}.
 * @type {wtf.app.background.BackgroundPage}
 * @private
 */
wtf.app.background.backgroundPage_ = null;


/**
 * Prepares the background page and runs it in the current context.
 *
 * @param {Object=} opt_options Options overrides.
 */
wtf.app.background.run = function(opt_options) {
  // Only one background page per context.
  goog.dispose(wtf.app.background.backgroundPage_);
  wtf.app.background.backgroundPage_ = null;

  // Get options; global with local overriding.
  var options = {};
  var globalOptions = goog.global['wtf_app_background_options'];
  if (globalOptions) {
    goog.mixin(options, globalOptions);
  }
  if (opt_options) {
    goog.mixin(options, opt_options);
  }

  // Create background page.
  wtf.app.background.backgroundPage_ =
      new wtf.app.background.BackgroundPage(options);
};


/**
 * Disposes the background page and all resources.
 */
wtf.app.background.dispose = function() {
  goog.dispose(wtf.app.background.backgroundPage_);
  wtf.app.background.backgroundPage_ = null;
};
