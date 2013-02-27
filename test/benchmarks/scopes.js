/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Benchmark file.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


benchmark.register('enterScope', function() {
  var scope = wtf.trace.enterScope();
  //
  wtf.trace.leaveScope(scope);
});


benchmark.register('enterScopeNamed', function() {
  var scope = wtf.trace.enterScope('hello');
  //
  wtf.trace.leaveScope(scope);
});


var customScopeEvent = wtf.trace.events.createScope('customScope()');
benchmark.register('customScope', function() {
  var scope = customScopeEvent();
  //
  wtf.trace.leaveScope(scope);
});
