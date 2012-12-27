@ECHO OFF

REM Copyright 2012 Google Inc. All Rights Reserved.
REM
REM wtf Windows setup script
REM
REM This script will install all dependencies to the system (that it can).
REM The dependencies are all local.
REM
REM Requires:
REM - Git 1.7.5+
REM - Python 2.7+
REM - Python easy_install:  http://pypi.python.org/pypi/setuptools
REM - node.js v0.6.10+ (containing npm)

ECHO.
REM ============================================================================
REM Check for Python/node/etc
REM ============================================================================
ECHO Checking for dependencies...

REM TODO(benvanik): check python/node versions

ECHO WARNING: you need to make sure you have Python 2.6+ and node 0.8.4+!
ECHO WARNING: attempting to install pip - install it yourself if it fails!

easy_install pip

ECHO.
REM ============================================================================
REM Git submodules
REM ============================================================================
ECHO Fetching submodules...

git submodule init
git submodule update

ECHO.
REM ============================================================================
REM Node modules
REM ============================================================================
ECHO Installing node modules...

npm install

ECHO.
REM ============================================================================
REM Anvil init
REM ============================================================================
ECHO Setting up anvil-build environment...

third_party\anvil-build\setup-local.bat

ECHO.
