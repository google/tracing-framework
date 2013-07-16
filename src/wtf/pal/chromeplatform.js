/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Chrome extension platform abstraction layer.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.pal.ChromePlatform');

goog.require('wtf.pal.BrowserPlatform');



/**
 * Chrome extension platform abstraction layer implementation.
 * @constructor
 * @extends {wtf.pal.BrowserPlatform}
 */
wtf.pal.ChromePlatform = function() {
  goog.base(this);
};
goog.inherits(wtf.pal.ChromePlatform, wtf.pal.BrowserPlatform);
