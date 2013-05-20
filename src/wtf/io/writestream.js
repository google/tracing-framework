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
 * untouchable until the callback is issued.
 *
 * @param {!wtf.io.Buffer} buffer Buffer to write.
 * @param {!wtf.io.ReturnBufferCallback} returnBufferCallback A callback that
 *     will be issued as soon as the buffer is available for use again.
 * @param {Object=} opt_selfObj 'this' context for the callback.
 */
wtf.io.WriteStream.prototype.write = goog.abstractMethod;


/**
 * Flushes the stream.
 */
wtf.io.WriteStream.prototype.flush = goog.abstractMethod;
