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

goog.provide('wtf.app');

goog.require('goog.dom.classes');
goog.require('wtf.app.MainDisplay');
goog.require('wtf.pal.BrowserPlatform');
goog.require('wtf.util');
goog.require('wtf.util.Options');


/**
 * Current UI.
 * Initialized by {@see wtf.app#show}.
 * @type {wtf.app.MainDisplay}
 * @private
 */
wtf.app.mainDisplay_ = null;


/**
 * Prepares the UI and shows it on the given page.
 *
 * @param {Object=} opt_options Options overrides.
 */
wtf.app.show = function(opt_options) {
  // Only one UI per page.
  goog.dispose(wtf.app.mainDisplay_);
  wtf.app.mainDisplay_ = null;

  // Get options; global with local overriding.
  var options = new wtf.util.Options();
  options.mixin(opt_options);
  options.mixin(goog.global['wtf_app_options']);

  // TODO(benvanik): switch to chrome platform when possible?
  var platform = new wtf.pal.BrowserPlatform();

  // TODO(benvanik): options value for this/fancy ui/etc.
  //wtf.addon.registerAddon('../addons/diagrams/diagrams.json');

  // Add to DOM when it is ready.
  wtf.util.callWhenDomReady(function() {
    wtf.app.showWhenDomLoaded_(platform, options);
  });
};


/**
 * Completes preparation of any UI after the DOM is ready.
 * @param {!wtf.pal.IPlatform} platform Platform abstraction layer.
 * @param {!wtf.util.Options} options Options.
 * @private
 */
wtf.app.showWhenDomLoaded_ = function(platform, options) {
  // Setup theme root class/reset.
  goog.dom.classes.add(document.body, goog.getCssName('k'));

  // Create display and add to the DOM.
  var mainDisplay = new wtf.app.MainDisplay(platform, options);
  wtf.app.mainDisplay_ = mainDisplay;
};
