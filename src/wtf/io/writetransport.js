/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Transport abstract base types.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.WriteTransport');

goog.require('wtf.events.EventEmitter');



/**
 * Write-only transport base type.
 * A transport is the lowest-level primitive for IO. It provides a normalized
 * reading/writing API for a resource such as a URL endpoint or file.
 *
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.io.WriteTransport = function() {
  goog.base(this);

  /**
   * Whether the transport was created by the library and should be disposed
   * when done with.
   * @type {boolean}
   */
  this.needsLibraryDispose = false;
};
goog.inherits(wtf.io.WriteTransport, wtf.events.EventEmitter);


/**
 * @override
 */
wtf.io.WriteTransport.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
};


/**
 * Writes data to the transport.
 * @param {!wtf.io.BlobData} data Data to write.
 */
wtf.io.WriteTransport.prototype.write = goog.abstractMethod;


/**
 * Flushes any pending buffers to the target.
 */
wtf.io.WriteTransport.prototype.flush = goog.abstractMethod;
