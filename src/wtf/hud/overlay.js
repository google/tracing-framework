/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview HUD overlay UI.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.hud.Overlay');

goog.require('goog.Disposable');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventType');
goog.require('goog.fx.Dragger');
goog.require('goog.math.Rect');
goog.require('goog.net.cookies');
goog.require('goog.soy');
goog.require('goog.style');
goog.require('wtf');
goog.require('wtf.events.Keyboard');
goog.require('wtf.events.KeyboardScope');
goog.require('wtf.hud.overlay');
goog.require('wtf.io.BufferedHttpWriteStream');
goog.require('wtf.trace');



/**
 * HUD overlay control UI.
 *
 * @param {!wtf.trace.Session} session Current tracing session.
 * @param {!Object} options Options.
 * @param {Element=} opt_parentElement Element to display in.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.hud.Overlay = function(session, options, opt_parentElement) {
  goog.base(this);

  /**
   * Tracing session.
   * @type {!wtf.trace.Session}
   * @private
   */
  this.session_ = session;

  /**
   * Options.
   * @type {!Object}
   * @private
   */
  this.options_ = options;

  /**
   * DOM helper.
   * @type {!goog.dom.DomHelper}
   * @private
   */
  this.dom_ = goog.dom.getDomHelper(opt_parentElement);

  /**
   * Parent DOM element.
   * @type {!Element}
   * @private
   */
  this.parentElement_ = /** @type {!Element} */ (
      opt_parentElement || this.dom_.getDocument().body);

  /**
   * Event handler.
   * @type {!goog.events.EventHandler}
   * @private
   */
  this.eh_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eh_);

  /**
   * <style> from template.
   * Note that we don't use GSS so that we can avoid another file dependency
   * and renaming issues.
   * @type {!Element}
   * @private
   */
  this.styleElement_ = /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.hud.overlay.style, undefined, undefined, this.dom_));

  /**
   * Root control UI.
   * @type {!Element}
   * @private
   */
  this.rootElement_ = /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.hud.overlay.control, undefined, undefined, this.dom_));
  goog.style.setUnselectable(this.rootElement_, true);

  /**
   * Graph canvas.
   * @type {!HTMLCanvasElement}
   * @private
   */
  this.graphCanvas_ = this.dom_.getElementsByTagNameAndClass(
      goog.dom.TagName.CANVAS, undefined, this.rootElement_)[0];

  /**
   * Graph canvas 2D context.
   * This will be the unhooked 2D context.
   * @type {!CanvasRenderingContext2D}
   * @private
   */
  this.graphContext2d_ =
      this.graphCanvas_.getContext('raw-2d') ||
      this.graphCanvas_.getContext('2d');

  /**
   * True if the overlay is in the DOM and should be updated.
   * @type {boolean}
   * @private
   */
  this.isActive_ = false;

  /**
   * Docking position.
   * @type {wtf.hud.Overlay.DockPosition_}
   * @private
   */
  this.dockPosition_ = wtf.hud.Overlay.DockPosition_.TOP;
  if (options['dock'] == 'bottom') {
    this.dockPosition_ = wtf.hud.Overlay.DockPosition_.BOTTOM;
  }

  /**
   * Current width, in px.
   * @type {number}
   * @private
   */
  this.width_ =
      Number(goog.net.cookies.get(wtf.hud.Overlay.SPLITTER_WIDTH_COOKIE_,
      String(wtf.hud.Overlay.DEFAULT_WIDTH_)));

  var splitter = this.dom_.getElementByClass(
      wtf.hud.Overlay.CssName_.SPLITTER, this.rootElement_);
  /**
   * Splitter dragger controller.
   * @type {!goog.fx.Dragger}
   * @private
   */
  this.dragger_ = new goog.fx.Dragger(splitter);
  this.registerDisposable(this.dragger_);
  this.eh_.listen(this.dragger_,
      goog.fx.Dragger.EventType.START, this.dragStart_, false);
  this.eh_.listen(this.dragger_,
      goog.fx.Dragger.EventType.BEFOREDRAG, this.dragMove_, false);
  this.eh_.listen(this.dragger_,
      goog.fx.Dragger.EventType.END, this.dragEnd_, false);

  /**
   * Width of the overlay when starting a drag.
   * Used to calculate new widths based on deltas from the drag events.
   * @type {number}
   * @private
   */
  this.startDragWidth_ = this.width_;

  /**
   * Document body cursor at the start of a drag, if any.
   * @type {string|undefined}
   * @private
   */
  this.previousCursor_ = undefined;

  // Bind events.
  this.eh_.listen(this.graphCanvas_,
      goog.events.EventType.CLICK, this.graphClicked_, false);
  var wtfHudButtonSend = this.dom_.getElementByClass(
      wtf.hud.Overlay.CssName_.SEND_BUTTON, this.rootElement_);
  this.eh_.listen(wtfHudButtonSend,
      goog.events.EventType.CLICK, this.sendSnapshotClicked_, false);
  var wtfHudButtonSave = this.dom_.getElementByClass(
      wtf.hud.Overlay.CssName_.SAVE_BUTTON, this.rootElement_);
  this.eh_.listen(wtfHudButtonSave,
      goog.events.EventType.CLICK, this.saveSnapshotClicked_, false);
  var wtfHudButtonSettings = this.dom_.getElementByClass(
      wtf.hud.Overlay.CssName_.SETTINGS_BUTTON, this.rootElement_);
  this.eh_.listen(wtfHudButtonSettings,
      goog.events.EventType.CLICK, this.settingsClicked_, false);

  // Setup keyboard shortcuts.
  var keyboard = wtf.events.Keyboard.getWindowKeyboard(this.dom_.getWindow());
  var keyboardScope = new wtf.events.KeyboardScope(keyboard);
  this.registerDisposable(keyboardScope);
  keyboardScope.addShortcut('f9', this.saveSnapshotClicked_, this);
  keyboardScope.addShortcut('f10', this.sendSnapshotClicked_, this);

  // TODO(benvanik): generate counter code
  /*
  'counters': [
    {
      'name': 'foo::bar',
      'min': 0,
      'max': 100,
      'style': 'bar',
      'format': '{CUR:2}ms ({MIN:2}-{MAX:2})'
    }, ...
  ]
  'default': {
    'display': 'foo::bar'
  }
  */
  // var providerInfos = wtf.data.getAllProviders();
  // var providerMap = {};
  // for (var n = 0; n < providerInfos.length; n++) {
  //   providerMap[providerInfos[n].name] = providerInfo;
  // }
  // for (var n = 0; n < counters.length; n++) {
  //   var counter = counters[n];
  //   var nameParts = counter.name.split('::');
  //   var providerInfo = providerMap[nameParts[0]];
  //   var eventInfo = providerInfo.getEventByName(nameParts[1]);
  //   //
  // }
};
goog.inherits(wtf.hud.Overlay, goog.Disposable);


