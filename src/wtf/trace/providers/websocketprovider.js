/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview WebSocket event provider.
 *
 * @author henridf@sessionbox.com (Henri Dubois-Ferriere, Sessionbox)
 */

goog.provide('wtf.trace.providers.WebSocketProvider');

goog.require('wtf.trace.Provider');
goog.require('wtf.trace.Scope');
goog.require('wtf.trace.events');
goog.require('wtf.trace.eventtarget');
goog.require('wtf.trace.eventtarget.BaseEventTarget');



/**
 * Provides WebSocket API events.
 *
 * @param {!wtf.util.Options} options Options.
 * @constructor
 * @extends {wtf.trace.Provider}
 */
wtf.trace.providers.WebSocketProvider = function(options) {
  goog.base(this, options);

  if (!goog.global['WebSocket']) {
    return;
  }

  var level = options.getNumber('wtf.trace.provider.websocket', 1);
  if (!level) {
    return;
  }

  this.injectWs_();
};
goog.inherits(wtf.trace.providers.WebSocketProvider, wtf.trace.Provider);


/**
 * @override
 */
wtf.trace.providers.WebSocketProvider.prototype.getSettingsSectionConfigs =
    function() {
  return [
    {
      'title': 'WebSockets',
      'widgets': [
        {
          'type': 'checkbox',
          'key': 'wtf.trace.provider.websocket',
          'title': 'Enabled',
          'default': true
        }
      ]
    }
  ];
};


/**
 * Injects the WebSocket shim.
 * @private
 */
wtf.trace.providers.WebSocketProvider.prototype.injectWs_ = function() {
  var originalWs = goog.global['WebSocket'];

  // Get all event types from the IDL store.
  // This will be a map of event name to the {@code EVENT_TYPES} objects.
  // NOTE: disabled full events until Issue #365.
  // var eventTypes = wtf.data.webidl.getAllEvents('WebSocket');
  var eventTypes = {
    'open': null,
    'error': null,
    'close': null,
    'message': null
  };

  var descriptor = wtf.trace.eventtarget.createDescriptor(
      'WebSocket', eventTypes);

  var ctorEvent = wtf.trace.events.createScope('WebSocket()');

  /**
   * Proxy WebSocket.
   * @constructor
   * @param {string} url Destination URL.
   * @param {string=} opt_protocols Optional protocol.
   * @extends {wtf.trace.eventtarget.BaseEventTarget}
   */
  var ProxyWebSocket = function WebSocket(url, opt_protocols) {
    var scope = ctorEvent();
    goog.base(this, descriptor);

    /**
     * Underlying WS.
     * @type {!WebSocket}
     * @private
     */
    this.handle_ = arguments.length == 1 ?
        new originalWs(url) :
        new originalWs(url, opt_protocols);

    /**
     * Event type trackers, by name.
     * @type {!Object.<Function>}
     * @private
     */
    this.trackers_ = {};

    /**
     * Properties, accumulated during setup before send().
     * @type {!Object}
     * @private
     */
    this.props_ = {
      'url': url,
      'protocol': opt_protocols
    };

    wtf.trace.Scope.leave(scope);
  };
  goog.inherits(ProxyWebSocket, wtf.trace.eventtarget.BaseEventTarget);

  // Constants.
  ProxyWebSocket['CONNECTING'] = 0;
  ProxyWebSocket['OPEN'] = 1;
  ProxyWebSocket['CLOSING'] = 2;
  ProxyWebSocket['CLOSED'] = 3;
  ProxyWebSocket.prototype['CONNECTING'] = 0;
  ProxyWebSocket.prototype['OPEN'] = 1;
  ProxyWebSocket.prototype['CLOSING'] = 2;
  ProxyWebSocket.prototype['CLOSED'] = 3;

  // Event tracking.
  ProxyWebSocket.prototype.beginTrackingEvent = function(type) {
    var self = this;
    var tracker = function(e) {
      self['dispatchEvent'](e);
    };
    this.trackers_[type] = tracker;
    this.handle_.addEventListener(type, tracker, false);
  };
  ProxyWebSocket.prototype.endTrackingEvent = function(type) {
    this.handle_.removeEventListener(type, this.trackers_[type], false);
    delete this.trackers_[type];
  };

  // Setup on* events.
  var eventInfos = descriptor.eventInfos;
  for (var n = 0; n < eventInfos.length; n++) {
    var eventInfo = eventInfos[n];
    Object.defineProperty(ProxyWebSocket.prototype,
        'on' + eventInfo.name, {
          'configurable': true,
          'enumerable': true,
          'get': eventInfo.getter,
          'set': eventInfo.setter
        });
  }

  /**
   * Sets up a proxy property, optionally setting a props bag value.
   * @param {string} name Property name.
   * @param {boolean=} opt_setPropsValue True to set a props value of the same
   *     name with the given value.
   */
  function setupProxyProperty(name, opt_setPropsValue) {
    Object.defineProperty(ProxyWebSocket.prototype, name, {
      'configurable': true,
      'enumerable': true,
      'get': function() {
        return this.handle_[name];
      },
      'set': opt_setPropsValue ? function(value) {
        this.props_[name] = value;
        this.handle_[name] = value;
      } : function(value) {
        this.handle_[name] = value;
      }
    });
  };

  setupProxyProperty('url', true);
  setupProxyProperty('readyState');
  setupProxyProperty('bufferedAmount');
  setupProxyProperty('protocol', true);
  setupProxyProperty('extensions');
  setupProxyProperty('binaryType');

  var sendEvent = wtf.trace.events.createScope(
      'WebSocket#send(ascii url)');
  ProxyWebSocket.prototype['send'] = function(data) {
    var props = this.props_;

    var scope = sendEvent(props['url']);

    try {
      return this.handle_.send.apply(this.handle_, arguments);
    } finally {
      wtf.trace.Scope.leave(scope);
    }
  };

  var closeEvent = wtf.trace.events.createScope(
      'WebSocket#close()');
  ProxyWebSocket.prototype['close'] = function() {
    var scope = closeEvent();
    try {
      return this.handle_.close.apply(this.handle_, arguments);
    } finally {
      wtf.trace.Scope.leave(scope);
    }
  };

  ProxyWebSocket['raw'] = originalWs;
  this.injectFunction(goog.global, 'WebSocket', ProxyWebSocket);
};
