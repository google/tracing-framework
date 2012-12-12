/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Zone definition.
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
  SCRIPT: 'script'
};


goog.exportSymbol(
    'wtf.data.ZoneType',
    wtf.data.ZoneType);
goog.exportProperty(
    wtf.data.ZoneType, 'SCRIPT',
    wtf.data.ZoneType.SCRIPT);
