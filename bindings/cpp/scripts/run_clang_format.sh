#!/bin/bash
set -e
td="$(dirname $0)"
sd="$td/.."

clang-format -style=file -i \
    $(find $sd -name '*.h') \
    $(find $sd -name '*.cc')
