#!/bin/bash

# Copyright 2012 Google Inc. All Rights Reserved.

# wtf unix setup script

# This script will install all dependencies. Everything is local, no need to
# run as root.
#
# Requires:
# - All:
#   - Git 1.7.5+
#   - Python 2.6+
#   - Python easy_install: http://pypi.python.org/pypi/setuptools
#   - node.js v0.8.0+ (containing npm)

# Ensure running as root (or on Cygwin, where it doesn't matter)
if [ "$(id -u)" -eq 0 ]; then
  if [ ! -e "/Cygwin.bat" ]; then
    echo "This script should not be run as root!"
    echo "Run without sudo!"
    exit 1
  fi
fi

# This must currently run from the root of the repo
# TODO(benvanik): make this runnable from anywhere (find git directory?)
if [ ! -d ".git" ]; then
  echo "This script must be run from the root of the repository (the folder containing .git)"
  exit 1
fi

# ==============================================================================
# Check for Python/node/etc
# ==============================================================================
echo "Checking for dependencies..."

echo "- Python 2.6+:"
if [ ! -e "$(which python)" ]; then
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "! Python not found or not in PATH - at least version 2.6 is required           !"
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  exit 1
fi
PYTHON_CHECK=`python -c 'import sys; print(sys.version_info >= (2, 6) and "1" or "0")'`
PYTHON_VERSION=`python -c 'import sys; print(sys.version_info[:])'`
if [ "$PYTHON_CHECK" = "0" ]; then
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "! Python is out of date - at least version 2.6 is required                     !"
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "Your version: $PYTHON_VERSION"
  exit 1
fi
echo "     path: $(which python)"
echo "  version: $PYTHON_VERSION"

echo "- Python easy_install:"
if [ ! -e "$(which easy_install)" ]; then
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "! easy_install not found or not in PATH                                        !"
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "Grab the latest version from: http://pypi.python.org/pypi/setuptools"
  exit 1
fi
echo "     path: $(which easy_install)"

echo "- node.js 0.6.10+:"
if [ ! -e "$(which node)" ]; then
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "! node.js not found or not in PATH - at least version 0.6.10 is required       !"
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "Grab the latest version from: http://nodejs.org/#download"
  exit 1
fi
NODE_CHECK=`node -e "var v = process.version.split('v')[1].split('.'); console.log(v[0] > 0 || v[1] > 8 || v[2] >= 0)"`
NODE_VERSION=`node -e "console.log(process.version)"`
if [ "$NODE_CHECK" = "false" ]; then
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "! node.js is out of date - at least version 0.8.0 is required                 !"
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "Your version: $NODE_VERSION"
  echo "Grab the latest version from: http://nodejs.org/#download"
  exit 1
fi
echo "     path: $(which node)"
echo "  version: $NODE_VERSION"

echo ""
# ==============================================================================
# Git submodules
# ==============================================================================
echo "Fetching submodules..."

git submodule init
git submodule update

echo ""
# =============================================================================
# Node modules
# =============================================================================
echo "Installing node modules..."

NODE_MODULES=( mocha@1.4.2 chai@1.2.0 )

npm install ${NODE_MODULES[@]}

echo ""
# =============================================================================
# Anvil init
# =============================================================================
echo "Setting up anvil-build environment..."

third_party/anvil-build/setup-local.sh

echo ""
