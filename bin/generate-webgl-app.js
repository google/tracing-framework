#!/usr/bin/env node
/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Generate a standalone native WebGL app.
 * Given an input trace file (with recorded WebGL calls) this app will build a
 * standalone native executable that issues those calls directly to OpenGL.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

var child_process = require('child_process');
var fs = require('fs');
var optimist = require('optimist');
var os = require('os');
var path = require('path');
var tmp = require('temporary');

var toolRunner = require('./tool-runner');
var util = toolRunner.util;
toolRunner.launch(runTool);


var modulePath = path.dirname(module.filename);
var templatePath = path.relative(
    process.cwd(), path.join(modulePath, 'cpp_src'));


function runTool(platform, args, done) {
  var argv = optimist
    .usage('Generate a standalone native WebGL app.\nUsage: $0 source.wtf-trace [output.exe]')
    .options('debug', {
      type: 'boolean',
      default: false,
      desc: 'Debug mode.'
    })
    .options('output', {
      type: 'string',
      default: null,
      desc: 'Output path for executables/data. Defaults to the path of the input file.'
    })
    .options('src_output', {
      type: 'string',
      default: null,
      desc: 'Output path for source files. Defaults to temp.'
    })
    .options('use_angle', {
      type: 'boolean',
      default: false,
      desc: 'Use ANGLE on Windows instead of native GL.'
    })
    .options('vs_config', {
      type: 'string',
      default: 'Release',
      desc: 'Visual Studio configuration to build (Debug/Release).'
    })
    .options('vs_platform', {
      type: 'string',
      default: 'x86',
      desc: 'Visual Studio platform to build (x86/x64).'
    })
    .options('vs_deps', {
      type: 'string',
      default: 'C:\\Dev\\tf-deps\\',
      desc: 'Path to search for dependency includes/libs.'
    })
    .check(function(argv) {
      if (argv['help']) {
        throw '';
      }
      // Assert has a file.
      if (!argv._.length) {
        throw 'Pass a trace file to process.'
      }
      return true;
    })
    .argv;

  if (argv['debug']) {
    goog.require('wtf.replay.graphics.Step');
  }

  var inputFile = path.resolve(argv._[0]);
  var outputBaseFile =
      path.join(argv._[1] || argv['output'] || path.dirname(inputFile),
                path.basename(inputFile, '.wtf-trace'));
  if (!fs.existsSync(path.dirname(outputBaseFile))) {
    fs.mkdirSync(path.dirname(outputBaseFile));
  }

  console.log('Processing ' + inputFile + '...');
  console.log('');

  wtf.db.load(inputFile, function(db) {
    if (db instanceof Error) {
      console.log('ERROR: unable to open ' + inputFile, db, db.stack);
      done(1);
    } else {
      processDatabase(argv, outputBaseFile, db, done);
    }
  });
};



/**
 * Binary file wrapper.
 * @param {string} path File path.
 * @constructor
 */
var BinFile = function(path) {
  /**
   * File handle.
   * @type {number}
   * @private
   */
  this.fd_ = fs.openSync(path, 'w');

  /**
   * Current offset into the file.
   * @type {number}
   * @private
   */
  this.offset_ = 0;
};


/**
 * Closes the file and disposes resources.
 */
BinFile.prototype.dispose = function() {
  fs.closeSync(this.fd_);
};


/**
 * Writes data to the file.
 * @param {!ArrayBufferView} data Array buffer data.
 * @return {number} Offset in the file the data was written to.
 */
BinFile.prototype.write = function(data) {
  var buffer = new Buffer(data.byteLength);
  var byteData =
      data instanceof Uint8Array ? data : new Uint8Array(data.buffer);
  for (var n = 0; n < byteData.length; n++) {
    buffer[n] = byteData[n];
  }

  var offset = this.offset_;
  fs.writeSync(this.fd_, buffer, 0, buffer.length, this.offset_);
  this.offset_ += buffer.length;
  return offset;
};


/**
 * Processes a loaded database.
 * @param {!Object} argv Parsed optimist arguments.
 * @param {string} outputBaseFile Base filename for output (without extension).
 * @param {!wtf.db.Database} db Database.
 * @param {function(number)} done Done callback. 0 for success.
 */
function processDatabase(argv, outputBaseFile, db, done) {
  var templates = {
    header: fs.readFileSync(path.join(templatePath, 'webgl-header.cc'), 'utf8')
  };

  var zones = db.getZones();
  if (!zones.length) {
    console.log('No zones');
    done(1);
    return;
  }

  // TODO(benvanik): find the right zone.
  var zone = zones[0];

  // Build a step list.
  console.log("Building step list...");
  var eventList = zone.getEventList();
  var frameList = zone.getFrameList();
  var steps = wtf.replay.graphics.Step.constructStepsList(eventList, frameList);

  // Open bin file.
  var binFile = new BinFile(outputBaseFile + '.bin');

  console.log("Generating code...");
  var tempDir;
  if (argv['src_output']) {
    tempDir = argv['src_output'];
  } else {
    var tempDirObj = new tmp.Dir();
    tempDir = tempDirObj.path;
    process.on('exit', function() {
      tempDirObj.rmdir();
    });
  }
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // Add all steps.
  var ccFiles = [];
  for (var n = 0; n < steps.length; n++) {
    var step = steps[n];

    // Prep file.
    var output = [];
    output.push(templates.header);

    // Add step function.
    output.push('void step_' + n + '(Replay* replay) {');
    addStep(eventList, n, step, output, binFile);
    output.push('}');

    // Flush.
    var finalOutput = output.join(os.EOL);
    var ccFile = path.basename(outputBaseFile) + '_step_' + n + '.cc';
    ccFile = path.join(tempDir, ccFile);
    fs.writeFileSync(ccFile, finalOutput);
    ccFiles.push(ccFile);
  }

  // Build statics file.
  var output = [];
  output.push(templates.header);

  // Add step list variable.
  var stepFnList = [];
  for (var n = 0; n < steps.length; n++) {
    stepFnList.push('step_' + n + ',');
    output.push('extern void step_' + n + '(Replay* replay);');
  }
  output.push(
      'StepFunction __steps[] = { ' + stepFnList.join(' ') + ' };');
  output.push(
      'int __step_count = ' + stepFnList.length + ';');
  output.push('StepFunction* __get_steps() { return __steps; }');

  // Static info.
  output.push(
      'const char* __trace_name = "' +
          path.basename(outputBaseFile) + '";');
  output.push(
      'const char* __bin_name = "' +
          path.basename(outputBaseFile) + '.bin";');

  // Write output cc file.
  console.log("Writing .cc file...");
  var finalOutput = output.join(os.EOL);
  var ccFile = path.join(tempDir, path.basename(outputBaseFile) + '.cc');
  fs.writeFileSync(ccFile, finalOutput);
  ccFiles.push(ccFile);

  // Finish bin file.
  binFile.dispose();

  // Build!
  console.log("Building executable...");
  build(argv, tempDir, outputBaseFile, ccFiles, done);
};


