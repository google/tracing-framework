/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Generic zooming viewport control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.zoom.Viewport');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.BrowserEvent');
goog.require('goog.math.Coordinate');
goog.require('goog.math.Rect');
goog.require('goog.vec.Mat3');
goog.require('wtf');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.events.EventType');
goog.require('wtf.timing');
goog.require('wtf.timing.RunMode');
goog.require('wtf.ui.zoom.Element');
goog.require('wtf.ui.zoom.ITarget');
goog.require('wtf.ui.zoom.Spring');
goog.require('wtf.ui.zoom.TransitionMode');



/**
 * Zooming viewport controller.
 * Supports multiple zooming viewports that synchronize state. Does not perform
 * any display, only input and viewport logic.
 *
 * @constructor
 * @extends {wtf.events.EventEmitter}
 * @implements {wtf.ui.zoom.ITarget}
 */
wtf.ui.zoom.Viewport = function() {
  goog.base(this);

  /**
   * Screen width, in px.
   * @type {number}
   * @private
   */
  this.screenWidth_ = 1;

  /**
   * Screen height, in px.
   * @type {number}
   * @private
   */
  this.screenHeight_ = 1;

  /**
   * Scene/content width, in px.
   * @type {number}
   * @private
   */
  this.sceneWidth_ = 1;

  /**
   * Scene/content height, in px.
   * @type {number}
   * @private
   */
  this.sceneHeight_ = 1;

  /**
   * Minimum allowed scale.
   * @type {number}
   * @private
   */
  this.minScale_ = 0.1;

  /**
   * Maximum allowed scale.
   * @type {number}
   * @private
   */
  this.maxScale_ = 10;

  /**
   * @type {!wtf.ui.zoom.Spring}
   * @private
   */
  this.cameraX_ = new wtf.ui.zoom.Spring(0);

  /**
   * @type {!wtf.ui.zoom.Spring}
   * @private
   */
  this.cameraY_ = new wtf.ui.zoom.Spring(0);

  /**
   * @type {!wtf.ui.zoom.Spring}
   * @private
   */
  this.cameraScale_ = new wtf.ui.zoom.Spring(1);

  /**
   * @type {number}
   * @private
   */
  this.zoomCenterX_ = 0;

  /**
   * @type {number}
   * @private
   */
  this.zoomCenterY_ = 0;

  /**
   * @type {!Array.<!wtf.ui.zoom.Element>}
   * @private
   */
  this.elements_ = [];

  /**
   * Whether the left mouse button is down.
   * @type {boolean}
   * @private
   */
  this.leftMouseDown_ = false;

  /**
   * Last control-relative mouse X.
   * @type {number}
   * @private
   */
  this.lastMouseX_ = 0;

  /**
   * Last control-relative mouse Y.
   * @type {number}
   * @private
   */
  this.lastMouseY_ = 0;

  /**
   * Amount the mouse has moved, in px distance.
   * @type {number}
   * @private
   */
  this.mouseDelta_ = 0;

  /**
   * Whether the last update was animating.
   * @type {boolean}
   * @private
   */
  this.wasChanging_ = false;

  /**
   * Whether a redraw has been forced.
   * This is automatically reset after the draw occurs.
   * @type {boolean}
   * @private
   */
  this.forceInvalidation_ = false;

  /**
   * @type {boolean}
   * @private
   */
  this.reentryCheck_ = false;

  /**
   * @type {?wtf.timing.Handle}
   * @private
   */
  this.interval_ = null;

  // This is such a hack. All of this needs to be redesigned.
  /**
   * A list of other viewports that are linked to this one.
   * @type {!Array.<!wtf.ui.zoom.Viewport>}
   * @private
   */
  this.peers_ = [];
};
goog.inherits(wtf.ui.zoom.Viewport, wtf.events.EventEmitter);


/**
 * Links two viewports together.
 * @param {!wtf.ui.zoom.Viewport} a First viewport.
 * @param {!wtf.ui.zoom.Viewport} b Second viewport.
 */
wtf.ui.zoom.Viewport.link = function(a, b) {
  a.peers_.push(b);
  b.peers_.push(a);
};


/**
 * Event types.
 * @type {!Object.<string>}
 */
wtf.ui.zoom.Viewport.EventType = {
  CLICK: goog.events.getUniqueId('click')
};


/**
 * Gets the screen width.
 * @return {number} Screen width, in px.
 */
