/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview UI namespace.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui');

goog.require('wtf.app.ui.MainDisplay');
goog.require('wtf.util');


/**
 * Current UI.
 * Initialized by {@see wtf.app.ui#show}.
 * @type {wtf.app.ui.MainDisplay}
 * @private
 */
wtf.app.ui.mainDisplay_ = null;


/**
 * Prepares the UI and shows it on the given page.
 *
 * @param {Object=} opt_options Options overrides.
 */
wtf.app.ui.show = function(opt_options) {
  // Only one UI per page.
  goog.dispose(wtf.app.ui.mainDisplay_);
  wtf.app.ui.mainDisplay_ = null;

  // Get options; global with local overriding.
  var options = {};
  var globalOptions = goog.global['wtf_app_ui_options'];
  if (globalOptions) {
    goog.mixin(options, globalOptions);
  }
  if (opt_options) {
    goog.mixin(options, opt_options);
  }

  // Add to DOM when it is ready.
  wtf.util.callWhenDomReady(function() {
    wtf.app.ui.showWhenDomLoaded_(options);
  });
};


/**
 * Completes preparation of any UI after the DOM is ready.
 * @param {!Object} options Options overrides.
 * @private
 */
wtf.app.ui.showWhenDomLoaded_ = function(options) {
  // Create display and add to the DOM.
  var mainDisplay = new wtf.app.ui.MainDisplay(options);
  wtf.app.ui.mainDisplay_ = mainDisplay;
};
