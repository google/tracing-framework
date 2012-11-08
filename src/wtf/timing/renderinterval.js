/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Render controller timer handle.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.timing.RenderInterval');

goog.require('wtf.timing.Handle');



/**
 * Rendering interval handle/tracking object.
 * @param {function(number): void} func Pre-bound callback function.
 * @constructor
 * @extends {wtf.timing.Handle}
 */
wtf.timing.RenderInterval = function(func) {
  goog.base(this, func);
};
goog.inherits(wtf.timing.RenderInterval, wtf.timing.Handle);
