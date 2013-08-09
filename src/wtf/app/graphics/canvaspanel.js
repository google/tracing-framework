/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview 'Canvas' panel.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.graphics.CanvasPanel');

goog.require('goog.soy');
goog.require('wtf.app.TabPanel');
goog.require('wtf.app.graphics.canvaspanel');
goog.require('wtf.events');
goog.require('wtf.replay.graphics');
goog.require('wtf.ui.ErrorDialog');



/**
 * WebGL panel, allowing for WebGL replay.
 * @param {!wtf.app.DocumentView} documentView Parent document view.
 * @constructor
 * @extends {wtf.app.TabPanel}
 */
wtf.app.graphics.CanvasPanel = function(documentView) {
  goog.base(this, documentView, 'canvas', 'Canvas/WebGL');

  /**
   * Graphics replay session.
   * This is created on demand to reduce startup time and resource usage.
   * @type {wtf.replay.graphics.Session}
   * @private
   */
  this.session_ = null;

  var commandManager = wtf.events.getCommandManager();
  commandManager.registerSimpleCommand(
      'goto_canvas_step', function(source, target, expression) {
        // TODO(benvanik): go to graphics step/frame/whatever.
      }, this);
};
goog.inherits(wtf.app.graphics.CanvasPanel, wtf.app.TabPanel);


/**
 * @override
 */
wtf.app.graphics.CanvasPanel.prototype.disposeInternal = function() {
  var commandManager = wtf.events.getCommandManager();
  commandManager.unregisterCommand('goto_canvas_step');
  goog.base(this, 'disposeInternal');
};


/**
 * Ensures that the replay session is created, creating it if needed.
 * @private
 */
wtf.app.graphics.CanvasPanel.prototype.ensureSessionCreated_ = function() {
  if (this.session_) {
    return;
  }

  var doc = this.getDocumentView().getDocument();
  var db = doc.getDatabase();

  // Create the session.
  try {
    this.session_ = wtf.replay.graphics.setup(
        db, this.getRootElement(), this.getDom());
    this.registerDisposable(this.session_);
  } catch (e) {
    wtf.ui.ErrorDialog.show(
        'Unable to setup replay',
        'Ensure WebGL hasn\'t crashed (check for a ' +
        '<a href="https://support.google.com/chrome/answer/2905826?hl=en" ' +
        'target="_blank">Rats! WebGL hit a snag</a> bar above). You can try ' +
        'reloading the page or restarting your browser.\n\n' + e.toString(),
        this.getDom());
    return;
  }

  // Initial layout.
  this.session_.layout();
};


/**
 * @override
 */
wtf.app.graphics.CanvasPanel.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.graphics.canvaspanel.control, undefined, undefined, dom));
};


/**
 * @override
 */
wtf.app.graphics.CanvasPanel.prototype.layoutInternal = function() {
  if (this.session_) {
    this.session_.layout();
  }
};


/**
 * @override
 */
wtf.app.graphics.CanvasPanel.prototype.setVisible = function(value) {
  goog.base(this, 'setVisible', value);

  // Create session when first set visible.
  if (value) {
    this.ensureSessionCreated_();
  }
};


/**
 * @override
 */
wtf.app.graphics.CanvasPanel.prototype.navigate = function(pathParts) {
  // TODO(benvanik): support navigation (to steps, resources, etc).
};
