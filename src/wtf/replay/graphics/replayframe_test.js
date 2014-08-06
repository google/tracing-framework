/**
 * Copyright 2014 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

goog.provide('wtf.replay.graphics.ReplayFrame_test');

goog.require('wtf.replay.graphics.ReplayFrame');


/**
 * wtf.replay.graphics.ReplayFrame testing.
 */
wtf.replay.graphics.ReplayFrame_test =
    suite('wtf.replay.graphics.ReplayFrame', function() {
  test('#ctor', function() {
    var replayFrame = new wtf.replay.graphics.ReplayFrame(0);
    assert.isNotNull(replayFrame);
  });

  test('#stopTiming', function() {
    var replayFrame = new wtf.replay.graphics.ReplayFrame(0);

    assert.equal(replayFrame.getCount(), 0);

    replayFrame.startTiming();
    replayFrame.stopTiming();
    assert.equal(replayFrame.getCount(), 1);

    // Stopping timing without a matching start should not add a recording.
    replayFrame.stopTiming();
    assert.equal(replayFrame.getCount(), 1);

    replayFrame.startTiming();
    replayFrame.stopTiming();
    assert.equal(replayFrame.getCount(), 2);
  });

  test('#cancelTiming', function() {
    var replayFrame = new wtf.replay.graphics.ReplayFrame(0);

    assert.equal(replayFrame.getCount(), 0);

    replayFrame.startTiming();
    replayFrame.cancelTiming();

    // Stopping timing without a matching start should not add a recording.
    replayFrame.stopTiming();
    assert.equal(replayFrame.getCount(), 0);

    replayFrame.startNext();
    assert.equal(replayFrame.getCount(), 0);
  });

  test('#getAverageDuration', function() {
    var replayFrame = new wtf.replay.graphics.ReplayFrame(0);

    assert.isFalse(replayFrame.getAverageDuration() > 0);

    replayFrame.startTiming();
    replayFrame.stopTiming();

    assert.isTrue(replayFrame.getAverageDuration() > 0);
  });

  test('#getAverageBetween', function() {
    var replayFrame = new wtf.replay.graphics.ReplayFrame(0);

    assert.isFalse(replayFrame.getAverageBetween() > 0);

    replayFrame.startTiming();
    replayFrame.stopTiming();
    replayFrame.startNext();

    assert.isTrue(replayFrame.getAverageBetween() > 0);
  });
});
