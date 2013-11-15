/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Zooming DOM element wrapper.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.zoom.Element');

goog.require('goog.dom');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventType');
goog.require('goog.math.Coordinate');
goog.require('goog.style');
goog.require('goog.userAgent');
goog.require('wtf.events');
goog.require('wtf.ui.zoom.TransitionMode');



/**
 * Wrapper for elements that take on zooming behavior.
 *
 * @param {!Element} el Target DOM element.
 * @param {!wtf.ui.zoom.ITarget} zoomTarget Target of the zoom behaviors.
 * @constructor
 * @extends {goog.events.EventHandler}
 */
wtf.ui.zoom.Element = function(el, zoomTarget) {
  goog.base(this, this);

  /**
   * DOM helper.
   * @type {!goog.dom.DomHelper}
   * @private
   */
  this.dom_ = goog.dom.getDomHelper(el);

  /**
   * The viewport size monitor.
   * @type {!goog.dom.ViewportSizeMonitor}
   * @private
   */
  this.viewportSizeMonitor_ = wtf.events.acquireViewportSizeMonitor();

  /**
   * Target DOM element.
   * @type {!Element}
   */
  this.el = el;

  /**
   * @type {!wtf.ui.zoom.ITarget}
   */
  this.zoomTarget = zoomTarget;

  /**
   * Camera scale at the start of a pinch gesture.
   * @type {number}
   * @private
   */
  this.startingScale_ = 1.0;

  /**
   * Ignore touch events until all touches end.
   * @type {boolean}
   * @private
   */
  this.ignoreTouches_ = false;

  /**
   * Cached element offset. Updated on resize.
   * @type {!goog.math.Coordinate}
   * @private
   */
  this.elementOffset_ = goog.style.getPageOffset(this.el);

  // Relayout as required.
  this.listen(
      this.viewportSizeMonitor_,
      goog.events.EventType.RESIZE,
      function() {
        var offset = goog.style.getPageOffset(this.el);
        this.elementOffset_.x = offset.x;
        this.elementOffset_.y = offset.y;
      }, false, this);

  this.setCursor();
};
goog.inherits(wtf.ui.zoom.Element, goog.events.EventHandler);


/**
 * @override
 */
wtf.ui.zoom.Element.prototype.disposeInternal = function() {
  wtf.events.releaseViewportSizeMonitor(this.viewportSizeMonitor_);

  goog.base(this, 'disposeInternal');
};


/**
 * Binds all events to the target element.
 */
wtf.ui.zoom.Element.prototype.bindAllEvents = function() {
  this.unbindAllEvents();

  this.bindPanningEvents();

  this.listen(this.el,
      goog.userAgent.GECKO ? 'DOMMouseScroll' : 'mousewheel', this.mousewheel_);
  this.listen(this.el, goog.events.EventType.SELECTSTART, this.preventDefault_);
  this.listen(this.el, goog.events.EventType.CONTEXTMENU, this.preventDefault_);
};


/**
 * Binds panning events to the target element.
 */
wtf.ui.zoom.Element.prototype.bindPanningEvents = function() {
  this.unbindPanningEvents();

  this.listen(this.el, goog.events.EventType.MOUSEDOWN, this.mousedown_);
  this.listen(this.el, goog.events.EventType.MOUSEUP, this.mouseup_);
  this.listen(this.el, goog.events.EventType.MOUSEOUT, this.mouseout_);
  this.listen(this.el, goog.events.EventType.MOUSEMOVE, this.mousemove_);

  this.listen(this.el, goog.events.EventType.TOUCHSTART, this.touchstart_);
  this.listen(this.el, goog.events.EventType.TOUCHEND, this.touchend_);
  this.listen(this.el, goog.events.EventType.TOUCHMOVE, this.touchmove_);
  this.listen(this.el, goog.events.EventType.TOUCHCANCEL, this.touchcancel_);
};


/**
 * Unbinds all events from the target element.
 */
wtf.ui.zoom.Element.prototype.unbindAllEvents = function() {
  this.removeAll();
};


