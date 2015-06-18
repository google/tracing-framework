/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview EventTarget shim and mixin utilities.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.eventtarget');
goog.provide('wtf.trace.eventtarget.BaseEventTarget');
goog.provide('wtf.trace.eventtarget.Descriptor');
goog.provide('wtf.trace.eventtarget.EventRegistration');

goog.require('goog.userAgent');
goog.require('wtf.data.webidl');
goog.require('wtf.trace.Scope');
goog.require('wtf.trace.events');


/**
 * Checks to see whether on* events can be rewritten to support injection.
 * Only Chrome and FF support this right now, it seems.
 *
 * If it's supported a delete of the properties on all created instances may
 * still be required. FF doesn't need this, but Chrome does. That means that
 * even if we rewrite on* events we'll still have to delete. Instead of making
 * createElement glacially slow the additional API of hookDomEvents is exposed
 * to let users opt in to this functionality.
 *
 * @type {{
 *   available: boolean,
 *   needsDelete: boolean
 * }}
 */
wtf.trace.eventtarget.DEFINE_SUPPORT = (function() {
  if (!goog.global['document']) {
    // TODO(benvanik): devise a test for workers.
    return {
      available: false,
      needsDelete: false
    };
  }

  var supportsDefine = false;
  var needsDelete = false;
  try {
    var tagName = 'head';
    var proto = goog.global['HTMLHeadElement'].prototype;
    var eventName = 'onmousemove';
    var propertyValue = 123;
    Object.defineProperty(proto, eventName, {
      'configurable': true,
      'enumerable': true,
      'get': function() { return propertyValue; },
      'set': function(value) { propertyValue = value; }
    });
    var el = document.createElement(tagName);
    el[eventName] = 456;
    if (el[eventName] == 456 &&
        propertyValue == 456) {
      supportsDefine = true;
    }
    if (!supportsDefine) {
      delete el[eventName];
      el[eventName] = 456;
      if (el[eventName] == 456 &&
          propertyValue == 456) {
        supportsDefine = true;
        needsDelete = true;
      }
    }
    delete proto[eventName];
  } catch (e) {
  }

  return {
    available: supportsDefine,
    needsDelete: needsDelete
  };
})();


/**
 * Finds all of the event names on the given object.
 * @param {!Object} target Instance or prototype.
 * @return {!Array.<string>} Event names.
 */
wtf.trace.eventtarget.getEventNames = function(target) {
  // Not present in IE8.
  if (!Object.getOwnPropertyNames) {
    return [];
  }

  var eventNames = [];
  var hasMouseEvents = false;
  var propertyTarget = target;
  while (true) {
    var allNames = Object.getOwnPropertyNames(propertyTarget);
    for (var n = 0; n < allNames.length; n++) {
      var propertyName = allNames[n];
      if (propertyName == 'onmousedown') {
        hasMouseEvents = true;
      }
      if (propertyName.indexOf('on') == 0 &&
          propertyName.toLowerCase() == propertyName) {
        var eventName = propertyName.substr(2);
        eventNames.push(eventName);
      }
    }
    propertyTarget = Object.getPrototypeOf(propertyTarget);
    if (!propertyTarget ||
        propertyTarget == /** @type {Object} */ (Object.prototype)) {
      break;
    }
  }

  if (goog.userAgent.GECKO) {
    // HACK: add firefox-specific events as needed.
    if (hasMouseEvents) {
      eventNames.push('DOMMouseScroll');
    }
  }

  return eventNames;
};


/**
 * @typedef {{
 *   prefix: string,
 *   eventTypes: !Object.<!Object>,
 *   eventNames: !Array.<string>,
 *   eventMap: !Object.<Function>,
 *   eventInfos: !Array.<!{
 *     name: string,
 *     scopeEvent: Function,
 *     getter: Function,
 *     setter: Function
 *   }>
 * }}
 */
wtf.trace.eventtarget.Descriptor;


/**
 * Creates an event target descriptor.
 * This doesn't hook any methods but makes it easier to do so later either
 * via mixin or type overwriting.
 * @param {string} prefix Event name prefix.
 * @param {!Object.<Object>} eventTypes All event types, such as 'load', mapped
 *     to their event type descriptor from {@see wtf.data.webidl}.
 * @return {!wtf.trace.eventtarget.Descriptor} Event target descriptor.
 */