/**
 * @override
 */
wtf.hud.Overlay.prototype.disposeInternal = function() {
  this.exitDocument();
  goog.base(this, 'disposeInternal');
};


/**
 * Overlay docking position.
 * @enum {number}
 * @private
 */
wtf.hud.Overlay.DockPosition_ = {
  /**
   * Dock at the top of the screen.
   */
  TOP: 0,

  /**
   * Dock at the bottom of the screen.
   */
  BOTTOM: 1
};


/**
 * Default width, in px.
 * @const
 * @type {number}
 * @private
 */
wtf.hud.Overlay.DEFAULT_WIDTH_ = 140;


/**
 * Default height, in px.
 * @const
 * @type {number}
 * @private
 */
wtf.hud.Overlay.DEFAULT_HEIGHT_ = 40;


/**
 * Minimum width, in px.
 * @const
 * @type {number}
 * @private
 */
wtf.hud.Overlay.MIN_WIDTH_ = 59;


/**
 * Maximum width, in px.
 * @const
 * @type {number}
 * @private
 */
wtf.hud.Overlay.MAX_WIDTH_ = 500;


/**
 * CSS names used in the soy templates.
 * @enum {string}
 * @private
 */
wtf.hud.Overlay.CssName_ = {
  SPLITTER: 'wtfHudSplitter',
  BUTTONS: 'wtfHudButtons',
  SEND_BUTTON: 'wtfHudButtonSend',
  SAVE_BUTTON: 'wtfHudButtonSave',
  SETTINGS_BUTTON: 'wtfHudButtonSettings'
};


/**
 * Name of the cookie used to set the splitter width.
 * @const
 * @type {string}
 * @private
 */
wtf.hud.Overlay.SPLITTER_WIDTH_COOKIE_ = 'wtfHW';


/**
 * Adds the overlay to the DOM.
 */
wtf.hud.Overlay.prototype.enterDocument = function() {
  // Adjust position on page.
  switch (this.dockPosition_) {
    default:
    case wtf.hud.Overlay.DockPosition_.TOP:
      goog.style.setStyle(this.rootElement_, 'top', '0');
      goog.style.setStyle(this.rootElement_, 'right', '0');
      break;
    case wtf.hud.Overlay.DockPosition_.BOTTOM:
      goog.style.setStyle(this.rootElement_, 'bottom', '0');
      goog.style.setStyle(this.rootElement_, 'right', '0');
      break;
  }

  // TODO(benvanik): bind click event to bring up UI/etc

  // Add to page.
  this.dom_.appendChild(this.parentElement_, this.styleElement_);
  this.dom_.appendChild(this.parentElement_, this.rootElement_);
  this.isActive_ = true;

  // Perform initial resize.
  this.setWidth(this.width_);
};


/**
 * Removes the overlay to the DOM.
 */
wtf.hud.Overlay.prototype.exitDocument = function() {
  this.dom_.removeNode(this.rootElement_);
  this.dom_.removeNode(this.styleElement_);
  this.isActive_ = false;
};


/**
 * Sets the width of the overlay, in px.
 * @param {number} value New width, in px.
 */
