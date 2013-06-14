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

goog.provide('wtf.app.ui.Loader');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.async.DeferredList');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.result');
goog.require('goog.string');
goog.require('wtf.app.ui.BufferLoaderEntry');
goog.require('wtf.app.ui.FileLoaderEntry');
goog.require('wtf.app.ui.LoadingDialog');
goog.require('wtf.app.ui.UrlLoaderEntry');
goog.require('wtf.app.ui.XhrLoaderEntry');
goog.require('wtf.db.DataSourceInfo');
goog.require('wtf.db.Database');
goog.require('wtf.doc.Document');
goog.require('wtf.io');
goog.require('wtf.io.drive');
goog.require('wtf.pal');
goog.require('wtf.timing');
goog.require('wtf.ui.ErrorDialog');



/**
 * Handles all trace loading behavior.
 * @param {!wtf.app.ui.MainDisplay} mainDisplay Main display.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.app.ui.Loader = function(mainDisplay) {
  goog.base(this);

  /**
   * DOM helper.
   * @type {!goog.dom.DomHelper}
   * @private
   */
  this.dom_ = mainDisplay.getDom();

  /**
   * Owning main display.
   * @type {!wtf.app.ui.MainDisplay}
   * @private
   */
  this.mainDisplay_ = mainDisplay;

  /**
   * Loading dialog, if it is displayed.
   * @type {wtf.app.ui.LoadingDialog}
   * @private
   */
  this.progressDialog_ = null;

  if (wtf.io.drive.isSupported()) {
    wtf.io.drive.prepare();
  }
};
goog.inherits(wtf.app.ui.Loader, goog.Disposable);


/**
 * @override
 */
wtf.app.ui.Loader.prototype.disposeInternal = function() {
  // TODO(benvanik): abort any inprogress loads.
  goog.dispose(this.progressDialog_);
  goog.base(this, 'disposeInternal');
};


/**
 * Calculates a title name from the given entries.
 * @param {!Array.<!wtf.app.ui.LoaderEntry>} entries Entries.
 * @return {string} New title string.
 * @private
 */
