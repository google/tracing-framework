/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Release mode graphics replay runner.
 *
 * @author chizeng@google.com (Chi Zeng)
 */


var parentElement = document.getElementById('graphicsReplayStagingArea');
wtf.replay.graphics.setupStandalone(
    '../private/traces/vectortown-fun.wtf-trace', parentElement);
