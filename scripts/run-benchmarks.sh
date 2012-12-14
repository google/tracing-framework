#!/bin/bash

# Copyright 2012 Google Inc. All Rights Reserved.

# Run benchmarks quickly.
# This requires up-to-date deps files, produced by 'anvil build :deps'.
#
# If trying to test in an automated environment, prefer using the :test rule:
#   anvil build :test


# Fast build and ensure test dependencies exist.
./third_party/anvil-build/anvil-local.sh build :debug :release


GREP="$1"
if [ -z $GREP ]; then
  GREP=""
  echo "Running all benchmarks..."
else
  echo "Running benchmarks matching '$GREP'..."
fi

./scripts/run-benchmarks.js $GREP
