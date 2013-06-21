/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Health information.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.HealthInfo');
goog.provide('wtf.db.HealthWarning');

goog.require('wtf.data.EventClass');
goog.require('wtf.db.ScopeEventDataEntry');



/**
 * Database health information.
 * This tracks certain statistics about the trace database that can be used
 * to track things like tracing overhead.
 *
 * @param {!wtf.db.Database} db Database.
 * @param {wtf.db.EventStatistics.Table=} opt_table An event statistics
 *     table to use for generating the health report.
 * @constructor
 */
wtf.db.HealthInfo = function(db, opt_table) {
  /**
   * Whether the trace is 'bad'.
   * @type {boolean}
   * @private
   */
  this.isBad_ = false;

  /**
   * Estimated overhead per scope, if available.
   * @type {number}
   * @private
   */
  this.overheadPerScopeNs_ = 0;

  /**
   * Total estimated overhead, in ms.
   * @type {number}
   * @private
   */
  this.totalOverheadMs_ = 0;

  /**
   * Total esitmated overhead, in %.
   * @type {number}
   * @private
   */
  this.totalOverheadPercent_ = 0;

  /**
   * Generated warnings.
   * @type {!Array.<!wtf.db.HealthWarning>}
   * @private
   */
  this.warnings_ = [];

  if (opt_table) {
    this.analyzeStatistics_(db, opt_table);
  }
};


/**
 * Whether the database is 'bad'.
 * This should be used to show warnings. It's not a guarantee things are bad,
 * but should have enough confidence to be able to shame the user.
 * @return {boolean} True when health is bad.
 */
wtf.db.HealthInfo.prototype.isBad = function() {
  return this.isBad_;
};


/**
 * Estimated amount of overhead per scope.
 * @return {number} Overhead per scope, in nanoseconds.
 */
wtf.db.HealthInfo.prototype.getOverheadPerScopeNs = function() {
  return this.overheadPerScopeNs_;
};


/**
 * Total time of the trace that is overhead.
 * @return {number} Overhead as a number of milliseconds.
 */
wtf.db.HealthInfo.prototype.getTotalOverheadMs = function() {
  return this.totalOverheadMs_;
};


/**
 * Total percentage of the trace that is overhead.
 * @return {number} Overhead as a percentage of the trace time.
 */
wtf.db.HealthInfo.prototype.getTotalOverheadPercent = function() {
  return this.totalOverheadPercent_;
};


/**
 * Gets a list of generated warnings.
 * @return {!Array.<!wtf.db.HealthWarning>}
 */
wtf.db.HealthInfo.prototype.getWarnings = function() {
  return this.warnings_;
};


/**
 * Analyzes event statistics to try to gauge the badness of the database.
 * @param {!wtf.db.Database} db Database.
 * @param {!wtf.db.EventStatistics.Table} table Event statistics table.
 * @private
 */
