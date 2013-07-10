/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Keyboard commanding support.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.events.Keyboard');
goog.provide('wtf.events.KeyboardScope');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.dom.DomHelper');
goog.require('goog.events.EventHandler');
goog.require('goog.ui.KeyboardShortcutHandler');
goog.require('goog.userAgent');
goog.require('wtf.events.CommandManager');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.util');



/**
 * A keyboard commanding utility.
 * Allows the registration of global keyboard commands. As commands are
 * triggered events with the command name are emitted.
 *
 * @param {!Window} targetWindow Target window.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.events.Keyboard = function(targetWindow) {
  goog.base(this);

  /**
   * Event handler.
   * @type {!goog.events.EventHandler}
   * @private
   */
  this.eh_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eh_);

  /**
   * Key handler.
   * @type {!goog.ui.KeyboardShortcutHandler}
   * @private
   */
  this.keyHandler_ = new goog.ui.KeyboardShortcutHandler(targetWindow.document);
  this.registerDisposable(this.keyHandler_);
  this.keyHandler_.setAlwaysPreventDefault(true);
  this.keyHandler_.setAlwaysStopPropagation(true);
  this.keyHandler_.setAllShortcutsAreGlobal(true);

  /**
   * Suspend/resume depth.
   * When >0, keyboard shortcuts are ignored.
   * @type {number}
   * @private
   */
  this.suspendCount_ = 0;

  this.eh_.listen(
      this.keyHandler_,
      goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,
      this.keyPressed_,
      true);
};
goog.inherits(wtf.events.Keyboard, wtf.events.EventEmitter);


/**
 * The HTML code of the system key.
 * @const
 * @type {string}
 */
wtf.events.Keyboard.SYSTEM_KEY = goog.userAgent.MAC ? '&#8984;' : 'ctrl';


/**
 * Suspends listening for events.
 * Must be matched with a resume.
 */
wtf.events.Keyboard.prototype.suspend = function() {
  this.suspendCount_++;
  if (this.suspendCount_ == 1) {
    this.eh_.removeAll();
    this.keyHandler_.setAlwaysPreventDefault(false);
    this.keyHandler_.setAlwaysStopPropagation(false);
    this.keyHandler_.setAllShortcutsAreGlobal(false);
  }
};


/**
 * Resumes listening for events.
 * Must be matched with a suspend.
 */
wtf.events.Keyboard.prototype.resume = function() {
  goog.asserts.assert(this.suspendCount_);
  this.suspendCount_--;
  if (!this.suspendCount_) {
    this.eh_.listen(
        this.keyHandler_,
        goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,
        this.keyPressed_,
        true);
    this.keyHandler_.setAlwaysPreventDefault(true);
    this.keyHandler_.setAlwaysStopPropagation(true);
    this.keyHandler_.setAllShortcutsAreGlobal(true);
  }
};


/**
 * Translates a shortcut string into the platform-specific variant.
 * @param {string} shortcut Input shortcut string.
 * @return {string} Translated platform-specific variant.
 * @private
 */
wtf.events.Keyboard.prototype.translateShortcut_ = function(shortcut) {
  if (goog.userAgent.MAC) {
    return shortcut.replace(/command/g, 'meta');
  } else {
    return shortcut.replace(/command/g, 'ctrl');
  }
};


/**
 * Adds a command to be executed on the given key press.
 * @param {string} shortcut Shortcut string (like 'ctrl+g').
 * @param {!function(this:T)} callback Callback function.
 * @param {T=} opt_scope Scope for the callback function.
 * @template T
 * @private
 */
wtf.events.Keyboard.prototype.addShortcut_ = function(
    shortcut, callback, opt_scope) {
  // Support multi shortcuts.
  var shortcuts = shortcut.split('|');
  for (var n = 0; n < shortcuts.length; n++) {
    shortcut = this.translateShortcut_(shortcuts[n]);
    if (!this.hasListeners(shortcut)) {
      this.keyHandler_.registerShortcut(shortcut, shortcut);
    }
    this.addListener(shortcut, callback, opt_scope);
  }
};


/**
 * Removes a shortcut command.
 * @param {string} shortcut Shortcut string (like 'ctrl+g').
 * @param {!Function} callback Callback function.
 * @param {Object=} opt_scope Scope for the callback function.
 * @private
 */
wtf.events.Keyboard.prototype.removeShortcut_ = function(
    shortcut, callback, opt_scope) {
  // Support multi shortcuts.
  var shortcuts = shortcut.split('|');
  for (var n = 0; n < shortcuts.length; n++) {
    shortcut = this.translateShortcut_(shortcuts[n]);
    this.removeListener(shortcut, callback, opt_scope);
    if (!this.hasListeners(shortcut)) {
      this.keyHandler_.unregisterShortcut(shortcut);
    }
  }
};


