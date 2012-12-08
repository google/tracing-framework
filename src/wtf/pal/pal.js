/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Platform abstraction layer namespace.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.pal');

goog.require('wtf');
goog.require('wtf.pal.BrowserPlatform');
goog.require('wtf.pal.ChromePlatform');
goog.require('wtf.pal.NodePlatform');


/**
 * Shared PAL singleton.
 * Initialized by {@see wtf.pal#getPlatform} on first request.
 * @type {wtf.pal.IPlatform}
 * @private
 */
wtf.pal.sharedPlatform_ = null;


/**
 * Gets the shared platform instance.
 * @return {!wtf.pal.IPlatform} Shared platform.
 */
wtf.pal.getPlatform = function() {
  if (!wtf.pal.sharedPlatform_) {
    if (wtf.NODE) {
      wtf.pal.sharedPlatform_ = new wtf.pal.NodePlatform();
    } else {
      if (goog.global['chrome'] &&
          goog.global['chrome']['runtime']) {
        wtf.pal.sharedPlatform_ = new wtf.pal.ChromePlatform();
      } else {
        wtf.pal.sharedPlatform_ = new wtf.pal.BrowserPlatform();
      }
    }
  }
  return wtf.pal.sharedPlatform_;
};


goog.exportSymbol(
    'wtf.pal.getPlatform',
    wtf.pal.getPlatform);
