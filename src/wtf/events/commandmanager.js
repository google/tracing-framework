/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Command manager.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.events.CommandManager');
goog.provide('wtf.events.ICommand');

goog.require('goog.Disposable');
goog.require('goog.asserts');



/**
 * Dispatches commands.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.events.CommandManager = function() {
  goog.base(this);

  /**
   * All registered commands mapped by command name.
   * @type {!Object.<!wtf.events.ICommand>}
   * @private
   */
  this.commands_ = {};
};
goog.inherits(wtf.events.CommandManager, goog.Disposable);


/**
 * Registers a command that can be executed.
 * @param {!wtf.events.ICommand} command Command.
 */
wtf.events.CommandManager.prototype.registerCommand = function(command) {
  var name = command.getName();
  goog.asserts.assert(!this.commands_[name]);
  this.commands_[name] = command;
};


/**
 * Registers a simple command callback.
 * Simple command callbacks are always executable.
 * @param {string} name Command name.
 * @param {function(this:T, Object, Object, ...)} callback Callback that
 *     receives the source, target, and any optional arguments.
 * @param {T=} opt_scope Callback scope.
 * @template T
 */
wtf.events.CommandManager.prototype.registerSimpleCommand = function(
    name, callback, opt_scope) {
  this.registerCommand(new wtf.events.SimpleCommand_(
      name, callback, opt_scope));
};


/**
 * Unregisters the command with the given name, if it exists.
 * @param {string} name Command name.
 */
wtf.events.CommandManager.prototype.unregisterCommand = function(name) {
  delete this.commands_[name];
};


/**
 * Checks to see whether the given command can be executed.
 * @param {string} name Command name.
 * @return {boolean} True if the command can be executed.
 */
wtf.events.CommandManager.prototype.canExecute = function(name) {
  var command = this.commands_[name];
  return command && command.canExecute();
};


/**
 * Executes the command with the given name.
 * @param {string} name Command name.
 * @param {Object} source Source.
 * @param {Object} target Target.
 * @param {...*} var_args Optional arguments.
 */
wtf.events.CommandManager.prototype.execute = function(
    name, source, target, var_args) {
  var command = this.commands_[name];
  if (command && command.canExecute()) {
    var args = [];
    for (var n = 1; n < arguments.length; n++) {
      args.push(arguments[n]);
    }
    command.execute.apply(command, args);
  }
};


/**
 * Shared command manager instance, if any.
 * @type {wtf.events.CommandManager}
 * @private
 */
wtf.events.CommandManager.sharedInstance_ = null;


/**
 * Gets the shared command manager.
 * @return {wtf.events.CommandManager} Shared command manager, if any.
 */
wtf.events.CommandManager.getShared = function() {
  return wtf.events.CommandManager.sharedInstance_;
};


/**
 * Sets the shared command manager.
 * Any existing command manager will be disposed.
 * @param {wtf.events.CommandManager} value New command manager, if any.
 */
wtf.events.CommandManager.setShared = function(value) {
  var oldValue = wtf.events.CommandManager.sharedInstance_;
  if (oldValue == value) {
    return;
  }
  goog.dispose(oldValue);
  wtf.events.CommandManager.sharedInstance_ = value;
};



/**
 * A command that can be executed.
 * @interface
 */
wtf.events.ICommand = function() {};


/**
 * Gets the comamnd name used for dispatching.
 * @return {string} The command name.
 */
wtf.events.ICommand.prototype.getName = goog.nullFunction;


/**
 * Whether the command can be executed.
 * @return {boolean} True if the command can be executed.
 */
wtf.events.ICommand.prototype.canExecute = goog.nullFunction;


/**
 * Executes the command.
 * @param {Object} source Source of the command.
 * @param {Object} target Target of the command.
 * @param {...*} var_args Optional arguments.
 */
wtf.events.ICommand.prototype.execute = goog.nullFunction;



/**
 * Simple command.
 * @param {string} name Command name.
 * @param {function(this:T, Object, Object, ...)} callback Callback that
 *     receives the source, target, and any optional arguments.
 * @param {T=} opt_scope Callback scope.
 * @template T
 * @constructor
 * @implements {wtf.events.ICommand}
 * @private
 */
wtf.events.SimpleCommand_ = function(name, callback, opt_scope) {
  /**
   * Command name.
   * @type {string}
   * @private
   */
  this.name_ = name;

  /**
   * Callback.
   * @type {function(!Object, !Object, ...)}
   * @private
   */
  this.callback_ = callback;

  /**
   * Callback scope.
   * @type {Object}
   * @private
   */
  this.scope_ = opt_scope || null;
};


/**
 * @override
 */
wtf.events.SimpleCommand_.prototype.getName = function() {
  return this.name_;
};


/**
 * @override
 */
wtf.events.SimpleCommand_.prototype.canExecute = function() {
  return true;
};


/**
 * @override
 */
wtf.events.SimpleCommand_.prototype.execute = function(
    source, target, var_args) {
  this.callback_.apply(this.scope_, arguments);
};
