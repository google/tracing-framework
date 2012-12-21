/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview DOM event provider.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.providers.DomProvider');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.string');
goog.require('goog.userAgent.product');
goog.require('wtf.trace');
goog.require('wtf.trace.Provider');
goog.require('wtf.trace.events');



/**
 * Provides DOM events for common DOM types.
 *
 * @constructor
 * @extends {wtf.trace.Provider}
 */
wtf.trace.providers.DomProvider = function() {
  goog.base(this);

  this.injectEvents_();
};
goog.inherits(wtf.trace.providers.DomProvider, wtf.trace.Provider);


/**
 * Detected browser support for crazy constructs.
 *
 * prototypeEventDefine: whether on* events can be redefined on the prototype.
 * redefineEvent: whether on* events can be redefined at all.
 *
 * @type {{
 *   prototypeEventDefine: boolean,
 *   redefineEvent: boolean
 * }}
 * @private
 */
wtf.trace.providers.DomProvider.support_ = (function() {
  var prototypeEventDefine = false;
  var redefineEvent = false;
  if (goog.userAgent.product.CHROME) {
    // TODO(benvanik): real feature testing for this.
    prototypeEventDefine = true;
    redefineEvent = true;
  } else if (Object.defineProperty) {
    try {
      var image = new Image();
      delete image['onload'];
      var propertyValue = 123;
      Object.defineProperty(image, 'onload', {
        'configurable': false,
        'enumerable': false,
        'get': function() { return propertyValue; },
        'set': function(value) { propertyValue = value; }
      });
      image['onload'] = 456;
      if (image['onload'] == 456 &&
          propertyValue == 456) {
        redefineEvent = true;
      }
    } catch (e) {
      // Nope!
    }
  }
  return {
    prototypeEventDefine: prototypeEventDefine,
    redefineEvent: redefineEvent
  };
})();


/**
 * Injects event handler overrides on DOM event targets.
 * @private
 */
