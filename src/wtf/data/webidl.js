/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview DOM IDL-like data used for event generation/etc.
 *
 * The contents of this file were created by hand by looking at the Chrome IDL
 * files and cross-referencing them with the W3C specs for those types.
 * Unfortunately, the IDL files do not describe the types of the events that an
 * EventTarget emits, so there's no nice automated way to do this.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.data.webidl');

goog.require('goog.asserts');


/**
 * Event types structures.
 * @type {!Object.<!Object>}
 * @const
 */
wtf.data.webidl.EVENT_TYPES = {
  // https://chromium.googlesource.com/chromium/blink/+/master/Source/core/dom/Event.idl
  'Event': {
    attributes: {
      'target': 'dompath',
      // Ignore current path, as it's set by the dispatcher.
      // 'currentTarget': 'dompath',
      'timeStamp': 'uint32'

      // clipboardData
    }
  },

  // https://chromium.googlesource.com/chromium/blink/+/master/Source/modules/websockets/CloseEvent.idl
  'CloseEvent': {
    inherits: 'Event',
    attributes: {
      'wasClean': 'bool',
      'code': 'int16',
      'reason' : 'utf8'
    }
  },

  // https://chromium.googlesource.com/chromium/blink/+/master/Source/core/dom/ErrorEvent.idl
  'ErrorEvent': {
    inherits: 'Event',
    attributes: {
      'message': 'utf8',
      'filename': 'utf8',
      'lineno': 'uint32'
    }
  },

  // https://chromium.googlesource.com/chromium/blink/+/master/Source/core/dom/ProgressEvent.idl
  'ProgressEvent': {
    inherits: 'Event',
    attributes: {
      'lengthComputable': 'bool',
      // TODO(benvanik): uint64
      'loaded': 'uint32',
      'total': 'uint32'
    }
  },

  // https://chromium.googlesource.com/chromium/blink/+/master/Source/core/dom/UIEvent.idl
  'UIEvent': {
    inherits: 'Event',
    attributes: {
      'detail': 'any',
      'keyCode': 'int32',
      'charCode': 'int32',
      'layerX': 'int32',
      'layerY': 'int32',
      'pageX': 'int32',
      'pageY': 'int32',
      'which': 'int32'
    }
  },

  // https://chromium.googlesource.com/chromium/blink/+/master/Source/core/dom/FocusEvent.idl
  'FocusEvent': {
    inherits: 'UIEvent',
    attributes: {
      'relatedTarget': 'dompath'
    }
  },

  // https://chromium.googlesource.com/chromium/blink/+/master/Source/core/dom/KeyboardEvent.idl
  'KeyboardEvent': {
    inherits: 'UIEvent',
    attributes: {
      'keyIdentifier': 'utf8',
      'keyLocation': 'uint32',
      'ctrlKey': 'bool',
      'shiftKey': 'bool',
      'altKey': 'bool',
      'metaKey': 'bool',
      'altGraphKey': 'bool'
    }
  },

  // https://chromium.googlesource.com/chromium/blink/+/master/Source/core/dom/MouseEvent.idl
  'MouseEvent': {
    inherits: 'UIEvent',
    attributes: {
      'screenX': 'int32',
      'screenY': 'int32',
      'clientX': 'int32',
      'clientY': 'int32',
      'ctrlKey': 'bool',
      'shiftKey': 'bool',
      'altKey': 'bool',
      'metaKey': 'bool',
      'button': 'uint16',
      'relatedTarget': 'dompath',
      'webkitMovementX': 'int32',
      'webkitMovementY': 'int32',

      'offsetX': 'int32',
      'offsetY': 'int32',
      'x': 'int32',
      'y': 'int32'
      // fromElement, toElement
      // dataTransfer
    }
  },

  // https://chromium.googlesource.com/chromium/blink/+/master/Source/core/dom/WheelEvent.idl
  'WheelEvent': {
    inherits: 'MouseEvent',
    attributes: {
      'deltaX': 'float32',
      'deltaY': 'float32',
      'deltaZ': 'float32',
      'deltaMode': 'uint32',
      'wheelDelta': 'int32',

      'webkitDirectionInvertedFromDevice': 'bool'
    }
  },

  // https://chromium.googlesource.com/chromium/blink/+/master/Source/core/xml/XMLHttpRequestProgressEvent.idl
  'XMLHttpRequestProgressEvent': {
    inherits: 'ProgressEvent',
    attributes: {
      // TODO(benvanik): uint64
      'position': 'uint32',
      'totalSize': 'uint32'
    }
  },

  // https://chromium.googlesource.com/chromium/blink/+/master/Source/core/dom/MessageEvent.idl
  'MessageEvent': {
    inherits: 'Event',
    attributes: {
    }
  }
};


