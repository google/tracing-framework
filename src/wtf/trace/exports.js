/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Tracing API exports.
 * This file will export a bunch of public symbols allowing for use of the
 * tracing library from non-Closure code. The master enable define must be set
 * to true to enable this so that the exports are not performed when in
 * Closurized code.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.exports');

goog.require('wtf.trace');
goog.require('wtf.trace.Flow');
goog.require('wtf.trace.events');
goog.require('wtf.trace.instrument');
goog.require('wtf.trace.instrumentType');
goog.require('wtf.trace.providers');


// This is a hack, but required to get things registered without cycles.
wtf.trace.providers.setup();


/**
 * @define {boolean} Whether to enable exporting of the wtf.trace
 *     types and namespace.
 *
 * This should only be enabled in builds of the standalone library. If you're
 * including this code with it enabled in Closurized javascript then you'll
 * prevent renaming.
 */
wtf.trace.exports.ENABLE_EXPORTS = false;


if (wtf.trace.exports.ENABLE_EXPORTS) {
  // wtf.trace.prepare
  goog.exportSymbol(
      'wtf.trace.prepare',
      wtf.trace.prepare);
  goog.exportSymbol(
      'wtf.trace.shutdown',
      wtf.trace.shutdown);

  // wtf.trace session control
  goog.exportSymbol(
      'wtf.trace.start',
      wtf.trace.start);
  goog.exportSymbol(
      'wtf.trace.snapshot',
      wtf.trace.snapshot);
  goog.exportSymbol(
      'wtf.trace.stop',
      wtf.trace.stop);

  // wtf.trace event manipulation
  goog.exportSymbol(
      'wtf.trace.events.createInstance',
      wtf.trace.events.createInstance);
  goog.exportSymbol(
      'wtf.trace.events.createScope',
      wtf.trace.events.createScope);

  // wtf.trace zone operations
  goog.exportSymbol(
      'wtf.trace.createZone',
      wtf.trace.createZone);
  goog.exportSymbol(
      'wtf.trace.deleteZone',
      wtf.trace.deleteZone);
  goog.exportSymbol(
      'wtf.trace.pushZone',
      wtf.trace.pushZone);
  goog.exportSymbol(
      'wtf.trace.popZone',
      wtf.trace.popZone);

  // wtf.trace scope operations
  goog.exportSymbol(
      'wtf.trace.enterScope',
      wtf.trace.enterScope);
  goog.exportSymbol(
      'wtf.trace.enterTracingScope',
      wtf.trace.enterTracingScope);

  // wtf.trace flow operations
  goog.exportSymbol(
      'wtf.trace.branchFlow',
      wtf.trace.branchFlow);
  goog.exportSymbol(
      'wtf.trace.clearFlow',
      wtf.trace.clearFlow);
  goog.exportSymbol(
      'wtf.trace.spanFlow',
      wtf.trace.spanFlow);

  // wtf.trace logging operations
  goog.exportSymbol(
      'wtf.trace.mark',
      wtf.trace.mark);

  // wtf.trace utilities
  goog.exportSymbol(
      'wtf.trace.ignoreListener',
      wtf.trace.ignoreListener);

  // wtf.trace.Flow
  goog.exportProperty(
      wtf.trace.Flow.prototype,
      'getId',
      wtf.trace.Flow.prototype.getId);
  goog.exportProperty(
      wtf.trace.Flow.prototype,
      'extend',
      wtf.trace.Flow.prototype.extend);
  goog.exportProperty(
      wtf.trace.Flow.prototype,
      'terminate',
      wtf.trace.Flow.prototype.terminate);

  // Instrumentation utilities
  if (!COMPILED) {
    goog.exportSymbol(
        'wtf.trace.base',
        wtf.trace.base);
  }
  goog.exportSymbol(
      'wtf.trace.instrument',
      wtf.trace.instrument);
  goog.exportSymbol(
      'wtf.trace.instrumentType',
      wtf.trace.instrumentType);
  goog.exportSymbol(
      'wtf.trace.instrumentTypeSimple',
      wtf.trace.instrumentTypeSimple);
}
