/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Zone tracking utility.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.Zone');

goog.require('goog.Disposable');
goog.require('wtf');
goog.require('wtf.db.EventIterator');
goog.require('wtf.db.EventList');
goog.require('wtf.db.Filter');
goog.require('wtf.db.FilterResult');
goog.require('wtf.db.FrameList');
goog.require('wtf.db.MarkList');
goog.require('wtf.db.QueryResult');
goog.require('wtf.db.TimeRangeList');



/**
 * Zone event store.
 * A zone represents a logical event stream, such as a thread.
 *
 * @param {!wtf.db.Database} db Owning database.
 * @param {string} name Zone name.
 * @param {string} type Zone type.
 * @param {string} location Zone location (such as URI of the script).
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.db.Zone = function(db, name, type, location) {
  goog.base(this);

  /**
   * Owning database.
   * @type {!wtf.db.Database}
   * @private
   */
  this.db_ = db;

  /**
   * Human-readable zone name.
   * @type {string}
   * @private
   */
  this.name_ = name;

  /**
   * Zone type.
   * May be one of {@see wtf.data.ZoneType} or a custom value.
   * @type {string}
   * @private
   */
  this.type_ = type;

  /**
   * Zone location (such as URI of the script).
   * @type {string}
   * @private
   */
  this.location_ = location;

  /**
   * Event list.
   * @type {!wtf.db.EventList}
   * @private
   */
  this.eventList_ = new wtf.db.EventList(db.getEventTypeTable());

  /**
   * A list of all frames in this zone.
   * @type {!wtf.db.FrameList}
   * @private
   */
  this.frameList_ = new wtf.db.FrameList(this);
  this.registerDisposable(this.frameList_);

  /**
   * A list of all marks in this zone.
   * @type {!wtf.db.MarkList}
   * @private
   */
  this.markList_ = new wtf.db.MarkList(this);
  this.registerDisposable(this.markList_);

  /**
   * A list of all time ranges in this zone.
   * @type {!wtf.db.TimeRangeList}
   * @private
   */
  this.timeRangeList_ = new wtf.db.TimeRangeList(this);
  this.registerDisposable(this.timeRangeList_);
};
goog.inherits(wtf.db.Zone, goog.Disposable);


/**
 * Resets the zone information without clearing its contents.
 * @param {string} name Zone name.
 * @param {string} type Zone type.
 * @param {string} location Zone location (such as URI of the script).
 */
wtf.db.Zone.prototype.resetInfo = function(name, type, location) {
  this.name_ = name;
  this.type_ = type;
  this.location_ = location;
};


/**
 * Gets a string representation of the zone.
 * @return {string} String representation of the zone.
 */
wtf.db.Zone.prototype.toString = function() {
  return this.name_;
};


/**
 * Gets an informative string about a zone.
 * @param {!wtf.db.Zone} zone Target zone.
 * @return {string} Info string.
 */
wtf.db.Zone.getInfoString = function(zone) {
  var lines = [
    zone.name_ + ' (' + zone.type_ + ')'
  ];
  if (zone.location_ && zone.location_.length) {
    lines.push(zone.location_);
  }
  return lines.join('\n');
};


/**
 * Gets the database that owns this zone.
 * @return {!wtf.db.Database} Database.
 */
wtf.db.Zone.prototype.getDatabase = function() {
  return this.db_;
};


/**
 * Gets the name of the zone.
 * @return {string} Human-readable zone name.
 */
wtf.db.Zone.prototype.getName = function() {
  return this.name_;
};


/**
 * Gets the type of the zone.
 * @return {string} One of {@see wtf.data.ZoneType} or a custom value.
 */
wtf.db.Zone.prototype.getType = function() {
  return this.type_;
};


/**
 * Gets the zone location (such as URI of the script).
 * @return {string} Zone location.
 */
wtf.db.Zone.prototype.getLocation = function() {
  return this.location_;
};


/**
 * Gets the event list containing all event data for this zone.
 * @return {!wtf.db.EventList} Event list.
 */
wtf.db.Zone.prototype.getEventList = function() {
  return this.eventList_;
};


/**
 * Gets the frame list.
 * Note that it may be empty if this zone has no frames.
 * @return {!wtf.db.FrameList} Frame list.
 */
wtf.db.Zone.prototype.getFrameList = function() {
  return this.frameList_;
};


/**
 * Gets the mark list.
 * Note that it may be empty if this zone has no marks.
 * @return {!wtf.db.MarkList} Mark list.
 */
