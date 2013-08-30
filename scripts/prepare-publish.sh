#!/bin/bash

# Copyright 2013 Google Inc. All Rights Reserved.

# This script is only to be used by contributors.
# This will build everything and get it all ready for publishing.

# This must currently run from the root of the repo
# TODO(benvanik): make this runnable from anywhere (find git directory?)
if [ ! -d ".git" ]; then
  echo "This script must be run from the root of the repository (the folder containing .git)"
  exit 1
fi

# =============================================================================
# Build everything
# =============================================================================
echo "Building everything..."

./third_party/anvil-build/anvil-local.sh build :fast :debug :release

rm -rf build-bin/wtf-injector-chrome
./third_party/anvil-build/anvil-local.sh deploy -o build-bin/ extensions/wtf-injector-chrome:deploy
./third_party/anvil-build/anvil-local.sh deploy -o build-bin/ :injector

rm -rf build-bin/wtf-injector-firefox
./third_party/anvil-build/anvil-local.sh deploy -o build-bin/ extensions/wtf-injector-firefox:deploy
cd third_party/firefox-addon-sdk/
source bin/activate
cd ../..
cd build-bin/wtf-injector-firefox/
cfx xpi
cd ../..
mv build-bin/wtf-injector-firefox/web-tracing-framework.xpi build-bin/extensions/

echo ""
echo "Chrome extension:"
echo "  build-bin/extensions/wtf-injector-chrome/wtf-injector-chrome.zip"
echo "Firefox extension:"
echo "  build-bin/extensions/web-tracing-framework.xpi"
echo ""
echo "Ready for npm publish and update-gh-pages."
echo ""
