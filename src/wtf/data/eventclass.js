/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Event class enumeration.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.data.EventClass');


/**
 * Event class.
 * Each event in the stream is typed. Events may have additional flags that
 * describe their behavior.
 * @enum {number}
 */
wtf.data.EventClass = {
  /**
   * Event indicating a single instance of something.
   */
  INSTANCE: 0,

  /**
   * Event marks scope entrace.
   * This allows for specialized events to indicate both the occurance of
   * an event and enter a scope cleanly.
   */
  SCOPE: 1
};


goog.exportSymbol(
    'wtf.data.EventClass',
    wtf.data.EventClass);
goog.exportProperty(
    wtf.data.EventClass, 'INSTANCE',
    wtf.data.EventClass.INSTANCE);
goog.exportProperty(
    wtf.data.EventClass, 'SCOPE',
    wtf.data.EventClass.SCOPE);