wtf.app.ui.Loader.prototype.generateTitleFromEntries_ = function(entries) {
  var title = '';
  for (var n = 0; n < entries.length; n++) {
    var sourceInfo = entries[n].getSourceInfo();
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
 * Attempts to guess the content type of the file entry by filename.
 * @param {string} filename Filename (or URL).
 * @return {string} Content type.
 * @private
 */
wtf.app.ui.Loader.prototype.inferContentType_ = function(filename) {
  if (goog.string.endsWith(filename, '.wtf-trace') ||
      goog.string.endsWith(filename, '.bin.part')) {
    return 'application/x-extension-wtf-trace';
  } else if (goog.string.endsWith(filename, '.wtf-json')) {
    return 'application/x-extension-wtf-json';
  }
  // Default. Maybe we should just return null.
  return 'application/x-extension-wtf-trace';
};


/**
 * Begins loading snapshot data from an incoming IPC command.
 * See the extension.js file in the injector for details about the command.
 * @param {!Object} data Command data.
 */
wtf.app.ui.Loader.prototype.loadSnapshot = function(data) {
  var revokeBlobUrls = data['revoke_blob_urls'] || false;
  var contentLength = data['content_length'];
  _gaq.push(['_trackEvent', 'app', 'open_snapshot', null, contentLength]);

  // Build entries.
  // Note that the command may contain either buffers or URLs.
  var contentTypes = data['content_types'];
  var contentSources = data['content_sources'];
  var contentBuffers = data['content_buffers'];
  var contentUrls = data['content_urls'];
  goog.asserts.assert(contentTypes.length == contentSources.length);
  var entries = [];
  for (var n = 0; n < contentTypes.length; n++) {
    var sourceInfo = new wtf.db.DataSourceInfo(
        contentSources[n], contentTypes[n]);
    var entry = null;
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
      entry = new wtf.app.ui.BufferLoaderEntry(sourceInfo, buffer);
    } else {
      entry = new wtf.app.ui.UrlLoaderEntry(
          sourceInfo, contentUrls[n], revokeBlobUrls);
    }
    entries.push(entry);
  }

  this.loadEntries_(entries);
};


/**
 * Requests a local open dialog.
 * The user may cancel the dialog, in which case no load will occur.
 * @param {function(this:T)=} opt_selectCallback Function to call when a
 *     file is selected. There's no cancellation notice.
 * @param {T=} opt_scope Callback scope.
 * @template T
 */
wtf.app.ui.Loader.prototype.requestLocalOpenDialog = function(
    opt_selectCallback, opt_scope) {
  var inputElement = this.dom_.createElement(goog.dom.TagName.INPUT);
  inputElement['type'] = 'file';
  inputElement['multiple'] = true;
  inputElement['accept'] = [
    '.wtf-trace,application/x-extension-wtf-trace',
    '.wtf-json,application/x-extension-wtf-json',
    '.part,application/x-extension-part'
  ].join(',');
  inputElement.click();
  goog.events.listenOnce(inputElement, goog.events.EventType.CHANGE,
      function(e) {
        if (opt_selectCallback) {
          opt_selectCallback.call(opt_scope);
        }
        _gaq.push(['_trackEvent', 'app', 'open_local_files']);
        this.loadFiles(inputElement.files);
      }, false, this);
};


/**
 * Requests a Drive open dialog.
 * The user may cancel the dialog, in which case no load will occur.
 * @param {function(this:T)=} opt_cancelCallback Function to call when the
 *     dialog is cancelled by the user.
 * @param {T=} opt_scope Callback scope.
 * @template T
 */
wtf.app.ui.Loader.prototype.requestDriveOpenDialog = function(
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

    var entries = [];
    var errors = [];
    var remaining = files.length;
    goog.array.forEach(files, function(file) {
      var filename = file[0];
      var fileId = file[1];
      var contentType = this.inferContentType_(filename);
      var sourceInfo = new wtf.db.DataSourceInfo(filename, contentType);

      // This call will kick off a bunch of API calls to get file metadata/etc.
      // Afterwards, it'll give us a DriveFile that has a pending XHR and the
      // information.
      goog.result.wait(wtf.io.drive.downloadFile(fileId), function(result) {
        remaining--;
        var driveFile = result.getValue();
        if (driveFile) {
          // The filename may differ from the other, due to the horrible Drive
          // API.
          sourceInfo.filename = driveFile.filename;

          // Set the pending XHR.
          var entry = new wtf.app.ui.XhrLoaderEntry(sourceInfo, driveFile.xhr);
          entries.push(entry);
        } else {
          errors.push(result.getError());
        }
        if (!remaining) {
          finished.call(this);
        }
      }, this);
    }, this);

    /**
     * @this {wtf.app.ui.Loader}
     */
    function finished() {
      if (errors.length) {
        // TODO(benvanik): log errors?
        this.loadFailed_(
            'Unable to load files',
            'An error occurred while trying to fetch a file from Drive.');
        return;
      }

      this.loadEntries_(entries);
    };
  }, this);
};


/**
 * Begins loading a set of HTML5 File objects.
 * These can be from the filesystem, dragged in, etc.
 * @param {!Array.<!File>} files File objects.
 */
wtf.app.ui.Loader.prototype.loadFiles = function(files) {
  var entries = [];
  for (var n = 0; n < files.length; n++) {
    var filename = files[n].name;
    var contentType = this.inferContentType_(filename);
    var sourceInfo = new wtf.db.DataSourceInfo(filename, contentType);
    var entry = new wtf.app.ui.FileLoaderEntry(sourceInfo, files[n]);
    entries.push(entry);
  }
  this.loadEntries_(entries);
};


/**
 * Begins loading a set of files from URLs.
 * @param {!Array.<string>} urls URLs.
 */
wtf.app.ui.Loader.prototype.loadUrls = function(urls) {
  var entries = [];
  for (var n = 0; n < urls.length; n++) {
    var url = urls[n];
    var contentType = this.inferContentType_(url);
    var sourceInfo = new wtf.db.DataSourceInfo(url, contentType);
    var entry = new wtf.app.ui.UrlLoaderEntry(sourceInfo, url, true);
    entries.push(entry);
  }
  this.loadEntries_(entries);
};


/**
 * Begins loading the entries and handles their async completion.
 * @param {!Array.<!wtf.app.ui.LoaderEntry>} entries Loader entries.
 * @param {string=} opt_title Optional override for the app title. If omitted
 *     the title will be inferred from the entries.
 * @private
 */