wtf.trace.providers.DomProvider.prototype.injectEvents_ = function() {
  var elementTypes = {
    'HTMLAnchorElement': 'a',
    'HTMLAppletElement': 'applet',
    'HTMLAreaElement': 'area',
    'HTMLAudioElement': 'audio',
    'HTMLBRElement': 'br',
    'HTMLBaseElement': 'base',
    'HTMLBaseFontElement': 'basefont',
    'HTMLBodyElement': 'body',
    'HTMLButtonElement': 'button',
    'HTMLCanvasElement': 'canvas',
    'HTMLContentElement': 'content',
    'HTMLDListElement': 'dl',
    'HTMLDirectoryElement': 'dir',
    'HTMLDivElement': 'div',
    // ['HTMLDocument',
    // ['HTMLElement',
    'HTMLEmbedElement': 'embed',
    'HTMLFieldSetElement': 'fieldset',
    'HTMLFontElement': 'font',
    'HTMLFormElement': 'form',
    'HTMLFrameElement': 'frame',
    'HTMLFrameSetElement': 'frameset',
    'HTMLHRElement': 'hr',
    'HTMLHeadElement': 'head',
    'HTMLHeadingElement': 'h1',
    'HTMLHtmlElement': 'html',
    'HTMLIFrameElement': 'iframe',
    'HTMLImageElement': 'img',
    'HTMLInputElement': 'input',
    'HTMLKeygenElement': 'keygen',
    'HTMLLIElement': 'li',
    'HTMLLabelElement': 'label',
    'HTMLLegendElement': 'legend',
    'HTMLLinkElement': 'link',
    'HTMLMapElement': 'map',
    'HTMLMarqueeElement': 'marquee',
    'HTMLMediaElement': 'media',
    'HTMLMenuElement': 'menu',
    'HTMLMetaElement': 'meta',
    'HTMLMeterElement': 'meter',
    'HTMLModElement': 'ins',
    'HTMLOListElement': 'ol',
    'HTMLObjectElement': 'object',
    'HTMLOptGroupElement': 'optgroup',
    'HTMLOptionElement': 'option',
    'HTMLOutputElement': 'output',
    'HTMLParagraphElement': 'p',
    'HTMLPreElement': 'pre',
    'HTMLProgressElement': 'progress',
    'HTMLQuoteElement': 'quote',
    'HTMLScriptElement': 'script',
    'HTMLSelectElement': 'select',
    'HTMLSourceElement': 'source',
    'HTMLSpanElement': 'span',
    'HTMLStyleElement': 'style',
    'HTMLTableCaptionElement': 'caption',
    'HTMLTableCellElement': 'td',
    'HTMLTableColElement': 'col',
    'HTMLTableElement': 'table',
    'HTMLTableRowElement': 'tr',
    'HTMLTableSectionElement': 'thead',
    'HTMLTextAreaElement': 'textarea',
    'HTMLTitleElement': 'title',
    'HTMLTrackElement': 'track',
    'HTMLUListElement': 'ul',
    'HTMLUnknownElement': 'UNKNOWN',
    'HTMLVideoElement': 'video'
  };
  var domTypes = [
    'Audio',
    'Document',
    'File',
    'FileReader',
    'Image',
    'Window',
    'XMLHttpRequest'
  ];
  for (var name in elementTypes) {
    domTypes.push(name);
  }

  var instrumentedTypeMap = {};
  for (var n = 0; n < domTypes.length; n++) {
    var typeName = domTypes[n];
    var classConstructor = goog.global[typeName];
    if (classConstructor) {
      var classPrototype = classConstructor.prototype;
      var instrumentedType =
          new wtf.trace.providers.DomProvider.InstrumentedType(
              typeName, classConstructor, classPrototype);
      instrumentedType.prepareOnEventHooks(elementTypes[typeName]);
      this.registerDisposable(instrumentedType);
      instrumentedTypeMap[typeName] = instrumentedType;
    }
  }

  // Always instrument Window, as the events live on its prototype.
  instrumentedTypeMap['Window'].hookObjectEvents(
      goog.global['Window'].prototype);

  // Inject document, as it's already existing, and body if it's there.
  instrumentedTypeMap['Document'].hookObjectEvents(
      goog.global['document']);
  if (goog.global['document']['body']) {
    // TODO(benvanik): this doesn't really work - the DOM has been initialized
    //     and if an event has already been set then it will be queued for
    //     dispatch unwrapped. Need to find a better way.
    instrumentedTypeMap['HTMLBodyElement'].hookObjectEvents(
        goog.global['document']['body']);
  }

  // Hook special type on* events.
  var eventInstrumentedTypes = [
    // 'Audio',
    // 'File',
    // 'FileReader',
    'Image',
    'XMLHttpRequest'
  ];
  for (var n = 0; n < eventInstrumentedTypes.length; n++) {
    var instrumentedType = instrumentedTypeMap[eventInstrumentedTypes[n]];
    instrumentedType.prepareOnEventHooks();
    instrumentedType.hookObjectEvents();
  }

  // Hook DOM element on* events.
  // If prototype events can be defined we can do that, otherwise we must
  // rewrite document.createElement.
  if (wtf.trace.providers.DomProvider.support_.prototypeEventDefine) {
    for (var name in elementTypes) {
      var instrumentedType = instrumentedTypeMap[name];
      if (instrumentedType) {
        instrumentedType.hookObjectEvents();
      }
    }
  } else if (wtf.trace.providers.DomProvider.support_.redefineEvent) {
    var documentPrototype = goog.global.HTMLDocument ?
        HTMLDocument.prototype : Document.prototype;
    var originalCreateElement = documentPrototype['createElement'];
    this.injectFunction(documentPrototype, 'createElement',
        function(name) {
          var result = originalCreateElement.apply(this, arguments);
          var ctorName = result.constructor.name;
          var instrumentedType = instrumentedTypeMap[ctorName];
          if (instrumentedType) {
            instrumentedType.hookObjectEvents(result);
          }
          return result;
        });
  }

  // TODO(benvanik): find a way to add object events to HTML elements?
};



