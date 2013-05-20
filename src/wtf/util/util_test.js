/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

goog.provide('wtf.util_test');

goog.require('wtf.util');


/**
 * wtf.io testing.
 */
wtf.util_test = suite('wtf.util', function() {
  test('#getCompiledMemberName', function() {
    // This can't really be tested in full compiled mode, but testing it here
    // is good enough.

    // Basic type checks.
    var simpleObject = {
      'a': 5,
      'b': 'foo',
      'c': function() { return arguments.length; }
    };
    assert.equal(
        wtf.util.getCompiledMemberName(simpleObject, simpleObject['a']), 'a');
    assert.equal(
        wtf.util.getCompiledMemberName(simpleObject, simpleObject['b']), 'b');
    assert.equal(
        wtf.util.getCompiledMemberName(simpleObject, simpleObject['c']), 'c');
    assert.isNull(
        wtf.util.getCompiledMemberName(simpleObject, 'not_found'));

    // Ensure that the method asserts if there are two keys with the same value.
    var dupeObject = {
      'a': 5,
      'b': 5
    };
    assert.throws(function() {
      wtf.util.getCompiledMemberName(dupeObject, 5);
    }, 'AssertionError');

    // Prototype chain checks.
    var SuperType = function() {
      this.superValue = 5;
    };
    SuperType.prototype.superMethod = function() { return this.superValue; };
    var SubType = function() {
      goog.base(this);
      this.subValue = 6;
    };
    goog.inherits(SubType, SuperType);
    SubType.prototype.subMethod = function() { return this.subValue + 1; };
    var subType = new SubType();
    assert.equal(
        wtf.util.getCompiledMemberName(subType, subType.superValue),
        'superValue');
    assert.equal(
        wtf.util.getCompiledMemberName(subType, subType.subValue),
        'subValue');
    assert.equal(
        wtf.util.getCompiledMemberName(subType, subType.superMethod),
        'superMethod');
    assert.equal(
        wtf.util.getCompiledMemberName(subType, subType.subMethod),
        'subMethod');
  });

  test('#convertAsciiStringToUint8Array', function() {
    assert.lengthOf(wtf.util.convertAsciiStringToUint8Array(''), 0);
    assert.arraysEqual(
        wtf.util.convertAsciiStringToUint8Array('abc'),
        [97, 98, 99]);
  });
});
