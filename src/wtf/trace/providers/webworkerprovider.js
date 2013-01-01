/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Web Worker event provider.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.providers.WebWorkerProvider');

goog.require('goog.Disposable');
goog.require('wtf.trace');
goog.require('wtf.trace.Provider');
goog.require('wtf.trace.events');



/**
 * Provides Web Worker API events.
 *
 * @constructor
 * @extends {wtf.trace.Provider}
 */
wtf.trace.providers.WebWorkerProvider = function() {
  goog.base(this);

  // Since workers will eventually be available within workers we test for them.
  if (typeof goog.global['Worker'] == 'function') {
    this.injectBrowserShim_();
  }

  // Nasty test - assume we aren't Node.
  if (!goog.global['HTMLDivElement']) {
    this.injectWorkerShim_();
  }
};
goog.inherits(wtf.trace.providers.WebWorkerProvider, wtf.trace.Provider);


/**
 * Injects worker constructor shims.
 * @private
 */
wtf.trace.providers.WebWorkerProvider.prototype.injectBrowserShim_ =
    function() {
  // TODO(benvanik): add flow ID tracking code

  var originalWorker = goog.global['Worker'];
  var prefix = 'Worker';

  var eventMap = {
    'error': wtf.trace.events.createScope('Worker#onerror:child'),
    'message': wtf.trace.events.createScope('Worker#onmessage:child')
  };

  var onerrorScope = wtf.trace.events.createScope(
      'Worker#onerror(uint32 id)');
  var onmessageScope = wtf.trace.events.createScope(
      'Worker#onmessage(uint32 id)');

  /**
   * Worker shim.
   * @param {string} scriptUrl Script URL.
   * @param {number} workerId Tracking ID.
   * @constructor
   * @extends {wtf.trace.providers.WebWorkerProvider.ShimEventTarget}
   */
  var WorkerShim = function(scriptUrl, workerId) {
    goog.base(this, eventMap);

    /**
     * Script URL.
     * @type {string}
     * @private
     */
    this.scriptUrl_ = scriptUrl;

    /**
     * Tracking ID.
     * @type {number}
     * @private
     */
    this.workerId_ = workerId;

    /**
     * Handle to the underlying worker instance.
     * @type {!Worker}
     * @private
     */
    this.handle_ = new originalWorker(scriptUrl);

    var self = this;
    this.handle_.onerror = function(e) {
      var scope = onerrorScope(self.workerId_);
      try {
        self.dispatchEvent(e);
      } finally {
        wtf.trace.leaveScope(scope);
      }
    };
    this.handle_.onmessage = function(e) {
      var scope = onmessageScope(self.workerId_);
      try {
        self.dispatchEvent(e);
      } finally {
        wtf.trace.leaveScope(scope);
      }
    };
  };
  goog.inherits(WorkerShim,
      wtf.trace.providers.WebWorkerProvider.ShimEventTarget);

  var postMessageEvent = wtf.trace.events.createScope(
      'Worker#postMessage(uint32 id)');
  WorkerShim.prototype['postMessage'] = function(message, opt_transfer) {
    var scope = postMessageEvent(this.workerId_);
    try {
      this.handle_.postMessage(message, opt_transfer);
    } finally {
      wtf.trace.leaveScope(scope);
    }
  };

  var terminateEvent = wtf.trace.events.createInstance(
      'Worker#terminate(uint32 id)');
  WorkerShim.prototype['terminate'] = function() {
    terminateEvent(this.workerId_);
    this.handle_.terminate();
  };

  var nextWorkerId = 0;
  var workerCtorEvent = wtf.trace.events.createScope(
      'Worker(ascii scriptUrl, uint32 id)');
  this.injectFunction(goog.global, 'Worker', function Worker(scriptUrl) {
    var workerId = nextWorkerId++;
    var scope = workerCtorEvent(scriptUrl, workerId);
    try {
      return new WorkerShim(scriptUrl, workerId);
    } finally {
      wtf.trace.leaveScope(scope);
    }
  });
};


/**
 * Injects worker constructor shims.
 * @private
 */
wtf.trace.providers.WebWorkerProvider.prototype.injectWorkerShim_ =
    function() {
  //WorkerUtils
  //  importScripts(var_arg urls)
  //  WorkerNavigator navigator:
  //WorkerGlobalScope <- WorkerUtils, EventTarget
  //  location
  //  onerror
  //  onoffline
  //  ononline
  //DedicatedWorkerGlobalScope <- WorkerGlobalScope
  //  postMessage(message, opt_transfer)
  //  onmessage - MessageEvent
  //
  // interface ErrorEvent : Event {
  //   readonly attribute DOMString message;
  //   readonly attribute DOMString filename;
  //   readonly attribute unsigned long lineno;
  //   readonly attribute unsigned long column;
  // };
  // interface MessageEvent : Event {
  //   readonly attribute any data;
  //   readonly attribute DOMString origin;
  //   readonly attribute DOMString lastEventId;
  //   readonly attribute (WindowProxy or MessagePort)? source;
  //   readonly attribute MessagePort[]? ports;
  // }
};



