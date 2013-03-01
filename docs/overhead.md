# Tracing Overhead

TODO(benvanik): more information

## Measured Overhead

Every machine/browser/operating system has a different amount of overhead when
tracing. Use the 'View Warnings' dialog in the WTF app to see information about
the measured overhead from the machine that traced the file.

The simplest WTF event takes about 0.1µs (that's 0.0001ms) on a decently fast
Linux machine. A scope is made up of both an enter and a leave, each taking
0.1µs, so you can assume they take about 0.2-0.3µs together.

Once you add arguments to events the time starts increasing. Arguments like
`uint32` are cheap, others like `float32` and `ascii` are a bit more expensive,
and some like `any` are very expensive. Use the strictest argument type you can
and only trace what you need.

Some events, like the generic `wtf.trace.enterScope`,
`wtf.trace.appendScopeData`, and `wtf.trace.timeStamp` are horrendously
expensive and should only be used when absolutely necessary. You should always
be using typed events via `wtf.trace.events.create*` or the automatic
instrumention functions like `wtf.trace.instrument`.

## Guidelines

* Trace fewer than 10,000 scopes per frame. That's about 2ms of overhead.
* Never use `enterScope`, `appendScopeData`, or `timeStamp`.
* Never use the `any` event argument type.
* Prefer the `ascii` event argument type to `utf8` which can be up to 2x slower.
* Avoid large strings as `ascii` or `utf8` event arguments.
* Avoid arrays as event arguments where non-arrays work (x,y,z vs. []).

## Benchmarks

TODO(benvanik): post a public benchmark page.

## Warning Information

<a name="warn_too_many_events_per_frame"></a>
### Too Many Events Per Frame

TODO(benvanik): document this
