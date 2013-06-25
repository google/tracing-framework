/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

goog.provide('wtf.util.Options_test');

goog.require('wtf.util.Options');


/**
 * wtf.util.Options testing.
 */
wtf.util.Options_test = suite('wtf.util.Options', function() {
  test('#ctor', function() {
    var options = new wtf.util.Options();
    assert.deepEqual(options.getValues(), {});
  });

  test('#load', function() {
    // Failure cases.
    var options = new wtf.util.Options();
    assert.deepEqual(options.getValues(), {});
    assert.isFalse(options.load(''));
    assert.isFalse(options.load('{'));
    assert.isFalse(options.load('wooasdfo jasdoif asojdif {}'));
    assert.deepEqual(options.getValues(), {});

    // Load empty.
    options = new wtf.util.Options();
    assert.isTrue(options.load('{}'));
    assert.deepEqual(options.getValues(), {});

    // Load boolean.
    options = new wtf.util.Options();
    assert.isTrue(options.load('{"a":true}'));
    assert.deepEqual(options.getValues(), {'a': true});
    assert.strictEqual(options.getBoolean('a', false), true);

    // Load number.
    options = new wtf.util.Options();
    assert.isTrue(options.load('{"a":1}'));
    assert.deepEqual(options.getValues(), {'a': 1});
    assert.strictEqual(options.getNumber('a', 0), 1);

    // Load string.
    options = new wtf.util.Options();
    assert.isTrue(options.load('{"a":"b"}'));
    assert.deepEqual(options.getValues(), {'a': 'b'});
    assert.strictEqual(options.getString('a', 'x'), 'b');

    // Load array.
    options = new wtf.util.Options();
    assert.isTrue(options.load('{"a":[1, 2]}'));
    assert.deepEqual(options.getValues(), {'a': [1, 2]});
    assert.deepEqual(options.getArray('a', []), [1, 2]);

    // Load with no event due to failure.
    options = new wtf.util.Options();
    var check = assert.expectNoEvent(
        options, wtf.util.Options.EventType.CHANGED);
    assert.isFalse(options.load(''));
    check();

    // Load with no event (no contents).
    options = new wtf.util.Options();
    check = assert.expectNoEvent(
        options, wtf.util.Options.EventType.CHANGED);
    assert.isTrue(options.load('{}'));
    check();

    // Load with event.
    options = new wtf.util.Options();
    check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    assert.isTrue(options.load('{"a":true}'));
    check();
  });

  test('#save', function() {
    // Save when empty.
    var options = new wtf.util.Options();
    assert.deepEqual(options.getValues(), {});
    assert.equal(options.save(), '{}');

    // Save booleans.
    options = new wtf.util.Options();
    options.setBoolean('a', true);
    assert.equal(options.save(), '{"a":true}');

    // Save numbers.
    options = new wtf.util.Options();
    options.setNumber('a', 1);
    assert.equal(options.save(), '{"a":1}');

    // Save strings.
    options = new wtf.util.Options();
    options.setString('a', 'b');
    assert.equal(options.save(), '{"a":"b"}');

    // Save arrays.
    options = new wtf.util.Options();
    options.addArrayValue('a', 1);
    options.addArrayValue('a', 2);
    assert.equal(options.save(), '{"a":[1,2]}');

    // Save all types.
    options = new wtf.util.Options();
    options.setBoolean('a', true);
    options.setNumber('b', 1);
    options.setString('c', 'c');
    options.addArrayValue('d', 1);
    options.addArrayValue('d', 2);
    assert.deepEqual(JSON.parse(options.save()), {
      a: true,
      b: 1,
      c: 'c',
      d: [1, 2]
    });
  });

  test('#clear', function() {
    // No-op.
    var options = new wtf.util.Options();
    assert.deepEqual(options.getValues(), {});
    options.clear();
    assert.deepEqual(options.getValues(), {});

    // Clear multiple.
    options = new wtf.util.Options();
    options.setBoolean('a', true);
    options.setBoolean('b', true);
    assert.deepEqual(options.getValues(), {a: true, b: true});
    options.clear();
    assert.deepEqual(options.getValues(), {});

    // Event on change.
    options = new wtf.util.Options();
    options.setBoolean('a', true);
    var check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.clear();
    check();

    // No event if nothing changes.
    options = new wtf.util.Options();
    check = assert.expectNoEvent(
        options, wtf.util.Options.EventType.CHANGED);
    options.clear();
    check();
  });

  test('#beginChanging', function() {
    // Single beginChanging scope.
    var options = new wtf.util.Options();
    var check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.setBoolean('a', true);
    check();
    options.beginChanging();
    check = assert.expectNoEvent(
        options, wtf.util.Options.EventType.CHANGED);
    options.setBoolean('b', true);
    check();
    check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['b']]);
    options.endChanging();
    check();

    // Nested beginChanging scopes.
    options = new wtf.util.Options();
    options.beginChanging();
    options.beginChanging();
    check = assert.expectNoEvent(
        options, wtf.util.Options.EventType.CHANGED);
    options.setBoolean('b', true);
    check();
    check = assert.expectNoEvent(
        options, wtf.util.Options.EventType.CHANGED);
    options.endChanging();
    check();
    check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['b']]);
    options.endChanging();
    check();
  });

  test('#mixin', function() {
    // No-op.
    var options = new wtf.util.Options();
    var check = assert.expectNoEvent(
        options, wtf.util.Options.EventType.CHANGED);
    options.mixin(null);
    check();
    assert.deepEqual(options.getValues(), {});

    // Boolean set.
    options = new wtf.util.Options();
    check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.mixin({a: true});
    check();
    assert.deepEqual(options.getValues(), {a: true});

    // Boolean merge.
    options = new wtf.util.Options();
    options.setBoolean('a', false);
    check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.mixin({a: true});
    check();
    assert.deepEqual(options.getValues(), {a: true});

    // Merge and preserve.
    options = new wtf.util.Options();
    options.setBoolean('b', true);
    check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.mixin({a: true});
    check();
    assert.deepEqual(options.getValues(), {a: true, b: true});

    // Array set.
    options = new wtf.util.Options();
    check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.mixin({a: [1, 2]});
    check();
    assert.deepEqual(options.getValues(), {a: [1, 2]});

    // Array merge.
    options = new wtf.util.Options();
    options.addArrayValue('a', 0);
    check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.mixin({a: [1, 2]});
    check();
    assert.deepEqual(options.getValues(), {a: [0, 1, 2]});

    // Array merge de-dupe.
    options = new wtf.util.Options();
    options.addArrayValue('a', 1);
    check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.mixin({a: [1, 2]});
    check();
    assert.deepEqual(options.getValues(), {a: [1, 2]});

    // Check for beginChanging support.
    options = new wtf.util.Options();
    options.beginChanging();
    check = assert.expectNoEvent(
        options, wtf.util.Options.EventType.CHANGED);
    options.mixin({a: true});
    check();
    check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.endChanging();
    check();
    assert.deepEqual(options.getValues(), {a: true});
  });

  test('#getBoolean', function() {
    var options = new wtf.util.Options();
    assert.isFalse(options.getBoolean('a', false));
    assert.isTrue(options.getBoolean('a', true));
    options.setBoolean('a', true);
    assert.isTrue(options.getBoolean('a', true));
  });

  test('#getOptionalBoolean', function() {
    var options = new wtf.util.Options();
    assert.isUndefined(options.getOptionalBoolean('a'));
    assert.isFalse(options.getOptionalBoolean('a', false));
    assert.isTrue(options.getOptionalBoolean('a', true));
    options.setBoolean('a', true);
    assert.isTrue(options.getOptionalBoolean('a'));
    assert.isTrue(options.getOptionalBoolean('a', false));
  });

  test('#setBoolean', function() {
    var options = new wtf.util.Options();
    var check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.setBoolean('a', true);
    check();
    assert.deepEqual(options.getValues(), {a: true});

    // Check for beginChanging support.
    options = new wtf.util.Options();
    options.beginChanging();
    check = assert.expectNoEvent(
        options, wtf.util.Options.EventType.CHANGED);
    options.setBoolean('a', true);
    check();
    check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.endChanging();
    check();
    assert.deepEqual(options.getValues(), {a: true});
  });

  test('#getNumber', function() {
    var options = new wtf.util.Options();
    assert.strictEqual(options.getNumber('a', 0), 0);
    assert.strictEqual(options.getNumber('a', 1), 1);
    options.setNumber('a', 1);
    assert.strictEqual(options.getNumber('a', 1), 1);
  });

  test('#getOptionalNumber', function() {
    var options = new wtf.util.Options();
    assert.isUndefined(options.getOptionalNumber('a'));
    assert.strictEqual(options.getOptionalNumber('a', 0), 0);
    assert.strictEqual(options.getOptionalNumber('a', 1), 1);
    options.setNumber('a', 1);
    assert.strictEqual(options.getOptionalNumber('a'), 1);
    assert.strictEqual(options.getOptionalNumber('a', 0), 1);
  });

  test('#setNumber', function() {
    var options = new wtf.util.Options();
    var check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.setNumber('a', 1);
    check();
    assert.deepEqual(options.getValues(), {a: 1});

    // Check for beginChanging support.
    options = new wtf.util.Options();
    options.beginChanging();
    check = assert.expectNoEvent(
        options, wtf.util.Options.EventType.CHANGED);
    options.setNumber('a', 1);
    check();
    check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.endChanging();
    check();
    assert.deepEqual(options.getValues(), {a: 1});
  });

  test('#getString', function() {
    var options = new wtf.util.Options();
    assert.strictEqual(options.getString('a', 'x'), 'x');
    options.setString('a', 'b');
    assert.strictEqual(options.getString('a', 'x'), 'b');
  });

  test('#getOptionalString', function() {
    var options = new wtf.util.Options();
    assert.isUndefined(options.getOptionalString('a'));
    assert.strictEqual(options.getOptionalString('a', 'x'), 'x');
    options.setString('a', 'b');
    assert.strictEqual(options.getOptionalString('a'), 'b');
    assert.strictEqual(options.getOptionalString('a', 'x'), 'b');
  });

  test('#setString', function() {
    var options = new wtf.util.Options();
    var check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.setString('a', 'b');
    check();
    assert.deepEqual(options.getValues(), {a: 'b'});

    // Check for beginChanging support.
    options = new wtf.util.Options();
    options.beginChanging();
    check = assert.expectNoEvent(
        options, wtf.util.Options.EventType.CHANGED);
    options.setString('a', 'b');
    check();
    check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.endChanging();
    check();
    assert.deepEqual(options.getValues(), {a: 'b'});
  });

  test('#getArray', function() {
    var options = new wtf.util.Options();
    assert.deepEqual(options.getArray('a', [3, 4]), [3, 4]);
    options.addArrayValue('a', 1);
    options.addArrayValue('a', 2);
    assert.deepEqual(options.getArray('a', [3, 4]), [1, 2]);
  });

  test('#getOptionalArray', function() {
    var options = new wtf.util.Options();
    assert.isUndefined(options.getOptionalArray('a'));
    assert.deepEqual(options.getOptionalArray('a', [3, 4]), [3, 4]);
    options.addArrayValue('a', 1);
    options.addArrayValue('a', 2);
    assert.deepEqual(options.getOptionalArray('a'), [1, 2]);
    assert.deepEqual(options.getOptionalArray('a', [3, 4]), [1, 2]);
  });

  test('#addArrayValue', function() {
    var options = new wtf.util.Options();
    assert.lengthOf(options.getArray('a', []), 0);
    options.addArrayValue('a', 1);
    options.addArrayValue('a', 2);
    assert.lengthOf(options.getArray('a', []), 2);
    assert.deepEqual(options.getArray('a', []), [1, 2]);
    assert.deepEqual(options.getValues(), {a: [1, 2]});

    // De-duplication.
    options = new wtf.util.Options();
    options.addArrayValue('a', 1);
    options.addArrayValue('a', 2);
    options.addArrayValue('a', 1);
    options.addArrayValue('a', 1);
    assert.lengthOf(options.getArray('a', []), 2);
    assert.deepEqual(options.getArray('a', []), [1, 2]);
    assert.deepEqual(options.getValues(), {a: [1, 2]});

    // Events on each add.
    options = new wtf.util.Options();
    var check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.addArrayValue('a', 1);
    check();
    check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.addArrayValue('a', 2);
    check();
    assert.deepEqual(options.getValues(), {a: [1, 2]});

    // No events on duplicates.
    options = new wtf.util.Options();
    check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.addArrayValue('a', 1);
    check();
    check = assert.expectNoEvent(
        options, wtf.util.Options.EventType.CHANGED);
    options.addArrayValue('a', 1);
    check();
    assert.deepEqual(options.getValues(), {a: [1]});

    // Check for beginChanging support.
    options = new wtf.util.Options();
    options.beginChanging();
    check = assert.expectNoEvent(
        options, wtf.util.Options.EventType.CHANGED);
    options.addArrayValue('a', 1);
    check();
    check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.endChanging();
    check();
    assert.deepEqual(options.getValues(), {a: [1]});
  });

  test('#removeArrayValue', function() {
    var options = new wtf.util.Options();
    assert.lengthOf(options.getArray('a', []), 0);
    options.addArrayValue('a', 1);
    options.addArrayValue('a', 2);
    assert.lengthOf(options.getArray('a', []), 2);
    assert.deepEqual(options.getArray('a', []), [1, 2]);
    assert.deepEqual(options.getValues(), {a: [1, 2]});
    options.removeArrayValue('a', 1);
    assert.lengthOf(options.getArray('a', []), 1);
    assert.deepEqual(options.getArray('a', []), [2]);
    assert.deepEqual(options.getValues(), {a: [2]});

    // Total removal of key.
    var options = new wtf.util.Options();
    assert.lengthOf(options.getArray('a', []), 0);
    options.addArrayValue('a', 1);
    options.addArrayValue('a', 2);
    options.removeArrayValue('a', 1);
    options.removeArrayValue('a', 2);
    assert.lengthOf(options.getArray('a', []), 0);
    assert.deepEqual(options.getValues(), {});

    // Events on each remove.
    options = new wtf.util.Options();
    options.addArrayValue('a', 1);
    options.addArrayValue('a', 2);
    var check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.removeArrayValue('a', 1);
    check();
    check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.removeArrayValue('a', 2);
    check();
    assert.deepEqual(options.getValues(), {});

    // Check for beginChanging support.
    options = new wtf.util.Options();
    options.addArrayValue('a', 1);
    options.addArrayValue('a', 2);
    options.beginChanging();
    check = assert.expectNoEvent(
        options, wtf.util.Options.EventType.CHANGED);
    options.removeArrayValue('a', 1);
    check();
    check = assert.expectEvent(
        options, wtf.util.Options.EventType.CHANGED, [['a']]);
    options.endChanging();
    check();
    assert.deepEqual(options.getValues(), {a: [2]});
  });

  test('changeSequence', function() {
    var options = new wtf.util.Options();
    assert.expectEventSequence(options, [
      [wtf.util.Options.EventType.CHANGED, function() {
        assert.deepEqual(options.getValues(), {'a': [1]});
      }],
      [wtf.util.Options.EventType.CHANGED, function() {
        assert.deepEqual(options.getValues(), {});
      }],
      [wtf.util.Options.EventType.CHANGED, function() {
        assert.deepEqual(options.getValues(), {'b': true});
      }]
    ]);
    options.addArrayValue('a', 1);
    options.clear();
    options.setBoolean('b', true);
  });
});
