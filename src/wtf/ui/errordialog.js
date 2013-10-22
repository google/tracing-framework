/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Popup error dialog control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.ErrorDialog');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.events.EventType');
goog.require('goog.soy');
goog.require('wtf.ui.Dialog');
goog.require('wtf.ui.errordialog');



/**
 * Error dialog control.
 * @param {string} message Simple, short title message.
 * @param {string} detail Detailed information. Can contain newlines/etc.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Dialog}
 */
wtf.ui.ErrorDialog = function(message, detail, opt_dom) {
  /**
   * Dialog parameters.
   * @type {!Object}
   * @private
   */
  this.info_ = {
    message: message,
    detail: detail
  };

  var dom = opt_dom || goog.dom.getDomHelper();
  var body = dom.getDocument().body;
  goog.asserts.assert(body);
  goog.base(this, {
    modal: true
  }, body, dom);

  var eh = this.getHandler();
  eh.listen(
      this.getChildElement(goog.getCssName('buttonClose')),
      goog.events.EventType.CLICK, function() {
        this.close();
      }, false, this);
};
goog.inherits(wtf.ui.ErrorDialog, wtf.ui.Dialog);


/**
 * @override
 */
wtf.ui.ErrorDialog.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.ui.errordialog.control, {
        'message': this.info_.message,
        'detail': (this.info_.detail || '').replace(/\n/g, '<br>')
      }, undefined, dom));
};


/**
 * Shows an error dialog.
 * @param {string} message Simple, short title message.
 * @param {string} detail Detailed information. Can contain newlines/etc.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 */
wtf.ui.ErrorDialog.show = function(message, detail, opt_dom) {
  new wtf.ui.ErrorDialog(message, detail, opt_dom);
  // TODO(benvanik): deferred until done? cancel? etc?
};