wtf.trace.eventtarget.createDescriptor = function(prefix, eventTypes) {
  var eventMap = {};

  var eventNames = [];
  var eventInfos = [];
  for (var eventName in eventTypes) {
    var eventType = eventTypes[eventName];
    eventNames.push(eventName);

    var signature = wtf.data.webidl.getEventSignature(
        prefix, eventName, eventType);
    var scopeEvent = wtf.trace.events.createScope(
        signature);
    eventMap[eventName] = scopeEvent;

    var hiddenName = '__wtf_event_value_' + eventName;
    eventInfos.push({
      name: eventName,
      scopeEvent: scopeEvent,
      getter: (function(hiddenName) {
        return function() {
          return this[hiddenName];
        };
      })(hiddenName),
      setter: (function(hiddenName, eventName) {
        return function(value) {
          var currentValue = this[hiddenName];
          if (currentValue) {
            this['removeEventListener'](eventName, currentValue, false);
          }
          if (value) {
            this['addEventListener'](eventName, value, false);
          }
          this[hiddenName] = value;
        };
      })(hiddenName, eventName)
    });
  }

  return {
    prefix: prefix,
    eventTypes: eventTypes,
    eventNames: eventNames,
    eventMap: eventMap,
    eventInfos: eventInfos
  };
};


/**
 * Gets the descriptor for the given target, if found.
 * @param {!Object} target Target object.
 * @return {wtf.trace.eventtarget.Descriptor} Event descriptor, if found.
 */
wtf.trace.eventtarget.getDescriptor = function(target) {
  return target['__wtf_eventtarget_descriptor__'] || null;
};


/**
 * Sets the descriptor for the given target.
 * @param {!Object} target Target object (should be a prototype).
 * @param {!wtf.trace.eventtarget.Descriptor} value Event descriptor.
 */
wtf.trace.eventtarget.setDescriptor = function(target, value) {
  target['__wtf_eventtarget_descriptor__'] = value;
};


/**
 * Mixin EventTarget-like behavior to an instance or prototype.
 * This adds or replaces the 'addEventListener'/'removeEventListener' methods.
 * @param {!wtf.trace.eventtarget.Descriptor} descriptor Event descriptor.
 * @param {!Object} target An object instance or a prototype.
 */
wtf.trace.eventtarget.mixin = function(descriptor, target) {
  var originalAddEventListener = target['addEventListener'];
  target['addEventListener'] =
      /**
       * @param {string} type Event type.
       * @param {!EventListener|Function} listener Listener.
       * @param {boolean=} opt_capture Capture.
       * @this {!Object}
       */
      function(type, listener, opt_capture) {
    var self = this || goog.global;
    var eventType = descriptor.eventMap[type];
    if (!eventType || self['__wtf_ignore__'] || listener['__wtf_ignore__']) {
      // Ignored - do a normal add.
      originalAddEventListener.call(self, type, listener, opt_capture);
      return;
    }

    var wrappedEventListener = function wrappedEventListener(e) {
      if (e['__wtf_ignore__']) {
        return;
      }
      var scope = self['__wtf_ignore__'] ? null : eventType();
      try {
        if (listener['handleEvent']) {
          // Listener is an EventListener.
          listener.handleEvent(e);
        } else {
          // Listener is a function.
          return listener.apply(self, arguments);
        }
      } finally {
        wtf.trace.Scope.leave(scope);
      }
    };
    listener['__wrapped__'] = wrappedEventListener;
    originalAddEventListener.call(
        self, type, wrappedEventListener, opt_capture);
  };

  var originalRemoveEventListener = target['removeEventListener'];
  target['removeEventListener'] = function(type, listener, opt_capture) {
    var self = this || goog.global;
    if (listener && listener['__wrapped__']) {
      listener = listener['__wrapped__'];
    }
    originalRemoveEventListener.call(self, type, listener, opt_capture);
  };

  // TODO(benvanik): instrument dispatchEvent for flows?
};


/**
 * Sets the on* event properties on the given target prototype.
 * The {@see #initializeEventProperties} method must be called on instances of
 * the given object.
 * @param {!wtf.trace.eventtarget.Descriptor} descriptor Event descriptor.
 * @param {!Object} target An object instance or a prototype.
 */
wtf.trace.eventtarget.setEventProperties = function(descriptor, target) {
  if (!wtf.trace.eventtarget.DEFINE_SUPPORT.available) {
    return;
  }

  var eventInfos = descriptor.eventInfos;
  for (var n = 0; n < eventInfos.length; n++) {
    var eventInfo = eventInfos[n];
    try {
      Object.defineProperty(target, 'on' + eventInfo.name, {
        'configurable': true,
        'enumerable': true,
        'get': eventInfo.getter,
        'set': eventInfo.setter
      });
    } catch (e) {
      if (goog.DEBUG) {
        goog.global.console.log('Unable to define property ' + eventInfo.name +
            ' on ' + descriptor.prefix);
      }
    }
  }
};


