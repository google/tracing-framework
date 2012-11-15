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
goog.require('goog.style');
goog.require('wtf.timing');
goog.require('wtf.ui.Control');


/**
 * @typedef {{
 *   modal: (boolean|undefined)
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
  goog.base(this, parentElement, opt_dom);

  var dom = this.getDom();
  if (options.modal) {
    // Add shield.
    var shield = new wtf.ui.Dialog.Shield_(dom);
    this.registerDisposable(shield);
  }
};
goog.inherits(wtf.ui.Dialog, wtf.ui.Control);


/**
 * Z-index of the dialog.
 * @type {number}
 * @const
 * @private
 */
wtf.ui.Dialog.ZINDEX_ = 999999;


/**
 * @override
 */
wtf.ui.Dialog.prototype.enterDocument = function(parentElement) {
  var dom = this.getDom();

  // Create dialog DOM.
  var el = dom.createElement(goog.dom.TagName.DIV);
  goog.style.setStyle(el, {
    'position': 'fixed',
    'left': '50%',
    'top': '50%',
    'z-index': wtf.ui.Dialog.ZINDEX_
  });

  // Wrap root element in dialog DOM.
  var rootElement = this.getRootElement();
  dom.appendChild(el, rootElement);

  // Add dialog DOM to parent element instead of root user element.
  dom.appendChild(parentElement, el);

  // Offset by size after layout occurs.
  wtf.timing.setImmediate(function() {
    var size = goog.style.getSize(rootElement);
    goog.style.setStyle(el, {
      'margin-left': -(size.width / 2) + 'px',
      'margin-top': -(size.height / 2) + 'px'
    });
  }, this);
};


/**
 * Closes the dialog.
 */
wtf.ui.Dialog.prototype.close = function() {
  goog.dispose(this);
};



/**
 * Modal dialog shield wrapper.
 * @param {!goog.dom.DomHelper} dom DOM helper.
 * @constructor
 * @extends {goog.Disposable}
 * @private
 */
wtf.ui.Dialog.Shield_ = function(dom) {
  goog.base(this);

  var el = dom.createElement(goog.dom.TagName.DIV);
  goog.style.setStyle(el, {
    'display': 'block',
    'opacity': '0.75',
    'background-color': 'white',
    'position': 'fixed',
    'left': 0,
    'right': 0,
    'top': 0,
    'bottom': 0,
    'z-index': wtf.ui.Dialog.ZINDEX_ - 1,
    'transition': 'all 0.218s'
  });

  /**
   * Shield element.
   * @type {!Element}
   * @private
   */
  this.el_ = el;

  // Add to document.
  var doc = dom.getDocument();
  doc.body.appendChild(el);
};
goog.inherits(wtf.ui.Dialog.Shield_, goog.Disposable);


/**
 * @override
 */
wtf.ui.Dialog.Shield_.prototype.disposeInternal = function() {
  goog.dom.removeNode(this.el_);
  goog.base(this, 'disposeInternal');
};
