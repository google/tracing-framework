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

sed --version 2>&1 | grep GNU &> /dev/null
is_bsd=$?

# =============================================================================
# Compute build information
# =============================================================================

GIVEN_TAG="$1"
if [ -z $GIVEN_TAG ]; then
  GIVEN_TAG="1"
fi

ver_commit=`git rev-parse HEAD`

ver_major=`date +%Y`
ver_minor=`date +%-m`
ver_patch=`date +%-d`
ver_tag=$GIVEN_TAG
ver_string="$ver_major.$ver_minor.$ver_patch-$ver_tag"
if [ $is_bsd -eq 1 ]; then
  ver_time=`date -j -f "%Y.%m.%d-%H.%M.%S" "$ver_string.0.0" "+%s000"`
else
  ver_time=`date --date="$ver_major-$ver_minor-$ver_patch $ver_tag:0:0" +%s000`
fi
echo "Build version: $ver_string"


# =============================================================================
# Update files
# =============================================================================
echo "Updating files..."

echo "-> package.json"
# __"version": "2012.12.17-1",
sed -i.bak \
    "s/^\ \ \"version\": \".*\",$/\ \ \"version\": \""$ver_string"\",/" \
    package.json
rm package.json.bak

echo "-> extensions/wtf-injector-chrome/manifest.json"
# __"version": "2012.12.17.1",
manifest_string="$ver_major.$ver_minor.$ver_patch.$ver_tag"
sed -i.bak \
    "s/^\ \ \"version\": \".*\",$/\ \ \"version\": \"$manifest_string\",/" \
    extensions/wtf-injector-chrome/manifest.json
rm extensions/wtf-injector-chrome/manifest.json.bak

echo "-> extensions/wtf-injector-firefox/package.json"
# __"version": "2012.12.17.1",
manifest_string="$ver_major.$ver_minor.$ver_patch.$ver_tag"
sed -i.bak \
    "s/^\ \ \"version\": \".*\",$/\ \ \"version\": \"$manifest_string\",/" \
    extensions/wtf-injector-firefox/package.json
rm extensions/wtf-injector-firefox/package.json.bak

echo "-> src/wtf/version.js"
# __return 1355734800000; // time
sed -i.bak \
    "s/return\ [0-9][0-9]*;\ \/\/ time/return $ver_time; \/\/ time/" \
    src/wtf/version.js
# __return '2012.12.12-2'; // string
sed -i.bak \
    "s/return\ '.*';\ \/\/\ string/return \'$ver_string\';\ \/\/\ string/" \
    src/wtf/version.js
# __return '5aab3e2c4a6ebbdc7bef94d7daac5fa0452f4556'; // sha
sed -i.bak \
    "s/return\ '.*';\ \/\/\ sha/return \'$ver_commit\'; \/\/ sha/" \
    src/wtf/version.js
rm src/wtf/version.js.bak

echo ""


# =============================================================================
# Stage and commit
# =============================================================================
echo "Committing changes..."

git commit -o -m "Updating version to $ver_string." \
    package.json \
    extensions/wtf-injector-chrome/manifest.json \
    extensions/wtf-injector-firefox/package.json \
    src/wtf/version.js
