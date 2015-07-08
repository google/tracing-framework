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

goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.fs');
goog.require('goog.object');
goog.require('goog.result');
goog.require('goog.result.Result');
goog.require('goog.result.SimpleResult');
goog.require('goog.string');
goog.require('wtf.data.webidl');
goog.require('wtf.trace');
goog.require('wtf.trace.ISessionListener');
goog.require('wtf.trace.Provider');
goog.require('wtf.trace.events');
goog.require('wtf.trace.eventtarget');
goog.require('wtf.trace.eventtarget.BaseEventTarget');
goog.require('wtf.trace.util');



/**
 * Provides Web Worker API events.
 *
 * @param {!wtf.trace.TraceManager} traceManager Trace manager.
 * @param {!wtf.util.Options} options Options.
 * @constructor
 * @implements {wtf.trace.ISessionListener}
 * @extends {wtf.trace.Provider}
 */
wtf.trace.providers.WebWorkerProvider = function(traceManager, options) {
  goog.base(this, options);

  var level = options.getNumber('wtf.trace.provider.webworker', 1);
  if (!level) {
    return;
  }

  /**
   * Whether WTF will be injected into workers.
   * @type {boolean}
   * @private
   */
  this.injecting_ = options.getBoolean(
      'wtf.trace.provider.webworker.inject', false);

  // TODO(benvanik): use weak references (WeakMap) when supported.
  /**
   * All active child workers.
   * @type {!Array.<!Object>}
   * @private
   */
  this.childWorkers_ = [];

  // MessageChannel/MessagePort.
  if (typeof goog.global['MessagePort'] == 'function') {
    this.injectMessagePort_();
  }

  // Since workers will eventually be available within workers we test for them.
  if (typeof goog.global['Worker'] == 'function') {
    this.injectBrowserShim_();
  }

  // Nasty test - assume we aren't Node.
  if (!goog.global['HTMLDivElement']) {
    this.injectProxyWorker_();
  }

  // Listen for snapshots and such.
  traceManager.addListener(this);
};
goog.inherits(wtf.trace.providers.WebWorkerProvider, wtf.trace.Provider);


/**
 * @override
 */
wtf.trace.providers.WebWorkerProvider.prototype.getSettingsSectionConfigs =
    function() {
  return [
    {
      'title': 'Web Workers',
      'widgets': [
        {
          'type': 'checkbox',
          'key': 'wtf.trace.provider.webworker',
          'title': 'Enabled',
          'default': true
        },
        {
          'type': 'checkbox',
          'key': 'wtf.trace.provider.webworker.inject',
          'title': 'Inject WTF into Workers',
          'default': false
        }
      ]
    }
  ];
};


/**
 * @override
 */
wtf.trace.providers.WebWorkerProvider.prototype.sessionStarted =
    goog.nullFunction;


/**
 * @override
 */
wtf.trace.providers.WebWorkerProvider.prototype.sessionStopped =
    goog.nullFunction;


/**
 * @override
 */
wtf.trace.providers.WebWorkerProvider.prototype.requestSnapshots = function(
    session, callback, opt_scope) {
  // If not injecting, abort.
  if (!this.injecting_) {
    return;
  }

  this.childWorkers_.forEach(function(worker) {
    goog.result.wait(worker.requestSnapshot(), function(result) {
      var buffers = /** @type {Array.<!wtf.io.Blob>} */ (result.getValue());
      if (!buffers || !buffers.length ||
          result.getState() == goog.result.Result.State.ERROR) {
        // Failed!
        callback.call(opt_scope, null);
      } else {
        callback.call(opt_scope, buffers[0]);
      }
    });
  });
  return this.childWorkers_.length;
};


/**
 * @override
 */
wtf.trace.providers.WebWorkerProvider.prototype.reset = function() {
  this.childWorkers_.forEach(function(worker) {
    worker.reset();
  });
};


/**
 * Injects MessagePort/MessageChannel.
 * @private
 */
