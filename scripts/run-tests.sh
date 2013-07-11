#!/bin/bash

# Copyright 2012 Google Inc. All Rights Reserved.

# Run tests quickly.
# This requires up-to-date deps files, produced by 'anvil build :deps'.
#
# If trying to test in an automated environment, prefer using the :test rule:
#   anvil build :test

# This must currently run from the root of the repo
# TODO(benvanik): make this runnable from anywhere (find git directory?)
if [ ! -d ".git" ]; then
  echo "This script must be run from the root of the repository (the folder containing .git)"
  exit 1
fi

# Fast build and ensure test dependencies exist.
./third_party/anvil-build/anvil-local.sh build -j1 :test_external

GREP="$1"
if [ -z $GREP ]; then
  GREP=""
  echo "Running all tests..."
else
  echo "Running tests matching '$GREP'..."
fi

find src/ -name *_test.js -print | xargs \
node_modules/mocha/bin/mocha \
    --ui tdd \
    --reporter dot \
    --require src/wtf/bootstrap/mocha.js \
    --grep "$GREP" \
    --globals "mochaCompletionWaiter,wtf_util_global_cache,closure_uid_*"