wtf.ui.zoom.Viewport.prototype.getScreenWidth = function() {
  return this.screenWidth_;
};


/**
 * Gets the screen height.
 * @return {number} Screen height, in px.
 */
wtf.ui.zoom.Viewport.prototype.getScreenHeight = function() {
  return this.screenHeight_;
};


/**
 * Sets the screen size.
 * @param {number} width New screen width, in px.
 * @param {number} height New screen height, in px.
 */
wtf.ui.zoom.Viewport.prototype.setScreenSize = function(width, height) {
  width = Math.ceil(width);
  height = Math.ceil(height);
  if (this.screenWidth_ == width && this.screenHeight_ == height) {
    return;
  }
  this.screenWidth_ = width;
  this.screenHeight_ = height;

  this.requestRender_();
};


/**
 * Gets the scene width.
 * @return {number} Scene width, in px.
 */
wtf.ui.zoom.Viewport.prototype.getSceneWidth = function() {
  return this.sceneWidth_;
};


/**
 * Gets the scene height.
 * @return {number} Scene height, in px.
 */
wtf.ui.zoom.Viewport.prototype.getSceneHeight = function() {
  return this.sceneHeight_;
};


/**
 * Sets the scene size.
 * @param {number} width New scene width, in scene coordinates.
 * @param {number} height New scene height, in scene coordinates.
 */
wtf.ui.zoom.Viewport.prototype.setSceneSize = function(width, height) {
  if (this.sceneWidth_ == width && this.sceneHeight_ == height) {
    return;
  }
  this.sceneWidth_ = width;
  this.sceneHeight_ = height;
};


/**
 * Translates a point from scene-space to screen-space.
 * @param {number} x Coordinate in scene-space X.
 * @param {number} y Coordinate in scene-space Y.
 * @return {!goog.math.Coordinate} Coordinate in screen space.
 */
wtf.ui.zoom.Viewport.prototype.sceneToScreen = function(x, y) {
  var cameraScale = this.cameraScale_.current;
  return new goog.math.Coordinate(
      (x - this.cameraX_.current) * cameraScale,
      (y - this.cameraY_.current) * cameraScale);
};


/**
 * Translates a point from screen-space to scene-space.
 * @param {number} x Coordinate in screen-space X.
 * @param {number} y Coordinate in screen-space Y.
 * @return {!goog.math.Coordinate} Coordinate in screen space.
 */
wtf.ui.zoom.Viewport.prototype.screenToScene = function(x, y) {
  var cameraScale = this.cameraScale_.current;
  return new goog.math.Coordinate(
      this.cameraX_.current + (x / cameraScale),
      this.cameraY_.current + (y / cameraScale));
};


/**
 * Gets the current viewport transformation.
 * @return {!goog.vec.Mat3.Type} Current viewport transform.
 */
wtf.ui.zoom.Viewport.prototype.getTransform = function() {
  var cameraScale = this.cameraScale_.current;
  var offset = this.sceneToScreen(0, 0);
  return goog.vec.Mat3.createFloat32FromValues(
      cameraScale, 0, 0,
      0, cameraScale, 0,
      offset.x, offset.y, 1);
};


/**
 * Sets the minimum and maximum scale values.
 * @param {number} minimum Minimum scale.
 * @param {number} maximum Maximum scale.
 */
wtf.ui.zoom.Viewport.prototype.setAllowedScales = function(minimum, maximum) {
  this.minScale_ = minimum;
  this.maxScale_ = maximum;
};


/**
 * Gets the current camera scale.
 * @return {number} Current camera scale.
 */
wtf.ui.zoom.Viewport.prototype.getScale = function() {
  return this.cameraScale_.current;
};


/**
 * Movement hysteresis value - the viewport must have moved more than this
 * amount for it to count as intentional user action (instead of just twitchy
 * fingers).
 * @const
 * @type {number}
 * @private
 */
wtf.ui.zoom.Viewport.MOVEMENT_HYSTERESIS_ = 4;


/**
 * Whether the viewport has changed in the current event cycle.
 * @return {boolean} True if the viewport has been moved/transformed/etc.
 */
wtf.ui.zoom.Viewport.prototype.hasMoved = function() {
  return this.mouseDelta_ > wtf.ui.zoom.Viewport.MOVEMENT_HYSTERESIS_;
};


/**
 * Forces the {@see wtf.ui.zoom.Viewport#hasMoved} method to return true for the
 * current event cycle.
 */
