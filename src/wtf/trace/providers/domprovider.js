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

goog.provide('wtf.trace.DomProvider');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('wtf');
goog.require('wtf.trace.Provider');
goog.require('wtf.trace.events');



/**
 * Provides DOM events for common DOM types.
 *
 * @constructor
 * @extends {wtf.trace.Provider}
 */
wtf.trace.DomProvider = function() {
  goog.base(this);

  this.injectEvents_();
};
goog.inherits(wtf.trace.DomProvider, wtf.trace.Provider);


/**
 * Injects event handler overrides on DOM event targets.
 * @private
 */
wtf.trace.DomProvider.prototype.injectEvents_ = function() {
  var domTypes = [
    'Audio',
    'Document',
    'File',
    'FileReader',
    'Image',
    'Window',
    'XMLHttpRequest',
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
    'HTMLDataListElement',
    'HTMLDirectoryElement',
    'HTMLDivElement',
    // 'HTMLDocument',
    // 'HTMLElement',
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
    'HTMLShadowElement',
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

  var instrumentedTypeMap = {};
  for (var n = 0; n < domTypes.length; n++) {
    var typeName = domTypes[n];
    var classConstructor = goog.global[typeName];
    if (classConstructor) {
      var classPrototype = classConstructor.prototype;
      var instrumentedType = new wtf.trace.DomProvider.InstrumentedType(
          typeName, classConstructor, classPrototype);
      this.registerDisposable(instrumentedType);
      instrumentedTypeMap[typeName] = instrumentedType;
    }
  }

  // Always instrument Window, as the events live on its prototype.
  instrumentedTypeMap['Window'].injectObjectEvents(
      goog.global['Window'].prototype);

  // Special case a few types.
  // Rewrite constructors for non-HTML elements.
  //'Audio'
  //'File'
  //'FileReader'
  var originalImage = goog.global['Image'];
  var imageInstrumentedType = instrumentedTypeMap['Image'];
  goog.global['Image'] = function Image() {
    var result = new originalImage();
    imageInstrumentedType.injectObjectEvents(result);
    return result;
  };
  var originalXhr = goog.global['XMLHttpRequest'];
  var xhrInstrumentedType = instrumentedTypeMap['XMLHttpRequest'];
  goog.global['XMLHttpRequest'] = function XMLHttpRequest() {
    var result = new originalXhr();
    xhrInstrumentedType.injectObjectEvents(result);
    return result;
  };

  // Hook document.createElement to inject object events.
  var originalCreateElement = HTMLDocument.prototype.createElement;
  this.injectFunction(HTMLDocument.prototype, 'createElement',
      function(name) {
        var result = originalCreateElement.apply(this, arguments);
        var ctorName = result.constructor.name;
        var instrumentedType = instrumentedTypeMap[ctorName];
        if (instrumentedType) {
          instrumentedType.injectObjectEvents(result);
        }
        return result;
      });

  // TODO(benvanik): find a way to add object events to HTML elements?
};



/**
 * @param {string} name Type name.
 * @param {!Function} classConstructor Class constructor.
 * @param {!Object} classPrototype Class prototype.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.trace.DomProvider.InstrumentedType = function(
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
   * A list of injections performed by this provider.
   * Used to restore injections to their previous values.
   * @type {!Array.<{target:!Object, name:string, original:!Function}>}
   * @private
   */
  this.injections_ = [];

  /**
   * A map of event type names to custom trace scope events.
   * @type {!Object.<!wtf.trace.EventType>}
   * @private
   */
  this.eventMap_ = {};

  // If the object looks like an EventTarget, inject.
  if (classPrototype['addEventListener']) {
    this.injectEventTarget_();
  }
};
goog.inherits(wtf.trace.DomProvider.InstrumentedType, goog.Disposable);


/**
 * @override
 */
wtf.trace.DomProvider.InstrumentedType.prototype.disposeInternal = function() {
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
wtf.trace.DomProvider.InstrumentedType.prototype.injectFunction_ =
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
wtf.trace.DomProvider.InstrumentedType.prototype.injectEventTarget_ =
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
        var eventType = eventMap[type];
        if (!eventType) {
          eventType = wtf.trace.events.createScope(prefix + '#on' + type);
          goog.asserts.assert(eventType);
          eventMap[type] = eventType;
        }
        var wrappedEventListener = function wrappedEventListener(e) {
          var scope = eventType.enterScope(wtf.now(), null);
          try {
            if (listener['handleEvent']) {
              // Listener is an EventListener.
              listener.handleEvent(e);
            } else {
              // Listener is a function.
              return listener.apply(this, arguments);
            }
          } finally {
            scope.leave();
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
 * Adds on* event hooks to the given object.
 * @param {!Object} target Target object.
 */
wtf.trace.DomProvider.InstrumentedType.prototype.injectObjectEvents =
    function(target) {
  var prefix = this.name_;
  var eventMap = this.eventMap_;

  var allKeys = Object.getOwnPropertyNames(target);
  for (var n = 0; n < allKeys.length; n++) {
    var key = allKeys[n];
    if (key.indexOf('on') == 0 &&
        key.toLowerCase() == key) {
      // This is likely an event!
      // Delete the original (defineProperty does not allow redefinition).
      delete target[key];

      // Hook the event.
      (function(key) {
        // TODO(benvanik): better event tracking support and reset behavior.
        var currentValue = null;
        Object.defineProperty(target, key, {
          'enumerable': false,
          'get': function() {
            return currentValue;
          },
          'set': function(value) {
            if (currentValue) {
              this.removeEventListener(key.substr(2), currentValue, false);
            }
            if (value) {
              this.addEventListener(key.substr(2), value, false);
            }
            currentValue = value;
          }
        });
      })(key);
    }
  }
};