/**
 * Object structures.
 * @type {!Object.<!Object>}
 * @const
 */
wtf.data.webidl.OBJECTS = {
  // https://chromium.googlesource.com/chromium/blink/+/master/Source/core/dom/Element.idl
  'Element': {
    events: {
      'abort': null,
      'blur': 'FocusEvent',
      'change': null,
      'click': 'MouseEvent',
      'contextmenu': null,
      'dblclick': 'MouseEvent',
      'drag': null,
      'dragend': null,
      'dragenter': null,
      'dragleave': null,
      'dragover': null,
      'dragstart': null,
      'drop': null,
      'error': 'ErrorEvent',
      'focus': 'FocusEvent',
      'input': null,
      'invalid': null,
      'keydown': 'KeyboardEvent',
      'keypress': 'KeyboardEvent',
      'keyup': 'KeyboardEvent',
      'load': null,
      'mousedown': 'MouseEvent',
      'mousemove': 'MouseEvent',
      'mouseout': 'MouseEvent',
      'mouseover': 'MouseEvent',
      'mouseup': 'MouseEvent',
      'mousewheel': 'WheelEvent',
      'wheel': 'WheelEvent',
      'readystatechange': null,
      'scroll': null,
      'select': null,
      'submit': null,

      'animationstart': null,
      'animationend': null,
      'animationiteration': null,
      'transitionend': null,

      'selectstart': null,
      'touchstart': null,
      'touchmove': null,
      'touchend': null,
      'touchcancel': null,
      'webkitfullscreenchange': null,
      'webkitfullscreenerror': null,

      'DOMMouseScroll': 'UIEvent'     // Non-standard Firefox
    }
  },

  // https://chromium.googlesource.com/chromium/blink/+/master/Source/core/page/DOMWindow.idl
  'Window': {
    // Not really, but it does get its events.
    inherits: 'Element',
    events: {
      'beforeunload': null,
      'change': null,
      'hashchange': null,
      'message': null,
      'offline': null,
      'online': null,
      'pagehide': null,
      'pageshow': null,
      'popstate': null,
      'resize': null,
      'unload': null
    }
  },

  // https://chromium.googlesource.com/chromium/blink/+/master/Source/core/dom/Document.idl
  'Document': {
    // Not really, but it does get its events.
    inherits: 'Element',
    events: {
      'DOMContentLoaded': null,
      'webkitpointerlockchange': null,
      'webkitpointerlockerror': null
    }
  },

  // https://chromium.googlesource.com/chromium/blink/+/master/Source/core/html/HTMLElement.idl
  'HTMLElement': {
    inherits: 'Element'
  },

  // https://chromium.googlesource.com/chromium/blink/+/master/Source/core/html/HTMLAnchorElement.idl
  'HTMLAnchorElement': {
    tagName: 'a',
    inherits: 'HTMLElement'
  },

  // https://chromium.googlesource.com/chromium/blink/+/master/Source/core/html/HTMLCanvasElement.idl
  'HTMLCanvasElement': {
    tagName: 'canvas',
    inherits: 'HTMLElement'
  },

  // https://chromium.googlesource.com/chromium/blink/+/master/Source/core/html/HTMLDivElement.idl
  'HTMLDivElement': {
    tagName: 'div',
    inherits: 'HTMLElement'
  },

  // https://chromium.googlesource.com/chromium/blink/+/master/Source/core/xml/XMLHttpRequest.idl
  'XMLHttpRequest': {
    events: {
      'abort': 'XMLHttpRequestProgressEvent',
      'error': 'XMLHttpRequestProgressEvent',
      'load': 'XMLHttpRequestProgressEvent',
      'loadend': 'XMLHttpRequestProgressEvent',
      'loadstart': 'XMLHttpRequestProgressEvent',
      'progress': 'XMLHttpRequestProgressEvent',
      'timeout': 'XMLHttpRequestProgressEvent',
      'readystatechange': 'XMLHttpRequestProgressEvent'
    }
  },

  // https://chromium.googlesource.com/chromium/blink/+/master/Source/core/dom/MessagePort.idl
  'MessagePort': {
    events: {
      'message': 'MessageEvent'
    }
  },

  // https://chromium.googlesource.com/chromium/blink/+/master/Source/modules/websockets/WebSocket.idl
  'WebSocket': {
    events: {
      'open': 'Event',
      'error': 'Event',
      'close': 'CloseEvent',
      'message': 'Event'
    }
  }
};


