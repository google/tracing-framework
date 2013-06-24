/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Document view control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.DocumentView');

goog.require('goog.asserts');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('goog.events.EventType');
goog.require('goog.result');
goog.require('goog.soy');
goog.require('goog.string');
goog.require('goog.style');
goog.require('wtf.app.ui.AddonManager');
goog.require('wtf.app.ui.EmptyTabPanel');
goog.require('wtf.app.ui.HealthDialog');
goog.require('wtf.app.ui.Selection');
goog.require('wtf.app.ui.Statusbar');
goog.require('wtf.app.ui.Tabbar');
goog.require('wtf.app.ui.Toolbar');
goog.require('wtf.app.ui.documentview');
goog.require('wtf.app.ui.nav.Navbar');
goog.require('wtf.app.ui.query.QueryPanel');
goog.require('wtf.app.ui.tracks.TracksPanel');
goog.require('wtf.db.BlobDataSourceInfo');
goog.require('wtf.db.DriveDataSourceInfo');
goog.require('wtf.db.HealthInfo');
goog.require('wtf.db.Unit');
goog.require('wtf.db.UrlDataSourceInfo');
goog.require('wtf.events');
goog.require('wtf.events.EventType');
goog.require('wtf.events.KeyboardScope');
goog.require('wtf.io');
goog.require('wtf.io.Blob');
goog.require('wtf.io.drive');
goog.require('wtf.pal');
goog.require('wtf.ui.Control');
goog.require('wtf.ui.ErrorDialog');
goog.require('wtf.ui.ResizableControl');
goog.require('wtf.ui.Tooltip');



/**
 * Document view control.
 *
 * @param {!Element} parentElement Element to display in.
 * @param {!goog.dom.DomHelper} dom DOM helper.
 * @param {!wtf.doc.Document} doc Document.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.app.ui.DocumentView = function(parentElement, dom, doc) {
  goog.base(this, parentElement, dom);

  var db = doc.getDatabase();

  /**
   * Document.
   * @type {!wtf.doc.Document}
   * @private
   */
  this.document_ = doc;
  this.registerDisposable(this.document_);

  /**
   * Local view into the document.
   * @type {!wtf.doc.View}
   * @private
   */
  this.localView_ = doc.createView();

  /**
   * Selection state tracker.
   * @type {!wtf.app.ui.Selection}
   * @private
   */
  this.selection_ = new wtf.app.ui.Selection(doc.getDatabase());
  this.registerDisposable(this.selection_);

  /**
   * Database health information.
   * @type {!wtf.db.HealthInfo}
   * @private
   */
  this.healthInfo_ = new wtf.db.HealthInfo(db, null);

  // Rebuild health info.
  // We try to pass in our event statistics if we can (no filter).
  // Note that we bind this handler as early as possible so that we run before
  // other handlers setup by the UI.
  db.addListener(wtf.events.EventType.INVALIDATED, this.updateHealth_, this);
  this.updateHealth_();

  /**
   * Toolbar.
   * @type {!wtf.app.ui.Toolbar}
   * @private
   */
  this.toolbar_ = new wtf.app.ui.Toolbar(this, this.getChildElement(
      goog.getCssName('appUiDocumentViewToolbar')));
  this.registerDisposable(this.toolbar_);

  /**
   * Navigation bar.
   * @type {!wtf.app.ui.nav.Navbar}
   * @private
   */
  this.navbar_ = new wtf.app.ui.nav.Navbar(this, this.getChildElement(
      goog.getCssName('appUiDocumentViewInner')));
  this.registerDisposable(this.navbar_);

  /**
   * Tab bar.
   * @type {!wtf.app.ui.Tabbar}
   * @private
   */
  this.tabbar_ = new wtf.app.ui.Tabbar(this, this.getChildElement(
      goog.getCssName('appUiDocumentViewInner')));
  this.registerDisposable(this.tabbar_);

  /**
   * Statusbar.
   * @type {!wtf.app.ui.Statusbar}
   * @private
   */
  this.statusbar_ = new wtf.app.ui.Statusbar(this, this.getChildElement(
      goog.getCssName('appUiDocumentViewStatusbar')));
  this.registerDisposable(this.statusbar_);

  /**
   * Extension manager.
   * @type {!wtf.app.ui.AddonManager}
   * @private
   */
  this.extensionManager_ = new wtf.app.ui.AddonManager(this);
  this.registerDisposable(this.extensionManager_);

  // Relayout as required.
  var vsm = goog.dom.ViewportSizeMonitor.getInstanceForWindow();
  this.getHandler().listen(
      vsm, goog.events.EventType.RESIZE, this.layout, false);
  this.navbar_.addListener(
      wtf.ui.ResizableControl.EventType.SIZE_CHANGED,
      this.layout, this);

  this.tabbar_.addPanel(new wtf.app.ui.tracks.TracksPanel(this));
  this.tabbar_.addPanel(new wtf.app.ui.query.QueryPanel(this));
  this.tabbar_.addPanel(new wtf.app.ui.EmptyTabPanel(
      this, 'console', 'Console'));

  this.setupCommands_();
  this.setupKeyboardShortcuts_();

  // Zoom to fit when the database changes.
  // This should be changed to track the most recent events if streaming.
  db.addListener(
      wtf.events.EventType.INVALIDATED, this.databaseInvalidated_, this);
  this.databaseInvalidated_();
};
goog.inherits(wtf.app.ui.DocumentView, wtf.ui.Control);


