/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview HUD namespace.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.hud');

goog.require('wtf.hud.Overlay');
goog.require('wtf.trace');
goog.require('wtf.trace.ISessionListener');
goog.require('wtf.util');
goog.require('wtf.util.Options');


/**
 * Current HUD.
 * Initialized by {@see wtf.hud#prepare}.
 * @type {wtf.hud.Overlay}
 * @private
 */
wtf.hud.overlay_ = null;


/**
 * Prepares the HUD and shows it on the given page.
 * The current tracing session will be used to source data for the HUD.
 *
 * @param {Object=} opt_options Options overrides.
 * @param {Element=} opt_parentElement Element to display in.
 */
wtf.hud.prepare = function(opt_options, opt_parentElement) {
  // Only one HUD per page.
  goog.dispose(wtf.hud.overlay_);
  wtf.hud.overlay_ = null;

  // Get options; global with local overriding.
  var options = new wtf.util.Options();
  options.mixin(opt_options);
  options.mixin(goog.global['wtf_hud_options']);

  // Add to DOM when it is ready.
  wtf.util.callWhenDomReady(function() {
    var listener = new wtf.hud.SessionListener_(options, opt_parentElement);
    wtf.trace.addSessionListener(listener);
  });
};



/**
 * Session listener, showing and hiding HUDs.
 * @param {!wtf.util.Options} options Options.
 * @param {Element=} opt_parentElement Element to display in.
 * @constructor
 * @implements {wtf.trace.ISessionListener}
 * @private
 */
wtf.hud.SessionListener_ = function(options, opt_parentElement) {
  /**
   * Options overrides.
   * @type {!wtf.util.Options}
   * @private
   */
  this.options_ = options;

  /**
   * Element to display in.
   * @type {Element}
   * @private
   */
  this.parentElement_ = opt_parentElement || null;
};


/**
 * @override
 */
wtf.hud.SessionListener_.prototype.sessionStarted = function(session) {
  // TODO(benvanik): check to ensure canvas is supported

  // Create overlay and add to the DOM.
  var overlay = new wtf.hud.Overlay(
      session, this.options_, this.parentElement_);
  wtf.hud.overlay_ = overlay;
};


/**
 * @override
 */
wtf.hud.SessionListener_.prototype.sessionStopped = function(session) {
  goog.dispose(wtf.hud.overlay_);
  wtf.hud.overlay_ = null;
};


/**
 * Shows the HUD, if it is hidden.
 */
wtf.hud.show = function() {
  var overlay = wtf.hud.overlay_;
  if (overlay) {
    overlay.show();
  }
};


/**
 * Hides the HUD, if it is shown.
 */
wtf.hud.hide = function() {
  var overlay = wtf.hud.overlay_;
  if (overlay) {
    overlay.hide();
  }
};


/**
 * Advances the HUD time.
 * @param {number=} opt_time New time. Prefer using {@see wtf#now}.
 */
wtf.hud.advance = function(opt_time) {
  var overlay = wtf.hud.overlay_;
  if (overlay) {
    overlay.advance(opt_time);
  }
};