/**
 * Initializes on* event properties on the given target instance.
 * This must be called to ensure the properties work correctly.
 * @param {!Object} target Target object instance.
 * @return {boolean} Whether the action was performed.
 */
wtf.trace.eventtarget.initializeEventProperties = function(target) {
  // Ignore if nothing to do.
  if (!wtf.trace.eventtarget.DEFINE_SUPPORT.available ||
      !wtf.trace.eventtarget.DEFINE_SUPPORT.needsDelete) {
    return false;
  }

  var descriptor = wtf.trace.eventtarget.getDescriptor(target);
  if (descriptor) {
    var eventNames = descriptor.eventNames;
    for (var n = 0; n < eventNames.length; n++) {
      var eventName = 'on' + eventNames[n];
      var value = target[eventName];
      target[eventName] = null;
      delete target[eventName];
      if (value) {
        target[eventName] = value;
      }
    }
    return true;
  }

  return false;
};


/**
 * Initializes on* event properties on the given DOM element and optionally
 * for all children.
 * This must be called to ensure the properties work correctly.
 * @param {!Element} target Target DOM element.
 * @param {boolean=} opt_recursive Also initialize for all children.
 */
wtf.trace.eventtarget.initializeDomEventProperties = function(
    target, opt_recursive) {
  if (target['__wtf_ignore__']) {
    return;
  }

  // Do self.
  if (!wtf.trace.eventtarget.initializeEventProperties(target)) {
    return;
  }

  // Do all descendants.
  if (opt_recursive) {
    // TODO(benvanik): enterTracingScope if descendants > N?
    var descendants = target.getElementsByTagName('*');
    for (var n = 0; n < descendants.length; n++) {
      var descendant = descendants[n];
      if (descendant['__wtf_ignore__']) {
        continue;
      }
      var descriptor = wtf.trace.eventtarget.getDescriptor(descendant);
      if (descriptor) {
        var eventNames = descriptor.eventNames;
        for (var m = 0; m < eventNames.length; m++) {
          var eventName = 'on' + eventNames[m];
          var value = descendant[eventName];
          descendant[eventName] = null;
          delete descendant[eventName];
          if (value) {
            descendant[eventName] = value;
          }
        }
      }
    }
  }
};



/**
 * EventTarget shim.
 * Proxy classes should subclass this to get EventTarget-like behavior.
 * @param {!wtf.trace.eventtarget.Descriptor} descriptor Event descriptor.
 * @constructor
 */
wtf.trace.eventtarget.BaseEventTarget = function(descriptor) {
  /**
   * Event descriptor.
   * @type {!wtf.trace.eventtarget.Descriptor}
   * @private
   */
  this.descriptor_ = descriptor;

  /**
   * Event listeners.
   * @type {!Object.<!wtf.trace.eventtarget.EventRegistration>}
   * @private
   */
  this.registrations_ = {};
};


/**
 * Adds an event listener.
 * @param {string} type The type of the event to listen for.
 * @param {Function|Object} listener The function to handle the event. The
 *     handler can also be an object that implements the handleEvent method
 *     which takes the event object as argument.
 * @param {boolean=} opt_capture In DOM-compliant browsers, this determines
 *     whether the listener is fired during the capture or bubble phase
 *     of the event.
 * @this {wtf.trace.eventtarget.BaseEventTarget}
 */
wtf.trace.eventtarget.BaseEventTarget.prototype['addEventListener'] = function(
    type, listener, opt_capture) {
  var registration = this.registrations_[type];
  if (!registration) {
    registration = this.registrations_[type] =
        new wtf.trace.eventtarget.EventRegistration();
  }

  var list = registration.dom2 || [];
  registration.dom2 = list;
  list.push({
    listener: listener,
    capture: opt_capture || false
  });

  if (!registration.handlerCount) {
    this.beginTrackingEvent(type);
  }
  registration.handlerCount++;
};


/**
 * Removes an event listener.
 * @param {string} type The type of the event to listen for.
 * @param {Function|Object} listener The function to handle the event. The
 *     handler can also be an object that implements the handleEvent method
 *     which takes the event object as argument.
 * @param {boolean=} opt_capture In DOM-compliant browsers, this determines
 *     whether the listener is fired during the capture or bubble phase
 *     of the event.
 * @this {wtf.trace.eventtarget.BaseEventTarget}
 */