/**
 * @override
 */
wtf.app.ui.DocumentView.prototype.disposeInternal = function() {
  var commandManager = wtf.events.getCommandManager();
  commandManager.unregisterCommand('save_local_trace');
  commandManager.unregisterCommand('save_drive_trace');
  commandManager.unregisterCommand('view_trace_health');
  commandManager.unregisterCommand('navigate');
  commandManager.unregisterCommand('select_all');
  commandManager.unregisterCommand('select_visible');
  commandManager.unregisterCommand('select_range');
  commandManager.unregisterCommand('goto_range');
  commandManager.unregisterCommand('goto_mark');
  commandManager.unregisterCommand('goto_frame');
  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.app.ui.DocumentView.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.documentview.control, undefined, undefined, dom));
};


/**
 * Sets up global commands.
 * @private
 */
wtf.app.ui.DocumentView.prototype.setupCommands_ = function() {
  var db = this.getDatabase();
  var view = this.localView_;
  var selection = this.selection_;

  var commandManager = wtf.events.getCommandManager();

  commandManager.registerSimpleCommand(
      'save_local_trace', this.saveLocalTrace_, this);
  commandManager.registerSimpleCommand(
      'save_drive_trace', this.saveDriveTrace_, this);

  commandManager.registerSimpleCommand(
      'view_trace_health', function() {
        var body = this.getDom().getDocument().body;
        goog.asserts.assert(body);
        this.activeDialog_ = new wtf.app.ui.HealthDialog(
            db,
            this.healthInfo_,
            body,
            this.getDom());
      }, this);

  commandManager.registerSimpleCommand(
      'navigate', function(source, target, path) {
        this.tabbar_.navigate(path);
      }, this);

  commandManager.registerSimpleCommand(
      'select_all', function() {
        selection.clearTimeRange();
      }, this);

  commandManager.registerSimpleCommand(
      'select_visible', function() {
        selection.setTimeRange(
            this.localView_.getVisibleTimeStart(),
            this.localView_.getVisibleTimeEnd());
      }, this);

  commandManager.registerSimpleCommand(
      'select_range', function(source, target, startTime, endTime) {
        selection.setTimeRange(startTime, endTime);
      }, this);

  commandManager.registerSimpleCommand(
      'goto_range', function(source, target, timeStart, timeEnd,
          opt_immediate) {
        var firstEventTime = db.getFirstEventTime();
        var pad = (timeEnd - timeStart) * 0.05;
        view.setVisibleRange(
            timeStart - pad,
            timeEnd + pad,
            opt_immediate);

        wtf.ui.Tooltip.hideAll();
      }, this);

  commandManager.registerSimpleCommand(
      'goto_mark', function(source, target, mark) {
        // Go to mark event.
        var timeStart = mark.getTime();
        var timeEnd = mark.getEndTime();
        commandManager.execute('goto_range', this, null, timeStart, timeEnd);
      }, this);

  commandManager.registerSimpleCommand(
      'goto_frame', function(source, target, frameOrNumber) {
        var frame = null;
        if (goog.isNumber(frameOrNumber)) {
          // Find a frame list with frames in it.
          var frameList = db.getFirstFrameList();
          if (!frameList) {
            return;
          }

          // Find frame.
          frame = frameList.getFrame(frameOrNumber);
        } else {
          frame = /** @type {!wtf.db.Frame} */ (frameOrNumber);
        }
        if (!frame) {
          return;
        }

        // Go to frame.
        var timeStart = frame.getTime();
        var timeEnd = frame.getEndTime();
        commandManager.execute('goto_range', this, null, timeStart, timeEnd);
      }, this);
};


