/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview XHR event provider.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.providers.XhrProvider');

goog.require('wtf.trace');
goog.require('wtf.trace.Flow');
goog.require('wtf.trace.Provider');
goog.require('wtf.trace.Scope');
goog.require('wtf.trace.events');
goog.require('wtf.trace.eventtarget');
goog.require('wtf.trace.eventtarget.BaseEventTarget');



/**
 * Provides XMLHttpRequest API events.
 *
 * @param {!wtf.util.Options} options Options.
 * @constructor
 * @extends {wtf.trace.Provider}
 */
wtf.trace.providers.XhrProvider = function(options) {
  goog.base(this, options);

  if (!goog.global['XMLHttpRequest']) {
    return;
  }

  var level = options.getNumber('wtf.trace.provider.xhr', 1);
  if (!level) {
    return;
  }

  this.injectXhr_();
};
goog.inherits(wtf.trace.providers.XhrProvider, wtf.trace.Provider);


/**
 * @override
 */
wtf.trace.providers.XhrProvider.prototype.getSettingsSectionConfigs =
    function() {
  return [
    {
      'title': 'XMLHttpRequest',
      'widgets': [
        {
          'type': 'checkbox',
          'key': 'wtf.trace.provider.xhr',
          'title': 'Enabled',
          'default': true
        }
      ]
    }
  ];
};


/**
 * Injects the XMLHttpRequst shim.
 * @private
 */
