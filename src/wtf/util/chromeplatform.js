/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Chrome extension platform abstraction layer.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.util.ChromePlatform');

goog.require('wtf.net.ListenSocket');
goog.require('wtf.net.Socket');
goog.require('wtf.util.IPlatform');



/**
 * Chrome extension platform abstraction layer implementation.
 * @constructor
 * @implements {wtf.util.IPlatform}
 */
wtf.util.ChromePlatform = function() {
};


/**
 * @override
 */
wtf.util.ChromePlatform.prototype.getWorkingDirectory = function() {
  throw new Error();
};


/**
 * @override
 */
wtf.util.ChromePlatform.prototype.readTextFile = function(path) {
  throw new Error();
};


/**
 * @override
 */
wtf.util.ChromePlatform.prototype.readBinaryFile = function(path) {
  throw new Error();
};


/**
 * @override
 */
wtf.util.ChromePlatform.prototype.writeTextFile = function(path, contents) {
  throw new Error();
};


/**
 * @override
 */
wtf.util.ChromePlatform.prototype.writeBinaryFile = function(path, contents) {
  throw new Error();
};


/**
 * @override
 */
wtf.util.ChromePlatform.prototype.getNetworkInterfaces = function(
    callback, opt_scope) {
  chrome.socket.getNetworkList(function(interfaces) {
    var results = [];
    for (var n = 0; n < interfaces.length; n++) {
      results.push({
        name: interfaces[n]['name'],
        address: interfaces[n]['address']
      });
    }
    callback.call(opt_scope, results);
  });
};


/**
 * @override
 */
wtf.util.ChromePlatform.prototype.createListenSocket =
    function(port, opt_hostname) {
  return new wtf.util.ChromePlatform.ListenSocket_(port, opt_hostname);
};



/**
 * Chrome TCP listen socket.
 *
 * @param {number} port TCP port to listen on.
 * @param {string=} opt_hostname Hostname; omit to use 'localhost'.
 * @constructor
 * @extends {wtf.net.ListenSocket}
 * @private
 */
wtf.util.ChromePlatform.ListenSocket_ = function(port, opt_hostname) {
  goog.base(this);

  /**
   * Local TCP port.
   * @type {number}
   * @private
   */
  this.port_ = port;

  /**
   * Local interface name/IP.
   * @type {string}
   * @private
   */
  this.hostname_ = opt_hostname || '127.0.0.1';

  /**
   * Socket ID.
   * May be unset or set but not ready.
   * @type {number|undefined}
   * @private
   */
  this.socketId_ = undefined;

  // TODO(benvanik): query adapters, listen on each
  //     chrome.socket.getNetworkList

  // Start socket creation chain.
  chrome.socket.create(
      'tcp', {}, goog.bind(this.socketCreated_, this));
};
goog.inherits(wtf.util.ChromePlatform.ListenSocket_, wtf.net.ListenSocket);


/**
 * @override
 */
wtf.util.ChromePlatform.ListenSocket_.prototype.disposeInternal = function() {
  // Destroy socket.
  if (this.socketId_ !== undefined) {
    chrome.socket.destroy(this.socketId_);
  }
  this.socketId_ = undefined;

  goog.base(this, 'disposeInternal');
};


/**
 * Handles socket creation events.
 * @param {!Object} socketInfo Socket information.
 * @private
 */
wtf.util.ChromePlatform.ListenSocket_.prototype.socketCreated_ =
    function(socketInfo) {
  var socketId = socketInfo['socketId'];
  this.socketId_ = socketId;

  chrome.socket.listen(
      this.socketId_,
      this.hostname_,
      this.port_,
      goog.bind(this.socketListening_, this));
};


/**
 * Handles socket listening acks.
 * @param {number} result Result code.
 * @private
 */
wtf.util.ChromePlatform.ListenSocket_.prototype.socketListening_ =
    function(result) {
  if (result < 0) {
    // Failed.
    window.console.log(
        'failed to listen on ' + this.hostname_ + ':' + this.port_ +
        ' - already in use?');
    goog.dispose(this);
    return;
  }

  // Start accepting.
  // Note that accept must be called again after each accept.
  this.requestAccept_();
};


