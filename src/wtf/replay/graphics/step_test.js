/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

goog.provide('wtf.replay.graphics.Step_test');

goog.require('wtf.db.Frame');
goog.require('wtf.replay.graphics.Step');
goog.require('wtf.testing');


/**
 * wtf.replay.graphics.Step testing.
 */
wtf.replay.graphics.Step_test = suite('wtf.replay.graphics.Step', function() {
  test('#ctor', function() {
    // Create a basic event list.
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
    var stepWithFrame = new wtf.replay.graphics.Step(eventList, 1, 3,
        new wtf.db.Frame(1));
    var stepWithNoFrame = new wtf.replay.graphics.Step(eventList, 5, 10);

    var eventItr = stepWithFrame.getEventIterator();
    assert.isNotNull(eventItr);
    assert.equal(eventItr.getId(), 1);
    assert.equal(eventItr.getName(), 'wtf.timing#frameStart');
    assert.equal(eventItr.getCount(), 3);
    assert.equal(stepWithFrame.getStartEventId(), 1);
    assert.equal(stepWithFrame.getEndEventId(), 3);

    var frame = stepWithFrame.getFrame();
    assert.isNotNull(frame);
    assert.equal(frame.getNumber(), 1);
    assert.isNull(stepWithNoFrame.getFrame());
  });
});
