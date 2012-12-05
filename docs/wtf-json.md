# wtf-json File Format

This format is a non-optimized, human-readable event stream. It is designed to
be much easier to generate than the binary format at the cost of file size
and load time. Prefer to use the binary format where possible.

## Structure

A complete file contains a list of objects, with each object having a certain
type. In JSON, this looks like:

    [
      {
        ...
      },
      {
        ...
      }
    ]

In order to support generators that cannot properly close the enclosing array,
parsers of the format also support omitting the trailing `]` and the presence of trailing commas:

    [
      {
        ...
      },
      {
        ...
      },   <-- trailing comma
           <-- no trailing ]

## Entries

### Header

Each trace should include as its first entry a header object. This header
describes the trace file event format and adds additional information to help
merge trace files together. If the header is omitted the default values below
are used.

    {
      "type": "wtf.json.header",
      "format_version": 1,
      "high_resolution_times": true,
      "timebase": 0
    }

* `format_version`: major version of the format, must be 1.
* `high_resolution_times`: whether the times in the file are high resolution.
* `timebase`: unix time since the epoch that is added to all time values in the trace. A timebase of 1000 means that a `time` of 5 would be seen as 1005.

### Event Definitions

Any event that will be seen in the stream must be defined before it is seen.
Events are defined by a signature that can be either a simple name or a
function-like signature with arguments. Events are either `scopes` or
`instance` types, and can contain optional flags.

To decrease filesize it's possible to assign an `event_id` that will be
referenced instead of the event name. This is optional.

    {
      "type": "wtf.event.define",
      "signature": "my.custom#event(uint32 foo)"
      "class": "scope",
      "flags": 0,
      "event_id": 0
    }

The minimal possible definition for a scope event:

    {
      "type": "wtf.event.define",
      "signature": "my.custom#event(uint32 foo)"
    }

* `signature`: a function-like signature. See [api](api.md) for more
information. The event name here can be referenced by `event` in event objects.
* `class`: either `scope` (the default) or `instance`.
* `flags`: optional flags values. Currently unused.
* `event_id`: optional file-unique number to assign the event. This can be used
instead of the name in `event`.

### Events

Event objects are the majority of a file indicating the occurrence of an event,
its time, and optionally any arguments.

    {
      "event": 0,
      "time": 1234,
      "args": [
        4567
      ]
    }

`event`: either the event name from the definition `signature` or the `event_id`
if it was assigned.
`time`: the time the event occurred, relative to the `timebase`.
`args`: an optional list of arguments for the event, if any were indicated in
the `signature`.

### Zones

TODO(benvanik): support zones

### Flows

TODO(benvanik): support flows

## Example

Smallest possible file:

    [
      {
        "type": "wtf.event.define",
        "signature": "my.custom#event"
      },
      {
        "event": "my.custom#event",
        "time": 123450001
      },
      {
        "event": "my.custom#event",
        "time": 123450002
      }
    ]

Efficient file:

    [
      {
        "type": "wtf.json.header",
        "timebase": 123450000
      }
      {
        "type": "wtf.event.define",
        "signature": "my.custom#event",
        "event_id": 0
      },
      {
        "event": 0,
        "time": 1
      },
      {
        "event": 0,
        "time": 2
      }
    ]
