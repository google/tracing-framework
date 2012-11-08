/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Filtering definitions for the analysis pipeline.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.filters.EventFilter');
goog.provide('wtf.analysis.filters.ProviderFilter');
goog.provide('wtf.analysis.filters.ZoneFilter');

goog.require('wtf.analysis.Filter');



/**
 * Describes a filter for zones.
 *
 * @param {wtf.analysis.FilterOperation} operation Filter operation.
 * @param {string} zoneName Zone name.
 * @constructor
 * @extends {wtf.analysis.Filter}
 */
wtf.analysis.filters.ZoneFilter = function(operation, zoneName) {
  goog.base(this, operation);

  /**
   * Zone name.
   * @type {string}
   */
  this.zoneName = zoneName;
};
goog.inherits(wtf.analysis.filters.ZoneFilter, wtf.analysis.Filter);



/**
 * Describes a filter for providers.
 *
 * @param {wtf.analysis.FilterOperation} operation Filter operation.
 * @param {string} providerName Provider name.
 * @constructor
 * @extends {wtf.analysis.Filter}
 */
wtf.analysis.filters.ProviderFilter = function(operation, providerName) {
  goog.base(this, operation);

  /**
   * Provider name.
   * @type {string}
   */
  this.providerName = providerName;
};
goog.inherits(wtf.analysis.filters.ProviderFilter, wtf.analysis.Filter);



/**
 * Describes a filter for events.
 *
 * @param {wtf.analysis.FilterOperation} operation Filter operation.
 * @param {string} providerName Provider name.
 * @param {string} eventName Event name.
 * @constructor
 * @extends {wtf.analysis.Filter}
 */
wtf.analysis.filters.EventFilter = function(
    operation, providerName, eventName) {
  goog.base(this, operation);

  /**
   * Provider name.
   * @type {string}
   */
  this.providerName = providerName;

  /**
   * Event name.
   * @type {string}
   */
  this.eventName = eventName;
};
goog.inherits(wtf.analysis.filters.EventFilter, wtf.analysis.Filter);
