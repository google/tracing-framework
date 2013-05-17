#!/usr/bin/env node
/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview WebGL call-log code generator tool.
 * Generates WebGL call code for the replay utility from the given trace.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

var toolRunner = require('./tool-runner');
var util = toolRunner.util;
toolRunner.launch(runTool);


/**
 * WebGL call-log code generator tool.
 * @param {!wtf.pal.IPlatform} platform Platform abstraction layer.
 * @param {!Array.<string>} args Command line arguments.
 * @return {number|!goog.async.Deferred} Return code or a deferred that is
 *     called back when the tool exits.
 */
function runTool(platform, args) {
  var inputFile = args[0];
  if (!inputFile) {
    console.log('usage: webglgen.js file.wtf-trace');
    return -1;
  }

  var log = console.log;

  var argTable = buildArgTable_();

  var frameStart = 0;
  var frameNumber = 0;

  var resources = [];
  var nextResourceId = 0;

  var currentContext = 0;

  // ctxs = [gl, gl, gl, ...];
  // objs = { handle : object };
  // frame(number, startTime, fn, endTime);

  var traceListener = wtf.analysis.createTraceListener({
    'sourceAdded': function(timebase, contextInfo) {
      frameStart = timebase;
    },

    'wtf.timing#frameStart': function(e) {
      log('}, [' + resources.join(', ') + ']);');
      resources.length = 0;
      frameNumber = e.args['number'];
      log('frame(' +
          frameNumber + ', ' +
          '"' + util.formatTime(e.time) + '"' +
          ', function(ctxs, objs, resources) {');
      log('  var result;');
      log('  var gl = ctxs[' + currentContext + '];');
      frameStart = e.time;
    },
    'wtf.timing#frameEnd': function(e) {
      log('}, [' + resources.join(', ') + '], "' + util.formatTime(e.time) + '");');
      resources.length = 0;
      log('intraFrame(function(ctxs, objs, resources) {');
      log('  var result;');
      log('  var gl = ctxs[' + currentContext + '];');
    },

    'webglcapture.createContext': function(e) {
      log('  createContext(' +
          e.args['handle'] + ', ' + e.args['attributes'] + ')');
    },

    'webglcapture.setContext': function(e) {
      currentContext = e.args['handle'];
      log('  gl = ctxs[' + currentContext + '];');
      log('  reshapeContext(gl, ' + e.args['width'] + ', ' + e.args['height'] + ');');
    },

    'custom': function(e) {
      if (e instanceof wtf.analysis.ScopeEvent &&
          e.eventType.name.indexOf('WebGLRenderingContext#') == 0) {
        //util.logEvent(e, e.scope.getId(), e.args);
        var callName = e.eventType.name.substr(22);
        var offsetMs = util.pad(
            '+' + ((e.time - frameStart) | 0) + 'ms', -6);

        var argString = '';
        switch (callName) {
          case 'bufferData':
            var size = e.args['size'];
            var data = e.args['data'];
            if (data.length != size) {
              data = size;
            } else {
              data = 'new Uint8Array([' + data + '])';
            }
            argString = [
              e.args['target'],
              data,
              e.args['usage']
            ].join(', ');
            break;
          case 'texImage2D':
            switch (e.args['dataType']) {
              case 'pixels':
                argString = [
                  e.args['target'],
                  e.args['level'],
                  e.args['internalformat'],
                  e.args['width'],
                  e.args['height'],
                  e.args['border'],
                  e.args['format'],
                  e.args['type'],
                  'new Uint8Array([' + e.args['pixels'] + '])'
                ].join(', ');
                break;
              case 'null':
                argString = [
                  e.args['target'],
                  e.args['level'],
                  e.args['internalformat'],
                  e.args['width'],
                  e.args['height'],
                  e.args['border'],
                  e.args['format'],
                  e.args['type'],
                  'null'
                ].join(', ');
                break;
              default:
                argString = [
                  e.args['target'],
                  e.args['level'],
                  e.args['internalformat'],
                  e.args['format'],
                  e.args['type'],
                  'resources[' + nextResourceId + ']'
                ].join(', ');
                resources.push(
                    '{' +
                    '  id: ' + nextResourceId + ',' +
                    '  type: "image",' +
                    '  mimeType: "' + e.args['dataType'] + '",' +
                    '  data: new Uint8Array([' + e.args['pixels'] + '])' +
                    '}');
                nextResourceId++;
                break;
            }
            break;
          case 'texSubImage2D':
            switch (e.args['dataType']) {
              case 'pixels':
                argString = [
                  e.args['target'],
                  e.args['level'],
                  e.args['xoffset'],
                  e.args['yoffset'],
                  e.args['width'],
                  e.args['height'],
                  e.args['format'],
                  e.args['type'],
                  'new Uint8Array([' + e.args['pixels'] + '])'
                ].join(', ');
                break;
              case 'null':
                argString = [
                  e.args['target'],
                  e.args['level'],
                  e.args['xoffset'],
                  e.args['yoffset'],
                  e.args['width'],
                  e.args['height'],
                  e.args['format'],
                  e.args['type'],
                  'null'
                ].join(', ');
                break;
              default:
                argString = [
                  e.args['target'],
                  e.args['level'],
                  e.args['xoffset'],
                  e.args['yoffset'],
                  e.args['format'],
                  e.args['type'],
                  'resources[' + nextResourceId + ']'
                ].join(', ');
                resources.push(
                    '{' +
                    '  id: ' + nextResourceId + ',' +
                    '  type: "image",' +
                    '  mimeType: "' + e.args['dataType'] + '",' +
                    '  data: new Uint8Array([' + e.args['pixels'] + '])' +
                    '}');
                nextResourceId++;
                break;
            }
            break;
          default:
            var argTableEntry = argTable[callName];
            if (argTableEntry) {
              argString = argTableEntry(e.args);
            }
            break;
        }

        log('  /* ' + offsetMs + ' */ result = gl.' + callName + '(' +
            argString + ');');

        switch (callName) {
          case 'createBuffer':
          case 'createFramebuffer':
          case 'createProgram':
          case 'createRenderbuffer':
          case 'createShader':
          case 'createTexture':
            log('                ' +
                'objs[' + e.args['value'] + '] = result;');
            log('                ' +
                'assignObject(gl, result);');
            break;
          case 'getUniformLocation':
            log('                ' +
                'objs[' + e.args['value'] + '] = result;');
            break;
        }
      }
    }
  });

  // Start in an intra-frame block.
  log('intraFrame(function(ctxs, objs, resources) {');
  log('  var result;');
  log('  var gl = ctxs[' + currentContext + '];');

  if (!wtf.analysis.run(traceListener, inputFile)) {
    console.log('failed to start analysis!');
    return -1;
  }

  // Cleanup last intra-frame closure.
  log('}, [' + resources.join(', ') + ']);');
  resources.length = 0;

  return 0;
};


