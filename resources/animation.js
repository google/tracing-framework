/**
 * Written by Ben Vanik.
 * https://twitter.com/benvanik
 *
 * This is a heavily modified version of Benjamin James Wright's
 * anim_encoder utility. I've hacked it to be much more flexible, easier to
 * integrate on pages, and support more features (like mouse cursors).
 * Original: http://www.sublimetext.com/~jps/animated_gifs_the_hard_way.html
 */


/**
 * The DOM should contain:
 * <animation src="foo" timescale="1.0" repeatdelay="3"></animation>
 *
 *
 * Data files should add an object to the global 'animationData' object, keyed
 * by the same name used in 'src'. This object should be:
 * animationData['myanim'] = {
 *   'width': 640,
 *   'height': 480,
 *   'meta': [per frame metadata],
 *   'timeline': [timeline data],
 * };
 */


(function(global) {
var document = global.document;


/**
 * @define {boolean} Whether to enable canvas support.
 */
var ENABLE_CANVAS = false;


// TODO(benvanik): cursor at 2x res.
/**
 * Base64 encoded cursor data.
 * @type {string}
 * @private
 */
var CURSOR_DATA = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB90EFxYdFdAgO4IAAAEdSURBVFjD7ZY5C8JAFITjEVkPjHcUtNBCSO2/sLUQPBqxsbLz7+s8nJU1Bmw2uyIZ+FC0mGH2ekHwAyqBCqiSCn9zJjFt3il8b4HQZYga6Il5kiQ6RNtliDqYiHEcx15CNMBMTKMo8hLiFUAp5SXEKwA+vYR4C6BxGeKjAbMFFyE+9kDaXJNXiLdTIEgQ0zQtHt1ybgEy7oQrOIMtWOcagIY3fTMaIZZyYYEIKNsBpka9F7DKaGHG9a/ZfrCkzpgmezAHC3DKaKFNc+uPUYdrOwRd0JcgGS0MeAKsP8eKTdQZSDHMIbX7R/zf+kBSNtADiswFY7ADR7BhO2HgQCUatbgcI5o38tgD30a1kLWHPsa1QoUK/aeet3qhH9EDHmv9W3weQV4AAAAASUVORK5CYII=';


/**
 * Cursor hotspot offset.
 * @type {number}
 * @private
 */
var CURSOR_OFFSET = 2;


/**
 * Logs a value to the console, if it is present.
 * @param {*} value Value to log.
 */
function log(value) {
  if (global.console && global.console.log) {
    global.console.log(value);
  }
};


// goog.inherits
function inherits(childCtor, parentCtor) {
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  childCtor.prototype.constructor = childCtor;
};


/**
 * Makes an element unselectable.
 * @param {!Element} el DOM element.
 */
function makeUnselectable(el) {
  el.style.mozUserSelect = 'none';
  el.style.webkitUserSelect = 'none';
  el.style.msUserSelect = 'none';
  el.style.userSelect = 'none';
};


/**
 * Whether <canvas> is present and supported.
 * @type {boolean}
 */
var hasCanvasSupport = ENABLE_CANVAS && (function() {
  var el = document.createElement('canvas');
  return el && el.getContext;
})();



/**
 * @typedef {{
 *   timescale: number,
 *   repeatDelay: number
 * }}
 */
var AnimationOptions;



/**
 * Base animation type.
 * @param {!Element} el <animation> element.
 * @param {!AnimationOptions} options Options.
 * @param {!Object} data Animation data.
 * @param {string} imageSrc Image data source.
 * @constructor
 */
var Animation = function(el, options, data, imageSrc) {
  var self = this;

  /**
   * <animation> element.
   * @type {!Element}
   * @private
   */
  this.el_ = el;

  /**
   * Animation options.
   * @type {!AnimationOptions}
   * @private
   */
  this.options_ = options;

  /**
   * Animation data.
   * @type {!Object}
   * @private
   */
  this.data_ = data;

  /**
   * Image data element.
   * @type {!HTMLImageElement}
   * @private
   */
  this.imageEl_ = document.createElement('img');
  this.imageEl_.onload = function() {
    self.start();
  };
  this.imageEl_.src = imageSrc;

  var timeline = data['timeline'];
  var runTime = 0;
  for (var i = 0; i < timeline.length - 1; i++) {
    runTime += timeline[i]['delay'] * options.timescale;
  }

  /**
   * Element used to represent the cursor.
   * Added to the DOM on demand.
   * @type {!Element}
   * @private
   */
  this.cursorEl_ = document.createElement('img');
  this.cursorEl_.style.position = 'absolute';
  this.cursorEl_.style.width = '32px';
  this.cursorEl_.style.height = '32px';
  this.cursorEl_.style.cursor = 'crosshair';
  this.cursorEl_.style.zIndex = 1;
  this.cursorEl_.src = 'data:image/png;base64,' + CURSOR_DATA;
  makeUnselectable(this.cursorEl_);

  /**
   * Total run time of the animation, in seconds.
   * @type {number}
   * @private
   */
  this.runTime_ = runTime;

  /**
   * Current playback timer ID, if any.
   * @type {number|null}
   * @private
   */
  this.timerId_ = null;

  /**
   * Current frame in the timeline.
   * @type {number}
   * @private
   */
  this.currentFrame_ = 0;

  /**
   * this.step_ bound to this object.
   * @type {function()}
   * @private
   */
  this.boundStep_ = function() {
    self.step_();
  };

  // Style the <animation> object.
  el.style.position = 'relative';
  el.style.width = data['width'] + 'px';
  el.style.height = data['height'] + 'px';
  el.style.display = 'block';
  el.style.overflow = 'hidden';
  el.style.cursor = 'crosshair';
  makeUnselectable(el);
};


/**
 * @return {!Element} <animation> element.
 */
Animation.prototype.getElement = function() {
  return this.el_;
};


/**
 * @return {!HTMLImageElement} Image data element.
 */
Animation.prototype.getImageData = function() {
  return this.imageEl_;
};


/**
 * Starts the animation.
 * If the animation is playing it is reset from the beginning.
 */
Animation.prototype.start = function() {
  this.stop();
  this.step_();
};


/**
 * Stops the animation and resets to the beginning.
 */
Animation.prototype.stop = function() {
  this.currentFrame_ = 0;
  if (this.timerId_ !== null) {
    global.clearTimeout(this.timerId_);
    this.timerId_ = null;
  }
  this.clear();
};


/**
 * Advances the animation one frame.
 * @private
 */
Animation.prototype.step_ = function() {
  var timeline = this.data_['timeline'];
  var frame = this.currentFrame_++;
  var timelineData = timeline[frame];
  var delay = timelineData['delay'] / this.options_.timescale;
  var blits = timelineData['blit'];

  // Clear on first frame.
  if (frame == 0) {
    this.clear();
  }

  // Process blits.
  this.drawBlits(blits);

  // Handle repeats.
  if (frame + 1 >= timeline.length) {
    // The last frame.
    this.currentFrame_ = 0;

    // Delay repeat delay.
    delay = this.options_.repeatDelay;
  }

  // Move mouse cursor.
  this.animateCursor_(frame, delay);

  // Queue the next step.
  this.timerId_ = global.setTimeout(this.boundStep_, delay * 1000);
};


/**
 * Clears the target surface.
 * @protected
 */
Animation.prototype.clear = function() {
  log('clear not implemented');
};


/**
 * Draws a list of blits to the target surface.
 * @param {!Array.<!Array.<number>>} blits Blits.
 * @protected
 */
Animation.prototype.drawBlits = function(blits) {
  log('drawBlits not implemented');
};


/**
 * Schedules a cursor animation.
 * We schedule an animation to move it to the location requested in the next
 * frame. If we are the first frame, we set it to the desired position
 * immediately.
 * @param {number} frame Current frame number.
 * @param {number} duration Duration of animation, in seconds.
 * @private
 */
Animation.prototype.animateCursor_ = function(frame, duration) {
  var style = this.cursorEl_.style;

  var metadata = this.data_['meta'];
  if (!metadata || !metadata.length) {
    return;
  }
  if (frame + 1 >= metadata.length) {
    return;
  }

  function getPositionData(frame) {
    var pos = metadata[frame].split(',');
    return [parseFloat(pos[0]), parseFloat(pos[1])];
  };

  var prefixes = ['webkit', 'moz', 'ms', 'o'];
  function setTransition(duration) {
    for (var n = 0; n < prefixes.length; n++) {
      style[prefixes + 'TransitionProperty'] = 'left, top';
      style[prefixes + 'TransitionDuration'] = duration + 's';
    }
    style.transitionProperty = 'left, top';
    style.transitionDuration = duration + 's';
  };
  function moveTo(pos) {
    setTransition(0);
    style.left = (CURSOR_OFFSET + pos[0]) + 'px';
    style.top = (CURSOR_OFFSET + pos[1]) + 'px';
  };
  function animateTo(pos, duration) {
    setTransition(duration);
    style.left = (CURSOR_OFFSET + pos[0]) + 'px';
    style.top = (CURSOR_OFFSET + pos[1]) + 'px';
  };

  // On the first frame immediately move to position.
  if (frame == 0) {
    var initialPosition = getPositionData(0);
    moveTo(initialPosition);
  }

  // Schedule the animation.
  var targetPosition = getPositionData(frame);
  animateTo(targetPosition, duration);

  // Add to the DOM, if needed.
  if (!this.cursorEl_.parentNode) {
    this.el_.appendChild(this.cursorEl_);
  }
};



/**
 * An animation running with <canvas>.
 * This assumes canvas support has already been checked.
 * @param {!Element} el <animation> element.
 * @param {!AnimationOptions} options Options.
 * @param {!Object} data Animation data.
 * @param {string} imageSrc Image data source.
 * @constructor
 * @extends {Animation}
 */
var CanvasAnimation = function(el, options, data, imageSrc) {
  Animation.call(this, el, options, data, imageSrc);

  /**
   * <canvas> element.
   * @type {!HTMLCanvasElement}
   * @private
   */
  this.canvasEl_ = document.createElement('canvas');

  /**
   * 2D rendering context.
   * @type {!CanvasRenderingContext2D}
   * @private
   */
  this.ctx_ = this.canvasEl_.getContext('2d');

  this.canvasEl_.width = data['width'];
  this.canvasEl_.height = data['height'];
  this.canvasEl_.style.position = 'relative';
  this.canvasEl_.style.width = data['width'] + 'px';
  this.canvasEl_.style.height = data['height'] + 'px';
  makeUnselectable(this.canvasEl_);
  el.appendChild(this.canvasEl_);
};
inherits(CanvasAnimation, Animation);


/**
 * @override
 */
CanvasAnimation.prototype.clear = function() {
  var ctx = this.ctx_;
  ctx.clearRect(0, 0, this.canvasEl_.width, this.canvasEl_.height);
};


/**
 * @override
 */
CanvasAnimation.prototype.drawBlits = function(blits) {
  var ctx = this.ctx_;
  var img = this.getImageData();
  for (var n = 0; n < blits.length; n++) {
    var blit = blits[n];
    var sx = blit[0];
    var sy = blit[1];
    var w = blit[2];
    var h = blit[3];
    var dx = blit[4];
    var dy = blit[5];
    ctx.drawImage(img, sx, sy, w, h, dx, dy, w, h);
  }
};



/**
 * An animation running with HTML fallback.
 * This assumes canvas support has already been checked.
 * @param {!Element} el <animation> element.
 * @param {!AnimationOptions} options Options.
 * @param {!Object} data Animation data.
 * @param {string} imageSrc Image data source.
 * @constructor
 * @extends {Animation}
 */
var FallbackAnimation = function(el, options, data, imageSrc) {
  Animation.call(this, el, options, data, imageSrc);

  /**
   * Image source URL.
   * @type {string}
   * @private
   */
  this.imageSrc_ = imageSrc;

  /**
   * A pool of <div>s ready to be used.
   * @type {!Array.<!HTMLDivElement>}
   * @private
   */
  this.freePool_ = [];

  /**
   * A pool of <div>s currently in use by the last blit.
   * @type {!Array.<!HTMLDivElement>}
   * @private
   */
  this.usedPool_ = [];
};
inherits(FallbackAnimation, Animation);


/**
 * @override
 */
FallbackAnimation.prototype.clear = function() {
  var el = this.getElement();
  el.innerHTML = '';
  this.freePool_ = this.usedPool_;
  this.usedPool_ = [];
};


/**
 * @override
 */
FallbackAnimation.prototype.drawBlits = function(blits) {
  var el = this.getElement();

  // Setup the new divs.
  for (var n = 0; n < blits.length; n++) {
    var blit = blits[n];

    // Grab a div to use.
    // Try the free pool or create a new one.
    var div = null;
    if (this.freePool_.length) {
      div = this.freePool_.pop();
    }
    if (!div) {
      div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.backgroundImage = 'url("' + this.imageSrc_ + '")';
      makeUnselectable(div);
    }
    this.usedPool_.push(div);

    // Position.
    var sx = blit[0];
    var sy = blit[1];
    var w = blit[2];
    var h = blit[3];
    var dx = blit[4];
    var dy = blit[5];
    div.style.left = dx + 'px';
    div.style.top = dy + 'px';
    div.style.width = w + 'px';
    div.style.height = h + 'px';
    div.style.backgroundPosition = '-' + sx + 'px -' + sy + 'px';

    // Append to DOM.
    el.appendChild(div);
  }
};



/**
 * Prepares a single <animation> element on the page.
 */
function prepareAnimation(el) {
  if (el.__prepared) {
    return;
  }
  el.__prepared = true;

  // Grab source.
  var src = el.attributes['src'] ? el.attributes['src'].value : null;
  if (!src) {
    log('<animation> has no src');
    return;
  }

  // Get options.
  var options = {
    timescale: 1,
    repeatDelay: 1
  };
  if (el.attributes['speed']) {
    options.timescale = parseFloat(el.attributes['speed'].value);
  }
  if (el.attributes['repeatdelay']) {
    options.repeatDelay = parseFloat(el.attributes['repeatdelay'].value);
  }

  var dataSrc = src + '.js';
  var imageSrc = src + '.png';

  // Check global storage object for data. If found, use. Otherwise, XHR.
  var data = global.animationData[src];
  if (data) {
    // Data found in document - setup with that.
    processData(data);
  } else {
    // Data not found. Request.
    log('<animation src="' + src + '"> data not embedded - embed for better ' +
        'performance!');
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      // Wooo XSS attack vectors!
      global.eval(xhr.responseText);
      data = global.animationData[src];
      if (data) {
        processData(data);
      } else {
        // TODO(benvanik): show error image?
        log('<animation src="' + src + '"> data not found after fetch');
      }
    };
    xhr.open('GET', dataSrc, true);
    xhr.send(null);
  }
  return;

  function processData(data) {
    var animation = null;
    if (hasCanvasSupport) {
      animation = new CanvasAnimation(el, options, data, imageSrc);
    } else {
      animation = new FallbackAnimation(el, options, data, imageSrc);
    }
  };
};


/**
 * Prepares all <animation> elements on the page.
 */
function prepareAnimations() {
  var els = document.getElementsByTagName('animation');
  for (var n = 0; n < els.length; n++) {
    prepareAnimation(els[n]);
  }
};


// Exports.
global.prepareAnimation = prepareAnimation;
global.prepareAnimations = prepareAnimations;
global.animationData = global.animationData || {};

})(window);
