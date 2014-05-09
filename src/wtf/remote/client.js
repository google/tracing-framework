/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Remote control client.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.remote.Client');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('wtf.data.ContextInfo');
goog.require('wtf.io.Blob');
goog.require('wtf.trace');
goog.require('wtf.trace.ISessionListener');



/**
 * Remote control client.
 * This connects to an remote server to control tracing.
 *
 * @param {!wtf.trace.TraceManager} traceManager Prepared trace manager.
 * @param {!wtf.util.Options} options Options.
 * @constructor
 * @extends {goog.Disposable}
 * @implements {wtf.trace.ISessionListener}
 */
wtf.remote.Client = function(traceManager, options) {
  goog.base(this);

  /**
   * Web socket, if connecting or connected.
   * @type {WebSocket}
   * @private
   */
  this.socket_ = null;

  /**
   * HUD buttons to be sent to the server.
   * @type {!Array.<!Object>}
   * @private
   */
  this.providerButtons_ = [];

  // Run through providers and get any buttons/etc we need.
  // We send these over the wire and handle the RPCs.
  var providers = traceManager.getProviders();
  for (var n = 0; n < providers.length; n++) {
    var provider = providers[n];
    var buttons = provider.getHudButtons();
    for (var m = 0; m < buttons.length; m++) {
      this.providerButtons_.push(buttons[m]);
    }
  }

  // TODO(benvanik): add DOM status box

  // Start connecting.
  var uri = options.getOptionalString('wtf.remote.target');
  goog.asserts.assert(uri);
  if (!uri) {
    throw new Error('wtf.remote.target must be specified');
  }
  this.connect_(uri);
};
goog.inherits(wtf.remote.Client, goog.Disposable);


/**
 * @override
 */
wtf.remote.Client.prototype.disposeInternal = function() {
  // TODO(benvanik): remove DOM status box

  // Close socket.
  this.disconnect_();

  goog.base(this, 'disposeInternal');
};


/**
 * Starts connecting to a remote host.
 * @param {string} uri Websocket URI.
 * @private
 */
wtf.remote.Client.prototype.connect_ = function(uri) {
  goog.asserts.assert(!this.socket_);

  // Create the socket.
  // TODO(benvanik): create raw once there is a WebSocketProvider.
  var socket = this.socket_ = new WebSocket(uri);
  socket.binaryType = 'arraybuffer';

  // We avoid using EventHandler so that we can be sure we aren't instrumented.
  var self = this;

  socket.onopen = wtf.trace.ignoreListener(function() {
    // Grab context info.
    var contextInfoJson = wtf.data.ContextInfo.detect().serialize();

    // Setup commands list.
    var commandsJson = [
      {
        'name': 'clear_snapshot',
        'title': 'Clear Snapshot',
        'tooltip': 'Reset snapshot data.'
      },
      {
        'name': 'save_snapshot',
        'title': 'Save Snapshot',
        'tooltip': 'Save snapshot data to a file.'
      }
    ];
    // TODO(benvanik): add provider buttons.
    //this.providerButtons_

    // Send over a hello packet to let the server know who we are and what
    // we support.
    var packet = {
      'command': 'hello',
      'client_type': 'tracer',
      'context_info': contextInfoJson,
      'commands': commandsJson
    };
    socket.send(goog.global.JSON.stringify(packet));
  });

  socket.onerror = wtf.trace.ignoreListener(function(error) {
    goog.global.console.log('remote socket error', error);
  });

  socket.onclose = wtf.trace.ignoreListener(function(e) {
    goog.dispose(self);
  });

  socket.onmessage = wtf.trace.ignoreListener(function(e) {
    var data = /** @type {Object} */ (goog.global.JSON.parse(e.data));
    if (!data) {
      return;
    }
    switch (data['command']) {
      case 'execute':
        self.executeCommand_(data);
        break;
    }
  });
};


/**
 * Disconnects and cleans up the current socket, if any.
 * @private
 */
wtf.remote.Client.prototype.disconnect_ = function() {
  if (!this.socket_) {
    return;
  }
  var socket = this.socket_;
  this.socket_ = null;

  socket.close();

  socket.onopen = null;
  socket.onerror = null;
  socket.onclose = null;
  socket.onmessage = null;
};


/**
 * Executes a command from a remote controller.
 * @param {!Object} data JSON parsed command object.
 * @private
 */
wtf.remote.Client.prototype.executeCommand_ = function(data) {
  var response = {
    'command': 'response',
    'id': data['source_id'],
    'req_id': data['req_id'],
    'name': data['name']
  };
  var responseBuffers = [];

  switch (data['name']) {
    case 'clear_snapshot':
      wtf.trace.reset();
      break;
    case 'save_snapshot':
      // TODO(benvanik): use snapshotAll (or some future API).
      wtf.trace.snapshot(responseBuffers);
      for (var n = 0; n < responseBuffers.length; n++) {
        responseBuffers[n] = wtf.io.Blob.toNative(responseBuffers[n]);
      }
      response['filename'] = wtf.trace.getTraceFilename();
      response['mimeType'] = 'application/x-extension-wtf-trace';
      break;
    default:
      // Not a built-in - check provider buttons.
      // TODO(benvanik): provider buttons.
      break;
  }

  // Send the JSON response first.
  response['buffer_count'] = responseBuffers.length;
  this.socket_.send(goog.global.JSON.stringify(response));

  // If there are any buffers, send each in its own packet.
  // We do this so that we avoid JSONifying the buffer data.
  for (var n = 0; n < responseBuffers.length; n++) {
    this.socket_.send(responseBuffers[n]);
  }
};


/**
 * @override
 */
wtf.remote.Client.prototype.sessionStarted = function(session) {
  //
};


/**
 * @override
 */
wtf.remote.Client.prototype.sessionStopped = function(session) {
  //
};


/**
 * @override
 */
wtf.remote.Client.prototype.requestSnapshots = goog.nullFunction;


/**
 * @override
 */
wtf.remote.Client.prototype.reset = goog.nullFunction;
