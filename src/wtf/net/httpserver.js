/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview HTTP server types.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.net.HttpServer');
goog.provide('wtf.net.HttpServerConnection');
goog.provide('wtf.net.HttpServerRequest');
goog.provide('wtf.net.HttpServerResponse');

goog.require('goog.asserts');
goog.require('goog.result');
goog.require('goog.result.SimpleResult');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.net.EventType');
goog.require('wtf.util');



/**
 * A simple HTTP server.
 * Implements the bare minumum required for WTF. Not secure, or robust, etc.
 *
 * When a request begins (the header is parsed) a
 * {@see wtf.net.EventType#REQUEST} event is fired containing the request and
 * a response.
 *
 * @param {!wtf.pal.IPlatform} platform Platform abstraction layer.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.net.HttpServer = function(platform) {
  goog.base(this);

  /**
   * Platform abstraction layer.
   * @type {!wtf.pal.IPlatform}
   * @private
   */
  this.platform_ = platform;

  /**
   * A list of all listening sockets.
   * These are disposed when the server is disposed.
   * @type {!Array.<!wtf.net.ListenSocket>}
   * @private
   */
  this.listenSockets_ = [];

  /**
   * A list of all open client sockets.
   * @type {!Array.<!wtf.net.HttpServerConnection>}
   * @private
   */
  this.connections_ = [];

  /**
   * A list of all network interfaces.
   * This is populated when the deferred completes.
   * @type {!Array.<string>}
   * @private
   */
  this.interfaces_ = [];

  /**
   * A waiter for interface data.
   * @type {!goog.result.SimpleResult}
   * @private
   */
  this.interfaceWaiter_ = new goog.result.SimpleResult();

  // Query for all local interfaces.
  this.platform_.getNetworkInterfaces(function(interfaces) {
    this.interfaces_.push('127.0.0.1');
    for (var n = 0; n < interfaces.length; n++) {
      this.interfaces_.push(interfaces[n].address);
    }
    this.interfaceWaiter_.setValue(null);
  }, this);
};
goog.inherits(wtf.net.HttpServer, wtf.events.EventEmitter);


/**
 * @override
 */
wtf.net.HttpServer.prototype.disposeInternal = function() {
  goog.disposeAll(this.listenSockets_);
  goog.disposeAll(this.connections_);
  goog.base(this, 'disposeInternal');
};


/**
 * Begins listening on the given port and hostname.
 * A server can listen on multiple ports/hostnames.
 * @param {number} port TCP port to listen on.
 */
wtf.net.HttpServer.prototype.listen = function(port) {
  goog.result.wait(this.interfaceWaiter_, function() {
    for (var n = 0; n < this.interfaces_.length; n++) {
      // Create socket.
      // This will be disposed when the server is.
      var listenSocket = this.platform_.createListenSocket(
          port, this.interfaces_[n]);
      this.listenSockets_.push(listenSocket);

      // Listen for connections.
      listenSocket.addListener(
          wtf.net.EventType.CONNECTION, this.socketConnected_, this);
    }
  }, this);
};


/**
 * Handles new socket connections.
 * @param {!wtf.net.ListenSocket} listenSocket Socket the connect arrived on.
 * @param {!wtf.net.Socket} socket New TCP socket.
 * @private
 */
wtf.net.HttpServer.prototype.socketConnected_ = function(listenSocket, socket) {
  var connection = new wtf.net.HttpServerConnection(this, socket);
  this.connections_.push(connection);

  socket.addListener(wtf.net.EventType.CLOSE, this.socketClosed_, this);
};


/**
 * Handles client socket closures.
 * @param {!wtf.net.Socket} socket Socket that closed.
 * @private
 */
wtf.net.HttpServer.prototype.socketClosed_ = function(socket) {
  for (var n = 0; n < this.connections_.length; n++) {
    var connection = this.connections_[n];
    if (connection.socket_ == socket) {
      this.connections_.splice(n, 1);
      return;
    }
  }
};