wtf.trace.providers.WebWorkerProvider.prototype.injectMessagePort_ =
    function() {
  var proto = goog.global['MessagePort'].prototype;

  var postMessageEvent = wtf.trace.events.createScope(
      'MessagePort#postMessage()');
  var originalPostMessage = proto.postMessage;
  this.injectFunction(proto, 'postMessage',
      function postMessage(message, opt_transfer) {
        var result;
        try {
          var scope = postMessageEvent();
          result = originalPostMessage.apply(this, arguments);
        } finally {
          return wtf.trace.leaveScope(scope, result);
        }
      });

  var startEvent = wtf.trace.events.createScope(
      'MessagePort#start()');
  var originalStart = proto.start;
  this.injectFunction(proto, 'start',
      function start() {
        var result;
        try {
          var scope = startEvent();
          result = originalStart.apply(this, arguments);
        } finally {
          return wtf.trace.leaveScope(scope, result);
        }
      });

  var closeEvent = wtf.trace.events.createScope(
      'MessagePort#close()');
  var originalClose = proto.close;
  this.injectFunction(proto, 'close',
      function close() {
        var result;
        try {
          var scope = closeEvent();
          result = originalClose.apply(this, arguments);
        } finally {
          return wtf.trace.leaveScope(scope, result);
        }
      });

  var descriptor = wtf.trace.eventtarget.createDescriptor(
      'MessagePort', wtf.data.webidl.getAllEvents('MessagePort'));
  wtf.trace.eventtarget.mixin(descriptor, proto);
  wtf.trace.eventtarget.setDescriptor(proto, descriptor);
  wtf.trace.eventtarget.setEventProperties(descriptor, proto);

  var originalMessageChannel = goog.global['MessageChannel'];
  if (originalMessageChannel) {
    goog.global['MessageChannel'] = function MessageChannel() {
      var channel = new originalMessageChannel();
      wtf.trace.eventtarget.initializeEventProperties(channel.port1);
      wtf.trace.eventtarget.initializeEventProperties(channel.port2);
      // The MessagePort spec only initializes message queues when the
      // onmessage IDL attribute is set; however, we override onmessage with a
      // setter that uses addEventListener so we must explictly call start()
      // to ensure the queues are initialized.
      channel.port1.start();
      channel.port2.start();
      return channel;
    };
  }
};


/**
 * Injects worker constructor shims.
 * @private
 */
