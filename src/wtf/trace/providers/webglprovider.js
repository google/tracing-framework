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
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.string');
goog.require('goog.webgl');
goog.require('wtf.data.EventFlag');
goog.require('wtf.data.Variable');
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
   * The next ID to give to a context when created.
   * @type {number}
   * @private
   */
  this.nextContextId_ = 1;

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
      'icon': '/assets/icons/gl.png',
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
          'type': 'checkbox',
          'key': 'wtf.trace.provider.webgl.replayable',
          'title': 'Capture textures/buffers for replay (slow)',
          'default': true
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
              var handle = provider.nextContextId_++;
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

  var replayable = this.options.getBoolean(
      'wtf.trace.provider.webgl.replayable', true);
  var embedRemoteImages = this.options.getBoolean(
      'wtf.trace.provider.webgl.embedRemoteImages', true);

  // Record that we have injected on a canvas and what the options were.
  // This will let apps using this data easily check if if the trace is
  // replayable.
  var initEvent = wtf.trace.events.createInstance(
      'wtf.webgl#init(any options)');
  initEvent({
    'replayable': replayable,
    'embedRemoteImages': embedRemoteImages
  });

  var provider = this;

  var getHandle = wtf.trace.providers.WebGLProvider.getHandle;
  var setHandle = wtf.trace.providers.WebGLProvider.setHandle;

  var leaveScope = wtf.trace.leaveScope;

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

  // Stash off functions that let us quickly restore the context prototype
  // to its original state.
  var contextRestoreFns = this.contextRestoreFns_;
  goog.asserts.assert(!contextRestoreFns.length);

  /**
   * Wraps a method on the target prototype with a scoped event.
   * Optionally the method can provide a custom callback routine.
   * @param {!Object} target Target object/prototype.
   * @param {string} targetType Target type name.
   * @param {string} signature Event signature.
   * @param {Function=} opt_generator Generator function.
   */
  function wrapMethod(target, targetType, signature, opt_generator) {
    // Parse signature.
    var parsedSignature = wtf.data.Variable.parseSignature(signature);
    var methodName = parsedSignature.name;

    // Define a custom event type at runtime.
    var customEvent = wtf.trace.events.createScope(
        targetType + '#' + signature);
    goog.asserts.assert(customEvent);

    // Grab the original method from the target.
    var rawFn = target[methodName];
    if (!rawFn) {
      goog.global.console.log(targetType + ' is missing ' + methodName);
      return;
    }

    // Generate a bound function.
    var instrumentedFn;
    if (opt_generator) {
      // Custom enter function generator.
      instrumentedFn = opt_generator(rawFn, customEvent);
    } else {
      // Default case of simple event.
      instrumentedFn = function() {
        // Always call setCurrentContext first to ensure proper event order.
        setCurrentContext(this);

        // Enter scope with the arguments of the call.
        var scope = customEvent.apply(null, arguments);

        // Call the original method.
        var result = rawFn.apply(this, arguments);

        // Return the result and leave the scope.
        return leaveScope(scope, result);
      };
    }

    // Swap the method and save a restore function so that we can swap it back.
    instrumentedFn['raw'] = rawFn;
    target[methodName] = instrumentedFn;
    contextRestoreFns.push(function() {
      target[methodName] = rawFn;
    });
  };

  /**
   * @param {string} signature Event signature.
   * @param {Function=} opt_generator Generator function.
   */
  function wrapContextMethod(signature, opt_generator) {
    wrapMethod(
        WebGLRenderingContext.prototype, 'WebGLRenderingContext',
        signature, opt_generator);
  };

  function coercePixelTypeToUint8(source) {
    if (!(source instanceof Uint8Array)) {
      if (source.buffer.byteLength == source.byteLength) {
        return new Uint8Array(source.buffer);
      } else {
        return new Uint8Array(
            source.buffer, source.byteOffset, source.byteLength);
      }
    } else {
      return source;
    }
  };

  /**
   * Wraps the ANGLEInstancedArrays extension object.
   * @param {!WebGLRenderingContext} ctx Target context.
   * @param {!Object} proto Prototype object.
   */
  function wrapInstancedArraysExtension(ctx, proto) {
    /**
     * @param {string} signature Event signature.
     * @param {Function=} opt_generator Generator function.
     */
    function wrapInstancedArraysMethod(signature, opt_generator) {
      wrapMethod(
          proto, 'ANGLEInstancedArrays',
          signature, opt_generator);
    };

    wrapInstancedArraysMethod(
        'drawArraysInstancedANGLE(uint32 mode, uint32 first, int32 count, ' +
            'int32 primcount)',
        function(fn, eventType) {
          return function drawArraysInstancedANGLE() {
            setCurrentContext(ctx);
            var scope = eventType.apply(this, arguments);
            return leaveScope(scope, fn.apply(this, arguments));
          };
        });
    wrapInstancedArraysMethod(
        'drawElementsInstancedANGLE(uint32 mode, int32 count, uint32 type, ' +
            'uint32 offset, int32 primcount)',
        function(fn, eventType) {
          return function drawElementsInstancedANGLE() {
            setCurrentContext(ctx);
            var scope = eventType.apply(this, arguments);
            return leaveScope(scope, fn.apply(this, arguments));
          };
        });
    wrapInstancedArraysMethod(
        'vertexAttribDivisorANGLE(uint32 index, uint32 divisor)',
        function(fn, eventType) {
          return function vertexAttribDivisorANGLE() {
            setCurrentContext(ctx);
            var scope = eventType.apply(this, arguments);
            return leaveScope(scope, fn.apply(this, arguments));
          };
        });
  };

  /**
   * Wraps the OESVertexArrayObject extension object.
   * @param {!WebGLRenderingContext} ctx Target context.
   * @param {!Object} proto Prototype object.
   */
  function wrapVertexArrayObjectExtension(ctx, proto) {
    /**
     * @param {string} signature Event signature.
     * @param {Function=} opt_generator Generator function.
     */
    function wrapVertexArrayObjectMethod(signature, opt_generator) {
      wrapMethod(
          proto, 'OESVertexArrayObject',
          signature, opt_generator);
    };

    // http://www.khronos.org/registry/webgl/extensions/OES_vertex_array_object/

    wrapVertexArrayObjectMethod(
        'createVertexArrayOES(uint32 arrayObject)',
        function(fn, eventType) {
          return function createVertexArrayOES() {
            setCurrentContext(ctx);
            var id = provider.nextObjectId_++;
            leaveScope(eventType(id));
            var obj = fn.apply(this, arguments);
            if (obj) {
              setHandle(obj, id);
            }
            return obj;
          };
        });
    wrapVertexArrayObjectMethod(
        'deleteVertexArrayOES(uint32 arrayObject)',
        function(fn, eventType) {
          return function deleteVertexArrayOES(arrayObject) {
            setCurrentContext(ctx);
            var scope = eventType(getHandle(arrayObject));
            return leaveScope(scope, fn.apply(this, arguments));
          };
        });
    wrapVertexArrayObjectMethod(
        'isVertexArrayOES(uint32 arrayObject)',
        function(fn, eventType) {
          return function isVertexArrayOES(arrayObject) {
            setCurrentContext(ctx);
            var scope = eventType(getHandle(arrayObject));
            return leaveScope(scope, fn.apply(this, arguments));
          };
        });
    wrapVertexArrayObjectMethod(
        'bindVertexArrayOES(uint32 arrayObject)',
        function(fn, eventType) {
          return function bindVertexArrayOES(arrayObject) {
            setCurrentContext(ctx);
            var scope = eventType(getHandle(arrayObject));
            return leaveScope(scope, fn.apply(this, arguments));
          };
        });
  };

  /**
   * Wraps the WebGLLoseContext extension object.
   * @param {!WebGLRenderingContext} ctx Target context.
   * @param {!Object} proto Prototype object.
   */
  function wrapLoseContextExtension(ctx, proto) {
    /**
     * @param {string} signature Event signature.
     * @param {Function=} opt_generator Generator function.
     */
    function wrapLoseContextMethod(signature, opt_generator) {
      wrapMethod(
          proto, 'WebGLLoseContext',
          signature, opt_generator);
    };

    // http://www.khronos.org/registry/webgl/extensions/WEBGL_lose_context/

    wrapLoseContextMethod(
        'loseContext()',
        function(fn, eventType) {
          return function loseContext() {
            setCurrentContext(ctx);
            var scope = eventType.apply(this, arguments);
            return leaveScope(scope, fn.apply(this, arguments));
          };
        });
    wrapLoseContextMethod(
        'restoreContext()',
        function(fn, eventType) {
          return function restoreContext() {
            setCurrentContext(ctx);
            var scope = eventType.apply(this, arguments);
            return leaveScope(scope, fn.apply(this, arguments));
          };
        });
  };

  /**
   * Wraps an extension object.
   * This should be called for each extension object as it is returned from
   * getExtension so that its prototype can be instrumented, as required.
   * @param {!WebGLRenderingContext} ctx Target context.
   * @param {string} name Extension name.
   * @param {!Object} object Extension object.
   * @return {boolean} True if the extension is supported.
   */
  function instrumentExtensionObject(ctx, name, object) {
    var proto = object.constructor.prototype;

    // We do this check only for known extensions, as Firefox will return a
    // generic 'Object' for others and that will break everything.
    function checkInstrumented() {
      if (proto['__gl_wrapped__']) {
        return false;
      }
      Object.defineProperty(proto, '__gl_wrapped__', {
        'configurable': true,
        'enumerable': false,
        'value': true
      });
      contextRestoreFns.push(function() {
        delete proto['__gl_wrapped__'];
      });
      return true;
    };

    switch (name) {
      case 'ANGLE_instanced_arrays':
        if (checkInstrumented()) {
          wrapInstancedArraysExtension(ctx, proto);
        }
        return true;
      case 'OES_vertex_array_object':
        if (checkInstrumented()) {
          wrapVertexArrayObjectExtension(ctx, proto);
        }
        return true;
      case 'WEBGL_lose_context':
        if (checkInstrumented()) {
          wrapLoseContextExtension(ctx, proto);
        }
        return true;
      case 'WEBGL_draw_buffers':
        // http://www.khronos.org/registry/webgl/extensions/WEBGL_draw_buffers/
      case 'WEBGL_security_sensitive_resources':
        // http://www.khronos.org/registry/webgl/extensions/WEBGL_security_sensitive_resources/
      case 'WEBGL_shared_resources':
        // http://www.khronos.org/registry/webgl/extensions/WEBGL_shared_resources/
        // Don't support these yet, so report them as not present.
        return false;
      default:
        return true;
    }
  };

  wrapContextMethod(
      'getContextAttributes()');
  wrapContextMethod(
      'isContextLost()');
  wrapContextMethod(
      'getSupportedExtensions()',
      function(fn, eventType) {
        return function getSupportedExtensions(name) {
          setCurrentContext(this);
          var scope = eventType();
          var result = fn.apply(this, arguments);
          wtf.trace.appendScopeData('result', result);
          return leaveScope(scope, result);
        };
      });
  wrapContextMethod(
      'getExtension(ascii name, bool result)',
      function(fn, eventType) {
        return function getExtension(name) {
          setCurrentContext(this);
          var scope = eventType(name, true);
          var result = fn.apply(this, arguments);
          if (!result) {
            wtf.trace.appendScopeData('result', false);
          } else {
            // Always check to see if we need to instrument this object.
            if (!instrumentExtensionObject(this, name, result)) {
              return null;
            }
          }
          return leaveScope(scope, result);
        };
      });
  wrapContextMethod(
      'activeTexture(uint32 texture)');
  wrapContextMethod(
      'attachShader(uint32 program, uint32 shader)',
      function(fn, eventType) {
        return function attachShader(program, shader) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program), getHandle(shader));
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'bindAttribLocation(uint32 program, uint32 index, utf8 name)',
      function(fn, eventType) {
        return function bindAttribLocation(program, index, name) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program), index, name);
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'bindBuffer(uint32 target, uint32 buffer)',
      function(fn, eventType) {
        return function bindBuffer(target, buffer) {
          setCurrentContext(this);
          var scope = eventType(target, getHandle(buffer));
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'bindFramebuffer(uint32 target, uint32 framebuffer)',
      function(fn, eventType) {
        return function bindFramebuffer(target, framebuffer) {
          setCurrentContext(this);
          var scope = eventType(target, getHandle(framebuffer));
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'bindRenderbuffer(uint32 target, uint32 renderbuffer)',
      function(fn, eventType) {
        return function bindRenderbuffer(target, renderbuffer) {
          setCurrentContext(this);
          var scope = eventType(target, getHandle(renderbuffer));
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'bindTexture(uint32 target, uint32 texture)',
      function(fn, eventType) {
        return function bindTexture(target, texture) {
          setCurrentContext(this);
          var scope = eventType(target, getHandle(texture));
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'blendColor(float red, float green, float blue, float alpha)');
  wrapContextMethod(
      'blendEquation(uint32 mode)');
  wrapContextMethod(
      'blendEquationSeparate(uint32 modeRGB, uint32 modeAlpha)');
  wrapContextMethod(
      'blendFunc(uint32 sfactor, uint32 dfactor)');
  wrapContextMethod(
      'blendFuncSeparate(uint32 srcRGB, uint32 dstRGB, uint32 srcAlpha, ' +
          'uint32 dstAlpha)');
  wrapContextMethod(
      'bufferData(uint32 target, uint32 size, uint32 usage, uint8[] data)',
      function(fn, eventType) {
        return function bufferData(target, data, usage) {
          setCurrentContext(this);
          if (typeof data == 'number') {
            var scope = eventType(target, data, usage, []);
            return leaveScope(scope, fn.apply(this, arguments));
          } else {
            var dataLength = data.byteLength;
            if (replayable) {
              if (data instanceof ArrayBuffer) {
                data = new Uint8Array(data);
              } else if (!(data instanceof Uint8Array)) {
                data = new Uint8Array(data.buffer);
              }
            } else {
              data = [];
            }
            var scope = eventType(target, dataLength, usage, data);
            return leaveScope(scope, fn.apply(this, arguments));
          }
        };
      });
  wrapContextMethod(
      'bufferSubData(uint32 target, uint32 offset, uint8[] data)',
      function(fn, eventType) {
        return function bufferSubData(target, offset, data) {
          setCurrentContext(this);
          if (replayable) {
            if (data instanceof ArrayBuffer) {
              data = new Uint8Array(data);
            } else if (!(data instanceof Uint8Array)) {
              data = new Uint8Array(data.buffer);
            }
          } else {
            data = [];
          }
          var scope = eventType(target, offset, data);
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'checkFramebufferStatus(uint32 target)');
  wrapContextMethod(
      'clear(uint32 mask)');
  wrapContextMethod(
      'clearColor(float red, float green, float blue, float alpha)');
  wrapContextMethod(
      'clearDepth(float depth)');
  wrapContextMethod(
      'clearStencil(int32 s)');
  wrapContextMethod(
      'colorMask(uint8 red, uint8 green, uint8 blue, uint8 alpha)');
  wrapContextMethod(
      'compileShader(uint32 shader)',
      function(fn, eventType) {
        return function compileShader(shader) {
          setCurrentContext(this);
          var scope = eventType(getHandle(shader));
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'compressedTexImage2D(uint32 target, int32 level, ' +
          'uint32 internalformat, int32 width, int32 height, int32 border, ' +
          'uint8[] data)',
      function(fn, eventType) {
        return function compressedTexImage2D() {
          setCurrentContext(this);
          var scope = eventType(
              arguments[0], arguments[1], arguments[2], arguments[3],
              arguments[4], arguments[5],
              replayable ? coercePixelTypeToUint8(arguments[6]) : null);
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'compressedTexSubImage2D(uint32 target, int32 level, int32 xoffset, ' +
          'int32 yoffset, int32 width, int32 height, uint32 format, ' +
          'uint8[] data)',
      function(fn, eventType) {
        return function compressedTexSubImage2D() {
          setCurrentContext(this);
          var scope = eventType(
              arguments[0], arguments[1], arguments[2], arguments[3],
              arguments[4], arguments[5], arguments[6],
              replayable ? coercePixelTypeToUint8(arguments[7]) : null);
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'copyTexImage2D(uint32 target, int32 level, uint32 internalformat, ' +
          'int32 x, int32 y, int32 width, int32 height, int32 border)');
  wrapContextMethod(
      'copyTexSubImage2D(uint32 target, int32 level, int32 xoffset, ' +
          'int32 yoffset, int32 x, int32 y, int32 width, int32 height)');
  /**
   * @param {string} name Method name, like 'createProgram'.
   * @param {string} typeName Type name, like 'program'.
   * @param {string=} opt_arg Argument.
   */
  function wrapCreateMethod(name, typeName, opt_arg) {
    var signature =
        name + '(' + (opt_arg ? opt_arg + ', ' : '') +
        'uint32 ' + typeName + ')';
    wrapContextMethod(signature, function(fn, eventType) {
      return function(arg) {
        setCurrentContext(this);
        var id = provider.nextObjectId_++;
        if (opt_arg) {
          leaveScope(eventType(arg, id));
        } else {
          leaveScope(eventType(id));
        }
        var obj = fn.apply(this, arguments);
        if (obj) {
          setHandle(obj, id);
        }
        return obj;
      };
    });
  };
  wrapCreateMethod(
      'createBuffer', 'buffer');
  wrapCreateMethod(
      'createFramebuffer', 'framebuffer');
  wrapCreateMethod(
      'createProgram', 'program');
  wrapCreateMethod(
      'createRenderbuffer', 'renderbuffer');
  wrapCreateMethod(
      'createShader', 'shader', 'uint32 type');
  wrapCreateMethod(
      'createTexture', 'texture');
  wrapContextMethod(
      'cullFace(uint32 mode)');
  function wrapDeleteMethod(name, typeName) {
    var signature = name + '(uint32 ' + typeName + ')';
    wrapContextMethod(signature, function(fn, eventType) {
      return function(value) {
        setCurrentContext(this);
        var scope = eventType(getHandle(value));
        return leaveScope(scope, fn.apply(this, arguments));
      };
    });
  };
  wrapDeleteMethod(
      'deleteBuffer', 'buffer');
  wrapDeleteMethod(
      'deleteFramebuffer', 'framebuffer');
  wrapDeleteMethod(
      'deleteProgram', 'program');
  wrapDeleteMethod(
      'deleteRenderbuffer', 'renderbuffer');
  wrapDeleteMethod(
      'deleteShader', 'shader');
  wrapDeleteMethod(
      'deleteTexture', 'texture');
  wrapContextMethod(
      'depthFunc(uint32 func)');
  wrapContextMethod(
      'depthMask(uint8 flag)');
  wrapContextMethod(
      'depthRange(float zNear, float zFar)');
  wrapContextMethod(
      'detachShader(uint32 program, uint32 shader)',
      function(fn, eventType) {
        return function detachShader(program, shader) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program), getHandle(shader));
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'disable(uint32 cap)');
  wrapContextMethod(
      'disableVertexAttribArray(uint8 index)');
  wrapContextMethod(
      'drawArrays(uint32 mode, uint32 first, int32 count)');
  wrapContextMethod(
      'drawElements(uint32 mode, int32 count, uint32 type, uint32 offset)');
  wrapContextMethod(
      'enable(uint32 cap)');
  wrapContextMethod(
      'enableVertexAttribArray(uint8 index)');
  wrapContextMethod(
      'finish()');
  wrapContextMethod(
      'flush()');
  wrapContextMethod(
      'framebufferRenderbuffer(uint32 target, uint32 attachment, ' +
          'uint32 renderbuffertarget, uint32 renderbuffer)',
      function(fn, eventType) {
        return function framebufferRenderbuffer(
            target, attachment, renderbuffertarget, renderbuffer) {
          setCurrentContext(this);
          var scope = eventType(
              target, attachment, renderbuffertarget, getHandle(renderbuffer));
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'framebufferTexture2D(uint32 target, uint32 attachment, ' +
          'uint32 textarget, uint32 texture, int32 level)',
      function(fn, eventType) {
        return function framebufferTexture2D(
            target, attachment, textarget, texture, level) {
          setCurrentContext(this);
          var scope = eventType(
              target, attachment, textarget, getHandle(texture), level);
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'frontFace(uint32 mode)');
  wrapContextMethod(
      'generateMipmap(uint32 target)');
  wrapContextMethod(
      'getActiveAttrib(uint32 program, uint32 index)',
      function(fn, eventType) {
        return function getActiveAttrib(program, index) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program), index);
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'getActiveUniform(uint32 program, uint32 index)',
      function(fn, eventType) {
        return function getActiveUniform(program, index) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program), index);
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'getAttachedShaders(uint32 program)',
      function(fn, eventType) {
        return function getAttachedShaders(program) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program));
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'getAttribLocation(uint32 program, utf8 name)',
      function(fn, eventType) {
        return function getAttribLocation(program, name) {
          setCurrentContext(this);
          // TODO(benvanik): record result and build mapping table
          var scope = eventType(getHandle(program), name);
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'getBufferParameter(uint32 target, uint32 pname)');
  wrapContextMethod(
      'getParameter(uint32 pname)');
  wrapContextMethod(
      'getError()');
  wrapContextMethod(
      'getFramebufferAttachmentParameter(uint32 target, uint32 attachment, ' +
          'uint32 pname)');
  wrapContextMethod(
      'getProgramParameter(uint32 program, uint32 pname)',
      function(fn, eventType) {
        return function getProgramParameter(program, pname) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program), pname);
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'getProgramInfoLog(uint32 program)',
      function(fn, eventType) {
        return function getProgramInfoLog(program) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program));
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'getRenderbufferParameter(uint32 target, uint32 pname)');
  wrapContextMethod(
      'getShaderParameter(uint32 shader, uint32 pname)',
      function(fn, eventType) {
        return function getShaderParameter(shader, pname) {
          setCurrentContext(this);
          var scope = eventType(getHandle(shader), pname);
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'getShaderPrecisionFormat(uint32 shadertype, uint32 precisiontype)');
  wrapContextMethod(
      'getShaderInfoLog(uint32 shader)',
      function(fn, eventType) {
        return function getShaderInfoLog(shader) {
          setCurrentContext(this);
          var scope = eventType(getHandle(shader));
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'getShaderSource(uint32 shader)',
      function(fn, eventType) {
        return function getShaderSource(shader) {
          setCurrentContext(this);
          var scope = eventType(getHandle(shader));
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'getTexParameter(uint32 target, uint32 pname)');
  wrapContextMethod(
      'getUniform(uint32 program, uint32 location)',
      function(fn, eventType) {
        return function getUniform(program, location) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program), getHandle(location));
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'getUniformLocation(uint32 program, utf8 name, uint32 value)',
      function(fn, eventType) {
        return function getUniformLocation(program, name) {
          setCurrentContext(this);
          // TODO(benvanik): better tracking mechanism/string table/etc, as an
          //     app calling this each frame will quickly eat up IDs
          var id = provider.nextObjectId_++;
          var scope = eventType(getHandle(program), name, id);
          var obj = fn.apply(this, arguments);
          if (obj) {
            setHandle(obj, id);
          }
          return leaveScope(scope, obj);
        };
      });
  wrapContextMethod(
      'getVertexAttrib(uint32 index, uint32 pname)');
  wrapContextMethod(
      'getVertexAttribOffset(uint32 index, uint32 pname)');
  wrapContextMethod(
      'hint(uint32 target, uint32 mode)');
  wrapContextMethod(
      'isEnabled(uint32 cap)');
  function wrapIsMethod(name) {
    var signature = name + '(uint32 type)';
    wrapContextMethod(signature, function(fn, eventType) {
      return function(value) {
        setCurrentContext(this);
        var scope = eventType(getHandle(value));
        return leaveScope(scope, fn.apply(this, arguments));
      };
    });
  };
  wrapIsMethod('isBuffer');
  wrapIsMethod('isFramebuffer');
  wrapIsMethod('isProgram');
  wrapIsMethod('isRenderbuffer');
  wrapIsMethod('isShader');
  wrapIsMethod('isTexture');
  wrapContextMethod(
      'lineWidth(float width)');
  wrapContextMethod(
      'linkProgram(uint32 program)',
      function(fn, eventType) {
        return function linkProgram(program) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program));
          var linkProgramResults = fn.apply(this, arguments);

          // Collect the attributes upon linking the program if applicable.
          if (replayable) {
            var traceScope = wtf.trace.enterTracingScope();

            // A mapping from attribute names to locations.
            var currentAttributes = {};

            var activeAttributesCount = this.getProgramParameter['raw'].call(
                this, program, goog.webgl.ACTIVE_ATTRIBUTES);

            for (var i = 0, j = 0; j < activeAttributesCount; ++i) {
              var attributeInfo = this.getActiveAttrib['raw'].call(
                  this, program, i);
              if (attributeInfo) {
                var attributeName = attributeInfo.name;
                var attributeLocation = this.getAttribLocation['raw'].call(
                    this, program, attributeName);
                currentAttributes[attributeName] = attributeLocation;
                ++j;
              }
            }

            leaveScope(traceScope);
            wtf.trace.appendScopeData('attributes', currentAttributes);
          }

          return leaveScope(scope, linkProgramResults);
        };
      });
  wrapContextMethod(
      'pixelStorei(uint32 pname, int32 param)');
  wrapContextMethod(
      'polygonOffset(float factor, float units)');
  wrapContextMethod(
      'readPixels(int32 x, int32 y, int32 width, int32 height, ' +
          'uint32 format, uint32 type, uint32 size)',
      function(fn, eventType) {
        return function readPixels(x, y, width, height, format, type, pixels) {
          setCurrentContext(this);
          var size = pixels.byteLength;
          var scope = eventType(x, y, width, height, format, type, size);
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'renderbufferStorage(uint32 target, uint32 internalformat, ' +
          'int32 width, int32 height)');
  wrapContextMethod(
      'sampleCoverage(float value, uint8 invert)');
  wrapContextMethod(
      'scissor(int32 x, int32 y, int32 width, int32 height)');
  wrapContextMethod(
      'shaderSource(uint32 shader, utf8 source)',
      function(fn, eventType) {
        return function shaderSource(shader, source) {
          setCurrentContext(this);
          var scope = eventType(getHandle(shader), source);
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'stencilFunc(uint32 func, int32 ref, uint32 mask)');
  wrapContextMethod(
      'stencilFuncSeparate(uint32 face, uint32 func, int32 ref, uint32 mask)');
  wrapContextMethod(
      'stencilMask(uint32 mask)');
  wrapContextMethod(
      'stencilMaskSeparate(uint32 face, uint32 mask)');
  wrapContextMethod(
      'stencilOp(uint32 fail, uint32 zfail, uint32 zpass)');
  wrapContextMethod(
      'stencilOpSeparate(uint32 face, uint32 fail, uint32 zfail, ' +
          'uint32 zpass)');
  wrapContextMethod(
      'texImage2D(uint32 target, int32 level, uint32 internalformat, ' +
          'int32 width, int32 height, int32 border, uint32 format, ' +
          'uint32 type, uint8[] pixels, ascii dataType)',
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
                  replayable ? coercePixelTypeToUint8(arguments[8]) : null,
                  replayable ? 'pixels' : 'ignored');
            } else {
              scope = eventType(
                  target, level, internalformat, arguments[3], arguments[4],
                  arguments[5], arguments[6], arguments[7], null,
                  'null');
            }
          } else {
            // DOM element variant.
            var imageData = null;
            if (replayable) {
              var traceScope = wtf.trace.enterTracingScope();
              imageData = wtf.trace.providers.WebGLProvider.extractImageData(
                  arguments[5], internalformat, embedRemoteImages);
              leaveScope(traceScope);
            }
            scope = eventType(
                target,
                level,
                internalformat,
                arguments[5].width, arguments[5].height,
                0,
                arguments[3],
                arguments[4],
                imageData ? imageData.pixels : null,
                imageData ? imageData.dataType : 'ignored');
          }
          try {
            fn.apply(this, arguments);
          } finally {
            leaveScope(scope);
          }
        };
      });
  wrapContextMethod(
      'texParameterf(uint32 target, uint32 pname, float param)');
  wrapContextMethod(
      'texParameteri(uint32 target, uint32 pname, int32 param)');
  wrapContextMethod(
      'texSubImage2D(uint32 target, int32 level, int32 xoffset, ' +
          'int32 yoffset, int32 width, int32 height, uint32 format, ' +
          'uint32 type, uint8[] pixels, ascii dataType)',
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
                  replayable ? coercePixelTypeToUint8(arguments[8]) : null,
                  replayable ? 'pixels' : 'ignored');
            } else {
              scope = eventType(
                  target, level, xoffset, yoffset, arguments[4], arguments[5],
                  arguments[6], arguments[7], null,
                  'null');
            }
          } else {
            // DOM element variant.
            var imageData = null;
            if (replayable) {
              var traceScope = wtf.trace.enterTracingScope();
              imageData = wtf.trace.providers.WebGLProvider.extractImageData(
                  arguments[6], arguments[4], embedRemoteImages);
              leaveScope(traceScope);
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
            leaveScope(scope);
          }
        };
      });
  function wrapUniformMethod(name, type, count) {
    var signature = name + '(uint32 location';
    var names = ['x', 'y', 'z', 'w'];
    for (var n = 0; n < count; n++) {
      signature += ', ' + type + ' ' + names[n];
    }
    signature += ')';
    switch (count) {
      case 1:
        wrapContextMethod(signature, function(fn, eventType) {
          return function(location, x) {
            setCurrentContext(this);
            var scope = eventType(getHandle(location), x);
            return leaveScope(scope, fn.apply(this, arguments));
          };
        });
        break;
      case 2:
        wrapContextMethod(signature, function(fn, eventType) {
          return function(location, x, y) {
            setCurrentContext(this);
            var scope = eventType(getHandle(location), x, y);
            return leaveScope(scope, fn.apply(this, arguments));
          };
        });
        break;
      case 3:
        wrapContextMethod(signature, function(fn, eventType) {
          return function(location, x, y, z) {
            setCurrentContext(this);
            var scope = eventType(getHandle(location), x, y, z);
            return leaveScope(scope, fn.apply(this, arguments));
          };
        });
        break;
      case 4:
        wrapContextMethod(signature, function(fn, eventType) {
          return function(location, x, y, z, w) {
            setCurrentContext(this);
            var scope = eventType(getHandle(location), x, y, z, w);
            return leaveScope(scope, fn.apply(this, arguments));
          };
        });
        break;
    }
  };
  function wrapUniformArrayMethod(name, type, count) {
    var signature = name + '(uint32 location, ' + type + '[] v)';
    wrapContextMethod(signature, function(fn, eventType) {
      return function(location, v) {
        setCurrentContext(this);
        var scope = eventType(getHandle(location), v);
        return leaveScope(scope, fn.apply(this, arguments));
      };
    });
  };
  function wrapUniformMatrixMethod(name, type, count) {
    var signature =
        name + '(uint32 location, uint8 transpose, ' + type + '[] value)';
    wrapContextMethod(signature, function(fn, eventType) {
      return function(location, transpose, v) {
        setCurrentContext(this);
        var scope = eventType(getHandle(location), transpose, v);
        return leaveScope(scope, fn.apply(this, arguments));
      };
    });
  };
  wrapUniformMethod(
      'uniform1f', 'float', 1);
  wrapUniformMethod(
      'uniform1i', 'int32', 1);
  wrapUniformMethod(
      'uniform2f', 'float', 2);
  wrapUniformMethod(
      'uniform2i', 'int32', 2);
  wrapUniformMethod(
      'uniform3f', 'float', 3);
  wrapUniformMethod(
      'uniform3i', 'int32', 3);
  wrapUniformMethod(
      'uniform4f', 'float', 4);
  wrapUniformMethod(
      'uniform4i', 'int32', 4);
  wrapUniformArrayMethod(
      'uniform1fv', 'float', 1);
  wrapUniformArrayMethod(
      'uniform1iv', 'int32', 1);
  wrapUniformArrayMethod(
      'uniform2fv', 'float', 2);
  wrapUniformArrayMethod(
      'uniform2iv', 'int32', 2);
  wrapUniformArrayMethod(
      'uniform3fv', 'float', 3);
  wrapUniformArrayMethod(
      'uniform3iv', 'int32', 3);
  wrapUniformArrayMethod(
      'uniform4fv', 'float', 4);
  wrapUniformArrayMethod(
      'uniform4iv', 'int32', 4);
  wrapUniformMatrixMethod(
      'uniformMatrix2fv', 'float', 4);
  wrapUniformMatrixMethod(
      'uniformMatrix3fv', 'float', 9);
  wrapUniformMatrixMethod(
      'uniformMatrix4fv', 'float', 16);
  wrapContextMethod(
      'useProgram(uint32 program)',
      function(fn, eventType) {
        return function useProgram(program) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program));
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'validateProgram(uint32 program)',
      function(fn, eventType) {
        return function validateProgram(program) {
          setCurrentContext(this);
          var scope = eventType(getHandle(program));
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'vertexAttrib1f(uint8 indx, float x)');
  wrapContextMethod(
      'vertexAttrib1fv(uint8 indx, float x)',
      function(fn, eventType) {
        return function vertexAttrib4fv(indx, values) {
          setCurrentContext(this);
          var scope = eventType(indx, values[0]);
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'vertexAttrib2f(uint8 indx, float x, float y)');
  wrapContextMethod(
      'vertexAttrib2fv(uint8 indx, float x, float y)',
      function(fn, eventType) {
        return function vertexAttrib4fv(indx, values) {
          setCurrentContext(this);
          var scope = eventType(indx, values[0], values[1]);
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'vertexAttrib3f(uint8 indx, float x, float y, float z)');
  wrapContextMethod(
      'vertexAttrib3fv(uint8 indx, float x, float y, float z)',
      function(fn, eventType) {
        return function vertexAttrib3fv(indx, values) {
          setCurrentContext(this);
          var scope = eventType(indx, values[0], values[1], values[2]);
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'vertexAttrib4f(uint8 indx, float x, float y, float z, float w)');
  wrapContextMethod(
      'vertexAttrib4fv(uint8 indx, float x, float y, float z, float w)',
      function(fn, eventType) {
        return function vertexAttrib4fv(indx, values) {
          setCurrentContext(this);
          var scope = eventType(
              indx, values[0], values[1], values[2], values[3]);
          return leaveScope(scope, fn.apply(this, arguments));
        };
      });
  wrapContextMethod(
      'vertexAttribPointer(uint8 indx, int32 size, uint32 type, ' +
          'uint8 normalized, int32 stride, uint32 offset)');
  wrapContextMethod(
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
 * @param {number} value Handle value.
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
  return new Uint8Array(imageData.data.buffer);
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
    if (el.src.indexOf('data:') == 0) {
      // Drop this string right out for playback.
      return {
        pixels: [],
        dataType: el.src
      };
    } else if (embedRemoteImages) {
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
    return {
      pixels: pixels,
      dataType: 'canvas'
    };
  } else if (el instanceof ImageData) {
    var pixels = wtf.trace.providers.WebGLProvider.getPixelsFromImageData(
        width, height, internalformat, el);
    return {
      pixels: pixels,
      dataType: 'canvas'
    };
  } else {
    // Canvas/video/etc need to be encoded as pixels.
    var key = width + 'x' + height;
    var canvas = canvasCache[key];
    var needsClear = !!canvas;
    if (!canvas) {
      canvas = goog.dom.createElement(goog.dom.TagName.CANVAS);
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
      dataType: 'canvas'
    };
  }
};