/**
 * HTTP server-side connection.
 * Server sockets model HTTP connections, which may be reused for multiple
 * requests. When a request begins (the header is parsed) a
 * {@see wtf.net.EventType#REQUEST} event is fired containing the request and
 * a response on the parent server. The request may not be fully present and may
 * fire data events.
 *
 * @param {!wtf.net.HttpServer} server Owning HTTP server.
 * @param {!wtf.net.Socket} socket TCP socket.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.net.HttpServerConnection = function(server, socket) {
  goog.base(this);

  /**
   * Owning HTTP server. This receives request events/etc.
   * @type {!wtf.net.HttpServer}
   * @private
   */
  this.server_ = server;

  /**
   * TCP socket.
   * @type {!wtf.net.Socket}
   * @private
   */
  this.socket_ = socket;
  this.registerDisposable(this.socket_);

  /**
   * Current request, if reading a body.
   * @type {wtf.net.HttpServerRequest}
   * @private
   */
  this.currentRequest_ = null;

  this.socket_.addListener(
      wtf.net.EventType.DATA, this.dataRead_, this);
};
goog.inherits(wtf.net.HttpServerConnection, wtf.events.EventEmitter);


/**
 * Handles socket data read events.
 * @param {!wtf.net.Socket} socket Read socket.
 * @param {!Uint8Array} data Incoming data buffer.
 * @private
 */
wtf.net.HttpServerConnection.prototype.dataRead_ = function(socket, data) {
  if (!this.currentRequest_) {
    // Reading the HTTP header - scan the input bytes. We look for the first
    // \n\n and then append that string. If none is found it means we are just
    // the first packet of data.
    // TODO(benvanik): support spanning packets/sorting header data in buffers
    var headerLength = 0;
    for (var n = data.length - 4; n >= 0; n--) {
      if (data[n] == 13 && data[n + 1] == 10 &&
          data[n + 2] == 13 && data[n + 3] == 10) {
        // Found.
        headerLength = n + 4;
        break;
      }
    }
    if (!headerLength) {
      // Bad header or header split across multiple packets.
      window.console.log('bad header; no CRLFCRLF found');
      goog.dispose(this);
      return;
    }

    // Slice off the header data and reset data.
    // Header may be followed by some body data, keep it if needed.
    var headerData = data;
    headerData = data.subarray(0, headerLength);
    data = data.subarray(headerLength);

    // Stash header string.
    var request = this.parseRequest_(
        String.fromCharCode.apply(null, headerData));
    if (!request) {
      goog.dispose(this);
      return;
    }

    // Start request.
    this.currentRequest_ = request;
    var response = new wtf.net.HttpServerResponse(this, this.socket_, request);
    var emitRequest = true;

    // Special handling for OPTIONS - these are likely CORS requests.
    // If anyone needs OPTIONS requests they can hack this up.
    if (request.getMethod() == 'OPTIONS') {
      response.setStatusCode(204, 'Whatever');
      response.end();
      emitRequest = false;
    }

    // Emit to listeners, only if needed.
    if (emitRequest) {
      this.server_.emitEvent(wtf.net.EventType.REQUEST,
          this.currentRequest_, response);
    }
  }

  // Process body data.
  if (this.currentRequest_) {
    var remaining = this.currentRequest_.appendData(data);
    this.socket_.setBufferSize(remaining);

    if (this.currentRequest_.hasEnded()) {
      goog.dispose(this.currentRequest_);
      this.currentRequest_ = null;
    }
  }
};


/**
 * Parses a request header string.
 * @param {string} contents Request header string.
 * @return {!wtf.net.HttpServerRequest} Request object.
 * @private
 */
wtf.net.HttpServerConnection.prototype.parseRequest_ = function(contents) {
  // Grab lines and get the request.
  var lines = contents.split('\r\n');
  var requestLine = lines[0].split(' ');
  var method = requestLine[0];
  var path = requestLine[1];

  // Parse header properties.
  var headers = {};
  for (var n = 1; n < lines.length; n++) {
    if (lines[n].length) {
      var line = lines[n].split(': ');
      headers[line[0]] = line[1];
    }
  }

  return new wtf.net.HttpServerRequest(method, path, headers);
};


