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
      'enumerable': false,
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
  var allNames = Object.getOwnPropertyNames(target);
  for (var n = 0; n < allNames.length; n++) {
    var propertyName = allNames[n];
    if (propertyName.indexOf('on') == 0 &&
        propertyName.toLowerCase() == propertyName) {
      var eventName = propertyName.substr(2);
      eventNames.push(eventName);
    }
  }

  return eventNames;
};


/**
 * @typedef {{
 *   prefix: string,
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
 * @param {!Array.<string>} eventNames All event names, such as 'load', 'error'.
 * @return {!wtf.trace.eventtarget.Descriptor} Event target descriptor.
 */
wtf.trace.eventtarget.createDescriptor = function(prefix, eventNames) {
  // TODO(benvanik): allow for extraction of event properties
  // Maybe use signature like args? eg:
  // ['mousemove(int32 clientX, int32 clientY)', 'mousedown(...)']

  var eventMap = {};

  var eventInfos = [];
  for (var n = 0; n < eventNames.length; n++) {
    var eventName = eventNames[n];

    var scopeEvent = wtf.trace.events.createScope(
        prefix + '#on' + eventName);
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
    var eventType = descriptor.eventMap[type];
    if (!eventType ||
            this['__wtf_ignore__'] ||
            listener['__wtf_ignore__']) {
      // Ignored - do a normal add.
      originalAddEventListener.call(this, type, listener, opt_capture);
      return;
    }

    var wrappedEventListener = function wrappedEventListener(e) {
      var scope = this['__wtf_ignore__'] ? null : eventType();
      try {
        if (listener['handleEvent']) {
          // Listener is an EventListener.
          listener.handleEvent(e);
        } else {
          // Listener is a function.
          return listener.apply(this, arguments);
        }
      } finally {
        wtf.trace.Scope.leave(scope);
      }
    };
    listener['__wrapped__'] = wrappedEventListener;
    originalAddEventListener.call(
        this, type, wrappedEventListener, opt_capture);
  };

  var originalRemoveEventListener = target['removeEventListener'];
  target['removeEventListener'] = function(type, listener, opt_capture) {
    if (listener && listener['__wrapped__']) {
      listener = listener['__wrapped__'];
    }
    originalRemoveEventListener.call(this, type, listener, opt_capture);
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
    Object.defineProperty(target, 'on' + eventInfo.name, {
      'configurable': false,
      'enumerable': false,
      'get': eventInfo.getter,
      'set': eventInfo.setter
    });
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
   * @type {!Object.<!Array.<!{
   *   listener: (Function|Object),
   *   capture: boolean
   * }>>}
   * @private
   */
  this.listeners_ = {};

  /**
   * on* listeners.
   * @type {!Object.<Function?>}
   * @private
   */
  this.onListeners_ = {};

  /**
   * Event hooks, by event name.
   * @type {!Object.<!{
   *   callback: Function,
   *   scope: !Object
   * }>}
   */
  this.eventHooks_ = {};
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
 */
wtf.trace.eventtarget.BaseEventTarget.prototype['addEventListener'] = function(
    type, listener, opt_capture) {
  var list = this.listeners_[type] || [];
  this.listeners_[type] = list;
  list.push({
    listener: listener,
    capture: opt_capture || false
  });

  if (list.length == 1) {
    this.beginTrackingEvent(type);
  }
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
 */
wtf.trace.eventtarget.BaseEventTarget.prototype['removeEventListener'] =
    function(type, listener, opt_capture) {
  var list = this.listeners_[type];
  if (list) {
    for (var n = 0; n < list.length; n++) {
      if (list[n].listener == listener &&
          list[n].capture == opt_capture) {
        list.splice(n, 1);
        break;
      }
    }
    if (!list.length) {
      delete this.listeners_[type];
      this.endTrackingEvent(type);
    }
  }
};


/**
 * Indicates that the given event type should be tracked on the target object.
 * @param {string} type Event type name.
 * @protected
 */
wtf.trace.eventtarget.BaseEventTarget.prototype.beginTrackingEvent =
    goog.abstractMethod;


/**
 * Indicates that the given event type should be stop being tracked on the
 * target object.
 * @param {string} type Event type name.
 * @protected
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
 * @protected
 */
wtf.trace.eventtarget.BaseEventTarget.prototype.setEventHook = function(
    type, callback, opt_scope) {
  this.eventHooks_[type] = {
    callback: callback,
    scope: opt_scope || this
  };
};


/**
 * Dispatches an event.
 * @param {Event} e Event.
 */
wtf.trace.eventtarget.BaseEventTarget.prototype['dispatchEvent'] = function(e) {
  var onListener = this.onListeners_[e.type];
  if (onListener) {
    this.dispatchToListener(e, onListener);
  } else {
    var list = this.listeners_[e.type];
    for (var n = 0; n < list.length; n++) {
      this.dispatchToListener(e, list[n].listener);
    }
  }
};


/**
 * Dispatches an event ot a listener, wrapping it in a scope.
 * @param {Event} e Event.
 * @param {Function|Object} listener Event listener.
 */
wtf.trace.eventtarget.BaseEventTarget.prototype.dispatchToListener = function(
    e, listener) {
  var eventKey = e.type;
  var eventType = this.descriptor_.eventMap[eventKey];
  var hook = this.eventHooks_[eventKey];
  var scope = this['__wtf_ignore__'] ? null : (eventType ? eventType() : null);
  if (hook) {
    hook.callback.call(hook.scope, e);
  }
  try {
    if (listener['handleEvent']) {
      // Listener is an EventListener.
      listener['handleEvent'](e);
    } else {
      // Listener is a function.
      return listener.apply(this, arguments);
    }
  } finally {
    wtf.trace.Scope.leave(scope);
  }
};
