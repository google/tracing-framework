# wtf-calls File Format

## Structure

All values in little-endian.

```
4b  header length = HL
HL  utf8-encoded JSON header
[padding to align to 4b]
*   repeated 4b values indicating function
```

## Header

The header currently contains a map of modules by module ID. Module IDs are
randomly assigned and are just used for differentiation.

Each module contains a list of its function types and the range of the function
in the unmodified source document. This can be used to look up function code
either in the source file or through the source map.

Functions are assigned IDs that should be treated as opaque. Function IDs will
change on each recording, and cannot be correlated across files. Instead, use
the function name and range to match functions.

```
{
  "version": 1,
  "context": {
    "uri": "http://...",
    "title": "Some Title"
  },
  "metadata": {
    #
  },
  "modules": {
    0: {
      "src": "http://.....",
      "fns": [
        [function id], [function name], [start range], [end range],
        ...
      ]
    }
  }
}
```

## Calls

Calls in the file are paired enter-exits, similar to scopes in the WTF format.
Enters are the function ID being entered, and exits are the negative of the
function ID. Each ID is 4b.

For example:

```
 1000 # enter function 1000
 1001 # enter function 1001
-1001 # leave function 1001
-1000 # leave function 1000
```
