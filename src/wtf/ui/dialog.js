/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Popup dialog control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.Dialog');
goog.provide('wtf.ui.DialogOptions');

goog.require('goog.Disposable');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventType');
goog.require('goog.style');
goog.require('wtf.events');
goog.require('wtf.events.KeyboardScope');
goog.require('wtf.timing');
goog.require('wtf.ui.Control');


/**
 * @typedef {{
 *   modal: (boolean|undefined),
 *   clickToClose: (boolean|undefined)
 * }}
 */
wtf.ui.DialogOptions;



/**
 * Popup dialog control.
 *
 * @param {!wtf.ui.DialogOptions} options Dialog options object.
 * @param {!Element} parentElement Element to display in.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.ui.Dialog = function(options, parentElement, opt_dom) {
  /**
   * Wrapper with wtfReset.
   * This is the root shield element in the DOM.
   * @type {Element}
   * @private
   */
  this.wrapper_ = null;

  goog.base(this, parentElement, opt_dom);
  var dom = this.getDom();

  /**
   * The viewport size monitor.
   * @type {!goog.dom.ViewportSizeMonitor}
   * @private
   */
  this.viewportSizeMonitor_ = wtf.events.acquireViewportSizeMonitor();

  var clickToClose = goog.isDef(options.clickToClose) ?
      options.clickToClose : true;

  // Setup keyboard handlers for closing/etc.
  var keyboard = wtf.events.getWindowKeyboard(dom);
  // TODO(benvanik): suppress all other scopes
  var keyboardScope = new wtf.events.KeyboardScope(keyboard);
  this.registerDisposable(keyboardScope);
  if (clickToClose) {
    keyboardScope.addShortcut('esc', function() {
      this.close();
    }, this);
  }

  if (options.modal) {
    // Add shield.
    var shield = new wtf.ui.Dialog.Shield_(this, clickToClose);
    this.registerDisposable(shield);
  }

  // Recenter as the window is resized.
  this.getHandler().listen(
      this.viewportSizeMonitor_,
      goog.events.EventType.RESIZE,
      this.center, false);
};
goog.inherits(wtf.ui.Dialog, wtf.ui.Control);


/**
 * @override
 */
wtf.ui.Dialog.prototype.disposeInternal = function() {
  wtf.events.releaseViewportSizeMonitor(this.viewportSizeMonitor_);
  goog.base(this, 'disposeInternal');
};


/**
 * Event types.
 * @type {!Object.<string>}
 */
wtf.ui.Dialog.EventType = {
  OPENING: goog.events.getUniqueId('opening'),
  OPENED: goog.events.getUniqueId('opened'),
  CLOSING: goog.events.getUniqueId('closing'),
  CLOSED: goog.events.getUniqueId('closed')
};


/**
 * @override
 */
wtf.ui.Dialog.prototype.enterDocument = function(parentElement) {
  var dom = this.getDom();

  // Create wrapper DOM.
  var wrapper = dom.createElement(goog.dom.TagName.DIV);
  goog.dom.classes.add(wrapper, goog.getCssName('wtfReset'));
  goog.style.setStyle(wrapper, 'display', 'block');
  this.wrapper_ = wrapper;

  // Create dialog DOM.
  var el = dom.createElement(goog.dom.TagName.DIV);
  goog.dom.classes.add(el, goog.getCssName('k'));
  goog.dom.classes.add(el, goog.getCssName('uiDialog'));

  // Wrap root element in dialog DOM.
  var rootElement = this.getRootElement();
  dom.appendChild(el, rootElement);

  // Add dialog DOM to parent element instead of root user element.
  dom.appendChild(wrapper, el);
  dom.appendChild(parentElement, wrapper);
  this.center();

  // Add after layout to prevent sliding.
  goog.dom.classes.add(el, goog.getCssName('uiDialogPoppedIn'));

  this.emitEvent(wtf.ui.Dialog.EventType.OPENING);
  wtf.timing.setTimeout(250, function() {
    this.emitEvent(wtf.ui.Dialog.EventType.OPENED);
  }, this);
};


