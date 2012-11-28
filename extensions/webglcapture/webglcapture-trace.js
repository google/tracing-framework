(function() {

// Add a HUD button:
wtf.hud.addButton({
  title: 'Capture WebGL',
  icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="21px" height="21px"><path d="M10.488,6.586c2.437,0,4.412,1.976,4.412,4.414h-2.206l3.163,5.359L19,11h-2.208c0-3.481-2.822-6.304-6.304-6.304"/><path d="M10.488,6.586c2.437,0,4.412,1.976,4.412,4.414h-2.206l3.163,5.359L19,11h-2.208c0-3.481-2.822-6.304-6.304-6.304V6.586z"/><path d="M10.512,17.304c-3.481,0-6.304-2.822-6.304-6.304H2l3.143-5.359L8.306,11H6.1c0,2.438,1.976,4.414,4.412,4.414V17.304z"/></svg>',
  shortcut: 'f3',
  callback: function() {
    buttonClicked();
  },
  scope: null
});


function loseContext(context) {
  context['__forcedLost'] = true;
  var e = new WebGLContextEvent('webglcontextlost', {
    statusMessage: 'Forced via WTF'
  });
  context.canvas.dispatchEvent(e);
};


function restoreContext(context) {
  delete context['__forcedLost'];
  var e = new WebGLContextEvent('webglcontextrestored', {
    statusMessage: 'Forced via WTF'
  });
  context.canvas.dispatchEvent(e);
};


var originalGetError = WebGLRenderingContext.prototype.getError;
WebGLRenderingContext.prototype.getError = function() {
  if (this['__forcedLost']) {
    return this.CONTEXT_LOST_WEBGL;
  }
  return originalGetError.call(this);
};


var originalIsContextLost = WebGLRenderingContext.prototype.isContextLost;
WebGLRenderingContext.prototype.isContextLost = function() {
  return this['__forcedLost'] || originalIsContextLost.call(this);
}


// Object 0 is always null.
var nextObjectId = 1;
function getHandle(obj) {
  return obj ? obj['__wtf_glhandle__'] : 0;
};
function setHandle(obj, value) {
  obj['__wtf_glhandle__'] = value;
};

var setContextEvent = wtf.trace.events.createInstance(
    'webglcapture.setContext(uint32 handle, uint32 width, uint32 height)');
var currentContext = null;
var currentContextWidth = 0;
var currentContextHeight = 0;
function setCurrentContext(ctx) {
  if (ctx != currentContext ||
      ctx.drawingBufferWidth != currentContextWidth ||
      ctx.drawingBufferHeight != currentContextHeight) {
    currentContext = ctx;
    currentContextWidth = ctx.drawingBufferWidth;
    currentContextHeight = ctx.drawingBufferHeight;
    setContextEvent.append(
        wtf.now(),
        getHandle(ctx),
        ctx.drawingBufferWidth, ctx.drawingBufferHeight);
  }
};

function instrumentContext(raw) {
  function instrumentMethod(signature, opt_generator) {
    var signatureParts = /^([a-zA-Z0-9_\.:]+)(\((.*)\)$)?/.exec(signature);
    var signatureName = signatureParts[1]; // entire name before ()
    raw.prototype[signatureName] = wtf.trace.instrument(
        raw.prototype[signatureName],
        signature,
        'WebGLRenderingContext#',
        opt_generator,
        function() {
          setCurrentContext(this);
        });
  };

  instrumentMethod('getContextAttributes()');
  instrumentMethod('isContextLost()');
  instrumentMethod('getSupportedExtensions()');
  instrumentMethod('getExtension(ascii name)');
  instrumentMethod('activeTexture(uint32 texture)');
  instrumentMethod('attachShader(uint32 program, uint32 shader)', function(fn, eventType) {
    return function attachShader(program, shader) {
      var scope = eventType.enterScope(wtf.now(), null, getHandle(program), getHandle(shader));
      fn.call(this, program, shader);
      scope.leave();
    };
  });
  instrumentMethod('bindAttribLocation(uint32 program, uint32 index, utf8 name)', function(fn, eventType) {
    return function bindAttribLocation(program, index, name) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, getHandle(program), index, name);
      fn.call(this, program, index, name);
      scope.leave();
    };
  });
  instrumentMethod('bindBuffer(uint32 target, uint32 buffer)', function(fn, eventType) {
    return function bindBuffer(target, buffer) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, target, getHandle(buffer));
      fn.call(this, target, buffer);
      scope.leave();
    };
  });
  instrumentMethod('bindFramebuffer(uint32 target, uint32 framebuffer)', function(fn, eventType) {
    return function bindFramebuffer(target, framebuffer) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, target, getHandle(framebuffer));
      fn.call(this, target, framebuffer);
      scope.leave();
    };
  });
  instrumentMethod('bindRenderbuffer(uint32 target, uint32 renderbuffer)', function(fn, eventType) {
    return function bindRenderbuffer(target, renderbuffer) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, target, getHandle(renderbuffer));
      fn.call(this, target, renderbuffer);
      scope.leave();
    };
  });
  instrumentMethod('bindTexture(uint32 target, uint32 texture)', function(fn, eventType) {
    return function bindTexture(target, texture) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, target, getHandle(texture));
      fn.call(this, target, texture);
      scope.leave();
    };
  });
  instrumentMethod('blendColor(float red, float green, float blue, float alpha)');
  instrumentMethod('blendEquation(uint32 mode)');
  instrumentMethod('blendEquationSeparate(uint32 modeRGB, uint32 modeAlpha)');
  instrumentMethod('blendFunc(uint32 sfactor, uint32 dfactor)');
  instrumentMethod('blendFuncSeparate(uint32 srcRGB, uint32 dstRGB, uint32 srcAlpha, uint32 dstAlpha)');
  instrumentMethod('bufferData(uint32 target, uint32 size, uint32 usage, uint8[] data)', function(fn, eventType) {
    return function bufferData(target, data, usage) {
      setCurrentContext(this);
      if (typeof data == 'number') {
        var scope = eventType.enterScope(wtf.now(), null, target, data, usage, []);
        fn.call(this, target, data, usage);
        scope.leave();
      } else {
        if (data instanceof ArrayBuffer) {
          data = new Uint8Array(data);
        } else if (!(data instanceof Uint8Array)) {
          data = new Uint8Array(data.buffer);
        }
        var wrapper = new Uint8Array(data.buffer);
        var scope = eventType.enterScope(wtf.now(), null, target, data.length, usage, data);
        fn.call(this, target, data, usage);
        scope.leave();
      }
    };
  });
  instrumentMethod('bufferSubData(uint32 target, uint32 offset, uint8[] data)', function(fn, eventType) {
    return function bufferSubData(target, offset, data) {
      setCurrentContext(this);
      if (data instanceof ArrayBuffer) {
        data = new Uint8Array(data);
      } else if (!(data instanceof Uint8Array)) {
        data = new Uint8Array(data.buffer);
      }
      var scope = eventType.enterScope(wtf.now(), null, target, offset, data);
      fn.call(this, target, offset, data);
      scope.leave();
    };
  });
  instrumentMethod('checkFramebufferStatus(uint32 target)');
  instrumentMethod('clear(uint32 mask)');
  instrumentMethod('clearColor(float red, float green, float blue, float alpha)');
  instrumentMethod('clearDepth(float depth)');
  instrumentMethod('clearStencil(int32 s)');
  instrumentMethod('colorMask(uint8 red, uint8 green, uint8 blue, uint8 alpha)');
  instrumentMethod('compileShader(uint32 shader)', function(fn, eventType) {
    return function compileShader(shader) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, getHandle(shader));
      fn.call(this, shader);
      scope.leave();
    };
  });
  /**/instrumentMethod('compressedTexImage2D');
  /**/instrumentMethod('compressedTexSubImage2D');
  instrumentMethod('copyTexImage2D(uint32 target, int32 level, uint32 internalformat, int32 x, int32 y, int32 width, int32 height, int32 border)');
  instrumentMethod('copyTexSubImage2D(uint32 target, int32 level, int32 xoffset, int32 yoffset, int32 x, int32 y, int32 widht, int32 height)');
  function instrumentCreate(name, opt_arg) {
    var signature =
        name + '(' + (opt_arg ? opt_arg + ', ' : '') + 'uint32 value)';
    instrumentMethod(signature, function(fn, eventType) {
      return function(arg) {
        setCurrentContext(this);
        var id = nextObjectId++;
        if (opt_arg) {
          eventType.enterScope(wtf.now(), null, arg, id).leave();
        } else {
          eventType.enterScope(wtf.now(), null, id).leave();
        }
        var obj = fn.call(this, opt_arg ? arg : undefined);
        if (obj) {
          setHandle(obj, id);
        }
        return obj;
      };
    });
  };
  instrumentCreate('createBuffer');
  instrumentCreate('createFramebuffer');
  instrumentCreate('createProgram');
  instrumentCreate('createRenderbuffer');
  instrumentCreate('createShader', 'uint32 type');
  instrumentCreate('createTexture');
  instrumentMethod('cullFace(uint32 mode)');
  function instrumentDelete(name) {
    var signature = name + '(uint32 value)';
    instrumentMethod(signature, function(fn, eventType) {
      return function(value) {
        setCurrentContext(this);
        var scope = eventType.enterScope(wtf.now(), null, getHandle(value));
        fn.call(this, value);
        scope.leave();
      };
    });
  };
  instrumentDelete('deleteBuffer');
  instrumentDelete('deleteFramebuffer');
  instrumentDelete('deleteProgram');
  instrumentDelete('deleteRenderbuffer');
  instrumentDelete('deleteShader');
  instrumentDelete('deleteTexture');
  instrumentMethod('depthFunc(uint32 func)');
  instrumentMethod('depthMask(uint8 flag)');
  instrumentMethod('depthRange(float zNear, float zFar)');
  instrumentMethod('detachShader(uint32 program, uint32 shader)', function(fn, eventType) {
    return function detachShader(program, shader) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, getHandle(program), getHandle(shader));
      fn.call(this, program, shader);
      scope.leave();
    };
  });
  instrumentMethod('disable(uint32 cap)');
  instrumentMethod('disableVertexAttribArray(uint8 index)');
  instrumentMethod('drawArrays(uint32 mode, uint32 first, int32 count)');
  instrumentMethod('drawElements(uint32 mode, int32 count, uint32 type, uint32 offset)');
  instrumentMethod('enable(uint32 cap)');
  instrumentMethod('enableVertexAttribArray(uint8 index)');
  instrumentMethod('finish()');
  instrumentMethod('flush()');
  instrumentMethod('framebufferRenderbuffer(uint32 target, uint32 attachment, uint32 renderbuffertarget, uint32 renderbuffer)', function(fn, eventType) {
    return function framebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, target, attachment, renderbuffertarget, getHandle(renderbuffer));
      fn.call(this, target, attachment, renderbuffertarget, renderbuffer);
      scope.leave();
    };
  });
  instrumentMethod('framebufferTexture2D(uint32 target, uint32 attachment, uint32 textarget, uint32 texture, int32 level)', function(fn, eventType) {
    return function framebufferTexture2D(target, attachment, textarget, texture, level) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, target, attachment, textarget, getHandle(texture), level);
      fn.call(this, target, attachment, textarget, texture, level);
      scope.leave();
    };
  });
  instrumentMethod('frontFace(uint32 mode)');
  instrumentMethod('generateMipmap(uint32 target)');
  instrumentMethod('getActiveAttrib(uint32 program, uint32 index)', function(fn, eventType) {
    return function getActiveAttrib(program, index) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, getHandle(program), index);
      return scope.leave(fn.call(this, program, index));
    };
  });
  instrumentMethod('getActiveUniform(uint32 program, uint32 index)', function(fn, eventType) {
    return function getActiveUniform(program, index) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, getHandle(program), index);
      return scope.leave(fn.call(this, program, index));
    };
  });
  instrumentMethod('getAttachedShaders(uint32 program)', function(fn, eventType) {
    return function getAttachedShaders(program) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, getHandle(program));
      return scope.leave(fn.call(this, program));
    };
  });
  instrumentMethod('getAttribLocation(uint32 program, utf8 name)', function(fn, eventType) {
    return function getAttribLocation(program, name) {
      setCurrentContext(this);
      // TODO(benvanik): record result and build mapping table
      var scope = eventType.enterScope(wtf.now(), null, getHandle(program), name);
      return scope.leave(fn.call(this, program, name));
    };
  });
  instrumentMethod('getBufferParameter(uint32 target, uint32 pname)');
  instrumentMethod('getParameter(uint32 pname)');
  instrumentMethod('getError()');
  instrumentMethod('getFramebufferAttachmentParameter(uint32 target, uint32 attachment, uint32 pname)');
  instrumentMethod('getProgramParameter(uint32 program, uint32 pname)', function(fn, eventType) {
    return function getProgramParameter(program, pname) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, getHandle(program), pname);
      return scope.leave(fn.call(this, program, pname));
    };
  });
  instrumentMethod('getProgramInfoLog(uint32 program)', function(fn, eventType) {
    return function getProgramInfoLog(program) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, getHandle(program));
      return scope.leave(fn.call(this, program));
    };
  });
  instrumentMethod('getRenderbufferParameter(uint32 target, uint32 pname)');
  instrumentMethod('getShaderParameter(uint32 shader, uint32 pname)', function(fn, eventType) {
    return function getShaderParameter(shader, pname) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, getHandle(shader), pname);
      return scope.leave(fn.call(this, shader, pname));
    };
  });
  instrumentMethod('getShaderPrecisionFormat(uint32 shadertype, uint32 precisiontype)');
  instrumentMethod('getShaderInfoLog(uint32 shader)', function(fn, eventType) {
    return function getShaderInfoLog(shader) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, getHandle(shader));
      return scope.leave(fn.call(this, shader));
    };
  });
  instrumentMethod('getShaderSource(uint32 shader)', function(fn, eventType) {
    return function getShaderSource(shader) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, getHandle(shader));
      return scope.leave(fn.call(this, shader));
    };
  });
  instrumentMethod('getTexParameter(uint32 target, uint32 pname)');
  /**/instrumentMethod('getUniform');
  instrumentMethod('getUniformLocation(uint32 program, utf8 name, uint32 value)', function(fn, eventType) {
    return function getUniformLocation(program, name) {
      setCurrentContext(this);
      // TODO(benvanik): better tracking mechanism/string table/etc, as an app
      //     calling this each frame will quickly eat up IDs
      var id = nextObjectId++;
      var scope = eventType.enterScope(wtf.now(), null, getHandle(program), name, id);
      var obj = fn.call(this, program, name);
      if (obj) {
        setHandle(obj, id);
      }
      return scope.leave(obj);
    };
  });
  instrumentMethod('getVertexAttrib(uint32 index, uint32 pname)');
  instrumentMethod('getVertexAttribOffset(uint32 index, uint32 pname)');
  instrumentMethod('hint(uint32 target, uint32 mode)');
  instrumentMethod('isEnabled(uint32 cap)');
  function instrumentIs(name) {
    var signature = name + '(uint32 type)';
    instrumentMethod(signature, function(fn, eventType) {
      return function(value) {
        setCurrentContext(this);
        var scope;
        if (value && getHandle(value)) {
          scope = eventType.enterScope(wtf.now(), null, getHandle(value));
        } else {
          scope = eventType.enterScope(wtf.now(), null, 0);
        }
        return scope.leave(fn.call(this, value));
      };
    });
  };
  instrumentIs('isBuffer');
  instrumentIs('isFramebuffer');
  instrumentIs('isProgram');
  instrumentIs('isRenderbuffer');
  instrumentIs('isShader');
  instrumentIs('isTexture');
  instrumentMethod('lineWidth(float width)');
  instrumentMethod('linkProgram(uint32 program)', function(fn, eventType) {
    return function linkProgram(program) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, getHandle(program));
      fn.call(this, program);
      scope.leave();
    };
  });
  instrumentMethod('pixelStorei(uint32 pname, int32 param)');
  instrumentMethod('polygonOffset(float factor, float units)');
  /**/instrumentMethod('readPixels(int32 x, int32 y, int32 width, int32 height, uint32 format, uint32 type)');
  instrumentMethod('renderbufferStorage(uint32 target, uint32 internalformat, int32 width, int32 height)');
  instrumentMethod('sampleCoverage(float value, uint8 invert)');
  instrumentMethod('scissor(int32 x, int32 y, int32 width, int32 height)');
  instrumentMethod('shaderSource(uint32 shader, utf8 source)', function(fn, eventType) {
    return function shaderSource(shader, source) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, getHandle(shader), source);
      fn.call(this, shader, source);
      scope.leave();
    };
  });
  instrumentMethod('stencilFunc(uint32 func, int32 ref, uint32 mask)');
  instrumentMethod('stencilFuncSeparate(uint32 face, uint32 func, int32 ref, uint32 mask)');
  instrumentMethod('stencilMask(uint32 mask)');
  instrumentMethod('stencilMaskSeaprate(uint32 face, uint32 mask)');
  instrumentMethod('stencilOp(uint32 fail, uint32 zfail, uint32 zpass)');
  instrumentMethod('stencilOpSeparate(uint32 face, uint32 fail, uint32 zfail, uint32 zpass)');
  function getPixelsFromImageData(width, height, internalformat, imageData) {
    var bpp = 4;
    switch (internalformat) {
      case 0x1907: // RGB
        bpp = 3;
        break;
      case 0x1908: // RGBA
        bpp = 4;
        break;
    }
    var id = imageData.data;
    var pixels = new Uint8Array(width * height * bpp);
    if (bpp == 3) {
      for (var i = 0, j = 0; i < width * height * 4; i += 4, j += 3) {
        pixels[j] = id[i];
        pixels[j + 1] = id[i + 1];
        pixels[j + 2] = id[i + 2];
      }
    } else if (bpp == 4) {
      for (var i = 0; i < width * height * 4; i++) {
        pixels[i] = id[i];
      }
    }
    return pixels;
  };
  function extractImageData(el, internalformat) {
    var width = el.width;
    var height = el.height;
    if ((el instanceof HTMLImageElement || el instanceof Image) &&
        el.src.indexOf('blob:') != 0) {
      // Synchronous XHR to get the image in compressed form.
      // HEAD first to get the mime type.
      var xhr = new XMLHttpRequest();
      xhr.open('HEAD', el.src, false);
      xhr.send(null);
      if (xhr.status != 200) {
        // Failed, upload nothing.
        return {
          width: width,
          height: height,
          pixels: [],
          dataType: 'null'
        };
      } else {
        var mimeType = xhr.getResponseHeader('content-type');

        // Fetch.
        var xhr = new XMLHttpRequest();
        xhr.overrideMimeType('text/plain; charset=x-user-defined')
        xhr.open('GET', el.src, false);
        xhr.send(null);

        // Convert to binary.
        var responseText = xhr.responseText;
        var data = new Uint8Array(responseText.length);
        for (var n = 0; n < data.length; n++) {
          data[n] = responseText.charCodeAt(n) & 0xFF;
        }

        return {
          width: width,
        height: height,
          pixels: data,
          dataType: mimeType
        };
      }
    } else if (el instanceof HTMLCanvasElement) {
      // Get pixels from canvas.
      var ctx = el.getContext('raw-2d') || el.getContext('2d');
      var id = ctx.getImageData(0, 0, width, height);
      var pixels = getPixelsFromImageData(
          width, height, internalformat, id);
      // TODO(benvanik): RLE pixels?
      return {
        width: width,
        height: height,
        pixels: pixels,
        dataType: 'pixels'
      };
    } else if (el instanceof ImageData) {
      var pixels = getPixelsFromImageData(
          width, height, internalformat, el);
      // TODO(benvanik): RLE pixels?
      return {
        width: width,
        height: height,
        pixels: pixels,
        dataType: 'pixels'
      };
    } else {
      // Canvas/video/etc need to be encoded as pixels.
      var canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      var ctx = canvas.getContext('raw-2d');
      ctx.drawImage(el, 0, 0);
      var id = ctx.getImageData(0, 0, width, height);
      var pixels = getPixelsFromImageData(
          width, height, internalformat, id);
      return {
        width: width,
        height: height,
        pixels: pixels,
        dataType: 'pixels'
      };
    }
  };
  instrumentMethod('texImage2D(uint32 target, int32 level, uint32 internalformat, int32 width, int32 height, int32 border, uint32 format, uint32 type, uint8[] pixels, ascii dataType)', function(fn, eventType) {
    return function texImage2D(target, level, internalformat) {
      setCurrentContext(this);
      var scope;
      if (arguments.length == 9) {
        // Pixels variant.
        if (arguments[8]) {
          scope = eventType.enterScope(wtf.now(), null, target, level, internalformat, arguments[3], arguments[4], arguments[5], arguments[6], arguments[7], arguments[8], 'pixels');
        } else {
          scope = eventType.enterScope(wtf.now(), null, target, level, internalformat, arguments[3], arguments[4], arguments[5], arguments[6], arguments[7], [], 'null');
        }
      } else {
        // DOM element variant.
        var imageData = extractImageData(arguments[5], internalformat);
        scope = eventType.enterScope(
            wtf.now(), null,
            target,
            level,
            internalformat,
            imageData.width, imageData.height,
            0,
            arguments[3],
            arguments[4],
            imageData.pixels,
            imageData.dataType);
      }
      try {
        fn.apply(this, arguments);
      } finally {
        scope.leave();
      }
    };
  });
  instrumentMethod('texParameterf(uint32 target, uint32 pname, float param)');
  instrumentMethod('texParameteri(uint32 target, uint32 pname, int32 param)');
  instrumentMethod('texSubImage2D(uint32 target, int32 level, int32 xoffset, int32 yoffset, int32 width, int32 height, uint32 format, uint32 type, uint8[] pixels, ascii dataType)', function(fn, eventType) {
    return function texSubImage2D(target, level, xoffset, yoffset) {
      setCurrentContext(this);
      var scope;
      if (arguments.length == 9) {
        // Pixels variant.
        if (arguments[8]) {
          scope = eventType.enterScope(wtf.now(), null, target, level, xoffset, yoffset, arguments[4], arguments[5], arguments[6], arguments[7], arguments[8], 'pixels');
        } else {
          scope = eventType.enterScope(wtf.now(), null, target, level, xoffset, yoffset, arguments[4], arguments[5], arguments[6], arguments[7], [], 'null');
        }
      } else {
        // DOM element variant.
        var imageData = extractImageData(arguments[6], arguments[4]);
        scope = eventType.enterScope(
            wtf.now(), null,
            target,
            level,
            xoffset, yoffset,
            imageData.width, imageData.height,
            arguments[4],
            arguments[5],
            imageData.pixels,
            imageData.dataType);
      }
      try {
        fn.apply(this, arguments);
      } finally {
        scope.leave();
      }
    };
  });
  function instrumentUniform(name, type, count) {
    var signature = name + '(uint32 location';
    var names = ['x', 'y', 'z', 'w'];
    for (var n = 0; n < count; n++) {
      signature += ', ' + type + ' ' + names[n];
    }
    signature += ')';
    switch (count) {
      case 1:
        instrumentMethod(signature, function(fn, eventType) {
          return function(location, x) {
            setCurrentContext(this);
            var scope = eventType.enterScope(wtf.now(), null, getHandle(location), x);
            fn.call(this, location, x);
            scope.leave();
          };
        });
        break;
      case 2:
        instrumentMethod(signature, function(fn, eventType) {
          return function(location, x, y) {
            setCurrentContext(this);
            var scope = eventType.enterScope(wtf.now(), null, getHandle(location), x, y);
            fn.call(this, location, x, y);
            scope.leave();
          };
        });
        break;
      case 3:
        instrumentMethod(signature, function(fn, eventType) {
          return function(location, x, y, z) {
            setCurrentContext(this);
            var scope = eventType.enterScope(wtf.now(), null, getHandle(location), x, y, z);
            fn.call(this, location, x, y, z);
            scope.leave();
          };
        });
        break;
      case 4:
        instrumentMethod(signature, function(fn, eventType) {
          return function(location, x, y, z, w) {
            setCurrentContext(this);
            var scope = eventType.enterScope(wtf.now(), null, getHandle(location), x, y, z, w);
            fn.call(this, location, x, y, z, w);
            scope.leave();
          };
        });
        break;
    }
  };
  function instrumentUniformArray(name, type, count) {
    var signature = name + '(uint32 location, ' + type + '[] v)';
    instrumentMethod(signature, function(fn, eventType) {
      return function(location, v) {
        setCurrentContext(this);
        var scope = eventType.enterScope(wtf.now(), null, getHandle(location), v);
        fn.call(this, location, v);
        scope.leave();
      };
    });
  };
  function instrumentUniformMatrix(name, type, count) {
    var signature = name + '(uint32 location, uint8 transpose, ' + type + '[] value)';
    instrumentMethod(signature, function(fn, eventType) {
      return function(location, transpose, v) {
        setCurrentContext(this);
        var scope = eventType.enterScope(wtf.now(), null, getHandle(location), transpose, v);
        fn.call(this, location, transpose, v);
        scope.leave();
      };
    });
  };
  instrumentUniform('uniform1f', 'float', 1);
  instrumentUniform('uniform1i', 'int32', 1);
  instrumentUniform('uniform2f', 'float', 2);
  instrumentUniform('uniform2i', 'int32', 2);
  instrumentUniform('uniform3f', 'float', 3);
  instrumentUniform('uniform3i', 'int32', 3);
  instrumentUniform('uniform4f', 'float', 4);
  instrumentUniform('uniform4i', 'int32', 4);
  instrumentUniformArray('uniform1fv', 'float', 1);
  instrumentUniformArray('uniform1iv', 'int32', 1);
  instrumentUniformArray('uniform2fv', 'float', 2);
  instrumentUniformArray('uniform2iv', 'int32', 2);
  instrumentUniformArray('uniform3fv', 'float', 3);
  instrumentUniformArray('uniform3iv', 'int32', 3);
  instrumentUniformArray('uniform4fv', 'float', 4);
  instrumentUniformArray('uniform4iv', 'int32', 4);
  instrumentUniformMatrix('uniformMatrix2fv', 'float', 4);
  instrumentUniformMatrix('uniformMatrix3fv', 'float', 9);
  instrumentUniformMatrix('uniformMatrix4fv', 'float', 16);
  instrumentMethod('useProgram(uint32 program)', function(fn, eventType) {
    return function useProgram(program) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, getHandle(program));
      fn.call(this, program);
      scope.leave();
    };
  });
  instrumentMethod('validateProgram(uint32 program)', function(fn, eventType) {
    return function validateProgram(program) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, getHandle(program));
      fn.call(this, program);
      scope.leave();
    };
  });
  instrumentMethod('vertexAttrib1f(uint8 indx, float x)');
  instrumentMethod('vertexAttrib1fv(uint8 indx, float x)', function(fn, eventType) {
    return function vertexAttrib4fv(indx, values) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, values[0]);
      fn.call(this, indx, values);
      scope.leave();
    };
  });
  instrumentMethod('vertexAttrib2f(uint8 indx, float x, float y)');
  instrumentMethod('vertexAttrib2fv(uint8 indx, float x, float y)', function(fn, eventType) {
    return function vertexAttrib4fv(indx, values) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null, values[0], values[1]);
      fn.call(this, indx, values);
      scope.leave();
    };
  });
  instrumentMethod('vertexAttrib3f(uint8 indx, float x, float y, float z)');
  instrumentMethod('vertexAttrib3fv(uint8 indx, float x, float y, float z)', function(fn, eventType) {
    return function vertexAttrib3fv(indx, values) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null,
          values[0], values[1], values[2]);
      fn.call(this, indx, values);
      scope.leave();
    };
  });
  instrumentMethod('vertexAttrib4f(uint8 indx, float x, float y, float z, float w)');
  instrumentMethod('vertexAttrib4fv(uint8 indx, float x, float y, float z, float w)', function(fn, eventType) {
    return function vertexAttrib4fv(indx, values) {
      setCurrentContext(this);
      var scope = eventType.enterScope(wtf.now(), null,
          values[0], values[1], values[2], values[3]);
      fn.call(this, indx, values);
      scope.leave();
    };
  });
  instrumentMethod('vertexAttribPointer(uint8 indx, int32 size, uint32 type, uint8 normalized, int32 stride, uint32 offset)');
  instrumentMethod('viewport(int32 x, int32 y, int32 width, int32 height)');
};


