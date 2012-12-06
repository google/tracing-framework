/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Extended info data proxy.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


/**
 * Extended info data proxy.
 * This connects to a tab and sets up extended info sources that are used for
 * reading out extra data about a tab. The events are then piped through to the
 * injected page for use in the data stream.
 *
 * @param {number} tabId Tab ID.
 * @param {!Port} port Message port.
 * @param {!Object} pageOptions Page options.
 * @constructor
 */
var ExtendedInfo = function(tabId, port, pageOptions) {
  /**
   * Target tab ID.
   * @type {number}
   * @private
   */
  this.tabId_ = tabId;

  /**
   * Message port opened to the tab content script.
   * @type {!Port}
   * @private
   */
  this.port_ = port;

  /**
   * Page options.
   * @type {!Object}
   * @private
   */
  this.pageOptions_ = pageOptions;

  /**
   * Debugger source, if enabled.
   * @type {Debugger}
   * @private
   */
  this.debugger_ = null;

  /**
   * Data pending send.
   * @type {!Array.<!Object>}
   * @private
   */
  this.queuedData_ = [];

  /**
   * Registered event handlers.
   * @type {!Object}
   * @private
   */
  this.eventHandlers_ = {
    onDisconnect: this.dispose.bind(this)
  };

  // Listen for disconnects.
  port.onDisconnect.addListener(this.eventHandlers_.onDisconnect);

  if (pageOptions['wtf.trace.provider.javascript']) {
    this.debugger_ = new Debugger(this.tabId_, this.queueData.bind(this));
  }
};


/**
 * Detaches the info source from the target tab.
 * After this is called the source should be discarded.
 */
ExtendedInfo.prototype.dispose = function() {
  if (this.debugger_) {
    this.debugger_.dispose();
  }

  this.port_.onDisconnect.removeListener(this.eventHandlers_.onDisconnect);
};


/**
 * Gets the tab ID of the target page.
 * @return {number} Tab ID.
 */
ExtendedInfo.prototype.getTabId = function() {
  return this.tabId_;
};


/**
 * Queues event data for sending to the target tab.
 * @param {!Object} data Event data.
 */
ExtendedInfo.prototype.queueData = function(data) {
  this.queuedData_.push(data);

  // TODO(benvanik): delay flush for a bit? 100ms? etc?
  this.flush();
};


/**
 * Flushes all pending event data to the target tab.
 */
ExtendedInfo.prototype.flush = function() {
  // Send all pending data to the target tab content script.
  this.port_.postMessage({
    'command': 'trace_events',
    'contents': this.queuedData_
  });

  this.queuedData_.length = 0;
};
