/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

goog.provide('wtf.replay.graphics.ContextPool_test');

goog.require('goog.dom');
goog.require('wtf.replay.graphics.ContextPool');


/**
 * wtf.replay.graphics.ContextPool testing.
 */
wtf.replay.graphics.ContextPool_test =
    suite('wtf.replay.graphics.ContextPool', function() {
  test('#ctor', function() {
    if (window && window.document) {
      var contextPool = new wtf.replay.graphics.ContextPool();
      assert.isNotNull(contextPool);
    }
  });
  test('#getContext', function() {
    if (window && window.document) {
      var contextPool = new wtf.replay.graphics.ContextPool();
      var attributes = {
          alpha : true,
          depth : true,
          premultipliedAlpha : true
      };
      var retrievedContext = contextPool.getContext('webgl', attributes);
      assert.isNotNull(retrievedContext);
      var retrievedAttributes = retrievedContext.getContextAttributes();
      assert.equal(attributes.alpha, retrievedAttributes.alpha);
      assert.equal(attributes.depth, retrievedAttributes.depth);
      assert.equal(attributes.premultipliedAlpha,
          retrievedAttributes.premultipliedAlpha);
    }
  });
  test('#releaseContext', function() {
    if (window && window.document) {
      var contextPool = new wtf.replay.graphics.ContextPool();
      var attributes = {
          alpha : true,
          depth : true,
          premultipliedAlpha : true
      };
      var retrievedContext = contextPool.getContext('webgl', attributes);
      contextPool.releaseContext(retrievedContext);
      var laterRetrievedContext = contextPool.getContext('webgl', attributes);
      assert.deepEqual(retrievedContext.getContextAttributes(),
          laterRetrievedContext.getContextAttributes());
    }
  });
});
