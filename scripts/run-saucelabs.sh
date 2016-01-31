#!/bin/bash

# Copyright 2012 Google Inc. All Rights Reserved.

# Run saucelab tests.

# This must currently run from the root of the repo
# TODO(benvanik): make this runnable from anywhere (find git directory?)
if [ ! -d ".git" ]; then
  echo "This script must be run from the root of the repository (the folder containing .git)"
  exit 1
fi

# Ignore if running without the access key.
if [ -z "$SAUCE_ACCESS_KEY" ]; then
  echo "No \$SAUCE_ACCESS_KEY set, skipping sauce run."
  exit
fi

echo "Beginning sauce run, this could take awhile..."

# Full build of WTF.
./third_party/anvil-build/anvil-local.sh build :debug :release

# Launch local server.
# Port 8001 was chosen because its on the list of ports that Sauce Connect will
# proxy.
# TODO(benvanik): only start if needed
./third_party/anvil-build/anvil-local.sh serve -p 8001 &
serverPid=$!

# Install and run the sauce-connect app to proxy localhost out.
# TODO(benvanik): only start if needed
echo "Installing Sauce Connect..."
if [ ! -d "build-test" ]; then
  mkdir build-test
fi
cd build-test/
if [ ! -e "Sauce-Connect.jar" ]; then
  curl -O https://saucelabs.com/downloads/Sauce-Connect-latest.zip
  unzip Sauce-Connect-latest.zip
fi
if [ -e "sauce_connect.log" ]; then
  rm sauce_connect.log
  rm sauce_ready
fi
echo "Launching Sauce Connect..."
java -jar Sauce-Connect.jar \
    tracing-framework $SAUCE_ACCESS_KEY \
    --fast-fail-regexps "google.com,opera.com,saucelabs.com,favicon.ico" \
    --readyfile sauce_ready \
    1>/dev/null &
sauceConnectPid=$!
# Watch sauce_connect.log for 'INFO - Connected!'
sleep 4
while ! grep -q 'Connected!' sauce_connect.log; do sleep 1; done
cd ..

# Run the actual tests.
echo "Running tests..."
./scripts/run-saucelabs.js
status=$?

# Cleanup
kill $serverPid
kill $sauceConnectPid

exit $?
