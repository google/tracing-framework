/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Application extension manager.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.ExtensionManager');
goog.provide('wtf.app.ui.ExtensionTabPanel');

goog.require('goog.Disposable');
goog.require('goog.Uri');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.style');
goog.require('wtf.app.ui.TabPanel');
goog.require('wtf.ext');
goog.require('wtf.timing');



/**
 * Handles the creation and management of app extensions.
 * Since extensions are {@see wtf.app.ui.DocumentView}-specific, this ties
 * extension lifetime to the parent document view.
 *
 * @param {!wtf.app.ui.DocumentView} documentView Parent document view.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.app.ui.ExtensionManager = function(documentView) {
  goog.base(this);

  var dom = documentView.getDom();

  /**
   * Parent document view.
   * @type {!wtf.app.ui.DocumentView}
   * @private
   */
  this.documentView_ = documentView;

  /**
   * DOM helper.
   * @type {!goog.dom.DomHelper}
   * @private
   */
  this.dom_ = dom;

  /**
   * Root element that gets the extension iframes added inside it.
   * This makes it easier to clean them up and debug.
   * @type {!Element}
   * @private
   */
  this.extensionsEl_ = dom.createElement(goog.dom.TagName.DIV);
  this.extensionsEl_.id = 'wtfAppExtensions';
  dom.getDocument().body.appendChild(this.extensionsEl_);

  /**
   * All loaded extensions.
   * @type {!Array.<{
   *   extension: !wtf.ext.AppExtension,
   *   iframe: !HTMLIFrameElement
   * }>}
   * @private
   */
  this.extensions_ = [];

  /**
   * Simple map of whether an extension has been loaded.
   * @type {!Object.<boolean>}
   * @private
   */
  this.loadedExtensions_ = {};

  // Defer a bit to ensure everything gets created.
  wtf.timing.setImmediate(function() {
    var extensions = wtf.ext.getAppExtensions();
    for (var n = 0; n < extensions.length; n++) {
      // TODO(benvanik): only load if no triggers? setup delayed loading for
      //     ones with triggers?
      this.loadExtension(extensions[n]);
    }
    _gaq.push(['_trackEvent', 'app', 'load_extensions',
      null, extensions.length]);
  }, this);
};
goog.inherits(wtf.app.ui.ExtensionManager, goog.Disposable);


/**
 * @override
 */
wtf.app.ui.ExtensionManager.prototype.disposeInternal = function() {
  goog.dom.removeNode(this.extensionsEl_);
  goog.base(this, 'disposeInternal');
};


/**
 * Loads the given extension, if it has not already been loaded.
 * @param {!wtf.ext.AppExtension} extension Extension.
 */
wtf.app.ui.ExtensionManager.prototype.loadExtension = function(extension) {
  var dom = this.dom_;

  var manifest = extension.getManifest();
  var info = extension.getInfo();

  // Loaded check.
  if (this.loadedExtensions_[manifest.getUrl()]) {
    return;
  }
  this.loadedExtensions_[manifest.getUrl()] = true;

  // Create iframe container.
  var iframe = /** @type {!HTMLIFrameElement} */ (
      dom.createElement(goog.dom.TagName.IFRAME));
  this.extensionsEl_.appendChild(iframe);

  // Set base.
  var idoc = iframe.contentDocument;
  var baseUri = goog.Uri.resolve(window.location.href, manifest.getUrl());
  var baseEl = idoc.createElement(goog.dom.TagName.BASE);
  baseEl.href = baseUri.toString();
  idoc.head.appendChild(baseEl);

  // Export API.
  this.setupExtensionApi_(extension, iframe.contentWindow);

  // Add scripts.
  for (var n = 0; n < info.scripts.length; n++) {
    var script = idoc.createElement(goog.dom.TagName.SCRIPT);
    script.src = info.scripts[n];
    idoc.body.appendChild(script);
  }

  this.extensions_.push({
    extension: extension,
    iframe: iframe
  });
};


/**
 * Sets up the extension API in the extension window.
 * @param {!wtf.ext.AppExtension} extension Owning extension.
 * @param {!Object} extensionGlobal Extension global scope.
 * @private
 */
wtf.app.ui.ExtensionManager.prototype.setupExtensionApi_ = function(
    extension, extensionGlobal) {
  var documentView = this.documentView_;

  extensionGlobal['wtf'] = goog.global['wtf'];
  extensionGlobal['d3'] = goog.global['d3'];
  extensionGlobal['documentView'] = {
    'db': documentView.getDatabase(),
    'createTabPanel': createTabPanel
  };

  var tabbar = documentView.getTabbar();
  /**
   * Creates a new tab panel.
   * Part of the app extension API.
   * @param {string} path Path used for navigation.
   * @param {string} name Panel name.
   * @param {Object} options Options.
   * @param {wtf.app.ui.ExtensionTabPanel.Callback} callback
   *     A callback that creates an external panel.
   */
  function createTabPanel(path, name, options, callback) {
    tabbar.addPanel(new wtf.app.ui.ExtensionTabPanel(
        extension, documentView, path, name, options, callback));
  };
};



