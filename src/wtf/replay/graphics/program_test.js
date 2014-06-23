/**
 * Copyright 2014 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

goog.provide('wtf.replay.graphics.Program_test');

goog.require('goog.webgl');
goog.require('wtf.replay.graphics.ContextPool');
goog.require('wtf.replay.graphics.Program');


/**
 * wtf.replay.graphics.Program testing.
 */
wtf.replay.graphics.Program_test =
    suite('wtf.replay.graphics.Program', function() {
  // Only run this test if the DOM exists, since this requires a WebGL context.
  if (!window || !window.document) {
    return;
  }

  var contextPool = new wtf.replay.graphics.ContextPool();
  var context, testProgram, testVertexShader, testFragmentShader;

  setup(function() {
    // Get a WebGL context from the ContextPool.
    context = contextPool.getContext('webgl');
    assert.isNotNull(context);

    // Create a test shader program.
    testProgram = context.createProgram();
    var testVertexSource = 'precision mediump float;' +
        'attribute vec3 aVertexPosition;' +
        'attribute vec4 aVertexColor;' +
        'uniform mat4 uMVMatrix;' +
        'uniform mat4 uPMatrix;' +
        'uniform float extraRed;' +
        'varying vec4 vColor;' +
        'void main(void) {' +
        '  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);' +
        '  vColor = aVertexColor;' +
        '}';
    var testFragmentSource = 'precision mediump float;' +
        'uniform float extraRed;' +
        'varying vec4 vColor;' +
        'void main(void) {' +
        '  gl_FragColor = vColor + vec4(extraRed, 0.0, 0.0, 1.0);' +
        '}';

    // Compile shader sources.
    testVertexShader = context.createShader(goog.webgl.VERTEX_SHADER);
    context.shaderSource(testVertexShader, testVertexSource);
    context.compileShader(testVertexShader);
    assert.isTrue(context.getShaderParameter(testVertexShader,
        goog.webgl.COMPILE_STATUS));

    testFragmentShader = context.createShader(goog.webgl.FRAGMENT_SHADER);
    context.shaderSource(testFragmentShader, testFragmentSource);
    context.compileShader(testFragmentShader);
    assert.isTrue(context.getShaderParameter(testFragmentShader,
        goog.webgl.COMPILE_STATUS));

    // Attach shaders and link the test program.
    context.attachShader(testProgram, testVertexShader);
    context.attachShader(testProgram, testFragmentShader);
    assert.equal(context.getAttachedShaders(testProgram).length, 2);
    context.linkProgram(testProgram);
    assert.isTrue(context.getProgramParameter(testProgram,
        goog.webgl.LINK_STATUS));
  });

  teardown(function() {
    context.detachShader(testProgram, testVertexShader);
    context.detachShader(testProgram, testFragmentShader);
    context.deleteShader(testVertexShader);
    context.deleteShader(testFragmentShader);

    context.deleteProgram(testProgram);

    contextPool.releaseContext(context);

    goog.dispose(contextPool);
  });

  test('#ctor', function() {
    var program = new wtf.replay.graphics.Program(testProgram, context);
    assert.isNotNull(program);
    goog.dispose(program);
  });

  test('#createVariantProgram', function() {
    var program = new wtf.replay.graphics.Program(testProgram, context);

    // Create a variant that does not change the vertex or fragment shaders.
    program.createVariantProgram('unchanged');
    var unchangedVariantProgram = program.getVariantProgram('unchanged');
    assert.isNotNull(unchangedVariantProgram);
    assert.isTrue(context.getProgramParameter(unchangedVariantProgram,
        goog.webgl.LINK_STATUS));

    // Create a variant that changes both the vertex and the fragment shaders.
    var customVertexSource = 'attribute vec3 aVertexPosition; ' +
        'uniform mat4 uMVMatrix;' +
        'uniform mat4 uPMatrix;' +
        'void main(void) {' +
        '  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);' +
        '}';
    var customFragmentSource = 'precision mediump float;' +
        'uniform vec4 customColor;' +
        'void main(void) { ' +
        'gl_FragColor = customColor;' +
        '}';
    program.createVariantProgram('custom', customVertexSource,
        customFragmentSource);
    var customVariantProgram = program.getVariantProgram('custom');
    assert.isNotNull(customVariantProgram);
    assert.isTrue(context.getProgramParameter(customVariantProgram,
        goog.webgl.LINK_STATUS));

    // Confirm that the uniform 'customColor' is present.
    var uniformLocation = context.getUniformLocation(customVariantProgram,
        'customColor');
    assert.isNotNull(uniformLocation);

    goog.dispose(program);
  });

  test('#deleteVariants', function() {
    var program = new wtf.replay.graphics.Program(testProgram, context);

    program.createVariantProgram('unchanged');
    var unchangedVariantProgram = program.getVariantProgram('unchanged');
    assert.isNotNull(unchangedVariantProgram);
    assert.isTrue(context.getProgramParameter(unchangedVariantProgram,
        goog.webgl.LINK_STATUS));

    program.deleteVariants();

    // Attempting to retrieve a deleted variant should trigger an exception.
    var exceptionThrown = false;
    try {
      program.getVariantProgram('unchanged');
    } catch (exception) {
      exceptionThrown = true;
    } finally {
      assert.isTrue(exceptionThrown);
    }

    // The variant program should no longer be a program.
    assert.isFalse(context.isProgram(unchangedVariantProgram));

    goog.dispose(program);
  });

  test('#drawWithVariant', function() {
    var program = new wtf.replay.graphics.Program(testProgram, context);

    var drawFunction = goog.bind(function() {});

    // Attempting to draw with an unknown name should trigger an exception.
    var exceptionThrown = false;
    try {
      program.drawWithVariant(drawFunction, 'name_that_does_not_exist');
    } catch (exception) {
      exceptionThrown = true;
    } finally {
      assert.isTrue(exceptionThrown);
    }

    // Create a sample variant program (subtract instead of add extraRed).
    var customFragmentSource = 'precision mediump float;' +
        'varying vec4 vColor;' +
        'uniform float extraRed;' +
        'void main(void) {' +
        '  gl_FragColor = vColor - vec4(extraRed, 0.0, 0.0, 1.0);' +
        '}';
    program.createVariantProgram('custom', '', customFragmentSource);
    var customVariantProgram = program.getVariantProgram('custom');

    // Set a uniform in the original program.
    context.useProgram(testProgram);
    var uniformLocationOriginal = context.getUniformLocation(testProgram,
        'extraRed');
    var originalUniformValue = 0.5;
    context.uniform1f(uniformLocationOriginal, originalUniformValue);

    program.drawWithVariant(drawFunction, 'custom');

    // After drawWithVariant, the original program should have been used.
    var currentProgram = context.getParameter(goog.webgl.CURRENT_PROGRAM);
    assert.equal(testProgram, currentProgram);

    // After drawWithVariant, the uniform in the variant should be synced.
    context.useProgram(customVariantProgram);
    var uniformLocationVariant = context.getUniformLocation(
        customVariantProgram, 'extraRed');
    var uniformValue = context.getUniform(customVariantProgram,
        uniformLocationVariant);
    assert.equal(uniformValue, originalUniformValue);

    goog.dispose(program);
  });
});
