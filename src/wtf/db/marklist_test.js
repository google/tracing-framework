/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

goog.provide('wtf.db.MarkList_test');

goog.require('wtf.db.EventList');
goog.require('wtf.db.EventTypeTable');
goog.require('wtf.db.MarkList');
goog.require('wtf.testing');


/**
 * wtf.db.MarkList testing.
 */
wtf.db.MarkList_test = suite('wtf.db.MarkList', function() {
  test('#ctor', function() {
    var eventTypeTable = new wtf.db.EventTypeTable();
    var eventList = new wtf.db.EventList(eventTypeTable);

    // Creation succeeds.
    var markList = new wtf.db.MarkList(eventList);
    assert.equal(markList.getCount(), 0);
    assert.lengthOf(markList.getAllMarks(), 0);

    // Should unregister itself when disposed.
    goog.dispose(markList);
    assert.lengthOf(eventList.ancillaryLists_, 0);
  });

  test('rebuildEmpty', function() {
    var eventTypeTable = new wtf.db.EventTypeTable();
    var eventList = new wtf.db.EventList(eventTypeTable);
    var markList = new wtf.db.MarkList(eventList);

    assert.equal(markList.getCount(), 0);

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

    assert.equal(markList.getCount(), 0);
    assert.lengthOf(markList.getAllMarks(), 0);
  });

  test('rebuildEvents', function() {
    var eventTypeTable = new wtf.db.EventTypeTable();
    var eventList = new wtf.db.EventList(eventTypeTable);
    var markList = new wtf.db.MarkList(eventList);

    assert.equal(markList.getCount(), 0);

    wtf.testing.insertEvents(eventList, {
      instanceEventTypes: [
        'wtf.trace#mark(ascii name, any value)',
        'someInstanceEvent()'
      ],
      events: [
        [0, 'someInstanceEvent'],
        [10, 'wtf.trace#mark', 'a', 'foo'],
        [20, 'someInstanceEvent'],
        [30, 'wtf.trace#mark', 'b', 'bar'],
        [40, 'someInstanceEvent']
      ]
    });

    assert.equal(markList.getCount(), 2);
    assert.lengthOf(markList.getAllMarks(), 2);

    var markA = markList.getMarkAtTime(10);
    assert.isNotNull(markA);
    assert.equal(markA.getName(), 'a');
    assert.equal(markA.getValue(), 'foo');
    assert.equal(markA.getTime(), 10);
    assert.equal(markA.getEndTime(), 30);
    assert.equal(markA.getDuration(), 20);

    var markB = markList.getMarkAtTime(30);
    assert.isNotNull(markB);
    assert.equal(markB.getName(), 'b');
    assert.equal(markB.getValue(), 'bar');
    assert.equal(markB.getTime(), 30);
    assert.equal(markB.getEndTime(), 40);
    assert.equal(markB.getDuration(), 10);

    assert.deepEqual(markList.getAllMarks(), [markA, markB]);
  });

  test('rebuildIncremental', function() {
    var eventTypeTable = new wtf.db.EventTypeTable();
    var eventList = new wtf.db.EventList(eventTypeTable);
    var markList = new wtf.db.MarkList(eventList);

    assert.equal(markList.getCount(), 0);

    wtf.testing.insertEvents(eventList, {
      instanceEventTypes: [
        'wtf.trace#mark(ascii name, any value)',
        'someInstanceEvent()'
      ],
      events: [
        [0, 'someInstanceEvent'],
        [10, 'wtf.trace#mark', 'a', null],
        [20, 'someInstanceEvent']
      ]
    });

    assert.equal(markList.getCount(), 1);
    assert.lengthOf(markList.getAllMarks(), 1);

    wtf.testing.insertEvents(eventList, {
      instanceEventTypes: [
        'wtf.trace#mark(ascii name, any value)',
        'someInstanceEvent()'
      ],
      events: [
        [30, 'wtf.trace#mark', 'b', null],
        [40, 'someInstanceEvent']
      ]
    });

    assert.equal(markList.getCount(), 2);
    assert.lengthOf(markList.getAllMarks(), 2);
  });

  test('marks', function() {
    var eventTypeTable = new wtf.db.EventTypeTable();
    var eventList = new wtf.db.EventList(eventTypeTable);
    var markList = new wtf.db.MarkList(eventList);
    wtf.testing.insertEvents(eventList, {
      instanceEventTypes: [
        'wtf.trace#mark(ascii name, any value)',
        'someInstanceEvent()'
      ],
      events: [
        [0, 'someInstanceEvent'],
        [10, 'wtf.trace#mark', 'a', null],
        [20, 'someInstanceEvent'],
        [30, 'wtf.trace#mark', 'b', null],
        [40, 'someInstanceEvent'],
        [50, 'wtf.trace#mark', 'c', null],
        [60, 'someInstanceEvent'],
        [70, 'wtf.trace#mark', 'd', null],
        [80, 'someInstanceEvent']
      ]
    });

    var markA = markList.getMarkAtTime(10);
    assert.isNotNull(markA);
    assert.equal(markA.getName(), 'a');
    var markB = markList.getMarkAtTime(30);
    assert.isNotNull(markB);
    assert.equal(markB.getName(), 'b');
    var markC = markList.getMarkAtTime(50);
    assert.isNotNull(markC);
    assert.equal(markC.getName(), 'c');
    var markD = markList.getMarkAtTime(70);
    assert.isNotNull(markD);
    assert.equal(markD.getName(), 'd');

    assert.equal(markList.getCount(), 4);
    assert.lengthOf(markList.getAllMarks(), 4);
    assert.deepEqual(markList.getAllMarks(), [markA, markB, markC, markD]);

    assert.isNull(markList.getMarkAtTime(0));
    assert.isNull(markList.getMarkAtTime(1000));
    assert.equal(markList.getMarkAtTime(10), markA);
    assert.equal(markList.getMarkAtTime(11), markA);
    assert.equal(markList.getMarkAtTime(30), markB);
    assert.equal(markList.getMarkAtTime(70), markD);

    var intersecting = [];
    markList.forEachIntersecting(0, 1000, function(mark) {
      intersecting.push(mark);
    });
    assert.lengthOf(intersecting, 4);

    intersecting = [];
    markList.forEachIntersecting(0, 5, function(mark) {
      intersecting.push(mark);
    });
    assert.lengthOf(intersecting, 0);

    intersecting = [];
    markList.forEachIntersecting(40, 60, function(mark) {
      intersecting.push(mark);
    });
    assert.deepEqual(intersecting, [markB, markC]);

    intersecting = [];
    markList.forEachIntersecting(80, 150, function(mark) {
      intersecting.push(mark);
    });
    assert.deepEqual(intersecting, [markD]);
  });

  test('marksEmpty', function() {
    var eventTypeTable = new wtf.db.EventTypeTable();
    var eventList = new wtf.db.EventList(eventTypeTable);
    var markList = new wtf.db.MarkList(eventList);
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

    assert.equal(markList.getCount(), 0);
    assert.lengthOf(markList.getAllMarks(), 0);

    assert.isNull(markList.getMarkAtTime(0));

    markList.forEachIntersecting(0, 1000, function(mark) {
      assert.fail('Should be nothing intersecting!');
    });
  });
});
