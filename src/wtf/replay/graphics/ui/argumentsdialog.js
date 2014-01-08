/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview A dialog screen that allows users to alter event arguments.
 *
 * @author chizeng@google.com (Chi Zeng)
 */

goog.provide('wtf.replay.graphics.ui.ArgumentsDialog');

goog.require('goog.asserts');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.dom.forms');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('goog.soy');
goog.require('goog.string');
goog.require('wtf.events.Keyboard');
goog.require('wtf.replay.graphics.ui.argumentsdialog');
goog.require('wtf.ui.Dialog');



/**
 * A dialog that lets users manipulate arguments of events.
 *
 * @param {!wtf.db.EventIterator} it Iterator pointing to the relevant event.
 * @param {!goog.dom.DomHelper} dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Dialog}
 */
wtf.replay.graphics.ui.ArgumentsDialog = function(it, dom) {
  goog.base(this, {
    modal: true
  }, /** @type {!Element} */ (dom.getDocument().body), dom);

  // The iterator must point to an event.
  goog.asserts.assert(!it.done());

  /**
   * The iterator pointing to the current event.
   * @type {!wtf.db.EventIterator}
   * @private
   */
  this.eventIterator_ = it;

  // Create the form based on the event.
  this.createForm_();

  var keyboard = wtf.events.Keyboard.getWindowKeyboard();
  keyboard.suspend();
};
goog.inherits(wtf.replay.graphics.ui.ArgumentsDialog, wtf.ui.Dialog);


/**
 * @override
 */
wtf.replay.graphics.ui.ArgumentsDialog.prototype.disposeInternal = function() {
  var keyboard = wtf.events.Keyboard.getWindowKeyboard();
  keyboard.resume();
  goog.base(this, 'disposeInternal');
};


/**
 * Events related to the arguments-changing dialog.
 * @enum {string}
 */
wtf.replay.graphics.ui.ArgumentsDialog.EventType = {
  /**
   * Arguments were altered. A reset does not count.
   */
  ARGUMENTS_ALTERED: goog.events.getUniqueId('arguments_altered'),

  /**
   * Arguments were reset to their original ones.
   */
  ARGUMENTS_RESET: goog.events.getUniqueId('arguments_reset')
};


/**
 * @override
 */
wtf.replay.graphics.ui.ArgumentsDialog.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.replay.graphics.ui.argumentsdialog.control, null, dom));
};


/**
 * Create the form that lets users alter arguments.
 * @private
 */
wtf.replay.graphics.ui.ArgumentsDialog.prototype.createForm_ = function() {
  var domHelper = this.getDom();
  var eventHandler = this.getHandler();

  var formTitle = /** @type {Element} */ (this.getChildElement(
      goog.getCssName('title')));
  domHelper.setTextContent(
      formTitle, 'Editing ' + this.eventIterator_.getName());

  // Listen for form submission events.
  var form = /** @type {HTMLFormElement} */ (this.getChildElement(
      goog.getCssName('form')));
  var saveButton = this.getChildElement(
      goog.getCssName('saveArgumentsButton'));
  var saveFunction = function(e) {
    e.preventDefault();
    this.updateArguments_(goog.dom.forms.getFormDataMap(form));
  };

  // Save the new arguments when either the update button is clicked or Enter
  // is hit.
  eventHandler.listen(saveButton, goog.events.EventType.CLICK,
      saveFunction, false, this);
  eventHandler.listen(form, goog.events.EventType.SUBMIT,
      saveFunction, false, this);

  // Create label/input pair elements based on the type of value.
  var inputsContainer = domHelper.getElementByClass(
      goog.getCssName('dialogFields'));
  var argumentValues = this.eventIterator_.getArguments();
  for (var key in argumentValues) {
    var labelInputPair = this.createLabelInputPair_(key, argumentValues[key]);
    domHelper.appendChild(inputsContainer, labelInputPair);
  }

  // Create the reset arguments button.
  var resetArgumentsElement = domHelper.getElementByClass(
      goog.getCssName('resetArgumentsButton'));
  eventHandler.listen(resetArgumentsElement,
      goog.events.EventType.CLICK, function() {
        this.resetArguments_();
      }, false, this);

  // Create the cancel button.
  var cancelButton = domHelper.getElementByClass(
      goog.getCssName('cancelButton'), this.getRootElement());
  eventHandler.listen(cancelButton,
      goog.events.EventType.CLICK, function() {
        this.close();
      }, false, this);
};


