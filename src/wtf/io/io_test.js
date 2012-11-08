/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

goog.provide('wtf.io_test');

goog.require('wtf.io');


/**
 * wtf.io testing.
 */
wtf.io_test = suite('wtf.io', function() {
  suite('ByteArray', function() {
    test('#createByteArray', function() {
      var array = wtf.io.createByteArray(123);
      assert.isNotNull(array);
      assert.lengthOf(array, 123);

      array = wtf.io.createByteArray(0);
      assert.isNotNull(array);
      assert.lengthOf(array, 0);

      array = wtf.io.createByteArray(2);
      assert.isNotNull(array);
      assert.lengthOf(array, 2);
      assert.equal(array[0], 0);
      assert.equal(array[1], 0);
    });

    test('#isByteArray', function() {
      assert.isFalse(wtf.io.isByteArray(undefined));
      assert.isFalse(wtf.io.isByteArray(null));
      assert.isFalse(wtf.io.isByteArray(0));
      assert.isFalse(wtf.io.isByteArray(''));
      assert.isFalse(wtf.io.isByteArray(function() {}));
      assert.isFalse(wtf.io.isByteArray({}));

      var array = wtf.io.createByteArray(123);
      assert.isTrue(wtf.io.isByteArray(array));
    });

    test('#byteArraysEqual', function() {
      var sourceArray = wtf.io.createByteArray(4);
      var targetArray = wtf.io.createByteArray(4);
      assert.isTrue(wtf.io.byteArraysEqual(sourceArray, targetArray));
      sourceArray[0] = 0;
      sourceArray[1] = 1;
      sourceArray[2] = 2;
      sourceArray[3] = 3;
      assert.isFalse(wtf.io.byteArraysEqual(sourceArray, targetArray));
    });

    test('#copyByteArray', function() {
      var sourceArray = wtf.io.createByteArray(4);
      var targetArray = wtf.io.createByteArray(4);
      sourceArray[0] = 0;
      sourceArray[1] = 1;
      sourceArray[2] = 2;
      sourceArray[3] = 3;
      wtf.io.copyByteArray(sourceArray, targetArray);
      assert.deepEqual(sourceArray, targetArray);

      targetArray = wtf.io.createByteArray(6);
      wtf.io.copyByteArray(sourceArray, targetArray);
      assert.equal(sourceArray[3], targetArray[3]);
      assert.equal(targetArray[4], 0);
      assert.equal(targetArray[5], 0);
    });

    test('#sliceByteArray', function() {
      var array = wtf.io.createByteArray(4);
      array[0] = 0; array[1] = 1; array[2] = 2; array[3] = 3;

      var result = wtf.io.sliceByteArray(array, 0, 4);
      assert.notStrictEqual(array, result);
      assert.isTrue(wtf.io.byteArraysEqual(array, result));

      result = wtf.io.sliceByteArray(array, 0, 0);
      assert.notStrictEqual(array, result);
      assert.lengthOf(result, 0);

      result = wtf.io.sliceByteArray(array, 0, 1);
      assert.notStrictEqual(array, result);
      assert.lengthOf(result, 1);
      assert.equal(result[0], array[0]);

      result = wtf.io.sliceByteArray(array, 1, 1);
      assert.notStrictEqual(array, result);
      assert.lengthOf(result, 1);
      assert.equal(result[0], array[1]);
    });

    test('#byteArrayToString', function() {
      var array = wtf.io.createByteArray(4);
      array[0] = 0; array[1] = 1; array[2] = 2; array[3] = 3;
      var result = wtf.io.byteArrayToString(array);
      assert.equal(result, 'AAECAw==');

      array = wtf.io.createByteArray(0);
      result = wtf.io.byteArrayToString(array);
      assert.equal(result, '');
    });

    test('#stringToByteArray', function() {
      var targetArray = wtf.io.createByteArray(4);
      var length = wtf.io.stringToByteArray('AAECAw==', targetArray);
      assert.equal(length, 4);
      assert.isTrue(wtf.io.byteArraysEqual(targetArray, [0, 1, 2, 3]));

      length = wtf.io.stringToByteArray('', targetArray);
      assert.equal(length, 0);

      targetArray = wtf.io.createByteArray(5);
      targetArray[4] = 123;
      length = wtf.io.stringToByteArray('AAECAw==', targetArray);
      assert.equal(length, 4);
      assert.isTrue(wtf.io.byteArraysEqual(targetArray, [0, 1, 2, 3, 123]));
    });
  });
});