wtf.ui.zoom.Viewport.prototype.setMoved = function() {
  this.mouseDelta_ += wtf.ui.zoom.Viewport.MOVEMENT_HYSTERESIS_ * 2;
};


/**
 * Emits an INVALIDATED event.
 * @private
 */
wtf.ui.zoom.Viewport.prototype.emitInvalidate_ = function() {
  // Prevent reentry.
  if (this.reentryCheck_) {
    return;
  }
  try {
    this.reentryCheck_ = true;
    this.emitEvent(wtf.events.EventType.INVALIDATED);
  } finally {
    this.reentryCheck_ = false;
  }
};


/**
 * Begins ticking the update method.
 * @private
 */
wtf.ui.zoom.Viewport.prototype.startTicking_ = function() {
  if (!this.interval_) {
    this.interval_ = wtf.timing.setInterval(
        wtf.timing.RunMode.RENDERING, 16, this.tick_, this);
    this.tick_(wtf.now());
  }
};


/**
 * Stops ticking the update method.
 * @private
 */
wtf.ui.zoom.Viewport.prototype.stopTicking_ = function() {
  if (this.interval_) {
    wtf.timing.clearInterval(this.interval_);
    this.interval_ = null;
  }
};


/**
 * Marks the viewport dirty and begins ticking (if required).
 * @private
 */
wtf.ui.zoom.Viewport.prototype.requestRender_ = function() {
  if (!this.wasChanging_) {
    this.wasChanging_ = true;
    this.startTicking_();
  }
};


/**
 * Forces a redraw.
 * The draw will occur on the next animation frame.
 */
wtf.ui.zoom.Viewport.prototype.invalidate = function() {
  this.forceInvalidation_ = true;
  this.requestRender_();
};


/**
 * Runs animation logic for a single frame.
 * @param {number} time Current time.
 * @private
 */
wtf.ui.zoom.Viewport.prototype.tick_ = function(time) {
  var changing = this.forceInvalidation_ || false;
  this.forceInvalidation_ = false;

  var frameCenterX = this.screenWidth_ / 2;
  var frameCenterY = this.screenHeight_ / 2;
  var oldZoomDistanceX = this.zoomCenterX_ - frameCenterX;
  var oldZoomDistanceY = this.zoomCenterY_ - frameCenterY;
  var newZoomDistanceX = oldZoomDistanceX;
  var newZoomDistanceY = oldZoomDistanceY;
  oldZoomDistanceX /= this.cameraScale_.current;
  oldZoomDistanceY /= this.cameraScale_.current;

  changing = this.cameraScale_.update(time) || changing;
  if (!changing) {
    this.zoomCenterX_ = frameCenterX;
    this.zoomCenterY_ = frameCenterY;
  }

  newZoomDistanceX /= this.cameraScale_.current;
  newZoomDistanceY /= this.cameraScale_.current;
  var addToPanX = oldZoomDistanceX - newZoomDistanceX;
  var addToPanY = oldZoomDistanceY - newZoomDistanceY;
  this.cameraX_.current += addToPanX;
  this.cameraY_.current += addToPanY;
  this.cameraX_.target += addToPanX;
  this.cameraY_.target += addToPanY;

  changing = this.cameraX_.update(time) || changing;
  changing = this.cameraY_.update(time) || changing;

  if (!this.wasChanging_ && changing) {
    this.startTicking_();
  } else if (this.wasChanging_ && !changing) {
    this.stopTicking_();
  }
  this.wasChanging_ = changing;

  if (changing) {
    for (var n = 0; n < this.peers_.length; n++) {
      var peer = this.peers_[n];
      peer.cameraX_.set(this.cameraX_.current, true);
      peer.cameraY_.set(this.cameraY_.current, true);
      peer.cameraScale_.set(this.cameraScale_.current, true);
      peer.emitInvalidate_();
    }

    this.emitInvalidate_();
  }
};


/**
 * Sets the viewport camera.
 * @param {number} x Camera X.
 * @param {number} y Camera Y.
 * @param {number} scale Camera scale.
 */
wtf.ui.zoom.Viewport.prototype.set = function(x, y, scale) {
  this.stop();
  this.cameraX_.set(x);
  this.cameraY_.set(y);
  this.cameraScale_.set(scale);
  this.requestRender_();
};


/**
 * Zooms the view to fit the scene.
 * @param {wtf.ui.zoom.TransitionMode=} opt_transitionMode Transition mode.
 */
