/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Common zoom types.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.zoom.TransitionMode');


/**
 * Transition mode.
 * @enum {number}
 */
wtf.ui.zoom.TransitionMode = {
  /**
   * Transition over time with the default animation duration.
   */
  ANIMATED: 0,

  /**
   * Transition immediately, with no animation.
   */
  IMMEDIATE: 1
};
