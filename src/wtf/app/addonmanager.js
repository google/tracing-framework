/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Application addon manager.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.AddonManager');
goog.provide('wtf.app.AddonTabPanel');

goog.require('goog.Disposable');
goog.require('goog.Uri');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.style');
goog.require('wtf.addon');
goog.require('wtf.app.TabPanel');
goog.require('wtf.timing');



/**
 * Handles the creation and management of app addons.
 * Since addons are {@see wtf.app.DocumentView}-specific, this ties
 * addon lifetime to the parent document view.
 *
 * @param {!wtf.app.DocumentView} documentView Parent document view.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.app.AddonManager = function(documentView) {
  goog.base(this);

  var dom = documentView.getDom();

  /**
   * Parent document view.
   * @type {!wtf.app.DocumentView}
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
   * Root element that gets the addon iframes added inside it.
   * This makes it easier to clean them up and debug.
   * @type {!Element}
   * @private
   */
  this.addonsEl_ = dom.createElement(goog.dom.TagName.DIV);
  this.addonsEl_.id = 'wtfAppAddons';
  dom.getDocument().body.appendChild(this.addonsEl_);

  /**
   * All loaded addons.
   * @type {!Array.<{
   *   addon: !wtf.addon.AppAddon,
   *   iframe: !HTMLIFrameElement
   * }>}
   * @private
   */
  this.addons_ = [];

  /**
   * Simple map of whether an addon has been loaded.
   * @type {!Object.<boolean>}
   * @private
   */
  this.loadedAddons_ = {};

  // Defer a bit to ensure everything gets created.
  wtf.timing.setImmediate(function() {
    var addons = wtf.addon.getAppAddons();
    for (var n = 0; n < addons.length; n++) {
      // TODO(benvanik): only load if no triggers? setup delayed loading for
      //     ones with triggers?
      this.loadAddon(addons[n]);
    }
    _gaq.push(['_trackEvent', 'app', 'load_addons',
      null, addons.length]);
  }, this);
};
goog.inherits(wtf.app.AddonManager, goog.Disposable);


/**
 * @override
 */
wtf.app.AddonManager.prototype.disposeInternal = function() {
  goog.dom.removeNode(this.addonsEl_);
  goog.base(this, 'disposeInternal');
};


/**
 * Loads the given addon, if it has not already been loaded.
 * @param {!wtf.addon.AppAddon} addon Addon.
 */
wtf.app.AddonManager.prototype.loadAddon = function(addon) {
  var dom = this.dom_;

  var manifest = addon.getManifest();
  var info = addon.getInfo();

  // Loaded check.
  if (this.loadedAddons_[manifest.getUrl()]) {
    return;
  }
  this.loadedAddons_[manifest.getUrl()] = true;

  // Create iframe container.
  var iframe = /** @type {!HTMLIFrameElement} */ (
      dom.createElement(goog.dom.TagName.IFRAME));
  this.addonsEl_.appendChild(iframe);

  // Set base.
  var idoc = iframe.contentDocument;
  var baseUri = goog.Uri.resolve(window.location.href, manifest.getUrl());
  var baseEl = idoc.createElement(goog.dom.TagName.BASE);
  baseEl.href = baseUri.toString();
  idoc.head.appendChild(baseEl);

  // Export API.
  var contentWindow = iframe.contentWindow;
  goog.asserts.assert(contentWindow);
  this.setupAddonApi_(addon, contentWindow);

  // Add scripts.
  for (var n = 0; n < info.scripts.length; n++) {
    var script = idoc.createElement(goog.dom.TagName.SCRIPT);
    script.src = info.scripts[n];
    idoc.body.appendChild(script);
  }

  this.addons_.push({
    addon: addon,
    iframe: iframe
  });
};


/**
 * Sets up the addon API in the addon window.
 * @param {!wtf.addon.AppAddon} addon Owning addon.
 * @param {!Window} addonGlobal Addon global scope.
 * @private
 */
wtf.app.AddonManager.prototype.setupAddonApi_ = function(
    addon, addonGlobal) {
  var documentView = this.documentView_;

  addonGlobal['wtf'] = goog.global['wtf'];
  addonGlobal['d3'] = goog.global['d3'];
  addonGlobal['documentView'] = {
    'db': documentView.getDatabase(),
    'createTabPanel': createTabPanel
  };

  var tabbar = documentView.getTabbar();
  /**
   * Creates a new tab panel.
   * Part of the app addon API.
   * @param {string} path Path used for navigation.
   * @param {string} name Panel name.
   * @param {Object} options Options.
   * @param {wtf.app.AddonTabPanel.Callback} callback
   *     A callback that creates an external panel.
   */
  function createTabPanel(path, name, options, callback) {
    tabbar.addPanel(new wtf.app.AddonTabPanel(
        addon, documentView, path, name, options, callback));
  };
};



/**
 * A tab panel that defers logic to an external addon.
 * @param {!wtf.addon.AppAddon} addon Owning addon.
 * @param {!wtf.app.DocumentView} documentView Parent document view.
 * @param {string} path Path used for navigation.
 * @param {string} name Panel name.
 * @param {Object} options Options.
 * @param {wtf.app.AddonTabPanel.Callback} callback
 *     A callback that creates an external panel.
 * @constructor
 * @extends {wtf.app.TabPanel}
 */
wtf.app.AddonTabPanel = function(addon, documentView, path, name,
    options, callback) {
  goog.base(this, documentView, path, name);

  /**
   * Owning addon.
   * @type {!wtf.addon.AppAddon}
   * @private
   */
  this.addon_ = addon;

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
   * Addon panel handlers.
   * @type {wtf.app.AddonTabPanel.Handlers?}
   * @private
   */
  this.handlers_ = null;

  wtf.timing.setImmediate(function() {
    // Create the iframe.
    this.setupIframe_();
    goog.asserts.assert(this.iframe_);

    // Let the addon set itself up.
    var idoc = this.iframe_.contentDocument;
    goog.asserts.assert(idoc);
    this.handlers_ = callback(idoc);
  }, this);
};
goog.inherits(wtf.app.AddonTabPanel, wtf.app.TabPanel);


/**
 * @typedef {{
 *   onLayout: (function(number, number))?,
 *   onVisibilityChange: (function(boolean))?
 * }}
 */
wtf.app.AddonTabPanel.Handlers;


/**
 * @typedef {function(!Document):wtf.app.AddonTabPanel.Handlers}
 */
wtf.app.AddonTabPanel.Callback;


/**
 * @override
 */
wtf.app.AddonTabPanel.prototype.createDom = function(dom) {
  var el = dom.createElement(goog.dom.TagName.DIV);
  goog.dom.classes.add(el, goog.getCssName('appUiTabPanel'));
  return el;
};


/**
 * Sets up the panel iframe.
 * @private
 */
wtf.app.AddonTabPanel.prototype.setupIframe_ = function() {
  goog.asserts.assert(!this.iframe_);

  var manifest = this.addon_.getManifest();

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
wtf.app.AddonTabPanel.prototype.layoutInternal = function() {
  if (this.handlers_ && this.handlers_['onLayout']) {
    var currentSize = goog.style.getSize(this.getRootElement());
    this.handlers_['onLayout'](currentSize.width, currentSize.height);
  }
};


/**
 * @override
 */
wtf.app.AddonTabPanel.prototype.setVisible = function(value) {
  goog.base(this, 'setVisible', value);
  if (this.handlers_ && this.handlers_['onVisibilityChange']) {
    this.handlers_['onVisibilityChange'](value);
  }
};
