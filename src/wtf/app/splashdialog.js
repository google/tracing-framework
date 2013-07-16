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

goog.provide('wtf.app.SplashDialog');

goog.require('goog.events.EventType');
goog.require('goog.soy');
goog.require('wtf.app.splashdialog');
goog.require('wtf.events');
goog.require('wtf.events.Keyboard');
goog.require('wtf.events.KeyboardScope');
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
wtf.app.SplashDialog = function(parentElement, opt_dom) {
  goog.base(this, {
    modal: true,
    clickToClose: false
  }, parentElement, opt_dom);

  var dom = this.getDom();
  var commandManager = wtf.events.getCommandManager();

  // Setup keyboard shortcuts.
  var keyboard = wtf.events.getWindowKeyboard(dom);
  var keyboardScope = new wtf.events.KeyboardScope(keyboard);
  this.registerDisposable(keyboardScope);
  keyboardScope.addCommandShortcut('command+o', 'open_local_trace');

  var eh = this.getHandler();
  eh.listen(this.getChildElement(goog.getCssName('openButton')),
      goog.events.EventType.CLICK, function(e) {
        e.preventDefault();
        commandManager.execute('open_local_trace', this, null);
      }, false);
  if (wtf.io.drive.isSupported()) {
    eh.listen(this.getChildElement(goog.getCssName('openDriveButton')),
        goog.events.EventType.CLICK, function(e) {
          e.preventDefault();
          commandManager.execute('open_drive_trace', this, null);
        }, false);
  }
};
goog.inherits(wtf.app.SplashDialog, wtf.ui.Dialog);


/**
 * @override
 */
wtf.app.SplashDialog.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.splashdialog.control, {
        version: wtf.version.toString(),
        version_commit: wtf.version.getCommit(),
        system_key: wtf.events.Keyboard.SYSTEM_KEY,
        show_drive: wtf.io.drive.isSupported()
      }, undefined, dom));
};
