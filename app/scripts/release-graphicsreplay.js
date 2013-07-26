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

// Get the trace URL.
var search = window.location.search;
if (!search || !search.length || search.indexOf('?url=') != 0) {
  throw new Error(
      'No trace URL specified. Specify the trace URL after \'?url=\'.');
}
var traceUrl = search.substr(5);

var parentElement = document.getElementById('graphicsReplayStagingArea');
wtf.replay.graphics.setupWithUrl(traceUrl, parentElement);