/**
 * Forcibly closes the connection.
 */
wtf.net.HttpServerConnection.prototype.abort = function() {
  goog.dispose(this);
};



/**
 * A server-side HTTP request, as sent by a remote client.
 * This is created by a {@see wtf.net.HttpServer} and should not be created
 * directly.
 *
 * @param {string} method HTTP method used (GET/POST/etc).
 * @param {string} path Path of the resource requested.
 * @param {Object.<string>=} opt_headers Parsed HTTP headers.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.net.HttpServerRequest = function(method, path, opt_headers) {
  goog.base(this);

  /**
   * HTTP method used (GET/POST/etc).
   * @type {string}
   * @private
   */
  this.method_ = method;

  /**
   * Path of the resource requested.
   * @type {string}
   * @private
   */
  this.path_ = path;

  /**
   * Parsed HTTP headers.
   * @type {!Object.<string>}
   * @private
   */
  this.headers_ = opt_headers || {};

  var contentLength = this.headers_['Content-Length'] || 0;
  var contentType = this.headers_['Content-Type'] || null;

  /**
   * Request content length, in bytes, if a POST.
   * @type {number}
   * @private
   */
  this.contentLength_ = parseInt(contentLength, 10);

  /**
   * Content MIME type.
   * @type {?string}
   * @private
   */
  this.contentType_ = contentType;

  /**
   * Number of bytes remaining in the request body.
   * @type {number}
   * @private
   */
  this.requestBytesRemaining_ = parseInt(this.contentLength_, 10);
};
goog.inherits(wtf.net.HttpServerRequest, wtf.events.EventEmitter);


/**
 * Gets the request HTTP method ('GET'/'POST'/etc).
 * @return {string} Request HTTP method.
 */
wtf.net.HttpServerRequest.prototype.getMethod = function() {
  return this.method_;
};


/**
 * Gets the request path ('/foo/bar.txt').
 * @return {string} Request path.
 */
wtf.net.HttpServerRequest.prototype.getPath = function() {
  return this.path_;
};


/**
 * Gets the request content length, in bytes.
 * @return {number} Request content length.
 */
wtf.net.HttpServerRequest.prototype.getContentLength = function() {
  return this.contentLength_;
};


/**
 * Gets the request content MIME type, if set.
 * @return {?string} Request content type.
 */
wtf.net.HttpServerRequest.prototype.getContentType = function() {
  return this.contentType_;
};


/**
 * Gets the value of the given header.
 * @param {string} key Header key.
 * @return {*|undefined} Value, if present.
 */
wtf.net.HttpServerRequest.prototype.getHeader = function(key) {
  return this.headers_[key];
};


/**
 * Gets a value indicating whether the request has completed (no more data in
 * POST).
 * @return {boolean} True if the request has completed.
 */
wtf.net.HttpServerRequest.prototype.hasEnded = function() {
  return this.requestBytesRemaining_ == 0;
};


/**
 * Appends a data buffer to the request.
 * @param {!Uint8Array} data Data buffer.
 * @return {number} Total number of bytes remaining in the request.
 */
wtf.net.HttpServerRequest.prototype.appendData = function(data) {
  this.requestBytesRemaining_ -= data.length;
  if (data.length) {
    this.emitEvent(wtf.net.EventType.DATA, data);
  }

  if (!this.requestBytesRemaining_) {
    this.emitEvent(wtf.net.EventType.END);
  }

  return this.requestBytesRemaining_;
};



/**
 * A server-side HTTP response, for sending responses to remote clients.
 *
 * @param {!wtf.net.HttpServerConnection} connection HTTP connection.
 * @param {!wtf.net.Socket} socket Target TCP socket.
 * @param {!wtf.net.HttpServerRequest} request Request.
 * @constructor
 */
