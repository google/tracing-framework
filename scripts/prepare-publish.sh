#!/bin/bash

# Copyright 2013 Google Inc. All Rights Reserved.

# This script is only to be used by contributors.
# This will build everything and get it all ready for publishing.

# Break on error.
set -e

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

echo ""
# =============================================================================
# Build extensions
# =============================================================================
echo "Building extensions..."

# Chrome.
rm -rf build-bin/wtf-injector-chrome
./third_party/anvil-build/anvil-local.sh deploy -o build-bin/ extensions/wtf-injector-chrome:deploy
./third_party/anvil-build/anvil-local.sh deploy -o build-bin/ :injector

# Firefox.
rm -rf build-bin/wtf-injector-firefox
./third_party/anvil-build/anvil-local.sh deploy -o build-bin/ extensions/wtf-injector-firefox:deploy
cd third_party/firefox-addon-sdk/
source bin/activate
cd ../..
cd build-bin/wtf-injector-firefox/
cfx xpi \
    --update-link https://tracing-framework.appspot.com/CURRENT/web-tracing-framework.xpi \
    --update-url https://tracing-framework.appspot.com/CURRENT/web-tracing-framework.update.rdf
cd ../..
mv build-bin/wtf-injector-firefox/web-tracing-framework.xpi build-bin/extensions/
mv build-bin/wtf-injector-firefox/web-tracing-framework.update.rdf build-bin/extensions/

echo ""
# =============================================================================
# Build gh-pages
# =============================================================================
echo "Building gh-pages..."

# Clean first.
rm -rf build-bin/gh-pages/

./third_party/anvil-build/anvil-local.sh deploy -o build-bin/gh-pages/ :release

# Copy around extension files.
cp build-bin/extensions/web-tracing-framework.* build-bin/gh-pages/extensions/
rm -rf build-bin/gh-pages/extensions/wtf-injector-firefox/
mv build-bin/gh-pages/extensions/wtf-injector-chrome/wtf-injector-chrome.zip build-bin/gh-pages/extensions/
rmdir build-bin/gh-pages/extensions/wtf-injector-chrome/

echo ""
# =============================================================================
# Done!
# =============================================================================
echo "gh-pages:"
echo "  build-bin/gh-pages/"
echo "Chrome extension:"
echo "  build-bin/extensions/wtf-injector-chrome/wtf-injector-chrome.zip"
echo "Firefox extension:"
echo "  build-bin/extensions/web-tracing-framework.xpi  <-- zip"
echo "  build-bin/extensions/web-tracing-framework.update.rdf  <-- update RDF"
echo ""
echo "Ready for npm publish and ./scripts/update-gh-pages.sh"
echo ""
