/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

goog.provide('wtf.replay.graphics.Playback_test');

goog.require('wtf.db.FrameList');
goog.require('wtf.replay.graphics.ContextPool');
goog.require('wtf.replay.graphics.Playback');
goog.require('wtf.testing');


/**
 * wtf.replay.graphics.Playback testing.
 */
wtf.replay.graphics.Playback_test =
    suite('wtf.replay.graphics.Playback', function() {
  var eventList, frameList;

  // Prevent this suite from running in DOM-less environments since DomHelper,
  // which ContextPool depends on, requires document to exist.
  // TODO(chizeng): Make this suite work even when the DOM doesn't exist.
  if (!window || !window.document) {
    return;
  }

  setup(function() {
    eventList = wtf.testing.createEventList({
      instanceEventTypes: [
        'wtf.timing#frameStart(uint32 number)',
        'wtf.timing#frameEnd(uint32 number)',
        'someInstanceEvent()',
        'wtf.webgl#createContext(uint32 handle, any attributes)'
      ],
      events: [
        [0, 'someInstanceEvent'],
        [10, 'wtf.timing#frameStart', 100],
        [15, 'wtf.webgl#createContext', 1, {}],
        [20, 'someInstanceEvent'],
        [30, 'wtf.timing#frameEnd', 100],
        [40, 'someInstanceEvent'],
        [50, 'wtf.timing#frameStart', 200],
        [60, 'someInstanceEvent'],
        [65, 'wtf.webgl#createContext', 2, {}],
        [70, 'wtf.timing#frameEnd', 200],
        [80, 'someInstanceEvent'],
        [90, 'wtf.timing#frameStart', 300],
        [100, 'someInstanceEvent'],
        [105, 'wtf.webgl#createContext', 3, {}],
        [110, 'wtf.timing#frameEnd', 300]
      ]});
    frameList = new wtf.db.FrameList(eventList);
  });

  test('#ctor', function() {
    // Check if right event is fired when playing begins.
    var playback = new wtf.replay.graphics.Playback(
        eventList, frameList, new wtf.replay.graphics.ContextPool());
    assert.isNotNull(playback);
    goog.dispose(playback);
  });

  test('#load', function() {
    var playback = new wtf.replay.graphics.Playback(
        eventList, frameList, new wtf.replay.graphics.ContextPool());

    var deferred = playback.load();
    deferred.addErrback(function(error) {
      assert.fail('Loading the playback failed: ' + String(error));
    });

    goog.dispose(playback);
  });

  test('#play', function() {
    var playback = new wtf.replay.graphics.Playback(
        eventList, frameList, new wtf.replay.graphics.ContextPool());
    // Test for right sequence of events while playing.
    var sequenceOfEvents = [
      [wtf.replay.graphics.Playback.EventType.PLAY_BEGAN,
       function() {
         assert.isTrue(playback.isPlaying());
         playback.pause(); // Pause and resume.
       }],
      [wtf.replay.graphics.Playback.EventType.PLAY_STOPPED,
       function() {
         assert.isFalse(playback.isPlaying());
         playback.play();
       }],
      [wtf.replay.graphics.Playback.EventType.PLAY_BEGAN,
       function() {
         assert.isTrue(playback.isPlaying());
       }],
      [wtf.replay.graphics.Playback.EventType.PLAY_STOPPED,
       function() {
         assert.isFalse(playback.isPlaying());
       }]
    ];

    assert.expectEventSequence(playback, sequenceOfEvents);

    var deferred = playback.load();
    deferred.addErrback(function(error) {
      assert.fail('Playback failed to load: ' + String(error));
    });
    deferred.addCallback(function() {
      playback.play();
    });

    goog.dispose(playback);

    // Attempting to play while playing should trigger an exception.
    playback = new wtf.replay.graphics.Playback(
        eventList, frameList, new wtf.replay.graphics.ContextPool());
    deferred = playback.load();
    deferred.addErrback(function(error) {
      assert.fail('Playback failed to load: ' + String(error));
    });
    deferred.addCallback(function() {
      var exceptionThrown = false;
      try {
        playback.play();
        assert.isTrue(playback.isPlaying());
        playback.play();
      } catch (exception) {
        exceptionThrown = true;
      } finally {
        assert.isTrue(exceptionThrown);
        goog.dispose(playback);
      }
    });

    // Attempting to play before resources loaded should trigger an exception.
    playback = new wtf.replay.graphics.Playback(
        eventList, frameList, new wtf.replay.graphics.ContextPool());
    var exceptionThrown = false;
    try {
      playback.play();
    } catch (exception) {
      exceptionThrown = true;
    } finally {
      goog.dispose(playback);
      assert.isTrue(exceptionThrown);
    }

    // Now, test play with an empty framelist.
    eventList = wtf.testing.createEventList({
      instanceEventTypes: [
        'wtf.timing#frameStart(uint32 number)',
        'wtf.timing#frameEnd(uint32 number)',
        'someInstanceEvent()',
        'wtf.webgl#createContext(uint32 handle, any attributes)'
      ],
      events: [
        [0, 'wtf.webgl#createContext', 1, {}],
        [10, 'someInstanceEvent'],
        [20, 'someInstanceEvent'],
        [40, 'someInstanceEvent'],
        [60, 'someInstanceEvent'],
        [80, 'someInstanceEvent']
      ]});
    frameList = new wtf.db.FrameList(eventList);
    playback = new wtf.replay.graphics.Playback(
        eventList, frameList, new wtf.replay.graphics.ContextPool());
    sequenceOfEvents = [
      [wtf.replay.graphics.Playback.EventType.PLAY_BEGAN,
       function() {
         assert.isTrue(playback.isPlaying());
       }],
      [wtf.replay.graphics.Playback.EventType.PLAY_STOPPED,
       function() {
         assert.isFalse(playback.isPlaying());
         assert.isNull(playback.getCurrentStep());
         goog.dispose(playback);
       }]
    ];

    deferred = playback.load();
    assert.expectEventSequence(playback, sequenceOfEvents);

    deferred.addErrback(function(error) {
      assert.fail('Playback failed to load: ' + String(error));
    });
    deferred.addCallback(function() {
      var currentStep = playback.getCurrentStep();
      assert.equal(currentStep.getStartEventId(), 0);
      assert.equal(currentStep.getEndEventId(), 5);
      assert.equal(currentStep.getEventIterator().getCount(), 6);
      assert.isNull(currentStep.getFrame());
      playback.play();
    });
  });

  test('#pause', function() {
    var playback = new wtf.replay.graphics.Playback(
        eventList, frameList, new wtf.replay.graphics.ContextPool());
    var sequenceOfEvents = [
      [wtf.replay.graphics.Playback.EventType.PLAY_BEGAN,
       function() {
         assert.isTrue(playback.isPlaying());
         // If we pause while playing, we should not trigger an exception.
         var exceptionThrown = false;
         try {
           playback.pause();
         } catch (exception) {
           exceptionThrown = true;
         } finally {
           assert.isFalse(exceptionThrown);
         }
         assert.isFalse(playback.isPlaying());
       }],
      [wtf.replay.graphics.Playback.EventType.PLAY_STOPPED,
       function() {
         assert.isFalse(playback.isPlaying());
         // If we paused while not playing, we trigger an exception.
         var exceptionThrown = false;
         try {
           playback.pause();
         } catch (exception) {
           exceptionThrown = true;
         } finally {
            goog.dispose(playback);
            assert.isTrue(exceptionThrown);
         }
       }]
    ];

    var deferred = playback.load();
    assert.expectEventSequence(playback, sequenceOfEvents);
    deferred.addErrback(function(error) {
      assert.fail('Playback failed to load: ' + String(error));
    });
    deferred.addCallback(function() {
      playback.play();
    });
  });

  test('#restart', function() {
    var playback = new wtf.replay.graphics.Playback(
        eventList, frameList, new wtf.replay.graphics.ContextPool());
    var sequenceOfEvents = [
      [wtf.replay.graphics.Playback.EventType.PLAY_BEGAN,
       function() {
         assert.isTrue(playback.isPlaying());
       }],
      [wtf.replay.graphics.Playback.EventType.PLAY_STOPPED,
       function() {
         assert.isFalse(playback.isPlaying());
         playback.restart(); // Playback from the end.
       }],
      [wtf.replay.graphics.Playback.EventType.PLAY_BEGAN,
       function() {
         assert.isTrue(playback.isPlaying());
       }],
      [wtf.replay.graphics.Playback.EventType.PLAY_STOPPED,
       function() {
         assert.isFalse(playback.isPlaying());
         goog.dispose(playback);
       }]
    ];

    var deferred = playback.load();
    assert.expectEventSequence(playback, sequenceOfEvents);
    deferred.addErrback(function(error) {
      assert.fail('Playback failed to load: ' + String(error));
    });
    deferred.addCallback(function() {
      playback.play();
    });
  });

  test('#seekStep', function() {
    var playback = new wtf.replay.graphics.Playback(
        eventList, frameList, new wtf.replay.graphics.ContextPool());
    var deferred = playback.load();
    deferred.addErrback(function(error) {
      assert.fail('Playback failed to load: ' + String(error));
    });
    deferred.addCallback(function() {
      // We should not get an exception if we seek validly after loading.
      var exceptionThrown = false;
      try {
        // Seek forwards to a step with a frame.
        playback.seekStep(2);
        var currentStep = playback.getCurrentStep();
        assert.equal(currentStep.getStartEventId(), 11);
        assert.isNotNull(currentStep.getFrame());

        // Now, seek backwards to a step without a frame.
        playback.seekStep(1);
        currentStep = playback.getCurrentStep();
        assert.equal(currentStep.getStartEventId(), 6);
        assert.isNotNull(currentStep.getFrame());
      } catch (exception) {
        exceptionThrown = true;
      } finally {
        goog.dispose(playback);
        assert.isFalse(exceptionThrown);
      }
    });

    // If we seek before playback is loaded, we trigger an exception.
    playback = new wtf.replay.graphics.Playback(
        eventList, frameList, new wtf.replay.graphics.ContextPool());
    var exceptionThrown = false;
    try {
      playback.seekStep(3);
    } catch (exception) {
      exceptionThrown = true;
    } finally {
      goog.dispose(playback);
      assert.isTrue(exceptionThrown);
    }
  });
});