/**
 * @param {string} name Type name.
 * @param {!Function} classConstructor Class constructor.
 * @param {!Object} classPrototype Class prototype.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.trace.providers.DomProvider.InstrumentedType = function(
    name, classConstructor, classPrototype) {
  goog.base(this);

  /**
   * Type name.
   * @type {string}
   * @private
   */
  this.name_ = name;

  /**
   * Class constructor.
   * @type {!Function}
   * @private
   */
  this.classConstructor_ = classConstructor;

  /**
   * Class prototype.
   * @type {!Object}
   * @private
   */
  this.classPrototype_ = classPrototype;

  /**
   * Cached on* event info from {@see #prepareOnEventHooks}.
   * @type {!Array.<!Object>}
   * @private
   */
  this.onEventInfos_ = [];

  /**
   * A list of injections performed by this provider.
   * Used to restore injections to their previous values.
   * @type {!Array.<{target:!Object, name:string, original:!Function}>}
   * @private
   */
  this.injections_ = [];

  /**
   * A map of event type names to custom trace scope events.
   * @type {!Object.<Function>}
   * @private
   */
  this.eventMap_ = {};

  // If the object looks like an EventTarget, inject.
  if (classPrototype['addEventListener']) {
    this.injectEventTarget_();
  }
};
goog.inherits(wtf.trace.providers.DomProvider.InstrumentedType,
    goog.Disposable);


/**
 * @override
 */
wtf.trace.providers.DomProvider.InstrumentedType.prototype.disposeInternal =
    function() {
  // Restore all injections.
  for (var n = 0; n < this.injections_.length; n++) {
    var injection = this.injections_[n];
    injection.target[injection.name] = injection.original;
  }
  goog.base(this, 'disposeInternal');
};


/**
 * Injects a new function in place of an old one.
 * @param {!Object} target Target object.
 * @param {string} name Member name.
 * @param {!Function} value New value.
 * @private
 */
wtf.trace.providers.DomProvider.InstrumentedType.prototype.injectFunction_ =
    function(target, name, value) {
  var original = target[name];
  this.injections_.push({
    target: target,
    name: name,
    original: original
  });
  target[name] = value;
  value['raw'] = original;
};


/**
 * Injects the EventTarget methods such as addEventListener.
 * @private
 */
wtf.trace.providers.DomProvider.InstrumentedType.prototype.injectEventTarget_ =
    function() {
  // TODO(benvanik): allow for extraction of event properties
  // Maybe use signature like args? eg:
  // ['mousemove(int32 clientX, int32 clientY)', 'mousedown(...)']

  var prefix = this.name_;
  var classPrototype = this.classPrototype_;
  var eventMap = this.eventMap_;

  var originalAddEventListener = classPrototype['addEventListener'];
  this.injectFunction_(classPrototype, 'addEventListener',
      function addEventListener(type, listener, opt_useCapture) {
        if (this['__wtf_ignore__'] || listener['__wtf_ignore__']) {
          // Ignored - do a normal add.
          originalAddEventListener.call(this, type, listener, opt_useCapture);
          return;
        }

        var eventType = eventMap[type];
        if (!eventType) {
          eventType = wtf.trace.events.createScope(prefix + '#on' + type);
          goog.asserts.assert(eventType);
          eventMap[type] = eventType;
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
            wtf.trace.leaveScope(scope);
          }
        };
        listener['__wrapped__'] = wrappedEventListener;
        originalAddEventListener.call(
            this, type, wrappedEventListener, opt_useCapture);
      });

  var originalRemoveEventListener = classPrototype['removeEventListener'];
  this.injectFunction_(classPrototype, 'removeEventListener',
      function removeEventListener(type, listener, opt_useCapture) {
        if (listener && listener['__wrapped__']) {
          listener = listener['__wrapped__'];
        }
        originalRemoveEventListener.call(this, type, listener, opt_useCapture);
      });

  // TODO(benvanik): instrument dispatchEvent for flows?
};


