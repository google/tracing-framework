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
goog.require('wtf.trace.prepare');
goog.require('wtf.trace.util');
goog.require('wtf.util');


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
 * This will call {@see wtf.trace#prepare} if it has not already been called.
 *
 * @param {Object=} opt_options Options overrides.
 * @param {Element=} opt_parentElement Element to display in.
 */
wtf.hud.prepare = function(opt_options, opt_parentElement) {
  // Call prepare just in case.
  wtf.trace.prepare(opt_options);
  var traceManager = wtf.trace.getTraceManager();

  // Only one HUD per page.
  goog.dispose(wtf.hud.overlay_);
  wtf.hud.overlay_ = null;

  // Get combined options.
  var options = traceManager.getOptions(opt_options);

  // Run through providers and get any buttons/etc we need.
  var providers = traceManager.getProviders();
  for (var n = 0; n < providers.length; n++) {
    var provider = providers[n];
    var buttons = provider.getHudButtons();
    for (var m = 0; m < buttons.length; m++) {
      wtf.hud.buttons_.push(buttons[m]);
    }
  }

  // Add to DOM when it is ready.
  wtf.util.callWhenDomReady(wtf.trace.util.ignoreListener(function() {
    var listener = new wtf.hud.SessionListener_(options, opt_parentElement);
    wtf.trace.addSessionListener(listener);
  }));
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

  for (var n = 0; n < wtf.hud.buttons_.length; n++) {
    var info = wtf.hud.buttons_[n];
    overlay.insertButton(info);
  }
};


/**
 * @override
 */
wtf.hud.SessionListener_.prototype.sessionStopped = function(session) {
  goog.dispose(wtf.hud.overlay_);
  wtf.hud.overlay_ = null;
};


/**
 * @override
 */
wtf.hud.SessionListener_.prototype.requestSnapshots = goog.nullFunction;


/**
 * @override
 */
wtf.hud.SessionListener_.prototype.reset = goog.nullFunction;


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


/**
 * A list of buttons that have been added to the HUD.
 * This allows buttons to be registered before the HUD is shown and across
 * instantiations.
 * @type {!Array.<!wtf.hud.Overlay.ButtonInfo>}
 * @private
 */
wtf.hud.buttons_ = [];


/**
 * Adds a button to the overlay button bar.
 * @param {!wtf.hud.Overlay.ButtonInfo} info Button info.
 */
wtf.hud.addButton = function(info) {
  wtf.hud.buttons_.push(info);

  var overlay = wtf.hud.overlay_;
  if (overlay) {
    overlay.insertButton(info);
  }
};


/**
 * Sends a snapshot to a UI window.
 * @param {boolean=} opt_newWindow Force into a new window, otherwise an
 *     existing one will be used.
 */
wtf.hud.sendSnapshotToWindow = function(opt_newWindow) {
  var overlay = wtf.hud.overlay_;
  if (overlay) {
    overlay.sendSnapshot(opt_newWindow);
  }
};
