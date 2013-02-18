/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Abstract application tracing document.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.doc.Document');
goog.provide('wtf.doc.DocumentMode');
goog.provide('wtf.doc.DocumentStatus');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.object');
goog.require('wtf.db.Database');
goog.require('wtf.doc.CommentScope');
goog.require('wtf.doc.Profile');
goog.require('wtf.doc.View');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.events.SimpleEventfulList');
goog.require('wtf.events.SimpleEventfulMap');
goog.require('wtf.io');
goog.require('wtf.io.MemoryReadStream');


/**
 * Document replication mode.
 * @enum {number}
 */
wtf.doc.DocumentMode = {
  /**
   * Document is local (snapshot or streaming, loaded from file).
   */
  LOCAL: 0,

  /**
   * Document is remote (collaborating with others/etc).
   */
  REMOTE: 1
};


/**
 * Document status.
 * @enum {number}
 */
wtf.doc.DocumentStatus = {
  /**
   * Document is static (loaded from a snapshot/etc).
   */
  STATIC: 0,

  /**
   * Document is streaming live.
   */
  STREAMING: 1
};



/**
 * Abstract tracing document.
 * Implementations can make this support local-only documents or remote
 * documents (such as ones stored in the cloud).
 *
 * @param {!wtf.pal.IPlatform} platform Platform abstraction layer.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.doc.Document = function(platform) {
  goog.base(this);

  /**
   * Document replication mode.
   * @type {wtf.doc.DocumentMode}
   * @private
   */
  this.mode_ = wtf.doc.DocumentMode.LOCAL;

  /**
   * Document update status.
   * @type {wtf.doc.DocumentStatus}
   * @private
   */
  this.status_ = wtf.doc.DocumentStatus.STATIC;

  /**
   * Comment scopes.
   * @type {!wtf.events.EventfulMap}
   * @private
   */
  this.commentScopes_ = new wtf.events.SimpleEventfulMap();
  this.registerDisposable(this.commentScopes_);

  /**
   * Profile list.
   * @type {!wtf.events.EventfulList}
   * @private
   */
  this.profileList_ = new wtf.events.SimpleEventfulList();
  this.registerDisposable(this.profileList_);

  /**
   * All collaborators in the document.
   * @type {!wtf.events.EventfulList}
   * @private
   */
  this.collaboratorList_ = new wtf.events.SimpleEventfulList();
  this.registerDisposable(this.collaboratorList_);

  /**
   * All views from all users.
   * @type {!wtf.events.EventfulList}
   * @private
   */
  this.viewList_ = new wtf.events.SimpleEventfulList();
  this.registerDisposable(this.viewList_);

  /**
   * Event database.
   * @type {!wtf.db.Database}
   * @private
   */
  this.db_ = new wtf.db.Database(true);
  this.registerDisposable(this.db_);

  /**
   * Incoming read streams, mapped by stream ID.
   * @type {!Object.<!wtf.io.MemoryReadStream>}
   * @private
   */
  this.readStreams_ = {};
};
goog.inherits(wtf.doc.Document, wtf.events.EventEmitter);


/**
 * Event types related to the object.
 * @enum {string}
 */
wtf.doc.Document.EventType = {
  /**
   * Status changed.
   */
  STATUS_CHANGED: goog.events.getUniqueId('status_changed')
};


/**
 * Gets the document replication mode.
 * @return {wtf.doc.DocumentMode} Document mode.
 */
wtf.doc.Document.prototype.getMode = function() {
  return this.mode_;
};


/**
 * Gets the document update status.
 * @return {wtf.doc.DocumentStatus} Document status.
 */
wtf.doc.Document.prototype.getStatus = function() {
  return this.status_;
};


/**
 * Sets the status of the document.
 * @param {wtf.doc.DocumentStatus} value New status value.
 */
wtf.doc.Document.prototype.setStatus = function(value) {
  if (this.status_ == value) {
    return;
  }
  this.status_ = value;
  this.emitEvent(
      wtf.doc.Document.EventType.STATUS_CHANGED);
};


/**
 * Gets the comment scope with the given name, creating it if needed.
 * @param {string} name Comment scope name.
 * @return {!wtf.doc.CommentScope} The requested comment scope.
 */
wtf.doc.Document.prototype.getCommentScope = function(name) {
  var value = this.commentScopes_.get(name);
  if (!value) {
    value = new wtf.doc.CommentScope(name);
    this.commentScopes_.set(name, value);
  }
  return /** @type {!wtf.doc.CommentScope} */ (value);
};