/**
 * The names of all DOM-like objects.
 * @type {!Array.<string>}
 * @const
 */
wtf.data.webidl.DOM_OBJECTS = [
  'HTMLAnchorElement',
  'HTMLAppletElement',
  'HTMLAreaElement',
  'HTMLAudioElement',
  'HTMLBRElement',
  'HTMLBaseElement',
  'HTMLBaseFontElement',
  'HTMLBodyElement',
  'HTMLButtonElement',
  'HTMLCanvasElement',
  'HTMLContentElement',
  'HTMLDListElement',
  'HTMLDirectoryElement',
  'HTMLDivElement',
  'HTMLDocument',
  'HTMLElement',
  'HTMLEmbedElement',
  'HTMLFieldSetElement',
  'HTMLFontElement',
  'HTMLFormElement',
  'HTMLFrameElement',
  'HTMLFrameSetElement',
  'HTMLHRElement',
  'HTMLHeadElement',
  'HTMLHeadingElement',
  'HTMLHtmlElement',
  'HTMLIFrameElement',
  'HTMLImageElement',
  'HTMLInputElement',
  'HTMLKeygenElement',
  'HTMLLIElement',
  'HTMLLabelElement',
  'HTMLLegendElement',
  'HTMLLinkElement',
  'HTMLMapElement',
  'HTMLMarqueeElement',
  'HTMLMediaElement',
  'HTMLMenuElement',
  'HTMLMetaElement',
  'HTMLMeterElement',
  'HTMLModElement',
  'HTMLOListElement',
  'HTMLObjectElement',
  'HTMLOptGroupElement',
  'HTMLOptionElement',
  'HTMLOutputElement',
  'HTMLParagraphElement',
  'HTMLPreElement',
  'HTMLProgressElement',
  'HTMLQuoteElement',
  'HTMLScriptElement',
  'HTMLSelectElement',
  'HTMLSourceElement',
  'HTMLSpanElement',
  'HTMLStyleElement',
  'HTMLTableCaptionElement',
  'HTMLTableCellElement',
  'HTMLTableColElement',
  'HTMLTableElement',
  'HTMLTableRowElement',
  'HTMLTableSectionElement',
  'HTMLTextAreaElement',
  'HTMLTitleElement',
  'HTMLTrackElement',
  'HTMLUListElement',
  'HTMLUnknownElement',
  'HTMLVideoElement'
];


/**
 * Gets a unioned set of all event types for all of the given objects.
 * @param {!Array.<string>} objectNames Object names, as a key into
 *     {@code OBJECTS}.
 * @return {!Object.<!Object>} All events mapped by name to their type object.
 */
