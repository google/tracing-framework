/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview HTTP server control service endpoint.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.background.HttpServiceEndpoint');

goog.require('wtf.app.background.ServiceEndpoint');
goog.require('wtf.net.EventType');
goog.require('wtf.net.HttpServer');



/**
 * HTTP server control service endpoint.
 *
 * @param {!wtf.pal.IPlatform} platform Platform abstraction layer.
 * @param {!Array.<number>} ports TCP ports to listen on.
 * @constructor
 * @extends {wtf.app.background.ServiceEndpoint}
 */
wtf.app.background.HttpServiceEndpoint = function(platform, ports) {
  goog.base(this);

  /**
   * HTTP server, listening on all ports.
   * @type {!wtf.net.HttpServer}
   * @private
   */
  this.server_ = new wtf.net.HttpServer(platform);
  this.registerDisposable(this.server_);

  /**
   * All active streaming sessions.
   * @type {!Object.<!wtf.app.background.HttpSessionStream_>}
   * @private
   */
  this.streams_ = {};

  // Bind events before listening (to avoid missing things).
  this.server_.addListener(wtf.net.EventType.REQUEST, this.requestBegan_, this);

  // Listen on all ports.
  for (var n = 0; n < ports.length; n++) {
    this.server_.listen(ports[n]);
  }
};
goog.inherits(wtf.app.background.HttpServiceEndpoint,
    wtf.app.background.ServiceEndpoint);


/**
 * /stream/ path regex.
 * @type {RegExp}
 * @private
 */
wtf.app.background.HttpServiceEndpoint.STREAM_REGEX_ =
    /^\/session\/([a-zA-Z0-9-]+)\/stream\/([a-zA-Z0-9-]+)\/([a-z]+)$/;


/**
 * Handles new request events.
 * @param {!wtf.net.HttpServerRequest} request Request object.
 * @param {!wtf.net.HttpServerResponse} response Response object.
 * @private
 */
wtf.app.background.HttpServiceEndpoint.prototype.requestBegan_ = function(
    request, response) {
  var method = request.getMethod();
  var path = request.getPath();

  // Snapshot upload request.
  if (method == 'POST' && path == '/snapshot/upload') {
    new wtf.app.background.HttpSnapshotUpload_(this, request, response);
  }

  // Stream handling.
  // POST /session/{sessionId}/stream/{streamId}/create
  // POST /session/{sessionId}/stream/{streamId}/append
  var streamMatch =
      wtf.app.background.HttpServiceEndpoint.STREAM_REGEX_.exec(path);
  if (streamMatch) {
    var sessionId = streamMatch[1];
    var streamId = streamMatch[2];
    var stream = this.streams_[streamId];
    switch (streamMatch[3]) {
      case 'create':
        if (stream) {
          // Already exists!
          response.setStatusCode(409, 'Stream Already Exists');
          response.end();
          return;
        }
        // Create new session.
        stream = new wtf.app.background.HttpSessionStream_(
            this, sessionId, streamId, request);
        this.streams_[streamId] = stream;
        response.setStatusCode(201, 'Stream Created');
        response.end();
        // TODO(benvanik): emit event
        break;
      case 'append':
        if (!stream) {
          // Stream not found.
          // We don't try to gracefully create as the headers will be missing.
          response.setStatusCode(404, 'Stream Not Found');
          response.end();
          return;
        }
        stream.append(request, response);
        break;
    }
  }
};



/**
 * HTTP snapshot upload transaction.
 * When the snapshot is fully received an event will be dispatched to the
 * endpoint.
 * @param {!wtf.app.background.HttpServiceEndpoint} endpoint Parent endpoint.
 * @param {!wtf.net.HttpServerRequest} request Request object.
 * @param {!wtf.net.HttpServerResponse} response Response object.
 * @constructor
 * @private
 */
wtf.app.background.HttpSnapshotUpload_ = function(endpoint, request, response) {
  /**
   * Parent endpoint.
   * @type {!wtf.app.background.HttpServiceEndpoint}
   * @private
   */
  this.endpoint_ = endpoint;

  /**
   * Request object.
   * @type {!wtf.net.HttpServerRequest}
   * @private
   */
  this.request_ = request;

  /**
   * Response object.
   * @type {!wtf.net.HttpServerResponse}
   * @private
   */
  this.response_ = response;

  /**
   * Snapshot data, sized to the request content length.
   * @type {!Uint8Array}
   * @private
   */
  this.snapshotData_ = new Uint8Array(request.getContentLength());

  /**
   * Current read offset into the snapshot data buffer.
   * @type {number}
   * @private
   */
  this.snapshotDataOffset_ = 0;

  this.request_.addListener(wtf.net.EventType.DATA, this.dataReceived_, this);
  this.request_.addListener(wtf.net.EventType.END, this.requestEnded_, this);
};


/**
 * Handles incoming data events.
 * @param {!Uint8Array} data Data.
 * @private
 */
wtf.app.background.HttpSnapshotUpload_.prototype.dataReceived_ =
    function(data) {
  this.snapshotData_.set(data, this.snapshotDataOffset_);
  this.snapshotDataOffset_ += data.length;
};


/**
 * Handles request completion events.
 * @private
 */
wtf.app.background.HttpSnapshotUpload_.prototype.requestEnded_ = function() {
  this.response_.setStatusCode(201, 'Snapshot Uploaded');
  this.response_.end();

  this.endpoint_.emitSnapshot(
      this.request_.getContentType() || 'text/plain',
      this.snapshotData_);
};



/**
 * HTTP streaming session.
 * @param {!wtf.app.background.HttpServiceEndpoint} endpoint Parent endpoint.
 * @param {string} sessionId Session ID.
 * @param {string} streamId Stream ID.
 * @param {!wtf.net.HttpServerRequest} request Creation request.
 * @constructor
 * @private
 */
wtf.app.background.HttpSessionStream_ = function(
    endpoint, sessionId, streamId, request) {
  /**
   * Parent endpoint.
   * @type {!wtf.app.background.HttpServiceEndpoint}
   * @private
   */
  this.endpoint_ = endpoint;

  /**
   * Session ID.
   * @type {string}
   * @private
   */
  this.sessionId_ = sessionId;

  /**
   * Stream ID
   * @type {string}
   * @private
   */
  this.streamId_ = streamId;

  /**
   * Trace format of the stream.
   * @type {string}
   * @private
   */
  this.traceFormat_ =
      String(request.getHeader('X-Trace-Format')) || 'text/plain';

  this.endpoint_.emitStreamCreated(
      this.sessionId_, this.streamId_, this.traceFormat_);
};


/**
 * Appends a data segment to the session.
 * @param {!wtf.net.HttpServerRequest} request Append request.
 * @param {!wtf.net.HttpServerResponse} response Response object.
 */
wtf.app.background.HttpSessionStream_.prototype.append =
    function(request, response) {
  // Eat all data.
  // TODO(benvanik): move to request
  var allData = new Uint8Array(request.getContentLength());
  var allDataOffset = 0;
  request.addListener(wtf.net.EventType.DATA, function(data) {
    allData.set(data, allDataOffset);
    allDataOffset += data.length;
  });
  request.addListener(wtf.net.EventType.END, function() {
    // End response.
    response.setStatusCode(202, 'Stream Data Accepted');
    response.end();

    // Emit append event.
    this.endpoint_.emitStreamAppended(this.sessionId_, this.streamId_, allData);
  }, this);
};
