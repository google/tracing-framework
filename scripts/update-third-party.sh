#!/bin/bash

# Copyright 2012 Google Inc. All Rights Reserved.

# This script is only to be used by contributors.
# It will attempt to pull the latest versions of third party code and binaries.
# Before running one should be in a git branch with no pending changes.

# This must currently run from the root of the repo
# TODO(benvanik): make this runnable from anywhere (find git directory?)
if [ ! -d ".git" ]; then
  echo "This script must be run from the root of the repository (the folder containing .git)"
  exit 1
fi

# =============================================================================
# Node modules
# =============================================================================

npm install

# =============================================================================
# Git submodules
# =============================================================================
echo "Updating git modules..."

# TODO(benvanik): update each module
SUBMODULES=( anvil-build closure-compiler closure-library closure-linter closure-stylesheets closure-templates )
cd third_party
for m in ${SUBMODULES[@]}
do
  echo "-> third_party/$m"
  cd $m
  git checkout master
  git pull origin master
  git merge origin/master
  cd ..
done
cd ..
for m in ${SUBMODULES[@]}
do
  git add third_party/$m
done

echo ""
