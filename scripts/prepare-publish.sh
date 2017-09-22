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

GIT_USERNAME=`git config user.name`
GIT_USEREMAIL=`git config user.email`

# =============================================================================
# Build everything
# =============================================================================
echo "Building everything..."

bazel build -c opt \
    //app \
    //app:wtf-app \
    //bindings/js \
    //bindings/js:wtf_trace_min_js_compiled \
    //bindings/js:wtf_node_js_compiled \
    //bindings/js:wtf-trace-web-api \
    //extensions/wtf-injector-chrome

echo ""
# =============================================================================
# Build extensions
# =============================================================================
echo "Building extensions..."

# Firefox.
# rm -rf build-bin/wtf-injector-firefox
# ./third_party/anvil-build/anvil-local.sh deploy -o build-bin/ extensions/wtf-injector-firefox:deploy
# cd third_party/firefox-addon-sdk/
# source bin/activate
# cd ../..
# cd build-bin/wtf-injector-firefox/
# cfx xpi \
#     --update-link https://tracing-framework.appspot.com/CURRENT/web-tracing-framework.xpi \
#     --update-url https://tracing-framework.appspot.com/CURRENT/web-tracing-framework.update.rdf
# cd ../..
# mv build-bin/wtf-injector-firefox/web-tracing-framework.xpi build-bin/extensions/
# mv build-bin/wtf-injector-firefox/web-tracing-framework.update.rdf build-bin/extensions/

echo ""
# =============================================================================
# Build gh-pages
# =============================================================================
echo "Building gh-pages..."

# Ensure we have a sibling tracking-framework-gh-pages checkout.
SELF_DIR=$PWD
GH_PAGES=$PWD/../tracing-framework-gh-pages
if [ ! -d "$GH_PAGES" ]; then
  # Not found - create and clone.
  echo "Creating tracing-framework-gh-pages..."
  git clone git@github.com:google/tracing-framework.git $GH_PAGES
  cd $GH_PAGES
  git checkout gh-pages
else
  # Reset hard to the current version.
  echo "Resetting tracing-framework-gh-pages..."
  cd $GH_PAGES
  git reset --hard
  git pull
  git merge origin/gh-pages
fi
cd $SELF_DIR

# Reset existing bin dir.
if [ -d "$GH_PAGES/bin" ]; then
  rm -rf $GH_PAGES/bin/
fi

# Copy binaries from build results and source tree.
mkdir -p $GH_PAGES/bin
cp bazel-bin/app/wtf-app.zip $GH_PAGES/bin/
unzip -q bazel-bin/app/wtf-app.zip -d $GH_PAGES/bin/
cp bazel-bin/bindings/js/wtf-trace-web-api.zip $GH_PAGES/bin/
cp bazel-bin/bindings/js/wtf_trace_min_js_compiled.js $GH_PAGES/bin/
cp bazel-bin/bindings/js/wtf_trace_web_js_compiled.js $GH_PAGES/bin/
cp bazel-bin/bindings/js/wtf_node_js_compiled.js $GH_PAGES/bin/

# Copy extensions from build results.
mkdir $GH_PAGES/bin/extensions
cp bazel-bin/extensions/wtf-injector-chrome/wtf-injector-chrome.zip $GH_PAGES/bin/extensions/
# cp bazel-bin/extensions/web-tracing-framework.* $GH_PAGES/extensions/

echo ""
# =============================================================================
# Done!
# =============================================================================
echo "gh-pages:"
echo "  $GH_PAGES/"
echo "Chrome extension:"
echo "  bazel-bin/extensions/wtf-injector-chrome/wtf-injector-chrome.zip"
# echo "Firefox extension:"
# echo "  build-bin/extensions/web-tracing-framework.xpi  <-- zip"
# echo "  build-bin/extensions/web-tracing-framework.update.rdf  <-- update RDF"
echo ""
echo "Ready for npm publish and ./scripts/update-gh-pages.sh"
echo ""
