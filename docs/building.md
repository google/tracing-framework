# Building

## Setup

```bash
# You may need to do this on Linux
umask 0022
# Clone the project
git clone git@github.com:google/tracing-framework.git
cd tracing-framework/
# Run one-time setup of dependencies
./scripts/setup.sh # or setup.bat on Windows

# Source the utility script to get the nice bash aliases
# You'll want to do this every time you start up a new prompt
source wtfrc
# Start a dev server on port 8080
anvil serve -p 8080 &
# Do a full build
anvil build :debug :release

# When updating goog.require/provide or soy/gss you must do:
anvil build :fast
```

## Building the Chrome Extension

The only way to use the injector is to compile a release build. This is because
of all the namespace conflicts and other issues that would come about if you
tried to run it uncompiled in a page with its own content.

### Local Unpacked

If you want to do debugging/use the extension unpacked on a local machine,
deploy it to a local directory:

```bash
# Build a release build and get all of the files in a folder
anvil deploy -o build-bin/ extensions/wtf-injector-chrome:deploy
# Alternatively, use an alias:
deployext
```

Then, use 'Load Unpacked Extension' from `chrome://extensions`. Any time you
update the code you'll have to rerun this step and then reload the extension.

### Chrome Web Store .zip

The Web Store requires a zip file:

```bash
# Build release and deploy a zip
anvil deploy -o build-bin/ :injector
# Load build-bin/wtf-injector-chrome/wtf-injector-chrome.zip as an unpacked extension in Chrome or upload to the CWS
```

## Platform Notes

### OS X

On the first build attempt (`anvil build :debug :release`) you will be
prompted to install Java if it is not already present. Follow the
dialogs and try again and it should work.

### Windows

Although it's (somewhat) possible to use things from Cygwin, some
stuff fails randomly. I recommend using the normal Windows command
prompt.

You'll need to install git, python, and node 0.8+. Once setup,
clone the repo and run `scripts\setup.bat` - everything should
happen automatically.

Keep your working directory in the root tracing-framework\ path and
use the `anvil` commands as described above. Builds may be a little
slower than on *nix systems but should still work!
