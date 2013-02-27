/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Benchmark file.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

var traceBaseEvent = wtf.trace.events.createInstance('traceBase');
benchmark.register('traceBase', function() {
  traceBaseEvent();
});

var traceInt8Event = wtf.trace.events.createInstance('traceInt8(int8 v)');
benchmark.register('traceInt8', function() {
  traceInt8Event(-123);
});
var traceInt8ArraySmallEvent = wtf.trace.events.createInstance('traceInt8ArraySmall(float32[] v)');
var traceInt8ArraySmall = new Int8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
benchmark.register('traceInt8ArraySmall', function() {
  traceInt8ArraySmallEvent(traceInt8ArraySmall);
});
var traceInt8ArrayLargeEvent = wtf.trace.events.createInstance('traceInt8ArrayLarge(float32[] v)');
var traceInt8ArrayLarge = new Int8Array(1024);
for (var n = 0; n < traceInt8ArrayLarge.length; n++) {
  traceInt8ArrayLarge[n] = (Math.random() * 1000) | 0;
}
benchmark.register('traceInt8ArrayLarge', function() {
  traceInt8ArrayLargeEvent(traceInt8ArrayLarge);
});


var traceUint8Event = wtf.trace.events.createInstance('traceUint8(uint8 v)');
benchmark.register('traceUint8', function() {
  traceUint8Event(123);
});
var traceUint8ArraySmallEvent = wtf.trace.events.createInstance('traceUint8ArraySmall(float32[] v)');
var traceUint8ArraySmall = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
benchmark.register('traceUint8ArraySmall', function() {
  traceUint8ArraySmallEvent(traceUint8ArraySmall);
});
var traceUint8ArrayLargeEvent = wtf.trace.events.createInstance('traceUint8ArrayLarge(float32[] v)');
var traceUint8ArrayLarge = new Uint8Array(1024);
for (var n = 0; n < traceUint8ArrayLarge.length; n++) {
  traceUint8ArrayLarge[n] = (Math.random() * 1000) | 0;
}
benchmark.register('traceUint8ArrayLarge', function() {
  traceUint8ArrayLargeEvent(traceUint8ArrayLarge);
});


var traceInt16Event = wtf.trace.events.createInstance('traceInt16(int16 v)');
benchmark.register('traceInt16', function() {
  traceInt16Event(-12345);
});
var traceInt16ArraySmallEvent = wtf.trace.events.createInstance('traceInt16ArraySmall(float32[] v)');
var traceInt16ArraySmall = new Int16Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
benchmark.register('traceInt16ArraySmall', function() {
  traceInt16ArraySmallEvent(traceInt16ArraySmall);
});
var traceInt16ArrayLargeEvent = wtf.trace.events.createInstance('traceInt16ArrayLarge(float32[] v)');
var traceInt16ArrayLarge = new Int16Array(1024);
for (var n = 0; n < traceInt16ArrayLarge.length; n++) {
  traceInt16ArrayLarge[n] = (Math.random() * 1000) | 0;
}
benchmark.register('traceInt16ArrayLarge', function() {
  traceInt16ArrayLargeEvent(traceInt16ArrayLarge);
});


var traceUint16Event = wtf.trace.events.createInstance('traceUint16(uint16 v)');
benchmark.register('traceUint16', function() {
  traceUint16Event(12345);
});
var traceUint16ArraySmallEvent = wtf.trace.events.createInstance('traceUint16ArraySmall(float32[] v)');
var traceUint16ArraySmall = new Uint16Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
benchmark.register('traceUint16ArraySmall', function() {
  traceUint16ArraySmallEvent(traceUint16ArraySmall);
});
var traceUint16ArrayLargeEvent = wtf.trace.events.createInstance('traceUint16ArrayLarge(float32[] v)');
var traceUint16ArrayLarge = new Uint16Array(1024);
for (var n = 0; n < traceUint16ArrayLarge.length; n++) {
  traceUint16ArrayLarge[n] = (Math.random() * 1000) | 0;
}
benchmark.register('traceUint16ArrayLarge', function() {
  traceUint16ArrayLargeEvent(traceUint16ArrayLarge);
});


