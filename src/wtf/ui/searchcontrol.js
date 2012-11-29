/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Search textbox control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.SearchControl');

goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('wtf.ui.Control');



/**
 * Search textbox control.
 *
 * @param {!Element} parentElement Element to display in.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.ui.SearchControl = function(parentElement, opt_dom) {
  goog.base(this, parentElement, opt_dom);

  var el = this.getRootElement();
  // TODO(benvanik): hook events/etc
};
goog.inherits(wtf.ui.SearchControl, wtf.ui.Control);


/**
 * @override
 */
wtf.ui.SearchControl.prototype.createDom = function(dom) {
  var el = dom.createElement(goog.dom.TagName.INPUT);
  el['type'] = 'text';
  goog.dom.classes.add(
      el,
      goog.getCssName('kTextField'),
      goog.getCssName('kSearchField'));
  return el;
};
