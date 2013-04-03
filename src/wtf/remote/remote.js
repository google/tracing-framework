/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Remote connection utilities.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.remote');

goog.require('wtf.remote.Client');
goog.require('wtf.trace');


/**
 * Current client.
 * Initialized by {@see wtf.remote#connect}.
 * @type {wtf.remote.Client}
 * @private
 */
wtf.remote.client_ = null;


/**
 * Connects this script to the target URI for remote control.
 * The current tracing session will be used if it exists.
 *
 * This will call {@see wtf.trace#prepare} if it has not already been called.
 *
 * @param {Object=} opt_options Options overrides.
 */
wtf.remote.connect = function(opt_options) {
  // Call prepare just in case.
  wtf.trace.prepare(opt_options);
  var traceManager = wtf.trace.getTraceManager();

  // Disconect any previous client.
  wtf.remote.disconnect();

  // Get combined options.
  var options = traceManager.getOptions(opt_options);

  // Start the connection.
  wtf.remote.client_ = new wtf.remote.Client(traceManager, options);
};


/**
 * Disconnects from the remote target.
 */
wtf.remote.disconnect = function() {
  if (!wtf.remote.client_) {
    return;
  }

  // Dispose it - if it's currently connecting/connected it'll all be cleaned
  // up correctly.
  goog.dispose(wtf.remote.client_);
  wtf.remote.client_ = null;
};


/**
 * Whether this script is connected.
 * This will be true after a call to {@see wtf.remote#connect} even if the
 * connection is not yet established.
 * @return {boolean} True if this script is connected to a remote host.
 */
wtf.remote.isConnected = function() {
  return !!wtf.remote.client_;
};
