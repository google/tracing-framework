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

goog.provide('wtf.ui.CommandManager');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.provide('wtf.ui.ICommand');



/**
 * Dispatches commands.
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.ui.CommandManager = function() {
  goog.base(this);

  /**
   * All registered commands mapped by command name.
   * @type {!Object.<!wtf.ui.ICommand>}
   * @private
   */
  this.commands_ = {};
};
goog.inherits(wtf.ui.CommandManager, goog.Disposable);


/**
 * Registers a command that can be executed.
 * @param {!wtf.ui.ICommand} command Command.
 */
wtf.ui.CommandManager.prototype.registerCommand = function(command) {
  var name = command.getName();
  goog.asserts.assert(!this.commands_[name]);
  this.commands_[name] = command;
};


/**
 * Registers a simple command callback.
 * Simple command callbacks are always executable.
 * @param {string} name Command name.
 * @param {function(this:T, Object, Object, ...*)} callback Callback that
 *     receives the source, target, and any optional arguments.
 * @param {T=} opt_scope Callback scope.
 * @template T
 */
wtf.ui.CommandManager.prototype.registerSimpleCommand = function(
    name, callback, opt_scope) {
  this.registerCommand(new wtf.ui.SimpleCommand_(
      name, callback, opt_scope));
};


/**
 * Checks to see whether the given command can be executed.
 * @param {string} name Command name.
 * @return {boolean} True if the command can be executed.
 */
wtf.ui.CommandManager.prototype.canExecute = function(name) {
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
wtf.ui.CommandManager.prototype.execute = function(
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
 * A command that can be executed.
 * @interface
 */
wtf.ui.ICommand = function() {};


/**
 * Gets the comamnd name used for dispatching.
 * @return {string} The command name.
 */
wtf.ui.ICommand.prototype.getName = goog.nullFunction;


/**
 * Whether the command can be executed.
 * @return {boolean} True if the command can be executed.
 */
wtf.ui.ICommand.prototype.canExecute = goog.nullFunction;


/**
 * Executes the command.
 * @param {Object} source Source of the command.
 * @param {Object} target Target of the command.
 * @param {...*} var_args Optional arguments.
 */
wtf.ui.ICommand.prototype.execute = goog.nullFunction;



/**
 * Simple command.
 * @param {string} name Command name.
 * @param {function(this:T, Object, Object, ...*)} callback Callback that
 *     receives the source, target, and any optional arguments.
 * @param {T=} opt_scope Callback scope.
 * @template T
 * @constructor
 * @implements {wtf.ui.ICommand}
 * @private
 */
wtf.ui.SimpleCommand_ = function(name, callback, opt_scope) {
  /**
   * Command name.
   * @type {string}
   * @private
   */
  this.name_ = name;

  /**
   * Callback.
   * @type {function(this:T, !Object, !Object, ...*)}
   * @private
   */
  this.callback_ = callback;

  /**
   * Callback scope.
   * @type {T?}
   * @private
   */
  this.scope_ = opt_scope || null;
};


/**
 * @override
 */
wtf.ui.SimpleCommand_.prototype.getName = function() {
  return this.name_;
};


/**
 * @override
 */
wtf.ui.SimpleCommand_.prototype.canExecute = function() {
  return true;
};


/**
 * @override
 */
wtf.ui.SimpleCommand_.prototype.execute = function(source, target, var_args) {
  this.callback_.apply(this.scope_, arguments);
};
