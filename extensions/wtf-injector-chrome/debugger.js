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
 * Shared dispatch table for debugger events.
 * Modern Chromes only allow a single event handler to be registered on
 * chrome.debugger, so we have to map it back to the right place here.
 * @constructor
 */
var DebuggerDispatchTable = function() {
  /**
   * Total number of attached debugger instances.
   * @type {number}
   * @private
   */
  this.count_ = 0;

  /**
   * Registered tabs, mapped by tab ID.
   * @type {!Object.<number, !Debugger>}
   * @private
   */
  this.tabs_ = {};

  /**
   * Registered event handlers.
   * @type {!Object}
   * @private
   */
  this.eventHandlers_ = {
    onEvent: this.onEvent_.bind(this),
    onDetach: this.onDetach_.bind(this)
  };
};


/**
 * Registers a debugger instance.
 * @param {number} tabId Tab ID being debugged.
 * @param {!Debugger} target Debugger instance to send events to.
 */
DebuggerDispatchTable.prototype.register = function(tabId, target) {
  if (this.tabs_[tabId]) {
    // Replacing?
    this.count_--;
  }
  this.tabs_[tabId] = target;

  this.count_++;
  if (this.count_ == 1) {
    try {
      chrome.debugger.onEvent.addListener(this.eventHandlers_.onEvent);
      chrome.debugger.onDetach.addListener(this.eventHandlers_.onDetach);
    } catch (e) {
      // I'd rather try and fail to get a debugger attached than kill the app.
      // Terrible API.
      console.log('Unable to add debugger event listeners.');
    }
  }
};


/**
 * Unregisters a debugger instance.
 * @param {number} tabId Tab ID being debugged.
 */
DebuggerDispatchTable.prototype.unregister = function(tabId) {
  if (!this.tabs_[tabId]) {
    return;
  }
  delete this.tabs_[tabId];

  this.count_--;
  if (!this.count_) {
    chrome.debugger.onEvent.removeListener(this.eventHandlers_.onEvent);
    chrome.debugger.onDetach.removeListener(this.eventHandlers_.onDetach);
  }
};


/**
 * Handles incoming debugger events.
 * @param {!{tabId: number}} source Source tab.
 * @param {string} method Remote debugger method name.
 * @param {!Object} params Parameters.
 * @private
 */
DebuggerDispatchTable.prototype.onEvent_ = function(source, method, params) {
  var target = this.tabs_[source.tabId];
  if (!target) {
    return;
  }
  target.onEvent_(method, params);
};


/**
 * Handles incoming debugger detaches.
 * @param {!{tabId: number}} source Source tab.
 * @private
 */
DebuggerDispatchTable.prototype.onDetach_ = function(source) {
  var target = this.tabs_[source.tabId];
  if (!target) {
    return;
  }
  target.onDetach_();
};



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
   * Interval ID used for polling memory statistics.
   * @type {number|null}
   * @private
   */
  this.memoryPollIntervalId_ = null;

  /**
   * The time of the first GC event inside of an event tree.
   * Frequently the timeline will send 2-3 GC events with the same time.
   * De-dupe those by tracking the first GC and ignoring the others.
   * @type {number}
   * @private
   */
  this.lastGcStartTime_ = 0;

  // Register us for dispatch.
  Debugger.dispatchTable_.register(this.tabId_, this);

  // Attach to the target tab.
  try {
    chrome.debugger.attach(this.debugee_, '1.0', (function() {
      this.attached_ = true;
      this.beginListening_();
    }).bind(this));
  } catch (e) {
    // This is likely an exception saying the debugger is already attached,
    // as Chrome has started throwing this in some versions. There's seriously
    // like 10 different ways they report errors like this and it's different
    // in every version. Sigh.
  }
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
    try {
      chrome.debugger.detach(this.debugee_);
    } catch (e) {
      // We'll likely get this if the tab has closed before we get here.
    }
  }

  Debugger.dispatchTable_.unregister(this.tabId_);

  this.records_.length = 0;
};


