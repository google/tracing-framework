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
#   - Python pip
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
echo ""
echo "- Python pip:"
if [ ! -e "$(which pip)" ]; then
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "! pip not found or not in PATH                                        !"
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "Attemping to install via the system package manager..."
  if [ "$(which easy_install)" ]; then
    # Anything with easy_install (on OS X by default)
    sudo easy_install pip
  elif [ "$(which apt-get 2>/dev/null)" ]; then
    # Linux (Ubuntu)
    sudo apt-get install python-pip
  elif [ "$(which port 2>/dev/null)" ]; then
    # OS X (MacPorts)
    sudo port selfupdate
    sudo port install pip
  else
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    echo "! No supported package manager found!                                          !"
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    echo " If on OS X ensure you install MacPorts (port) and run again"
    echo " Or, manually install these packages:"
    echo "   pip"
    exit 1
  fi
fi
echo "     path: $(which pip)"
echo ""
echo "- node.js 0.8.0+:"
if [ ! -e "$(which node)" ]; then
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "! node.js not found or not in PATH - at least version 0.8.0 is required       !"
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

# On cygwin disable the filemode setting to prevent all the spurious +x diffs.
# This cannot be set globally as git resets it each repo.
if [ -e "/Cygwin.bat" ]; then
  git config core.filemode false
  git submodule foreach git config core.filemode false
fi

# Add an ignored gitignore to closure-linter, as the repo is missing one that
# ignores .pyc files.
echo '.gitignore' > third_party/closure-linter/.gitignore
echo '*.pyc' >> third_party/closure-linter/.gitignore

echo ""
# =============================================================================
# Node modules
# =============================================================================
echo "Installing node modules..."

npm install

echo ""
# =============================================================================
# Anvil init
# =============================================================================
echo "Setting up anvil-build environment..."

third_party/anvil-build/setup-local.sh

echo ""
