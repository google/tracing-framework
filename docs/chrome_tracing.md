# Importing chrome:tracing data

WARNING: this feature is experimental and may stop working at any time!

On very recent Chrome builds (assume Chromium nightlies) it's possible to grab
the chrome:tracing data relevant to a page via WTF.

## Setup

### Use a Chromium Nightly

This feature uses undocumented functionality inside of Chrome, and it seems to
change rather frequently. If it stops working on a recent Chrome, file an issue.
Older Chrome releases are unsupported.

### Launch Chromium with Remote Debugging

Check the documentation for [running Chromium with flags](http://www.chromium.org/developers/how-tos/run-chromium-with-flags).
Make sure all previous instances of Chromium have been closed.

```bash
~/chrome-linux/chrome --remote-debugging-port=9222
```

### Enable the Feature in WTF

By default if you have `--remote-debugging-port` set correctly the feature will
be enabled. If not, check the below:

* On a page that has WTF embedded, open the settings with the gear icon.
* Click 'Providers', scroll to 'Chrome Debugging'.
* Make sure 'Enabled' is checked.
* If `--remote-debugging-port` is set correctly then 'chrome:tracing' will be
checked automatically.

## Usage

When supported a new icon appears in the on-page WTF HUD. It doesn't look like
it yet, but it's a toggle button.

* Load your page
* Click once on the button to start tracing
  * You should see a 'tracing...' status message in the top right corner
* After a few seconds, click the button again to stop
  * The status will change to 'waiting' while the data is being retrieved
* Once the status disappears, snapshot or save the trace

## Caveats

### Times Don't Line Up

The chrome:tracing reports do not include absolute timestamps meaning that some
guesswork is required to try to line them up. This isn't perfect, and times of
the zones sourced from chrome:tracing will be shifted either early or late
relative to the WTF track. [bug](https://code.google.com/p/chromium/issues/detail?id=174451)

### Tracing Overhead is Not Hidden

Once a trace is requested the tail-end of the tracing is included in the data.
You'll see this as a long string of OnTraceDataCollected events. Just ignore
these for now. Filed as issue 252.
