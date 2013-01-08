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
   * Dispatch table for each event type that comes from the extension.
   * @type {!Object.<function(!Object)>}
   * @private
   */
  this.timelineDispatch_ = {};
  this.setupTimelineDispatch_();

  /**
   * DOM channel, if supported.
   * This can be used to listen to notifications from the extension or send
   * messages to the content script.
   * @type {wtf.ipc.DomChannel}
   * @private
   */
  this.extensionChannel_ = null;
  if (goog.global.document) {
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
 * @override
 */
wtf.trace.providers.ExtendedInfoProvider.prototype.getSettingsSectionConfigs =
    function() {
  return [
    {
      'title': 'System Events',
      'widgets': [
        {
          'type': 'checkbox',
          'key': 'wtf.trace.provider.browser',
          'title': 'GCs/paints/layouts/etc',
          'default': false
        }
      ]
    }
  ];
};


/**
 * Sets up the record dispatch table.
 * @private
 */
wtf.trace.providers.ExtendedInfoProvider.prototype.setupTimelineDispatch_ =
    function() {
  // This table should match the one in injector/wtf-injector-chrome/debugger.js
  var timebase = wtf.timebase();

  // GCEvent: garbage collections.
  var gcEvent = wtf.trace.events.createScope(
      'javascript#gc(uint32 usedHeapSize, uint32 usedHeapSizeDelta)',
      wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_['GCEvent'] = function(data) {
    var startTime = data['startTime'] - timebase;
    var endTime = data['endTime'] - timebase;
    var scope = gcEvent(
        data['usedHeapSize'],
        data['usedHeapSizeDelta'],
        startTime);
    wtf.trace.leaveScope(scope, undefined, endTime);
  };

  // EvaluateScript: script runtime/parsing/etc.
  var evalScriptEvent = wtf.trace.events.createScope(
      'javascript#evalscript(uint32 usedHeapSize, uint32 usedHeapSizeDelta)',
      wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_['EvaluateScript'] = function(data) {
    var startTime = data['startTime'] - timebase;
    var endTime = data['endTime'] - timebase;
    var scope = evalScriptEvent(
        data['usedHeapSize'],
        data['usedHeapSizeDelta'],
        startTime);
    wtf.trace.leaveScope(scope, undefined, endTime);
  };

  // ParseHTML: parsing of HTML in a page.
  var parseHtmlEvent = wtf.trace.events.createScope(
      'browser#parseHtml(uint32 contentLength)',
      wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_['ParseHTML'] = function(data) {
    var startTime = data['startTime'] - timebase;
    var endTime = data['endTime'] - timebase;
    var scope = parseHtmlEvent(
        data['length'],
        startTime);
    wtf.trace.leaveScope(scope, undefined, endTime);
  };

  // ScheduleStyleRecalculation: a style has been invalidated - expect a
  // RecalculateStyles.
  var invalidateStylesEvent = wtf.trace.events.createInstance(
      'browser#invalidateStyles()');
  this.timelineDispatch_['ScheduleStyleRecalculation'] = function(data) {
    var startTime = data['time'] - timebase;
    invalidateStylesEvent(startTime);
  };

  // RecalculateStyles: style recalculation is occurring.
  var recalculateStylesEvent = wtf.trace.events.createScope(
      'browser#recalculateStyles()',
      wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_['ParseHTML'] = function(data) {
    var startTime = data['startTime'] - timebase;
    var endTime = data['endTime'] - timebase;
    var scope = recalculateStylesEvent(
        startTime);
    wtf.trace.leaveScope(scope, undefined, endTime);
  };

  // InvalidateLayout: DOM layout was invalidated - expect a Layout.
  var invalidateLayoutEvent = wtf.trace.events.createInstance(
      'browser#invalidateLayout()');
  this.timelineDispatch_['InvalidateLayout'] = function(data) {
    var startTime = data['time'] - timebase;
    invalidateLayoutEvent(startTime);
  };

  // Layout: DOM layout.
  var layoutEvent = wtf.trace.events.createScope(
      'browser#layout(int32 x, int32 y, int32 width, int32 height)',
      wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_['Layout'] = function(data) {
    var startTime = data['startTime'] - timebase;
    var endTime = data['endTime'] - timebase;
    var scope = layoutEvent(
        data['x'],
        data['y'],
        data['width'],
        data['height'],
        startTime);
    wtf.trace.leaveScope(scope, undefined, endTime);
  };

  // Paint: DOM element painting.
  var paintEvent = wtf.trace.events.createScope(
      'browser#paint(int32 x, int32 y, int32 width, int32 height)',
      wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_['Paint'] = function(data) {
    var startTime = data['startTime'] - timebase;
    var endTime = data['endTime'] - timebase;
    var scope = paintEvent(
        data['x'],
        data['y'],
        data['width'],
        data['height'],
        startTime);
    wtf.trace.leaveScope(scope, undefined, endTime);
  };

  // CompositeLayers: the compositor ran and composited the page.
  var compositeLayersEvent = wtf.trace.events.createScope(
      'browser#compositeLayers()',
      wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_['CompositeLayers'] = function(data) {
    var startTime = data['startTime'] - timebase;
    var endTime = data['endTime'] - timebase;
    var scope = compositeLayersEvent(
        startTime);
    wtf.trace.leaveScope(scope, undefined, endTime);
  };

  // DecodeImage: a compressed image was decoded.
  var decodeImageEvent = wtf.trace.events.createScope(
      'browser#decodeImage(ascii imageType)',
      wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_['DecodeImage'] = function(data) {
    var startTime = data['startTime'] - timebase;
    var endTime = data['endTime'] - timebase;
    var scope = decodeImageEvent(
        data['imageType'],
        startTime);
    wtf.trace.leaveScope(scope, undefined, endTime);
  };

  // ResizeImage: a resized version of a decoded image was required.
  var resizeImageEvent = wtf.trace.events.createScope(
      'browser#resizeImage(bool cached)',
      wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_['ResizeImage'] = function(data) {
    var startTime = data['startTime'] - timebase;
    var endTime = data['endTime'] - timebase;
    var scope = resizeImageEvent(
        data['cached'],
        startTime);
    wtf.trace.leaveScope(scope, undefined, endTime);
  };
};


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
        var dispatch = this.timelineDispatch_[eventData['type']];
        if (dispatch) {
          dispatch(eventData);
        }
      }
      break;
  }
};
