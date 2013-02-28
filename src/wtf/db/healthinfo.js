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



/**
 * Database health information.
 * This tracks certain statistics about the trace database that can be used
 * to track things like tracing overhead.
 *
 * @constructor
 */
wtf.db.HealthInfo = function() {
};


/**
 * Whether the database is 'bad'.
 * This should be used to show warnings. It's not a guarantee things are bad,
 * but should have enough confidence to be able to shame the user.
 * @return {boolean} True when health is bad.
 */
wtf.db.HealthInfo.prototype.isBad = function() {
  return true;
};