instrumentContext(WebGLRenderingContext);


var nextContextId = 0;
var allGlContexts = [];
var getContextEvent = wtf.trace.events.createScope(
    'HTMLCanvasElement#getContext');
var createContextEvent = wtf.trace.events.createInstance(
    'webglcapture.createContext(uint32 handle, utf8 attributes)');
var originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function getContext(name, opt_attrs) {
  if (name.indexOf('raw-') == 0) {
    // If a raw context is requested then prevent logging.
    name = name.substr(4);
    return originalGetContext.call(this, name, opt_attrs);
  }

  var scope = getContextEvent.enterScope(wtf.now(), null);
  var context = originalGetContext.apply(this, arguments);
  if (name == 'experimental-webgl' &&
      allGlContexts.indexOf(context) == -1) {
    allGlContexts.push(context);
    nextContextId++;
    setHandle(context, nextContextId);
    createContextEvent.append(
        wtf.now(),
        nextContextId,
        JSON.stringify(opt_attrs || {}));
  }
  return scope.leave(context);
};


function buttonClicked() {
  for (var n = 0; n < allGlContexts.length; n++) {
    var context = allGlContexts[n];
    loseContext(context);
    window.setTimeout['raw'].call(window, function() {
      instrumentContext(WebGLRenderingContext);
      restoreContext(context);
      window.setTimeout['raw'].call(window, function() {
        loseContext(context);
      }, 2000);
    }, 1000);
  }
};


})();
