# Building


## Setup

    # You may need to do this on Linux
    umask 0022
    # Clone the project
    git clone git@github.com:benvanik/tracing-framework.git
    cd tracing-framework/
    # Run one-time setup of dependencies
    ./scripts/setup.sh

    # Source the utility script to get the nice bash aliases
    # You'll want to do this every time you start up a new prompt
    source wtfrc
    # Start a dev server on port 8080
    anvil serve -p 8080 &
    # Do a full build
    anvil build :debug :release

    # When updating goog.require/provide or soy/gss you must do:
    anvil build :fast

## Extensions/apps

### Injector

#### Debug

    # Deploy a debug build
    anvil deploy -o build-bin/injector/ extensions/chrome/injector:deploy
    # Load build-bin/injector/ as an unpacked extension in Chrome

#### Release

    # Build a full release
    anvil build :release
    # Upload build-out/extensions/chrome/injector/wtf-chrome-extension.zip

### App

#### Debug

The best course of action is to avoid debugging the app entirely:

    # Build only required when changing requires/soy/gss
    anvil build :fast
    # Open /app/maindisplay-debug.html in your browser, edit-refresh!

To debug the app features:

    # Build a debug overlay, required with new files/requires/soy/gss
    anvil build app:debug_view
    # Load unpacked from the tracing-framework/ root

## Platform Notes

### OS X

On the first build attempt (`anvil build :debug :release`) you will be
prompted to install Java if it is not already present. Follow the
dialogs and try again and it should work.