wtf.trace.eventtarget.BaseEventTarget.prototype['removeEventListener'] =
    function(type, listener, opt_capture) {
  var registration = this.registrations_[type];
  if (!registration) {
    return;
  }

  var list = registration.dom2;
  if (!list || !list.length) {
    return;
  }

  for (var n = 0; n < list.length; n++) {
    if (list[n].listener == listener &&
        list[n].capture == opt_capture) {
      list.splice(n, 1);
      break;
    }
  }

  registration.handlerCount--;
  if (!registration.handlerCount) {
    this.endTrackingEvent(type);
  }
};


/**
 * Indicates that the given event type should be tracked on the target object.
 * @param {string} type Event type name.
 */
wtf.trace.eventtarget.BaseEventTarget.prototype.beginTrackingEvent =
    goog.abstractMethod;


/**
 * Indicates that the given event type should be stop being tracked on the
 * target object.
 * @param {string} type Event type name.
 */
wtf.trace.eventtarget.BaseEventTarget.prototype.endTrackingEvent =
    goog.abstractMethod;


/**
 * Sets a hook method to each event dispatch.
 * This allows subclasses to append scope data/etc.
 * @param {string} type Event type.
 * @param {function(this:T, !Event)} callback Callback.
 * @param {T=} opt_scope Callback scope.
 * @template T
 */
wtf.trace.eventtarget.BaseEventTarget.prototype.setEventHook = function(
    type, callback, opt_scope) {
  var registration = this.registrations_[type];
  if (!registration) {
    registration = this.registrations_[type] =
        new wtf.trace.eventtarget.EventRegistration();
  }

  var list = registration.hooks || [];
  registration.hooks = list;
  list.push({
    callback: callback,
    scope: opt_scope || this
  });
};


/**
 * Dispatches an event.
 * @param {Event} e Event.
 * @this {wtf.trace.eventtarget.BaseEventTarget}
 */
wtf.trace.eventtarget.BaseEventTarget.prototype['dispatchEvent'] = function(e) {
  // Ignore events marked by implementations as being WTF-specific.
  if (e['__wtf_ignore__']) {
    return;
  }

  var registration = this.registrations_[e.type];
  if (!registration) {
    return;
  }

  // Dispatch DOM 0 events first.
  if (registration.dom0) {
    this.dispatchToListener(e, registration.dom0, registration.hooks);
  }

  // Dispatch DOM 2 events second.
  var list = registration.dom2;
  if (list) {
    for (var n = 0; n < list.length; n++) {
      this.dispatchToListener(e, list[n].listener, registration.hooks);
    }
  }
};


/**
 * Dispatches an event ot a listener, wrapping it in a scope.
 * @param {Event} e Event.
 * @param {Function|Object} listener Event listener.
 * @param {Array.<!{
 *   callback: Function,
 *   scope: !Object
 * }>} hooks Event hooks.
 */
wtf.trace.eventtarget.BaseEventTarget.prototype.dispatchToListener = function(
    e, listener, hooks) {
  if (e['__wtf_ignore__']) {
    return;
  }

  // Begin tracing scope.
  var eventKey = e.type;
  var eventType = this.descriptor_.eventMap[eventKey];
  var scope = this['__wtf_ignore__'] ? null : (eventType ? eventType() : null);

  // Callback registered hooks.
  if (hooks && hooks.length) {
    for (var n = 0; n < hooks.length; n++) {
      hooks[n].callback.call(hooks[n].scope, e);
    }
  }

  // Dispatch the event.
  try {
    if (listener['handleEvent']) {
      // Listener is an EventListener.
      listener['handleEvent'](e);
    } else {
      // Listener is a function.
      listener.call(this, e);
    }
  } finally {
    wtf.trace.Scope.leave(scope);
  }
};



/**
 * Event listener registration collection.
 * @constructor
 */
wtf.trace.eventtarget.EventRegistration = function() {
  /**
   * Total number of event listeners.
   * This is used as a quick toggle for calling the tracking functions.
   * @type {number}
   */
  this.handlerCount = 0;

  /**
   * DOM level 0 handler, if any.
   * @type {Function?}
   */
  this.dom0 = null;

  /**
   * A list of DOM level 2 handlers, if any.
   * @type {Array.<!{
   *   listener: (Function|Object),
   *   capture: boolean
   * }>}
   */
  this.dom2 = null;

  /**
   * A list of tracing hooks that will be called on each dispatch, if any.
   * @type {Array.<!{
   *   callback: Function,
   *   scope: !Object
   * }>}
   */
  this.hooks = null;
};
