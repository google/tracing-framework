/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Common event types.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.events.EventType');

goog.require('goog.events');


/**
 * Event type names.
 * @enum {string}
 */
wtf.events.EventType = {
  INVALIDATED: goog.events.getUniqueId('invalidated')
};