/**
 * Unbinds panning events from the target element.
 */
wtf.ui.zoom.Element.prototype.unbindPanningEvents = function() {
  this.unlisten(this.el, goog.events.EventType.MOUSEDOWN, this.mousedown_);
  this.unlisten(this.el, goog.events.EventType.MOUSEUP, this.mouseup_);
  this.unlisten(this.el, goog.events.EventType.MOUSEOUT, this.mouseout_);
  this.unlisten(this.el, goog.events.EventType.MOUSEMOVE, this.mousemove_);

  this.unlisten(this.el, goog.events.EventType.TOUCHSTART, this.touchstart_);
  this.unlisten(this.el, goog.events.EventType.TOUCHEND, this.touchend_);
  this.unlisten(this.el, goog.events.EventType.TOUCHMOVE, this.touchmove_);
  this.unlisten(this.el, goog.events.EventType.TOUCHCANCEL, this.touchcancel_);
};


/**
 * Sets the cursor for the element.
 * @param {string=} opt_name Cursor name.
 */
wtf.ui.zoom.Element.prototype.setCursor = function(opt_name) {
  if (goog.isDef(opt_name)) {
    goog.style.setStyle(this.el, 'cursor', opt_name);
  } else {
    goog.style.setStyle(this.el, 'cursor', '');
  }
};


/**
 * Steals focus from any active input control.
 * @private
 */
wtf.ui.zoom.Element.prototype.takeFocus_ = function() {
  var doc = this.dom_.getDocument();
  if (doc.activeElement) {
    doc.activeElement.blur();
  }
  this.el.focus();
};


/**
 * Gets the event position offset relative to the current target, as opposed to
 * the real target.
 * @param {!goog.events.BrowserEvent} e Browser event.
 * @return {!goog.math.Coordinate} Position of the event relative to the current
 *     target.
 * @private
 */
wtf.ui.zoom.Element.prototype.getEventOffset_ = function(e) {
  var x = e.clientX - this.elementOffset_.x;
  var y = e.clientY - this.elementOffset_.y;
  return new goog.math.Coordinate(x, y);
};


/**
 * @param {!goog.events.BrowserEvent} e Browser event.
 * @private
 */
wtf.ui.zoom.Element.prototype.mousedown_ = function(e) {
  var offset = this.getEventOffset_(e);
  var button = /** @type {goog.events.BrowserEvent.MouseButton} */ (e.button);
  this.takeFocus_();
  if (this.zoomTarget.mouseDown(offset.x, offset.y, button)) {
    e.stopPropagation();
    e.preventDefault();
  }
};


/**
 * @param {!goog.events.BrowserEvent} e Browser event.
 * @private
 */
wtf.ui.zoom.Element.prototype.mouseup_ = function(e) {
  var offset = this.getEventOffset_(e);
  var button = /** @type {goog.events.BrowserEvent.MouseButton} */ (e.button);
  this.takeFocus_();
  if (this.zoomTarget.mouseUp(offset.x, offset.y, button)) {
    e.stopPropagation();
    e.preventDefault();
  }
};


/**
 * @param {!goog.events.BrowserEvent} e Browser event.
 * @private
 */
wtf.ui.zoom.Element.prototype.mouseout_ = function(e) {
  if (this.zoomTarget.mouseOut()) {
    e.stopPropagation();
    e.preventDefault();
  }
};


/**
 * @param {!goog.events.BrowserEvent} e Browser event.
 * @private
 */
wtf.ui.zoom.Element.prototype.mousemove_ = function(e) {
  var offset = this.getEventOffset_(e);
  if (this.zoomTarget.mouseMove(offset.x, offset.y)) {
    e.stopPropagation();
    e.preventDefault();
  }
};


/**
 * @param {!goog.events.BrowserEvent} e Browser event.
 * @private
 */