/**
 * Handles key press events.
 * @param {!goog.ui.KeyboardShortcutEvent} e Key press event.
 * @private
 */
wtf.events.Keyboard.prototype.keyPressed_ = function(e) {
  this.emitEvent(e.identifier);
};


/**
 * A map of all keyboards by window UID.
 * @type {!Object.<!wtf.events.Keyboard>}
 * @private
 */
wtf.events.Keyboard.keyboardInstances_ = {};


/**
 * Gets the keyboard for the given window, creating one if needed.
 * @param {Window|goog.dom.DomHelper=} opt_window Window to get the keyboard of.
 * @return {!wtf.events.Keyboard} Keyboard for the given window.
 */
wtf.events.Keyboard.getWindowKeyboard = function(opt_window) {
  if (opt_window && opt_window instanceof goog.dom.DomHelper) {
    opt_window = opt_window.getWindow();
  }
  var targetWindow = opt_window || goog.global;
  var stash = wtf.util.getGlobalCacheObject('keyboard', targetWindow);
  var uid = goog.getUid(stash);
  var keyboard = wtf.events.Keyboard.keyboardInstances_[uid];
  if (!keyboard) {
    keyboard = new wtf.events.Keyboard(targetWindow);
    wtf.events.Keyboard.keyboardInstances_[uid] = keyboard;
  }
  return keyboard;
};



/**
 * Event utility for scoping keyboard shortcuts.
 * @param {!wtf.events.Keyboard} keyboard Keyboard instance.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.events.KeyboardScope = function(keyboard) {
  goog.base(this);

  /**
   * Target keyboard.
   * @type {!wtf.events.Keyboard}
   * @private
   */
  this.keyboard_ = keyboard;

  /**
   * A list of all shortcut listener tuples in the form of
   * [shortcut, callback, scope].
   * @type {!Array.<!Array>}
   * @private
   */
  this.listeners_ = [];

  /**
   * Whether the shortcuts for this scope are enabled.
   * @type {boolean}
   * @private
   */
  this.enabled_ = true;
};
goog.inherits(wtf.events.KeyboardScope, goog.Disposable);


/**
 * @override
 */
wtf.events.KeyboardScope.prototype.disposeInternal = function() {
  this.setEnabled(false);
  goog.base(this, 'disposeInternal');
};


/**
 * Gets a value indicating whether the keyboard scope is enabled.
 * @return {boolean} True if the shortcuts are enabled.
 */
wtf.events.KeyboardScope.prototype.isEnabled = function() {
  return this.enabled_;
};


/**
 * Sets the enabled state of the shortucts in the scope.
 * @param {boolean} value True to enable the shortcuts.
 */
wtf.events.KeyboardScope.prototype.setEnabled = function(value) {
  if (this.enabled_ == value) {
    return;
  }
  this.enabled_ = value;
  for (var n = 0; n < this.listeners_.length; n++) {
    var listener = this.listeners_[n];
    if (value) {
      this.keyboard_.addShortcut_(listener[0], listener[1], listener[2]);
    } else {
      this.keyboard_.removeShortcut_(listener[0], listener[1], listener[2]);
    }
  }
};


/**
 * Adds a callback to be executed on the given key press.
 * @param {string} shortcut Shortcut string (like 'ctrl+g').
 * @param {!function(this:T)} callback Callback function.
 * @param {T=} opt_scope Scope for the callback function.
 * @template T
 */
wtf.events.KeyboardScope.prototype.addShortcut = function(
    shortcut, callback, opt_scope) {
  this.listeners_.push([shortcut, callback, opt_scope]);
  if (this.enabled_) {
    this.keyboard_.addShortcut_(shortcut, callback, opt_scope);
  }
};


/**
 * Adds a command to be executed on the given key press.
 * @param {string} shortcut Shortcut string (like 'ctrl+g').
 * @param {string} commandName Command name.
 */
wtf.events.KeyboardScope.prototype.addCommandShortcut = function(
    shortcut, commandName) {
  function callback() {
    var commandManager = wtf.events.CommandManager.getShared();
    if (commandManager) {
      commandManager.execute(commandName, this, null);
    }
  };
  this.listeners_.push([shortcut, callback, this]);
  if (this.enabled_) {
    this.keyboard_.addShortcut_(shortcut, callback, this);
  }
};
