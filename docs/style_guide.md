# Style Guide

## JavaScript

Two documents of interest:

* [Google JavaScript Style Guide](http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml)
* [Annotating JavaScript for the Closure Compiler](https://developers.google.com/closure/compiler/docs/js-for-compiler)

### Linting

Use the Closure linter to lint and automatically fix some errors (of certain
types).

    # Fix regular errors (missing goog.require/provide, etc)
    anvil build :fixstyle

    # Run full lint
    anvil build :lint