/**
 * Sets up some simple keyboard shortcuts.
 * @private
 */
wtf.app.ui.DocumentView.prototype.setupKeyboardShortcuts_ = function() {
  var db = this.getDatabase();
  var view = this.localView_;
  var selection = this.selection_;

  var dom = this.getDom();
  var commandManager = wtf.events.getCommandManager();
  var keyboard = wtf.events.getWindowKeyboard(dom);
  var keyboardScope = new wtf.events.KeyboardScope(keyboard);
  this.registerDisposable(keyboardScope);

  keyboardScope.addShortcut('home', function() {
    var firstEventTime = db.getFirstEventTime();
    var lastEventTime = db.getLastEventTime();
    commandManager.execute('goto_range', this, null,
        firstEventTime, lastEventTime);
  }, this);

  keyboardScope.addShortcut('command+a', function() {
    commandManager.execute('select_all', this, null);
  });
  keyboardScope.addShortcut('command+shift+a', function() {
    commandManager.execute('select_visible', this, null);
  });

  keyboardScope.addShortcut('command+g', function() {
    // TODO(benvanik): make this a fancy dialog that allows frame/marker/etc
    //     selection. window.prompt is prohibited in apps, too.
    var result;
    try {
      keyboard.suspend();
      result = goog.global.prompt('Frame number:');
    } finally {
      keyboard.resume();
    }
    if (!result) {
      return;
    }
    result = goog.string.toNumber(result);
    if (isNaN(result)) {
      return;
    }

    commandManager.execute('goto_frame', this, null, result);
  }, this);
};


/**
 * Gets the document this is a view of.
 * @return {!wtf.doc.Document} Document.
 */
wtf.app.ui.DocumentView.prototype.getDocument = function() {
  return this.document_;
};


/**
 * Gets the database of the active document.
 * @return {!wtf.db.Database} Event database.
 */
wtf.app.ui.DocumentView.prototype.getDatabase = function() {
  return this.document_.getDatabase();
};


/**
 * Gets the local view.
 * @return {!wtf.doc.View} Local view.
 */
wtf.app.ui.DocumentView.prototype.getLocalView = function() {
  return this.localView_;
};


/**
 * Gets the selection state object for the view.
 * @return {!wtf.app.ui.Selection} Selection state.
 */
wtf.app.ui.DocumentView.prototype.getSelection = function() {
  return this.selection_;
};


/**
 * Gets the database health information.
 * @return {!wtf.db.HealthInfo} Health information.
 */
wtf.app.ui.DocumentView.prototype.getHealthInfo = function() {
  return this.healthInfo_;
};


/**
 * Gets the tab bar.
 * @return {!wtf.app.ui.Tabbar} Tab bar.
 */
wtf.app.ui.DocumentView.prototype.getTabbar = function() {
  return this.tabbar_;
};


/**
 * Updates health information on database change.
 * @private
 */
wtf.app.ui.DocumentView.prototype.updateHealth_ = function() {
  var db = this.getDatabase();

  // Get the stats table used for health info, but only if the database has
  // useful information.
  var statsTable = null;
  if (db.getUnits() == wtf.db.Unit.TIME_MILLISECONDS) {
    statsTable = this.selection_.getFullStatistics();
  }

  this.healthInfo_ = new wtf.db.HealthInfo(db, statsTable);
};


/**
 * Handles database invalidation.
 * @private
 */
wtf.app.ui.DocumentView.prototype.databaseInvalidated_ = function() {
  var db = this.getDatabase();
  var firstEventTime = db.getFirstEventTime();
  var lastEventTime = db.getLastEventTime();
  this.localView_.setVisibleRange(firstEventTime, lastEventTime, true);
};


/**
 * @override
 */
wtf.app.ui.DocumentView.prototype.layoutInternal = function() {
  // Update the tabbar with the latest size.
  var currentSize = goog.style.getSize(
      this.getChildElement(goog.getCssName('appUiDocumentViewInner')));
  var tabbarHeight = currentSize.height - this.navbar_.getSplitterSize();
  goog.style.setHeight(this.tabbar_.getRootElement(), tabbarHeight);

  // Reset limits and keep the splitter above the fold when resizing the window.
  var navbarMinHeight = this.navbar_.getMinimumSize();
  var navbarMaxHeight = wtf.app.ui.nav.Navbar.MAX_HEIGHT;
  this.navbar_.setSplitterLimits(
      navbarMinHeight, Math.min(navbarMaxHeight, currentSize.height));
  if (this.navbar_.getSplitterSize() > currentSize.height - navbarMinHeight) {
    this.navbar_.setSplitterSize(
        Math.max(navbarMinHeight, currentSize.height - navbarMinHeight));
  }

  this.navbar_.layout();
  this.tabbar_.layout();
};