/**
 * Builds a native app.
 * @param {!Object} argv Parsed options.
 * @param {string} tempDir Root temp path.
 * @param {string} outputBaseFile Base filename for output (without extension).
 * @param {!Array.<string>} ccFiles A list of input .cc files.
 * @param {function(number)} done Done callback. 0 for success.
 */
function build(argv, tempDir, outputBaseFile, ccFiles, done) {
  switch (os.platform()) {
    case 'linux':
      buildWithGcc();
      break;
    case 'win32':
     buildWithVisualStudio();
     break;
    default:
      console.log('Unsupported build platform: ' + os.platform());
      return 1;
  }

  function buildWithGcc() {
    var outputFile = outputBaseFile;

    // Add shared files.
    ccFiles.push(path.join(templatePath, 'webgl-main.cc'));

    // Build base command line for G++.
    var commandLine = [
      'CXXFLAGS="' + [
        '-std=c++0x',
        '-I' + templatePath,
        '-L/usr/local/lib',
        '-Wl,-rpath,/usr/local/lib',
        '-lm -lSDL2 -lpthread -lGL -ldl -lrt',
        '-I/usr/local/include/SDL2',
        '-D_REENTRANT',
      ].join(' ') + '"',
      'LDFLAGS="' + [
        '-o ' + outputFile,
        '-L/usr/local/lib',
        '-lm -lSDL2 -lpthread -lGL -ldl -lrt',
      ].join(' ') + '"',
      'make',
      '-f ' + templatePath + '/Makefile',
      '-j 16',
      'src="' + ccFiles.join(' ') + '"'
    ];

    // Build!
    child_process.exec(
        commandLine.join(' '), {
        }, function(error, stdout, stderr) {
          if (error !== null) {
            console.log(stdout);
            console.log(stderr);
            console.log(error);
            done(1);
          } else {
            done(0);
          }
        });
  };

  function buildWithVisualStudio() {
    var templates = {
      vcxproj: fs.readFileSync(path.join(templatePath, 'msbuild.vcxproj'), 'utf8')
    };

    var config = argv['vs_config'] || 'Debug';
    var platform = argv['vs_platform'] || 'x86';
    var useAngle = argv['use_angle'] || false;
    var depsPath = argv['vs_deps'] || 'C:\\Dev\\tf-deps\\';

    outputBaseFile = path.resolve(outputBaseFile);

    var vcxprojPath =
        path.join(tempDir, path.basename(outputBaseFile)) + '.vcxproj';
    var exeOutputPath;
    if (platform == 'x86') {
      exeOutputPath = path.join(
          tempDir, config,
          path.basename(outputBaseFile)) + '.exe';
    } else if (platform == 'x64') {
      exeOutputPath = path.join(
          tempDir, 'x64', config,
          path.basename(outputBaseFile)) + '.exe';
    }
    var appName = path.basename(outputBaseFile);

    // Generate a list of all .cc include lines.
    var ccFileIncludes = [];
    for (var n = 0; n < ccFiles.length; n++) {
      ccFileIncludes.push('<ClCompile Include="' + ccFiles[n] + '" />');
    }

    // Template the project file.
    var vcxproj = templates.vcxproj;
    vcxproj = vcxproj.replace(/%%APPNAME%%/g, appName);
    vcxproj = vcxproj.replace(/%%DEPS%%/g, depsPath);
    vcxproj = vcxproj.replace(/%%TEMPLATEPATH%%/g, path.resolve(templatePath));
    vcxproj = vcxproj.replace(/%%CCFILES%%/g, ccFileIncludes.join('\n'));
    vcxproj = vcxproj.replace(/%%USEANGLE%%/g, useAngle ? 1 : 0);
    vcxproj = vcxproj.replace(/%%EXEOUTPUTPATH%%/g, outputBaseFile + '.exe');

    // Write out project.
    fs.writeFileSync(vcxprojPath, vcxproj);

    // Copy DLLs to output path.
    function copyFile(src, dest) {
      var content = fs.readFileSync(src, 'binary');
      fs.writeFileSync(dest, content, 'binary');
    }
    var outputBasePath = path.dirname(outputBaseFile);
    copyFile(path.join(
        depsPath, 'angleproject', 'lib', platform, 'libEGL.dll'),
        path.join(outputBasePath, 'libEGL.dll'));
    copyFile(path.join(
        depsPath, 'angleproject', 'lib', platform, 'libGLESv2.dll'),
        path.join(outputBasePath, 'libGLESv2.dll'));
    copyFile(path.join(
        depsPath, 'd3d', platform, 'd3dcompiler_46.dll'),
        path.join(outputBasePath, 'd3dcompiler_46.dll'));
    copyFile(path.join(
        depsPath, 'SDL2-2.0.0', 'lib', platform, 'SDL2.dll'),
        path.join(outputBasePath, 'SDL2.dll'));
    copyFile(path.join(
        depsPath, 'glew-1.10.0', 'bin', 'Release',
        platform == 'x86' ? 'Win32' : 'x64', 'glew32.dll'),
        path.join(outputBasePath, 'glew32.dll'));

    // Invoke msbuild.
    // TODO(benvanik): build with msbuild - right now it just dies.
    console.log('Launching VS because msbuild crashes...');
    var commandLine = [
      'devenv',
      vcxprojPath
    ];
    child_process.exec(commandLine.join(' '));
    done(0);
    // var commandLine = [
    //   'msbuild',
    //   '/p:Configuration=' + config +
    //       ';Platform=' + (platform == 'x86' ? 'Win32' : 'x64'),
    //   vcxprojPath
    // ];
    // child_process.exec(
    //     commandLine.join(' '), {
    //     }, function(error, stdout, stderr) {
    //       if (error !== null) {
    //         // Copy exe out.
    //         console.log(stdout);
    //         console.log(stderr);
    //         console.log(error);
    //         done(1);
    //       } else {
    //         // Copy executable out.
    //         copyFile(exeOutputPath, outputBaseFile + '.exe');
    //         done(0);
    //       }
    //     });
  };
};


