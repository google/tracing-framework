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
 * @param {!function(!Object)} queueData A function that queues event data for
 *     sending to the target tab.
 * @constructor
 */
var Debugger = function(tabId, pageOptions, queueData) {
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
   * A function that queues event data for sending.
   * @type {!function(!Object)}
   * @private
   */
  this.queueData_ = queueData;

  /**
   * Dispatch for records, keyed by record type.
   * @type {!Object.<function(!Object):Object>}
   * @private
   */
  this.timelineDispatch_ = {};
  this.setupTimelineDispatch_();

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
  if (memoryInfoEnabled === undefined) {
    memoryInfoEnabled = false;
  }
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
 * Sets up the dispatch table for the timeline.
 * @private
 */
Debugger.prototype.setupTimelineDispatch_ = function() {
  // The table of available record types can be found here:
  // http://trac.webkit.org/browser/trunk/Source/WebCore/inspector/front-end/TimelinePresentationModel.js#L70

  // GCEvent: garbage collections.
  this.timelineDispatch_['GCEvent'] = function(record) {
    return {
      'type': 'GCEvent',
      'startTime': record.startTime,
      'endTime': record.endTime,
      //'stackTrace': record.stackTrace,
      'usedHeapSize': record.usedHeapSize,
      'usedHeapSizeDelta': record.data.usedHeapSizeDelta
    };
  };

  // EvaluateScript: script runtime/parsing/etc.
  this.timelineDispatch_['EvaluateScript'] = function(record) {
    return {
      'type': 'EvaluateScript',
      'startTime': record.startTime,
      'endTime': record.endTime,
      'usedHeapSize': record.usedHeapSize,
      'usedHeapSizeDelta': record.data.usedHeapSizeDelta
    };
  };

  // ParseHTML: parsing of HTML in a page.
  this.timelineDispatch_['ParseHTML'] = function(record) {
    return {
      'type': 'ParseHTML',
      'startTime': record.startTime,
      'endTime': record.endTime,
      'length': record.data.length
    };
  };

  // ScheduleStyleRecalculation: a style has been invalidated - expect a
  // RecalculateStyles.
  this.timelineDispatch_['ScheduleStyleRecalculation'] = function(record) {
    return {
      'type': 'ScheduleStyleRecalculation',
      'time': record.startTime
    };
  };

  // RecalculateStyles: style recalculation is occurring.
  this.timelineDispatch_['RecalculateStyles'] = function(record) {
    return {
      'type': 'RecalculateStyles',
      'startTime': record.startTime,
      'endTime': record.endTime
    };
  };

  // InvalidateLayout: DOM layout was invalidated - expect a Layout.
  this.timelineDispatch_['InvalidateLayout'] = function(record) {
    return {
      'type': 'InvalidateLayout',
      'time': record.startTime
    };
  };

  // Layout: DOM layout.
  this.timelineDispatch_['Layout'] = function(record) {
    return {
      'type': 'Layout',
      'startTime': record.startTime,
      'endTime': record.endTime,
      'x': record.data.x,
      'y': record.data.y,
      'width': record.data.width,
      'height': record.data.height,
    };
  };

  // Paint: DOM element painting.
  this.timelineDispatch_['Paint'] = function(record) {
    return {
      'type': 'Paint',
      'startTime': record.startTime,
      'endTime': record.endTime,
      'x': record.data.x,
      'y': record.data.y,
      'width': record.data.width,
      'height': record.data.height,
    };
  };

  // CompositeLayers: the compositor ran and composited the page.
  this.timelineDispatch_['CompositeLayers'] = function(record) {
    return {
      'type': 'CompositeLayers',
      'startTime': record.startTime,
      'endTime': record.endTime
    };
  };

  // DecodeImage: a compressed image was decoded.
  this.timelineDispatch_['DecodeImage'] = function(record) {
    return {
      'type': 'DecodeImage',
      'startTime': record.startTime,
      'endTime': record.endTime,
      'imageType': record.data.imageType
    };
  };

  // ResizeImage: a resized version of a decoded image was required.
  this.timelineDispatch_['ResizeImage'] = function(record) {
    return {
      'type': 'ResizeImage',
      'startTime': record.startTime,
      'endTime': record.endTime,
      'cached': record.data.cached
    };
  };

  // TODO(benvanik): explore adding the other types:
  // ResourceSendRequest
  // ResourceReceiveResponse
  // ResourceFinish
  // ResourceReceivedData
  // ScrollLayer
  // Program (may be good to show as a heatmap?)
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
  // Handle the record.
  var dispatch = this.timelineDispatch_[record.type];
  if (dispatch) {
    var data = dispatch(record);
    if (data) {
      this.queueData_(data);
    }
  }

  // Recursively check children.
  if (record.children) {
    for (var n = 0; n < record.children.length; n++) {
      this.processTimelineRecord_(record.children[n]);
    }
  }
};
