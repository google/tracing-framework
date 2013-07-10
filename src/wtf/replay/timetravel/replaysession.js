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

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.dom');
goog.require('goog.style');
goog.require('wtf.data.webidl');
goog.require('wtf.db.Database');
goog.require('wtf.db.EventIterator');
goog.require('wtf.db.UrlDataSourceInfo');
goog.require('wtf.db.sources.ChunkedDataSource');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.io.ReadTransport');
goog.require('wtf.io.cff.BinaryStreamSource');
goog.require('wtf.io.transports.XhrReadTransport');
goog.require('wtf.math.MersenneTwister');
goog.require('wtf.replay.timeTravel.Controller');
goog.require('wtf.ui.Dialog');
goog.require('wtf.ui.ErrorDialog');
goog.require('wtf.ui.ProgressDialog');
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
  var body = this.dom_.getDocument().body;
  goog.asserts.assert(body);
  /**
   * Popup controller UI.
   * @type {!wtf.replay.timeTravel.Controller}
   * @private
   */
  this.controller_ = new wtf.replay.timeTravel.Controller(
      body, this.dom_);
  this.registerDisposable(this.controller_);
};
goog.inherits(wtf.replay.timeTravel.ReplaySession, wtf.events.EventEmitter);


/**
 * Gets the global object of the target page.
 * The result of this should not be stored as it may change as the page reloads.
 * @return {!Window} Global object.
 */
wtf.replay.timeTravel.ReplaySession.prototype.getPageGlobal = function() {
  var opener = goog.global.opener;
  goog.asserts.assert(opener);
  return opener;
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

  this.loadDeferred_ = new goog.async.Deferred();

  // Create the data source.
  var sourceInfo = new wtf.db.UrlDataSourceInfo(
      this.databasePath_, '', this.databasePath_);
  var transport = new wtf.io.transports.XhrReadTransport(this.databasePath_);
  var streamSource = new wtf.io.cff.BinaryStreamSource(transport);
  var dataSource = new wtf.db.sources.ChunkedDataSource(
      db, sourceInfo, streamSource);
  db.addSource(dataSource);

  // Show the loading dialog.
  // Don't registerDisposable it so that we don't leak it.
  var body = this.dom_.getDocument().body;
  goog.asserts.assert(body);
  var progressDialog = new wtf.ui.ProgressDialog(
      body, 'Loading traces...', this.dom_);
  var task = new wtf.ui.ProgressDialog.Task(this.databasePath_);
  // Listen for transport progress events to update the task.
  transport.addListener(wtf.io.ReadTransport.EventType.PROGRESS,
      function(loaded, total) {
        task.setProgress(loaded, total);
      }, this);
  transport.addListener(wtf.io.ReadTransport.EventType.END, function() {
    // Switch into 'processing' mode.
    task.setStyle(wtf.ui.ProgressDialog.TaskStyle.SECONDARY);
  }, this);
  progressDialog.addTask(task);
  progressDialog.center();

  // Wait until the dialog is displayed.
  progressDialog.addListener(wtf.ui.Dialog.EventType.OPENED, function() {
    dataSource.start().chainDeferred(this.loadDeferred_);
  }, this);

  // Note: we track this in a deferred in case the load takes multiple stages.
  this.loadDeferred_.addCallbacks(
      function() {
        progressDialog.close(function() {
          // Load completed.
          // Reload the parent page now.
          this.getPageGlobal().location.reload();
        }, this);
      },
      function(e) {
        goog.dispose(progressDialog);

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
      !this.loadDeferred_.hasFired()) {
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
  var pageGlobal = this.getPageGlobal();
  var pageDom = goog.dom.getDomHelper(pageGlobal.document);
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
  // This should match what was done at recording time so that no events
  // we recorded will slip through.
  var allObjectNames = [
    'Document',
    'Window'
  ];
  goog.array.extend(allObjectNames, wtf.data.webidl.DOM_OBJECTS);
  var allEventTypes = wtf.data.webidl.getAllEventTypes(allObjectNames);

  // Exclude a few events.
  // Unload events will cause a confirm dialog to be displayed on reload.
  delete allEventTypes['beforeunload'];
  delete allEventTypes['unload'];

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
  for (var eventName in allEventTypes) {
    pageGlobal.addEventListener(eventName, eventDisabler, true);
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
      seed = Number(it.getArgument('value'));
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
