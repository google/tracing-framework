/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Replay session.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.replay.timeTravel.ReplaySession');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.dom');
goog.require('goog.style');
goog.require('wtf.data.webidl');
goog.require('wtf.db.Database');
goog.require('wtf.db.EventIterator');
goog.require('wtf.math.MersenneTwister');
goog.require('wtf.replay.timeTravel.Controller');
goog.require('wtf.ui.ErrorDialog');
goog.require('wtf.util');
goog.require('wtf.util.Options');



/**
 * The local in-page replay session.
 * This manages initialization of replay, the stubbing/replacement of objects,
 * and drives replay.
 *
 * @param {string} databasePath Path or URL to the WTF trace file.
 * @param {Object=} opt_options Replay options.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.replay.timeTravel.ReplaySession = function(databasePath, opt_options) {
  goog.base(this);

  /**
   * DOM helper.
   * @type {!goog.dom.DomHelper}
   * @private
   */
  this.dom_ = goog.dom.getDomHelper();

  /**
   * Database path.
   * @type {string}
   * @private
   */
  this.databasePath_ = databasePath;

  /**
   * Initial startup options, used for comparing reuse.
   * @type {!Object}
   * @private
   */
  this.initialOptions_ = opt_options || {};

  /**
   * Options.
   * @type {!wtf.util.Options}
   * @private
   */
  this.options_ = new wtf.util.Options();
  if (opt_options) {
    this.options_.mixin(opt_options);
  }

  /**
   * Event database.
   * Upon initial creation it is empty and a load must be performed.
   * @type {!wtf.db.Database}
   * @private
   */
  this.db_ = new wtf.db.Database();
  this.registerDisposable(this.db_);

  /**
   * A deferred that will be set with the load result.
   * @type {goog.async.Deferred}
   * @private
   */
  this.loadDeferred_ = null;

  // TODO(benvanik): remove UI from core bits?
  /**
   * Popup controller UI.
   * @type {!wtf.replay.timeTravel.Controller}
   * @private
   */
  this.controller_ = new wtf.replay.timeTravel.Controller(
      this.dom_.getDocument().body, this.dom_);
  this.registerDisposable(this.controller_);
};
goog.inherits(wtf.replay.timeTravel.ReplaySession, goog.Disposable);


/**
 * Gets the global object of the target page.
 * The result of this should not be stored as it may change as the page reloads.
 * @return {!Window} Global object.
 */
wtf.replay.timeTravel.ReplaySession.prototype.getPageGlobal = function() {
  return goog.global.opener;
};


/**
 * Checks whether the given options match the session enough for reuse.
 * If they differ the session is not suitable for reuse and should be recreated
 * with the new options.
 * @param {string} databasePath Path or URL to the WTF trace file.
 * @param {Object=} opt_options Replay options.
 * @return {boolean} True if the session can be reused.
 */
wtf.replay.timeTravel.ReplaySession.prototype.canReuse = function(
    databasePath, opt_options) {
  if (databasePath != this.databasePath_) {
    return false;
  }
  // NOTE: this comparison is ultra bad, but good enough for now.
  if (goog.global.JSON.stringify(this.initialOptions_) !=
      goog.global.JSON.stringify(opt_options || {})) {
    return false;
  }
  return true;
};


/**
 * Prepares the session for first use.
 * This presumes that we haven't loaded the database and will be reloading the
 * target page when done.
 */
wtf.replay.timeTravel.ReplaySession.prototype.prepareFirstUse = function() {
  var db = this.db_;

  goog.asserts.assert(!this.loadDeferred_);
  if (this.loadDeferred_) {
    throw new Error('Attempting to prepare an existing session for first use.');
  }

  var deferred = new goog.async.Deferred();
  this.loadDeferred_ = deferred;

  // TODO(benvanik): use progress dialog once the cff branch is merged in.

  // Start loading the database. That's all we can really do right now.
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    db.addBinarySource(new Uint8Array(xhr.response));
    deferred.callback();
  };
  xhr.onerror = function() {
    deferred.errback(new Error('Unable to fetch database: ' + xhr.statusText));
  };
  xhr.responseType = 'arraybuffer';
  xhr.open('GET', this.databasePath_, true);
  xhr.send();

  // Note: we track this in a deferred in case the load takes multiple stages.
  this.loadDeferred_.addCallbacks(
      function() {
        // Load completed.
        // Reload the parent page now.
        goog.global.opener.location.reload();
      },
      function(e) {
        // Failed to load. That's not good.
        wtf.ui.ErrorDialog.show(
            'Unable to load trace.',
            e.toString(),
            this.dom_);
      }, this);
};