/**
 * Resets the arguments of the event. Then, fires the appropriate event and
 * closes the dialog.
 * @private
 */
wtf.replay.graphics.ui.ArgumentsDialog.prototype.resetArguments_ = function() {
  this.eventIterator_.resetArguments();
  this.emitEvent(
      wtf.replay.graphics.ui.ArgumentsDialog.EventType.ARGUMENTS_RESET);
  this.close();
};


/**
 * Updates the arguments of the event. Then, fires the appropriate event and
 * closes the dialog.
 * @param {!goog.structs.Map} newArgumentMap A mapping from the keys of any
 *     updated arguments to their new values.
 * @private
 */
wtf.replay.graphics.ui.ArgumentsDialog.prototype.updateArguments_ =
    function(newArgumentMap) {
  var it = this.eventIterator_;
  var originalArguments = it.getArguments();

  // Make a copy of the arguments, and update if need be.
  var newArguments = goog.object.clone(originalArguments);
  for (var key in originalArguments) {
    // Update the argument based on its type.
    switch (typeof originalArguments[key]) {
      case 'number':
        var newValue = /** @type {string} */ (newArgumentMap.get(key));
        newArguments[key] = goog.string.parseInt(newValue);
        break;
      case 'string':
        newArguments[key] = newArgumentMap.get(key)[0];
        break;
      default:
        break;
    }
  }

  it.setArguments(newArguments);
  this.emitEvent(
      wtf.replay.graphics.ui.ArgumentsDialog.EventType.ARGUMENTS_ALTERED);
  this.close();
};


/**
 * Creates an field / input pair given a type of argument.
 * @param {string} key The argument key.
 * @param {*} value The value of the argument.
 * @return {!Element} The label / input pair pertaining to an argument.
 * @private
 */
wtf.replay.graphics.ui.ArgumentsDialog.prototype.createLabelInputPair_ =
    function(key, value) {
  var domHelper = this.getDom();
  var labelInputPair = /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.replay.graphics.ui.argumentsdialog.argumentkeyvaluepair,
      {argumentKey: key}, domHelper));
  var inputContainer = domHelper.getElementByClass(
      goog.getCssName('graphicsReplayArgumentsDialogInputContainer'),
      labelInputPair);

  // Vary how to display the input based on the type of the value.
  var inputElement;

  // TODO(chizeng): Find a more reliable way of determining type than typeof.
  switch (typeof value) {
    case 'number':
      inputElement = domHelper.createElement(goog.dom.TagName.INPUT);
      inputElement.name = key;
      inputElement.type = 'text';
      goog.dom.classes.add(inputElement, goog.getCssName('kTextField'));
      inputElement.value = value;
      break;
    case 'string':
      inputElement = domHelper.createElement(goog.dom.TagName.TEXTAREA);
      inputElement.name = key;
      domHelper.setTextContent(inputElement, value);
      break;
    default:
      inputElement = domHelper.createElement(goog.dom.TagName.P);
      goog.dom.classes.add(inputElement, goog.getCssName('dataDumpText'));

      // Unsupported argument type. Use JSON to make a pretty string to print.
      domHelper.setTextContent(inputElement, goog.global.JSON.stringify(value));
      break;
  }
  domHelper.appendChild(inputContainer, inputElement);

  return labelInputPair;
};
