/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

goog.provide('wtf.tests.EventBuffers_test');

goog.require('wtf.data.EventClass');
goog.require('wtf.data.Variable');
goog.require('wtf.db.EventType');
goog.require('wtf.db.EventTypeBuilder');
goog.require('wtf.io.BufferView');
goog.require('wtf.trace.EventType');
goog.require('wtf.trace.EventTypeBuilder');


/**
 * Round-trip testing for event buffers.
 */
wtf.tests.EventBuffers_test = suite('wtf.tests.EventBuffers', function() {
  var writeBuilder = new wtf.trace.EventTypeBuilder();
  var readBuilder = new wtf.db.EventTypeBuilder();
  var ctx = [{}, null];

  function setupTestEvent(signature) {
    wtf.trace.EventType.nextEventWireId_ = 1;

    var parsedSignature = wtf.data.Variable.parseSignature(signature);
    var name = parsedSignature.name;
    var args = parsedSignature.args;
    var writeType = new wtf.trace.EventType(
        name + '_write', wtf.data.EventClass.INSTANCE, 0, args);
    var readType = new wtf.db.EventType(
        name + '_read', wtf.data.EventClass.INSTANCE, 0, args);
    return {
      name: name,
      args: args,
      writeType: writeType,
      readType: readType,
      write: writeBuilder.generate(ctx, writeType),
      read: readBuilder.generate(readType)
    };
  };

  test('basic', function() {
    var bufferView = wtf.io.BufferView.createEmpty(1024 * 1024);

    // Write event.
    var ev = setupTestEvent('basic()');
    ev.write(1234567, bufferView);

    // Compare buffer contents.
    assert.equal(wtf.io.BufferView.getOffset(bufferView), 8);
    assert.arraysEqual(wtf.io.BufferView.getUsedBytes(bufferView),
        [1, 0, 0, 0, 88, 255, 149, 73]);

    // Read event and compare argument values.
    wtf.io.BufferView.setOffset(bufferView, 8);
    assert.deepEqual(ev.read(bufferView), {});
  });

  test('capacity', function() {
    var bufferView = wtf.io.BufferView.createEmpty(16);
    var ev = setupTestEvent(
        'capacity(uint8[] ui)');
    ev.write(
        new Uint8Array([1, 2, 3, 4]),
        1234567, bufferView);
    assert.arraysEqual(wtf.io.BufferView.getUsedBytes(bufferView),
        [1, 0, 0, 0, 88, 255, 149, 73, 4, 0, 0, 0, 1, 2, 3, 4]);
    assert.equal(wtf.io.BufferView.getOffset(bufferView), 16);
  });

  test('mixed', function() {
    var bufferView = wtf.io.BufferView.createEmpty(1024);
    var ev = setupTestEvent(
        'mixed(int8 a, int32[] b, uint16 c, utf8 d, int8[] e)');
    ev.write(
        -34,
        new Int32Array([-100000, -200000]),
        53399,
        'abcd',
        new Int8Array([12, -44, 22]),
        1234567, bufferView);
    assert.arraysEqual(wtf.io.BufferView.getUsedBytes(bufferView),
        [1, 0, 0, 0, 88, 255, 149, 73, 222, 0, 0, 0, 2, 0, 0, 0, 96, 121, 254, 255, 192, 242, 252, 255, 151, 208, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 12, 212, 22, 0]);
    wtf.io.BufferView.setOffset(bufferView, 8);
    assert.deepEqual(ev.read(bufferView), {
      'a': -34,
      'b': new Int32Array([-100000, -200000]),
      'c': 53399,
      'd': 'abcd',
      'e': new Int8Array([12, -44, 22])
    });
  });

  test('primitiveArgInt8', function() {
    var bufferView = wtf.io.BufferView.createEmpty(1024);
    var ev = setupTestEvent(
        'primitiveArgInt8(int8 i, uint8 ui, uint8 ui_o)');
    ev.write(-8, 250, 0xDEADBEEF, 1234567, bufferView);
    assert.arraysEqual(wtf.io.BufferView.getUsedBytes(bufferView),
        [1, 0, 0, 0, 88, 255, 149, 73, 248, 0, 0, 0, 250, 0, 0, 0, 239, 0, 0, 0]);
    wtf.io.BufferView.setOffset(bufferView, 8);
    assert.deepEqual(ev.read(bufferView), {
      'i': -8,
      'ui': 250,
      'ui_o': 0xEF
    });
  });

  test('primitiveArgInt8Array', function() {
    var bufferView = wtf.io.BufferView.createEmpty(1024);
    var ev = setupTestEvent(
        'primitiveArgInt8Array(int8[] i, uint8[] ui, uint8[] ui_null)');
    ev.write(
        new Int8Array([-1, -2, -3, -4]),
        new Uint8Array([200, 201, 202]),
        null,
        1234567, bufferView);
    assert.arraysEqual(wtf.io.BufferView.getUsedBytes(bufferView),
        [1, 0, 0, 0, 88, 255, 149, 73, 4, 0, 0, 0, 255, 254, 253, 252, 3, 0, 0, 0, 200, 201, 202, 0, 255, 255, 255, 255]);
    wtf.io.BufferView.setOffset(bufferView, 8);
    assert.deepEqual(ev.read(bufferView), {
      'i': new Int8Array([-1, -2, -3, -4]),
      'ui': new Uint8Array([200, 201, 202]),
      'ui_null': null
    });
  });

  test('primitiveArgInt16', function() {
    var bufferView = wtf.io.BufferView.createEmpty(1024);
    var ev = setupTestEvent(
        'primitiveArgInt16(int16 i, uint16 ui, uint16 ui_o)');
    ev.write(-8003, 21250, 0xDEADBEEF, 1234567, bufferView);
    assert.arraysEqual(wtf.io.BufferView.getUsedBytes(bufferView),
        [1, 0, 0, 0, 88, 255, 149, 73, 189, 224, 0, 0, 2, 83, 0, 0, 239, 190, 0, 0]);
    wtf.io.BufferView.setOffset(bufferView, 8);
    assert.deepEqual(ev.read(bufferView), {
      'i': -8003,
      'ui': 21250,
      'ui_o': 0xBEEF
    });
  });

  test('primitiveArgInt16Array', function() {
    var bufferView = wtf.io.BufferView.createEmpty(1024);
    var ev = setupTestEvent(
        'primitiveArgInt16Array(int16[] i, uint16[] ui, uint16[] ui_null)');
    ev.write(
        new Int16Array([-1000, -2000, -3000, -4000]),
        new Uint16Array([20000, 20100, 20200]),
        null,
        1234567, bufferView);
    assert.arraysEqual(wtf.io.BufferView.getUsedBytes(bufferView),
        [1, 0, 0, 0, 88, 255, 149, 73, 4, 0, 0, 0, 24, 252, 48, 248, 72, 244, 96, 240, 3, 0, 0, 0, 32, 78, 132, 78, 232, 78, 0, 0, 255, 255, 255, 255]);
    wtf.io.BufferView.setOffset(bufferView, 8);
    assert.deepEqual(ev.read(bufferView), {
      'i': new Int16Array([-1000, -2000, -3000, -4000]),
      'ui': new Uint16Array([20000, 20100, 20200]),
      'ui_null': null
    });
  });

  test('primitiveArgInt32', function() {
    var bufferView = wtf.io.BufferView.createEmpty(1024);
    var ev = setupTestEvent(
        'primitiveArgInt32(int32 i, uint32 ui)');
    ev.write(-338003, 0xFEEDBEEF, 1234567, bufferView);
    assert.arraysEqual(wtf.io.BufferView.getUsedBytes(bufferView),
        [1, 0, 0, 0, 88, 255, 149, 73, 173, 215, 250, 255, 239, 190, 237, 254]);
    wtf.io.BufferView.setOffset(bufferView, 8);
    assert.deepEqual(ev.read(bufferView), {
      'i': -338003,
      'ui': 0xFEEDBEEF
    });
  });

  test('primitiveArgInt32Array', function() {
    var bufferView = wtf.io.BufferView.createEmpty(1024);
    var ev = setupTestEvent(
        'primitiveArgInt32Array(int32[] i, uint32[] ui, uint32[] ui_null)');
    ev.write(
        new Int32Array([-100000, -200000, -300000, -400000]),
        new Uint32Array([2000000, 2010000, 2020000]),
        null,
        1234567, bufferView);
    assert.arraysEqual(wtf.io.BufferView.getUsedBytes(bufferView),
        [1, 0, 0, 0, 88, 255, 149, 73, 4, 0, 0, 0, 96, 121, 254, 255, 192, 242, 252, 255, 32, 108, 251, 255, 128, 229, 249, 255, 3, 0, 0, 0, 128, 132, 30, 0, 144, 171, 30, 0, 160, 210, 30, 0, 255, 255, 255, 255]);
    wtf.io.BufferView.setOffset(bufferView, 8);
    assert.deepEqual(ev.read(bufferView), {
      'i': new Int32Array([-100000, -200000, -300000, -400000]),
      'ui': new Uint32Array([2000000, 2010000, 2020000]),
      'ui_null': null
    });
  });

  test('primitiveArgFloat32', function() {
    var bufferView = wtf.io.BufferView.createEmpty(1024);
    var ev = setupTestEvent(
        'primitiveArgFloat32(float32 f)');
    ev.write(-123.456, 1234567, bufferView);
    assert.arraysEqual(wtf.io.BufferView.getUsedBytes(bufferView),
        [1, 0, 0, 0, 88, 255, 149, 73, 121, 233, 246, 194]);
    wtf.io.BufferView.setOffset(bufferView, 8);
    var args = ev.read(bufferView);
    assert.equal(args['f'].toFixed(3), '-123.456');
  });

  test('primitiveArgFloat32Array', function() {
    var bufferView = wtf.io.BufferView.createEmpty(1024);
    var ev = setupTestEvent(
        'primitiveArgFloat32Array(float32[] f, float32[] f_null)');
    ev.write(
        new Float32Array([-1.567, -2.567, -3.567, -4.567]),
        null,
        1234567, bufferView);
    assert.arraysEqual(wtf.io.BufferView.getUsedBytes(bufferView),
        [1, 0, 0, 0, 88, 255, 149, 73, 4, 0, 0, 0, 117, 147, 200, 191, 186, 73, 36, 192, 186, 73, 100, 192, 221, 36, 146, 192, 255, 255, 255, 255]);
    wtf.io.BufferView.setOffset(bufferView, 8);
    var args = ev.read(bufferView);
    assert.equal(args['f'][0].toFixed(3), '-1.567');
    assert.equal(args['f'][1].toFixed(3), '-2.567');
    assert.equal(args['f'][2].toFixed(3), '-3.567');
    assert.equal(args['f'][3].toFixed(3), '-4.567');
    assert.equal(args['f_null'], null);
  });

  test('primitiveArgString', function() {
    var bufferView = wtf.io.BufferView.createEmpty(1024);
    var ev = setupTestEvent(
        'primitiveArgString(utf8 s, utf8 s_empty, utf8 s_null)');
    ev.write('abcd', '', null, 1234567, bufferView);
    assert.arraysEqual(wtf.io.BufferView.getUsedBytes(bufferView),
        [1, 0, 0, 0, 88, 255, 149, 73, 0, 0, 0, 0, 254, 255, 255, 255, 255, 255, 255, 255]);
    wtf.io.BufferView.setOffset(bufferView, 8);
    assert.deepEqual(ev.read(bufferView), {
      's': 'abcd',
      's_empty': '',
      's_null': null
    });
  });

  test('primitiveArgChar', function() {
    var bufferView = wtf.io.BufferView.createEmpty(1024);
    var ev = setupTestEvent(
        'primitiveArgChar(char c, char[] s, char[] s_empty, char[] s_null)');
    ev.write('a', 'abcd', '', null, 1234567, bufferView);
    assert.arraysEqual(wtf.io.BufferView.getUsedBytes(bufferView),
        [1, 0, 0, 0, 88, 255, 149, 73, 97, 0, 0, 0, 4, 0, 0, 0, 97, 98, 99, 100, 0, 0, 0, 0, 255, 255, 255, 255]);
    wtf.io.BufferView.setOffset(bufferView, 8);
    assert.deepEqual(ev.read(bufferView), {
      'c': 'a',
      's': 'abcd',
      's_empty': '',
      's_null': null
    });
  });

  test('primitiveArgWchar', function() {
    var bufferView = wtf.io.BufferView.createEmpty(1024);
    var ev = setupTestEvent(
        'primitiveArgWchar(wchar c, wchar[] s, wchar[] s_empty, wchar[] s_null)');
    ev.write('⁂', '⇱⇲↺↻', '', null, 1234567, bufferView);
    assert.arraysEqual(wtf.io.BufferView.getUsedBytes(bufferView),
        [1, 0, 0, 0, 88, 255, 149, 73, 66, 32, 0, 0, 4, 0, 0, 0, 241, 33, 242, 33, 186, 33, 187, 33, 0, 0, 0, 0, 255, 255, 255, 255]);
    wtf.io.BufferView.setOffset(bufferView, 8);
    assert.deepEqual(ev.read(bufferView), {
      'c': '⁂',
      's': '⇱⇲↺↻',
      's_empty': '',
      's_null': null
    });
  });

  test('primitiveArgAny', function() {
    var bufferView = wtf.io.BufferView.createEmpty(1024);
    var ev = setupTestEvent(
        'primitiveArgAny(any a, any a_empty, any a_null)');
    ev.write({'a': 'foo', 'b': [1, 2, 3]}, {}, null, 1234567, bufferView);
    assert.arraysEqual(wtf.io.BufferView.getUsedBytes(bufferView),
        [1, 0, 0, 0, 88, 255, 149, 73, 0, 0, 0, 0, 1, 0, 0, 0, 255, 255, 255, 255]);
    wtf.io.BufferView.setOffset(bufferView, 8);
    assert.deepEqual(ev.read(bufferView), {
      'a': {'a': 'foo', 'b': [1, 2, 3]},
      'a_empty': {},
      'a_null': null
    });
  });
});
