# Known Issues

This is a list of major known issues. For the latest list of all issues see the
[Github Issues page](https://github.com/google/tracing-framework/issues).

## Timing on Chrome/Windows and iOS is Bad

Chrome/Windows does not currently implement the high-resolution timing required
to get accurate times. If you try to use WTF there you'll get very weird (and
incorrect) traces. Use Chrome for Linux or OSX or another browser.

Chrome bug: [issue 158234](https://code.google.com/p/chromium/issues/detail?id=158234)

## Timing from Web Workers is Bad

Web Workers don't currently have access to the high-resolution timing required.
Spec changes are required here as well as implementations. WTF supports
auto-instrumenting workers and other cool features but that's disabled until
this functionality is added to browsers. Show your support if you want it!

Chrome bug: [issue 169318](https://code.google.com/p/chromium/issues/detail?id=169318)

## XHR Recording is Slow

The recording of XMLHttpRequest open/send/etc is currently slow. The times
reported in traces will be in the 0.1-0.2ms range, however the actual times are
usually an order of magnitude less than this: 0.01-0.05ms, experimentally.

Workaround: disable the XHR provider under the page settings to remove the
overhead.

## WTF Adds ~1s to Page Load

In certain browsers the DOM provider currently adds anywhere from 500ms to 1s to
the page load time. This usually isn't a problem as it won't show up in the
trace, however if you're trying to use the window.performance values (such as
navigation start) you should be aware of the additional time.

Workaround: disable the DOM provider under the page settings. Ideally, never
measure page load timings with WTF active.

## Flows Not Implemented

The wtf.flow API is not implemented. You can emit the events but the UI will not
show them.

## Chrome Sad Tabs on Windows/OSX with Large Traces

Trying to load very large trace files (usually `.wtf-calls` files over 100MB)
will often cause Chrome to sad tab. This is due to the 32-bit address space used
by v8 on Windows/OSX. If you want to load large traces use a 64-bit Linux build
of Chrome, which should work just fine (within reason).

Chrome bug: [issue 18323](https://code.google.com/p/chromium/issues/detail?id=18323) and [issue 8606](https://code.google.com/p/chromium/issues/detail?id=8606)
