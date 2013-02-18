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
 * @param {!Object} pageOptions Page options.
 * @constructor
 */
var Debugger = function(tabId, pageOptions) {
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
   * Page options.
   * @type {!Object}
   * @private
   */
  this.pageOptions_ = pageOptions;

  /**
   * A list of timeline records that have been recorded.
   * @type {!Array.<!Array>}
   * @private
   */
  this.records_ = [];

  /**
   * Whether this debugger is attached.
   * @type {boolean}
   * @private
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

  /**
   * Interval ID used for polling memory statistics.
   * @type {number|null}
   * @private
   */
  this.memoryPollIntervalId_ = null;

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
  if (this.memoryPollIntervalId_ !== null) {
    window.clearInterval(this.memoryPollIntervalId_);
    this.memoryPollIntervalId_ = null;
  }

  if (this.attached_) {
    this.attached_ = false;
    chrome.debugger.detach(this.debugee_);
  }

  chrome.debugger.onEvent.removeListener(this.eventHandlers_.onEvent);
  chrome.debugger.onDetach.removeListener(this.eventHandlers_.onDetach);

  this.records_.length = 0;
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
  var timelineEnabled =
      this.pageOptions_['wtf.trace.provider.browser.timeline'];
  if (timelineEnabled === undefined) {
    timelineEnabled = true;
  }
  if (timelineEnabled) {
    chrome.debugger.sendCommand(this.debugee_, 'Timeline.start', {
      // Limit call stack depth to keep messages small - if we ever need this
      // data this can be increased.
      'maxCallStackDepth': 0
    });
  }

  var memoryInfoEnabled =
      this.pageOptions_['wtf.trace.provider.browser.memoryInfo'];
  if (memoryInfoEnabled) {
    this.startMemoryPoll_();
  }
};


/**
 * Starts polling for memory information.
 * @private
 */
Debugger.prototype.startMemoryPoll_ = function() {
  function printTree(entry, depth) {
    var pad = '';
    for (var n = 0; n < depth; n++) {
      pad += '  ';
    }
    console.log(pad + entry.name + ' (' + entry.size + 'b)');
    if (entry.children) {
      for (var n = 0; n < entry.children.length; n++) {
        printTree(entry.children[n], depth + 1);
      }
    }
  }

  this.memoryPollIntervalId_ = window.setInterval((function() {
    chrome.debugger.sendCommand(this.debugee_,
        'Memory.getProcessMemoryDistribution', {
          'reportGraph': false
        }, function(results) {
          if (results && results.distribution) {
            printTree(results.distribution, 0);
          }
        });
  }).bind(this), 1000);
};


/**
 * A table of record types to functions that convert them into efficient(ish)
 * records for storage/transmission.
 * @type {!Object.<function(!Object):!Array>}
 * @private
 */
Debugger.TIMELINE_DISPATCH_ = (function() {
  // The table of available record types can be found here:
  // http://trac.webkit.org/browser/trunk/Source/WebCore/inspector/front-end/TimelinePresentationModel.js#L70

  var dispatch = {};

  // GCEvent: garbage collections.
  dispatch['GCEvent'] = function(record) {
    return [
      'GCEvent',
      record.startTime,
      record.endTime,
      record.usedHeapSize,
      record.data.usedHeapSizeDelta
    ];
  };

  // EvaluateScript: script runtime/parsing/etc.
  dispatch['EvaluateScript'] = function(record) {
    return [
      'EvaluateScript',
      record.startTime,
      record.endTime,
      record.usedHeapSize,
      record.data.usedHeapSizeDelta
    ];
  };

  // ParseHTML: parsing of HTML in a page.
  dispatch['ParseHTML'] = function(record) {
    return [
      'ParseHTML',
      record.startTime,
      record.endTime,
      record.data.length
    ];
  };

  // ScheduleStyleRecalculation: a style has been invalidated - expect a
  // RecalculateStyles.
  dispatch['ScheduleStyleRecalculation'] = function(record) {
    return [
      'ScheduleStyleRecalculation',
      record.startTime
    ];
  };

  // RecalculateStyles: style recalculation is occurring.
  dispatch['RecalculateStyles'] = function(record) {
    return [
      'RecalculateStyles',
      record.startTime,
      record.endTime
    ];
  };

  // InvalidateLayout: DOM layout was invalidated - expect a Layout.
  dispatch['InvalidateLayout'] = function(record) {
    return [
      'InvalidateLayout',
      record.startTime
    ];
  };

  // Layout: DOM layout.
  dispatch['Layout'] = function(record) {
    return [
      'Layout',
      record.startTime,
      record.endTime,
      record.data.x,
      record.data.y,
      record.data.width,
      record.data.height,
    ];
  };

  // Paint: DOM element painting.
  dispatch['Paint'] = function(record) {
    return [
      'Paint',
      record.startTime,
      record.endTime,
      record.data.x,
      record.data.y,
      record.data.width,
      record.data.height,
    ];
  };

  // CompositeLayers: the compositor ran and composited the page.
  dispatch['CompositeLayers'] = function(record) {
    return [
      'CompositeLayers',
      record.startTime,
      record.endTime
    ];
  };

  // DecodeImage: a compressed image was decoded.
  dispatch['DecodeImage'] = function(record) {
    return [
      'DecodeImage',
      record.startTime,
      record.endTime,
      record.data.imageType
    ];
  };

  // ResizeImage: a resized version of a decoded image was required.
  dispatch['ResizeImage'] = function(record) {
    return [
      'ResizeImage',
      record.startTime,
      record.endTime,
      record.data.cached
    ];
  };

  // TODO(benvanik): explore adding the other types:
  // ResourceSendRequest
  // ResourceReceiveResponse
  // ResourceFinish
  // ResourceReceivedData
  // ScrollLayer
  // Program (may be good to show as a heatmap?)

  return dispatch;
})();


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
  // Handle the record.
  var dispatch = Debugger.TIMELINE_DISPATCH_[record.type];
  if (dispatch) {
    this.records_.push(dispatch(record));
  }

  // Recursively check children.
  if (record.children) {
    for (var n = 0; n < record.children.length; n++) {
      this.processTimelineRecord_(record.children[n]);
    }
  }
};


/**
 * Gets the list of all records.
 * @return {!Array.<!Array>} Records.
 */
Debugger.prototype.getRecords = function() {
  return this.records_;
};


/**
 * Clears all recorded records.
 */
Debugger.prototype.clearRecords = function() {
  this.records_.length = 0;
};
