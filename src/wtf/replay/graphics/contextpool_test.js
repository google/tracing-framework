/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

goog.provide('wtf.replay.graphics.ContextPool_test');

goog.require('wtf.replay.graphics.ContextPool');


/**
 * wtf.replay.graphics.ContextPool testing.
 */
wtf.replay.graphics.ContextPool_test =
    suite('wtf.replay.graphics.ContextPool', function() {
  // Prevent this suite from running in DOM-less environments since DomHelper,
  // which ContextPool depends on, requires document to exist.
  // TODO(chizeng): Make this suite work even when the DOM doesn't exist.
  if (!window || !window.document) {
    return;
  }

  test('#ctor', function() {
    var contextPool = new wtf.replay.graphics.ContextPool();
    assert.isNotNull(contextPool);
  });
  test('#getContext', function() {
    var contextPool = new wtf.replay.graphics.ContextPool();
    var attributes = {
      alpha: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: true
    };
    var retrievedContext = contextPool.getContext('webgl', attributes);
    assert.isNotNull(retrievedContext);
    var retrievedAttributes = retrievedContext.getContextAttributes();
    assert.equal(attributes.alpha, retrievedAttributes.alpha);
    assert.equal(
        attributes.premultipliedAlpha, retrievedAttributes.premultipliedAlpha);
    assert.equal(attributes.preserveDrawingBuffer,
        retrievedAttributes.preserveDrawingBuffer);

    // Ensure that we get a canvas with the right dimensions.
    var desiredWidth = 8;
    var desiredHeight = 12;
    retrievedContext = contextPool.getContext(
        'webgl', attributes, desiredWidth, desiredHeight);
    var retrievedCanvas = retrievedContext.canvas;
    assert.equal(retrievedCanvas.width, desiredWidth);
    assert.equal(retrievedCanvas.height, desiredHeight);

    // Alter the width and height.
    retrievedCanvas.height = desiredHeight + 1;
    retrievedCanvas.width = desiredWidth + 100;

    // After releasing this context and retrieving a context with a canvas
    // with the same dimensions, the same context is retrieved.
    contextPool.releaseContext(retrievedContext);
    var anotherRetrievedContext = contextPool.getContext(
        'webgl', attributes, desiredWidth, desiredHeight);
    assert.equal(anotherRetrievedContext.canvas.width, desiredWidth);
    assert.equal(anotherRetrievedContext.canvas.height, desiredHeight);
    assert.equal(anotherRetrievedContext.canvas, retrievedCanvas);

    // If the context type is unsupported, null should be returned.
    var invalidContext = contextPool.getContext('some_invalid_ctx_type');
    assert.isNull(invalidContext);
  });
  test('#releaseContext', function() {
    var contextPool = new wtf.replay.graphics.ContextPool();
    var attributes = {
      alpha: false,
      depth: true,
      premultipliedAlpha: true
    };
    var retrievedContext = contextPool.getContext('webgl', attributes);
    contextPool.releaseContext(retrievedContext);

    // Different type and attributes, so the two contexts should differ.
    var newAttributes = {
      depth: true,
      premultipliedAlpha: false
    };
    var differentContext = contextPool.getContext('webgl', newAttributes);
    assert.notStrictEqual(retrievedContext, differentContext);

    // Same type and attributes, so the two contexts should be the exact same.
    var laterRetrievedContext = contextPool.getContext('webgl', attributes);
    assert.strictEqual(retrievedContext, laterRetrievedContext);
  });
});
