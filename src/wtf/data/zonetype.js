/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Zone type enumeration.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.data.ZoneType');


/**
 * Default zone types.
 * Any string value is valid, however these are standard ones.
 * @enum {string}
 */
wtf.data.ZoneType = {
  /**
   * Primary script context.
   * Usually just user JavaScript scopes. This is the default scope created for
   * all traces.
   */
  SCRIPT: 'script',

  /**
   * Native script context.
   * Native runtime scopes, such as the C++ calls above the JavaScript.
   */
  NATIVE_SCRIPT: 'native_script',

  /**
   * Native GPU thread context.
   * This is not the GPU itself but instead the thread calling GPU driver
   * methods.
   */
  NATIVE_GPU: 'native_gpu',

  /**
   * Native browser context.
   * This is the browser thread that usually routes input events and other
   * global operations.
   */
  NATIVE_BROWSER: 'native_browser'
};


goog.exportSymbol(
    'wtf.data.ZoneType',
    wtf.data.ZoneType);
goog.exportProperty(
    wtf.data.ZoneType, 'SCRIPT',
    wtf.data.ZoneType.SCRIPT);
goog.exportProperty(
    wtf.data.ZoneType, 'NATIVE_SCRIPT',
    wtf.data.ZoneType.NATIVE_SCRIPT);
goog.exportProperty(
    wtf.data.ZoneType, 'NATIVE_GPU',
    wtf.data.ZoneType.NATIVE_GPU);
goog.exportProperty(
    wtf.data.ZoneType, 'NATIVE_BROWSER',
    wtf.data.ZoneType.NATIVE_BROWSER);
