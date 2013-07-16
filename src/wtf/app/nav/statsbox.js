/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Navigation bar control.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.nav.FpsStatsBox');
goog.provide('wtf.app.nav.GcStatsBox');
goog.provide('wtf.app.nav.StatsBox');

goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.soy');
goog.require('wtf.app.nav.statsbox');
goog.require('wtf.data.ZoneType');
goog.require('wtf.events.EventType');
goog.require('wtf.ui.Control');
goog.require('wtf.ui.Painter');
goog.require('wtf.util');



/**
 * Statistics box base control.
 * Provides a histogram renderer and a table for data.
 * @param {string} title Box title.
 * @param {!wtf.db.Database} db Database.
 * @param {!Element} parentElement Element to display in.
 * @param {!goog.dom.DomHelper} dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.app.nav.StatsBox = function(title, db, parentElement, dom) {
  goog.base(this, parentElement, dom);

  /**
   * Database.
   * @type {!wtf.db.Database}
   * @protected
   */
  this.db = db;

  /**
   * Numbers <table>.
   * @type {!Element}
   * @private
   */
  this.table_ = this.getChildElement(goog.getCssName('numbersTable'));

  dom.setTextContent(this.getChildElement(goog.getCssName('title')), title);

  var canvas = /** @type {!HTMLCanvasElement} */ (
      this.getChildElement(goog.getCssName('graphCanvas')));
  var paintContext = new wtf.ui.Painter(canvas);
  this.setPaintContext(paintContext);

  db.addListener(
      wtf.events.EventType.INVALIDATED, this.databaseInvalidated_, this);
  this.databaseInvalidated_();
};
goog.inherits(wtf.app.nav.StatsBox, wtf.ui.Control);


/**
 * @override
 */
wtf.app.nav.StatsBox.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.nav.statsbox.control, undefined, undefined, dom));
};


/**
 * @override
 */
wtf.app.nav.StatsBox.prototype.layoutInternal = function() {
  goog.base(this, 'layoutInternal');
};


/**
 * Handles database invalidations.
 * @private
 */
wtf.app.nav.StatsBox.prototype.databaseInvalidated_ = function() {
  this.update();
};


/**
 * Updates the stats box contents.
 * Subclasses should override this method to handle updating the graph and
 * row data. This is called whenever the database is invalidated.
 * @protected
 */
wtf.app.nav.StatsBox.prototype.update = goog.abstractMethod;


/**
 * @typedef {{
 *   key: string,
 *   value: (string|number),
 *   title: string
 * }}
 * @protected
 */
wtf.app.nav.StatsBox.RowType;


/**
 * Updates the contents of the numbers table.
 * @param {!Array.<wtf.app.nav.StatsBox.RowType>} rows Row data.
 * @protected
 */
wtf.app.nav.StatsBox.prototype.updateNumbers = function(rows) {
  var dom = this.getDom();

  // TODO(benvanik): faster clear?
  dom.setTextContent(this.table_, '');

  // Toggle empty mode.
  goog.dom.classes.enable(this.table_, goog.getCssName('empty'), !rows.length);
  if (!rows.length) {
    dom.setTextContent(this.table_, 'no data');
    return;
  }

  for (var n = 0; n < rows.length; n++) {
    var tr = dom.createElement(goog.dom.TagName.TR);
    tr.title = rows[n].title;

    var td0 = dom.createElement(goog.dom.TagName.TD);
    dom.setTextContent(td0, rows[n].key);
    dom.appendChild(tr, td0);

    var td1 = dom.createElement(goog.dom.TagName.TD);
    dom.setTextContent(td1, String(rows[n].value));
    dom.appendChild(tr, td1);

    dom.appendChild(this.table_, tr);
  }
};



/**
 * A stats box for frames.
 * @param {!wtf.db.Database} db Database.
 * @param {!Element} parentElement Element to display in.
 * @param {!goog.dom.DomHelper} dom DOM helper.
 * @constructor
 * @extends {wtf.app.nav.StatsBox}
 */
wtf.app.nav.FpsStatsBox = function(db, parentElement, dom) {
  goog.base(this, 'FPS', db, parentElement, dom);
};
goog.inherits(wtf.app.nav.FpsStatsBox, wtf.app.nav.StatsBox);


/**
 * @override
 */
