/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Document loader utility.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.Loader');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.result');
goog.require('goog.string');
goog.require('wtf.db.BlobDataSourceInfo');
goog.require('wtf.db.Database');
goog.require('wtf.db.DriveDataSourceInfo');
goog.require('wtf.db.UrlDataSourceInfo');
goog.require('wtf.db.sources.CallsDataSource');
goog.require('wtf.db.sources.ChunkedDataSource');
goog.require('wtf.db.sources.CpuProfileDataSource');
goog.require('wtf.doc.Document');
goog.require('wtf.io');
goog.require('wtf.io.Blob');
goog.require('wtf.io.ReadTransport');
goog.require('wtf.io.cff.BinaryStreamSource');
goog.require('wtf.io.cff.JsonStreamSource');
goog.require('wtf.io.drive');
goog.require('wtf.io.transports.BlobReadTransport');
goog.require('wtf.io.transports.XhrReadTransport');
goog.require('wtf.pal');
goog.require('wtf.timing');
goog.require('wtf.ui.Dialog');
goog.require('wtf.ui.ErrorDialog');
goog.require('wtf.ui.ProgressDialog');



/**
 * Handles all trace loading behavior.
 * @param {!wtf.app.MainDisplay} mainDisplay Main display.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.app.Loader = function(mainDisplay) {
  goog.base(this);

  /**
   * DOM helper.
   * @type {!goog.dom.DomHelper}
   * @private
   */
  this.dom_ = mainDisplay.getDom();

  /**
   * Owning main display.
   * @type {!wtf.app.MainDisplay}
   * @private
   */
  this.mainDisplay_ = mainDisplay;

  /**
   * Progress dialog, if it is displayed.
   * @type {wtf.ui.ProgressDialog}
   * @private
   */
  this.progressDialog_ = null;

  if (wtf.io.drive.isSupported()) {
    wtf.io.drive.prepare();
  }
};
goog.inherits(wtf.app.Loader, goog.Disposable);


/**
 * @override
 */
wtf.app.Loader.prototype.disposeInternal = function() {
  // TODO(benvanik): abort any in-progress loads.
  goog.dispose(this.progressDialog_);
  goog.base(this, 'disposeInternal');
};


/**
 * Attempts to guess the content type of the file entry by filename.
 * @param {string} filename Filename (or URL).
 * @return {string} Content type.
 * @private
 */
wtf.app.Loader.prototype.inferContentType_ = function(filename) {
  if (goog.string.endsWith(filename, '.wtf-trace') ||
      goog.string.endsWith(filename, '.bin.part')) {
    return 'application/x-extension-wtf-trace';
  } else if (goog.string.endsWith(filename, '.wtf-json')) {
    return 'application/x-extension-wtf-json';
  } else if (goog.string.endsWith(filename, '.wtf-calls')) {
    return 'application/x-extension-wtf-calls';
  } else if (goog.string.endsWith(filename, '.cpuprofile')) {
    return 'application/x-extension-cpuprofile';
  }
  // Default. Maybe we should just return null.
  return 'application/x-extension-wtf-trace';
};


/**
 * Begins loading snapshot data from an incoming IPC command.
 * See the extension.js file in the injector for details about the command.
 * @param {!Object} data Command data.
 */
wtf.app.Loader.prototype.loadSnapshot = function(data) {
  var contentLength = data['content_length'];
  _gaq.push(['_trackEvent', 'app', 'open_snapshot', null, contentLength]);

  // Build entries.
  // Note that the command may contain either buffers or URLs.
  var contentTypes = data['content_types'];
  var contentSources = data['content_sources'];
  var contentBuffers = data['content_buffers'];
  var contentUrls = data['content_urls'];
  goog.asserts.assert(contentTypes.length == contentSources.length);
  var sourceInfos = [];
  for (var n = 0; n < contentTypes.length; n++) {
    if (contentBuffers) {
      // Incoming arrays may be in many forms.
      // We may want to check content type and only string->[] if it's actually
      // encoded binary.
      var buffer = null;
      if (goog.isArray(contentBuffers[n])) {
        buffer = wtf.io.createByteArrayFromArray(contentBuffers[n]);
      } else if (goog.isString(contentBuffers[n])) {
        buffer = wtf.io.stringToNewByteArray(contentBuffers[n]);
      } else {
        buffer = contentBuffers[n];
      }
      var blob = null;
      if (buffer instanceof Blob) {
        blob = wtf.io.Blob.fromNative(buffer);
      } else {
        blob = wtf.io.Blob.create([buffer]);
      }
      sourceInfos.push(new wtf.db.BlobDataSourceInfo(
          contentSources[n], contentTypes[n], blob));
    } else {
      sourceInfos.push(new wtf.db.UrlDataSourceInfo(
          contentSources[n], contentTypes[n], contentUrls[n]));
    }
  }

  this.loadDataSources_(sourceInfos);
};


