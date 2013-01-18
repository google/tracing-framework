/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Tracing data proxy.
 *
 * @author benvanik@google.com (Ben Vanik)
 */



/**
 * Tracing data proxy.
 * This allows a tab to enable chrome:tracing data in its session using the
 * remote debugger API. The Chrome instance must have been launched with
 * --remote-debugging-port=9222.
 *
 * @constructor
 */
var Tracer = function() {
  // TODO(benvanik): make an option?
  var port = 9222;
  var url = 'ws://localhost:' + port + '/devtools/browser';

  /**
   * Whether tracing is available at all.
   * @type {boolean}
   * @private
   */
  this.available_ = false;

  /**
   * Whether the tracing is active.
   * @type {boolean}
   * @private
   */
  this.active_ = false;

  /**
   * Tab ID that requested the tracing.
   * This is used to shut down tracing when the tab closes.
   * @type {number|undefined}
   * @private
   */
  this.requestingTabId_ = undefined;

  /**
   * Next request ID.
   * @type {number}
   * @private
   */
  this.nextRequestId_ = 0;

  /**
   * Pending get requests.
   * @type {!Object.<number, {callback: function(Object), scope: Object}>}
   * @private
   */
  this.pendingGets_ = {};

  /**
   * Web socket connected to the browser debug channel.
   * @type {WebSocket}
   * @private
   */
  this.socket_ = new WebSocket(url);
  this.socket_.onopen = (function(e) {
    // TODO(benvanik): query if tracing is available?
    this.available_ = true;
  }).bind(this);
  this.socket_.onmessage = (function(e) {
    // TODO(benvanik): use regex instead?
    var data = JSON.parse(e.data);
    var id = data['id'];
    var pendingGet = this.pendingGets_[id];
    if (pendingGet) {
      delete this.pendingGets_[id];
      var result = null;
      if (!data['error']) {
        result = data['response']['result'];
      }
      pendingGet.callback.call(pendingGet.scope, result);
    }
  }).bind(this);
  this.socket_.onerror = (function(e) {
    console.log('Tracer: unable to connect');
    this.dispose();
  }).bind(this);
  this.socket_.onclose = (function(e) {
    this.dispose();
  }).bind(this);
};


/**
 * Cleans up the tracing feature.
 */
Tracer.prototype.dispose = function() {
  this.stop();

  this.available_ = false;
  if (this.socket_) {
    this.socket_.close();
    this.socket_ = null;
  }
};


/**
 * Gets a value indicating whether tracing is available.
 * @return {boolean} True if available.
 */
Tracer.prototype.isAvailable = function() {
  return this.available_
};


/**
 * Gets a value indicating whether tracing is active.
 * @return {boolean} True if active.
 */
Tracer.prototype.isActive = function() {
  return this.active_;
};


/**
 * Starts tracing.
 * @param {number=} opt_tabId Requesting tab ID.
 */
Tracer.prototype.start = function(opt_tabId) {
  if (!this.available_) {
    return;
  }

  this.active_ = true;
  this.requestingTabId_ = opt_tabId || null;
  this.socket_.send(JSON.stringify({
    'id': this.nextRequestId_++,
    'method': 'Tracing.start'
  }));
};


/**
 * Stops tracing.
 * @param {function(this:T, Object)=} opt_callback A callback to get the
 *     tracing data. Arg will be null if no data was available.
 * @param {T=} opt_scope Callback scope.
 * @template T
 */
Tracer.prototype.stop = function(opt_callback, opt_scope) {
  if (!this.available_ || !this.active_) {
    if (opt_callback) {
      opt_callback.call(opt_scope, null);
    }
    return;
  }

  this.active_ = false;
  this.requestingTabId_ = undefined;
  this.socket_.send(JSON.stringify({
    'id': this.nextRequestId_++,
    'method': 'Tracing.end'
  }));

  if (opt_callback) {
    this.pendingGets_[this.nextRequestId_] = {
      callback: opt_callback,
      scope: opt_scope || null
    };
    this.socket_.send(JSON.stringify({
      'id': this.nextRequestId_++,
      'method': 'Tracing.getTraceAndReset'
    }));
  }
};


/**
 * Stops tracing and resets the data.
 * @param {number=} opt_tabId Requesting tab ID.
 */
Tracer.prototype.abort = function(opt_tabId) {
  if (this.requestingTabId_ !== opt_tabId) {
    return;
  }
  this.stop();
};
