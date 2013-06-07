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

goog.require('wtf.data.webidl');
goog.require('wtf.trace.Provider');
goog.require('wtf.trace.eventtarget');



/**
 * Provides DOM events for common DOM types.
 *
 * @param {!wtf.util.Options} options Options.
 * @constructor
 * @extends {wtf.trace.Provider}
 */
wtf.trace.providers.DomProvider = function(options) {
  goog.base(this, options);

  if (!goog.global['document']) {
    return;
  }

  var level = options.getNumber('wtf.trace.provider.dom', 1);
  if (!level) {
    return;
  }

  /**
   * Whether to include event arguments.
   * @type {boolean}
   * @private
   */
  this.includeEventArgs_ =
      options.getBoolean('wtf.trace.provider.dom.eventArgs', false);

  // Note that this code is extra exception-handly - this is because it's very
  // prone to exceptions in various browsers. Being defensive here means that
  // we don't randomly break and instead just lose event types.
  // Ideally we'd have tests for everything that didn't require throwing
  // exceptions like this.
  try {
    this.injectWindow_();
  } catch (e) {
  }

  try {
    this.injectDocument_();
  } catch (e) {
  }

  try {
    this.injectElements_();
  } catch (e) {
  }
};
goog.inherits(wtf.trace.providers.DomProvider, wtf.trace.Provider);


/**
 * @override
 */
wtf.trace.providers.DomProvider.prototype.getSettingsSectionConfigs =
    function() {
  return [
    {
      'title': 'DOM',
      'widgets': [
        {
          'type': 'checkbox',
          'key': 'wtf.trace.provider.dom',
          'title': 'Enabled',
          'default': true
        },
        {
          'type': 'checkbox',
          'key': 'wtf.trace.provider.dom.eventArgs',
          'title': 'Include event arguments',
          'default': false
        }
      ]
    }
  ];
};


/**
 * Injects method/event handler overrides on Window.
 * @private
 */
wtf.trace.providers.DomProvider.prototype.injectWindow_ = function() {
  // Both Chrome and FF support doing this on Window.prototype.

  // Window can be instrumented just like an HTML element.
  this.injectElement_('Window', goog.global['Window'], Window.prototype);
};


/**
 * Injects method/event handler overrides on Document.
 * @private
 */
wtf.trace.providers.DomProvider.prototype.injectDocument_ = function() {
  // Both Chrome and FF support doing this on document.

  // Document needs instrumenting on the instance, not the prototype.
  this.injectElement_('Document', goog.global['Document'], document);
};


/**
 * Injects event handler overrides on DOM event targets.
 * @private
 */
wtf.trace.providers.DomProvider.prototype.injectElements_ = function() {
  var elementTypes = {
    'HTMLAnchorElement': 'a',
    // Don't hook <applet>, as it causes IE to display warnings/errors about
    // Java not being installed.
    //'HTMLAppletElement': 'applet',
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
    // 'HTMLDocument',
    // 'HTMLElement',
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

  for (var typeName in elementTypes) {
    var tagName = elementTypes[typeName];
    var ctor = goog.global[typeName];
    if (!ctor) {
      continue;
    }
    var el = document.createElement(tagName);
    try {
      this.injectElement_(typeName, ctor, el);
    } catch (e) {
    }
  }
};


/**
 * Injects an HTML element type.
 * @param {string} typeName Type name (HTMLDivElement).
 * @param {!Object} ctor Constructor.
 * @param {!Object} obj Representative object.
 * @private
 */
wtf.trace.providers.DomProvider.prototype.injectElement_ = function(
    typeName, ctor, obj) {
  var proto = ctor.prototype;

  // Find all 'on' event names.
  // First try the object and if that fails try the prototype.
  var eventNames = wtf.trace.eventtarget.getEventNames(obj);
  if (!eventNames.length) {
    eventNames = wtf.trace.eventtarget.getEventNames(proto);
  }

  // Get all event types from the IDL store.
  // This will be a map of event name to the {@code EVENT_TYPES} objects.
  // Note that because this can be slow we allow the user to toggle it.
  var eventTypes;
  if (this.includeEventArgs_) {
    eventTypes = wtf.data.webidl.getAllEvents(typeName, eventNames);
  } else {
    eventTypes = {};
    for (var n = 0; n < eventNames.length; n++) {
      eventTypes[eventNames[n]] = null;
    }
  }

  // Create a descriptor object.
  var descriptor = wtf.trace.eventtarget.createDescriptor(
      typeName, eventTypes);

  // Stash the descriptor. It may be used by the hookDomEvents util.
  wtf.trace.eventtarget.setDescriptor(proto, descriptor);

  // Mixin EventTarget methods.
  wtf.trace.eventtarget.mixin(descriptor, proto);

  // Hook on* event properties (if possible).
  wtf.trace.eventtarget.setEventProperties(descriptor, proto);
};