function addStep(eventList, stepIndex, step, output, binFile) {
  // Locals used by generators.
  output.push('GLubyte scratch_data[2048]; scratch_data;');
  output.push('GLuint id; id;');
  output.push('const char* shader_sources[1]; shader_sources;');
  output.push('GLint shader_lengths[1]; shader_lengths;');

  // Local context to make it easy to reference.
  // Kept up to date as setContext is hit.
  var initialContextHandle = step.getInitialCurrentContext();
  if (initialContextHandle != -1) {
    output.push(
        'CanvasContext* context = replay->MakeContextCurrent(' +
            initialContextHandle + ');');
  } else {
    output.push('CanvasContext* context = 0;');
  }

  // Walk events.
  var n = 0;
  for (var it = step.getEventIterator(true); !it.done(); it.next()) {
    n++;
    var handler = CALLS[it.getName()];
    if (handler) {
      var args = it.getArguments();
      handler(it, args, output, binFile);
      output.push('CHECK_GL();');
    } else {
      var eventString = it.getLongString().replace(/\n/g, ' ');
      // console.log('Unhandled event: ' + eventString);
      output.push('// UNHANDLED EVENT: ' + eventString);
    }
  }
};


var ENABLE_BIN_FILE = true;
var ONLY_LARGE_BIN_DATA = false;
function embedArray(v, binFile) {
  var targetType;
  if (v instanceof Int8Array) {
    targetType = 'GLbyte';
  } else if (v instanceof Uint8Array) {
    targetType = 'GLubyte';
  } else if (v instanceof Int16Array) {
    targetType = 'GLshort';
  } else if (v instanceof Uint16Array) {
    targetType = 'GLushort';
  } else if (v instanceof Int32Array) {
    targetType = 'GLint';
  } else if (v instanceof Uint32Array) {
    targetType = 'GLuint';
  } else if (v instanceof Float32Array) {
    targetType = 'GLfloat';
  } else {
    targetType = 'GLvoid';
  }

  // If the data is over 16*4b (the size of a mat4x4), place in the bin file.
  if (ENABLE_BIN_FILE &&
      (!ONLY_LARGE_BIN_DATA || v.byteLength > 16 * 4)) {
    // Bin file.
    var offset = binFile.write(v);
    return '(const ' + targetType + '*)' + '(replay->GetBinData(' +
        offset + ', ' + v.byteLength + '))';
  } else {
    // Directly embed.
    var values = Array.prototype.join.call(v, ', ');
    return '(const ' + targetType + '[])' + '{' + values + '}';
  }
};


/**
 * A mapping from event names to functions.
 * @type {!Object.<Function>}
 * @private
 */
