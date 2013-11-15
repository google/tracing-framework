/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Main WTF UI.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.util.canvas');

goog.require('goog.style');


/**
 * Whether to support high-DPI displays.
 * @const
 * @type {boolean}
 */
wtf.util.canvas.ENABLE_HIGH_DPI = true;


/**
 * Checks whether <canvas> is supported.
 * @return {boolean} True if <canvas> can be used.
 */
wtf.util.canvas.isSupported = function() {
  return !!goog.global['HTMLCanvasElement'];
};


/**
 * Attempts to make the element a layer.
 * @param {!HTMLCanvasElement} canvas Canvas element.
 */
wtf.util.canvas.enableLayer = function(canvas) {
  goog.style.setStyle(canvas, 'transform', 'perspective(0)');
};


/**
 * Gets a 2D rendering context from the given canvas.
 * This will return an uninstrumented canvas.
 * @param {!HTMLCanvasElement} canvas Target canvas.
 * @return {!CanvasRenderingContext2D} Canvas 2D context.
 */
wtf.util.canvas.getContext2d = function(canvas) {
  return /** @type {!CanvasRenderingContext2D} */ (
      canvas.getContext('raw-2d') ||
      canvas.getContext('2d'));
};


/**
 * Gets the window device pixel ratio.
 * @return {number} The current windows device pixel ratio.
 */
wtf.util.canvas.getDevicePixelRatio = function() {
  if (wtf.util.canvas.ENABLE_HIGH_DPI) {
    return window['devicePixelRatio'] || 1;
  } else {
    return 1;
  }
};


/**
 * Gets the backing store ratio of the given context.
 * @param {!CanvasRenderingContext2D} ctx Canvas render context.
 * @return {number} The contexts backing store pixel ratio.
 */
wtf.util.canvas.getBackingStoreRatio = function(ctx) {
  // TODO(benvanik): optimize (in case this is called frequently)
  if (wtf.util.canvas.ENABLE_HIGH_DPI) {
    return ctx['backingStorePixelRatio'] ||
        ctx['mozBackingStorePixelRatio'] ||
        ctx['msBackingStorePixelRatio'] ||
        ctx['oBackingStorePixelRatio'] ||
        ctx['webkitBackingStorePixelRatio'] ||
        1;
  } else {
    return 1;
  }
};


/**
 * Gets the device pixel scaling ratio for the given context.
 * @param {!CanvasRenderingContext2D} ctx Canvas render context.
 * @return {number} A value that can be used to scale canvas scenes.
 */
wtf.util.canvas.getCanvasPixelRatio = function(ctx) {
  return wtf.util.canvas.getDevicePixelRatio() /
      wtf.util.canvas.getBackingStoreRatio(ctx);
};


/**
 * Reshapes the given canvas, respecting pixel scaling ratios.
 * @param {!HTMLCanvasElement} canvas Canvas.
 * @param {!CanvasRenderingContext2D} ctx Canvas render context.
 * @param {number} width New width, in pixels.
 * @param {number} height New height, in pixels.
 */
wtf.util.canvas.reshape = function(canvas, ctx, width, height) {
  var pixelRatio = wtf.util.canvas.getCanvasPixelRatio(ctx);
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  goog.style.setSize(canvas, width, height);
};


/**
 * Resets the canvas before drawing to use the latest pixel ratio information.
 * @param {!CanvasRenderingContext2D} ctx Canvas render context.
 * @param {number} pixelRatio Pixel ratio.
 */
wtf.util.canvas.reset = function(ctx, pixelRatio) {
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
};