wtf.db.HealthInfo.prototype.analyzeStatistics_ = function(db, table) {
  var counts = {
    totalCount: 0,
    frameCount: 0,

    scopeCount: 0,
    instanceCount: 0,

    genericEnterScope: 0,
    genericTimeStamp: 0,
    appendScopeData: 0,

    anyArguments: 0,
    stringArguments: 0,

    avg2us: 0,
    avg5us: 0,
    avg10us: 0
  };

  // Common stats.
  var zones = db.getZones();
  for (var n = 0; n < zones.length; n++) {
    var zone = zones[n];

    var eventList = zone.getEventList();
    var listStats = eventList.getStatistics();
    counts.totalCount += listStats.totalCount;
    counts.genericEnterScope += listStats.genericEnterScope;
    counts.genericTimeStamp += listStats.genericTimeStamp;
    counts.appendScopeData += listStats.appendScopeData;

    var frameList = zone.getFrameList();
    counts.frameCount += frameList.getCount();
  }

  // Generate counts.
  var entries = table.getEntries();
  for (var n = 0; n < entries.length; n++) {
    var entry = entries[n];
    var eventType = entry.getEventType();

    switch (eventType.getClass()) {
      case wtf.data.EventClass.SCOPE:
        counts.scopeCount += entry.getCount();
        break;
      case wtf.data.EventClass.INSTANCE:
        counts.instanceCount += entry.getCount();
        break;
    }

    // Track slow arguments.
    var args = eventType.getArguments();
    for (var m = 0; m < args.length; m++) {
      var typeName = args[m].typeName;
      if (typeName == 'any') {
        counts.anyArguments += entry.getCount();
      } else if (typeName == 'ascii' || typeName == 'utf8') {
        counts.stringArguments += entry.getCount();
      }
    }

    // Check average times.
    if (entry instanceof wtf.db.ScopeEventDataEntry) {
      var meanTime = entry.getMeanTime();
      if (meanTime <= 2) {
        counts.avg2us += entry.getCount();
      } else if (meanTime <= 5) {
        counts.avg5us += entry.getCount();
      } else if (meanTime <= 10) {
        counts.avg10us += entry.getCount();
      }
    }
  }

  // Compute overheads.
  this.overheadPerScopeNs_ = 0;
  this.totalOverheadMs_ = 0;
  this.totalOverheadPercent_ = 0;
  var sources = db.getSources();
  var overheadPerNow = 0;
  if (sources.length) {
    var metadata = sources[0].getMetadata();
    overheadPerNow = metadata['nowTimeNs'] || 0;
  }
  if (overheadPerNow) {
    // Value was present - use it to compute the timings.
    // This is a rough guess that seems to track pretty well across systems.
    this.overheadPerScopeNs_ = overheadPerNow * 2 + overheadPerNow;
    this.totalOverheadMs_ =
        counts.scopeCount * this.overheadPerScopeNs_ +
        counts.instanceCount * (overheadPerNow + overheadPerNow);
    this.totalOverheadMs_ /= 1000 * 1000; // ns->us->ms
    var totalTraceMs = db.getLastEventTime() - db.getFirstEventTime();
    this.totalOverheadPercent_ = this.totalOverheadMs_ / totalTraceMs;
  }

  // If the total event count is under 1000, skip all this - the trace can't
  // be that bad.
  if (counts.totalCount < 1000) {
    return;
  }

  // Generate warnings.
  var warnings = [];
  if (counts.frameCount) {
    var eventsPerFrame = counts.totalCount / counts.frameCount;
    if (eventsPerFrame >= 10000) {
      warnings.push(new wtf.db.HealthWarning(
          'Too many events per frame.',
          'Keep the count under 10000 to avoid too much skew.',
          '~' + Math.round(eventsPerFrame) + ' events/frame',
          'warn_too_many_events_per_frame'));
    }
  }
  if (counts.instanceCount / counts.totalCount > 0.30) {
    warnings.push(new wtf.db.HealthWarning(
        'A lot of instance events (>30%).',
        'Instance events are easy to miss. Try not to use so many.',
        Math.floor(counts.instanceCount / counts.totalCount * 100) +
            '% of all events'));
  }
  if (counts.genericEnterScope / counts.totalCount > 0.10) {
    warnings.push(new wtf.db.HealthWarning(
        'Using enterScope too much (>10%).',
        'enterScope writes strings. Using a custom event type will result in ' +
            'less overhead per event.',
        Math.floor(counts.genericEnterScope / counts.totalCount * 100) +
            '% of all events'));
  }
  if (counts.genericTimeStamp / counts.totalCount > 0.10) {
    warnings.push(new wtf.db.HealthWarning(
        'Using timeStamp too much (>10%).',
        'timeStamp writes strings. Using a custom event type will result in ' +
            'less overhead per event.',
        Math.floor(counts.genericTimeStamp / counts.totalCount * 100) +
            '% of all events'));
  }
  if (counts.appendScopeData / counts.totalCount > 0.10) {
    warnings.push(new wtf.db.HealthWarning(
        'Using appendScopeData too much (>10%).',
        'appendScopeData writes strings and JSON. Use a custom event type ' +
            'with simple argument types instead.',
        Math.floor(counts.appendScopeData / counts.totalCount * 100) +
            '% of all events'));
  }
  if (counts.anyArguments / counts.totalCount > 0.10) {
    warnings.push(new wtf.db.HealthWarning(
        'Using a lot of "any" arguments (>10%).',
        'Use either simple numeric types (fastest) or strings instead.',
        Math.floor(counts.anyArguments / counts.totalCount * 100) +
            '% of all events'));
  }
  if (counts.stringArguments / counts.totalCount > 0.10) {
    warnings.push(new wtf.db.HealthWarning(
        'Using a lot of "ascii"/"utf8" arguments (>10%).',
        'Use simple numeric types instead. Prefer ascii to utf8.',
        Math.floor(counts.stringArguments / counts.totalCount * 100) +
            '% of all events'));
  }
  if (counts.avg2us / counts.totalCount > 0.05) {
    warnings.push(new wtf.db.HealthWarning(
        'Too many \u22642\u00B5s scopes.',
        'Very short scopes are not representative of their actual time and ' +
            'just add overhead. Remove them or change them to instance events.',
        Math.floor(counts.avg2us / counts.totalCount * 100) +
            '% of all events'));
  }
  if (counts.avg5us / counts.totalCount > 0.10) {
    warnings.push(new wtf.db.HealthWarning(
        'Too many \u22645\u00B5s scopes.',
        'Very short scopes are not representative of their actual time and ' +
            'just add overhead. Remove them or change them to instance events.',
        Math.floor(counts.avg5us / counts.totalCount * 100) +
            '% of all events'));
  }
  if (counts.avg10us / counts.totalCount > 0.15) {
    warnings.push(new wtf.db.HealthWarning(
        'Too many \u226410\u00B5s scopes.',
        'Very short scopes are not representative of their actual time and ' +
            'just add overhead. Remove them or change them to instance events.',
        Math.floor(counts.avg10us / counts.totalCount * 100) +
            '% of all events'));
  }
  this.warnings_ = warnings;

  // Judge the warnings to see if the trace is 'bad'.
  // TODO(benvanik): actually weight/judge them.
  if (warnings.length) {
    this.isBad_ = true;
  }
};


