/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Event target.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.db.IEventTarget');



/**
 * Describes types that can receive events as they are added.
 * @interface
 */
wtf.analysis.db.IEventTarget = function() {};


/**
 * Begins inserting events into the target.
 * This must be called before {@see #insertEvent} and must be paired with a
 * {@see #endInserting} call.
 *
 * If the target type can be unloaded then insertion is only valid on fully
 * targets that are fully loaded.
 */
wtf.analysis.db.IEventTarget.prototype.beginInserting = goog.nullFunction;


/**
 * Inserts an event into the target.
 * @param {!wtf.analysis.Event} e Event.
 */
wtf.analysis.db.IEventTarget.prototype.insertEvent = goog.nullFunction;


/**
 * Ends inserting events into the target.
 */
wtf.analysis.db.IEventTarget.prototype.endInserting = goog.nullFunction;