wtf.ui.zoom.Viewport.prototype.zoomToFit = function(opt_transitionMode) {
  this.zoomToBounds(
      0, 0, this.sceneWidth_, this.sceneHeight_, opt_transitionMode);
};


/**
 * Zooms a region of the scene into view.
 * @param {number} x Bounds left.
 * @param {number} y Bounds right.
 * @param {number} width Bounds width.
 * @param {number} height Bounds height.
 * @param {wtf.ui.zoom.TransitionMode=} opt_transitionMode Transition mode.
 */
wtf.ui.zoom.Viewport.prototype.zoomToBounds = function(x, y, width, height,
    opt_transitionMode) {
  var screenRect = new goog.math.Rect(
      0, 0, this.screenWidth_, this.screenHeight_);
  var sceneRect = new goog.math.Rect(
      x, y, width, height);
  this.zoomToRect(screenRect, sceneRect, opt_transitionMode);
};


/**
 * Zooms the specified portion of the scene to fit into the specified view.
 * @param {goog.math.Rect} screenRect Screen-space bounds to fit into.
 * @param {goog.math.Rect} sceneRect Scene-space bounds to fit into.
 * @param {wtf.ui.zoom.TransitionMode=} opt_transitionMode Transition mode.
 */
wtf.ui.zoom.Viewport.prototype.zoomToRect = function(screenRect, sceneRect,
    opt_transitionMode) {
  if (!screenRect.width || !screenRect.height) {
    return;
  }

  var animated = goog.isDef(opt_transitionMode) ?
      (opt_transitionMode == wtf.ui.zoom.TransitionMode.ANIMATED) : true;

  this.stop();

  if (sceneRect.width <= 0 ||
      sceneRect.height <= 0) {
    return;
  }

  var canvasWidth = screenRect.width;
  var canvasHeight = screenRect.height;

  var targetWidth = 0;
  var targetHeight = 0;
  var boundsRatio = sceneRect.width / sceneRect.height;
  if (canvasWidth >= canvasHeight) {
    targetWidth = canvasWidth;
    targetHeight = targetWidth / boundsRatio;
    if (targetHeight > canvasHeight) {
      targetHeight = canvasHeight;
      targetWidth = targetHeight * boundsRatio;
    }
  } else {
    targetHeight = canvasHeight;
    targetWidth = targetHeight * boundsRatio;
    if (targetWidth > canvasWidth) {
      targetWidth = canvasWidth;
      targetHeight = targetWidth / boundsRatio;
    }
  }

  var scaleX = canvasWidth / sceneRect.width;
  var scaleY = canvasHeight / sceneRect.height;
  var newScale = Math.min(scaleX, scaleY);
  var x = ((canvasWidth / 2) - (targetWidth / 2) - sceneRect.left * newScale);
  x = x / newScale + screenRect.left / newScale;
  var y = ((canvasHeight / 2) - (targetHeight / 2) - sceneRect.top * newScale);
  y = y / newScale + screenRect.top / newScale;

  if (animated) {
    var currentScale = this.cameraScale_.current;
    if (Math.abs(1 - (newScale / currentScale)) < 0.0001) {
      this.pan(-x, -y, opt_transitionMode);
    } else {
      var addToPanX = -x - this.cameraX_.current;
      var addToPanY = -y - this.cameraY_.current;
      var multiplier = (currentScale * newScale) / (newScale - currentScale);
      var distanceX = addToPanX * multiplier;
      var distanceY = addToPanY * multiplier;

      this.zoomCenterX_ = distanceX + canvasWidth / 2;
      this.zoomCenterY_ = distanceY + canvasHeight / 2;

      this.cameraX_.stop();
      this.cameraY_.stop();
      this.cameraScale_.animate(newScale);
    }
  } else {
    this.cameraX_.set(-x);
    this.cameraY_.set(-y);
    this.cameraScale_.set(newScale);
  }

  this.requestRender_();
};


/**
 * Pans the camera origin.
 * @param {number} x Camera origin X.
 * @param {number} y Camera origin Y.
 * @param {wtf.ui.zoom.TransitionMode=} opt_transitionMode Transition mode.
 */
wtf.ui.zoom.Viewport.prototype.pan = function(x, y, opt_transitionMode) {
  var animated = goog.isDef(opt_transitionMode) ?
      (opt_transitionMode === wtf.ui.zoom.TransitionMode.ANIMATED) : true;

  //this.stopZoom();

  if (animated) {
    if ((x != this.cameraX_.current) || (y != this.cameraY_.current)) {
      this.cameraX_.animate(x);
      this.cameraY_.animate(y);
    }
  } else {
    this.cameraX_.set(x);
    this.cameraY_.set(y);
  }

  this.requestRender_();
};


