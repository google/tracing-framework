/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Test utility functions to make life easier.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.testing');
goog.provide('wtf.testing.EventListDefinition');

goog.require('goog.asserts');
goog.require('wtf.db.EventList');
goog.require('wtf.db.EventType');
goog.require('wtf.db.EventTypeTable');


/**
 * Event list definition describing event types and a list of event instances.
 * If any event types are already defined with the same name the existing
 * ones will be reused, so it's ok to always pass them.
 *
 * <code>
 * wtf.test.insertEvents(eventList, {
 *   instanceEventTypes: ['a(uint32 arg0, uint32 arg1)', 'b()'],
 *   events: [[123, 'a', 5, 6], [124, 'b'], [125, 'a', 7, 8]]
 * });
 * </code>
 *
 * @typedef {{
 *   scopeEventTypes: (Array.<string>|undefined),
 *   instanceEventTypes: (Array.<string>|undefined),
 *   events: !Array.<!Array>>
 * }}
 */
wtf.testing.EventListDefinition;


/**
 * Creates a new event list initialized with the given event data.
 * See {@see wtf.testing.EventListDefinition} for information about the format.
 * @param {!wtf.testing.EventListDefinition} obj Event list definition.
 * @return {!wtf.db.EventList} Event list.
 */
wtf.testing.createEventList = function(obj) {
  var eventTypeTable = new wtf.db.EventTypeTable();
  var eventList = new wtf.db.EventList(eventTypeTable);
  wtf.testing.insertEvents(eventList, obj);
  return eventList;
};


/**
 * Inserts events into the target event list and rebuilds it.
 * See {@see wtf.testing.EventListDefinition} for information about the format.
 * @param {!wtf.db.EventList} eventList Event list.
 * @param {!wtf.testing.EventListDefinition} obj Event list definition.
 */
wtf.testing.insertEvents = function(eventList, obj) {
  var eventTypeTable = eventList.eventTypeTable;

  // Define event types, if needed.
  var scopeEventTypes = obj.scopeEventTypes;
  var instanceEventTypes = obj.instanceEventTypes;
  if (scopeEventTypes) {
    for (var n = 0; n < scopeEventTypes.length; n++) {
      eventTypeTable.defineType(
          wtf.db.EventType.createScope(scopeEventTypes[n]));
    }
  }
  if (instanceEventTypes) {
    for (var n = 0; n < instanceEventTypes.length; n++) {
      eventTypeTable.defineType(
          wtf.db.EventType.createInstance(instanceEventTypes[n]));
    }
  }

  // Insert all events.
  for (var n = 0; n < obj.events.length; n++) {
    var eventInfo = obj.events[n];
    var time = eventInfo[0];
    var eventType = eventTypeTable.getByName(eventInfo[1]);

    // Extract arguments, if present.
    goog.asserts.assert(eventType.args.length == eventInfo.length - 2);
    var argData = null;
    if (eventType.args.length) {
      argData = {};
      for (var m = 0; m < eventType.args.length; m++) {
        var variable = eventType.args[m];
        var value = eventInfo[2 + m];
        argData[variable.name] = value;
      }
    }

    // Insert.
    eventList.insert(eventType, time * 1000, argData);
  }

  eventList.rebuild();
};