/**
 * Navigates to the given panel path.
 * @param {string} path Panel path.
 */
wtf.app.ui.DocumentView.prototype.navigate = function(path) {
  this.tabbar_.navigate(path);
};


/**
 * Zooms the local view to fit the data.
 */
wtf.app.ui.DocumentView.prototype.zoomToFit = function() {
  var db = this.getDatabase();
  var firstEventTime = db.getFirstEventTime();
  var lastEventTime = db.getLastEventTime();
  if (!lastEventTime) {
    return;
  }

  var commandManager = wtf.events.getCommandManager();
  commandManager.execute('goto_range', this, null,
      firstEventTime, lastEventTime, true);
};


/**
 * Saves the current trace document, if any.
 * @private
 */
wtf.app.ui.DocumentView.prototype.saveLocalTrace_ = function() {
  var doc = this.getDocument();
  var sources = doc.getDatabase().getSources();
  if (!sources.length) {
    return;
  }

  _gaq.push(['_trackEvent', 'app', 'save_trace', null]);

  var platform = wtf.pal.getPlatform();
  for (var n = 0; n < sources.length; n++) {
    var source = sources[n];
    var sourceInfo = source.getInfo();

    // Try to use the original filename, or pick a random one.
    var rawFilename = sourceInfo.filename;
    var lastForwardSlash = rawFilename.lastIndexOf('/');
    var lastBackSlash = rawFilename.lastIndexOf('\\');
    var lastSlash = Math.max(lastForwardSlash, lastBackSlash);
    var filename = null;
    if (lastSlash != -1) {
      filename = rawFilename.substr(lastSlash + 1);
    } else {
      filename = rawFilename;
    }
    if (!filename || !filename.length) {
      // Get full filename with date/etc.
      var contextInfo = source.getContextInfo();
      filename = wtf.io.getTimedFilename(
          '', contextInfo.getFilename(), sourceInfo.contentType);
    }

    // Begin fetching data or download it directly.
    if (sourceInfo instanceof wtf.db.BlobDataSourceInfo) {
      // Download directly.
      platform.writeBinaryFile(
          filename,
          wtf.io.Blob.toNative(sourceInfo.blob),
          sourceInfo.contentType);
    } else if (sourceInfo instanceof wtf.db.DriveDataSourceInfo) {
      // Drive fetch the target.
      goog.result.wait(wtf.io.drive.downloadFile(sourceInfo.driveFile),
          goog.partial(sendXhrDownload, filename, sourceInfo.contentType),
          this);
    } else if (sourceInfo instanceof wtf.db.UrlDataSourceInfo) {
      // XHR fetch the target.
      var xhr = new XMLHttpRequest();
      xhr.open('GET', sourceInfo.url, true);
      sendXhrDownload(filename, sourceInfo.contentType, xhr);
    } else {
      // Unknown - ignore.
      continue;
    }
  }

  var self = this;
  function sendXhrDownload(filename, contentType, xhr) {
    if (!(xhr instanceof XMLHttpRequest)) {
      xhr = xhr.getValue();
    }
    xhr.responseType = 'blob';
    xhr.onload = function() {
      platform.writeBinaryFile(
          filename, xhr.response, contentType);
    };
    xhr.onerror = function() {
      wtf.ui.ErrorDialog.show(
          'Unable to download',
          'A trace file could not be redownloaded for saving.',
          self.getDom());
    };
    xhr.send();
  };
};


/**
 * Saves the current trace document to Drive, if any.
 * @private
 */
wtf.app.ui.DocumentView.prototype.saveDriveTrace_ = function() {
  if (!wtf.io.drive.isSupported()) {
    wtf.ui.ErrorDialog.show(
        'Drive support not enabled',
        'Drive is not supported in this build.',
        this.getDom());
    return;
  }

  _gaq.push(['_trackEvent', 'app', 'save_drive_trace']);

  // TODO(benvanik): save to drive.
  wtf.ui.ErrorDialog.show(
      'Drive saving not implemented',
      'Sorry, this isn\'t implemented yet!',
      this.getDom());
};
