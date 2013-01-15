/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Splash dialog screen.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.SplashDialog');

goog.require('goog.events.EventType');
goog.require('goog.soy');
goog.require('wtf.app.ui.splashdialog');
goog.require('wtf.events');
goog.require('wtf.events.Keyboard');
goog.require('wtf.io.drive');
goog.require('wtf.ui.Dialog');
goog.require('wtf.version');



/**
 * Splash overlay screen.
 *
 * @param {!Element} parentElement Element to display in.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Dialog}
 */
wtf.app.ui.SplashDialog = function(parentElement, opt_dom) {
  goog.base(this, {
    modal: true,
    clickToClose: false
  }, parentElement, opt_dom);

  var commandManager = wtf.events.getCommandManager();

  var eh = this.getHandler();
  eh.listen(this.getChildElement(goog.getCssName('openButton')),
      goog.events.EventType.CLICK, function(e) {
        e.preventDefault();
        commandManager.execute('open_trace', this, null);
      }, false);
  if (wtf.io.drive.isSupported()) {
    eh.listen(this.getChildElement(goog.getCssName('openDriveButton')),
        goog.events.EventType.CLICK, function(e) {
          e.preventDefault();
          commandManager.execute('open_drive_trace', this, null);
        }, false);
  }
};
goog.inherits(wtf.app.ui.SplashDialog, wtf.ui.Dialog);


/**
 * @override
 */
wtf.app.ui.SplashDialog.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.splashdialog.control, {
        version: wtf.version.toString(),
        version_commit: wtf.version.getCommit(),
        system_key: wtf.events.Keyboard.SYSTEM_KEY,
        show_drive: wtf.io.drive.isSupported()
      }, undefined, dom));
};
