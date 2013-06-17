/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Progress dialog screen.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.ProgressDialog');

goog.require('goog.asserts');
goog.require('goog.dom.classes');
goog.require('goog.soy');
goog.require('goog.style');
goog.require('wtf.ui.Dialog');
goog.require('wtf.ui.progressdialog');



/**
 * Progress overlay screen.
 *
 * @param {!Element} parentElement Element to display in.
 * @param {string} title Dialog title.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Dialog}
 */
wtf.ui.ProgressDialog = function(parentElement, title, opt_dom) {
  /**
   * Dialog title.
   * @type {string}
   * @private
   */
  this.title_ = title;

  goog.base(this, {
    modal: true,
    clickToClose: false
  }, parentElement, opt_dom);

  this.center();
};
goog.inherits(wtf.ui.ProgressDialog, wtf.ui.Dialog);


/**
 * @override
 */
wtf.ui.ProgressDialog.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.ui.progressdialog.control, {
        title: this.title_
      }, undefined, dom));
};


/**
 * Adds a new task entry to the dialog.
 * @param {!wtf.ui.ProgressDialog.Task} task Task object.
 */
wtf.ui.ProgressDialog.prototype.addTask = function(task) {
  var dom = this.getDom();
  var el = task.createDom_(dom);
  dom.appendChild(this.getChildElement(goog.getCssName('list')), el);
};


/**
 * Task bar styling.
 * @enum {number}
 */
wtf.ui.ProgressDialog.TaskStyle = {
  /** Primary task style. */
  PRIMARY: 0,
  /** Secondary task style. */
  SECONDARY: 1
};



/**
 * A tracked task in a progress dialog.
 * Create one of these objects per task you need to perform and add it to
 * a progress dialog with {@see wtf.ui.ProgressDialog#addTask}. As the task
 * progresses use {@see #setProgress} to update the progress.
 * Tasks cannot be reused in other dialogs and instead new ones should be
 * created.
 * @param {string=} opt_taskName Task name, if any.
 * @constructor
 */
wtf.ui.ProgressDialog.Task = function(opt_taskName) {
  /**
   * Task name, if any.
   * @type {?string}
   * @private
   */
  this.taskName_ = opt_taskName || null;

  /**
   * DOM helper.
   * @type {goog.dom.DomHelper}
   * @private
   */
  this.dom_ = null;

  /**
   * Progress bar element, when it has been created.
   * @type {Element}
   * @private
   */
  this.progressTrackEl_ = null;

  /**
   * Progress text element, when it has been created.
   * @type {Element}
   * @private
   */
  this.progressTextEl_ = null;
};


/**
 * Creates the DOM for the task and returns the element.
 * @param {!goog.dom.DomHelper} dom DOM helper.
 * @return {!Element} Root DOM element of the task.
 * @private
 */
wtf.ui.ProgressDialog.Task.prototype.createDom_ = function(dom) {
  goog.asserts.assert(!this.dom_);
  this.dom_ = dom;

  var el = /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.ui.progressdialog.task, {
        taskName: this.taskName_ || null
      }, undefined, dom));

  this.progressTrackEl_ = dom.getElementByClass(
      goog.getCssName('track'), el);
  this.progressTextEl_ = dom.getElementByClass(
      goog.getCssName('percentComplete'), el);

  return el;
};


/**
 * Sets the progress of the task.
 * The resulting value is calculated as (current / total).
 * @param {number} current Current progress value.
 * @param {number} total Total progress value.
 */
wtf.ui.ProgressDialog.Task.prototype.setProgress = function(current, total) {
  var dom = this.dom_;
  goog.asserts.assert(dom);
  goog.asserts.assert(this.progressTrackEl_);
  goog.asserts.assert(this.progressTextEl_);

  var percent = Math.floor(current / total * 100);
  goog.style.setWidth(this.progressTrackEl_, percent + '%');
  dom.setTextContent(this.progressTextEl_, String(percent));
};


/**
 * Sets the task bar styling.
 * @param {wtf.ui.ProgressDialog.TaskStyle} value New value.
 */
wtf.ui.ProgressDialog.Task.prototype.setStyle = function(value) {
  switch (value) {
    default:
    case wtf.ui.ProgressDialog.TaskStyle.PRIMARY:
      goog.dom.classes.addRemove(
          this.progressTrackEl_,
          goog.getCssName('green'),
          goog.getCssName('blue'));
      break;
    case wtf.ui.ProgressDialog.TaskStyle.SECONDARY:
      goog.dom.classes.addRemove(
          this.progressTrackEl_,
          goog.getCssName('blue'),
          goog.getCssName('green'));
      break;
  }
};