wtf.data.webidl.getAllEventTypes = function(objectNames) {
  var result = {};
  for (var n = 0; n < objectNames.length; n++) {
    var eventTypes = wtf.data.webidl.getAllEvents(objectNames[n]);
    for (var eventName in eventTypes) {
      var existingType = result[eventName];
      if (existingType && existingType != eventTypes[eventName]) {
        // This is bad - we have two events with the same name but different
        // types.
        goog.asserts.fail('Redefined event type/duplicate keys');
        continue;
      }
      result[eventName] = eventTypes[eventName];
    }
  }
  return result;
};


/**
 * Gets a combined list of events and types for the given object.
 * @param {string} objectName Object name, as a key into {@code OBJECTS}.
 * @param {Array.<string>=} opt_extraNames Extra event names that should be
 *     included if they are not in the IDL. They will default to the Event type.
 * @return {!Object.<!Object>} All events mapped by name to their type object.
 */
wtf.data.webidl.getAllEvents = function(objectName, opt_extraNames) {
  var defaultEventType = wtf.data.webidl.EVENT_TYPES['Event'];
  var result = {};

  var targetName = objectName;
  while (true) {
    var obj = wtf.data.webidl.OBJECTS[targetName];
    if (!obj) {
      break;
    }
    targetName = obj.inherits;

    for (var key in obj.events) {
      var eventTypeName = obj.events[key];
      var eventType = wtf.data.webidl.EVENT_TYPES[eventTypeName];
      result[key] = eventType || defaultEventType;
    }
  }

  if (opt_extraNames) {
    for (var n = 0; n < opt_extraNames.length; n++) {
      var eventName = opt_extraNames[n];
      if (!result[eventName]) {
        result[eventName] = defaultEventType;
      }
    }
  }

  return result;
};


/**
 * Gets a list of all attributes for the given event type, in order.
 * @param {!Object} eventType Event type info from {@code EVENT_TYPES}.
 * @return {!Array.<{name: string, type: string}>} A list of name/type infos.
 */
wtf.data.webidl.getEventAttributes = function(eventType) {
  // Grab all of the inherited event types.
  // This way we can write the attributes in order.
  // Note that this list is reversed, and we should walk it backward.
  var allEventTypes = [eventType];
  var parentType = eventType;
  while (parentType.inherits) {
    parentType = wtf.data.webidl.EVENT_TYPES[parentType.inherits];
    goog.asserts.assert(parentType);
    allEventTypes.push(parentType);
  }

  var foundNames = {};
  var result = [];
  for (var n = allEventTypes.length - 1; n >= 0; n--) {
    var attributes = allEventTypes[n].attributes;
    for (var attributeName in attributes) {
      var attributeType = attributes[attributeName];
      if (foundNames[attributeName]) {
        continue;
      }
      foundNames[attributeName] = true;
      result.push({
        name: attributeName,
        type: attributeType
      });
    }
  }
  return result;
};


/**
 * Gets a full signature for an event type on an object.
 * @param {string} objectName Object name, like 'HTMLAnchorElement'.
 * @param {string} eventName Event name, like 'click'.
 * @param {Object} eventType Event type info from {@code EVENT_TYPES}.
 * @param {string=} opt_suffix Event name suffix. For example, ':callback'.
 * @return {string} An event signature like 'HTMLAnchorElement#onclick(...)'.
 */
wtf.data.webidl.getEventSignature = function(objectName, eventName, eventType,
    opt_suffix) {
  var s = objectName + '#' + eventName + (opt_suffix ? opt_suffix : '') + '(';

  if (eventType) {
    // Grab all attributes, in order.
    var attributes = wtf.data.webidl.getEventAttributes(eventType);
    for (var n = 0; n < attributes.length; n++) {
      var attribute = attributes[n];
      var attributeType = attribute.type;
      switch (attributeType) {
        case 'dompath':
          attributeType = 'ascii';
          break;
      }
      if (n) {
        s += ', ';
      }
      s += attributeType + ' ' + attribute.name;
    }
  }

  return s + ')';
};