wtf.net.HttpServerResponse = function(connection, socket, request) {
  /**
   * HTTP connection.
   * @type {!wtf.net.HttpServerConnection}
   * @private
   */
  this.connection_ = connection;

  /**
   * Target TCP socket.
   * @type {!wtf.net.Socket}
   * @private
   */
  this.socket_ = socket;

  /**
   * HTTP status code.
   * @type {number}
   * @private
   */
  this.statusCode_ = 200;

  /**
   * HTTP reason phrase.
   * @type {string}
   * @private
   */
  this.statusReason_ = 'Mumble';

  /**
   * Accumulated headers.
   * @type {!Object.<string|number>}
   * @private
   */
  this.headers_ = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '99999999'
  };

  // Add headers - must match exactly.
  if (request.headers_['Access-Control-Request-Headers']) {
    this.headers_['Access-Control-Allow-Headers'] =
        request.headers_['Access-Control-Request-Headers'];
  }

  /**
   * Whether the headers have been written.
   * Once written the headers cannot be modified.
   * @type {boolean}
   * @private
   */
  this.hasWrittenHeaders_ = false;

  /**
   * The number of data writes that have occurred.
   * This is used to track whether an end with data is the only write.
   * @type {number}
   * @private
   */
  this.writeCount_ = 0;
};


/**
 * Sets the status code/reason.
 * @param {number} code HTTP status code.
 * @param {string} reason HTTP reason phrase.
 */
wtf.net.HttpServerResponse.prototype.setStatusCode = function(code, reason) {
  goog.asserts.assert(!this.hasWrittenHeaders_);
  this.statusCode_ = code;
  this.statusReason_ = reason;
};


/**
 * Adds headers to the response.
 * If any values already exist they are replaced with the new values.
 * @param {!Object.<string>} headers Header key/value pairs.
 */
wtf.net.HttpServerResponse.prototype.addHeaders = function(headers) {
  goog.asserts.assert(!this.hasWrittenHeaders_);
  for (var key in headers) {
    this.headers_[key] = headers[key];
  }
};


/**
 * Flushes headers to the socket.
 * This can only be called once.
 * @private
 */
wtf.net.HttpServerResponse.prototype.flushHeaders_ = function() {
  if (this.hasWrittenHeaders_) {
    return;
  }
  this.hasWrittenHeaders_ = true;

  var headerLines = [];
  for (var key in this.headers_) {
    headerLines.push(key + ': ' + this.headers_[key]);
  }

  var response = [
    'HTTP/1.1 ' + this.statusCode_ + ' ' + this.statusReason_,
    headerLines.join('\r\n'),
    '',
    ''
  ].join('\r\n');

  var data = wtf.util.convertAsciiStringToUint8Array(response);
  this.socket_.write(data);
};


/**
 * Writes a data buffer to the response.
 * The headers are flushed if required.
 * @param {!Uint8Array} data Data buffer to write.
 */
wtf.net.HttpServerResponse.prototype.write = function(data) {
  this.flushHeaders_();
  this.writeCount_++;

  this.socket_.write(data);
};


/**
 * Ends the response, optionally writing data.
 * If no other data has been written before this and data is provided it will
 * automatically set the Content-Length header.
 * @param {Uint8Array=} opt_data Additional data to write.
 */
wtf.net.HttpServerResponse.prototype.end = function(opt_data) {
  // Update Content-Length based on the data if we have not written anything.
  if (!this.writeCount_) {
    if (opt_data) {
      this.headers_['Content-Length'] = opt_data.byteLength;
    } else {
      this.headers_['Content-Length'] = 0;
    }
  }

  // Flush headers.
  this.flushHeaders_();

  // Write data, if present.
  if (opt_data) {
    this.write(opt_data);
  }
};


/**
 * Aborts the response and connection.
 */
wtf.net.HttpServerResponse.prototype.abort = function() {
  this.connection_.abort();
};
