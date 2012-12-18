#!/bin/bash

# Copyright 2012 Google Inc. All Rights Reserved.

# This script is only to be used by contributors.
# It will take the current date and a given build number and modify the
# files required.

# This must currently run from the root of the repo
# TODO(benvanik): make this runnable from anywhere (find git directory?)
if [ ! -d ".git" ]; then
  echo "This script must be run from the root of the repository (the folder containing .git)"
  exit 1
fi

# =============================================================================
# Compute build information
# =============================================================================

GIVEN_TAG="$1"
if [ -z $GIVEN_TAG ]; then
  GIVEN_TAG="1"
fi

ver_major=`date +%Y`
ver_minor=`date +%m`
ver_patch=`date +%d`
ver_tag=$GIVEN_TAG
ver_string="$ver_major.$ver_minor.$ver_patch-$ver_tag"
ver_time=`date -j -f "%Y.%m.%d-%H.%M.%S" "$ver_string.0.0" "+%s000"`
echo "Build version: $ver_string"


# =============================================================================
# Update files
# =============================================================================
echo "Updating files..."

echo "-> package.json"
# __"version": "2012.12.17-1",
sed -i '' \
    "s/^\ \ \"version\": \".*\",$/\ \ \"version\": \""$ver_string"\",/" \
    package.json

echo "-> injector/wtf-injector-chrome/manifest.json"
# __"version": "2012.12.17.1",
manifest_string="$ver_major.$ver_minor.$ver_patch.$ver_tag"
sed -i '' \
    "s/^\ \ \"version\": \".*\",$/\ \ \"version\": \"$manifest_string\",/" \
    injector/wtf-injector-chrome/manifest.json

echo "-> src/wtf/version.js"
# __return 1355734800000; /* set via update-version.sh */
sed -i '' \
    "s/^\ \ return\ [0-9][0-9]*;\ \/\* set /  return $ver_time; \/* set /" \
    src/wtf/version.js
# __return '2012.12.12-2'; /* set via update-version.sh */
sed -i '' \
    "s/^\ \ return\ \'.*\';\ \/\* set /  return \'$ver_string\'; \/* set /" \
    src/wtf/version.js

echo ""
