/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

goog.provide('wtf.db.TimeRangeList_test');

goog.require('wtf.db.EventList');
goog.require('wtf.db.EventTypeTable');
goog.require('wtf.db.TimeRangeList');
goog.require('wtf.testing');


/**
 * wtf.db.TimeRangeList testing.
 */
wtf.db.TimeRangeList_test = suite('wtf.db.TimeRangeList', function() {
  test('#ctor', function() {
    var eventTypeTable = new wtf.db.EventTypeTable();
    var eventList = new wtf.db.EventList(eventTypeTable);

    // Creation succeeds.
    var timeRangeList = new wtf.db.TimeRangeList(eventList);
    assert.equal(timeRangeList.getMaximumLevel(), 0);
    assert.equal(timeRangeList.getCount(), 0);
    assert.lengthOf(timeRangeList.getAllTimeRanges(), 0);

    // Should unregister itself when disposed.
    goog.dispose(timeRangeList);
    assert.lengthOf(eventList.ancillaryLists_, 0);
  });

  test('rebuildEmpty', function() {
    var eventTypeTable = new wtf.db.EventTypeTable();
    var eventList = new wtf.db.EventList(eventTypeTable);
    var timeRangeList = new wtf.db.TimeRangeList(eventList);

    assert.equal(timeRangeList.getCount(), 0);

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

    assert.equal(timeRangeList.getCount(), 0);
    assert.lengthOf(timeRangeList.getAllTimeRanges(), 0);
  });

  test('rebuildEvents', function() {
    var eventTypeTable = new wtf.db.EventTypeTable();
    var eventList = new wtf.db.EventList(eventTypeTable);
    var timeRangeList = new wtf.db.TimeRangeList(eventList);

    assert.equal(timeRangeList.getCount(), 0);

    wtf.testing.insertEvents(eventList, {
      instanceEventTypes: [
        'wtf.timeRange#begin(uint32 id, ascii name, any value)',
        'wtf.timeRange#end(uint32 id)',
        'someInstanceEvent()'
      ],
      events: [
        [0, 'someInstanceEvent'],
        [10, 'wtf.timeRange#begin', 100, 'timeRange100', 'foo'],
        [20, 'someInstanceEvent'],
        [30, 'wtf.timeRange#end', 100],
        [40, 'someInstanceEvent'],
        [50, 'someInstanceEvent'],
        [60, 'wtf.timeRange#begin', 200, 'timeRange200', 'bar'],
        [70, 'someInstanceEvent'],
        [80, 'wtf.timeRange#end', 200],
        [90, 'someInstanceEvent']
      ]
    });

    assert.equal(timeRangeList.getCount(), 2);
    assert.lengthOf(timeRangeList.getAllTimeRanges(), 2);

    var ranges = timeRangeList.getTimeRangesAtTime(20);
    assert.lengthOf(ranges, 1);
    var timeRange100 = ranges[0];
    assert.isNotNull(timeRange100);
    assert.equal(timeRange100.getName(), 'timeRange100');
    assert.equal(timeRange100.getValue(), 'foo');
    assert.equal(timeRange100.getTime(), 10);
    assert.equal(timeRange100.getEndTime(), 30);
    assert.equal(timeRange100.getDuration(), 20);
    assert.equal(timeRange100.getLevel(), 0);
    assert.equal(timeRange100.getOverlap(), 0);

    ranges = timeRangeList.getTimeRangesAtTime(70);
    assert.lengthOf(ranges, 1);
    var timeRange200 = ranges[0];
    assert.isNotNull(timeRange200);
    assert.equal(timeRange200.getName(), 'timeRange200');
    assert.equal(timeRange200.getValue(), 'bar');
    assert.equal(timeRange200.getTime(), 60);
    assert.equal(timeRange200.getEndTime(), 80);
    assert.equal(timeRange200.getDuration(), 20);
    assert.equal(timeRange200.getLevel(), 0);
    assert.equal(timeRange200.getOverlap(), 0);

    assert.deepEqual(
        timeRangeList.getAllTimeRanges(), [timeRange100, timeRange200]);
  });

  test('rebuildIncremental', function() {
    var eventTypeTable = new wtf.db.EventTypeTable();
    var eventList = new wtf.db.EventList(eventTypeTable);
    var timeRangeList = new wtf.db.TimeRangeList(eventList);

    assert.equal(timeRangeList.getCount(), 0);

    wtf.testing.insertEvents(eventList, {
      instanceEventTypes: [
        'wtf.timeRange#begin(uint32 id, ascii name, any value)',
        'wtf.timeRange#end(uint32 id)',
        'someInstanceEvent()'
      ],
      events: [
        [0, 'someInstanceEvent'],
        [10, 'wtf.timeRange#begin', 100, 'timeRange100', null],
        [20, 'someInstanceEvent']
      ]
    });

    assert.equal(timeRangeList.getCount(), 1);
    assert.lengthOf(timeRangeList.getAllTimeRanges(), 1);

    wtf.testing.insertEvents(eventList, {
      instanceEventTypes: [
        'wtf.timeRange#begin(uint32 id, ascii name, any value)',
        'wtf.timeRange#end(uint32 id)',
        'someInstanceEvent()'
      ],
      events: [
        [30, 'wtf.timeRange#end', 100],
        [40, 'someInstanceEvent']
      ]
    });

    assert.equal(timeRangeList.getCount(), 1);
    assert.lengthOf(timeRangeList.getAllTimeRanges(), 1);
  });

  test('timeRanges', function() {
    var eventTypeTable = new wtf.db.EventTypeTable();
    var eventList = new wtf.db.EventList(eventTypeTable);
    var timeRangeList = new wtf.db.TimeRangeList(eventList);
    wtf.testing.insertEvents(eventList, {
      instanceEventTypes: [
        'wtf.timeRange#begin(uint32 id, ascii name, any value)',
        'wtf.timeRange#end(uint32 id)',
        'someInstanceEvent()'
      ],
      events: [
        [0, 'someInstanceEvent'],
        [5, 'wtf.timeRange#begin', 90, 'timeRangeRoot', null],
        [10, 'wtf.timeRange#begin', 100, 'timeRange100', 'foo'],
        [20, 'someInstanceEvent'],
        [30, 'wtf.timeRange#end', 100],
        [40, 'someInstanceEvent'],
        [50, 'someInstanceEvent'],
        [60, 'wtf.timeRange#begin', 200, 'timeRange200', 'bar'],
        [70, 'someInstanceEvent'],
        [80, 'wtf.timeRange#end', 200],
        [90, 'someInstanceEvent'],
        [95, 'wtf.timeRange#end', 90]
      ]
    });

    var timeRangeRoot = timeRangeList.getTimeRangesAtTime(5)[0];
    assert.isNotNull(timeRangeRoot);
    assert.equal(timeRangeRoot.getName(), 'timeRangeRoot');
    assert.equal(timeRangeList.getTimeRange(90), timeRangeRoot);
    var timeRange100 = timeRangeList.getTimeRangesAtTime(10)[1];
    assert.isNotNull(timeRange100);
    assert.equal(timeRange100.getName(), 'timeRange100');
    assert.equal(timeRange100.getLevel(), 1);
    assert.equal(timeRange100.getOverlap(), 1);
    assert.equal(timeRangeList.getTimeRange(100), timeRange100);
    var timeRange200 = timeRangeList.getTimeRangesAtTime(60)[1];
    assert.isNotNull(timeRange200);
    assert.equal(timeRange200.getName(), 'timeRange200');
    assert.equal(timeRange200.getLevel(), 1);
    assert.equal(timeRange200.getOverlap(), 1);
    assert.equal(timeRangeList.getTimeRange(200), timeRange200);

    assert.equal(timeRangeList.getCount(), 3);
    assert.lengthOf(timeRangeList.getAllTimeRanges(), 3);
    assert.deepEqual(
        timeRangeList.getAllTimeRanges(),
        [timeRangeRoot, timeRange100, timeRange200]);

    assert.lengthOf(timeRangeList.getTimeRangesAtTime(0), 0);
    assert.lengthOf(timeRangeList.getTimeRangesAtTime(96), 0);
    assert.deepEqual(timeRangeList.getTimeRangesAtTime(5), [timeRangeRoot]);
    assert.deepEqual(timeRangeList.getTimeRangesAtTime(6), [timeRangeRoot]);
    assert.deepEqual(timeRangeList.getTimeRangesAtTime(95), [timeRangeRoot]);
    assert.deepEqual(
        timeRangeList.getTimeRangesAtTime(10), [timeRangeRoot, timeRange100]);
    assert.deepEqual(
        timeRangeList.getTimeRangesAtTime(30), [timeRangeRoot, timeRange100]);
    assert.deepEqual(
        timeRangeList.getTimeRangesAtTime(31), [timeRangeRoot]);
    assert.deepEqual(
        timeRangeList.getTimeRangesAtTime(60), [timeRangeRoot, timeRange200]);
    assert.deepEqual(
        timeRangeList.getTimeRangesAtTime(70), [timeRangeRoot, timeRange200]);
    assert.deepEqual(
        timeRangeList.getTimeRangesAtTime(80), [timeRangeRoot, timeRange200]);

    var intersecting = [];
    timeRangeList.forEachIntersecting(0, 1000, function(timeRange) {
      intersecting.push(timeRange);
    });
    assert.deepEqual(intersecting, [timeRangeRoot, timeRange100, timeRange200]);

    intersecting = [];
    timeRangeList.forEachIntersecting(0, 4, function(timeRange) {
      intersecting.push(timeRange);
    });
    assert.lengthOf(intersecting, 0);

    intersecting = [];
    timeRangeList.forEachIntersecting(5, 10, function(timeRange) {
      intersecting.push(timeRange);
    });
    assert.deepEqual(intersecting, [timeRangeRoot, timeRange100]);

    intersecting = [];
    timeRangeList.forEachIntersecting(70, 150, function(timeRange) {
      intersecting.push(timeRange);
    });
    assert.deepEqual(intersecting, [timeRangeRoot, timeRange200]);
  });

  test('timeRangesEmpty', function() {
    var eventTypeTable = new wtf.db.EventTypeTable();
    var eventList = new wtf.db.EventList(eventTypeTable);
    var timeRangeList = new wtf.db.TimeRangeList(eventList);
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

    assert.equal(timeRangeList.getCount(), 0);
    assert.lengthOf(timeRangeList.getAllTimeRanges(), 0);

    assert.lengthOf(timeRangeList.getTimeRangesAtTime(0), 0);

    timeRangeList.forEachIntersecting(0, 1000, function(timeRange) {
      assert.fail('Should be nothing intersecting!');
    });
  });

  test('timeRangeOverlap', function() {
    var eventTypeTable = new wtf.db.EventTypeTable();
    var eventList = new wtf.db.EventList(eventTypeTable);
    var timeRangeList = new wtf.db.TimeRangeList(eventList);
    // 0123456789
    // A-------A
    //  B-BD-D
    //   C---C
    //      E---E
    wtf.testing.insertEvents(eventList, {
      instanceEventTypes: [
        'wtf.timeRange#begin(uint32 id, ascii name, any value)',
        'wtf.timeRange#end(uint32 id)'
      ],
      events: [
        [0, 'wtf.timeRange#begin', 0, 'A', null],
        [10, 'wtf.timeRange#begin', 1, 'B', null],
        [20, 'wtf.timeRange#begin', 2, 'C', null],
        [30, 'wtf.timeRange#end', 1],
        [40, 'wtf.timeRange#begin', 3, 'D', null],
        [50, 'wtf.timeRange#begin', 4, 'E', null],
        [60, 'wtf.timeRange#end', 2],
        [70, 'wtf.timeRange#end', 3],
        [80, 'wtf.timeRange#end', 0],
        [90, 'wtf.timeRange#end', 4]
      ]
    });

    assert.equal(timeRangeList.getCount(), 5);
    var ranges = timeRangeList.getAllTimeRanges();
    assert.lengthOf(ranges, 5);

    var timeRangeA = timeRangeList.getTimeRange(0);
    var timeRangeB = timeRangeList.getTimeRange(1);
    var timeRangeC = timeRangeList.getTimeRange(2);
    var timeRangeD = timeRangeList.getTimeRange(3);
    var timeRangeE = timeRangeList.getTimeRange(4);
    assert.deepEqual(
        ranges, [timeRangeA, timeRangeB, timeRangeC, timeRangeD, timeRangeE]);

    assert.equal(timeRangeA.getLevel(), 0);
    assert.equal(timeRangeA.getOverlap(), 0);
    assert.equal(timeRangeB.getLevel(), 1);
    assert.equal(timeRangeB.getOverlap(), 1);
    assert.equal(timeRangeC.getLevel(), 2);
    assert.equal(timeRangeC.getOverlap(), 2);
    assert.equal(timeRangeD.getLevel(), 1);
    assert.equal(timeRangeD.getOverlap(), 2);
    assert.equal(timeRangeE.getLevel(), 3);
    assert.equal(timeRangeE.getOverlap(), 3);

    var intersecting = [];
    timeRangeList.forEachIntersecting(0, 1000, function(timeRange) {
      intersecting.push(timeRange);
    });
    assert.deepEqual(
        intersecting,
        [timeRangeA, timeRangeB, timeRangeC, timeRangeD, timeRangeE]);

    intersecting = [];
    timeRangeList.forEachIntersecting(0, 10, function(timeRange) {
      intersecting.push(timeRange);
    });
    assert.deepEqual(intersecting, [timeRangeA, timeRangeB]);

    intersecting = [];
    timeRangeList.forEachIntersecting(0, 20, function(timeRange) {
      intersecting.push(timeRange);
    });
    assert.deepEqual(intersecting, [timeRangeA, timeRangeB, timeRangeC]);

    intersecting = [];
    timeRangeList.forEachIntersecting(20, 40, function(timeRange) {
      intersecting.push(timeRange);
    });
    assert.deepEqual(
        intersecting, [timeRangeA, timeRangeB, timeRangeC, timeRangeD]);

    intersecting = [];
    timeRangeList.forEachIntersecting(80, 90, function(timeRange) {
      intersecting.push(timeRange);
    });
    assert.deepEqual(intersecting, [timeRangeA, timeRangeE]);

    intersecting = [];
    timeRangeList.forEachIntersecting(85, 90, function(timeRange) {
      intersecting.push(timeRange);
    });
    assert.deepEqual(intersecting, [timeRangeE]);
  });
});
