/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

goog.provide('wtf.db.FilterParser_test');

goog.require('wtf.db.FilterParser');


/**
 * wtf.db.FilterParser testing.
 */
wtf.db.FilterParser_test = suite('wtf.db.FilterParser', function() {
  test('base', function() {
    assert.throws(function() {
      wtf.db.FilterParser.parse('');
    }, 'throws syntax error on empty');
  });

  test('substringTypeQuery', function() {
    assert.deepEqual(
        wtf.db.FilterParser.parse('abc123_456'),
        {
          type_query: {
            type: 'substring',
            value: 'abc123_456'
          },
          arg_query: null
        });
    assert.deepEqual(
        wtf.db.FilterParser.parse('abc123_456()'),
        {
          type_query: {
            type: 'substring',
            value: 'abc123_456'
          },
          arg_query: []
        });
    assert.deepEqual(
        wtf.db.FilterParser.parse('abc123_456(foo<5)'),
        {
          type_query: {
            type: 'substring',
            value: 'abc123_456'
          },
          arg_query: [
            {
              lhs: { type: 'reference', value: 'foo' },
              op: '<',
              rhs: { type: 'number', value: 5 }
            }
          ]
        });
  });

  test('regexTypeQuery', function() {
    assert.deepEqual(
        wtf.db.FilterParser.parse('/abc\[5\]\(2\)/'),
        {
          type_query: {
            type: 'regex',
            value: 'abc\[5\]\(2\)',
            flags: ''
          },
          arg_query: null
        });
    assert.deepEqual(
        wtf.db.FilterParser.parse('/abc/gi'),
        {
          type_query: {
            type: 'regex',
            value: 'abc',
            flags: 'gi'
          },
          arg_query: null
        });

    assert.deepEqual(
        wtf.db.FilterParser.parse('/abc/gi()'),
        {
          type_query: {
            type: 'regex',
            value: 'abc',
            flags: 'gi'
          },
          arg_query: []
        });
    assert.deepEqual(
        wtf.db.FilterParser.parse('/abc/gi(foo<5)'),
        {
          type_query: {
            type: 'regex',
            value: 'abc',
            flags: 'gi'
          },
          arg_query: [
            {
              lhs: { type: 'reference', value: 'foo' },
              op: '<',
              rhs: { type: 'number', value: 5 }
            }
          ]
        });
  });

  test('argumentReferences', function() {
    assert.deepEqual(
        wtf.db.FilterParser.parse('a(foo<5)').arg_query, [
          {
            lhs: { type: 'reference', value: 'foo' },
            op: '<',
            rhs: { type: 'number', value: 5 }
          }
        ]);
    assert.deepEqual(
        wtf.db.FilterParser.parse('a(foo.bar[5]["3"].taco<5)').arg_query, [
          {
            lhs: {
              type: 'reference',
              value: {
                type: 'access',
                base: {
                  type: 'access',
                  base: {
                    type: 'access',
                    base: {
                      type: 'access',
                      base: 'foo',
                      name: 'bar'
                    },
                    name: 5
                  },
                  name: '3'
                },
                name: 'taco'
              }
            },
            op: '<',
            rhs: { type: 'number', value: 5 }
          }
        ]);
  });

  test('numericArguments', function() {
    assert.deepEqual(
        wtf.db.FilterParser.parse('a(foo<0x125)').arg_query, [
          {
            lhs: { type: 'reference', value: 'foo' },
            op: '<',
            rhs: { type: 'number', value: 0x125 }
          }
        ]);
    assert.deepEqual(
        wtf.db.FilterParser.parse('a(foo<43.233)').arg_query, [
          {
            lhs: { type: 'reference', value: 'foo' },
            op: '<',
            rhs: { type: 'number', value: 43.233 }
          }
        ]);
  });

  test('stringArguments', function() {
    assert.deepEqual(
        wtf.db.FilterParser.parse('a(foo<"")').arg_query, [
          {
            lhs: { type: 'reference', value: 'foo' },
            op: '<',
            rhs: { type: 'string', value: '' }
          }
        ]);
    assert.deepEqual(
        wtf.db.FilterParser.parse('a(foo<"hello world!")').arg_query, [
          {
            lhs: { type: 'reference', value: 'foo' },
            op: '<',
            rhs: { type: 'string', value: 'hello world!' }
          }
        ]);
  });

  test('regexArguments', function() {
    assert.deepEqual(
        wtf.db.FilterParser.parse('a(foo =~ /.*/)').arg_query, [
          {
            lhs: { type: 'reference', value: 'foo' },
            op: '=~',
            rhs: { type: 'regex', value: '.*', 'flags': '' }
          }
        ]);
    assert.deepEqual(
        wtf.db.FilterParser.parse('a(foo !~ /blah/)').arg_query, [
          {
            lhs: { type: 'reference', value: 'foo' },
            op: '!~',
            rhs: { type: 'regex', value: 'blah', 'flags': '' }
          }
        ]);
  });

  test('literalArguments', function() {
    assert.deepEqual(
        wtf.db.FilterParser.parse('a(foo<true)').arg_query, [
          {
            lhs: { type: 'reference', value: 'foo' },
            op: '<',
            rhs: { type: 'boolean', value: true }
          }
        ]);
    assert.deepEqual(
        wtf.db.FilterParser.parse('a(foo<null)').arg_query, [
          {
            lhs: { type: 'reference', value: 'foo' },
            op: '<',
            rhs: { type: 'null', value: null }
          }
        ]);
  });

  test('arrayArguments', function() {
    assert.deepEqual(
        wtf.db.FilterParser.parse('a(foo<[])').arg_query, [
          {
            lhs: { type: 'reference', value: 'foo' },
            op: '<',
            rhs: { type: 'array', value: [] }
          }
        ]);
    assert.deepEqual(
        wtf.db.FilterParser.parse('a(foo<[1,2])').arg_query, [
          {
            lhs: { type: 'reference', value: 'foo' },
            op: '<',
            rhs: { type: 'array', value: [1, 2] }
          }
        ]);
  });

  test('objectArguments', function() {
    assert.deepEqual(
        wtf.db.FilterParser.parse('a(foo<{})').arg_query, [
          {
            lhs: { type: 'reference', value: 'foo' },
            op: '<',
            rhs: { type: 'object', value: {} }
          }
        ]);
    assert.deepEqual(
        wtf.db.FilterParser.parse('a(foo<{"a": 5})').arg_query, [
          {
            lhs: { type: 'reference', value: 'foo' },
            op: '<',
            rhs: { type: 'object', value: {'a': 5} }
          }
        ]);
  });
});