/**
 * Pans the camera origin by the given deltas.
 * @param {number} dx Delta X.
 * @param {number} dy Delta Y.
 * @param {wtf.ui.zoom.TransitionMode=} opt_transitionMode Transition mode.
 */
wtf.ui.zoom.Viewport.prototype.panDelta = function(dx, dy, opt_transitionMode) {
  var x = this.cameraX_.current + dx;
  var y = this.cameraY_.current + dy;
  this.pan(x, y, opt_transitionMode);
};


/**
 * Changes camera scale about the center of the screen.
 * @param {number} scale New camera scale.
 * @param {wtf.ui.zoom.TransitionMode=} opt_transitionMode Transition mode.
 */
wtf.ui.zoom.Viewport.prototype.zoom = function(scale, opt_transitionMode) {
  var x = this.screenWidth_ / 2;
  var y = this.screenHeight_ / 2;
  this.zoomAboutCoordinate(x, y, scale, opt_transitionMode);
};


/**
 * Changes camera scale about the center of the screen.
 * @param {number} scaleDelta Camera scale delta.
 * @param {wtf.ui.zoom.TransitionMode=} opt_transitionMode Transition mode.
 */
wtf.ui.zoom.Viewport.prototype.zoomDelta = function(
    scaleDelta, opt_transitionMode) {
  this.zoom(this.cameraScale_.current * scaleDelta, opt_transitionMode);
};


/**
 * Changes camera scale about a specified coordinate.
 * @param {number} x Point to zoom about X.
 * @param {number} y Point to zoom about Y.
 * @param {number} scale New camera scale.
 * @param {wtf.ui.zoom.TransitionMode=} opt_transitionMode Transition mode.
 */
wtf.ui.zoom.Viewport.prototype.zoomAboutCoordinate = function(x, y, scale,
    opt_transitionMode) {
  // Limit the zoom scale.
  var bestFitScale = Math.min(
      this.screenWidth_ / this.sceneWidth_,
      this.screenHeight_ / this.sceneHeight_);
  scale = Math.min(Math.max(
      scale, Math.min(bestFitScale * 0.75, this.minScale_)), this.maxScale_);

  // TODO(benvanik): Keep the scene in view after zooming in.

  var animated = goog.isDef(opt_transitionMode) ?
      (opt_transitionMode === wtf.ui.zoom.TransitionMode.ANIMATED) : true;

  //this.stopPan();

  if (animated) {
    this.cameraScale_.animate(scale);
    this.zoomCenterX_ = x + this.screenWidth_ / 2;
    this.zoomCenterY_ = y + this.screenHeight_ / 2;
  } else {
    var originX = this.cameraX_.current;
    var originY = this.cameraY_.current;
    var currentScale = this.cameraScale_.current;
    originX = originX + (x / currentScale) - (x / scale);
    originY = originY + (y / currentScale) - (y / scale);

    this.cameraX_.set(originX);
    this.cameraY_.set(originY);
    this.cameraScale_.set(scale);
  }

  this.requestRender_();
};


/**
 * Stops all animations.
 */
wtf.ui.zoom.Viewport.prototype.stop = function() {
  this.stopPan();
  this.stopZoom();
};


/**
 * Stops only pan animations.
 */
wtf.ui.zoom.Viewport.prototype.stopPan = function() {
  this.cameraX_.stop();
  this.cameraY_.stop();
};


/**
 * Stops only zoom animations.
 */
wtf.ui.zoom.Viewport.prototype.stopZoom = function() {
  this.cameraScale_.stop();
};


/**
 * Registers a new element as bound to the zoom viewport.
 * @param {!Element} el Target element.
 */
wtf.ui.zoom.Viewport.prototype.registerElement = function(el) {
  // Create wrapper.
  var zoomEl = new wtf.ui.zoom.Element(el, this);
  this.elements_.push(zoomEl);

  // Setup events.
  zoomEl.bindAllEvents();
};


/**
 * Unregisters an existing element.
 * @param {!Element} el Target element.
 */
