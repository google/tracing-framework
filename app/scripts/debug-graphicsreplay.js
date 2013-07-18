/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Debug mode runner for graphics replay.
 *
 * @author chizeng@google.com (Chi Zeng)
 */


debugImportAndExecute([
  'wtf.replay.graphics'
], function() {
  var parentElement = document.getElementById('graphicsReplayStagingArea');
  wtf.replay.graphics.setupStandalone(
      '../private/traces/zoomInToGasworks.wtf-trace', parentElement);
});