wtf.ui.zoom.Element.prototype.mousewheel_ = function(e) {
  var offset = this.getEventOffset_(e);

  var z = 0;
  var browserEvent = e.getBrowserEvent();
  if (goog.isDef(browserEvent.wheelDelta)) {
    z = browserEvent.wheelDelta / 120;
    if (goog.userAgent.OPERA) {
      z = -z;
    }
  } else if (goog.isDef(browserEvent.detail)) {
    z = -browserEvent.detail / 3;
  }
  if (z) {
    if (!isNaN(offset.x) && !isNaN(offset.y)) {
      if (this.zoomTarget.mouseWheel(offset.x, offset.y, z)) {
        e.stopPropagation();
        e.preventDefault();
        return;
      }
    }
  }

  // Always prevent default behavior.
  e.preventDefault();
};


/**
 * @param {!goog.events.BrowserEvent} e Browser event.
 * @private
 */
wtf.ui.zoom.Element.prototype.touchstart_ = function(e) {
  var touchEvent = /** @type {!TouchEvent} */ (e.getBrowserEvent());
  var offset = this.getEventOffset_(e);
  var button = goog.events.BrowserEvent.MouseButton.LEFT;

  // Stash for relative zooming.
  this.startingScale_ = this.zoomTarget.getScale();

  // Down on first touch only, others reset base.
  if (!this.ignoreTouches_) {
    var touches = touchEvent.targetTouches;
    if (touches.length == 1) {
      this.zoomTarget.mouseDown(offset.x, offset.y, button);
    } else if (touches.length == 3) {
      // 3 taps - zoom to fit.
      this.zoomTarget.zoomToFit();
      this.ignoreTouches_ = true;
    } else {
      this.zoomTarget.mouseReset(offset.x, offset.y);
    }
  }

  e.preventDefault();
};


/**
 * @param {!goog.events.BrowserEvent} e Browser event.
 * @private
 */
wtf.ui.zoom.Element.prototype.touchend_ = function(e) {
  var touchEvent = /** @type {!TouchEvent} */ (e.getBrowserEvent());
  var offset = this.getEventOffset_(e);
  var button = goog.events.BrowserEvent.MouseButton.LEFT;

  // Up on last touch only, others reset base.
  var touches = touchEvent.targetTouches;
  if (touches.length == 0) {
    this.zoomTarget.mouseUp(offset.x, offset.y, button);
    this.ignoreTouches_ = false;
  } else {
    if (!this.ignoreTouches_) {
      this.zoomTarget.mouseReset(offset.x, offset.y);
    }
  }

  e.preventDefault();
};


/**
 * @param {!goog.events.BrowserEvent} e Browser event.
 * @private
 */
wtf.ui.zoom.Element.prototype.touchcancel_ = function(e) {
  var touchEvent = /** @type {!TouchEvent} */ (e.getBrowserEvent());

  var touches = touchEvent.targetTouches;
  if (!touches.length) {
    this.ignoreTouches_ = false;
  }

  this.zoomTarget.mouseOut();

  e.preventDefault();
};


/**
 * @param {!goog.events.BrowserEvent} e Browser event.
 * @private
 */
wtf.ui.zoom.Element.prototype.touchmove_ = function(e) {
  var touchEvent = /** @type {!TouchEvent} */ (e.getBrowserEvent());
  var offset = this.getEventOffset_(e);

  if (!this.ignoreTouches_) {
    var touches = touchEvent.targetTouches;
    if (touches.length == 1) {
      // Pan.
      this.zoomTarget.mouseMove(offset.x, offset.y);
    } else if (touches.length == 2) {
      // Zoom.
      var scale = touchEvent.scale;
      var newScale = this.startingScale_ * scale;
      this.zoomTarget.mouseMove(offset.x, offset.y);
      this.zoomTarget.zoomAboutCoordinate(offset.x, offset.y, newScale,
          wtf.ui.zoom.TransitionMode.IMMEDIATE);
      this.zoomTarget.setMoved();
    }
  }

  e.preventDefault();
};


/**
 * @param {!goog.events.BrowserEvent} e Browser event.
 * @private
 */
wtf.ui.zoom.Element.prototype.preventDefault_ = function(e) {
  e.preventDefault();
};
