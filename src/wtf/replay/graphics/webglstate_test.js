/**
 * Copyright 2014 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

goog.provide('wtf.replay.graphics.WebGLState_test');

goog.require('goog.webgl');
goog.require('wtf.replay.graphics.ContextPool');
goog.require('wtf.replay.graphics.WebGLState');


/**
 * wtf.replay.graphics.WebGLState testing.
 */
wtf.replay.graphics.WebGLState_test =
    suite('wtf.replay.graphics.WebGLState', function() {
  // Only run this test if the DOM exists, since this requires a WebGL context.
  if (!window || !window.document) {
    return;
  }

  var contextPool = new wtf.replay.graphics.ContextPool();
  var context;

  setup(function() {
    // Get a WebGL context from the ContextPool.
    context = contextPool.getContext('webgl');
    assert.isNotNull(context);
  });

  teardown(function() {
    contextPool.releaseContext(context);

    goog.dispose(contextPool);
  });

  test('#ctor', function() {
    var webGLState = new wtf.replay.graphics.WebGLState(context);
    assert.isNotNull(webGLState);
  });

  test('#backup', function() {
    var webGLState = new wtf.replay.graphics.WebGLState(context);

    // TODO(scotttodd): Test more state changes?
    context.clearColor(1.0, 0.5, 0.0, 1.0);
    context.enable(goog.webgl.DEPTH_TEST);

    webGLState.backup();

    var clearColor = context.getParameter(goog.webgl.COLOR_CLEAR_VALUE);
    assert.equal(clearColor[0], 1.0);
    assert.equal(clearColor[1], 0.5);
    assert.equal(clearColor[2], 0.0);

    var depthEnabled = context.getParameter(goog.webgl.DEPTH_TEST);
    assert.isTrue(depthEnabled);
  });

  test('#restore', function() {
    var webGLState = new wtf.replay.graphics.WebGLState(context);

    // Changed state and backup.
    context.clearColor(1.0, 0.5, 0.0, 1.0);
    context.enable(goog.webgl.DEPTH_TEST);
    webGLState.backup();

    // Now change the state and test restoring.
    context.clearColor(0.0, 1.0, 1.0, 1.0);
    context.disable(goog.webgl.DEPTH_TEST);

    webGLState.restore();

    var clearColor = context.getParameter(goog.webgl.COLOR_CLEAR_VALUE);
    assert.equal(clearColor[0], 1.0);
    assert.equal(clearColor[1], 0.5);
    assert.equal(clearColor[2], 0.0);

    var depthEnabled = context.getParameter(goog.webgl.DEPTH_TEST);
    assert.isTrue(depthEnabled);
  });
});
