/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

goog.provide('wtf.replay.graphics.Playback_test');

goog.require('wtf.replay.graphics.ContextPool');
goog.require('wtf.replay.graphics.Playback');
goog.require('wtf.testing');


/**
 * wtf.replay.graphics.Playback testing.
 */
wtf.replay.graphics.Playback_test =
    suite('wtf.replay.graphics.Playback', function() {
  // Prevent this suite from running in DOM-less environments since DomHelper,
  // which ContextPool depends on, requires document to exist.
  // TODO(chizeng): Make this suite work even when the DOM doesn't exist.
  if (!window || !window.document) {
    return;
  }
  test('#ctor', function() {
    var eventList = wtf.testing.createEventList({
      instanceEventTypes: [
        'wtf.timing#frameStart(uint32 number)',
        'wtf.timing#frameEnd(uint32 number)',
        'someInstanceEvent()'
      ],
      events: [
        [0, 'someInstanceEvent'],
        [10, 'wtf.timing#frameStart', 100],
        [20, 'someInstanceEvent'],
        [30, 'wtf.timing#frameEnd', 100],
        [40, 'someInstanceEvent'],
        [50, 'wtf.timing#frameStart', 200],
        [60, 'someInstanceEvent'],
        [70, 'wtf.timing#frameEnd', 200],
        [80, 'someInstanceEvent'],
        [90, 'wtf.timing#frameStart', 300],
        [100, 'someInstanceEvent'],
        [110, 'wtf.timing#frameEnd', 300]
      ]});
    var contextPool = new wtf.replay.graphics.ContextPool();
    // Check if right event is fired when playing begins.
    // TODO(chizeng): Make 'BEGIN_PLAY' an enum or event class.
    var playback = new wtf.replay.graphics.Playback(
        eventList, contextPool);
    assert.isNotNull(playback);

    // The following test doesn't work yet.
    // var checkIfBeginPlay = assert.expectEvent(playback, 'BEGIN_PLAY');
    // playback.play();
    // checkIfBeginPlay();
  });
});