/**
 * Requests a local open dialog.
 * The user may cancel the dialog, in which case no load will occur.
 * @param {function(this:T)=} opt_selectCallback Function to call when a
 *     file is selected. There's no cancellation notice.
 * @param {T=} opt_scope Callback scope.
 * @template T
 */
wtf.app.Loader.prototype.requestLocalOpenDialog = function(
    opt_selectCallback, opt_scope) {
  var inputElement = this.dom_.createElement(goog.dom.TagName.INPUT);
  inputElement['type'] = 'file';
  inputElement['multiple'] = true;
  inputElement['accept'] = [
    '.wtf-trace,application/x-extension-wtf-trace',
    '.wtf-json,application/x-extension-wtf-json',
    '.wtf-calls,application/x-extension-wtf-calls',
    '.cpuprofile,application/x-extension-cpuprofile',
    '.part,application/x-extension-part'
  ].join(',');
  goog.events.listenOnce(inputElement, goog.events.EventType.CHANGE,
      function(e) {
        if (opt_selectCallback) {
          opt_selectCallback.call(opt_scope);
        }
        _gaq.push(['_trackEvent', 'app', 'open_local_files']);
        this.loadFiles(inputElement.files);
      }, false, this);
  inputElement.click();
};


/**
 * Requests a Drive open dialog.
 * The user may cancel the dialog, in which case no load will occur.
 * @param {function(this:T)=} opt_cancelCallback Function to call when the
 *     dialog is cancelled by the user.
 * @param {T=} opt_scope Callback scope.
 * @template T
 */
wtf.app.Loader.prototype.requestDriveOpenDialog = function(
    opt_cancelCallback, opt_scope) {
  if (!wtf.io.drive.isSupported()) {
    wtf.ui.ErrorDialog.show(
        'Drive support not enabled',
        'Drive is not supported in this build.',
        this.dom_);
    if (opt_cancelCallback) {
      opt_cancelCallback.call(opt_scope);
    }
    return;
  }

  goog.result.wait(wtf.io.drive.showFilePicker({
    title: 'Select a trace file'
  }), function(filesResult) {
    var files = /** @type {Array.<!File>} */ (filesResult.getValue());
    if (!files || !files.length) {
      // Cancelled.
      if (opt_cancelCallback) {
        opt_cancelCallback.call(opt_scope);
      }
      return;
    }

    _gaq.push(['_trackEvent', 'app', 'open_drive_files']);

    var sourceInfos = [];
    var errors = [];
    var remaining = files.length;
    goog.array.forEach(files, function(file) {
      var filename = file[0];
      var fileId = file[1];
      var contentType = this.inferContentType_(filename);

      // This call will kick off a bunch of API calls to get file metadata/etc.
      goog.result.wait(wtf.io.drive.queryFile(fileId), function(result) {
        remaining--;
        var driveFile =
            /** @type {wtf.io.drive.DriveFile} */ (result.getValue());
        if (driveFile) {
          sourceInfos.push(new wtf.db.DriveDataSourceInfo(
              driveFile.filename, contentType, fileId, driveFile));
        } else {
          errors.push(result.getError());
        }
        if (!remaining) {
          finished.call(this);
        }
      }, this);
    }, this);

    /**
     * @this {wtf.app.Loader}
     */
    function finished() {
      if (errors.length) {
        // TODO(benvanik): log errors?
        this.loadFailed_(
            'Unable to load files',
            'An error occurred while trying to fetch a file from Drive.',
            true);
        return;
      }

      this.loadDataSources_(sourceInfos);
    };
  }, this);
};


/**
 * Begins loading a set of HTML5 File objects.
 * These can be from the filesystem, dragged in, etc.
 * @param {!Array.<!File>} files File objects.
 */
wtf.app.Loader.prototype.loadFiles = function(files) {
  var sourceInfos = [];
  for (var n = 0; n < files.length; n++) {
    var filename = files[n].name;
    var contentType = this.inferContentType_(filename);
    sourceInfos.push(new wtf.db.BlobDataSourceInfo(
        filename, contentType, wtf.io.Blob.fromNative(files[n])));
  }
  this.loadDataSources_(sourceInfos);
};


/**
 * Begins loading a set of files from URLs.
 * @param {!Array.<string>} urls URLs.
 */
wtf.app.Loader.prototype.loadUrls = function(urls) {
  var sourceInfos = [];
  for (var n = 0; n < urls.length; n++) {
    var url = urls[n];
    var contentType = this.inferContentType_(url);
    sourceInfos.push(new wtf.db.UrlDataSourceInfo(
        url, contentType, url));
  }
  this.loadDataSources_(sourceInfos);
};


