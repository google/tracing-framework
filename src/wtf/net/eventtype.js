/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Network event types.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.net.EventType');

goog.require('goog.events');


/**
 * Event type names.
 * @enum {string}
 */
wtf.net.EventType = {
  /**
   * A new socket connection has been established.
   */
  CONNECTION: goog.events.getUniqueId('connection'),

  /**
   * A socket receives data.
   */
  DATA: goog.events.getUniqueId('data'),

  /**
   * A socket has been closed.
   */
  CLOSE: goog.events.getUniqueId('close'),

  /**
   * An HTTP server request was issued.
   */
  REQUEST: goog.events.getUniqueId('request'),

  /**
   * A request has ended and not more data will be received.
   */
  END: goog.events.getUniqueId('end')
};
