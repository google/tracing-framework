/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Loader support type for tracking loads.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.BufferLoaderEntry');
goog.provide('wtf.app.ui.FileLoaderEntry');
goog.provide('wtf.app.ui.LoaderEntry');
goog.provide('wtf.app.ui.UrlLoaderEntry');
goog.provide('wtf.app.ui.XhrLoaderEntry');

goog.require('goog.async.Deferred');
goog.require('goog.events');
goog.require('goog.events.EventHandler');
goog.require('goog.fs');
goog.require('goog.fs.Error');
goog.require('goog.fs.FileReader');
goog.require('goog.net.HttpStatus');
goog.require('goog.net.XmlHttp');
goog.require('goog.string');
goog.require('wtf.events.EventEmitter');



/**
 * Loader entry.
 * Used to track the progress of an individual entry in the loader.
 * @param {!wtf.db.DataSourceInfo} sourceInfo Source information.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.app.ui.LoaderEntry = function(sourceInfo) {
  goog.base(this);

  /**
   * Source information.
   * @type {!wtf.db.DataSourceInfo}
   * @private
   */
  this.sourceInfo_ = sourceInfo;

  /**
   * The contents of the entry.
   * This is only set once the load has completed.
   * @type {wtf.app.ui.LoaderEntry.ContentType}
   * @private
   */
  this.contents_ = null;

  /**
   * If an async fetch is required this will be a deferred waiting on its
   * completion.
   * @type {!goog.async.Deferred}
   * @private
   */
  this.deferred_ = new goog.async.Deferred();
};
goog.inherits(wtf.app.ui.LoaderEntry, wtf.events.EventEmitter);


/**
 * @typedef {wtf.io.ByteArray|ArrayBuffer|ArrayBufferView|string|Blob}
 */
wtf.app.ui.LoaderEntry.ContentType;


/**
 * @enum {string}
 */
wtf.app.ui.LoaderEntry.EventType = {
  PROGRESS: goog.events.getUniqueId('progress')
};


/**
 * Gets the source information for the entry.
 * @return {!wtf.db.DataSourceInfo} Data source information.
 */
wtf.app.ui.LoaderEntry.prototype.getSourceInfo = function() {
  return this.sourceInfo_;
};


/**
 * Begins the load of the entry, if it is async.
 * @return {!goog.async.Deferred} A deferred fulfilled when the load completes.
 */
wtf.app.ui.LoaderEntry.prototype.begin = function() {
  return this.deferred_;
};


/**
 * Fires a progress event.
 * @param {number} loaded Loaded amount, in bytes.
 * @param {number} total Total amount, in bytes.
 * @protected
 */
wtf.app.ui.LoaderEntry.prototype.fireProgressEvent = function(loaded, total) {
  this.emitEvent(wtf.app.ui.LoaderEntry.EventType.PROGRESS, loaded, total);
};


/**
 * Gets the result contents.
 * The result is only valid if the loader completed successfully.
 * @return {wtf.app.ui.LoaderEntry.ContentType} Contents.
 */
wtf.app.ui.LoaderEntry.prototype.getContents = function() {
  return this.contents_;
};


/**
 * Sets the result contents.
 * This is an implicit success and will fire the deferred.
 * @param {!wtf.app.ui.LoaderEntry.ContentType} contents Contents.
 * @protected
 */
wtf.app.ui.LoaderEntry.prototype.setContents = function(contents) {
  this.contents_ = contents;
  this.deferred_.callback(null);
};


/**
 * Sets the error message.
 * This is an implicit failure and will fire the deferred.
 * @param {string=} opt_message Error message/status code.
 * @protected
 */
wtf.app.ui.LoaderEntry.prototype.setError = function(opt_message) {
  this.deferred_.errback(opt_message);
};



/**
 * A static loader entry initialized with a buffer.
 * @param {!wtf.db.DataSourceInfo} sourceInfo Source information.
 * @param {!wtf.io.ByteArray} buffer Buffer.
 * @constructor
 * @extends {wtf.app.ui.LoaderEntry}
 */
wtf.app.ui.BufferLoaderEntry = function(sourceInfo, buffer) {
  goog.base(this, sourceInfo);

  // Succeed immediately.
  this.setContents(buffer);
};
goog.inherits(wtf.app.ui.BufferLoaderEntry, wtf.app.ui.LoaderEntry);



/**
 * A URL-based loader entry.
 * The given XHR should not have had its send method called yet.
 * @param {!wtf.db.DataSourceInfo} sourceInfo Source information.
 * @param {!XMLHttpRequest} xhr XHR to begin loading.
 * @constructor
 * @extends {wtf.app.ui.LoaderEntry}
 */
wtf.app.ui.XhrLoaderEntry = function(sourceInfo, xhr) {
  goog.base(this, sourceInfo);

  /**
   * Event handler.
   * @type {!goog.events.EventHandler}
   * @private
   */
  this.eh_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eh_);

  /**
   * The XHR to fetch.
   * @type {!XMLHttpRequest}
   * @private
   */
  this.xhr_ = xhr;
};
goog.inherits(wtf.app.ui.XhrLoaderEntry, wtf.app.ui.LoaderEntry);