wtf.ui.zoom.Viewport.prototype.unregisterElement = function(el) {
  // Find wrapper.
  for (var n = 0; n < this.elements_.length; n++) {
    var zoomEl = this.elements_[n];
    if (zoomEl.el == el) {
      // Destroy.
      this.elements_.splice(n, 1);
      zoomEl.unbindAllEvents();
      return;
    }
  }
};


/**
 * Sets whether or not the zoom viewport handles input events.
 * @param {boolean} value Whether to enable input events.
 */
wtf.ui.zoom.Viewport.prototype.setEnabled = function(value) {
  if (value) {
    goog.array.forEach(this.elements_, function(zoomEl) {
      zoomEl.bindAllEvents();
    });
  } else {
    goog.array.forEach(this.elements_, function(zoomEl) {
      zoomEl.unbindAllEvents();
    });
  }
};


/**
 * Sets whether or not the zoom viewport handles panning input events.
 * @param {boolean} value Whether to enable input events.
 */
wtf.ui.zoom.Viewport.prototype.setPanningEnabled = function(value) {
  if (value) {
    goog.array.forEach(this.elements_, function(zoomEl) {
      zoomEl.bindPanningEvents();
    });
  } else {
    goog.array.forEach(this.elements_, function(zoomEl) {
      zoomEl.unbindPanningEvents();
    });
  }
};


/**
 * @override
 */
wtf.ui.zoom.Viewport.prototype.mouseDown = function(x, y, button) {
  this.setCursor_('pointer');

  this.leftMouseDown_ = (button == goog.events.BrowserEvent.MouseButton.LEFT);
  this.lastMouseX_ = x;
  this.lastMouseY_ = y;
  this.mouseDelta_ = 0;

  this.stop();

  return true;
};


/**
 * @override
 */
wtf.ui.zoom.Viewport.prototype.mouseUp = function(x, y, button) {
  this.setCursor_();

  var delta = this.mouseDelta_;

  // Values are reset after mouse up to allow any other mouse handlers in the
  // chain to read them out
  wtf.timing.setImmediate(function() {
    this.leftMouseDown_ = false;
    this.lastMouseX_ = 0;
    this.lastMouseY_ = 0;
    this.mouseDelta_ = 0;
  }, this);

  if (this.leftMouseDown_ && delta < 4) {
    // var sceneXY = this.screenToScene(x, y);
    this.emitEvent(wtf.ui.zoom.Viewport.EventType.CLICK, x, y);
  }

  return true;
};


/**
 * @override
 */
wtf.ui.zoom.Viewport.prototype.mouseReset = function(x, y) {
  this.lastMouseX_ = x;
  this.lastMouseY_ = y;
  this.stop();
};


/**
 * @override
 */
wtf.ui.zoom.Viewport.prototype.mouseOut = function() {
  this.setCursor_();

  this.leftMouseDown_ = false;
  this.lastMouseX_ = 0;
  this.lastMouseY_ = 0;
  this.mouseDelta_ = 0;

  return true;
};


/**
 * @override
 */
wtf.ui.zoom.Viewport.prototype.mouseMove = function(x, y) {
  if (this.leftMouseDown_) {
    var originX = this.cameraX_.target;
    var originY = this.cameraY_.target;
    var scale = this.cameraScale_.current;
    this.mouseDelta_ += Math.abs(this.lastMouseX_ - x) +
        Math.abs(this.lastMouseY_ - y);
    var dx = (this.lastMouseX_ - x) / scale;
    var dy = (this.lastMouseY_ - y) / scale;
    if (dx || dy) {
      this.pan(originX + dx, originY + dy,
          wtf.ui.zoom.TransitionMode.IMMEDIATE);
    }
  } else {
    // TODO(benvanik): fire move with x/y
    // var sceneXY = this.screenToScene(x, y);
  }

  this.lastMouseX_ = x;
  this.lastMouseY_ = y;
  return true;
};


/**
 * @override
 */
wtf.ui.zoom.Viewport.prototype.mouseWheel = function(x, y, z) {
  var newScale = this.cameraScale_.current;
  if (z > 0) {
    newScale *= 1.7;
  } else {
    newScale /= 1.7 * 2;
  }
  this.zoomAboutCoordinate(x, y, newScale);
  return true;
};


/**
 * Sets the cursor for all elements.
 * @param {string=} opt_name Cursor name.
 * @private
 */
wtf.ui.zoom.Viewport.prototype.setCursor_ = function(opt_name) {
  for (var n = 0; n < this.elements_.length; n++) {
    this.elements_[n].setCursor(opt_name);
  }
};