/**
 * Prepares and caches information needed for hooking on* events.
 * @param {string=} opt_tag HTML tag name. If present, used instead of the
 *     class constructor.
 */
wtf.trace.providers.DomProvider.InstrumentedType.prototype.prepareOnEventHooks =
    function(opt_tag) {
  var originalCtor = this.classConstructor_;

  var target = null;
  if (opt_tag) {
    target = document.createElement(opt_tag);
  } else {
    try {
      target = new originalCtor();
    } catch (e) {
      target = this.classPrototype_;
    }
  }

  // Generate event code for each discovered event.
  var eventInfos = [];
  var allNames = Object.getOwnPropertyNames(target);
  for (var n = 0; n < allNames.length; n++) {
    var name = allNames[n];
    if (name.indexOf('on') == 0 && name.toLowerCase() == name) {
      var key = name.substr(2);
      var hiddenName = '__wtf_event_value_' + key;
      // TODO(benvanik): better event tracking support and reset behavior.
      eventInfos.push({
        name: name,
        key: key,
        getter: (function(hiddenName) {
          return function() {
            return this[hiddenName];
          };
        })(hiddenName),
        setter: (function(hiddenName, key) {
          return function(value) {
            var currentValue = this[hiddenName];
            if (currentValue) {
              this.removeEventListener(key, currentValue, false);
            }
            if (value) {
              this.addEventListener(key, value, false);
            }
            this[hiddenName] = value;
          };
        })(hiddenName, key)
      });
    }
  }

  this.onEventInfos_ = eventInfos;
};


/**
 * Rewrites the constructor and attempts to hook all on* events.
 * @param {Object=} opt_target Target object override
 *     (instead of the prototype).
 */
wtf.trace.providers.DomProvider.InstrumentedType.prototype.hookObjectEvents =
    function(opt_target) {
  var originalCtor = this.classConstructor_;
  var eventInfos = this.onEventInfos_;

  // If given a target, process that.
  if (opt_target) {
    // Swap all properties.
    if (wtf.trace.providers.DomProvider.support_.redefineEvent) {
      for (var n = 0; n < eventInfos.length; n++) {
        var eventInfo = eventInfos[n];
        delete opt_target[eventInfo.name];
        Object.defineProperty(opt_target, eventInfo.name, {
          'configurable': false,
          'enumerable': false,
          'get': eventInfo.getter,
          'set': eventInfo.setter
        });
      }
    }
    return;
  }

  if (wtf.trace.providers.DomProvider.support_.prototypeEventDefine) {
    // The browser allows defining the event handlers on the prototype.
    // Not all browsers support this, but it's faster by an order of magnitude
    // in Chrome, so do it there.
    for (var n = 0; n < eventInfos.length; n++) {
      var eventInfo = eventInfos[n];
      Object.defineProperty(this.classPrototype_, eventInfo.name, {
        'configurable': false,
        'enumerable': false,
        'get': eventInfo.getter,
        'set': eventInfo.setter
      });
    }

    // Hook constructor - non HTML only.
    if (!goog.string.startsWith(this.name_, 'HTML')) {
      goog.global[this.name_] = function() {
        var result = new originalCtor();
        // Delete the original keys (defineProperty does not allow redefinition).
        for (var n = 0; n < eventInfos.length; n++) {
          delete result[eventInfos[n].name];
        }
        return result;
      };
    }
  } else if (wtf.trace.providers.DomProvider.support_.redefineEvent) {
    // Hook constructor.
    goog.global[this.name_] = function() {
      var result = new originalCtor();

      // Swap all properties.
      for (var n = 0; n < eventInfos.length; n++) {
        var eventInfo = eventInfos[n];
        delete result[eventInfo.name];
        Object.defineProperty(result, eventInfo.name, {
          'configurable': false,
          'enumerable': false,
          'get': eventInfo.getter,
          'set': eventInfo.setter
        });
      }

      return result;
    };
  } else {
    // No way to do this?
    // TODO(benvanik): investigate fallback for Safari.
  }
};