/**
 * Prepares the session for reuse.
 * We should already have a loaded database and just need to instrument
 * the page.
 */
wtf.replay.timeTravel.ReplaySession.prototype.prepareReuse = function() {
  goog.asserts.assert(this.loadDeferred_);
  goog.asserts.assert(this.loadDeferred_.hasFired());
  if (!this.loadDeferred_ ||
      !this.loadDeferred_.hasFired() ||
      this.loadDeferred_.isError()) {
    throw new Error('Attempting to reuse an unprepared session.');
  }

  // Attempt to disable events.
  this.neuterPageEvents_();

  // Setup random.
  this.initializeRandom_();

  // Setup Date.
  this.injectDate_();
};


/**
 * Attempts to shield the page from any user input by capturing and disabling
 * events and blocking input via overlays.
 * @private
 */
wtf.replay.timeTravel.ReplaySession.prototype.neuterPageEvents_ = function() {
  var pageDom = goog.dom.getDomHelper(this.getPageGlobal().document);
  var pageDocument = pageDom.getDocument();

  // Add an overlay to the page to attempt to block events before they reach
  // page code. This prevents hover events/etc.
  // Note that the page has to be ready for this.
  wtf.util.callWhenDomReady(function() {
    var pageOverlay = pageDom.createElement('div');
    goog.style.setStyle(pageOverlay, {
      'background-color': 'rgba(255,255,255,0.0001)',
      'z-index': 99999,
      'position': 'absolute',
      'left': 0,
      'top': 0,
      'right': 0,
      'bottom': 0
    });
    pageDocument.body.appendChild(pageOverlay);
  }, this, pageDocument);

  // We also add capturing handlers for events so that we can prevent them.
  var eventTypes = wtf.data.webidl.getAllEvents('Document');
  function eventDisabler(e) {
    // Allow our events to pass through.
    if (e['__wtf_dispatched__']) {
      return;
    }
    // Die die die.
    e.preventDefault();
    e.stopPropagation();
    return false;
  };
  for (var eventName in eventTypes) {
    pageDocument.addEventListener(eventName, eventDisabler, true);
  }
};


/**
 * Initializes the Math.random replacement.
 * This should be called at the start of each new session.
 * It'll search through the database to find the recorded seed and then replace
 * the Math.random on the target page with the deterministic version.
 * @private
 */
wtf.replay.timeTravel.ReplaySession.prototype.initializeRandom_ = function() {
  var pageGlobal = this.getPageGlobal();

  // Find the seed.
  var zone = this.db_.getDefaultZone();
  var queryResult = zone.query('/wtf.replay#randomSeed/');
  var disableRandom = false;
  var seed = 0;
  if (!queryResult) {
    disableRandom = true;
  } else {
    var it = queryResult.getValue();
    if (!it ||
        !(it instanceof wtf.db.EventIterator) ||
        !it.getCount()) {
      disableRandom = true;
    } else {
      // Found (at least one). Use the first.
      seed = it.getArgument('value');
    }
  }

  if (disableRandom) {
    // No seed found, so just disable the RNG.
    pageGlobal['Math']['random'] = function disabledRandom() {
      throw new Error('Original page didn\'t use random so it\'s disabled.');
    };
    return;
  }

  // Initialize a deterministic random number generator.
  var rng = new wtf.math.MersenneTwister(seed);

  // Swap out random with our version.
  pageGlobal['Math']['random'] = function deterministicRandom() {
    return rng.random();
  };
};


/**
 * Injects Date functions to consume database date events instead.
 * @private
 */
wtf.replay.timeTravel.ReplaySession.prototype.injectDate_ = function() {
  // TODO(benvanik): advanceTime/Date replacement/etc.
};