// TODO(benvanik): move to shared code
// TODO(benvanik): enhance and use for other DOM proxies (XHR/etc)
/**
 * EventTarget shim.
 * @param {!Object.<Function>} eventMap Event map.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.trace.providers.WebWorkerProvider.ShimEventTarget = function(eventMap) {
  goog.base(this);

  /**
   * Event map.
   * @type {!Object.<!Function>}
   * @private
   */
  this.eventMap_ = eventMap;

  /**
   * Event listeners.
   * @type {!Object.<!Array.<!Object>>}
   * @private
   */
  this.listeners_ = {};

  /**
   * on* listeners.
   * @type {!Object.<Function?>}
   * @private
   */
  this.onListeners_ = {};
};
goog.inherits(wtf.trace.providers.WebWorkerProvider.ShimEventTarget,
    goog.Disposable);


/**
 * Adds an event listener.
 * @param {string} type The type of the event to listen for.
 * @param {Function|Object} listener The function to handle the event. The
 *     handler can also be an object that implements the handleEvent method
 *     which takes the event object as argument.
 * @param {boolean=} opt_useCapture In DOM-compliant browsers, this determines
 *     whether the listener is fired during the capture or bubble phase
 *     of the event.
 */
wtf.trace.providers.WebWorkerProvider.ShimEventTarget.
    prototype['addEventListener'] = function(type, listener, opt_useCapture) {
  var list = this.listeners_[type] || [];
  this.listeners_[type] = list;
  list.push({
    listener: listener,
    useCapture: opt_useCapture || false
  });
};


/**
 * Removes an event listener.
 * @param {string} type The type of the event to listen for.
 * @param {Function|Object} listener The function to handle the event. The
 *     handler can also be an object that implements the handleEvent method
 *     which takes the event object as argument.
 * @param {boolean=} opt_useCapture In DOM-compliant browsers, this determines
 *     whether the listener is fired during the capture or bubble phase
 *     of the event.
 */
wtf.trace.providers.WebWorkerProvider.ShimEventTarget.
    prototype['removeEventListener'] = function(
        type, listener, opt_useCapture) {
  var list = this.listeners_[type];
  if (list) {
    for (var n = 0; n < list.length; n++) {
      if (list[n].listener == listener &&
          list[n].useCapture == opt_useCapture) {
        list.splice(n, 1);
        break;
      }
    }
    if (!list.length) {
      delete this.listeners_[type];
    }
  }
};


Object.defineProperty(wtf.trace.providers.WebWorkerProvider.ShimEventTarget.
    prototype, 'onerror', {
      'configurable': false,
      'enumerable': false,
      'get':
          /**
           * @return {?Function}
           * @this {wtf.trace.providers.WebWorkerProvider.ShimEventTarget}
           */
          function() {
            return this.onListeners_['error'] || null;
          },
      'set':
          /**
           * @param {?Function} value
           * @this {wtf.trace.providers.WebWorkerProvider.ShimEventTarget}
           */
          function(value) {
            delete this.listeners_['error'];
            this.onListeners_['error'] = value || null;
          }
    });


Object.defineProperty(wtf.trace.providers.WebWorkerProvider.ShimEventTarget.
    prototype, 'onmessage', {
      'configurable': false,
      'enumerable': false,
      'get':
          /**
           * @return {?Function}
           * @this {wtf.trace.providers.WebWorkerProvider.ShimEventTarget}
           */
          function() {
            return this.onListeners_['message'] || null;
          },
      'set':
          /**
           * @param {?Function} value
           * @this {wtf.trace.providers.WebWorkerProvider.ShimEventTarget}
           */
          function(value) {
            delete this.listeners_['message'];
            this.onListeners_['message'] = value || null;
          }
    });


/**
 * Dispatches an event.
 * @param {Event} e Event.
 */
wtf.trace.providers.WebWorkerProvider.ShimEventTarget.prototype.dispatchEvent =
    function(e) {
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
wtf.trace.providers.WebWorkerProvider.ShimEventTarget.prototype.
    dispatchToListener = function(e, listener) {
  var eventKey = e.type;
  var eventType = this.eventMap_[eventKey];
  var scope = this['__wtf_ignore__'] ? null : eventType();
  try {
    if (listener['handleEvent']) {
      // Listener is an EventListener.
      listener['handleEvent'](e);
    } else {
      // Listener is a function.
      return listener.apply(this, arguments);
    }
  } finally {
    wtf.trace.leaveScope(scope);
  }
};
