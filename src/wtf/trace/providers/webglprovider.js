/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview WebGL event provider.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.providers.WebGLProvider');

goog.require('goog.asserts');
goog.require('goog.string');
goog.require('goog.webgl');
goog.require('wtf.data.EventFlag');
goog.require('wtf.timing');
goog.require('wtf.trace');
goog.require('wtf.trace.Provider');
goog.require('wtf.trace.events');



/**
 * Provides WebGL API events.
 *
 * This works by instrumenting Canvas getContext and, depending on the mode,
 * triggering context loss/restore events with an instrumented WebGL context.
 *
 * @param {!wtf.trace.TraceManager} traceManager Trace manager.
 * @param {!wtf.util.Options} options Options.
 * @constructor
 * @extends {wtf.trace.Provider}
 */
wtf.trace.providers.WebGLProvider = function(traceManager, options) {
  goog.base(this, options);

  /**
   * The next ID to give to an object when created.
   * ID 0 indicates null/nothing.
   * All contexts share the namespace to make it easier to search the traces.
   * @type {number}
   * @private
   */
  this.nextObjectId_ = 1;

  // TODO(benvanik): remove as needed - right now this leaks them all!
  /**
   * A list of all contexts currently created.
   * @type {!Array.<!WebGLRenderingContext>}
   * @private
   */
  this.createdContexts_ = [];

  /**
   * HUD buttons.
   * @type {!Array.<!Object>}
   * @private
   */
  this.hudButtons_ = [];

  /**
   * Whether the provider is currently capturing calls.
   * @type {boolean}
   * @private
   */
  this.isCapturing_ = false;

  /**
   * Whether the provider is 'locked'.
   * This is set when an async toggle is occurring. No other mode changes should
   * be allowed while it's true.
   * @type {boolean}
   * @private
   */
  this.locked_ = false;

  /**
   * A list of operations to perform to restore the WebGL context proto to its
   * original state.
   * @type {!Array.<function()>}
   * @private
   */
  this.contextRestoreFns_ = [];

  if (!goog.global['HTMLCanvasElement'] ||
      !goog.global['WebGLRenderingContext']) {
    return;
  }

  var level = options.getNumber('wtf.trace.provider.webgl', 0);
  if (!level) {
    return;
  }

  this.injectCanvas_();

  var recordAtStartup =
      options.getBoolean('wtf.trace.provider.webgl.recordAtStartup', false);
  // Firefox does not expose WebGLContextEvent, so we can't work like this.
  if (!goog.global['WebGLContextEvent']) {
    goog.global.console.log(
        'Browser does not expose WebGLContextEvent, forcing to ' +
        'record at startup.');
    recordAtStartup = true;
  }

  // If we are recording at startup that means we are recording always -
  // hook the WebGL context proto. Otherwise, the user will have to request
  // it and we only hook after faked loss/restore.
  if (recordAtStartup) {
    this.isCapturing_ = true;
    this.injectContextType_();
  } else {
    this.hudButtons_.push({
      'title': 'Toggle WebGL Capture',
      'icon': '/assets/icons/gl.svg',
      'shortcut': 'f4',
      'callback': function() {
        this.toggleCapture_();

        // TODO(benvanik): set button toggle state
      },
      'scope': this
    });
  }
};
goog.inherits(wtf.trace.providers.WebGLProvider, wtf.trace.Provider);


/**
 * @override
 */
wtf.trace.providers.WebGLProvider.prototype.getHudButtons = function() {
  return this.hudButtons_;
};


/**
 * @override
 */
wtf.trace.providers.WebGLProvider.prototype.getSettingsSectionConfigs =
    function() {
  return [
    {
      'title': 'WebGL',
      'widgets': [
        {
          'type': 'checkbox',
          'key': 'wtf.trace.provider.webgl',
          'title': 'Enabled',
          'default': false
        },
        {
          'type': 'checkbox',
          'key': 'wtf.trace.provider.webgl.recordAtStartup',
          'title': 'Start recording at page load',
          'default': true
        },
        {
          'type': 'dropdown',
          'key': 'wtf.trace.provider.webgl.captureLevel',
          'title': 'Capture:',
          'options': [
            {
              'value': 'draw_calls',
              'title': 'Draw/read/uploads only'
            },
            {
              'value': 'all_calls',
              'title': 'All calls'
            },
            {
              'value': 'all_calls_with_arguments',
              'title': 'All calls with arguments'
            },
            {
              'value': 'all_calls_with_data',
              'title': 'All calls with textures/buffers'
            }
          ],
          'default': 'draw_calls'
        },
        {
          'type': 'checkbox',
          'key': 'wtf.trace.provider.webgl.embedRemoteImages',
          'title': 'Embed remote textures in trace (slow)',
          'default': false
        }
      ]
    }
  ];
};


/**
 * Injects the Canvas shim.
 * @private
 */