wtf.app.ui.Loader.prototype.loadEntries_ = function(entries, opt_title) {
  // Close the old document.
  this.mainDisplay_.setDocumentView(null, true);

  // TODO(benvanik): avoid showing the loading dialog for small traces.

  // Show the loading dialog.
  // Don't registerDisposable it so that we don't leak it.
  goog.asserts.assert(!this.progressDialog_);
  var body = this.dom_.getDocument().body;
  goog.asserts.assert(body);
  this.progressDialog_ = new wtf.app.ui.LoadingDialog(body, entries, this.dom_);

  // Wait until the dialog is displayed.
  wtf.timing.setTimeout(218, function() {
    // Gather all deferrreds and wait on them.
    var deferreds = goog.array.map(entries, function(entry) {
      return entry.begin();
    });
    goog.async.DeferredList.gatherResults(deferreds).addCallbacks(
        function() {
          this.loadSucceeded_(entries, opt_title);
        },
        function(args) {
          this.loadFailed_(
              'Unable to load snapshot',
              'Source files could not be fetched.');
        }, this);
  }, this);
};


/**
 * Handles successful loads.
 * @param {!Array.<!wtf.app.ui.LoaderEntry>} entries Loader entries.
 * @param {string=} opt_title Optional override for the app title. If omitted
 *     the title will be inferred from the entries.
 * @private
 */
wtf.app.ui.Loader.prototype.loadSucceeded_ = function(entries, opt_title) {
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

  // Add the data sources.
  // This will often queue a bunch of invalidates for the next tick.
  var contentLength = 0;
  for (var n = 0; n < entries.length; n++) {
    var entry = entries[n];
    contentLength += this.addEntryToDatabase_(entries[n], db);

    // TODO(benvanik): retain for a bit?
    goog.dispose(entry);
  }
  _gaq.push(['_trackEvent', 'app', 'open_files', null, contentLength]);

  // Pick a title, unless one was specified.
  var title = opt_title || this.generateTitleFromEntries_(entries);
  this.mainDisplay_.setTitle(title);

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
    // Show the document.
    var documentView = this.mainDisplay_.openDocument(doc);
    goog.asserts.assert(documentView);

    // Zoom to fit.
    // TODO(benvanik): remove setTimeout when zoomToFit is based on view
    wtf.timing.setTimeout(50, function() {
      documentView.zoomToFit();
    }, this);
  };
};


/**
 * Adds an entry to the database by guessing its type.
 * @param {!wtf.app.ui.LoaderEntry} entry Entry to add.
 * @param {!wtf.db.Database} db Target database.
 * @return {number} The total size, in bytes, of the data (estimated).
 * @private
 */
wtf.app.ui.Loader.prototype.addEntryToDatabase_ = function(entry, db) {
  var sourceInfo = entry.getSourceInfo();
  var data = entry.getContents();
  goog.asserts.assert(data);
  if (!data) {
    return 0;
  }

  // Wrap array buffers so they are always wtf.io.ByteArray-like.
  if (data instanceof ArrayBuffer) {
    data = new Uint8Array(data);
  }

  // Here be heuristics.
  // If we have a mime type, use that. Otherwise try to guess based on the entry
  // data type.
  // TODO(benvanik): sniff contents/don't rely on mime type/etc.
  switch (sourceInfo.contentType) {
    default:
    case 'application/x-extension-wtf-trace':
      db.addBinarySource(data, sourceInfo);
      break;
    case 'application/x-extension-wtf-json':
      db.addJsonSource(data, sourceInfo);
      break;
  }
  if (data instanceof Blob) {
    return data.size;
  } else {
    return data.length;
  }
};


/**
 * Handles load failures.
 * @param {string} title Error title.
 * @param {string} message Error message/details.
 * @private
 */
wtf.app.ui.Loader.prototype.loadFailed_ = function(title, message) {
  _gaq.push(['_trackEvent', 'app', 'load_failed', title]);

  // Close the progress dialog.
  goog.dispose(this.progressDialog_);
  this.progressDialog_ = null;

  // Let them know we failed.
  wtf.ui.ErrorDialog.show(title, message, this.dom_);
};