wtf.trace.providers.WebWorkerProvider.prototype.injectBrowserShim_ =
    function() {
  var provider = this;
  var injecting = this.injecting_;

  // TODO(benvanik): add flow ID tracking code

  var originalWorker = goog.global['Worker'];

  // Get all event types from the IDL store.
  // This will be a map of event name to the {@code EVENT_TYPES} objects.
  var eventTypes = wtf.data.webidl.getAllEvents('Worker', [
    'error',
    'message'
  ]);

  var descriptor = wtf.trace.eventtarget.createDescriptor('Worker', eventTypes);

  // Get WTF URL.
  var wtfUrl = wtf.trace.util.getScriptUrl();
  var baseUri = new goog.Uri(goog.global.location.href);

  var nextWorkerId = 0;
  var workerCtorEvent = wtf.trace.events.createScope(
      'Worker(ascii scriptUrl, uint32 id)');

  /**
   * Creates a shim script that injects WTF.
   * @param {string} scriptUrl Source script URL.
   * @param {number} workerId Unique worker ID.
   * @return {string} Shim script URL.
   */
  function createInjectionShim(scriptUrl, workerId) {
    // Hacky handling for blob URLs.
    // Unfortunately Chrome doesn't like importScript on blobs inside of the
    // workers, so we need to embed it.
    var resolvedScriptUrl = null;
    var scriptContents = null;
    if (goog.string.startsWith(scriptUrl, 'blob:')) {
      var xhr = new (goog.global['XMLHttpRequest']['raw'] || XMLHttpRequest)();
      xhr.open('GET', scriptUrl, false);
      xhr.send();
      scriptContents = xhr.response;
    } else {
      resolvedScriptUrl = goog.Uri.resolve(baseUri, scriptUrl).toString();
    }

    var shimScriptLines = [
      'this.WTF_WORKER_ID = ' + workerId + ';',
      'this.WTF_WORKER_BASE_URI = "' + goog.global.location.href + '";',
      'importScripts("' + wtfUrl + '");',
      'wtf.trace.prepare({',
      '});',
      'wtf.trace.start();'
    ];

    // Add the script import or directly embed the contents.
    if (resolvedScriptUrl) {
      shimScriptLines.push('importScripts("' + resolvedScriptUrl + '");');
    } else if (scriptContents) {
      shimScriptLines.push('// Embedded: ' + scriptUrl);
      shimScriptLines.push(scriptContents);
    }

    var shimBlob = new Blob([shimScriptLines.join('\n')], {
      'type': 'text/javascript'
    });
    var shimScriptUrl = goog.fs.createObjectUrl(shimBlob);

    return shimScriptUrl;
  };

  /**
   * Worker shim.
   * @param {string} scriptUrl Script URL.
   * @constructor
   * @extends {wtf.trace.eventtarget.BaseEventTarget}
   */
  var ProxyWorker = function(scriptUrl) {
    goog.base(this, descriptor);

    /**
     * Tracking ID.
     * @type {number}
     * @private
     */
    this.workerId_ = nextWorkerId++;

    // Create the child worker.
    // If we are injecting generate a shim script and use that.
    var newScriptUrl = scriptUrl;
    if (injecting) {
      newScriptUrl = createInjectionShim(scriptUrl, this.workerId_);
    }
    var scope = workerCtorEvent(scriptUrl, this.workerId_);
    goog.global['Worker'] = originalWorker;
    var previousGlobalWorker = goog.global['Worker'];
    var handle;
    try {
      handle = new originalWorker(newScriptUrl);
    } finally {
      goog.global['Worker'] = previousGlobalWorker;
      wtf.trace.leaveScope(scope);
    }

    /**
     * Handle to the underlying worker instance.
     * @type {!Worker}
     * @private
     */
    this.handle_ = handle;

    /**
     * Event type trackers, by name.
     * @type {!Object.<Function>}
     * @private
     */
    this.trackers_ = {};

    this.setEventHook('error', function(e) {
      wtf.trace.appendScopeData('id', this.workerId_);
    }, this);
    this.setEventHook('message', function(e) {
      wtf.trace.appendScopeData('id', this.workerId_);
    }, this);

    // Always hook onmessage.
    // By doing it here we get first access to the event.
    var self = this;
    this.handle_.addEventListener('message', function(e) {
      // Sniff provider messages.
      if (!e.data['__wtf_worker_msg__']) {
        return;
      }
      e['__wtf_ignore__'] = true;

      var value = e.data['value'];
      switch (e.data['command']) {
        case 'snapshot':
          var result = pendingSnapshots[value['id']];
          delete pendingSnapshots[value['id']];
          if (!result.getError()) {
            result.setValue(value['data']);
          }
          break;
        case 'close':
          goog.array.remove(provider.childWorkers_, self);
          break;
      }
    }, false);

    provider.childWorkers_.push(this);
  };
  goog.inherits(ProxyWorker, wtf.trace.eventtarget.BaseEventTarget);

  // Event tracking.
  ProxyWorker.prototype.beginTrackingEvent = function(type) {
    var self = this;
    var tracker = function(e) {
      self['dispatchEvent'](e);
    };
    this.trackers_[type] = tracker;
    this.handle_.addEventListener(type, tracker, false);
  };
  ProxyWorker.prototype.endTrackingEvent = function(type) {
    this.handle_.removeEventListener(type, this.trackers_[type], false);
    delete this.trackers_[type];
  };

  // Setup on* events.
  var eventInfos = descriptor.eventInfos;
  for (var n = 0; n < eventInfos.length; n++) {
    var eventInfo = eventInfos[n];
    Object.defineProperty(ProxyWorker.prototype,
        'on' + eventInfo.name, {
          'configurable': false,
          'enumerable': false,
          'get': eventInfo.getter,
          'set': eventInfo.setter
        });
  }

  /**
   * Sends an internal message to the worker.
   * @param {string} command Command name.
   * @param {*=} opt_value Command value.
   */
  ProxyWorker.prototype.sendMessage = function(command, opt_value) {
    this.handle_.postMessage({
      '__wtf_worker_msg__': true,
      'command': command,
      'value': opt_value || null
    });
  };

  var postMessageEvent = wtf.trace.events.createScope(
      'Worker#postMessage(uint32 id)');
  ProxyWorker.prototype['postMessage'] = function(message, opt_transfer) {
    var scope = postMessageEvent(this.workerId_);
    try {
      return this.handle_.postMessage.apply(this.handle_, arguments);
    } finally {
      wtf.trace.leaveScope(scope);
    }
  };

  if (originalWorker['webkitPostMessage']) {
    var webkitPostMessageEvent = wtf.trace.events.createScope(
        'Worker#webkitPostMessage(uint32 id)');
    ProxyWorker.prototype['webkitPostMessage'] = function(
        message, opt_transfer) {
      var scope = webkitPostMessageEvent(this.workerId_);
      try {
        return this.handle_.webkitPostMessage.apply(this.handle_, arguments);
      } finally {
        wtf.trace.leaveScope(scope);
      }
    };
  }

  var terminateEvent = wtf.trace.events.createInstance(
      'Worker#terminate(uint32 id)');
  ProxyWorker.prototype['terminate'] = function() {
    // TODO(benvanik): request a snapshot before terminating?
    goog.array.remove(provider.childWorkers_, this);

    terminateEvent(this.workerId_);
    return this.handle_.terminate.apply(this.handle_, arguments);
  };

  var pendingSnapshots = {};
  var snapshotRequestId = 0;
  ProxyWorker.prototype.requestSnapshot = function() {
    var result = new goog.result.SimpleResult();
    var snapshotId = snapshotRequestId++;
    pendingSnapshots[snapshotId] = result;
    this.sendMessage('snapshot', {
      'id': snapshotId
    });
    return result;
  };

  ProxyWorker.prototype.reset = function() {
    this.sendMessage('reset');
  };

  this.injectFunction(goog.global, 'Worker', ProxyWorker);
};


