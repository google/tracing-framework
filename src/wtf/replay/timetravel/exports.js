/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Time travel API exports.
 * This file will export a bunch of public symbols allowing for use of the
 * tracing library from non-Closure code. The master enable define must be set
 * to true to enable this so that the exports are not performed when in
 * Closurized code.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.replay.timeTravel.exports');

/** @suppress {extraRequire} */
goog.require('wtf.replay.timeTravel');
/** @suppress {extraRequire} */
goog.require('wtf.util');


/**
 * @define {boolean} Whether to enable exporting of the wtf.replay.timeTravel
 *     types and namespace.
 *
 * This should only be enabled in builds of the standalone library. If you're
 * including this code with it enabled in Closurized javascript then you'll
 * prevent renaming.
 */
wtf.replay.timeTravel.exports.ENABLE_EXPORTS = false;