wtf.trace.providers.XhrProvider.prototype.injectXhr_ = function() {
  var originalXhr = goog.global['XMLHttpRequest'];

  // Get all event types from the IDL store.
  // This will be a map of event name to the {@code EVENT_TYPES} objects.
  // NOTE: disabled full events until Issue #365.
  // var eventTypes = wtf.data.webidl.getAllEvents('XMLHttpRequest');
  var eventTypes = {
    'loadstart': null,
    'progress': null,
    'abort': null,
    'error': null,
    'load': null,
    'timeout': null,
    'loadend': null,
    'readystatechange': null
  };

  var descriptor = wtf.trace.eventtarget.createDescriptor(
      'XMLHttpRequest', eventTypes);

  var ctorEvent = wtf.trace.events.createScope('XMLHttpRequest()');

  /**
   * Proxy XHR.
   * @constructor
   * @extends {wtf.trace.eventtarget.BaseEventTarget}
   */
  var ProxyXMLHttpRequest = function XMLHttpRequest() {
    var scope = ctorEvent();
    goog.base(this, descriptor);

    /**
     * Real XHR.
     * @type {!XMLHttpRequest}
     * @private
     */
    this.handle_ = new originalXhr();

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
      'method': null,
      'url': null,
      'async': true,
      'user': null,
      'headers': {},
      'timeout': 0,
      'withCredentials': false,
      'overrideMimeType': null,
      'responseType': ''
    };

    /**
     * Active flow, if any.
     * @type {wtf.trace.Flow}
     * @private
     */
    this.flow_ = null;

    // Always hook onreadystatechange.
    // By doing it here we get first access to the event.
    var self = this;
    var handle = this.handle_;
    var props = this.props_;
    this.handle_.addEventListener('readystatechange', function(e) {
      var flow = self.flow_;
      if (!flow) {
        return;
      }

      var value = undefined;
      if (handle.readyState == 2) {
        var headers = {};
        var allHeaders = handle.getAllResponseHeaders().split('\r\n');
        for (var n = 0; n < allHeaders.length; n++) {
          if (allHeaders[n].length) {
            var parts = allHeaders[n].split(':');
            headers[parts[0]] = parts[1].substr(1);
          }
        }
        value = {
          'status': this.status,
          'statusText': this.statusText,
          'headers': headers
        };
        // TODO(benvanik): appendFlowData
      }
      // TODO(benvanik): response size/type/etc

      // Extend flow, terminate if required.
      if (handle.readyState < 4) {
        wtf.trace.Flow.extend(flow, 'readyState: ' + handle.readyState, value);
      } else {
        wtf.trace.Flow.terminate(flow, 'readyState: ' + handle.readyState);
      }
    }, false);

    // Add data to interesting events.
    this.setEventHook('readystatechange', function(e) {
      wtf.trace.appendScopeData('url', props['url']);
      wtf.trace.appendScopeData('readyState', handle['readyState']);
    });
    this.setEventHook('load', function(e) {
      wtf.trace.appendScopeData('url', props['url']);
    });

    wtf.trace.Scope.leave(scope);
  };
  goog.inherits(ProxyXMLHttpRequest, wtf.trace.eventtarget.BaseEventTarget);

  // Constants.
  ProxyXMLHttpRequest['UNSENT'] = 0;
  ProxyXMLHttpRequest['OPENED'] = 1;
  ProxyXMLHttpRequest['HEADERS_RECEIVED'] = 2;
  ProxyXMLHttpRequest['LOADING'] = 3;
  ProxyXMLHttpRequest['DONE'] = 4;
  ProxyXMLHttpRequest.prototype['UNSENT'] = 0;
  ProxyXMLHttpRequest.prototype['OPENED'] = 1;
  ProxyXMLHttpRequest.prototype['HEADERS_RECEIVED'] = 2;
  ProxyXMLHttpRequest.prototype['LOADING'] = 3;
  ProxyXMLHttpRequest.prototype['DONE'] = 4;

  // Event tracking.
  ProxyXMLHttpRequest.prototype.beginTrackingEvent = function(type) {
    var self = this;
    var tracker = function(e) {
      var retargettedEvent = Object.create(e, {
        'target': {
          'value': self,
          'writable': false
        },
        'type': {
          'value': e.type,
          'writable': false
        }
      });
      self['dispatchEvent'](retargettedEvent);
    };
    this.trackers_[type] = tracker;
    this.handle_.addEventListener(type, tracker, false);
  };
  ProxyXMLHttpRequest.prototype.endTrackingEvent = function(type) {
    this.handle_.removeEventListener(type, this.trackers_[type], false);
    delete this.trackers_[type];
  };

  // Setup on* events.
  var eventInfos = descriptor.eventInfos;
  for (var n = 0; n < eventInfos.length; n++) {
    var eventInfo = eventInfos[n];
    Object.defineProperty(ProxyXMLHttpRequest.prototype,
        'on' + eventInfo.name, {
          'configurable': false,
          'enumerable': false,
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
    Object.defineProperty(ProxyXMLHttpRequest.prototype, name, {
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

  setupProxyProperty('readyState');
  setupProxyProperty('timeout', true);
  setupProxyProperty('withCredentials', true);
  setupProxyProperty('upload');
  ProxyXMLHttpRequest.prototype['setRequestHeader'] = function(
      header, value) {
    var props = this.props_;
    props['headers'][header] = value;
    return this.handle_.setRequestHeader.apply(this.handle_, arguments);
  };
  ProxyXMLHttpRequest.prototype['overrideMimeType'] = function(mime) {
    var props = this.props_;
    props['overrideMimeType'] = mime;
    return this.handle_.overrideMimeType.apply(this.handle_, arguments);
  };

  var openEvent = wtf.trace.events.createScope(
      'XMLHttpRequest#open(ascii method, ascii url, any props)');
  ProxyXMLHttpRequest.prototype['open'] = function(
      method, url, opt_async, opt_user, opt_password) {
    var props = this.props_;
    props['method'] = method;
    props['url'] = url;
    props['async'] = opt_async === undefined ? true : opt_async;
    props['user'] = opt_user || null;

    var flow = wtf.trace.Flow.branch('open');
    this.flow_ = flow;

    var scope = openEvent(props['method'], props['url'], props);

    try {
      return this.handle_.open.apply(this.handle_, arguments);
    } finally {
      wtf.trace.Scope.leave(scope);
    }
  };

  var sendEvent = wtf.trace.events.createScope(
      'XMLHttpRequest#send(ascii method, ascii url)');
  ProxyXMLHttpRequest.prototype['send'] = function(opt_data) {
    var flow = this.flow_;
    var props = this.props_;
    // TODO(benvanik): track send data.

    if (flow) {
      wtf.trace.Flow.extend(flow, 'send');
      // TODO(benvanik): append props to flow
    }

    var scope = sendEvent(props['method'], props['url']);

    // TODO(benvanik): find a way to do this - may need an option.
    // Right now this breaks cross-origin XHRs. The server would need to
    // say its allowed, perhaps via an OPTION tag.
    //originalSetRequestHeader.call(this, 'X-WTF-XHR-FlowID', flow.getId());

    try {
      return this.handle_.send.apply(this.handle_, arguments);
    } finally {
      wtf.trace.Scope.leave(scope);
    }
  };

  var abortEvent = wtf.trace.events.createScope(
      'XMLHttpRequest#abort()');
  ProxyXMLHttpRequest.prototype['abort'] = function() {
    var scope = abortEvent();

    var flow = this.flow_;
    this.flow_ = null;
    if (flow) {
      wtf.trace.Flow.terminate(flow, 'aborted');
    }

    try {
      return this.handle_.abort.apply(this.handle_, arguments);
    } finally {
      wtf.trace.Scope.leave(scope);
    }
  };

  setupProxyProperty('status');
  setupProxyProperty('statusText');
  setupProxyProperty('responseType', true);
  setupProxyProperty('response');
  setupProxyProperty('responseText');
  setupProxyProperty('responseXML');
  ProxyXMLHttpRequest.prototype['getResponseHeader'] = function(header) {
    return this.handle_.getResponseHeader.apply(this.handle_, arguments);
  };
  ProxyXMLHttpRequest.prototype['getAllResponseHeaders'] = function() {
    return this.handle_.getAllResponseHeaders.apply(this.handle_, arguments);
  };

  ProxyXMLHttpRequest['raw'] = originalXhr;
  this.injectFunction(goog.global, 'XMLHttpRequest', ProxyXMLHttpRequest);
};
