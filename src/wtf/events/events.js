/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Events utility namespace.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.events');

goog.require('wtf.events.CommandManager');
goog.require('wtf.events.Keyboard');


/**
 * Alias for {@see wtf.events.Keyboard#getWindowKeyboard}.
 */
wtf.events.getWindowKeyboard = wtf.events.Keyboard.getWindowKeyboard;


/**
 * Alias for {@see wtf.events.CommandManager#getShared}.
 */
wtf.events.getCommandManager = wtf.events.CommandManager.getShared;
