/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

goog.provide('wtf.db.FrameList_test');

goog.require('wtf.db.EventList');
goog.require('wtf.db.EventTypeTable');
goog.require('wtf.db.FrameList');
goog.require('wtf.testing');


/**
 * wtf.db.FrameList testing.
 */
wtf.db.FrameList_test = suite('wtf.db.FrameList', function() {
  test('#ctor', function() {
    var eventTypeTable = new wtf.db.EventTypeTable();
    var eventList = new wtf.db.EventList(eventTypeTable);

    // Creation succeeds.
    var frameList = new wtf.db.FrameList(eventList);
    assert.equal(frameList.getCount(), 0);
    assert.lengthOf(frameList.getAllFrames(), 0);
    assert.isNull(frameList.getFrame(0));

    // Should unregister itself when disposed.
    goog.dispose(frameList);
    assert.lengthOf(eventList.ancillaryLists_, 0);
  });

  test('rebuildEmpty', function() {
    var eventTypeTable = new wtf.db.EventTypeTable();
    var eventList = new wtf.db.EventList(eventTypeTable);
    var frameList = new wtf.db.FrameList(eventList);

    assert.equal(frameList.getCount(), 0);

    wtf.testing.insertEvents(eventList, {
      instanceEventTypes: [
        'someInstanceEvent()'
      ],
      events: [
        [0, 'someInstanceEvent'],
        [20, 'someInstanceEvent'],
        [40, 'someInstanceEvent'],
        [60, 'someInstanceEvent'],
        [80, 'someInstanceEvent']
      ]
    });

    assert.equal(frameList.getCount(), 0);
    assert.lengthOf(frameList.getAllFrames(), 0);
  });

  test('rebuildEvents', function() {
    var eventTypeTable = new wtf.db.EventTypeTable();
    var eventList = new wtf.db.EventList(eventTypeTable);
    var frameList = new wtf.db.FrameList(eventList);

    assert.equal(frameList.getCount(), 0);

    wtf.testing.insertEvents(eventList, {
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
        [80, 'someInstanceEvent']
      ]
    });

    assert.equal(frameList.getCount(), 2);
    assert.lengthOf(frameList.getAllFrames(), 2);

    var frame100 = frameList.getFrame(100);
    assert.isNotNull(frame100);
    assert.equal(frame100.getNumber(), 100);
    assert.equal(frame100.getTime(), 10);
    assert.equal(frame100.getEndTime(), 30);
    assert.equal(frame100.getDuration(), 20);

    var frame200 = frameList.getFrame(200);
    assert.isNotNull(frame200);
    assert.equal(frame200.getNumber(), 200);
    assert.equal(frame200.getTime(), 50);
    assert.equal(frame200.getEndTime(), 70);
    assert.equal(frame200.getDuration(), 20);
  });

  test('rebuildIncremental', function() {
    var eventTypeTable = new wtf.db.EventTypeTable();
    var eventList = new wtf.db.EventList(eventTypeTable);
    var frameList = new wtf.db.FrameList(eventList);

    assert.equal(frameList.getCount(), 0);

    wtf.testing.insertEvents(eventList, {
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
        [40, 'someInstanceEvent']
      ]
    });

    assert.equal(frameList.getCount(), 1);
    assert.lengthOf(frameList.getAllFrames(), 1);

    wtf.testing.insertEvents(eventList, {
      instanceEventTypes: [
        'wtf.timing#frameStart(uint32 number)',
        'wtf.timing#frameEnd(uint32 number)',
        'someInstanceEvent()'
      ],
      events: [
        [50, 'wtf.timing#frameStart', 200],
        [60, 'someInstanceEvent'],
        [70, 'wtf.timing#frameEnd', 200],
        [80, 'someInstanceEvent']
      ]
    });

    assert.equal(frameList.getCount(), 2);
    assert.lengthOf(frameList.getAllFrames(), 2);
  });

  test('frames', function() {
    var eventTypeTable = new wtf.db.EventTypeTable();
    var eventList = new wtf.db.EventList(eventTypeTable);
    var frameList = new wtf.db.FrameList(eventList);
    wtf.testing.insertEvents(eventList, {
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
        [110, 'wtf.timing#frameEnd', 300],
        [120, 'someInstanceEvent'],
        [130, 'wtf.timing#frameStart', 400],
        [140, 'someInstanceEvent'],
        [150, 'wtf.timing#frameEnd', 400],
        [160, 'someInstanceEvent']
      ]
    });

    var frame100 = frameList.getFrame(100);
    assert.isNotNull(frame100);
    assert.equal(frame100.getNumber(), 100);
    var frame200 = frameList.getFrame(200);
    assert.isNotNull(frame200);
    assert.equal(frame200.getNumber(), 200);
    var frame300 = frameList.getFrame(300);
    assert.isNotNull(frame300);
    assert.equal(frame300.getNumber(), 300);
    var frame400 = frameList.getFrame(400);
    assert.isNotNull(frame400);
    assert.equal(frame400.getNumber(), 400);

    assert.equal(frameList.getCount(), 4);
    assert.lengthOf(frameList.getAllFrames(), 4);
    assert.deepEqual(
        frameList.getAllFrames(), [frame100, frame200, frame300, frame400]);

    assert.isNull(frameList.getPreviousFrame(frame100));
    assert.equal(frameList.getNextFrame(frame100), frame200);

    assert.equal(frameList.getPreviousFrame(frame200), frame100);
    assert.equal(frameList.getNextFrame(frame200), frame300);

    assert.equal(frameList.getPreviousFrame(frame400), frame300);
    assert.isNull(frameList.getNextFrame(frame400));

    assert.isNull(frameList.getFrameAtTime(0));
    assert.isNull(frameList.getFrameAtTime(151));
    assert.equal(frameList.getFrameAtTime(10), frame100);
    assert.equal(frameList.getFrameAtTime(11), frame100);
    assert.equal(frameList.getFrameAtTime(20), frame100);
    assert.equal(frameList.getFrameAtTime(30), frame100);
    assert.equal(frameList.getFrameAtTime(150), frame400);

    assert.deepEqual(frameList.getIntraFrameAtTime(0), [null, frame100]);
    assert.deepEqual(frameList.getIntraFrameAtTime(40), [frame100, frame200]);
    assert.deepEqual(frameList.getIntraFrameAtTime(151), [frame400, null]);

    var intersecting = [];
    frameList.forEachIntersecting(0, 1000, function(frame) {
      intersecting.push(frame);
    });
    assert.lengthOf(intersecting, 4);

    intersecting = [];
    frameList.forEachIntersecting(40, 80, function(frame) {
      intersecting.push(frame);
    });
    assert.deepEqual(intersecting, [frame200]);

    intersecting = [];
    frameList.forEachIntersecting(100, 150, function(frame) {
      intersecting.push(frame);
    });
    assert.deepEqual(intersecting, [frame300, frame400]);
  });

  test('framesEmpty', function() {
    var eventTypeTable = new wtf.db.EventTypeTable();
    var eventList = new wtf.db.EventList(eventTypeTable);
    var frameList = new wtf.db.FrameList(eventList);
    wtf.testing.insertEvents(eventList, {
      instanceEventTypes: [
        'someInstanceEvent()'
      ],
      events: [
        [0, 'someInstanceEvent'],
        [20, 'someInstanceEvent'],
        [40, 'someInstanceEvent'],
        [60, 'someInstanceEvent'],
        [80, 'someInstanceEvent'],
        [100, 'someInstanceEvent'],
        [120, 'someInstanceEvent'],
        [140, 'someInstanceEvent'],
        [160, 'someInstanceEvent']
      ]
    });

    assert.equal(frameList.getCount(), 0);
    assert.lengthOf(frameList.getAllFrames(), 0);

    assert.isNull(frameList.getFrameAtTime(0));
    assert.isNull(frameList.getFrameAtTime(151));

    assert.deepEqual(frameList.getIntraFrameAtTime(0), [null, null]);
    assert.deepEqual(frameList.getIntraFrameAtTime(151), [null, null]);

    frameList.forEachIntersecting(0, 1000, function(frame) {
      assert.fail('Should be nothing intersecting!');
    });
  });
});
