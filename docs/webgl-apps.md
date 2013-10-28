# WebGL Native App Generation

The tracing framework includes a script that can take recordings of WebGL calls
in .wtf-trace files and spit out C code that can replay them outside of the
browser. It's experimental, and if it's missing support for your favorite
feature/compiler target/etc please submit pulls!

## Supported Features

* Basic WebGL recordings
* WebGL Extensions:
  * Various ones that are constant values only (OES_texture_float/etc)
  * ANGLE_instanced_arrays

## Supported Targets

* Linux with OpenGL 3+
* Windows with OpenGL 3+ or ANGLE (D3D9 or D3D11)

MacOS is currently untested but could likely be made to work.

## Installing

### Installing on Windows

[Download
the packaged dependencies](https://drive.google.com/file/d/0Bxv84C6yIt2IQVkzRUVVNk1aTlk/edit) (File->Download) and extract them. By default the
script will look in `C:\Dev\tf-deps\`, but this can be changed with the
`--vs_deps=` option.

### Installing on Linux

```
# Install libgles2
sudo apt-get install libgles2-mesa-dev
# Get/make/install SDL
hg clone http://hg.libsdl.org/SDL
cd SDL/ && ./configure && make && sudo make install && cd ..
# ?
```

## Usage

### Recording a Trace

* Enable the Web Tracing Framework extension on your page via the page action
popup menu.
* After the page reloads use the gear icon in the bottom right of the page to
display the extension options.
* From the Providers group enable WebGL and its 'Embed remote textures' option.
* Perform the desired activity.
* Save the trace to a file.

### Generating the App

#### Windows

* Open a 'Developer Command Prompt for Visual Studio 2012' prompt.
* Execute the script:
```
# Optionally add --use_angle to enable ANGLE support.
# Build with x64 with --vs_platform=x64.
wtf-generate-webgl-app --output=test\some_test-x86\ some_test.wtf-trace
```

* Build and run with the Visual Studio that opens.

#### Linux

* Execute the script:
```
wtf-generate-webgl-app --output=test/ some_test.wtf-trace
```

* Run the output:
```
./test/some_test
```

#### Options

If you want to inspect or modify the generated code use the `--src_output=`
option to specify a destination path for the code.