var traceInt32Event = wtf.trace.events.createInstance('traceInt32(int32 v)');
benchmark.register('traceInt32', function() {
  traceInt32Event(-1234567);
});
var traceInt32ArraySmallEvent = wtf.trace.events.createInstance('traceInt32ArraySmall(float32[] v)');
var traceInt32ArraySmall = new Int32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
benchmark.register('traceInt32ArraySmall', function() {
  traceInt32ArraySmallEvent(traceInt32ArraySmall);
});
var traceInt32ArrayLargeEvent = wtf.trace.events.createInstance('traceInt32ArrayLarge(float32[] v)');
var traceInt32ArrayLarge = new Int32Array(1024);
for (var n = 0; n < traceInt32ArrayLarge.length; n++) {
  traceInt32ArrayLarge[n] = (Math.random() * 1000) | 0;
}
benchmark.register('traceInt32ArrayLarge', function() {
  traceInt32ArrayLargeEvent(traceInt32ArrayLarge);
});


var traceUint32Event = wtf.trace.events.createInstance('traceUint32(uint32 v)');
benchmark.register('traceUint32', function() {
  traceUint32Event(1234567);
});
var traceUint32ArraySmallEvent = wtf.trace.events.createInstance('traceUint32ArraySmall(float32[] v)');
var traceUint32ArraySmall = new Uint32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
benchmark.register('traceUint32ArraySmall', function() {
  traceUint32ArraySmallEvent(traceUint32ArraySmall);
});
var traceUint32ArrayLargeEvent = wtf.trace.events.createInstance('traceUint32ArrayLarge(float32[] v)');
var traceUint32ArrayLarge = new Uint32Array(1024);
for (var n = 0; n < traceUint32ArrayLarge.length; n++) {
  traceUint32ArrayLarge[n] = (Math.random() * 1000) | 0;
}
benchmark.register('traceUint32ArrayLarge', function() {
  traceUint32ArrayLargeEvent(traceUint32ArrayLarge);
});


var traceFloat32Event = wtf.trace.events.createInstance('traceFloat32(float32 v)');
benchmark.register('traceFloat32', function() {
  traceFloat32Event(123.4567);
});
var traceFloat32ArraySmallEvent = wtf.trace.events.createInstance('traceFloat32ArraySmall(float32[] v)');
var traceFloat32ArraySmall = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
benchmark.register('traceFloat32ArraySmall', function() {
  traceFloat32ArraySmallEvent(traceFloat32ArraySmall);
});
var traceFloat32ArrayLargeEvent = wtf.trace.events.createInstance('traceFloat32ArrayLarge(float32[] v)');
var traceFloat32ArrayLarge = new Float32Array(1024);
for (var n = 0; n < traceFloat32ArrayLarge.length; n++) {
  traceFloat32ArrayLarge[n] = Math.random();
}
benchmark.register('traceFloat32ArrayLarge', function() {
  traceFloat32ArrayLargeEvent(traceFloat32ArrayLarge);
});


var traceAsciiEvent = wtf.trace.events.createInstance('traceAscii(ascii v)');
benchmark.register('traceAscii1', function() {
  traceAsciiEvent('0');
});
benchmark.register('traceAscii10', function() {
  traceAsciiEvent('0123456789');
});
benchmark.register('traceAscii40', function() {
  traceAsciiEvent('0123456789012345678901234567890123456789');
});


var traceUtf8Event = wtf.trace.events.createInstance('traceUtf8(utf8 v)');
benchmark.register('traceUtf81', function() {
  traceUtf8Event('0');
});
benchmark.register('traceUtf810', function() {
  traceUtf8Event('0123456789');
});
benchmark.register('traceUtf840', function() {
  traceUtf8Event('0123456789012345678901234567890123456789');
});