/**
 * Creates a new profile and adds it to the profile list.
 * @param {string} name Profile name.
 * @return {!wtf.doc.Profile} New profile.
 */
wtf.doc.Document.prototype.createProfile = function(name) {
  var profile = new wtf.doc.Profile(name);
  this.profileList_.push(profile);
  return profile;
};


/**
 * Gets the profile listing.
 * @return {!wtf.events.EventfulList} Profile listing.
 */
wtf.doc.Document.prototype.getProfileList = function() {
  return this.profileList_;
};


/**
 * Gets the collaborator listing.
 * @return {!wtf.events.EventfulList} Collaborator listing.
 */
wtf.doc.Document.prototype.getCollaboratorList = function() {
  return this.collaboratorList_;
};


/**
 * Creates a new view and adds it to the view list.
 * @return {!wtf.doc.View} New view.
 */
wtf.doc.Document.prototype.createView = function() {
  var view = new wtf.doc.View();
  this.viewList_.push(view);
  return view;
};


/**
 * Gets the view listing.
 * @return {!wtf.events.EventfulList} View listing.
 */
wtf.doc.Document.prototype.getViewList = function() {
  return this.viewList_;
};


/**
 * Gets the event database.
 * @return {!wtf.db.Database} Event database.
 */
wtf.doc.Document.prototype.getDatabase = function() {
  return this.db_;
};


/**
 * Begins a new event data stream.
 * @param {string} streamId Stream ID.
 * @param {string} contentType Stream content type.
 */
wtf.doc.Document.prototype.beginEventStream = function(streamId, contentType) {
  var readStream = new wtf.io.MemoryReadStream();
  this.readStreams_[streamId] = readStream;
  this.db_.addStreamingSource(readStream);
  this.setStatus(wtf.doc.DocumentStatus.STREAMING);
};


/**
 * Appends streaming data to the given stream.
 * @param {string} streamId Stream ID.
 * @param {!Array.<!wtf.io.ByteArray>} datas Data content.
 * @return {boolean} True if the stream data was appended successfully.
 */
wtf.doc.Document.prototype.appendEventStreamData = function(streamId, datas) {
  var readStream = this.readStreams_[streamId];
  if (!readStream) {
    return false;
  }
  for (var n = 0; n < datas.length; n++) {
    readStream.addData(datas[n]);
  }
  return true;
};


/**
 * Ends an event data stream.
 * @param {string} streamId Stream ID.
 */
wtf.doc.Document.prototype.endEventStream = function(streamId) {
  var readStream = this.readStreams_[streamId];
  if (!readStream) {
    return;
  }
  delete this.readStreams_[streamId];
  // TODO(benvanik): close the stream and remove the trace source.
  if (goog.object.isEmpty(this.readStreams_)) {
    this.setStatus(wtf.doc.DocumentStatus.STATIC);
  }
};


/**
 * Adds an event data source to the database.
 * The given data can be a binary array or some form of JSON.
 * @param {!wtf.io.ByteArray|string|!Object} data Source data.
 * @return {number} Estimated size, in bytes, of the data source.
 */
wtf.doc.Document.prototype.addEventSource = function(data) {
  if (wtf.io.isByteArray(data)) {
    this.db_.addBinarySource(/** @type {!wtf.io.ByteArray} */ (data));
    return data.length;
  } else if (data instanceof ArrayBuffer) {
    var dataBuffer = new Uint8Array(data);
    this.db_.addBinarySource(dataBuffer);
    return dataBuffer.length;
  } else {
    this.db_.addJsonSource(data);
    return goog.isString(data) ? data.length : 0;
  }
};


/**
 * Adds a list of event sources to the database.
 * The given data can be binary arrays or some form of JSON.
 * @param {!Array.<!wtf.io.ByteArray|string|!Object>} datas Source data list.
 * @return {number} Estimated size, in bytes, of all the data sources.
 */
wtf.doc.Document.prototype.addEventSources = function(datas) {
  var contentLength = 0;
  for (var n = 0; n < datas.length; n++) {
    contentLength += this.addEventSource(datas[n]);
  }
  return contentLength;
};


/**
 * Gets the trace data storage.
 * @return {!wtf.db.DataStorage} Trace data storage.
 */
wtf.doc.Document.prototype.getStorage = function() {
  var storage = this.db_.getStorage();
  goog.asserts.assert(storage);
  return storage;
};