/**
 * Begins loading the data sources and handles their async completion.
 * @param {!Array.<!wtf.db.DataSourceInfo>} sourceInfos Source infos.
 * @param {string=} opt_title Optional override for the app title. If omitted
 *     the title will be inferred from the entries.
 * @private
 */
wtf.app.Loader.prototype.loadDataSources_ = function(
    sourceInfos, opt_title) {
  // If we are already loading, ignore.
  // This prevents multiple drops.
  if (this.progressDialog_) {
    return;
  }

  // Close the old document.
  this.mainDisplay_.setDocumentView(null, true);

  // Create the document.
  var doc = new wtf.doc.Document(wtf.pal.getPlatform());
  var db = doc.getDatabase();

  // Show error dialogs.
  db.addListener(wtf.db.Database.EventType.SOURCE_ERROR,
      function(source, message, opt_detail) {
        goog.global.console.log(message, opt_detail);
        wtf.ui.ErrorDialog.show(message, opt_detail, this.dom_);
        _gaq.push(['_trackEvent', 'app', 'source_error', message]);
      }, this);

  // TODO(benvanik): avoid showing the loading dialog for small traces.

  // Show the loading dialog.
  // Don't registerDisposable it so that we don't leak it.
  var body = this.dom_.getDocument().body;
  goog.asserts.assert(body);
  this.progressDialog_ = new wtf.ui.ProgressDialog(
      body, 'Loading traces...', this.dom_);

  // Create entries for each source and the data source itself.
  // Note that these are handled async and make take some time to setup
  // (file system ops/Drive API calls/etc).
  var entries = [];
  for (var n = 0; n < sourceInfos.length; n++) {
    // Create the entry.
    var entry = new wtf.app.Loader.Entry_(sourceInfos[n]);
    entries.push(entry);
    this.progressDialog_.addTask(entry.task);
  }

  // Wait until the dialog is displayed.
  this.progressDialog_.addListener(wtf.ui.Dialog.EventType.OPENED, function() {
    // Each entry must be loaded serially since each trace might be injecting
    // into its own zone, e.g. with workers.
    var deferred = new goog.async.Deferred();
    goog.array.map(entries, function(entry) {
      deferred.addCallback(function() {
        return entry.start(db);
      });
    });

    deferred.addCallbacks(
        function() {
          this.loadSucceeded_(doc, entries, opt_title);
        },
        function(args) {
          this.loadFailed_(
              'Unable to load snapshot',
              'Source files could not be fetched.',
              false);
        }, this);
    deferred.callback(true);
  }, this);
};


/**
 * Calculates a title name from the given entries.
 * @param {!Array.<!wtf.app.Loader.Entry_>} entries Entries.
 * @return {string} New title string.
 * @private
 */
wtf.app.Loader.prototype.generateTitleFromEntries_ = function(entries) {
  var title = '';
  for (var n = 0; n < entries.length; n++) {
    var sourceInfo = entries[n].sourceInfo;
    var filename = sourceInfo.filename;
    var lastSlash = filename.lastIndexOf('/');
    if (lastSlash != -1) {
      filename = filename.substr(lastSlash + 1);
    }
    title += filename;
  }
  return title;
};


/**
 * Handles successful loads.
 * @param {!wtf.doc.Document} doc Document.
 * @param {!Array.<!wtf.app.Loader.Entry_>} entries Loader entries.
 * @param {string=} opt_title Optional override for the app title. If omitted
 *     the title will be inferred from the entries.
 * @private
 */
wtf.app.Loader.prototype.loadSucceeded_ = function(doc, entries, opt_title) {
  _gaq.push(['_trackEvent', 'app', 'open_files', null]);

  // Close the progress dialog.
  if (this.progressDialog_) {
    this.progressDialog_.close(finishLoad, this);
  } else {
    finishLoad.call(this);
  }
  this.progressDialog_ = null;

  // This is called after the dialog has closed to give it a chance to animate
  // out.
  function finishLoad() {
    // Pick a title, unless one was specified.
    var title = opt_title || this.generateTitleFromEntries_(entries);
    this.mainDisplay_.setTitle(title);

    // Show the document.
    var documentView = this.mainDisplay_.openDocument(doc);
    goog.asserts.assert(documentView);

    // Zoom to fit.
    // TODO(benvanik): remove setTimeout when zoomToFit is based on view.
    wtf.timing.setTimeout(50, function() {
      documentView.zoomToFit();
    }, this);
  };
};


