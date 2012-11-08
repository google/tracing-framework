/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Write-only stream base type.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.WriteStream');

goog.require('goog.Disposable');



/**
 * Abstract write-only binary data stream.
 *
 * @constructor
 * @extends {goog.Disposable}
 */
wtf.io.WriteStream = function() {
  goog.base(this);
};
goog.inherits(wtf.io.WriteStream, goog.Disposable);


/**
 * Writes the given buffer to the stream.
 * Depending on the implementation this method may require the buffer for
 * a long period of time. Callers should assume the buffer is completely
 * untouchable until the callback is issued unless the function returns true
 * indicating that the buffer was written immediately. If the write is immediate
 * then the callback is never called.
 *
 * @param {!wtf.io.Buffer} buffer Buffer to write.
 * @param {!wtf.io.ReturnBufferCallback} returnBufferCallback A callback that
 *     will be issued as soon as the buffer is available for use again. This
 *     will only be called if the function returns false.
 * @param {Object=} opt_selfObj 'this' context for the callback.
 * @return {boolean} True if the buffer was written immediately and can be
 *     reused. If false then the buffer is in use and cannot be reused until the
 *     callback is issued. If true then the buffer can be used right away and
 *     the callback will not be fired.
 */
wtf.io.WriteStream.prototype.write = goog.abstractMethod;


/**
 * Flushes the stream.
 */
wtf.io.WriteStream.prototype.flush = goog.abstractMethod;