/**
 * @override
 */
wtf.app.ui.XhrLoaderEntry.prototype.begin = function() {
  var eh = this.eh_;
  var xhr = this.xhr_;

  // Set response mode. Must be set before send().
  var asBinary = this.getSourceInfo().isBinary();
  xhr.responseType = asBinary ? 'arraybuffer' : 'text';

  // Fired zero-to-many times.
  eh.listen(xhr, goog.fs.FileReader.EventType.PROGRESS, function(e) {
    e = e.getBrowserEvent();
    if (e.lengthComputable) {
      this.fireProgressEvent(e.loaded, e.total);
    }
  });

  // Always fired after load/abort/error.
  eh.listen(xhr, goog.fs.FileReader.EventType.LOAD_END, function(e) {
    var status = -1;
    var statusText = '';
    if (xhr.readyState == goog.net.XmlHttp.ReadyState.COMPLETE) {
      status = xhr.status;
      statusText = xhr.statusText;
    }
    if (goog.net.HttpStatus.isSuccess(status)) {
      // Succeeded.
      var length = xhr.response.length || xhr.response.byteLength;
      this.fireProgressEvent(length, length);
      this.setContents(xhr.response);
    } else {
      // Failed.
      this.setError(status + ' ' + statusText);
    }
  });

  // NOTE: once send is called we cannot add any more progress events/etc.
  xhr.send();

  return goog.base(this, 'begin');
};



/**
 * A URL-based loader entry.
 * The given XHR should not have had its send method called yet.
 * @param {!wtf.db.DataSourceInfo} sourceInfo Source information.
 * @param {string} url URL to fetch.
 * @param {boolean} revokeWhenDone Revoke blob: URLs when done.
 * @constructor
 * @extends {wtf.app.ui.XhrLoaderEntry}
 */
wtf.app.ui.UrlLoaderEntry = function(sourceInfo, url, revokeWhenDone) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  goog.base(this, sourceInfo, xhr);

  /**
   * Source URL.
   * @type {string}
   * @private
   */
  this.url_ = url;

  /**
   * Revoke blob: URls when done with them.
   * @type {boolean}
   * @private
   */
  this.revokeWhenDone_ = revokeWhenDone;
};
goog.inherits(wtf.app.ui.UrlLoaderEntry, wtf.app.ui.XhrLoaderEntry);


/**
 * @override
 */
wtf.app.ui.UrlLoaderEntry.prototype.disposeInternal = function() {
  if (this.revokeWhenDone_ &&
      goog.string.startsWith(this.url_, 'blob:')) {
    // Revoke blob URLs, if we were asked to.
    goog.fs.revokeObjectUrl(this.url_);
  }
  goog.base(this, 'disposeInternal');
};



/**
 * An HTML File-based loader entry.
 * @param {!wtf.db.DataSourceInfo} sourceInfo Source information.
 * @param {!File} file File to load.
 * @constructor
 * @extends {wtf.app.ui.LoaderEntry}
 */
wtf.app.ui.FileLoaderEntry = function(sourceInfo, file) {
  goog.base(this, sourceInfo);

  /**
   * Event handler.
   * @type {!goog.events.EventHandler}
   * @private
   */
  this.eh_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eh_);

  /**
   * The File to fetch.
   * @type {!File}
   * @private
   */
  this.file_ = file;
};
goog.inherits(wtf.app.ui.FileLoaderEntry, wtf.app.ui.LoaderEntry);


/**
 * @override
 */
wtf.app.ui.FileLoaderEntry.prototype.disposeInternal = function() {
  // close() was added later - check for its existence.
  if (this.file_['close']) {
    this.file_['close']();
  }
  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.app.ui.FileLoaderEntry.prototype.begin = function() {
  var eh = this.eh_;

  var reader = new FileReader();

  // Fired zero-to-many times.
  eh.listen(reader, goog.fs.FileReader.EventType.PROGRESS, function(e) {
    e = e.getBrowserEvent();
    if (e.lengthComputable) {
      this.fireProgressEvent(e.loaded, e.total);
    }
  });

  // Always fired after load/abort/error.
  eh.listen(reader, goog.fs.FileReader.EventType.LOAD_END, function(e) {
    e = e.getBrowserEvent();
    this.fireProgressEvent(e.loaded, e.loaded);

    if (reader.result) {
      // Succeeded.
      this.setContents(reader.result);
    } else {
      // Failed.
      this.setError(goog.fs.Error.getDebugMessage(
          /** @type {number} */ (reader.error)));
    }
  });

  var asBinary = this.getSourceInfo().isBinary();
  if (asBinary) {
    reader.readAsArrayBuffer(this.file_);
  } else {
    reader.readAsText(this.file_);
  }

  return goog.base(this, 'begin');
};
