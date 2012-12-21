/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Extension extended data proxy.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.providers.ExtendedInfoProvider');

goog.require('wtf');
goog.require('wtf.data.EventFlag');
goog.require('wtf.ipc');
goog.require('wtf.ipc.Channel');
goog.require('wtf.trace');
goog.require('wtf.trace.Provider');
goog.require('wtf.trace.events');



/**
 * Inserts data from the extension extended information proxy.
 *
 * @constructor
 * @extends {wtf.trace.Provider}
 */
wtf.trace.providers.ExtendedInfoProvider = function() {
  goog.base(this);

  /**
   * Custom event types.
   * @type {!Object.<!Function>}
   * @private
   */
  this.events_ = {
    gc: wtf.trace.events.createScope(
        'javascript#gc(uint32 usedHeapSize, uint32 usedHeapSizeDelta)',
        wtf.data.EventFlag.SYSTEM_TIME),
    evalScript: wtf.trace.events.createScope(
        'javascript#evalscript(uint32 usedHeapSize, uint32 usedHeapSizeDelta)',
        wtf.data.EventFlag.SYSTEM_TIME)
  };

  /**
   * DOM channel, if supported.
   * This can be used to listen to notifications from the extension or send
   * messages to the content script.
   * @type {wtf.ipc.DomChannel}
   * @private
   */
  this.extensionChannel_ = null;
  if (!wtf.NODE) {
    this.extensionChannel_ = wtf.ipc.openDomChannel(
        goog.global.document,
        'WtfContentScriptEvent');
  }
  this.registerDisposable(this.extensionChannel_);

  // Listen for messages from the extension.
  if (this.extensionChannel_) {
    this.extensionChannel_.addListener(
        wtf.ipc.Channel.EventType.MESSAGE, this.extensionMessage_, this);
  }
};
goog.inherits(wtf.trace.providers.ExtendedInfoProvider, wtf.trace.Provider);


/**
 * Handles messages from the extension.
 * @param {!Object} data Message data.
 * @private
 */
wtf.trace.providers.ExtendedInfoProvider.prototype.extensionMessage_ =
    function(data) {
  switch (data['command']) {
    case 'trace_events':
      var contents = data['contents'];
      for (var n = 0; n < contents.length; n++) {
        var eventData = contents[n];
        switch (eventData['type']) {
          case 'GCEvent':
            this.traceGc_(eventData);
            break;
          case 'EvaluateScript':
            this.traceScript_(eventData);
            break;
        }
      }
      break;
  }
};


/**
 * Traces a GC event.
 * @param {!Object} data GC event data.
 * @private
 */
wtf.trace.providers.ExtendedInfoProvider.prototype.traceGc_ = function(data) {
  var timebase = wtf.timebase();
  var startTime = data['startTime'] - timebase;
  var endTime = data['endTime'] - timebase;
  var usedHeapSize = data['usedHeapSize'];
  var usedHeapSizeDelta = data['usedHeapSizeDelta'];
  var scope = this.events_.gc(usedHeapSize, usedHeapSizeDelta, startTime);
  wtf.trace.leaveScope(scope, undefined, endTime);
};


/**
 * Traces a script eval event.
 * @param {!Object} data Script eval event data.
 * @private
 */
wtf.trace.providers.ExtendedInfoProvider.prototype.traceScript_ =
    function(data) {
  var timebase = wtf.timebase();
  var startTime = data['startTime'] - timebase;
  var endTime = data['endTime'] - timebase;
  var usedHeapSize = data['usedHeapSize'];
  var usedHeapSizeDelta = data['usedHeapSizeDelta'];
  var scope =
      this.events_.evalScript(usedHeapSize, usedHeapSizeDelta, startTime);
  wtf.trace.leaveScope(scope, undefined, endTime);
};

