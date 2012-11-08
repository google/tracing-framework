/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Input event target interface.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.ui.zoom.ITarget');



/**
 * Interface for input event sinks.
 * @interface
 */
wtf.ui.zoom.ITarget = function() {};


/**
 * Mouse button going down.
 * @param {number} x Control-relative x.
 * @param {number} y Control-relative y.
 * @param {goog.events.BrowserEvent.MouseButton} button Mouse button going down.
 * @return {boolean} Whether the event was handled and should not be propagated.
 */
wtf.ui.zoom.ITarget.prototype.mouseDown = goog.nullFunction;


/**
 * Mouse button going up.
 * @param {number} x Control-relative x.
 * @param {number} y Control-relative y.
 * @param {goog.events.BrowserEvent.MouseButton} button Mouse button going up.
 * @return {boolean} Whether the event was handled and should not be propagated.
 */
wtf.ui.zoom.ITarget.prototype.mouseUp = goog.nullFunction;


/**
 * Resets the mouse origin.
 * @param {number} x Control-relative x.
 * @param {number} y Control-relative y.
 */
wtf.ui.zoom.ITarget.prototype.mouseReset = goog.nullFunction;


/**
 * Mouse going out of the control.
 * @return {boolean} Whether the event was handled and should not be propagated.
 */
wtf.ui.zoom.ITarget.prototype.mouseOut = goog.nullFunction;


/**
 * Mouse moving inside the control.
 * @param {number} x Control-relative x.
 * @param {number} y Control-relative y.
 * @return {boolean} Whether the event was handled and should not be propagated.
 */
wtf.ui.zoom.ITarget.prototype.mouseMove = goog.nullFunction;


/**
 * Mouse wheel changing.
 * @param {number} x Control-relative x.
 * @param {number} y Control-relative y.
 * @param {number} z Mouse wheel delta.
 * @return {boolean} Whether the event was handled and should not be propagated.
 */
wtf.ui.zoom.ITarget.prototype.mouseWheel = goog.nullFunction;