wtf.hud.Overlay.prototype.setWidth = function(value) {
  // Store width in the cookie.
  if (value != wtf.hud.Overlay.DEFAULT_WIDTH_) {
    goog.net.cookies.set(wtf.hud.Overlay.SPLITTER_WIDTH_COOKIE_, String(value));
  } else {
    goog.net.cookies.remove(wtf.hud.Overlay.SPLITTER_WIDTH_COOKIE_);
  }

  // Resize control.
  this.width_ = value;
  goog.style.setSize(this.rootElement_, value, wtf.hud.Overlay.DEFAULT_HEIGHT_);

  // Resize canvas.
  var graphCanvasSize = goog.style.getSize(this.graphCanvas_.parentElement);
  this.graphCanvas_.width = graphCanvasSize.width;
  this.graphCanvas_.height = wtf.hud.Overlay.DEFAULT_HEIGHT_;

  // Redraw after resize.
  this.redraw();
};


/**
 * Handles splitter drag start events.
 * @param {!goog.fx.DragEvent} e Event.
 * @private
 */
wtf.hud.Overlay.prototype.dragStart_ = function(e) {
  // Stash width for delta calculations.
  this.startDragWidth_ = this.width_;

  // Set dragger limits.
  this.dragger_.setLimits(new goog.math.Rect(
      -wtf.hud.Overlay.MAX_WIDTH_,
      0,
      wtf.hud.Overlay.MAX_WIDTH_ + (this.width_ - wtf.hud.Overlay.MIN_WIDTH_),
      0));

  // Reset document cursor to resize so it doesn't flicker.
  goog.style.setStyle(this.graphCanvas_, 'cursor', 'ew-resize');
  var body = this.dom_.getDocument().body;
  this.previousCursor_ = goog.style.getStyle(body, 'cursor');
  goog.style.setStyle(body, 'cursor', 'ew-resize');
};


/**
 * Handles splitter drag move events.
 * @param {!goog.fx.DragEvent} e Event.
 * @return {boolean} False to prevent default behavior.
 * @private
 */
wtf.hud.Overlay.prototype.dragMove_ = function(e) {
  e.browserEvent.preventDefault();

  // Calculate new width and resize.
  var newWidth = this.startDragWidth_ - e.left;
  this.setWidth(newWidth);
  return false;
};


/**
 * Handles splitter drag end events.
 * @param {!goog.fx.DragEvent} e Event.
 * @private
 */
wtf.hud.Overlay.prototype.dragEnd_ = function(e) {
  // Restore document cursor.
  goog.style.setStyle(this.graphCanvas_, 'cursor', '');
  var body = this.dom_.getDocument().body;
  goog.style.setStyle(body, 'cursor', this.previousCursor_);
};


/**
 * Advances the HUD time.
 * @param {number=} opt_time New time. Prefer using {@see wtf#now}.
 */
wtf.hud.Overlay.prototype.advance = function(opt_time) {
  var time = opt_time || wtf.now();
  // TODO(benvanik): advance time, update the overlay

  // Redraw after update.
  this.redraw();
};


/**
 * Redraws the graph.
 */
wtf.hud.Overlay.prototype.redraw = function() {
  // Ignore if at min width.
  if (this.width_ == wtf.hud.Overlay.MIN_WIDTH_) {
    return;
  }

  // this.graphContext2d_
};


/**
 * Handles clicks on the graph.
 * @param {!goog.events.BrowserEvent} e Event.
 * @private
 */
wtf.hud.Overlay.prototype.graphClicked_ = function(e) {
  // TODO(benvanik): embiggen graph? config dialog?
};


/**
 * Handles clicks on the send to UI button.
 * @param {!goog.events.BrowserEvent} e Event.
 * @private
 */
wtf.hud.Overlay.prototype.sendSnapshotClicked_ = function(e) {
  // Send snapshot.
  this.sendSnapshot_();
};


/**
 * Handles clicks on the save button.
 * @param {!goog.events.BrowserEvent} e Event.
 * @private
 */
wtf.hud.Overlay.prototype.saveSnapshotClicked_ = function(e) {
  wtf.trace.snapshot();
};


/**
 * Handles clicks on the settings UI button.
 * @param {!goog.events.BrowserEvent} e Event.
 * @private
 */
wtf.hud.Overlay.prototype.settingsClicked_ = function(e) {
  // Show settings dialog.
  window.alert('TODO');
};


/**
 * Sends a snapshot to the UI.
 * @private
 */
wtf.hud.Overlay.prototype.sendSnapshot_ = function() {
  // TODO(benvanik): something more sophisticated
  var host = COMPILED ? 'localhost:9023' : 'localhost:9024';
  if (this.options_['app']) {
    host = this.options_['app']['endpoint'] || host;
  }
  var url = 'http://' + host + '/snapshot/upload';

  // Capture snapshot into memory buffers.
  var buffers = [];
  wtf.trace.snapshot(function() {
    return new wtf.io.BufferedHttpWriteStream(url);
  });
};
