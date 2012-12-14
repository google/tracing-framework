#!/bin/bash

# Copyright 2012 Google Inc. All Rights Reserved.

# Updates the benchmarks index file, used to select and run benchmarks.

# This must currently run from the root of the repo
# TODO(benvanik): make this runnable from anywhere (find git directory?)
if [ ! -d ".git" ]; then
  echo "This script must be run from the root of the repository (the folder containing .git)"
  exit 1
fi

# TODO(benvanik): list *.js, see if it contains any benchmark.register() functions