/**
 * A tab panel that defers logic to an external extension.
 * @param {!wtf.ext.AppExtension} extension Owning extension.
 * @param {!wtf.app.ui.DocumentView} documentView Parent document view.
 * @param {string} path Path used for navigation.
 * @param {string} name Panel name.
 * @param {Object} options Options.
 * @param {wtf.app.ui.ExtensionTabPanel.Callback} callback
 *     A callback that creates an external panel.
 * @constructor
 * @extends {wtf.app.ui.TabPanel}
 */
wtf.app.ui.ExtensionTabPanel = function(extension, documentView, path, name,
    options, callback) {
  goog.base(this, documentView, path, name);

  /**
   * Owning extension.
   * @type {!wtf.ext.AppExtension}
   * @private
   */
  this.extension_ = extension;

  /**
   * Tab panel options.
   * @type {!Object}
   * @private
   */
  this.options_ = options || {};

  /**
   * Panel contents iframe.
   * Setup on a delay so that the panel has time to be added to the DOM
   * for a tick so the iframe can be added and usable immediately.
   * @type {HTMLIFrameElement}
   * @private
   */
  this.iframe_ = null;

  /**
   * Extension panel handlers.
   * @type {wtf.app.ui.ExtensionTabPanel.Handlers?}
   * @private
   */
  this.handlers_ = null;

  wtf.timing.setImmediate(function() {
    // Create the iframe.
    this.setupIframe_();
    goog.asserts.assert(this.iframe_);

    // Let the extension set itself up.
    var idoc = this.iframe_.contentDocument;
    goog.asserts.assert(idoc);
    this.handlers_ = callback(idoc);
  }, this);
};
goog.inherits(wtf.app.ui.ExtensionTabPanel, wtf.app.ui.TabPanel);


/**
 * @typedef {{
 *   onLayout: (function(number, number))?,
 *   onVisibilityChange: (function(boolean))?
 * }}
 */
wtf.app.ui.ExtensionTabPanel.Handlers;


/**
 * @typedef {function(!Document):wtf.app.ui.ExtensionTabPanel.Handlers}
 */
wtf.app.ui.ExtensionTabPanel.Callback;


/**
 * @override
 */
wtf.app.ui.ExtensionTabPanel.prototype.createDom = function(dom) {
  var el = dom.createElement(goog.dom.TagName.DIV);
  goog.dom.classes.add(el, goog.getCssName('wtfAppUiTabPanel'));
  return el;
};


/**
 * Sets up the panel iframe.
 * @private
 */
wtf.app.ui.ExtensionTabPanel.prototype.setupIframe_ = function() {
  goog.asserts.assert(!this.iframe_);

  var manifest = this.extension_.getManifest();

  // Create iframe.
  // We could use seamless on this (in Chrome 22+), but it's not much use with
  // renamed CSS. Better would be to insert a default stylesheet with some
  // common styles (buttons/etc).
  var iframe = /** @type {!HTMLIFrameElement} */ (
      this.getDom().createElement(goog.dom.TagName.IFRAME));
  this.getRootElement().appendChild(iframe);

  // Set base.
  var idoc = iframe.contentDocument;
  var baseUri = goog.Uri.resolve(window.location.href, manifest.getUrl());
  var baseEl = idoc.createElement(goog.dom.TagName.BASE);
  baseEl.href = baseUri.toString();
  idoc.head.appendChild(baseEl);

  // Set content size so it fits.
  goog.style.setStyle(iframe, {
    'width': '100%',
    'height': '100%'
  });

  // Add scripts.
  var scripts = this.options_['scripts'] || [];
  for (var n = 0; n < scripts.length; n++) {
    var script = idoc.createElement(goog.dom.TagName.SCRIPT);
    script.src = scripts[n];
    idoc.body.appendChild(script);
  }

  // Add stylesheets.
  var stylesheets = this.options_['stylesheets'] || [];
  for (var n = 0; n < stylesheets.length; n++) {
    var link = idoc.createElement(goog.dom.TagName.LINK);
    link.rel = 'stylesheet';
    link.href = stylesheets[n];
    link.type = 'text/css';
    idoc.head.appendChild(link);
  }

  this.iframe_ = iframe;
};


/**
 * @override
 */
wtf.app.ui.ExtensionTabPanel.prototype.layoutInternal = function() {
  if (this.handlers_ && this.handlers_['onLayout']) {
    var currentSize = goog.style.getSize(this.getRootElement());
    this.handlers_['onLayout'](currentSize.width, currentSize.height);
  }
};


/**
 * @override
 */
wtf.app.ui.ExtensionTabPanel.prototype.setVisible = function(value) {
  goog.base(this, 'setVisible', value);
  if (this.handlers_ && this.handlers_['onVisibilityChange']) {
    this.handlers_['onVisibilityChange'](value);
  }
};
