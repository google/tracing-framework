# wtf-trace File Format

NOTE: this format will be changing in the near future to support framing.

All values in little-endian.

## Header

Every file begins with a header:

```
4b  magic number: 0xDEADBEEF
4b  WTF version: wtf.version.getValue()
4b  format version: wtf.data.formats.BinaryTrace.VERSION
2b  context info string length
*   context info JSON string in utf8
4b  bitmask of flags from wtf.data.formats.FileFlags
8b  timebase (all times are relative to this value)
2b  metadata string length
*   metadata JSON string in utf8
```

### Context Info

The context describes the runtime environment the traced app was running in.
Currently only script contexts are supported but more may be added in the
future.

The context info JSON is formed by `wtf.data.ScriptContextInfo.serialize`.

```
{
  // Required:
  'contextType': 'script',
  'uri': 'http://...',

  // Optional:
  'title': 'My page',
  'icon': {
    'uri': 'http://...'
  },
  'taskId': 'process ID/etc',
  'args': [arguments used on startup],
  'userAgent': {
    'value': 'user agent string',
    'type': 'unknown|nodejs|opera|ie|gecko|webkit',
    'platform': 'mac|windows|linux|other',
    'platformVersion': 'OS version/etc',
    'device': 'desktop|server|chrome|iphone|ipad|android|mobile'
  }
}
```

## Events

Event data follows the header and runs until the end of the file. Each entry
is variable length and there's currently no way to know how many events are in
a file. They are meant to be read forward without needing to first read the
entire file. Future revisions of the format may add framing to allow for easier
streaming.

Each event data entry shares a standard header followed by a variable number
of bytes containing the event-specific arguments:

```
2b  event wire ID
4b  time
*   argument data, if any
```

### Event Types / Wire IDs

Events are defined using the special `wtf.event#define` event that is built into
the file loader. This is the only implicitly defined event and all others must
be defined by the file. This event maps data from `wtf.trace.EventType`.

```
wtf.event#define(uint16 wireId, uint16 eventClass, uint32 flags,
                 ascii name, ascii args)
```

For efficiency an indirection table is built while the file is loaded. New
events are defined in the file and are assigned a wire ID that is used to
reference the event type in future entries. Events must be defined before any
entry tries to reference its wire ID. The wire ID of `wtf.event#define` is
always 1.

### Argument Data

There are many types of argument data values. See `wtf.trace.EventTypeBuilder`
for the full list and how each is written into the file. In general, they
follow the write* methods from `wtf.io.Buffer`.

### Zones

Events are attributed to zones of execution. Zones must be created via
`wtf.zone#create` events and then made active via `wtf.zone#set`.

Typical flows look like this:
```
wtf.event#define(... wtf.zone#create ...)
wtf.event#define(... wtf.zone#set ...)
wtf.event#define(... myEvent ...)
wtf.zone#create(zoneId=5, ...)
wtf.zone#create(zoneId=6, ...)
wtf.zone#set(zoneId=5)
myEvent() // in zone 5
myEvent() // also in zone 5, as it's a sticky setting
wtf.zone#set(zoneId=6)
myEvent() // in zone 6
```