/**
 * Shared dispatch table.
 * @type {!DebuggerDispatchTable}
 * @private
 */
Debugger.dispatchTable_ = new DebuggerDispatchTable();


/**
 * Handles incoming debugger detaches.
 * @private
 */
Debugger.prototype.onDetach_ = function() {
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

  /**
   * Attempts to get the bounding rectangle from clip points.
   * @param {!Array.<number>} clip Clip points.
   * @return {Array.<number>} The [x,y,w,h] rect or null invalid.
   */
  function getClipRect(clip) {
    var minX = Number.MAX_VALUE;
    var minY = Number.MAX_VALUE;
    var maxX = -Number.MAX_VALUE;
    var maxY = -Number.MAX_VALUE;
    for (var i = 0; i < clip.length; i += 2) {
      var x = clip[i];
      var y = clip[i + 1];
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    if (minX == Number.MAX_VALUE) {
      return null;
    }
    return [minX, minY, maxX - minX, maxY - minY];
  };

  var dispatch = {};

  // Watch for time sync events. The script will use this to match debugger
  // event time with its own.
  dispatch['TimeStamp'] = function(record) {
    var prefix = 'WTFTimeSync:';
    if (record.data.message.indexOf(prefix) == 0) {
      var localTime = Number(record.data.message.substring(prefix.length));
      return [
        'WTFTimeSync',
        record.startTime,
        localTime
      ];
    }
  };

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
      record.usedHeapSizeDelta,
      record.data.url,
      record.data.lineNumber
    ];
  };

  // ParseHTML: parsing of HTML in a page.
  dispatch['ParseHTML'] = function(record) {
    return [
      'ParseHTML',
      record.startTime,
      record.endTime
    ];
  };

  dispatch['MarkDOMContent'] = function(record) {
    return [
      'MarkDOMContent',
      record.startTime,
      record.data.isMainFrame
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
      record.endTime,
      record.data.elementCount
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
    var rect = getClipRect(record.data.root);
    return [
      'Layout',
      record.startTime,
      record.endTime,
      record.data.totalObjects,
      record.data.dirtyObjects,
      record.data.partialLayout ? 1 : 0,
      rect ? rect[0] : 0,
      rect ? rect[1] : 0,
      rect ? rect[2] : 0,
      rect ? rect[3] : 0
    ];
  };

  // PaintSetup: DOM element painting.
  dispatch['PaintSetup'] = function(record) {
    return [
      'PaintSetup',
      record.startTime,
      record.endTime
    ];
  };

  // Paint: DOM element painting.
  dispatch['Paint'] = function(record) {
    var rect = getClipRect(record.data.clip);
    return [
      'Paint',
      record.startTime,
      record.endTime,
      rect ? rect[0] : 0,
      rect ? rect[1] : 0,
      rect ? rect[2] : 0,
      rect ? rect[3] : 0
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
 * @param {string} method Remote debugger method name.
 * @param {!Object} params Parameters.
 * @private
 */
Debugger.prototype.onEvent_ = function(method, params) {
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
  // Ignore if a duplicate.
  if (this.shouldIgnoreTimelineRecord_(record)) {
    return;
  }

  // Handle the record.
  var dispatch = Debugger.TIMELINE_DISPATCH_[record.type];
  if (dispatch) {
    var record = dispatch(record);
    if (record) {
      this.records_.push(record);
    }
  }

  // Recursively check children.
  if (record.children && record.children.length) {
    for (var n = 0; n < record.children.length; n++) {
      this.processTimelineRecord_(record.children[n]);
    }
  }
};


/**
 * Checks to see whether a record should be ignored.
 * This is used to filter out duplicate events.
 * @param {!Object} record Timeline record.
 * @return {boolean} True to ignore the record (and children).
 * @private
 */
Debugger.prototype.shouldIgnoreTimelineRecord_ = function(record) {
  if (record.type == 'GCEvent') {
    if (record.startTime == this.lastGcStartTime_) {
      return true;
    }
    this.lastGcStartTime_ = record.startTime;
  }
  return false;
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
