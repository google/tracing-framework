/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Session controller popup window.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.replay.timeTravel.Controller');

goog.require('goog.soy');
goog.require('wtf.replay.timeTravel.controller');
goog.require('wtf.ui.Control');



/**
 * Popup replay controller dialog.
 * Manages the UI displayed to the user.
 *
 * @param {!Element} parentElement Element to display in.
 * @param {!goog.dom.DomHelper} dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.replay.timeTravel.Controller = function(parentElement, dom) {
  goog.base(this, parentElement, dom);
};
goog.inherits(wtf.replay.timeTravel.Controller, wtf.ui.Control);


/**
 * @override
 */
wtf.replay.timeTravel.Controller.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.replay.timeTravel.controller.control, undefined, undefined, dom));
};


/**
 * @override
 */
wtf.replay.timeTravel.Controller.prototype.layoutInternal = function() {
};