/**
 * Centers the dialog.
 */
wtf.ui.Dialog.prototype.center = function() {
  var dom = this.getDom();
  var rootElement = this.getRootElement();
  var el = dom.getParentElement(rootElement);
  var viewportSize = dom.getViewportSize();
  var size = goog.style.getSize(rootElement);
  goog.style.setStyle(el, {
    'left': Math.floor(viewportSize.width / 2) + 'px',
    'top': Math.floor(viewportSize.height / 2) + 'px',
    'margin-left': -Math.floor(size.width / 2) + 'px',
    'margin-top': -Math.floor(size.height / 2) + 'px'
  });
};


/**
 * Closes the dialog.
 * @param {function(this:T)=} opt_callback Callback when the dialog is closed.
 * @param {T=} opt_scope Scope for the callback.
 * @template T
 */
wtf.ui.Dialog.prototype.close = function(opt_callback, opt_scope) {
  // Remove the dialog DOM root.
  var dom = this.getDom();
  var rootElement = this.getRootElement();
  if (rootElement) {
    var el = dom.getParentElement(rootElement);
    goog.dom.classes.remove(el, goog.getCssName('uiDialogPoppedIn'));

    this.emitEvent(wtf.ui.Dialog.EventType.CLOSING);
    wtf.timing.setTimeout(218, function() {
      dom.removeNode(el);
      dom.removeNode(this.wrapper_);

      // Give the browser a moment to update itself.
      wtf.timing.setImmediate(function() {
        this.emitEvent(wtf.ui.Dialog.EventType.CLOSED);
        goog.dispose(this);
        if (opt_callback) {
          opt_callback.call(opt_scope);
        }
      }, this);
    }, this);
  }
};



/**
 * Modal dialog shield wrapper.
 * @param {!wtf.ui.Dialog} dialog Parent dialog.
 * @param {boolean} clickToClose True to close when the shield is clicked.
 * @constructor
 * @extends {goog.Disposable}
 * @private
 */
wtf.ui.Dialog.Shield_ = function(dialog, clickToClose) {
  goog.base(this);

  var dom = dialog.getDom();

  /**
   * Wrapper with wtfReset.
   * This is the root shield element in the DOM.
   * @type {!Element}
   * @private
   */
  this.wrapper_ = dom.createElement(goog.dom.TagName.DIV);
  goog.dom.classes.add(this.wrapper_, goog.getCssName('wtfReset'));
  goog.style.setStyle(this.wrapper_, 'display', 'block');

  // Create dialog DOM.
  var el = dom.createElement(goog.dom.TagName.DIV);
  goog.dom.classes.add(el, goog.getCssName('uiDialogShield'));
  wtf.timing.setImmediate(function() {
    goog.dom.classes.add(el, goog.getCssName('uiDialogShieldPoppedIn'));
  });
  dom.appendChild(this.wrapper_, el);

  /**
   * Shield element.
   * @type {!Element}
   * @private
   */
  this.el_ = el;

  /**
   * Event handler.
   * @type {!goog.events.EventHandler}
   * @private
   */
  this.eh_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eh_);

  if (clickToClose) {
    this.eh_.listen(this.el_, goog.events.EventType.MOUSEDOWN, function(e) {
      dialog.close();
    });
  }

  // Add to document.
  var doc = dom.getDocument();
  doc.body.appendChild(this.wrapper_);
};
goog.inherits(wtf.ui.Dialog.Shield_, goog.Disposable);


/**
 * @override
 */
wtf.ui.Dialog.Shield_.prototype.disposeInternal = function() {
  // Start fade out animation.
  goog.dom.classes.remove(this.el_, goog.getCssName('uiDialogShieldPoppedIn'));

  // After the animation completes remove everything from the DOM.
  var wrapper = this.wrapper_;
  wtf.timing.setTimeout(218, function() {
    goog.dom.removeNode(wrapper);
  }, this);

  goog.base(this, 'disposeInternal');
};
