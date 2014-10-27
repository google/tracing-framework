Web Tracing Framework
================================================================================

[![Build Status](https://travis-ci.org/google/tracing-framework.png)](https://travis-ci.org/google/tracing-framework)

The Web Tracing Framework is a set of libraries, tools, and visualizers for
the tracing and investigation of complex web applications. You spend a small
amount of time instrumenting your code and it helps you discover performance
problems, track regressions, and build buttery-smooth 60fps web apps.

This is still very much a work in progress, and not designed to work for all
applications. If you find issues when using it with your application please
contribute fixes!

For documentation, tutorials, etc see the [main Web Tracing Framework website](http://google.github.io/tracing-framework/).

For a list of known issues see [KNOWN_ISSUES](https://github.com/google/tracing-framework/blob/master/KNOWN_ISSUES.md)
or the Github issues list.

[![Screenshot](https://raw.github.com/google/tracing-framework/master/assets/store/screenshot-1.png)](http://google.github.io/tracing-framework/)

## Setup

See [building](https://github.com/google/tracing-framework/blob/master/docs/building.md) for instructions and
[testing](https://github.com/google/tracing-framework/blob/master/docs/testing.md) for information on running the various tests.

## Quickstart

Just want the extension as fast as possible?

```bash
umask 0022
git clone https://github.com/google/tracing-framework.git
cd tracing-framework/
./scripts/setup.sh # or setup.bat on Windows
source wtfrc && deployext
# At chrome://extensions load unpacked extension from
# build-bin/wtf-injector-chrome
```

If you pull new changes, just redeploy:

```bash
git pull && git submodule update
deployext
# Reload from chrome://extensions
```

For more information and other build options, see [building](https://github.com/google/tracing-framework/blob/master/docs/building.md).

## License

All code except dependencies under third_party/ is licensed under the permissive BSD license. Feel free to fork/rip/etc and use as you wish!

## Contributing

Have a fix or feature? Submit a pull request - we love them!
Note that we do keep to the [style_guide](https://github.com/google/tracing-framework/blob/master/docs/style_guide.md),
so please check it out first!

As this is a Google project, you *must* first e-sign the
[Google Contributor License Agreement](http://code.google.com/legal/individual-cla-v1.0.html) before we can accept any
code. It takes only a second and basically just says you won't sue us or claim
copyright of your submitted code.
