/**
 * Copyright 2014 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

goog.provide('wtf.replay.graphics.OffscreenSurface_test');

goog.require('goog.webgl');
goog.require('wtf.replay.graphics.ContextPool');
goog.require('wtf.replay.graphics.OffscreenSurface');


/**
 * wtf.replay.graphics.OffscreenSurface testing.
 */
wtf.replay.graphics.OffscreenSurface_test =
    suite('wtf.replay.graphics.OffscreenSurface', function() {
  // Only run this test if the DOM exists, since this requires a WebGL context.
  if (!window || !window.document) {
    return;
  }

  var contextPool = new wtf.replay.graphics.ContextPool();
  var context;

  setup(function() {
    assert.isNotNull(contextPool);
    // Get a WebGL context from the ContextPool, with width and height of 1.
    context = contextPool.getContext('webgl', undefined, 1, 1);
    assert.isNotNull(context);
  });

  teardown(function() {
    contextPool.releaseContext(context);

    goog.dispose(contextPool);
  });

  /**
   * Gets data for a single pixel and checks it against provided RGB values.
   * @param {Uint8Array} pixelContents Allocated space to store readPixel data.
   * @param {number} r Red value [0, 255]
   * @param {number} g Green value [0, 255]
   * @param {number} b Blue value [0, 255]
   */
  var checkColor = function(pixelContents, r, g, b) {
    context.readPixels(0, 0, 1, 1, goog.webgl.RGBA, goog.webgl.UNSIGNED_BYTE,
        pixelContents);
    assert.equal(pixelContents[0], r);
    assert.equal(pixelContents[1], g);
    assert.equal(pixelContents[2], b);
  };

  test('#ctor', function() {
    var offscreenSurface = new wtf.replay.graphics.OffscreenSurface(context,
        1, 1);
    assert.isNotNull(offscreenSurface);
    goog.dispose(offscreenSurface);
  });

  test('#captureTexture', function() {
    var offscreenSurface = new wtf.replay.graphics.OffscreenSurface(context,
        1, 1);
    var pixelContents = new Uint8Array(4);

    // Write red into the framebuffer.
    context.clearColor(1.0, 0.0, 0.0, 1.0);
    context.clear(goog.webgl.COLOR_BUFFER_BIT);
    checkColor(pixelContents, 255, 0, 0);

    // Call captureTexture and ensure that red is still in the framebuffer.
    offscreenSurface.captureTexture();
    checkColor(pixelContents, 255, 0, 0);

    goog.dispose(offscreenSurface);
  });

  test('#drawTexture', function() {
    var offscreenSurface = new wtf.replay.graphics.OffscreenSurface(context,
        1, 1);
    var pixelContents = new Uint8Array(4);

    // Write red into the framebuffer.
    context.clearColor(1.0, 0.0, 0.0, 1.0);
    context.clear(goog.webgl.COLOR_BUFFER_BIT);
    checkColor(pixelContents, 255, 0, 0);

    offscreenSurface.captureTexture();

    // Change the framebuffer contents to blue.
    context.clearColor(0.0, 0.0, 1.0, 1.0);
    context.clear(goog.webgl.COLOR_BUFFER_BIT);
    checkColor(pixelContents, 0, 0, 255);

    // Call drawTexture and ensure that red is once again in the framebuffer.
    offscreenSurface.drawTexture();
    checkColor(pixelContents, 255, 0, 0);

    goog.dispose(offscreenSurface);
  });

  test('#clear', function() {
    var offscreenSurface = new wtf.replay.graphics.OffscreenSurface(context,
        1, 1);
    var pixelContents = new Uint8Array(4);

    // First, write red into the framebuffer.
    context.clearColor(1.0, 0.0, 0.0, 1.0);
    context.clear(goog.webgl.COLOR_BUFFER_BIT);
    checkColor(pixelContents, 255, 0, 0);

    // Capture, clear, and draw, then ensure that black is in the framebuffer.
    offscreenSurface.captureTexture();
    offscreenSurface.clear([0.0, 0.0, 0.0, 1.0]);
    offscreenSurface.drawTexture();
    checkColor(pixelContents, 0, 0, 0);

    // Clear the offscreenSurface to green and test that it draws green.
    offscreenSurface.clear([0.0, 1.0, 0.0, 1.0]);
    offscreenSurface.drawTexture();
    checkColor(pixelContents, 0, 255, 0);

    goog.dispose(offscreenSurface);
  });

  test('framebufferRendering', function() {
    var offscreenSurface = new wtf.replay.graphics.OffscreenSurface(context,
        1, 1);
    var pixelContents = new Uint8Array(4);

    // Write red into the default framebuffer.
    context.clearColor(1.0, 0.0, 0.0, 1.0);
    context.clear(goog.webgl.COLOR_BUFFER_BIT);
    checkColor(pixelContents, 255, 0, 0);

    // Write blue into the offscreen framebuffer.
    offscreenSurface.bindFramebuffer();
    context.clearColor(0.0, 0.0, 1.0, 1.0);
    context.clear(goog.webgl.COLOR_BUFFER_BIT);

    // Return to the default framebuffer and confirm that it is still red.
    context.bindFramebuffer(goog.webgl.FRAMEBUFFER, null);
    checkColor(pixelContents, 255, 0, 0);

    // Call drawTexture and ensure that blue is now in the framebuffer.
    offscreenSurface.drawTexture();
    checkColor(pixelContents, 0, 0, 255);

    goog.dispose(offscreenSurface);
  });
});