/**
 * Builds a table of call names to functions that can generate code for
 * argument objects.
 * @return {!Object.<!function(!Object):string>} Argument table.
 * @private
 */
function buildArgTable_() {
  var signatures = [
    'WebGLContextAttributes? getContextAttributes()',
    'boolean isContextLost()',
    'sequence<DOMString>? getSupportedExtensions()',
    'object? getExtension(DOMString name)',
    'void activeTexture(GLenum texture)',
    'void attachShader(WebGLProgram? program, WebGLShader? shader)',
    'void bindAttribLocation(WebGLProgram? program, GLuint index, DOMString name)',
    'void bindBuffer(GLenum target, WebGLBuffer? buffer)',
    'void bindFramebuffer(GLenum target, WebGLFramebuffer? framebuffer)',
    'void bindRenderbuffer(GLenum target, WebGLRenderbuffer? renderbuffer)',
    'void bindTexture(GLenum target, WebGLTexture? texture)',
    'void blendColor(GLclampf red, GLclampf green, GLclampf blue, GLclampf alpha)',
    'void blendEquation(GLenum mode)',
    'void blendEquationSeparate(GLenum modeRGB, GLenum modeAlpha)',
    'void blendFunc(GLenum sfactor, GLenum dfactor)',
    'void blendFuncSeparate(GLenum srcRGB, GLenum dstRGB, GLenum srcAlpha, GLenum dstAlpha)',
    //'void bufferData(GLenum target, GLsizeiptr size, GLenum usage)',
    //'void bufferData(GLenum target, ArrayBufferView data, GLenum usage)',
    'void bufferData(GLenum target, ArrayBuffer? data, GLenum usage)',
    //'void bufferSubData(GLenum target, GLintptr offset, ArrayBufferView data)',
    'void bufferSubData(GLenum target, GLintptr offset, ArrayBuffer? data)',
    'GLenum checkFramebufferStatus(GLenum target)',
    'void clear(GLbitfield mask)',
    'void clearColor(GLclampf red, GLclampf green, GLclampf blue, GLclampf alpha)',
    'void clearDepth(GLclampf depth)',
    'void clearStencil(GLint s)',
    'void colorMask(GLboolean red, GLboolean green, GLboolean blue, GLboolean alpha)',
    'void compileShader(WebGLShader? shader)',
    'void compressedTexImage2D(GLenum target, GLint level, GLenum internalformat, GLsizei width, GLsizei height, GLint border, ArrayBufferView data)',
    'void compressedTexSubImage2D(GLenum target, GLint level, GLint xoffset, GLint yoffset, GLsizei width, GLsizei height, GLenum format, ArrayBufferView data)',
    'void copyTexImage2D(GLenum target, GLint level, GLenum internalformat, GLint x, GLint y, GLsizei width, GLsizei height, GLint border)',
    'void copyTexSubImage2D(GLenum target, GLint level, GLint xoffset, GLint yoffset, GLint x, GLint y, GLsizei width, GLsizei height)',
    'WebGLBuffer? createBuffer()',
    'WebGLFramebuffer? createFramebuffer()',
    'WebGLProgram? createProgram()',
    'WebGLRenderbuffer? createRenderbuffer()',
    'WebGLShader? createShader(GLenum type)',
    'WebGLTexture? createTexture()',
    'void cullFace(GLenum mode)',
    'void deleteBuffer(WebGLBuffer? value)',
    'void deleteFramebuffer(WebGLFramebuffer? value)',
    'void deleteProgram(WebGLProgram? value)',
    'void deleteRenderbuffer(WebGLRenderbuffer? value)',
    'void deleteShader(WebGLShader? value)',
    'void deleteTexture(WebGLTexture? value)',
    'void depthFunc(GLenum func)',
    'void depthMask(GLboolean flag)',
    'void depthRange(GLclampf zNear, GLclampf zFar)',
    'void detachShader(WebGLProgram? program, WebGLShader? shader)',
    'void disable(GLenum cap)',
    'void disableVertexAttribArray(GLuint index)',
    'void drawArrays(GLenum mode, GLint first, GLsizei count)',
    'void drawElements(GLenum mode, GLsizei count, GLenum type, GLintptr offset)',
    'void enable(GLenum cap)',
    'void enableVertexAttribArray(GLuint index)',
    'void finish()',
    'void flush()',
    'void framebufferRenderbuffer(GLenum target, GLenum attachment, GLenum renderbuffertarget, WebGLRenderbuffer? renderbuffer)',
    'void framebufferTexture2D(GLenum target, GLenum attachment, GLenum textarget, WebGLTexture? texture, GLint level)',
    'void frontFace(GLenum mode)',
    'void generateMipmap(GLenum target)',
    'WebGLActiveInfo? getActiveAttrib(WebGLProgram? program, GLuint index)',
    'WebGLActiveInfo? getActiveUniform(WebGLProgram? program, GLuint index)',
    'sequence<WebGLShader>? getAttachedShaders(WebGLProgram? program)',
    'GLint getAttribLocation(WebGLProgram? program, DOMString name)',
    'any getBufferParameter(GLenum target, GLenum pname)',
    'any getParameter(GLenum pname)',
    'GLenum getError()',
    'any getFramebufferAttachmentParameter(GLenum target, GLenum attachment, GLenum pname)',
    'any getProgramParameter(WebGLProgram? program, GLenum pname)',
    'DOMString? getProgramInfoLog(WebGLProgram? program)',
    'any getRenderbufferParameter(GLenum target, GLenum pname)',
    'any getShaderParameter(WebGLShader? shader, GLenum pname)',
    'WebGLShaderPrecisionFormat? getShaderPrecisionFormat(GLenum shadertype, GLenum precisiontype)',
    'DOMString? getShaderInfoLog(WebGLShader? shader)',
    'DOMString? getShaderSource(WebGLShader? shader)',
    'any getTexParameter(GLenum target, GLenum pname)',
    'any getUniform(WebGLProgram? program, WebGLUniformLocation? location)',
    'WebGLUniformLocation? getUniformLocation(WebGLProgram? program, DOMString name)',
    'any getVertexAttrib(GLuint index, GLenum pname)',
    'GLsizeiptr getVertexAttribOffset(GLuint index, GLenum pname)',
    'void hint(GLenum target, GLenum mode)',
    'GLboolean isBuffer(WebGLBuffer? buffer)',
    'GLboolean isEnabled(GLenum cap)',
    'GLboolean isFramebuffer(WebGLFramebuffer? framebuffer)',
    'GLboolean isProgram(WebGLProgram? program)',
    'GLboolean isRenderbuffer(WebGLRenderbuffer? renderbuffer)',
    'GLboolean isShader(WebGLShader? shader)',
    'GLboolean isTexture(WebGLTexture? texture)',
    'void lineWidth(GLfloat width)',
    'void linkProgram(WebGLProgram? program)',
    'void pixelStorei(GLenum pname, GLint param)',
    'void polygonOffset(GLfloat factor, GLfloat units)',
    'void readPixels(GLint x, GLint y, GLsizei width, GLsizei height, GLenum format, GLenum type, ArrayBufferView? pixels)',
    'void renderbufferStorage(GLenum target, GLenum internalformat, GLsizei width, GLsizei height)',
    'void sampleCoverage(GLclampf value, GLboolean invert)',
    'void scissor(GLint x, GLint y, GLsizei width, GLsizei height)',
    'void shaderSource(WebGLShader? shader, DOMString source)',
    'void stencilFunc(GLenum func, GLint ref, GLuint mask)',
    'void stencilFuncSeparate(GLenum face, GLenum func, GLint ref, GLuint mask)',
    'void stencilMask(GLuint mask)',
    'void stencilMaskSeparate(GLenum face, GLuint mask)',
    'void stencilOp(GLenum fail, GLenum zfail, GLenum zpass)',
    'void stencilOpSeparate(GLenum face, GLenum fail, GLenum zfail, GLenum zpass)',
    'void texImage2D(GLenum target, GLint level, GLenum internalformat, GLsizei width, GLsizei height, GLint border, GLenum format, GLenum type, ArrayBufferView? pixels)',
    // 'void texImage2D(GLenum target, GLint level, GLenum internalformat, GLenum format, GLenum type, ImageData? pixels)',
    // 'void texImage2D(GLenum target, GLint level, GLenum internalformat, GLenum format, GLenum type, HTMLImageElement image)',
    // 'void texImage2D(GLenum target, GLint level, GLenum internalformat, GLenum format, GLenum type, HTMLCanvasElement canvas)',
    // 'void texImage2D(GLenum target, GLint level, GLenum internalformat, GLenum format, GLenum type, HTMLVideoElement video)',
    'void texParameterf(GLenum target, GLenum pname, GLfloat param)',
    'void texParameteri(GLenum target, GLenum pname, GLint param)',
    'void texSubImage2D(GLenum target, GLint level, GLint xoffset, GLint yoffset, GLsizei width, GLsizei height, GLenum format, GLenum type, ArrayBufferView? pixels)',
    // 'void texSubImage2D(GLenum target, GLint level, GLint xoffset, GLint yoffset, GLenum format, GLenum type, ImageData? pixels)',
    // 'void texSubImage2D(GLenum target, GLint level, GLint xoffset, GLint yoffset, GLenum format, GLenum type, HTMLImageElement image)',
    // 'void texSubImage2D(GLenum target, GLint level, GLint xoffset, GLint yoffset, GLenum format, GLenum type, HTMLCanvasElement canvas)',
    // 'void texSubImage2D(GLenum target, GLint level, GLint xoffset, GLint yoffset, GLenum format, GLenum type, HTMLVideoElement video)',
    'void uniform1f(WebGLUniformLocation? location, GLfloat x)',
    'void uniform1fv(WebGLUniformLocation? location, sequence<float> v)',
    'void uniform1i(WebGLUniformLocation? location, GLint x)',
    'void uniform1iv(WebGLUniformLocation? location, sequence<long> v)',
    'void uniform2f(WebGLUniformLocation? location, GLfloat x, GLfloat y)',
    'void uniform2fv(WebGLUniformLocation? location, sequence<float> v)',
    'void uniform2i(WebGLUniformLocation? location, GLint x, GLint y)',
    'void uniform2iv(WebGLUniformLocation? location, sequence<long> v)',
    'void uniform3f(WebGLUniformLocation? location, GLfloat x, GLfloat y, GLfloat z)',
    'void uniform3fv(WebGLUniformLocation? location, sequence<float> v)',
    'void uniform3i(WebGLUniformLocation? location, GLint x, GLint y, GLint z)',
    'void uniform3iv(WebGLUniformLocation? location, sequence<long> v)',
    'void uniform4f(WebGLUniformLocation? location, GLfloat x, GLfloat y, GLfloat z, GLfloat w)',
    'void uniform4fv(WebGLUniformLocation? location, sequence<float> v)',
    'void uniform4i(WebGLUniformLocation? location, GLint x, GLint y, GLint z, GLint w)',
    'void uniform4iv(WebGLUniformLocation? location, sequence<long> v)',
    'void uniformMatrix2fv(WebGLUniformLocation? location, GLboolean transpose, sequence<float> value)',
    'void uniformMatrix3fv(WebGLUniformLocation? location, GLboolean transpose, sequence<float> value)',
    'void uniformMatrix4fv(WebGLUniformLocation? location, GLboolean transpose, sequence<float> value)',
    'void useProgram(WebGLProgram? program)',
    'void validateProgram(WebGLProgram? program)',
    'void vertexAttrib1f(GLuint indx, GLfloat x)',
    'void vertexAttrib1fv(GLuint indx, sequence<float> values)',
    'void vertexAttrib2f(GLuint indx, GLfloat x, GLfloat y)',
    'void vertexAttrib2fv(GLuint indx, sequence<float> values)',
    'void vertexAttrib3f(GLuint indx, GLfloat x, GLfloat y, GLfloat z)',
    'void vertexAttrib3fv(GLuint indx, sequence<float> values)',
    'void vertexAttrib4f(GLuint indx, GLfloat x, GLfloat y, GLfloat z, GLfloat w)',
    'void vertexAttrib4fv(GLuint indx, sequence<float> values)',
    'void vertexAttribPointer(GLuint indx, GLint size, GLenum type, GLboolean normalized, GLsizei stride, GLintptr offset)',
    'void viewport(GLint x, GLint y, GLsizei width, GLsizei height)'
  ];

  var argTable = {};

  for (var n = 0; n < signatures.length; n++) {
    var signatureParts =
        /^[a-zA-Z0-9?<>]+ ([a-zA-Z0-9_\.]+)(\((.*)\)$)?/.exec(signatures[n]);
    var signatureName = signatureParts[1]; // entire name before ()
    var signatureArgs = signatureParts[3]; // contents of () (excluding ())
    if (signatureArgs.length) {
      signatureArgs = signatureArgs.split(',');
      for (var m = 0; m < signatureArgs.length; m++) {
        var argParts = goog.string.trim(signatureArgs[m]).split(' ');
        signatureArgs[m] = {
          type: argParts[0].replace('?', ''),
          name: argParts[1]
        };
      }
    }

    argTable[signatureName] = (function(signatureName, signatureArgs) {
      return function(args) {
        var result = '';
        for (var n = 0; n < signatureArgs.length; n++) {
          var argType = signatureArgs[n].type;
          var argName = signatureArgs[n].name;
          var argValue = args[argName];
          switch (argType) {
            case 'ArrayBuffer':
              argValue = 'new Uint8Array([' + argValue + ']).buffer';
              break;
            case 'ArrayBufferView':
              argValue = 'new Uint8Array([' + argValue + '])';
              break;
            case 'sequence<float>':
            case 'sequence<long>':
              argValue = '[' + argValue + ']';
              break;
            case 'DOMString':
              argValue = '"' + argValue.replace(/\n/g, '\\n') + '"';
              break;
            case 'GLenum':
              // TODO(benvanik): use lookup to make a gl.ENUM_VALUE
              break;
            case 'WebGLBuffer':
            case 'WebGLFramebuffer':
            case 'WebGLProgram':
            case 'WebGLRenderbuffer':
            case 'WebGLShader':
            case 'WebGLTexture':
              argValue = 'objs[' + argValue + ']';
              break;
            case 'WebGLUniformLocation':
              argValue = 'objs[' + argValue + ']';
              break;
          }
          if (result.length) {
            result += ', ' + argValue;
          } else {
            result = String(argValue);
          }
        }
        return result;
      };
    })(signatureName, signatureArgs);
  }

  return argTable;
};
