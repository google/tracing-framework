# Testing

The framework currently uses [mocha](http://visionmedia.github.com/mocha/) for
its testing. This enables node.js-based super-fast unit tests as well as
browser-based tests.

## Running Tests

Ensure your deps are up to date (only required when changing goog.requires):

```bash
anvil build :deps
```

To run from the command-line, use the `run-tests.sh` script in the root:

```bash
# Run all tests
./scripts/run-tests.sh

# Run just wtf.io tests
./scripts/run-tests.sh wtf.io
```

To run the tests in the browser, navigate to the main test runner page:

    http://localhost:8080/src/wtf/testing/test.html

This will run all tests. You can click on a test suite to narrow down to running
just those tests. You can also pass `?tests=some,tests` in the URL to run suites
by test namespace name (for example `?tests=wtf.io` will run the
`src/wtf/io/io_test.js` tests).

## Authoring Tests

Each piece of testable functionality (namespace, types, etc) should have a
corresponding _test.js file. The test file should provide a namespace that
is the name of the namespace or type being tested with a '_test' suffix.

### Example

    goog.provide('wtf.MyType_test');

    wtf.MyType_test = suite('wtf.MyType', function() {
      setup(function() {
        // Test suite setup code.
      });
      teardown(function() {
        // Test suite teardown code.
      });
      suite('#someFunction', function() {
        // Tests related to MyType.someFunction.
        assert.isTrue(true);
      });
    });

### Assertions

Currently the project is using the mocha TDD UI along with the assertions from
the [Chai Assertion Library](http://chaijs.com/api/assert/). See the reference
for more information.

### Note on Side-effects

Since many tests can run in the same context (unsandboxed) you should ensure
that any changes made to global state are reverted when the tests are torn down.