wtf.trace.providers.WebGLProvider.prototype.injectCanvas_ = function() {
  // NOTE: a canvas2d provider may have already instrumented the getContext call
  // so only record events if we are sure it's a WebGL request.

  var getContextEvent = wtf.trace.events.createScope(
      'HTMLCanvasElement#getContext(ascii contextId, any attributes)');
  var createContextEvent = wtf.trace.events.createInstance(
      'wtf.webgl#createContext(uint32 handle, any attributes)',
      wtf.data.EventFlag.INTERNAL);
  var originalGetContext = HTMLCanvasElement.prototype.getContext;
  var rawGetContext = originalGetContext;
  while (rawGetContext['raw']) {
    rawGetContext = rawGetContext['raw'];
  }
  var provider = this;
  this.injectFunction(HTMLCanvasElement.prototype, 'getContext',
      function getContext(contextId, opt_attrs) {
        // Ignore requests for raw contexts.
        if (goog.string.startsWith(contextId, 'raw-')) {
          contextId = contextId.substr(4);
          return rawGetContext.call(this, contextId, opt_attrs);
        }

        if (contextId == 'webgl' ||
            contextId == 'experimental-webgl') {
          // Looks like a WebGL context - record the getContext, fetch the
          // context, and if needed prep the context for tracing.
          var scope = getContextEvent(contextId, opt_attrs);
          var result = rawGetContext.apply(this, arguments);
          if (result) {
            if (!wtf.trace.providers.WebGLProvider.getHandle(result)) {
              // Not yet registered - setup.
              var handle = provider.nextObjectId_++;
              wtf.trace.providers.WebGLProvider.setHandle(result, handle);
              provider.createdContexts_.push(result);
              createContextEvent(handle, opt_attrs);
            }
          }
          return wtf.trace.leaveScope(scope, result);
        } else {
          // Not a WebGL context.
          return originalGetContext.apply(this, arguments);
        }
      });

  // Always hook the base context so that we can simulate context loss when
  // we want to force a reset.
  // TODO(benvanik): a better simulated context loss.
  var originGetError = WebGLRenderingContext.prototype.getError;
  this.injectFunction(WebGLRenderingContext.prototype, 'getError', function() {
    if (this['__wtf_forcedLost__']) {
      return goog.webgl.CONTEXT_LOST_WEBGL;
    } else {
      return originGetError.apply(this, arguments);
    }
  });
  var originalIsContextLost = WebGLRenderingContext.prototype.isContextLost;
  this.injectFunction(WebGLRenderingContext.prototype, 'isContextLost',
      function() {
        return this['__wtf_forcedLost__'] ||
            originalIsContextLost.apply(this, arguments);
      });
};


/**
 * Toggle the capture of WebGL calls.
 * @private
 */
wtf.trace.providers.WebGLProvider.prototype.toggleCapture_ = function() {
  if (this.locked_) {
    return;
  }
  var wasCapturing = this.isCapturing_;
  this.isCapturing_ = !wasCapturing;
  this.locked_ = true;

  // Lose all contexts.
  // This makes the users recreate all resources.
  for (var n = 0; n < this.createdContexts_.length; n++) {
    var context = this.createdContexts_[n];
    wtf.trace.providers.WebGLProvider.loseContext(context);
  }

  // Wait a moment.
  // This may not be required, but makes things a bit cleaner in the trace/
  // reduces thrashing if the next frame is a bunch of deletes from the app.
  wtf.timing.setTimeout(500, function() {
    // Swap out the type to the new mode.
    if (wasCapturing) {
      this.restoreContextType_();
    } else {
      this.injectContextType_();
    }

    // Restore all contexts so they recreate their resources.
    for (var n = 0; n < this.createdContexts_.length; n++) {
      var context = this.createdContexts_[n];
      wtf.trace.providers.WebGLProvider.restoreContext(context);
    }

    this.locked_ = false;
  }, this);
};


/**
 * Injects the WebGLRenderingContext proto instrumentation.
 * @private
 */
