/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Analysis Node.js entry point.
 * Exports some utility functions for node applications.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.analysis.node');

/** @suppress {extraRequire} */
goog.require('goog.debug.ErrorHandler');
/** @suppress {extraRequire} */
goog.require('goog.events.EventHandler');
/** @suppress {extraRequire} */
goog.require('goog.events.EventTarget');
/** @suppress {extraRequire} */
goog.require('wtf.net.ListenSocket');
/** @suppress {extraRequire} */
goog.require('wtf.net.Socket');
/** @suppress {extraRequire} */
goog.require('wtf.pal');