/**
 * Requests an accept callback.
 * This must be called after every accept.
 * @private
 */
wtf.util.ChromePlatform.ListenSocket_.prototype.requestAccept_ = function() {
  if (this.socketId_ === undefined) {
    return;
  }
  chrome.socket.accept(this.socketId_, goog.bind(this.socketAccepted_, this));
};


/**
 * Handles client socket accept callbacks.
 * @param {!Object} acceptInfo Accept info.
 * @private
 */
wtf.util.ChromePlatform.ListenSocket_.prototype.socketAccepted_ =
    function(acceptInfo) {
  // Always queue another accept callback.
  this.requestAccept_();

  // Check for failure.
  if (acceptInfo['result'] < 0 || acceptInfo['socketId'] === undefined) {
    // Failed.
    window.console.log('failed to accept socket');
    goog.dispose(this);
    return;
  }

  // Create socket.
  var socket = new wtf.util.ChromePlatform.Socket_(acceptInfo['socketId']);
  this.emitConnection(socket);
};



/**
 * Chrome TCP client socket.
 *
 * @param {number} socketId Socket ID.
 * @constructor
 * @extends {wtf.net.Socket}
 * @private
 */
wtf.util.ChromePlatform.Socket_ = function(socketId) {
  goog.base(this);

  /**
   * Socket ID.
   * @type {number}
   * @private
   */
  this.socketId_ = socketId;

  /**
   * Whether the socket is opened.
   * @type {boolean}
   * @private
   */
  this.isOpen_ = true;

  /**
   * Read buffer size.
   * @type {number}
   * @private
   */
  this.bufferSize_ = 0;

  this.requestRead_();
};
goog.inherits(wtf.util.ChromePlatform.Socket_, wtf.net.Socket);


/**
 * @override
 */
wtf.util.ChromePlatform.Socket_.prototype.disposeInternal = function() {
  // Notify
  if (!this.isOpen_) {
    this.isOpen_ = false;
    this.emitClose();
  }

  // Destroy socket.
  chrome.socket.destroy(this.socketId_);

  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.util.ChromePlatform.Socket_.prototype.setBufferSize = function(value) {
  this.bufferSize_ = value;
};


/**
 * Requests a read from the socket.
 * This should be fired after ever read callback.
 * @param {number=} opt_bufferSize Buffer size.
 * @private
 */
wtf.util.ChromePlatform.Socket_.prototype.requestRead_ =
    function(opt_bufferSize) {
  var bufferSize = opt_bufferSize || this.bufferSize_;
  bufferSize = Math.min(bufferSize, 16 * 1024 * 1024);
  if (!bufferSize) {
    bufferSize = undefined;
  }
  chrome.socket.read(this.socketId_, bufferSize,
      goog.bind(this.socketRead_, this));
};


/**
 * Handles socket read events.
 * @param {!Object} readInfo Read information.
 * @private
 */
wtf.util.ChromePlatform.Socket_.prototype.socketRead_ = function(readInfo) {
  // Check failure.
  if (readInfo['resultCode'] < 0) {
    // Failed - assume disconnected.
    this.dispose();
    return;
  }

  // Ignore dummy packets.
  if (readInfo['data'].byteLength == 0) {
    return;
  }

  // Grab data for parsing.
  var data = new Uint8Array(readInfo['data']);
  this.emitData(data);

  // Keep the read chain going.
  // TODO(benvanik): somehow get a 'read amount' from the listeners.
  this.requestRead_();
};


/**
 * @override
 */
wtf.util.ChromePlatform.Socket_.prototype.write = function(data) {
  var buffer = data.buffer;
  chrome.socket.write(this.socketId_, buffer, goog.bind(function(writeInfo) {
    if (writeInfo['bytesWritten'] < 0) {
      // Failed - assume disconnected.
      goog.dispose(this);
      return;
    }
  }, this));
};
