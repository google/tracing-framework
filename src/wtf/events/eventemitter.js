/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Lightweight event emitter.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.events.EventEmitter');

goog.require('goog.Disposable');



/**
 * Lightweight event emitter.
 * This exists because {@see goog.events} is horribly slow and nasty. This
 * attempts to provide an optimize event dispatch system for simple application
 * only code (no DOM/etc).
 *
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.events.EventEmitter = function() {
  goog.base(this);

  /**
   * All event lists, mapped by event type name.
   * @type {!Object.<!wtf.events.EventListenerList_>}
   * @private
   */
  this.eventTypes_ = {};
};
goog.inherits(wtf.events.EventEmitter, goog.Disposable);


/**
 * @override
 */
wtf.events.EventEmitter.prototype.disposeInternal = function() {
  // Try to help the GC.
  this.eventTypes_ = {};
  goog.base(this, 'disposeInternal');
};


/**
 * Adds an event listener to the given event.
 * @param {string} eventType Event type name.
 * @param {!Function} callback Callback function.
 * @param {Object=} opt_scope Scope for the callback function.
 */
wtf.events.EventEmitter.prototype.addListener = function(
    eventType, callback, opt_scope) {
  // Add to list (creating it if needed).
  var list = this.eventTypes_[eventType];
  if (!list) {
    list = new wtf.events.EventListenerList_(eventType);
    this.eventTypes_[eventType] = list;
  }
  list.addListener(callback, opt_scope);
};


/**
 * Batch adds listeners for many events.
 * @param {!Object.<!Function>} eventMap A map of event names to callbacks.
 * @param {Object=} opt_scope Scope for the callback functions.
 */
wtf.events.EventEmitter.prototype.addListeners = function(
    eventMap, opt_scope) {
  for (var key in eventMap) {
    this.addListener(key, eventMap[key], opt_scope);
  }
};


/**
 * Gets a value indicating whether there are listeners for the given event.
 * @param {string} eventType Event type name.
 * @return {boolean} True if the event type has listeners.
 */
wtf.events.EventEmitter.prototype.hasListeners = function(eventType) {
  return !!this.eventTypes_[eventType];
};


/**
 * Removes an event listener from the given event.
 * @param {string} eventType Event type name.
 * @param {!Function} callback Callback function.
 * @param {Object=} opt_scope Scope for the callback function.
 */
wtf.events.EventEmitter.prototype.removeListener = function(
    eventType, callback, opt_scope) {
  var list = this.eventTypes_[eventType];
  if (!list) {
    return;
  }
  list.removeListener(callback, opt_scope);
};


/**
 * Adds a listener to this event type. After the event fires, the event
 * listener is removed from the target.
 * @param {string} eventType Event type name.
 * @param {!Function} callback Callback function.
 * @param {Object=} opt_scope Scope for the callback function.
 */
wtf.events.EventEmitter.prototype.listenOnce = function(
    eventType, callback, opt_scope) {
  var self = this;
  var newCallback = function(var_args) {
    try {
      callback.apply(opt_scope, arguments);
    } finally {
      self.removeListener(eventType, newCallback);
    }
  };
  this.addListener(eventType, newCallback);
};


/**
 * Removes all listeners for all events or, if given, an individual event type.
 * @param {string=} opt_eventType Event type name, if removing for just one
 *     event.
 */
wtf.events.EventEmitter.prototype.removeAllListeners = function(opt_eventType) {
  if (opt_eventType) {
    delete this.eventTypes_[opt_eventType];
  } else {
    this.eventTypes_ = {};
  }
};


/**
 * Emits an event.
 * @param {string} eventType Event type name.
 * @param {...*} var_args Arguments to pass to the listeners.
 */
wtf.events.EventEmitter.prototype.emitEvent = function(eventType, var_args) {
  var list = this.eventTypes_[eventType];
  if (list) {
    var args = undefined;
    if (arguments.length > 1) {
      args = [];
      for (var n = 1; n < arguments.length; n++) {
        args.push(arguments[n]);
      }
    }
    list.emitEvent(args);
  }
};



/**
 * Event listener entry.
 * @param {string} eventType Event type name.
 * @param {!Function} callback Callback.
 * @param {Object=} opt_scope Scope for the callback function.
 * @constructor
 * @private
 */
wtf.events.EventListener_ = function(eventType, callback, opt_scope) {
  /**
   * Event type name
   * @type {string}
   * @private
   */
  this.eventType_ = eventType;

  /**
   * Callback function.
   * @type {!Function}
   * @private
   */
  this.callback_ = callback;

  /**
   * Callback scope.
   * @type {Object|undefined}
   * @private
   */
  this.scope_ = opt_scope;
};



/**
 * Event listener list.
 * @param {string} eventType Event type name.
 * @constructor
 * @private
 */
wtf.events.EventListenerList_ = function(eventType) {
  /**
   * Event type name.
   * @type {string}
   * @private
   */
  this.eventType_ = eventType;

  /**
   * All listeners.
   * @type {!Array.<!wtf.events.EventListener_>}
   * @private
   */
  this.listeners_ = [];
};


/**
 * Adds a listener to this event type.
 * @param {!Function} callback Callback.
 * @param {Object=} opt_scope Scope for the callback function.
 */
wtf.events.EventListenerList_.prototype.addListener = function(
    callback, opt_scope) {
  this.listeners_.push(new wtf.events.EventListener_(
      this.eventType_, callback, opt_scope));
};


/**
 * Removes a listener from this event type.
 * @param {!Function} callback Callback.
 * @param {Object=} opt_scope Scope for the callback function.
 */
wtf.events.EventListenerList_.prototype.removeListener = function(
    callback, opt_scope) {
  for (var n = 0; n < this.listeners_.length; n++) {
    var listener = this.listeners_[n];
    if (listener.callback_ == callback && listener.scope_ === opt_scope) {
      this.listeners_.splice(n, 1);
      return;
    }
  }
};


/**
 * Emits the event.
 * @param {Array=} opt_args Arguments to pass to the listeners.
 */
wtf.events.EventListenerList_.prototype.emitEvent = function(opt_args) {
  var listeners = this.listeners_;
  var listenersLength = listeners.length;
  for (var n = 0; n < listenersLength; n++) {
    var listener = listeners[n];
    listener.callback_.apply(listener.scope_, opt_args);
  }
};