var CALLS = {
  'WebGLRenderingContext#attachShader': function(
      it, args, output, binFile) {
    output.push('glAttachShader(' + [
      'context->GetObject(' + args['program'] + ')',
      'context->GetObject(' + args['shader'] + ')'
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#activeTexture': function(
      it, args, output, binFile) {
    output.push('glActiveTexture(' + [
      args['texture']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#bindAttribLocation': function(
      it, args, output, binFile) {
    output.push('glBindAttribLocation(' + [
      'context->GetObject(' + args['program'] + ')',
      args['index'],
      '"' + args['name'] + '"'
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#bindBuffer': function(
      it, args, output, binFile) {
    output.push('glBindBuffer(' + [
      args['target'],
      'context->GetObject(' + args['buffer'] + ')'
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#bindFramebuffer': function(
      it, args, output, binFile) {
    output.push('glBindFramebuffer(' + [
      args['target'],
      'context->GetObject(' + args['framebuffer'] + ')'
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#bindRenderbuffer': function(
      it, args, output, binFile) {
    output.push('glBindRenderbuffer(' + [
      args['target'],
      'context->GetObject(' + args['renderbuffer'] + ')'
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#bindTexture': function(
      it, args, output, binFile) {
    output.push('glBindTexture(' + [
      args['target'],
      'context->GetObject(' + args['texture'] + ')'
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#blendColor': function(
      it, args, output, binFile) {
    output.push('glBlendColor(' + [
      args['red'], args['green'], args['blue'], args['alpha']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#blendEquation': function(
      it, args, output, binFile) {
    output.push('glBlendEquation(' + [
      args['mode']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#blendEquationSeparate': function(
      it, args, output, binFile) {
    output.push('glBlendEquationSeparate(' + [
      args['modeRGB'], args['modeAlpha']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#blendFunc': function(
      it, args, output, binFile) {
    output.push('glBlendFunc(' + [
      args['sfactor'], args['dfactor']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#blendFuncSeparate': function(
      it, args, output, binFile) {
    output.push('glBlendFuncSeparate(' + [
      args['srcRGB'], args['dstRGB'], args['srcAlpha'], args['dstAlpha']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#bufferData': function(
      it, args, output, binFile) {
    var data = args['data'];
    var empty = false;
    if (!data || data.byteLength != args['size']) {
      // Creating as empty.
      empty = true;
    }
    output.push('glBufferData(' + [
      args['target'],
      args['size'],
      empty ? '0' : embedArray(data, binFile),
      args['usage']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#bufferSubData': function(
      it, args, output, binFile) {
    var data = args['data'];
    output.push('glBufferSubData(' + [
      args['target'],
      args['offset'],
      data.byteLength,
      embedArray(data, binFile)
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#checkFramebufferStatus': function(
      it, args, output, binFile) {
    output.push('glCheckFramebufferStatus(' + [
      args['target']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#clear': function(
      it, args, output, binFile) {
    output.push('glClear(' + [
      args['mask']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#clearColor': function(
      it, args, output, binFile) {
    output.push('glClearColor(' + [
      args['red'], args['green'], args['blue'], args['alpha']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#clearDepth': function(
      it, args, output, binFile) {
    output.push('glClearDepth(' + [
      args['depth']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#clearStencil': function(
      it, args, output, binFile) {
    output.push('glClearStencil(' + [
      args['s']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#colorMask': function(
      it, args, output, binFile) {
    output.push('glColorMask(' + [
      args['red'], args['green'], args['blue'], args['alpha']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#compileShader': function(
      it, args, output, binFile) {
    output.push('glCompileShader(' + [
      'context->GetObject(' + args['shader'] + ')'
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#compressedTexImage2D': function(
      it, args, output, binFile) {
    output.push('glCompressedTexImage2D(' + [
      args['target'], args['level'], args['internalformat'],
      args['width'], args['height'], args['border'],
      args['data'].byteLength,
      '(const GLvoid*)' + embedArray(args['data'], binFile)
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#compressedTexSubImage2D': function(
      it, args, output, binFile) {
    output.push('glCompressedTexSubImage2D(' + [
      args['target'], args['level'], args['xoffset'],
      args['yoffset'], args['width'], args['height'],
      args['format'],
      args['data'].byteLength,
      '(const GLvoid*)' + embedArray(args['data'], binFile)
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#copyTexImage2D': function(
      it, args, output, binFile) {
    output.push('glCopyTexImage2D(' + [
      args['target'], args['level'], args['internalformat'],
      args['x'], args['y'], args['width'],
      args['height'], args['border']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#copyTexSubImage2D': function(
      it, args, output, binFile) {
    output.push('glCopyTexSubImage2D(' + [
      args['target'], args['level'], args['xoffset'],
      args['yoffset'], args['x'], args['y'],
      args['width'], args['height']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#createBuffer': function(
      it, args, output, binFile) {
    output.push('glGenBuffers(1, &id);');
    output.push('context->SetObject(' + args['buffer'] + ', id);');
  },
  'WebGLRenderingContext#createFramebuffer': function(
      it, args, output, binFile) {
    output.push('glGenFramebuffers(1, &id);');
    output.push('context->SetObject(' + args['framebuffer'] + ', id);');
  },
  'WebGLRenderingContext#createRenderbuffer': function(
      it, args, output, binFile) {
    output.push('glGenRenderbuffers(1, &id);');
    output.push('context->SetObject(' + args['renderbuffer'] + ', id);');
  },
  'WebGLRenderingContext#createTexture': function(
      it, args, output, binFile) {
    output.push('glGenTextures(1, &id);');
    output.push('context->SetObject(' + args['texture'] + ', id);');
  },
  'WebGLRenderingContext#createProgram': function(
      it, args, output, binFile) {
    output.push('id = glCreateProgram();');
    output.push('context->SetObject(' + args['program'] + ', id);');
  },
  'WebGLRenderingContext#createShader': function(
      it, args, output, binFile) {
    output.push('id = glCreateShader(' + args['type'] + ');');
    output.push('context->SetObject(' + args['shader'] + ', id);');
  },
  'WebGLRenderingContext#cullFace': function(
      it, args, output, binFile) {
    output.push('glCullFace(' + [
      args['mode']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#deleteBuffer': function(
      it, args, output, binFile) {
    output.push('id = context->GetObject(' + args['buffer'] + ');');
    output.push('glDeleteBuffers(1, &id);');
  },
  'WebGLRenderingContext#deleteFramebuffer': function(
      it, args, output, binFile) {
    output.push('id = context->GetObject(' + args['framebuffer'] + ');');
    output.push('glDeleteFramebuffers(1, &id);');
  },
  'WebGLRenderingContext#deleteProgram': function(
      it, args, output, binFile) {
    output.push('id = context->GetObject(' + args['program'] + ');');
    output.push('glDeleteProgram(id);');
  },
  'WebGLRenderingContext#deleteRenderbuffer': function(
      it, args, output, binFile) {
    output.push('id = context->GetObject(' + args['renderbuffer'] + ');');
    output.push('glDeleteRenderbuffer(1, &id);');
  },
  'WebGLRenderingContext#deleteShader': function(
      it, args, output, binFile) {
    output.push('id = context->GetObject(' + args['shader'] + ');');
    output.push('glDeleteShader(id);');
  },
  'WebGLRenderingContext#deleteTexture': function(
      it, args, output, binFile) {
    output.push('id = context->GetObject(' + args['texture'] + ');');
    output.push('glDeleteTextures(1, &id);');
  },
  'WebGLRenderingContext#depthFunc': function(
      it, args, output, binFile) {
    output.push('glDepthFunc(' + [
      args['func']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#depthMask': function(
      it, args, output, binFile) {
    output.push('glDepthMask(' + [
      args['flag']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#depthRange': function(
      it, args, output, binFile) {
    output.push('glDepthRange(' + [
      args['zNear'], args['zFar']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#detachShader': function(
      it, args, output, binFile) {
    output.push('glDetachShader(' + [
      'context->GetObject(' + args['program'] + ')',
      'context->GetObject(' + args['shader'] + ')'
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#disable': function(
      it, args, output, binFile) {
    output.push('glDisable(' + [
      args['cap']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#disableVertexAttribArray': function(
      it, args, output, binFile) {
    output.push('glDisableVertexAttribArray(' + [
      args['index']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#drawArrays': function(
      it, args, output, binFile) {
    output.push('glDrawArrays(' + [
      args['mode'],
      args['first'],
      args['count']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#drawElements': function(
      it, args, output, binFile) {
    output.push('glDrawElements(' + [
      args['mode'],
      args['count'],
      args['type'],
      '(const GLvoid*)' + args['offset']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#enable': function(
      it, args, output, binFile) {
    output.push('glEnable(' + args['cap'] + ');');
  },
  'WebGLRenderingContext#enableVertexAttribArray': function(
      it, args, output, binFile) {
    output.push('glEnableVertexAttribArray(' + args['index'] + ');');
  },
  'WebGLRenderingContext#finish': function(
      it, args, output, binFile) {
    output.push('glFinish();');
  },
  'WebGLRenderingContext#flush': function(
      it, args, output, binFile) {
    output.push('glFlush();');
  },
  'WebGLRenderingContext#framebufferRenderbuffer': function(
      it, args, output, binFile) {
    output.push('glFramebufferRenderbuffer(' + [
      args['target'],
      args['attachment'],
      args['renderbuffertarget'],
      'context->GetObject(' + args['renderbuffer'] + ')'
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#framebufferTexture2D': function(
      it, args, output, binFile) {
    output.push('glFramebufferTexture2D(' + [
      args['target'],
      args['attachment'],
      args['textarget'],
      'context->GetObject(' + args['texture'] + ')',
      args['level']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#frontFace': function(
      it, args, output, binFile) {
    output.push('glFrontFace(' + [
      args['mode']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#generateMipmap': function(
      it, args, output, binFile) {
    output.push('glGenerateMipmap(' + [
      args['target']
    ].join(', ') + ');');
  },
  // 'WebGLRenderingContext#getActiveAttrib': function(
  //     it, args, output, binFile) {
  //   // TODO(chizeng): modify playback to make it work with varying locations.
  //   gl.getActiveAttrib(
  //       /** @type {WebGLProgram} */ (objs[args['program']]), args['index']);
  // },
  // 'WebGLRenderingContext#getActiveUniform': function(
  //     it, args, output, binFile) {
  //   // maybe we must modify playback to obtain the new active uniform.
  //   gl.getActiveUniform(
  //       /** @type {WebGLProgram} */ (objs[args['program']]), args['index']);
  // },
  // 'WebGLRenderingContext#getAttachedShaders': function(
  //     it, args, output, binFile) {
  //   gl.getAttachedShaders(
  //       /** @type {WebGLProgram} */ (objs[args['program']]));
  // },
  // 'WebGLRenderingContext#getAttribLocation': function(
  //     it, args, output, binFile) {
  //   gl.getAttribLocation(
  //       /** @type {WebGLProgram} */ (objs[args['program']]), args['name']);
  // },
  'WebGLRenderingContext#getBufferParameter': function(
      it, args, output, binFile) {
    gl.getBufferParameter(
        args['target'], args['pname']);
    output.push('glGetBufferParameteriv(' + [
      args['target'],
      args['pname'],
      '&scratch_data'
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#getError': function(
      it, args, output, binFile) {
    output.push('glGetError();');
  },
  // 'WebGLRenderingContext#getExtension': function(
  //     it, args, output, binFile) {
  //   // TODO(chizeng): Possibly store the extension?
  //   var originalExtension = args['name'];
  //   var relatedExtension =
  //       playback.extensionManager_.getRelatedExtension(originalExtension);
  //   gl.getExtension(relatedExtension || originalExtension);
  // },
  // 'WebGLRenderingContext#getParameter': function(
  //     it, args, output, binFile) {
  //   gl.getParameter(args['pname']);
  // },
  // 'WebGLRenderingContext#getFramebufferAttachmentParameter': function(
  //     it, args, output, binFile) {
  //   gl.getFramebufferAttachmentParameter(
  //       args['target'], args['attachment'], args['pname']);
  // },
  // 'WebGLRenderingContext#getProgramParameter': function(
  //     it, args, output, binFile) {
  //   gl.getProgramParameter(
  //       /** @type {WebGLProgram} */ (objs[args['program']]), args['pname']);
  // },
  // 'WebGLRenderingContext#getProgramInfoLog': function(
  //     it, args, output, binFile) {
  //   gl.getProgramInfoLog(
  //       /** @type {WebGLProgram} */ (objs[args['program']]));
  // },
  // 'WebGLRenderingContext#getRenderbufferParameter': function(
  //     it, args, output, binFile) {
  //   gl.getRenderbufferParameter(
  //       args['target'], args['pname']);
  // },
  // 'WebGLRenderingContext#getShaderParameter': function(
  //     it, args, output, binFile) {
  //   gl.getShaderParameter(
  //       /** @type {WebGLShader} */ (objs[args['shader']]), args['pname']);
  // },
  // 'WebGLRenderingContext#getShaderPrecisionFormat': function(
  //     it, args, output, binFile) {
  //   gl.getShaderPrecisionFormat(
  //       args['shadertype'], args['precisiontype']);
  // },
  // 'WebGLRenderingContext#getShaderInfoLog': function(
  //     it, args, output, binFile) {
  //   gl.getShaderInfoLog(
  //       /** @type {WebGLShader} */ (objs[args['shader']]));
  // },
  // 'WebGLRenderingContext#getShaderSource': function(
  //     it, args, output, binFile) {
  //   gl.getShaderSource(
  //       /** @type {WebGLShader} */ (objs[args['shader']]));
  // },
  // 'WebGLRenderingContext#getTexParameter': function(
  //     it, args, output, binFile) {
  //   gl.getTexParameter(
  //       args['target'], args['pname']);
  // },
  // 'WebGLRenderingContext#getUniform': function(
  //     it, args, output, binFile) {
  //   gl.getUniform(
  //       /** @type {WebGLProgram} */ (objs[args['program']]),
  //       /** @type {WebGLUniformLocation} */ (objs[args['location']]));
  // },
  'WebGLRenderingContext#getUniformLocation': function(
      it, args, output, binFile) {
    output.push('id = glGetUniformLocation(' + [
      'context->GetObject(' + args['program'] + ')',
      '"' + args['name'] + '"'
    ].join(', ') + ');');
    output.push('context->SetObject(' + args['value'] + ', id);');
  },
  // 'WebGLRenderingContext#getVertexAttrib': function(
  //     it, args, output, binFile) {
  //   gl.getVertexAttrib(
  //       args['index'], args['pname']);
  // },
  // 'WebGLRenderingContext#getVertexAttribOffset': function(
  //     it, args, output, binFile) {
  //   gl.getVertexAttribOffset(
  //       args['index'], args['pname']);
  // },
  'WebGLRenderingContext#hint': function(
      it, args, output, binFile) {
    output.push('glHint(' + [
      args['target'], args['mode']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#isBuffer': function(
      it, args, output, binFile) {
    output.push('glIsBuffer(' + [
      'context->GetObject(' + args['buffer'] + ')'
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#isEnabled': function(
      it, args, output, binFile) {
    output.push('glIsEnabled(' + [
      args['cap']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#isFramebuffer': function(
      it, args, output, binFile) {
    output.push('glIsFramebuffer(' + [
      'context->GetObject(' + args['framebuffer'] + ')',
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#isProgram': function(
      it, args, output, binFile) {
    output.push('glIsProgram(' + [
      'context->GetObject(' + args['program'] + ')',
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#isRenderbuffer': function(
      it, args, output, binFile) {
    output.push('glIsRenderbuffer(' + [
      'context->GetObject(' + args['renderbuffer'] + ')',
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#isShader': function(
      it, args, output, binFile) {
    output.push('glIsShader(' + [
      'context->GetObject(' + args['shader'] + ')',
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#isTexture': function(
      it, args, output, binFile) {
    output.push('glIsTexture(' + [
      'context->GetObject(' + args['texture'] + ')',
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#lineWidth': function(
      it, args, output, binFile) {
    output.push('glLineWidth(' + [
      args['width']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#linkProgram': function(
      it, args, output, binFile) {
    // Do all the attribute bindings, then link.
    var attribMap = args['attributes'];
    for (var attribName in attribMap) {
      output.push('glBindAttribLocation(' + [
        'context->GetObject(' + args['program'] + ')',
        attribMap[attribName],
        '"' + attribName + '"'
      ].join(', ') + ');');
    }
    output.push('glLinkProgram(' + [
      'context->GetObject(' + args['program'] + ')'
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#pixelStorei': function(
      it, args, output, binFile) {
    output.push('glPixelStorei(' + [
      args['pname'], args['param']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#polygonOffset': function(
      it, args, output, binFile) {
    output.push('glPolygonOffset(' + [
      args['factor'], args['units']
    ].join(', ') + ');');
  },
  // 'WebGLRenderingContext#readPixels': function(
  //     it, args, output, binFile) {
  //   var pixels = new Uint8Array(args['size']);
  //   gl.readPixels(args['x'], args['y'],
  //       args['width'], args['height'], args['format'],
  //       args['type'], pixels);
  // },
  'WebGLRenderingContext#renderbufferStorage': function(
      it, args, output, binFile) {
    // Fixup for ANGLE:
    var internalformat = args['internalformat'];
    if (process.platform == 'win32') {
      if (internalformat == 0x84F9) {
        // GL_DEPTH_STENCIL_OES -> GL_DEPTH24_STENCIL8_OES
        internalformat = 0x88F0;
      }
    }
    output.push('glRenderbufferStorage(' + [
      args['target'], internalformat, args['width'], args['height']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#sampleCoverage': function(
      it, args, output, binFile) {
    output.push('glSampleCoverage(' + [
      args['value'], args['invert']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#scissor': function(
      it, args, output, binFile) {
    output.push('glScissor(' + [
      args['x'], args['y'], args['width'], args['height']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#shaderSource': function(
      it, args, output, binFile) {
    var finalSource = args['source'];
    finalSource = finalSource.replace(/\n/g, '\\n');
    finalSource = finalSource.replace(/"/g, '\\"');
    output.push('shader_sources[0] = "' + finalSource + '";');
    output.push('shader_lengths[0] = ' + finalSource.length + ';');
    output.push('glShaderSource(' + [
      'context->GetObject(' + args['shader'] + ')',
      '1',
      'shader_sources',
      'shader_lengths'
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#stencilFunc': function(
      it, args, output, binFile) {
    output.push('glStencilFunc(' + [
      args['func'], args['ref'], args['mask']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#stencilFuncSeparate': function(
      it, args, output, binFile) {
    output.push('glStencilFuncSeparate(' + [
      args['face'], args['func'], args['ref'], args['mask']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#stencilMask': function(
      it, args, output, binFile) {
    output.push('glStencilMask(' + [
      args['mask']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#stencilMaskSeparate': function(
      it, args, output, binFile) {
    output.push('glStencilMaskSeparate(' + [
      args['face'], args['mask']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#stencilOp': function(
      it, args, output, binFile) {
    output.push('glStencilOp(' + [
      args['fail'], args['zfail'], args['zpass']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#stencilOpSeparate': function(
      it, args, output, binFile) {
    output.push('glStencilOpSeparate(' + [
      args['face'], args['fail'], args['zfail'], args['zpass']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#texImage2D': function(
      it, args, output, binFile) {
    var dataType = args['dataType'];
    if (dataType == 'pixels') {
      output.push('glTexImage2D(' + [
          args['target'],
          args['level'],
          args['internalformat'],
          args['width'],
          args['height'],
          args['border'],
          args['format'],
          args['type'],
          '(const GLvoid*)' + embedArray(args['pixels'], binFile)
      ].join(', ') + ');');
    } else if (dataType == 'null') {
      output.push('glTexImage2D(' + [
        args['target'],
        args['level'],
        args['internalformat'],
        args['width'],
        args['height'],
        args['border'],
        args['format'],
        args['type'],
        '0'
      ].join(', ') + ');');
    } else {
      // gl.texImage2D(
      //     args['target'],
      //     args['level'],
      //     args['internalformat'],
      //     args['format'],
      //     args['type'],
      //     /** @type {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} */
      //     (playback.resources_[eventId])
      // );
      output.push('// UNHANDLED TEXIMAGE2D');
    }
  },
  'WebGLRenderingContext#texSubImage2D': function(
      it, args, output, binFile) {
    var dataType = args['dataType'];
    if (dataType == 'pixels') {
      // gl.texSubImage2D(
      //     args['target'],
      //     args['level'],
      //     args['xoffset'],
      //     args['yoffset'],
      //     args['width'],
      //     args['height'],
      //     args['format'],
      //     args['type'],
      //     playback.coercePixelType_(args['type'], args['pixels'])
      // );
      output.push('glTexSubImage2D(' + [
        args['target'],
        args['level'],
        args['xoffset'],
        args['yoffset'],
        args['width'],
        args['height'],
        args['format'],
        args['type'],
        '(const GLvoid*)' + embedArray(args['pixels'], binFile)
      ].join(', ') + ');');
    } else if (dataType == 'null') {
      output.push('glTexSubImage2D(' + [
        args['target'],
        args['level'],
        args['xoffset'],
        args['yoffset'],
        args['width'],
        args['height'],
        args['format'],
        args['type'],
        '0'
      ].join(', ') + ');');
    } else {
      // gl.texSubImage2D(
      //     args['target'],
      //     args['level'],
      //     args['xoffset'],
      //     args['yoffset'],
      //     args['format'],
      //     args['type'],
      //     /** @type {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} */
      //     (playback.resources_[eventId])
      // );
      output.push('// UNHANDLED TEXSUBIMAGE2D');
    }
  },
  'WebGLRenderingContext#texParameterf': function(
      it, args, output, binFile) {
    output.push('glTexParameterf(' + [
      args['target'], args['pname'], args['param']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#texParameteri': function(
      it, args, output, binFile) {
    output.push('glTexParameteri(' + [
      args['target'], args['pname'], args['param']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#uniform1f': function(
      it, args, output, binFile) {
    output.push('glUniform1f(' + [
      'context->GetObject(' + args['location'] + ')',
      args['x']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#uniform1fv': function(
      it, args, output, binFile) {
    var v = args['v'];
    output.push('glUniform1fv(' + [
      'context->GetObject(' + args['location'] + ')',
      v.length / 1,
      embedArray(v, binFile),
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#uniform1i': function(
      it, args, output, binFile) {
    output.push('glUniform1i(' + [
      'context->GetObject(' + args['location'] + ')',
      args['x']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#uniform1iv': function(
      it, args, output, binFile) {
    var v = args['v'];
    output.push('glUniform1iv(' + [
      'context->GetObject(' + args['location'] + ')',
      v.length / 1,
      embedArray(v, binFile)
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#uniform2f': function(
      it, args, output, binFile) {
    output.push('glUniform2f(' + [
      'context->GetObject(' + args['location'] + ')',
      args['x'], args['y']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#uniform2fv': function(
      it, args, output, binFile) {
    var v = args['v'];
    output.push('glUniform2fv(' + [
      'context->GetObject(' + args['location'] + ')',
      v.length / 2,
      embedArray(v, binFile)
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#uniform2i': function(
      it, args, output, binFile) {
    output.push('glUniform2i(' + [
      'context->GetObject(' + args['location'] + ')',
      args['x'], args['y']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#uniform2iv': function(
      it, args, output, binFile) {
    var v = args['v'];
    output.push('glUniform2iv(' + [
      'context->GetObject(' + args['location'] + ')',
      v.length / 2,
      embedArray(v, binFile)
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#uniform3f': function(
      it, args, output, binFile) {
    output.push('glUniform3f(' + [
      'context->GetObject(' + args['location'] + ')',
      args['x'], args['y'], args['z']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#uniform3fv': function(
      it, args, output, binFile) {
    var v = args['v'];
    output.push('glUniform3fv(' + [
      'context->GetObject(' + args['location'] + ')',
      v.length / 3,
      embedArray(v, binFile)
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#uniform3i': function(
      it, args, output, binFile) {
    output.push('glUniform3i(' + [
      'context->GetObject(' + args['location'] + ')',
      args['x'], args['y'], args['z']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#uniform3iv': function(
      it, args, output, binFile) {
    var v = args['v'];
    output.push('glUniform3iv(' + [
      'context->GetObject(' + args['location'] + ')',
      v.length / 3,
      embedArray(v, binFile)
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#uniform4f': function(
      it, args, output, binFile) {
    output.push('glUniform4f(' + [
      'context->GetObject(' + args['location'] + ')',
      args['x'], args['y'], args['z'], args['w']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#uniform4fv': function(
      it, args, output, binFile) {
    var v = args['v'];
    output.push('glUniform4fv(' + [
      'context->GetObject(' + args['location'] + ')',
      v.length / 4,
      embedArray(v, binFile)
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#uniform4i': function(
      it, args, output, binFile) {
    output.push('glUniform4i(' + [
      'context->GetObject(' + args['location'] + ')',
      args['x'], args['y'], args['z'], args['w']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#uniform4iv': function(
      it, args, output, binFile) {
    var v = args['v'];
    output.push('glUniform4iv(' + [
      'context->GetObject(' + args['location'] + ')',
      v.length / 4,
      embedArray(v, binFile)
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#uniformMatrix2fv': function(
      it, args, output, binFile) {
    var v = args['value'];
    output.push('glUniformMatrix2fv(' + [
      'context->GetObject(' + args['location'] + ')',
      v.length / 4,
      args['transpose'],
      embedArray(v, binFile)
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#uniformMatrix3fv': function(
      it, args, output, binFile) {
    var v = args['value'];
    output.push('glUniformMatrix3fv(' + [
      'context->GetObject(' + args['location'] + ')',
      v.length / 9,
      args['transpose'],
      embedArray(v, binFile)
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#uniformMatrix4fv': function(
      it, args, output, binFile) {
    var v = args['value'];
    output.push('glUniformMatrix4fv(' + [
      'context->GetObject(' + args['location'] + ')',
      v.length / 16,
      args['transpose'],
      embedArray(v, binFile)
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#useProgram': function(
      it, args, output, binFile) {
    output.push('glUseProgram(' + [
      'context->GetObject(' + args['program'] + ')',
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#validateProgram': function(
      it, args, output, binFile) {
    output.push('glValidateProgram(' + [
      'context->GetObject(' + args['program'] + ')',
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#vertexAttrib1fv': function(
      it, args, output, binFile) {
    var v = args['values'];
    output.push('glVertexAttrib1fv(' + [
      args['indx'],
      embedArray(v, binFile)
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#vertexAttrib2fv': function(
      it, args, output, binFile) {
    var v = args['values'];
    output.push('glVertexAttrib2fv(' + [
      args['indx'],
      embedArray(v, binFile)
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#vertexAttrib3fv': function(
      it, args, output, binFile) {
    var v = args['values'];
    output.push('glVertexAttrib3fv(' + [
      args['indx'],
      embedArray(v, binFile)
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#vertexAttrib4fv': function(
      it, args, output, binFile) {
    var v = args['values'];
    output.push('glVertexAttrib4fv(' + [
      args['indx'],
      embedArray(v, binFile)
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#vertexAttrib1f': function(
      it, args, output, binFile) {
    output.push('glVertexAttrib1f(' + [
      args['indx'], args['x']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#vertexAttrib2f': function(
      it, args, output, binFile) {
    output.push('glVertexAttrib2f(' + [
      args['indx'], args['x'], args['y']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#vertexAttrib3f': function(
      it, args, output, binFile) {
    output.push('glVertexAttrib3f(' + [
      args['indx'], args['x'], args['y'], args['z']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#vertexAttrib4f': function(
      it, args, output, binFile) {
    output.push('glVertexAttrib4f(' + [
      args['indx'], args['x'], args['y'], args['z'], args['w']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#vertexAttribPointer': function(
      it, args, output, binFile) {
    output.push('glVertexAttribPointer(' + [
      args['indx'],
      args['size'],
      args['type'],
      args['normalized'],
      args['stride'],
      '(const GLvoid*)' + args['offset']
    ].join(', ') + ');');
  },
  'WebGLRenderingContext#viewport': function(
      it, args, output, binFile) {
    output.push('glViewport(' + [
      args['x'], args['y'], args['width'], args['height']
    ].join(', ') + ');');
  },

  'ANGLEInstancedArrays#drawArraysInstancedANGLE': function(
      it, args, output, binFile) {
    output.push('glDrawArraysInstancedWGL(' + [
      args['mode'],
      args['first'],
      args['count'],
      args['primcount']
    ].join(', ') + ');');
  },
  'ANGLEInstancedArrays#drawElementsInstancedANGLE': function(
      it, args, output, binFile) {
    output.push('glDrawElementsInstancedWGL(' + [
      args['mode'],
      args['count'],
      args['type'],
      '(const GLvoid*)' + args['offset'],
      args['primcount']
    ].join(', ') + ');');
  },
  'ANGLEInstancedArrays#vertexAttribDivisorANGLE': function(
      it, args, output)  {
    output.push('glVertexAttribDivisorWGL(' + [
      args['index'],
      args['divisor']
    ].join(', ') + ');');
  },

  'WebGLRenderingContext#isContextLost': function(it, args, output, binFile) {
    // Ignored.
  },

  'wtf.webgl#createContext': function(it, args, output, binFile) {
    var attributes = args['attributes'];
    var contextHandle = args['handle'];

    var callArgs = [
      contextHandle
    ];

    if (attributes) {
      // TODO(benvanik): attributes.
    }

    output.push(
        'context = replay->CreateContext(' + callArgs.join(', ') + ');');
  },
  'wtf.webgl#setContext': function(it, args, output, binFile) {
    var contextHandle = args['handle'];
    var width = args['width'];
    var height = args['height'];

    var callArgs = [
      contextHandle,
      width,
      height
    ];
    output.push(
        'context = replay->MakeContextCurrent(' + callArgs.join(', ') + ');');
  }
};
