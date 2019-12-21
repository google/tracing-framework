#!/bin/bash

# Copyright 2012 Google Inc. All Rights Reserved.

# This script is only to be used by contributors.
# This will build everything, check out the latest tracing-framework gh-pages
# branch, update the bin/ path, and prepare a commit.

# Break on error.
set -e

# This must currently run from the root of the repo
# TODO(benvanik): make this runnable from anywhere (find git directory?)
if [ ! -d ".git" ]; then
  echo "This script must be run from the root of the repository (the folder containing .git)"
  exit 1
fi

echo ""
# =============================================================================
# Look for sibling path or create
# =============================================================================

GH_PAGES=$PWD/../tracing-framework-gh-pages
if [ ! -d "$GH_PAGES" ]; then
  # Not found.
  echo "Run prepare-publish.sh first to create gh-pages repo"
  exit 1
fi
cd $GH_PAGES

# =============================================================================
# Stage all changes
# =============================================================================
echo "Staging changes..."

git add --all bin/
git commit -m "Updating bin/ to the latest version."

echo ""
# =============================================================================
# Push!
# =============================================================================
echo "Pushing changes..."

git push origin gh-pages

echo ""

cd -