wtf.db.Zone.prototype.getMarkList = function() {
  return this.markList_;
};


/**
 * Gets the time range list.
 * Note that it may be empty if this zone has no time ranges.
 * @return {!wtf.db.TimeRangeList} Time range list.
 */
wtf.db.Zone.prototype.getTimeRangeList = function() {
  return this.timeRangeList_;
};


/**
 * Queries the zone.
 * Throws errors if the expression could not be parsed.
 * @param {string} expr Query string.
 * @return {wtf.db.QueryResult} Result.
 */
wtf.db.Zone.prototype.query = function(expr) {
  // Try to figure out what type the query is.
  // First, we see if it's some kind of simple substring (starts without /)
  // or a regex (starts and ends with /). If that's true, we use the
  // event filter logic to populate the table.
  // Otherwise, we assume they are trying to type an xpath expression. Note that
  // this will cause someone typing a regex to have the intermediate stages
  // interpreted as an xpath query, but that's ok.
  var isFilter = false;
  if (expr.charAt(0) != '/' &&
      expr.indexOf('(') == -1) {
    // Definitely a substring.
    isFilter = true;
  } else if (/^\/(.+)\/([gim]*)$/.test(expr)) {
    // Likely a regex, very rare for a query to match this, so trust it.
    isFilter = true;
  } else {
    // Likely an xpath query, do that.
    isFilter = false;
  }

  var startTime = wtf.now();

  var compiledExpr = null;
  var result = null;
  if (isFilter) {
    // Create filter.
    var filter = new wtf.db.Filter();
    var parseResult = filter.setFromString(expr);
    if (parseResult == wtf.db.FilterResult.FAILED) {
      throw 'Invalid regex.';
    }
    compiledExpr = filter.getEvaluator().toString();

    result = this.queryWithFilter_(filter);
  } else {
    // Create the XPath expression.
    // NOTE: this may throw!
    // TODO(benvanik): better error handling around this?
    var xexpr = new wgxpath.XPathExpression(expr || '.');
    compiledExpr = xexpr;

    // Run the XPath query on the database.
    // var context = this;
    // var xresult = xexpr.evaluate(context, wgxpath.XPathResultType.ANY_TYPE);
    // result = xresult.value;
    //this.queryWithXPath_()
    result = 'not yet implemented';
  }

  var duration = wtf.now() - startTime;
  return new wtf.db.QueryResult(expr, compiledExpr, duration, result);
};


/**
 * Runs a query with a simple event type filter.
 * @param {!wtf.db.Filter} filter Filter.
 * @return {wtf.db.EventIterator} Result.
 * @private
 */
wtf.db.Zone.prototype.queryWithFilter_ = function(filter) {
  var matchedEventTypes = filter.getMatchedEventTypes(
      this.db_.getEventTypeTable());

  // Build a list of all event IDs that match.
  var matches = [];
  var it = this.eventList_.begin();
  for (; !it.done(); it.next()) {
    if (matchedEventTypes[it.getTypeId()]) {
      matches.push(it.getId());
    }
  }

  return new wtf.db.EventIterator(
      this.eventList_, 0, matches.length - 1, 0, matches);
};


goog.exportSymbol(
    'wtf.db.Zone',
    wtf.db.Zone);
goog.exportProperty(
    wtf.db.Zone.prototype, 'toString',
    wtf.db.Zone.prototype.toString);
goog.exportProperty(
    wtf.db.Zone.prototype, 'getName',
    wtf.db.Zone.prototype.getName);
goog.exportProperty(
    wtf.db.Zone.prototype, 'getType',
    wtf.db.Zone.prototype.getType);
goog.exportProperty(
    wtf.db.Zone.prototype, 'getLocation',
    wtf.db.Zone.prototype.getLocation);
goog.exportProperty(
    wtf.db.Zone.prototype, 'getEventList',
    wtf.db.Zone.prototype.getEventList);
goog.exportProperty(
    wtf.db.Zone.prototype, 'getFrameList',
    wtf.db.Zone.prototype.getFrameList);
goog.exportProperty(
    wtf.db.Zone.prototype, 'getMarkList',
    wtf.db.Zone.prototype.getMarkList);
goog.exportProperty(
    wtf.db.Zone.prototype, 'getTimeRangeList',
    wtf.db.Zone.prototype.getTimeRangeList);
goog.exportProperty(
    wtf.db.Zone.prototype, 'query',
    wtf.db.Zone.prototype.query);