wtf.trace.providers.WebGLProvider.prototype.injectContextType_ = function() {
  if (this.contextRestoreFns_.length) {
    // Already injected?
    return;
  }

  var provider = this;

  var getHandle = wtf.trace.providers.WebGLProvider.getHandle;
  var setHandle = wtf.trace.providers.WebGLProvider.setHandle;

  // This traces a setContext event that can be used to figure out what
  // context WebGL calls are targetting without requiring that to be an argument
  // on every call.
  var currentContext = null;
  var currentContextWidth = 0;
  var currentContextHeight = 0;
  var setContextEvent = wtf.trace.events.createInstance(
      'wtf.webgl#setContext(uint32 handle, uint32 width, uint32 height)',
      wtf.data.EventFlag.INTERNAL);
  function setCurrentContext(ctx) {
    if (ctx != currentContext ||
        ctx.drawingBufferWidth != currentContextWidth ||
        ctx.drawingBufferHeight != currentContextHeight) {
      currentContext = ctx;
      currentContextWidth = ctx.drawingBufferWidth;
      currentContextHeight = ctx.drawingBufferHeight;
      setContextEvent(
          getHandle(ctx),
          ctx.drawingBufferWidth, ctx.drawingBufferHeight);
    }
  };
  var thisSetContext = function() {
    setCurrentContext(this);
  };
  var thisSetContextGenerator = function() {
    return function() {
      setCurrentContext(this);
    };
  };

  var mode = this.options.getString(
      'wtf.trace.provider.webgl.captureLevel', 'all_calls_with_arguments');
  var onlyDraws = mode == 'draw_calls';
  var includeArgs = !onlyDraws && mode != 'all_calls';
  var includeResources = mode == 'all_calls_with_data';
  var embedRemoteImages = this.options.getBoolean(
      'wtf.trace.provider.webgl.embedRemoteImages', true);

  var contextRestoreFns = [];
  /**
   * Wraps a method on the target prototype with a scoped event.
   * Optionally the method can provide a custom callback routine.
   * @param {!Object} target Target object/prototype.
   * @param {string} signature Event signature.
   * @param {Function=} opt_generator Generator function.
   */
  function wrapMethod(target, signature, opt_generator) {
    var signatureParts = /^([a-zA-Z0-9_\.:]+)(\((.*)\)$)?/.exec(signature);
    var signatureName = signatureParts[1]; // entire name before ()

    if (!includeArgs) {
      // Strip signature args, as we don't want them.
      signature = signatureName;
    }

    var rawFn = target[signatureName];
    goog.asserts.assert(rawFn);
    var instrumentedFn = wtf.trace.instrument(
        rawFn,
        signature,
        'WebGLRenderingContext#',
        includeArgs ? opt_generator : null,
        thisSetContext);
    instrumentedFn['raw'] = rawFn;
    target[signatureName] = instrumentedFn;
    contextRestoreFns.push(function() {
      target[signatureName] = rawFn;
    });
  };

  var ctxproto = WebGLRenderingContext.prototype;

  !onlyDraws && wrapMethod(ctxproto,
      'getContextAttributes()');
  !onlyDraws && wrapMethod(ctxproto,
      'isContextLost()');
  !onlyDraws && wrapMethod(ctxproto,
      'getSupportedExtensions()');
  !onlyDraws && wrapMethod(ctxproto,
      'getExtension(ascii name)');
  !onlyDraws && wrapMethod(ctxproto,
      'activeTexture(uint32 texture)');
  !onlyDraws && wrapMethod(ctxproto,
      'attachShader(uint32 program, uint32 shader)',
      function(fn, eventType) {
        return function attachShader(program, shader) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program), getHandle(shader));
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'bindAttribLocation(uint32 program, uint32 index, utf8 name)',
      function(fn, eventType) {
        return function bindAttribLocation(program, index, name) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program), index, name);
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'bindBuffer(uint32 target, uint32 buffer)',
      function(fn, eventType) {
        return function bindBuffer(target, buffer) {
          setCurrentContext(this);
          var scope = eventType(target, getHandle(buffer));
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'bindFramebuffer(uint32 target, uint32 framebuffer)',
      function(fn, eventType) {
        return function bindFramebuffer(target, framebuffer) {
          setCurrentContext(this);
          var scope = eventType(target, getHandle(framebuffer));
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'bindRenderbuffer(uint32 target, uint32 renderbuffer)',
      function(fn, eventType) {
        return function bindRenderbuffer(target, renderbuffer) {
          setCurrentContext(this);
          var scope = eventType(target, getHandle(renderbuffer));
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'bindTexture(uint32 target, uint32 texture)',
      function(fn, eventType) {
        return function bindTexture(target, texture) {
          setCurrentContext(this);
          var scope = eventType(target, getHandle(texture));
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'blendColor(float red, float green, float blue, float alpha)');
  !onlyDraws && wrapMethod(ctxproto,
      'blendEquation(uint32 mode)');
  !onlyDraws && wrapMethod(ctxproto,
      'blendEquationSeparate(uint32 modeRGB, uint32 modeAlpha)');
  !onlyDraws && wrapMethod(ctxproto,
      'blendFunc(uint32 sfactor, uint32 dfactor)');
  !onlyDraws && wrapMethod(ctxproto,
      'blendFuncSeparate(uint32 srcRGB, uint32 dstRGB, uint32 srcAlpha, uint32 dstAlpha)');
  wrapMethod(ctxproto,
      'bufferData(uint32 target, uint32 size, uint32 usage, uint8[] data)',
      function(fn, eventType) {
        return function bufferData(target, data, usage) {
          setCurrentContext(this);
          if (typeof data == 'number') {
            var scope = eventType(target, data, usage, []);
            return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
          } else {
            var dataLength = data.byteLength;
            if (includeResources) {
              if (data instanceof ArrayBuffer) {
                data = new Uint8Array(data);
              } else if (!(data instanceof Uint8Array)) {
                data = new Uint8Array(data.buffer);
              }
            } else {
              data = [];
            }
            var scope = eventType(target, dataLength, usage, data);
            return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
          }
        };
      });
  wrapMethod(ctxproto,
      'bufferSubData(uint32 target, uint32 offset, uint8[] data)',
      function(fn, eventType) {
        return function bufferSubData(target, offset, data) {
          setCurrentContext(this);
          if (includeResources) {
            if (data instanceof ArrayBuffer) {
              data = new Uint8Array(data);
            } else if (!(data instanceof Uint8Array)) {
              data = new Uint8Array(data.buffer);
            }
          } else {
            data = [];
          }
          var scope = eventType(target, offset, data);
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapMethod(ctxproto,
      'checkFramebufferStatus(uint32 target)');
  !onlyDraws && wrapMethod(ctxproto,
      'clear(uint32 mask)');
  !onlyDraws && wrapMethod(ctxproto,
      'clearColor(float red, float green, float blue, float alpha)');
  !onlyDraws && wrapMethod(ctxproto,
      'clearDepth(float depth)');
  !onlyDraws && wrapMethod(ctxproto,
      'clearStencil(int32 s)');
  !onlyDraws && wrapMethod(ctxproto,
      'colorMask(uint8 red, uint8 green, uint8 blue, uint8 alpha)');
  wrapMethod(ctxproto,
      'compileShader(uint32 shader)',
      function(fn, eventType) {
        return function compileShader(shader) {
          setCurrentContext(this);
          var scope = eventType(getHandle(shader));
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  // TODO(benvanik): compressedTexImage2D
  wrapMethod(ctxproto,
      'compressedTexImage2D(uint32 target, int32 level, uint32 internalformat, int32 width, int32 height, int32 border, uint8[] data)');
  wrapMethod(ctxproto,
      'compressedTexSubImage2D(uint32 target, int32 level, int32 xoffset, int32 yoffset, int32 width, int32 height, uint32 format, uint8[] data)');
  wrapMethod(ctxproto,
      'copyTexImage2D(uint32 target, int32 level, uint32 internalformat, int32 x, int32 y, int32 width, int32 height, int32 border)');
  wrapMethod(ctxproto,
      'copyTexSubImage2D(uint32 target, int32 level, int32 xoffset, int32 yoffset, int32 x, int32 y, int32 widht, int32 height)');
  /**
   * @param {!Object} target Target.
   * @param {string} name Name.
   * @param {string=} opt_arg Argument.
   */
  function wrapCreateMethod(target, name, opt_arg) {
    var signature =
        name + '(' + (opt_arg ? opt_arg + ', ' : '') + 'uint32 value)';
    wrapMethod(target, signature, function(fn, eventType) {
      return function(arg) {
        setCurrentContext(this);
        var id = provider.nextObjectId_++;
        if (opt_arg) {
          wtf.trace.leaveScope(eventType(arg, id));
        } else {
          wtf.trace.leaveScope(eventType(id));
        }
        var obj = fn.apply(this, arguments);
        if (obj) {
          setHandle(obj, id);
        }
        return obj;
      };
    });
  };
  !onlyDraws && wrapCreateMethod(ctxproto, 'createBuffer');
  !onlyDraws && wrapCreateMethod(ctxproto, 'createFramebuffer');
  !onlyDraws && wrapCreateMethod(ctxproto, 'createProgram');
  !onlyDraws && wrapCreateMethod(ctxproto, 'createRenderbuffer');
  !onlyDraws && wrapCreateMethod(ctxproto, 'createShader', 'uint32 type');
  !onlyDraws && wrapCreateMethod(ctxproto, 'createTexture');
  !onlyDraws && wrapMethod(ctxproto,
      'cullFace(uint32 mode)');
  function wrapDeleteMethod(target, name) {
    var signature = name + '(uint32 value)';
    wrapMethod(target, signature, function(fn, eventType) {
      return function(value) {
        setCurrentContext(this);
        var scope = eventType(getHandle(value));
        return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
      };
    });
  };
  !onlyDraws && wrapDeleteMethod(ctxproto, 'deleteBuffer');
  !onlyDraws && wrapDeleteMethod(ctxproto, 'deleteFramebuffer');
  !onlyDraws && wrapDeleteMethod(ctxproto, 'deleteProgram');
  !onlyDraws && wrapDeleteMethod(ctxproto, 'deleteRenderbuffer');
  !onlyDraws && wrapDeleteMethod(ctxproto, 'deleteShader');
  !onlyDraws && wrapDeleteMethod(ctxproto, 'deleteTexture');
  !onlyDraws && wrapMethod(ctxproto,
      'depthFunc(uint32 func)');
  !onlyDraws && wrapMethod(ctxproto,
      'depthMask(uint8 flag)');
  !onlyDraws && wrapMethod(ctxproto,
      'depthRange(float zNear, float zFar)');
  !onlyDraws && wrapMethod(ctxproto,
      'detachShader(uint32 program, uint32 shader)',
      function(fn, eventType) {
        return function detachShader(program, shader) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program), getHandle(shader));
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'disable(uint32 cap)');
  !onlyDraws && wrapMethod(ctxproto,
      'disableVertexAttribArray(uint8 index)');
  wrapMethod(ctxproto,
      'drawArrays(uint32 mode, uint32 first, int32 count)');
  wrapMethod(ctxproto,
      'drawElements(uint32 mode, int32 count, uint32 type, uint32 offset)');
  !onlyDraws && wrapMethod(ctxproto,
      'enable(uint32 cap)');
  !onlyDraws && wrapMethod(ctxproto,
      'enableVertexAttribArray(uint8 index)');
  wrapMethod(ctxproto,
      'finish()');
  wrapMethod(ctxproto,
      'flush()');
  !onlyDraws && wrapMethod(ctxproto,
      'framebufferRenderbuffer(uint32 target, uint32 attachment, uint32 renderbuffertarget, uint32 renderbuffer)',
      function(fn, eventType) {
        return function framebufferRenderbuffer(
            target, attachment, renderbuffertarget, renderbuffer) {
          setCurrentContext(this);
          var scope = eventType(
              target, attachment, renderbuffertarget, getHandle(renderbuffer));
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'framebufferTexture2D(uint32 target, uint32 attachment, uint32 textarget, uint32 texture, int32 level)',
      function(fn, eventType) {
        return function framebufferTexture2D(
            target, attachment, textarget, texture, level) {
          setCurrentContext(this);
          var scope = eventType(
              target, attachment, textarget, getHandle(texture), level);
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'frontFace(uint32 mode)');
  wrapMethod(ctxproto,
      'generateMipmap(uint32 target)');
  !onlyDraws && wrapMethod(ctxproto,
      'getActiveAttrib(uint32 program, uint32 index)',
      function(fn, eventType) {
        return function getActiveAttrib(program, index) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program), index);
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'getActiveUniform(uint32 program, uint32 index)',
      function(fn, eventType) {
        return function getActiveUniform(program, index) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program), index);
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'getAttachedShaders(uint32 program)',
      function(fn, eventType) {
        return function getAttachedShaders(program) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program));
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'getAttribLocation(uint32 program, utf8 name)',
      function(fn, eventType) {
        return function getAttribLocation(program, name) {
          setCurrentContext(this);
          // TODO(benvanik): record result and build mapping table
          var scope = eventType(getHandle(program), name);
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'getBufferParameter(uint32 target, uint32 pname)');
  !onlyDraws && wrapMethod(ctxproto,
      'getParameter(uint32 pname)');
  !onlyDraws && wrapMethod(ctxproto,
      'getError()');
  !onlyDraws && wrapMethod(ctxproto,
      'getFramebufferAttachmentParameter(uint32 target, uint32 attachment, uint32 pname)');
  !onlyDraws && wrapMethod(ctxproto,
      'getProgramParameter(uint32 program, uint32 pname)',
      function(fn, eventType) {
        return function getProgramParameter(program, pname) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program), pname);
          return wtf.trace.leaveScope(scope, fn.call(this, program, pname));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'getProgramInfoLog(uint32 program)',
      function(fn, eventType) {
        return function getProgramInfoLog(program) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program));
          return wtf.trace.leaveScope(scope, fn.call(this, program));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'getRenderbufferParameter(uint32 target, uint32 pname)');
  !onlyDraws && wrapMethod(ctxproto,
      'getShaderParameter(uint32 shader, uint32 pname)',
      function(fn, eventType) {
        return function getShaderParameter(shader, pname) {
          setCurrentContext(this);
          var scope = eventType(getHandle(shader), pname);
          return wtf.trace.leaveScope(scope, fn.call(this, shader, pname));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'getShaderPrecisionFormat(uint32 shadertype, uint32 precisiontype)');
  !onlyDraws && wrapMethod(ctxproto,
      'getShaderInfoLog(uint32 shader)',
      function(fn, eventType) {
        return function getShaderInfoLog(shader) {
          setCurrentContext(this);
          var scope = eventType(getHandle(shader));
          return wtf.trace.leaveScope(scope, fn.call(this, shader));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'getShaderSource(uint32 shader)',
      function(fn, eventType) {
        return function getShaderSource(shader) {
          setCurrentContext(this);
          var scope = eventType(getHandle(shader));
          return wtf.trace.leaveScope(scope, fn.call(this, shader));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'getTexParameter(uint32 target, uint32 pname)');
  // TODO(benvanik): getUniform
  !onlyDraws && wrapMethod(ctxproto,
      'getUniform');
  !onlyDraws && wrapMethod(ctxproto,
      'getUniformLocation(uint32 program, utf8 name, uint32 value)',
      function(fn, eventType) {
        return function getUniformLocation(program, name) {
          setCurrentContext(this);
          // TODO(benvanik): better tracking mechanism/string table/etc, as an
          //     app calling this each frame will quickly eat up IDs
          var id = provider.nextObjectId_++;
          var scope = eventType(getHandle(program), name, id);
          var obj = fn.call(this, program, name);
          if (obj) {
            setHandle(obj, id);
          }
          return wtf.trace.leaveScope(scope, obj);
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'getVertexAttrib(uint32 index, uint32 pname)');
  !onlyDraws && wrapMethod(ctxproto,
      'getVertexAttribOffset(uint32 index, uint32 pname)');
  !onlyDraws && wrapMethod(ctxproto,
      'hint(uint32 target, uint32 mode)');
  !onlyDraws && wrapMethod(ctxproto,
      'isEnabled(uint32 cap)');
  function wrapIsMethod(target, name) {
    var signature = name + '(uint32 type)';
    wrapMethod(target, signature, function(fn, eventType) {
      return function(value) {
        setCurrentContext(this);
        var scope;
        if (value && getHandle(value)) {
          scope = eventType(getHandle(value));
        } else {
          scope = eventType(0);
        }
        return wtf.trace.leaveScope(scope, fn.call(this, value));
      };
    });
  };
  !onlyDraws && wrapIsMethod(ctxproto, 'isBuffer');
  !onlyDraws && wrapIsMethod(ctxproto, 'isFramebuffer');
  !onlyDraws && wrapIsMethod(ctxproto, 'isProgram');
  !onlyDraws && wrapIsMethod(ctxproto, 'isRenderbuffer');
  !onlyDraws && wrapIsMethod(ctxproto, 'isShader');
  !onlyDraws && wrapIsMethod(ctxproto, 'isTexture');
  !onlyDraws && wrapMethod(ctxproto,
      'lineWidth(float width)');
  wrapMethod(ctxproto,
      'linkProgram(uint32 program)',
      function(fn, eventType) {
        return function linkProgram(program) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program));
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'pixelStorei(uint32 pname, int32 param)');
  !onlyDraws && wrapMethod(ctxproto,
      'polygonOffset(float factor, float units)');
  // TODO(benvanik): log input data type/length.
  wrapMethod(ctxproto,
      'readPixels(int32 x, int32 y, int32 width, int32 height, uint32 format, uint32 type)');
  !onlyDraws && wrapMethod(ctxproto,
      'renderbufferStorage(uint32 target, uint32 internalformat, int32 width, int32 height)');
  !onlyDraws && wrapMethod(ctxproto,
      'sampleCoverage(float value, uint8 invert)');
  !onlyDraws && wrapMethod(ctxproto,
      'scissor(int32 x, int32 y, int32 width, int32 height)');
  wrapMethod(ctxproto,
      'shaderSource(uint32 shader, utf8 source)',
      function(fn, eventType) {
        return function shaderSource(shader, source) {
          setCurrentContext(this);
          var scope = eventType(getHandle(shader), source);
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'stencilFunc(uint32 func, int32 ref, uint32 mask)');
  !onlyDraws && wrapMethod(ctxproto,
      'stencilFuncSeparate(uint32 face, uint32 func, int32 ref, uint32 mask)');
  !onlyDraws && wrapMethod(ctxproto,
      'stencilMask(uint32 mask)');
  !onlyDraws && wrapMethod(ctxproto,
      'stencilMaskSeaprate(uint32 face, uint32 mask)');
  !onlyDraws && wrapMethod(ctxproto,
      'stencilOp(uint32 fail, uint32 zfail, uint32 zpass)');
  !onlyDraws && wrapMethod(ctxproto,
      'stencilOpSeparate(uint32 face, uint32 fail, uint32 zfail, uint32 zpass)');
  wrapMethod(ctxproto,
      'texImage2D(uint32 target, int32 level, uint32 internalformat, int32 width, int32 height, int32 border, uint32 format, uint32 type, uint8[] pixels, ascii dataType)',
      function(fn, eventType) {
        return function texImage2D(target, level, internalformat) {
          setCurrentContext(this);
          var scope;
          if (arguments.length == 9) {
            // Pixels variant.
            if (arguments[8]) {
              scope = eventType(
                  target, level, internalformat, arguments[3], arguments[4],
                  arguments[5], arguments[6], arguments[7],
                  includeResources ? arguments[8] : [],
                  includeResources ? 'pixels' : 'ignored');
            } else {
              scope = eventType(
                  target, level, internalformat, arguments[3], arguments[4],
                  arguments[5], arguments[6], arguments[7], [],
                  'null');
            }
          } else {
            // DOM element variant.
            var imageData = null;
            if (includeResources) {
              var traceScope = wtf.trace.enterTracingScope();
              imageData = wtf.trace.providers.WebGLProvider.extractImageData(
                  arguments[5], internalformat, embedRemoteImages);
              wtf.trace.leaveScope(traceScope);
            }
            scope = eventType(
                target,
                level,
                internalformat,
                arguments[5].width, arguments[5].height,
                0,
                arguments[3],
                arguments[4],
                imageData ? imageData.pixels : [],
                imageData ? imageData.dataType : 'ignored');
          }
          try {
            fn.apply(this, arguments);
          } finally {
            wtf.trace.leaveScope(scope);
          }
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'texParameterf(uint32 target, uint32 pname, float param)');
  !onlyDraws && wrapMethod(ctxproto,
      'texParameteri(uint32 target, uint32 pname, int32 param)');
  wrapMethod(ctxproto,
      'texSubImage2D(uint32 target, int32 level, int32 xoffset, int32 yoffset, int32 width, int32 height, uint32 format, uint32 type, uint8[] pixels, ascii dataType)',
      function(fn, eventType) {
        return function texSubImage2D(target, level, xoffset, yoffset) {
          setCurrentContext(this);
          var scope;
          if (arguments.length == 9) {
            // Pixels variant.
            if (arguments[8]) {
              scope = eventType(
                  target, level, xoffset, yoffset, arguments[4], arguments[5],
                  arguments[6], arguments[7],
                  includeResources ? arguments[8] : [],
                  includeResources ? 'pixels' : 'ignored');
            } else {
              scope = eventType(
                  target, level, xoffset, yoffset, arguments[4], arguments[5],
                  arguments[6], arguments[7], [],
                  'null');
            }
          } else {
            // DOM element variant.
            var imageData = null;
            if (includeResources) {
              var traceScope = wtf.trace.enterTracingScope();
              imageData = wtf.trace.providers.WebGLProvider.extractImageData(
                  arguments[6], arguments[4], embedRemoteImages);
              wtf.trace.leaveScope(traceScope);
            }
            scope = eventType(
                target,
                level,
                xoffset, yoffset,
                arguments[6].width, arguments[6].height,
                arguments[4],
                arguments[5],
                imageData ? imageData.pixels : [],
                imageData ? imageData.dataType : 'ignored');
          }
          try {
            fn.apply(this, arguments);
          } finally {
            wtf.trace.leaveScope(scope);
          }
        };
      });
  function wrapUniformMethod(target, name, type, count) {
    var signature = name + '(uint32 location';
    var names = ['x', 'y', 'z', 'w'];
    for (var n = 0; n < count; n++) {
      signature += ', ' + type + ' ' + names[n];
    }
    signature += ')';
    switch (count) {
      case 1:
        wrapMethod(target, signature, function(fn, eventType) {
          return function(location, x) {
            setCurrentContext(this);
            var scope = eventType(getHandle(location), x);
            return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
          };
        });
        break;
      case 2:
        wrapMethod(target, signature, function(fn, eventType) {
          return function(location, x, y) {
            setCurrentContext(this);
            var scope = eventType(getHandle(location), x, y);
            return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
          };
        });
        break;
      case 3:
        wrapMethod(target, signature, function(fn, eventType) {
          return function(location, x, y, z) {
            setCurrentContext(this);
            var scope = eventType(getHandle(location), x, y, z);
            return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
          };
        });
        break;
      case 4:
        wrapMethod(target, signature, function(fn, eventType) {
          return function(location, x, y, z, w) {
            setCurrentContext(this);
            var scope = eventType(getHandle(location), x, y, z, w);
            return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
          };
        });
        break;
    }
  };
  function wrapUniformArrayMethod(target, name, type, count) {
    var signature = name + '(uint32 location, ' + type + '[] v)';
    wrapMethod(target, signature, function(fn, eventType) {
      return function(location, v) {
        setCurrentContext(this);
        var scope = eventType(getHandle(location), v);
        return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
      };
    });
  };
  function wrapUniformMatrixMethod(target, name, type, count) {
    var signature =
        name + '(uint32 location, uint8 transpose, ' + type + '[] value)';
    wrapMethod(target, signature, function(fn, eventType) {
      return function(location, transpose, v) {
        setCurrentContext(this);
        var scope = eventType(getHandle(location), transpose, v);
        return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
      };
    });
  };
  !onlyDraws && wrapUniformMethod(ctxproto,
      'uniform1f', 'float', 1);
  !onlyDraws && wrapUniformMethod(ctxproto,
      'uniform1i', 'int32', 1);
  !onlyDraws && wrapUniformMethod(ctxproto,
      'uniform2f', 'float', 2);
  !onlyDraws && wrapUniformMethod(ctxproto,
      'uniform2i', 'int32', 2);
  !onlyDraws && wrapUniformMethod(ctxproto,
      'uniform3f', 'float', 3);
  !onlyDraws && wrapUniformMethod(ctxproto,
      'uniform3i', 'int32', 3);
  !onlyDraws && wrapUniformMethod(ctxproto,
      'uniform4f', 'float', 4);
  !onlyDraws && wrapUniformMethod(ctxproto,
      'uniform4i', 'int32', 4);
  !onlyDraws && wrapUniformArrayMethod(ctxproto,
      'uniform1fv', 'float', 1);
  !onlyDraws && wrapUniformArrayMethod(ctxproto,
      'uniform1iv', 'int32', 1);
  !onlyDraws && wrapUniformArrayMethod(ctxproto,
      'uniform2fv', 'float', 2);
  !onlyDraws && wrapUniformArrayMethod(ctxproto,
      'uniform2iv', 'int32', 2);
  !onlyDraws && wrapUniformArrayMethod(ctxproto,
      'uniform3fv', 'float', 3);
  !onlyDraws && wrapUniformArrayMethod(ctxproto,
      'uniform3iv', 'int32', 3);
  !onlyDraws && wrapUniformArrayMethod(ctxproto,
      'uniform4fv', 'float', 4);
  !onlyDraws && wrapUniformArrayMethod(ctxproto,
      'uniform4iv', 'int32', 4);
  !onlyDraws && wrapUniformMatrixMethod(ctxproto,
      'uniformMatrix2fv', 'float', 4);
  !onlyDraws && wrapUniformMatrixMethod(ctxproto,
      'uniformMatrix3fv', 'float', 9);
  !onlyDraws && wrapUniformMatrixMethod(ctxproto,
      'uniformMatrix4fv', 'float', 16);
  wrapMethod(ctxproto,
      'useProgram(uint32 program)',
      function(fn, eventType) {
        return function useProgram(program) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program));
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapMethod(ctxproto,
      'validateProgram(uint32 program)',
      function(fn, eventType) {
        return function validateProgram(program) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program));
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'vertexAttrib1f(uint8 indx, float x)');
  !onlyDraws && wrapMethod(ctxproto,
      'vertexAttrib1fv(uint8 indx, float x)',
      function(fn, eventType) {
        return function vertexAttrib4fv(indx, values) {
          setCurrentContext(this);
          var scope = eventType(values[0]);
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'vertexAttrib2f(uint8 indx, float x, float y)');
  !onlyDraws && wrapMethod(ctxproto,
      'vertexAttrib2fv(uint8 indx, float x, float y)',
      function(fn, eventType) {
        return function vertexAttrib4fv(indx, values) {
          setCurrentContext(this);
          var scope = eventType(values[0], values[1]);
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'vertexAttrib3f(uint8 indx, float x, float y, float z)');
  !onlyDraws && wrapMethod(ctxproto,
      'vertexAttrib3fv(uint8 indx, float x, float y, float z)',
      function(fn, eventType) {
        return function vertexAttrib3fv(indx, values) {
          setCurrentContext(this);
          var scope = eventType(values[0], values[1], values[2]);
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'vertexAttrib4f(uint8 indx, float x, float y, float z, float w)');
  !onlyDraws && wrapMethod(ctxproto,
      'vertexAttrib4fv(uint8 indx, float x, float y, float z, float w)',
      function(fn, eventType) {
        return function vertexAttrib4fv(indx, values) {
          setCurrentContext(this);
          var scope = eventType(values[0], values[1], values[2], values[3]);
          return wtf.trace.leaveScope(scope, fn.apply(this, arguments));
        };
      });
  !onlyDraws && wrapMethod(ctxproto,
      'vertexAttribPointer(uint8 indx, int32 size, uint32 type, uint8 normalized, int32 stride, uint32 offset)');
  wrapMethod(ctxproto,
      'viewport(int32 x, int32 y, int32 width, int32 height)');
};


/**
 * Restores the WebGLRenderingContext proto instrumentation.
 * @private
 */
wtf.trace.providers.WebGLProvider.prototype.restoreContextType_ = function() {
  for (var n = 0; n < this.contextRestoreFns_.length; n++) {
    this.contextRestoreFns_[n]();
  }
  this.contextRestoreFns_.length = 0;
};


/**
 * Gets the tracking handle from the given object.
 * @param {Object} obj Target object.
 * @return {number} Handle or 0 if the input was untracked/null.
 */
wtf.trace.providers.WebGLProvider.getHandle = function(obj) {
  return obj ? (obj['__wtf_glhandle__'] || 0) : 0;
};


/**
 * Sets the tracking handle on the given object.
 * @param {!Object} obj Target object.
 */
wtf.trace.providers.WebGLProvider.setHandle = function(obj, value) {
  obj['__wtf_glhandle__'] = value;
};


/**
 * Fakes a context loss event and marks the context as lost.
 * @param {!WebGLRenderingContext} context Target context.
 */
wtf.trace.providers.WebGLProvider.loseContext = function(context) {
  if (context['__wtf_forcedLost__']) {
    return;
  }
  context['__wtf_forcedLost__'] = true;
  var e = new goog.global['WebGLContextEvent']('webglcontextlost', {
    'statusMessage': 'Forced via WTF'
  });
  context.canvas.dispatchEvent(e);
};


/**
 * Fakes a context restore event and marks the context as restored.
 * @param {!WebGLRenderingContext} context Target context.
 */
wtf.trace.providers.WebGLProvider.restoreContext = function(context) {
  if (!context['__wtf_forcedLost__']) {
    return;
  }
  delete context['__wtf_forcedLost__'];
  var e = new goog.global['WebGLContextEvent']('webglcontextrestored', {
    'statusMessage': 'Forced via WTF'
  });
  context.canvas.dispatchEvent(e);
};


/**
 * Extracts the pixels from the given image data.
 * @param {number} width Width.
 * @param {number} height Height.
 * @param {number} internalformat WebGL internal format.
 * @param {!ImageData} imageData Canvas image data.
 * @return {!Uint8Array} Pixel data.
 */
wtf.trace.providers.WebGLProvider.getPixelsFromImageData = function(
    width, height, internalformat, imageData) {
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


/**
 * A cache of canvases used for texture pixel fetching.
 * Keyed on '[w]x[h]'.
 * @type {!Object.<!Element>}
 * @private
 */
wtf.trace.providers.WebGLProvider.canvasCache_ = {};


/**
 * Extracts the image data from the given DOM element.
 * @param {!Element} el DOM element.
 * @param {number} internalformat WebGL internal format.
 * @param {boolean} embedRemoteImages Embed remote images.
 * @return {!{
 *   pixels: !(Array|Uint8Array),
 *   dataType: string
 * }} Resulting image data.
 */
wtf.trace.providers.WebGLProvider.extractImageData = function(
    el, internalformat, embedRemoteImages) {
  var canvasCache = wtf.trace.providers.WebGLProvider.canvasCache_;

  var width = /** @type {number} */ (el.width);
  var height = /** @type {number} */ (el.height);
  if ((el instanceof HTMLImageElement || el instanceof Image) &&
      el.src.indexOf('blob:') != 0) {
    if (embedRemoteImages) {
      // Synchronous XHR to get the image in compressed form.
      // HEAD first to get the mime type.
      var xhrType = goog.global['XMLHttpRequest'];
      if (xhrType['raw']) {
        xhrType = xhrType['raw'];
      }
      var xhr = new xhrType();
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
        xhr = new xhrType();
        xhr.overrideMimeType('text/plain; charset=x-user-defined');
        xhr.open('GET', el.src, false);
        xhr.send(null);

        // Convert to binary.
        var responseText = xhr.responseText;
        var data = new Uint8Array(responseText.length);
        for (var n = 0; n < data.length; n++) {
          data[n] = responseText.charCodeAt(n) & 0xFF;
        }

        return {
          pixels: data,
          dataType: mimeType
        };
      }
    } else {
      return {
        pixels: [],
        dataType: el.src
      };
    }
  } else if (el instanceof HTMLCanvasElement) {
    // Get pixels from canvas.
    var ctx = el.getContext('raw-2d') || el.getContext('2d');
    var id = ctx.getImageData(0, 0, width, height);
    var pixels = wtf.trace.providers.WebGLProvider.getPixelsFromImageData(
        width, height, internalformat, id);
    // TODO(benvanik): RLE pixels?
    return {
      pixels: pixels,
      dataType: 'pixels'
    };
  } else if (el instanceof ImageData) {
    var pixels = wtf.trace.providers.WebGLProvider.getPixelsFromImageData(
        width, height, internalformat, el);
    // TODO(benvanik): RLE pixels?
    return {
      pixels: pixels,
      dataType: 'pixels'
    };
  } else {
    // Canvas/video/etc need to be encoded as pixels.
    var key = width + 'x' + height;
    var canvas = canvasCache[key];
    var needsClear = !!canvas;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvasCache[key] = canvas;
    }
    var ctx = canvas.getContext('raw-2d');
    if (needsClear) {
      ctx.clearRect(0, 0, width, height);
    }
    ctx.drawImage(el, 0, 0);
    var id = ctx.getImageData(0, 0, width, height);
    var pixels = wtf.trace.providers.WebGLProvider.getPixelsFromImageData(
        width, height, internalformat, id);
    return {
      pixels: pixels,
      dataType: 'pixels'
    };
  }
};
