/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Shared context referencing session state.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.EventSessionContext');
goog.provide('wtf.trace.EventSessionContextType');


/**
 * Shared session context.
 * One of these is instantiated by the {@see wtf.trace.TraceManager} at startup
 * and bound to all generated event functions. That instance is kept the same
 * across all trace sessions that run, with only its contents changing.
 *
 * In order to make this easier to use from generated code it is just a simple
 * array with the elements inside of it. Use the static accessor methods to
 * manipulate it.
 */
wtf.trace.EventSessionContext = function() {};


/**
 * The event session context type.
 * @typedef {!Array}
 */
wtf.trace.EventSessionContextType;


/**
 * Creates a new context.
 * @return {!wtf.trace.EventSessionContextType} New context.
 */
wtf.trace.EventSessionContext.create = function() {
  return new Array(2);
};


/**
 * Initializes a context for the given session.
 * @param {!wtf.trace.EventSessionContextType} context Context.
 * @param {wtf.trace.Session} session Trace session, if any.
 */
wtf.trace.EventSessionContext.init = function(context, session) {
  context[0] = session;
};


/**
 * Sets the buffer on the context.
 * @param {!wtf.trace.EventSessionContextType} context Context.
 * @param {!wtf.io.BufferView.Type} bufferView New buffer.
 */
wtf.trace.EventSessionContext.setBuffer = function(context, bufferView) {
  context[1] = bufferView;
};