/**
 * Handles load failures.
 * @param {string} title Error title.
 * @param {string} message Error message/details.
 * @param {boolean} showDialog Whether to show the error dialog.
 * @private
 */
wtf.app.Loader.prototype.loadFailed_ = function(title, message, showDialog) {
  _gaq.push(['_trackEvent', 'app', 'load_failed', title]);

  // Close the progress dialog.
  goog.dispose(this.progressDialog_);
  this.progressDialog_ = null;

  if (showDialog) {
    // Let them know we failed.
    wtf.ui.ErrorDialog.show(title, message, this.dom_);
  }
};



/**
 * A data source loader entry.
 * Tracks progress and allows for completion events.
 * @param {!wtf.db.DataSourceInfo} sourceInfo Data source info.
 * @constructor
 * @private
 */
wtf.app.Loader.Entry_ = function(sourceInfo) {
  /**
   * Data source info.
   * @type {!wtf.db.DataSourceInfo}
   */
  this.sourceInfo = sourceInfo;

  /**
   * Progress dialog task.
   * Used to update the dialog with the latest status.
   * @type {!wtf.ui.ProgressDialog.Task}
   */
  this.task = new wtf.ui.ProgressDialog.Task(sourceInfo.filename);

  /**
   * Data source.
   * @type {wtf.db.DataSource}
   */
  this.source = null;

  /**
   * A deferred waiting for the transport to be setup.
   * {@see #start} will wait until this is called back until further processing.
   * @type {!goog.async.Deferred}
   * @private
   */
  this.transportDeferred_ = new goog.async.Deferred();

  // Pick an appropriate transport.
  // Some transports require setup time, so we defer starting until they've
  // been prepped.
  if (sourceInfo instanceof wtf.db.BlobDataSourceInfo) {
    // Blob transport.
    var transport = new wtf.io.transports.BlobReadTransport(sourceInfo.blob);
    this.transportDeferred_.callback(transport);
  } else if (sourceInfo instanceof wtf.db.DriveDataSourceInfo) {
    // Drive URL - need to make some drive calls first.
    var driveFile = sourceInfo.driveFile;
    goog.asserts.assert(driveFile);
    goog.result.wait(wtf.io.drive.downloadFile(driveFile),
        function(result) {
          var transport = new wtf.io.transports.XhrReadTransport(
              sourceInfo.filename,
              /** @type {!XMLHttpRequest} */ (result.getValue()));
          this.transportDeferred_.callback(transport);
        }, this);
  } else if (sourceInfo instanceof wtf.db.UrlDataSourceInfo) {
    // Simple URL (or blob URL) transport.
    var transport = new wtf.io.transports.XhrReadTransport(sourceInfo.url);
    this.transportDeferred_.callback(transport);
  } else {
    throw new Error('Unknown data source type.');
  }
};


/**
 * Begins the load of the entry.
 * @param {!wtf.db.Database} db Target database.
 * @return {!goog.async.Deferred} A deferred fulfilled when the load completes.
 */
wtf.app.Loader.Entry_.prototype.start = function(db) {
  var deferred = new goog.async.Deferred();
  this.transportDeferred_.addCallback(function(transport) {
    goog.asserts.assert(!this.source);

    // Here be heuristics based on mime type.
    // TODO(benvanik): sniff contents/don't rely on mime type/etc.
    switch (this.sourceInfo.contentType) {
      default:
      case 'application/x-extension-wtf-trace':
        this.source = new wtf.db.sources.ChunkedDataSource(
            db, this.sourceInfo, new wtf.io.cff.BinaryStreamSource(transport));
        break;
      case 'application/x-extension-wtf-json':
        this.source = new wtf.db.sources.ChunkedDataSource(
            db, this.sourceInfo, new wtf.io.cff.JsonStreamSource(transport));
        break;
      case 'application/x-extension-wtf-calls':
        this.source = new wtf.db.sources.CallsDataSource(
            db, this.sourceInfo, transport);
        break;
      case 'application/x-extension-cpuprofile':
        this.source = new wtf.db.sources.CpuProfileDataSource(
            db, this.sourceInfo, transport);
        break;
    }

    // Add to database.
    db.addSource(this.source);

    // Listen for transport progress events to update the task.
    transport.addListener(wtf.io.ReadTransport.EventType.PROGRESS,
        function(loaded, total) {
          this.task.setProgress(loaded, total);
        }, this);
    transport.addListener(wtf.io.ReadTransport.EventType.END, function() {
      // Switch into 'processing' mode.
      this.task.setStyle(wtf.ui.ProgressDialog.TaskStyle.SECONDARY);
    }, this);

    // Kick off the source.
    this.source.start().chainDeferred(deferred);
  }, this);
  return deferred;
};
