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
 * @constructor
 * @extends {wtf.trace.Provider}
 */
wtf.trace.providers.XhrProvider = function() {
  goog.base(this);

  if (!goog.global['XMLHttpRequest']) {
    return;
  }

  this.injectXhr_();
};
goog.inherits(wtf.trace.providers.XhrProvider, wtf.trace.Provider);


/**
 * Injects the XMLHttpRequst shim.
 * @private
 */
wtf.trace.providers.XhrProvider.prototype.injectXhr_ = function() {
  var originalXhr = goog.global['XMLHttpRequest'];

  var descriptor = wtf.trace.eventtarget.createDescriptor(
      'XMLHttpRequest', [
        'loadstart',
        'progress',
        'abort',
        'error',
        'load',
        'timeout',
        'loadend',
        'readystatechange'
      ]);

  /**
   * Proxy XHR.
   * @constructor
   * @extends {wtf.trace.eventtarget.BaseEventTarget}
   */
  var ProxyXMLHttpRequest = function XMLHttpRequest() {
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
     * @type {{
     *   method: string?,
     *   url: string?,
     *   async: boolean,
     *   user: string?,
     *   headers: !Object,
     *   timeout: number,
     *   withCredentials: boolean,
     *   overrideMimeType: string?,
     *   responseType: string
     * }}
     * @private
     */
    this.props_ = {
      method: null,
      url: null,
      async: true,
      user: null,
      headers: {},
      timeout: 0,
      withCredentials: false,
      overrideMimeType: null,
      responseType: ''
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
      wtf.trace.appendScopeData('url', props.url);
      wtf.trace.appendScopeData('readyState', handle.readyState);
    });
    this.setEventHook('load', function(e) {
      wtf.trace.appendScopeData('url', props.url);
    });
  };
  goog.inherits(ProxyXMLHttpRequest, wtf.trace.eventtarget.BaseEventTarget);

  // Constnats.
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
      self['dispatchEvent'](e);
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

  Object.defineProperty(ProxyXMLHttpRequest.prototype, 'readyState', {
    'configurable': true,
    'enumerable': true,
    'get': function() {
      return this.handle_.readyState;
    },
    'set': function(value) {
      this.handle_.readyState = value;
    }
  });
  ProxyXMLHttpRequest.prototype['setRequestHeader'] = function(
      header, value) {
    var props = this.props_;
    props.headers[header] = value;
    this.handle_.setRequestHeader(header, value);
  };
  ProxyXMLHttpRequest.prototype['overrideMimeType'] = function(mime) {
    var props = this.props_;
    props.overrideMimeType = mime;
    this.handle_.overrideMimeType(mime);
  };
  Object.defineProperty(ProxyXMLHttpRequest.prototype, 'timeout', {
    'configurable': true,
    'enumerable': true,
    'get': function() {
      return this.handle_.timeout;
    },
    'set': function(value) {
      var props = this.props_;
      props.timeout = value;
      this.handle_.timeout = value;
    }
  });
  Object.defineProperty(ProxyXMLHttpRequest.prototype, 'withCredentials', {
    'configurable': true,
    'enumerable': true,
    'get': function() {
      return this.handle_.withCredentials;
    },
    'set': function(value) {
      var props = this.props_;
      props.withCredentials = value;
      this.handle_.withCredentials = value;
    }
  });
  Object.defineProperty(ProxyXMLHttpRequest.prototype, 'upload', {
    'configurable': true,
    'enumerable': true,
    'get': function() {
      return this.handle_.upload;
    },
    'set': function(value) {
      var props = this.props_;
      // TODO(benvanik): track upload info.
      this.handle_.upload = value;
    }
  });

  var openEvent = wtf.trace.events.createScope(
      'XMLHttpRequest#open(ascii method, ascii url, any props)');
  ProxyXMLHttpRequest.prototype['open'] = function(
      method, url, opt_async, opt_user, opt_password) {
    var props = this.props_;
    props.method = method;
    props.url = url;
    props.async = opt_async === undefined ? true : opt_async;
    props.user = opt_user || null;

    var flow = wtf.trace.Flow.branch('open');
    this.flow_ = flow;

    var scope = openEvent(props.method, props.url, props);

    try {
      return this.handle_.open(method, url, opt_async, opt_user, opt_password);
    } finally {
      wtf.trace.Scope.leave(scope);
    }
  };

  var sendEvent = wtf.trace.events.createScope(
      'XMLHttpRequest#send(ascii method, ascii url, any props)');
  ProxyXMLHttpRequest.prototype['send'] = function(opt_data) {
    var flow = this.flow_;
    var props = this.props_;
    // TODO(benvanik): track send data.

    if (flow) {
      wtf.trace.Flow.extend(flow, 'send');
      // TODO(benvanik): append props to flow
    }

    var scope = sendEvent(props.method, props.url, props);

    // TODO(benvanik): find a way to do this - may need an option.
    // Right now this breaks cross-origin XHRs. The server would need to
    // say its allowed, perhaps via an OPTION tag.
    //originalSetRequestHeader.call(this, 'X-WTF-XHR-FlowID', flow.getId());

    try {
      this.handle_.send(opt_data);
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
      this.handle_.abort();
    } finally {
      wtf.trace.Scope.leave(scope);
    }
  };

  Object.defineProperty(ProxyXMLHttpRequest.prototype, 'status', {
    'configurable': true,
    'enumerable': true,
    'get': function() {
      return this.handle_.status;
    },
    'set': function(value) {
      this.handle_.status = value;
    }
  });
  Object.defineProperty(ProxyXMLHttpRequest.prototype, 'statusText', {
    'configurable': true,
    'enumerable': true,
    'get': function() {
      return this.handle_.statusText;
    },
    'set': function(value) {
      this.handle_.statusText = value;
    }
  });
  ProxyXMLHttpRequest.prototype['getResponseHeader'] = function(header) {
    return this.handle_.getResponseHeader(header);
  };
  ProxyXMLHttpRequest.prototype['getAllResponseHeaders'] = function() {
    return this.handle_.getAllResponseHeaders();
  };
  Object.defineProperty(ProxyXMLHttpRequest.prototype, 'responseType', {
    'configurable': true,
    'enumerable': true,
    'get': function() {
      return this.handle_.responseType;
    },
    'set': function(value) {
      var props = this.props_;
      props.responseType = value || '';
      this.handle_.responseType = value;
    }
  });
  Object.defineProperty(ProxyXMLHttpRequest.prototype, 'response', {
    'configurable': true,
    'enumerable': true,
    'get': function() {
      return this.handle_.response;
    },
    'set': function(value) {
      this.handle_.response = value;
    }
  });
  Object.defineProperty(ProxyXMLHttpRequest.prototype, 'responseText', {
    'configurable': true,
    'enumerable': true,
    'get': function() {
      return this.handle_.responseText;
    },
    'set': function(value) {
      this.handle_.responseText = value;
    }
  });
  Object.defineProperty(ProxyXMLHttpRequest.prototype, 'responseXML', {
    'configurable': true,
    'enumerable': true,
    'get': function() {
      return this.handle_.responseXML;
    },
    'set': function(value) {
      this.handle_.responseXML = value;
    }
  });

  this.injectFunction(goog.global, 'XMLHttpRequest', ProxyXMLHttpRequest);
};