goog.exportSymbol(
    'wtf.db.HealthInfo',
    wtf.db.HealthInfo);
goog.exportProperty(
    wtf.db.HealthInfo.prototype, 'isBad',
    wtf.db.HealthInfo.prototype.isBad);
goog.exportProperty(
    wtf.db.HealthInfo.prototype, 'getOverheadPerScopeNs',
    wtf.db.HealthInfo.prototype.getOverheadPerScopeNs);
goog.exportProperty(
    wtf.db.HealthInfo.prototype, 'getTotalOverheadMs',
    wtf.db.HealthInfo.prototype.getTotalOverheadMs);
goog.exportProperty(
    wtf.db.HealthInfo.prototype, 'getTotalOverheadPercent',
    wtf.db.HealthInfo.prototype.getTotalOverheadPercent);
goog.exportProperty(
    wtf.db.HealthInfo.prototype, 'getWarnings',
    wtf.db.HealthInfo.prototype.getWarnings);



/**
 * A warning that can be displayed to the user.
 * @param {string} title Title.
 * @param {string} suggestion Suggestion.
 * @param {string} details Details.
 * @param {string=} opt_linkAnchor Optional information on the health page.
 * @constructor
 */
wtf.db.HealthWarning = function(title, suggestion, details, opt_linkAnchor) {
  /**
   * @type {string}
   * @private
   */
  this.title_ = title;

  /**
   * @type {string}
   * @private
   */
  this.suggestion_ = suggestion;

  /**
   * @type {string}
   * @private
   */
  this.details_ = details;

  /**
   * @type {?string}
   * @private
   */
  this.linkAnchor_ = opt_linkAnchor || null;
};


/**
 * Gets a title string that describes the warning.
 * @return {string} Title.
 */
wtf.db.HealthWarning.prototype.getTitle = function() {
  return this.title_;
};


/**
 * Gets a suggestion the user should follow.
 * @return {string} Suggestion.
 */
wtf.db.HealthWarning.prototype.getSuggestion = function() {
  return this.suggestion_;
};


/**
 * Gets a string that has the details of the warning, like count/%/etc.
 * @return {string} Details.
 */
wtf.db.HealthWarning.prototype.getDetails = function() {
  return this.details_;
};


/**
 * Gets an optional link to documentation about this issue.
 * @return {?string} A link, if any.
 */
wtf.db.HealthWarning.prototype.getLink = function() {
  var baseUrl = 'https://github.com/' +
      'google/tracing-framework/blob/master/docs/overhead.md';
  if (this.linkAnchor_) {
    return baseUrl + this.linkAnchor_;
  }
  return null;
};


/**
 * Gets a human-readable string for this warning.
 * @return {string} Warning string.
 */
wtf.db.HealthWarning.prototype.toString = function() {
  return this.title_ + ' (' + this.suggestion_ + ')';
};


goog.exportProperty(
    wtf.db.HealthWarning.prototype, 'getTitle',
    wtf.db.HealthWarning.prototype.getTitle);
goog.exportProperty(
    wtf.db.HealthWarning.prototype, 'getSuggestion',
    wtf.db.HealthWarning.prototype.getSuggestion);
goog.exportProperty(
    wtf.db.HealthWarning.prototype, 'getDetails',
    wtf.db.HealthWarning.prototype.getDetails);
goog.exportProperty(
    wtf.db.HealthWarning.prototype, 'getLink',
    wtf.db.HealthWarning.prototype.getLink);