wtf.app.nav.FpsStatsBox.prototype.update = function() {
  var totalCount = 0;
  var averageTime = 0;
  var averageSpan = 0;
  var over16Count = 0;

  var frameList = this.db.getFirstFrameList();
  if (!frameList) {
    // No data.
    this.updateNumbers([]);
    return;
  }

  // Process the frames.
  var frames = frameList.getAllFrames();
  for (var n = 0; n < frames.length; n++) {
    var frame = frames[n];

    totalCount++;
    averageTime += frame.getDuration();
    if (frame.getDuration() > 16.777) {
      over16Count++;
    }

    if (n) {
      var gap = frame.getTime() - frames[n - 1].getTime();
      averageSpan += gap;
    }
  }
  averageTime /= totalCount;
  averageSpan /= totalCount - 1;

  var rows = [
    {
      key: 'Avg:',
      value: (1000 / averageSpan).toFixed(0),
      title: 'Average frames per second.'
    },
    {
      key: 'Duration:',
      value: wtf.util.formatSmallTime(averageTime),
      title: 'Average time per requestAnimationFrame.'
    },
    {
      key: 'Span:',
      value: wtf.util.formatSmallTime(averageSpan),
      title: 'Average time between frame starts.'
    },
    {
      key: '>16ms:',
      value: over16Count + ', ' +
          Math.round((over16Count / totalCount) * 100) + '%',
      title: 'Number of frames over 16ms (60fps) and % of all frames.'
    }
  ];
  this.updateNumbers(rows);
};



/**
 * A stats box for GC events.
 * @param {!wtf.db.Database} db Database.
 * @param {!Element} parentElement Element to display in.
 * @param {!goog.dom.DomHelper} dom DOM helper.
 * @constructor
 * @extends {wtf.app.nav.StatsBox}
 */
wtf.app.nav.GcStatsBox = function(db, parentElement, dom) {
  goog.base(this, 'GC', db, parentElement, dom);
};
goog.inherits(wtf.app.nav.GcStatsBox, wtf.app.nav.StatsBox);


/**
 * @override
 */
wtf.app.nav.GcStatsBox.prototype.update = function() {
  var totalCount = 0;
  var totalDuration = 0;
  var skipCount = 0;

  // Find the first script zone.
  // TODO(benvanik): all zones? this will not pick up worker zones.
  var zones = this.db.getZones();
  var zone = null;
  for (var n = 0; n < zones.length; n++) {
    if (zones[n].getType() == wtf.data.ZoneType.SCRIPT) {
      zone = zones[n];
      break;
    }
  }
  if (!zone) {
    this.updateNumbers([]);
    return;
  }

  // Get the GC index.
  var index = zone.getSharedIndex(['javascript#gc']);
  if (!index.getCount()) {
    this.updateNumbers([]);
    return;
  }

  // Process GC events.
  var it = index.begin();
  for (; !it.done(); it.next()) {
    totalCount++;
    totalDuration += it.getTotalDuration();
  }

  // Run a pass to try to find fat frames caused by GCs.
  // This walks the frame list and GC list simultaneously to try to
  // accumulate the time spent GCing in each frame span.
  var frameList = zone.getFrameList();
  var frames = frameList.getAllFrames();
  it = index.begin();
  for (var n = 1; n < frames.length && !it.done(); n++) {
    var t0 = frames[n - 1].getTime();
    var t1 = frames[n].getTime();
    var gap = t1 - t0;

    // Seek to the first GC in the frame span we are interested in.
    for (; !it.done() && it.getTime() < t0; it.next()) {}
    if (it.done()) {
      break;
    }

    // Accumulate the GCs.
    var time = 0;
    while (!it.done() && it.getTime() < t1) {
      time += it.getTotalDuration();
      it.next();
    }

    // Diff.
    if (gap > 16.777 &&
        gap - time < 16.777) {
      skipCount++;
    }
  }

  var rows = [
    {
      key: 'Count:',
      value: totalCount,
      title: 'Total number of large garbage collects.'
    },
    {
      key: 'Duration:',
      value: wtf.util.formatSmallTime(totalDuration / totalCount),
      title: 'Average duration of each garbage collect.'
    },
    {
      key: 'Total:',
      value: wtf.util.formatSmallTime(totalDuration),
      title: 'Total time spent running garbage collection.'
    },
    {
      key: 'Skips:',
      value: '~' + skipCount,
      title: 'Number of times a frame ran over 16ms because of a GC.'
    }
  ];
  this.updateNumbers(rows);
};
