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

GIT_USERNAME=`git config user.name`
GIT_USEREMAIL=`git config user.email`

# =============================================================================
# Build everything
# =============================================================================
echo "Building everything..."

./scripts/prepare-publish.sh
SRC_PATH=$PWD/build-bin/gh-pages/

echo ""
# =============================================================================
# Look for sibling path or create
# =============================================================================

cd ..
if [ ! -d "tracing-framework-gh-pages" ]; then
  # Not found - create and clone
  echo "Creating tracing-framework-gh-pages..."
  git clone git@github.com:google/tracing-framework.git tracing-framework-gh-pages
  cd tracing-framework-gh-pages
  git checkout gh-pages
else
  # Reset hard to the current version
  echo "Resetting tracing-framework-gh-pages..."
  cd tracing-framework-gh-pages
  git reset --hard
  git pull
  git merge origin/gh-pages
fi

# Be sure to reset username/email to the owner of the source repo
git config user.name "$GIT_USERNAME"
git config user.email "$GIT_USEREMAIL"

echo ""
# =============================================================================
# Copy bin/
# =============================================================================
echo "Updating bin/..."

# Delete all the old contents and recreate
if [ -d "bin" ]; then
  rm -rf bin/
fi
mkdir bin

# Copy bin contents
cp -R $SRC_PATH/* bin/

echo ""
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

