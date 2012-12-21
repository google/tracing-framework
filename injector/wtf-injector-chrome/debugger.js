/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Debugger data proxy.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


/**
 * Debugger data proxy.
 * This connects to a tab and sets up a debug session that is used for reading
 * out events from the page.
 *
 * @param {number} tabId Tab ID.
 * @param {!function(!Object)} queueData A function that queues event data for
 *     sending to the target tab.
 * @constructor
 */
var Debugger = function(tabId, queueData) {
  /**
   * Target tab ID.
   * @type {number}
   * @private
   */
  this.tabId_ = tabId;

  /**
   * Target debugee.
   * @type {!Object}
   * @private
   */
  this.debugee_ = {
    tabId: this.tabId_
  };

  /**
   * A function that queues event data for sending.
   * @type {!function(!Object)}
   * @private
   */
  this.queueData_ = queueData;

  /**
   * Whether this debugger is attached.
   * @type {boolean}
   */
  this.attached_ = false;

  /**
   * Registered event handlers.
   * @type {!Object}
   * @private
   */
  this.eventHandlers_ = {
    onEvent: this.onEvent_.bind(this),
    onDetach: this.onDetach_.bind(this)
  };

  // Attach to the target tab.
  chrome.debugger.attach(this.debugee_, '1.0', (function() {
    this.attached_ = true;
    this.beginListening_();
  }).bind(this));

  // Listen for incoming debugger events.
  chrome.debugger.onEvent.addListener(this.eventHandlers_.onEvent);

  // Listen for detaches. These are either from us or from the dev tools
  // being attached to a page.
  chrome.debugger.onDetach.addListener(this.eventHandlers_.onDetach);
};


/**
 * Detaches the debugger from the tab.
 */
Debugger.prototype.dispose = function() {
  if (this.attached_) {
    this.attached_ = false;
    chrome.debugger.detach(this.debugee_);
  }

  chrome.debugger.onEvent.removeListener(this.eventHandlers_.onEvent);
  chrome.debugger.onDetach.removeListener(this.eventHandlers_.onDetach);
};


/**
 * Handles incoming debugger detaches.
 * @param {!{tabId: number}} source Source tab.
 * @private
 */
Debugger.prototype.onDetach_ = function(source) {
  if (source.tabId != this.debugee_.tabId) {
    return;
  }
  if (!this.attached_) {
    return;
  }
  this.attached_ = false;
  this.dispose();
};


/**
 * Begins listening for debugger events.
 * @private
 */
Debugger.prototype.beginListening_ = function() {
  chrome.debugger.sendCommand(this.debugee_, 'Timeline.start', {
    // Limit call stack depth to keep messages small - if we ever need this
    // data this can be increased.
    'maxCallStackDepth': 1
  });
};


/**
 * Handles incoming debugger events.
 * @param {!{tabId: number}} source Source tab.
 * @param {string} method Remote debugger method name.
 * @param {!Object} params Parameters.
 * @private
 */
Debugger.prototype.onEvent_ = function(source, method, params) {
  if (source.tabId != this.debugee_.tabId) {
    return;
  }

  function logRecord(record, indent) {
    indent += '  ';
    console.log(indent + record.type);
    if (record.children) {
      for (var n = 0; n < record.children.length; n++) {
        logRecord(record.children[n], indent);
      }
    }
  }

  switch (method) {
    case 'Timeline.eventRecorded':
      var record = params['record'];
      this.processTimelineRecord_(record);
      //logRecord(record, '');
      break;
  }
};


/**
 * Processes a timeline record and generates event data.
 * @param {!Object} record Timeline record.
 * @private
 */
Debugger.prototype.processTimelineRecord_ = function(record) {
  // Extract GCs.
  if (record.type == 'GCEvent') {
    var data = {
      'type': 'GCEvent',
      'startTime': record.startTime,
      'endTime': record.endTime,
      //'stackTrace': record.stackTrace,
      'usedHeapSize': record.usedHeapSize,
      'usedHeapSizeDelta': record.data.usedHeapSizeDelta
    };
    this.queueData_(data);
  } else if (record.type == 'EvaluateScript') {
    var data = {
      'type': 'EvaluateScript',
      'startTime': record.startTime,
      'endTime': record.endTime,
      'usedHeapSize': record.usedHeapSize,
      'usedHeapSizeDelta': record.data.usedHeapSizeDelta
    };
    this.queueData_(data);
  }

  // Recursively check children.
  if (record.children) {
    for (var n = 0; n < record.children.length; n++) {
      this.processTimelineRecord_(record.children[n]);
    }
  }
};