/**
 * Injects worker constructor shims.
 * @private
 */
wtf.trace.providers.WebWorkerProvider.prototype.injectProxyWorker_ =
    function() {
  // var workerId = goog.global['WTF_WORKER_ID'];
  var baseUri = new goog.Uri(goog.global['WTF_WORKER_BASE_URI']);

  // Get all event types from the IDL store.
  // This will be a map of event name to the {@code EVENT_TYPES} objects.
  var eventTypes = wtf.data.webidl.getAllEvents('WorkerGlobalScope', [
    'error',
    'online',
    'offline',
    'message'
  ]);

  // Mixin addEventListener/etc.
  var globalDescriptor = wtf.trace.eventtarget.createDescriptor(
      'WorkerGlobalScope', eventTypes);
  wtf.trace.eventtarget.mixin(globalDescriptor, goog.global);

  // Setup on* events.
  wtf.trace.eventtarget.setEventProperties(globalDescriptor, goog.global);
  //wtf.trace.eventtarget.initializeEventProperties(goog.global);

  // -- WorkerUtils --

  var originalImportScripts = goog.global.importScripts;
  var importScriptsEvent = wtf.trace.events.createScope(
      'WorkerUtils#importScripts(any urls)');
  this.injectFunction(goog.global, 'importScripts', function(var_args) {
    var urls = new Array(arguments.length);
    for (var n = 0; n < arguments.length; n++) {
      urls[n] = goog.Uri.resolve(baseUri, arguments[n]).toString();
    }
    var scope = importScriptsEvent(urls);
    try {
      return originalImportScripts.apply(goog.global, urls);
    } finally {
      wtf.trace.leaveScope(scope);
    }
  });

  // TODO(benvanik): spoof location with baseUri
  //goog.global['location'] = WorkerLocation;

  // -- WorkerGlobalScope --

  var originalClose = goog.global.close;
  var closeEvent = wtf.trace.events.createInstance(
      'WorkerGlobalScope#close()');
  this.injectFunction(goog.global, 'close', function() {
    closeEvent();
    sendMessage('close');
    return originalClose.apply(goog.global, arguments);
  });

  // TODO(benvanik): onerror - ErrorEvent
  // interface ErrorEvent : Event {
  //   readonly attribute DOMString message;
  //   readonly attribute DOMString filename;
  //   readonly attribute unsigned long lineno;
  //   readonly attribute unsigned long column;
  // };

  // TODO(benvanik): onoffline/ononline

  // -- DedicatedWorkerGlobalScope --

  var originalPostMessage = goog.global.postMessage;
  var postMessageEvent = wtf.trace.events.createScope(
      'DedicatedWorkerGlobalScope#postMessage()');
  this.injectFunction(goog.global, 'postMessage', function(
      message, opt_transfer) {
        var scope = postMessageEvent();
        try {
          return originalPostMessage.apply(goog.global, arguments);
        } finally {
          wtf.trace.leaveScope(scope);
        }
      });

  var originalWebkitPostMessage = goog.global['webkitPostMessage'];
  if (originalWebkitPostMessage) {
    var webkitPostMessageEvent = wtf.trace.events.createScope(
        'DedicatedWorkerGlobalScope#webkitPostMessage()');
    this.injectFunction(goog.global, 'webkitPostMessage', function(
        message, opt_transfer) {
          var scope = webkitPostMessageEvent();
          try {
            return originalWebkitPostMessage.apply(goog.global, arguments);
          } finally {
            wtf.trace.leaveScope(scope);
          }
        });
  }

  // TODO(benvanik): DedicatedWorkerGlobalScope#onmessage - MessageEvent
  // interface MessageEvent : Event {
  //   readonly attribute any data;
  //   readonly attribute DOMString origin;
  //   readonly attribute DOMString lastEventId;
  //   readonly attribute (WindowProxy or MessagePort)? source;
  //   readonly attribute MessagePort[]? ports;
  // }
  // TODO(benvanik): fully override the event dispatch.
  goog.global.addEventListener('message', function(e) {
    // Sniff provider messages.
    if (!e.data['__wtf_worker_msg__']) {
      return;
    }

    var value = e.data['value'];
    switch (e.data['command']) {
      case 'snapshot':
        // TODO(benvanik): use wtf.trace.snapshotAll
        var data = [];
        wtf.trace.snapshot(data);
        sendMessage('snapshot', {
          'id': value['id'],
          'data': data
        }, data[0]);
        break;
      case 'reset':
        // NOTE: due to the async nature of posting messages to workers, the
        // reset that happens on the worker thread won't happen at *exactly* the
        // same time, but the work to fix it seems greater than the utility we'd
        // get.
        wtf.trace.reset();
        break;
    }

    // Clean the data and hope the event gets handled correctly downstream.
    e['__wtf_ignore__'] = true;
    goog.object.clear(e.data);
    e.returnValue = false;
    return false;
  }, false);

  /**
   * Sends an internal message to the worker.
   * @param {string} command Command name.
   * @param {*=} opt_value Command value.
   * @param {Array=} opt_transfer Transferrable values.
   */
  function sendMessage(command, opt_value, opt_transfer) {
    // TODO(benvanik): attempt to use webkitPostMessage
    originalPostMessage.call(goog.global, {
      '__wtf_worker_msg__': true,
      'command': command,
      'value': opt_value || null
    }, []);
  };
};
