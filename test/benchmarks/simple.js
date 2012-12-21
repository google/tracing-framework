/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Benchmark file.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


benchmark.register('simple', function() {
  var scope = wtf.trace.enterScope();
  //
  wtf.trace.leaveScope(scope);
});
