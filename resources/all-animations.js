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
(function(global, name){global.animationData = global.animationData = {};global.animationData[name] = {"width": 863, "timeline": [{"delay": 1, "blit": [[0, 0, 863, 580, 0, 0]]}, {"delay": 1, "blit": [[494, 1032, 229, 39, 6, 533], [855, 581, 3, 1, 860, 579]]}, {"delay": 1, "blit": [[494, 993, 229, 39, 6, 533]]}, {"delay": 1, "blit": [[6, 533, 229, 39, 6, 533]]}, {"delay": 1, "blit": [[858, 580, 3, 1, 860, 579]]}, {"delay": 1, "blit": [[0, 964, 494, 224, 195, 196], [855, 580, 3, 1, 860, 579]]}, {"delay": 0, "blit": [[723, 993, 115, 13, 310, 23], [838, 993, 25, 11, 425, 23], [494, 964, 350, 29, 503, 83], [494, 1084, 250, 17, 12, 89], [494, 1101, 206, 13, 275, 93], [0, 580, 855, 384, 4, 117], [494, 1125, 206, 12, 250, 508], [494, 1071, 347, 13, 500, 508], [494, 1114, 231, 11, 17, 509]]}], "meta": ["286,462", "146,550", "146,550", "172,535", "221,482", "221,482", "222,482"], "height": 580};})(window, "resources/anim_drag_open");
(function(global, name){global.animationData = global.animationData = {};global.animationData[name] = {"width": 863, "timeline": [{"delay": 1, "blit": [[0, 0, 863, 580, 0, 0]]}, {"delay": 1, "blit": []}, {"delay": 1, "blit": [[0, 874, 861, 7, 1, 1], [0, 885, 859, 1, 2, 8], [0, 881, 861, 1, 1, 9], [0, 884, 859, 1, 2, 10], [0, 883, 859, 1, 2, 12], [0, 882, 859, 1, 2, 14], [855, 580, 5, 3, 778, 67], [1, 730, 302, 7, 496, 70], [0, 737, 2, 127, 495, 77], [302, 737, 2, 127, 797, 77], [304, 801, 280, 29, 507, 87], [11, 792, 116, 10, 506, 132], [12, 808, 127, 10, 507, 148], [12, 831, 280, 22, 507, 171], [0, 869, 300, 1, 497, 204]]}, {"delay": 1, "blit": [[658, 803, 74, 31, 714, 87], [307, 855, 1, 16, 510, 174]]}, {"delay": 1, "blit": [[584, 803, 74, 31, 714, 87], [304, 852, 280, 22, 507, 171]]}, {"delay": 1, "blit": [[0, 580, 855, 150, 4, 53], [0, 865, 302, 2, 496, 203], [521, 730, 217, 42, 639, 531]]}, {"delay": 1, "blit": []}, {"delay": 1, "blit": []}, {"delay": 1, "blit": [[855, 580, 5, 3, 778, 67], [0, 730, 304, 135, 495, 70]]}, {"delay": 1, "blit": [[658, 772, 74, 31, 714, 87]]}, {"delay": 1, "blit": [[584, 772, 74, 31, 714, 87], [304, 852, 280, 22, 507, 171]]}, {"delay": 0, "blit": [[772, 53, 19, 17, 772, 53], [4, 66, 492, 137, 4, 66], [109, 70, 302, 7, 496, 70], [738, 730, 62, 127, 797, 77], [304, 772, 280, 29, 507, 87], [584, 844, 116, 10, 506, 132], [584, 834, 127, 10, 507, 148], [304, 830, 280, 22, 507, 171], [0, 867, 301, 2, 496, 203], [304, 730, 217, 42, 639, 531]]}], "meta": ["638,124", "783,61", "783,61", "752,105", "752,105", "752,105", "752,105", "781,61", "781,61", "751,109", "751,109", "751,109"], "height": 580};})(window, "resources/anim_enable_disable");
(function(global, name){global.animationData = global.animationData = {};global.animationData[name] = {"width": 500, "timeline": [{"delay": 1, "blit": [[0, 0, 500, 100, 0, 0]]}, {"delay": 1, "blit": [[0, 282, 268, 60, 116, 32]]}, {"delay": 1, "blit": [[0, 219, 268, 63, 116, 32]]}, {"delay": 1, "blit": [[144, 32, 27, 40, 144, 32], [0, 100, 302, 63, 172, 32]]}, {"delay": 1, "blit": [[0, 163, 302, 56, 172, 32]]}, {"delay": 1, "blit": [[302, 100, 166, 57, 200, 32]]}, {"delay": 0, "blit": [[228, 32, 89, 57, 228, 32]]}], "meta": ["172,-2", "131,55", "159,58", "187,49", "214,51", "242,52", "172,-5"], "height": 100};})(window, "resources/anim_hud_tooltips");
(function(global, name){global.animationData = global.animationData = {};global.animationData[name] = {"width": 863, "timeline": [{"delay": 1, "blit": [[0, 0, 863, 580, 0, 0]]}, {"delay": 1, "blit": []}, {"delay": 1, "blit": [[858, 2288, 5, 3, 778, 67], [0, 4601, 304, 135, 495, 70]]}, {"delay": 1, "blit": [[450, 5440, 74, 31, 714, 87]]}, {"delay": 1, "blit": [[517, 5312, 74, 31, 714, 87], [92, 5346, 280, 22, 507, 171]]}, {"delay": 1, "blit": []}, {"delay": 1, "blit": [[0, 1106, 855, 523, 4, 53]]}, {"delay": 1, "blit": [[0, 1629, 855, 463, 4, 113]]}, {"delay": 1, "blit": [[0, 4505, 595, 96, 4, 366], [0, 5414, 215, 21, 644, 370], [792, 4457, 27, 40, 772, 532]]}, {"delay": 1, "blit": [[792, 4417, 27, 40, 772, 532]]}, {"delay": 1, "blit": [[272, 5257, 426, 26, 80, 15], [0, 580, 855, 526, 4, 50]]}, {"delay": 1, "blit": [[205, 5474, 115, 13, 310, 23], [422, 4183, 25, 11, 425, 23], [92, 5283, 350, 29, 503, 83], [533, 3578, 250, 17, 12, 89], [0, 5474, 205, 13, 275, 93], [0, 3598, 855, 131, 4, 117], [0, 2092, 855, 299, 4, 249], [304, 4723, 439, 12, 17, 555], [215, 5427, 347, 13, 500, 555]]}, {"delay": 1, "blit": [[92, 5312, 232, 29, 564, 283]]}, {"delay": 1, "blit": [[367, 5440, 83, 52, 760, 283], [480, 5149, 104, 27, 567, 284], [743, 4723, 47, 10, 680, 293], [582, 2201, 173, 11, 586, 323], [562, 5424, 44, 90, 29, 329], [533, 3380, 328, 198, 75, 329], [602, 5039, 59, 216, 404, 329], [718, 5232, 67, 162, 465, 329], [643, 2218, 162, 7, 647, 340], [589, 2236, 236, 47, 593, 358], [575, 2237, 27, 8, 579, 359], [826, 2341, 12, 9, 830, 393], [637, 2288, 167, 7, 641, 410], [582, 2307, 21, 8, 586, 429], [667, 2323, 137, 7, 671, 445], [147, 4805, 47, 11, 698, 463], [582, 2342, 21, 8, 586, 464], [667, 2358, 137, 7, 671, 480], [440, 5398, 202, 26, 641, 498], [792, 4497, 26, 8, 580, 499], [667, 2183, 5, 7, 635, 515], [539, 5398, 103, 11, 740, 533], [839, 3147, 20, 8, 579, 534], [536, 4860, 36, 9, 23, 556]]}, {"delay": 1, "blit": [[356, 5369, 204, 29, 564, 283], [304, 4601, 302, 121, 557, 318], [326, 4606, 188, 12, 579, 323], [830, 4635, 25, 36, 51, 329], [810, 4723, 49, 198, 77, 329], [505, 3729, 241, 180, 128, 329], [827, 5139, 34, 198, 369, 329], [602, 4931, 128, 108, 404, 329], [382, 4623, 197, 9, 635, 340], [388, 4641, 195, 26, 641, 358], [326, 4642, 27, 8, 579, 359], [861, 1070, 1, 54, 45, 365], [575, 2515, 250, 11, 579, 393], [0, 5541, 197, 9, 635, 445], [553, 2161, 286, 1, 557, 457], [553, 2502, 286, 81, 557, 463], [776, 5451, 58, 54, 405, 473], [461, 2320, 67, 18, 465, 473], [504, 5208, 91, 11, 17, 556]]}, {"delay": 1, "blit": [[442, 5283, 232, 29, 564, 283], [136, 5178, 136, 88, 700, 339]]}, {"delay": 1, "blit": [[272, 5208, 232, 29, 564, 283], [0, 5463, 264, 11, 593, 358], [197, 5548, 179, 9, 635, 375], [533, 3596, 302, 1, 557, 387], [422, 4165, 20, 18, 82, 437], [858, 2270, 4, 18, 176, 437], [819, 4445, 10, 18, 366, 437], [783, 3578, 71, 11, 26, 556]]}, {"delay": 1, "blit": [[156, 5527, 64, 7, 160, 282], [862, 1900, 1, 253, 192, 294], [0, 5178, 136, 88, 700, 339], [0, 5391, 253, 23, 197, 522]]}, {"delay": 1, "blit": [[718, 5118, 109, 114, 4, 134], [577, 4786, 233, 114, 324, 134], [0, 5534, 536, 7, 4, 282], [0, 4999, 533, 34, 7, 294], [0, 3380, 533, 218, 7, 329]]}, {"delay": 1, "blit": [[814, 5337, 48, 114, 112, 134], [0, 5266, 92, 114, 233, 134], [0, 5527, 536, 7, 4, 282], [0, 4931, 536, 34, 4, 294], [422, 3947, 415, 218, 4, 329], [785, 5232, 29, 218, 420, 329], [746, 3729, 90, 218, 450, 329]]}, {"delay": 1, "blit": [[702, 5257, 16, 114, 159, 134], [606, 5424, 30, 114, 204, 134], [0, 5520, 536, 7, 4, 282], [0, 4836, 536, 34, 4, 294], [0, 4200, 449, 218, 4, 329], [661, 5039, 57, 218, 456, 329], [839, 2929, 24, 218, 516, 329]]}, {"delay": 1, "blit": [[730, 4931, 9, 114, 174, 134], [809, 4921, 17, 114, 188, 134], [0, 5513, 536, 7, 4, 282], [0, 5033, 531, 34, 9, 294], [801, 3162, 61, 218, 4, 329], [855, 1502, 5, 144, 66, 329], [686, 5501, 11, 218, 72, 329], [743, 4505, 87, 218, 89, 329], [745, 5394, 16, 218, 179, 329], [606, 4505, 137, 218, 198, 329], [846, 5451, 11, 218, 341, 329], [536, 4931, 66, 218, 358, 329], [776, 5505, 10, 218, 430, 329], [743, 4900, 66, 218, 447, 329], [834, 5451, 12, 218, 520, 329], [858, 1720, 3, 218, 537, 329]]}, {"delay": 1, "blit": [[855, 1388, 7, 114, 182, 134], [0, 5506, 536, 7, 4, 282], [449, 4383, 414, 34, 4, 294], [16, 3947, 37, 34, 418, 294], [703, 3909, 37, 34, 477, 294], [0, 2137, 1, 253, 531, 294], [0, 3729, 505, 218, 4, 329], [857, 2106, 1, 218, 513, 329]]}, {"delay": 1, "blit": [[783, 3589, 65, 7, 156, 282], [564, 2405, 159, 11, 568, 292], [0, 3947, 422, 253, 56, 294], [575, 2161, 280, 35, 579, 318], [855, 2324, 7, 18, 482, 329], [553, 2201, 286, 61, 557, 358], [449, 4417, 286, 1, 557, 422], [553, 2271, 286, 81, 557, 428], [631, 2358, 197, 9, 635, 515], [533, 3597, 286, 1, 557, 527], [575, 2376, 264, 9, 579, 533], [304, 4724, 91, 11, 17, 556]]}, {"delay": 1, "blit": [[861, 1144, 1, 1, 81, 249], [458, 5111, 34, 10, 101, 259], [560, 5369, 64, 7, 156, 282], [862, 1051, 1, 253, 188, 294]]}, {"delay": 1, "blit": [[367, 5101, 144, 29, 10, 249], [0, 2660, 855, 269, 4, 278]]}, {"delay": 1, "blit": [[830, 4671, 32, 10, 102, 259], [0, 5149, 480, 29, 142, 281]]}, {"delay": 1, "blit": [[0, 4870, 480, 29, 142, 281]]}, {"delay": 1, "blit": [[253, 5398, 187, 29, 626, 281], [480, 4870, 78, 27, 145, 282], [92, 5266, 174, 14, 226, 290], [0, 2929, 839, 233, 4, 314], [844, 2161, 11, 28, 848, 314]]}, {"delay": 1, "blit": [[0, 5101, 367, 48, 135, 282], [376, 5548, 109, 10, 704, 289], [536, 4852, 41, 8, 93, 320], [0, 5440, 367, 12, 135, 338], [536, 4844, 41, 8, 93, 339], [0, 5452, 360, 11, 142, 357], [536, 4836, 41, 8, 93, 358], [0, 4786, 577, 50, 93, 376], [367, 5130, 162, 11, 681, 414], [91, 4418, 248, 12, 142, 433], [49, 4419, 34, 8, 100, 434], [0, 4900, 743, 31, 100, 452], [112, 4900, 290, 11, 212, 490], [552, 5237, 48, 8, 93, 491], [272, 5178, 290, 30, 212, 509], [481, 5141, 55, 8, 93, 510], [504, 5229, 56, 8, 93, 529]]}, {"delay": 1, "blit": [[855, 1864, 3, 22, 161, 282], [504, 5219, 95, 10, 711, 289], [819, 4417, 11, 28, 848, 314], [0, 4418, 792, 87, 51, 319], [49, 4419, 49, 8, 100, 320], [0, 4442, 792, 19, 51, 409], [72, 4435, 267, 12, 123, 433], [0, 4427, 69, 8, 51, 434], [0, 4442, 792, 19, 51, 447], [0, 4736, 799, 50, 44, 471], [0, 4427, 69, 8, 51, 472], [0, 4737, 799, 19, 44, 523]]}, {"delay": 1, "blit": [[92, 5368, 264, 23, 272, 332]]}, {"delay": 1, "blit": [[855, 1938, 4, 114, 60, 134], [859, 1938, 3, 114, 184, 134], [6, 2092, 144, 29, 10, 249], [0, 2391, 855, 269, 4, 278], [272, 5237, 280, 11, 17, 556]]}, {"delay": 1, "blit": [[232, 5492, 60, 7, 236, 282], [862, 798, 1, 253, 264, 294], [372, 5346, 264, 23, 269, 522]]}, {"delay": 1, "blit": [[855, 1274, 7, 114, 58, 134], [0, 5499, 536, 7, 4, 282], [324, 5312, 193, 34, 4, 294], [367, 5142, 114, 5, 212, 294], [505, 3909, 198, 34, 342, 294], [214, 2418, 60, 9, 226, 305], [367, 5141, 114, 8, 212, 320], [0, 3162, 536, 218, 4, 329]]}, {"delay": 1, "blit": [[855, 1160, 7, 114, 52, 134], [854, 4165, 9, 114, 64, 134], [272, 5248, 302, 7, 4, 282], [197, 5541, 232, 7, 308, 282], [0, 5067, 528, 34, 12, 294], [855, 1646, 3, 218, 11, 329], [837, 3947, 23, 218, 20, 329], [856, 2106, 1, 218, 55, 329], [855, 1016, 6, 144, 60, 329], [855, 2106, 1, 218, 69, 329], [836, 3729, 23, 218, 77, 329], [830, 4417, 30, 218, 104, 329], [449, 4165, 405, 218, 135, 329]]}, {"delay": 0, "blit": [[664, 5501, 22, 114, 31, 134], [536, 5440, 24, 114, 72, 134], [0, 5492, 536, 7, 4, 282], [0, 4965, 534, 34, 6, 294], [761, 5394, 15, 218, 6, 329], [855, 798, 4, 218, 26, 329], [860, 1502, 3, 218, 40, 329], [702, 5394, 22, 218, 44, 329], [861, 580, 2, 218, 69, 329], [861, 2052, 1, 218, 83, 329], [724, 5394, 21, 218, 86, 329], [859, 798, 3, 218, 110, 329], [861, 1016, 1, 54, 119, 329], [855, 580, 1, 218, 125, 329], [855, 2052, 5, 54, 132, 329], [860, 2052, 1, 218, 139, 329], [642, 5312, 22, 218, 148, 329], [855, 580, 6, 218, 179, 329], [674, 5283, 28, 218, 190, 329], [827, 4921, 36, 218, 223, 329], [536, 3162, 265, 218, 270, 329], [861, 1720, 2, 180, 538, 329], [861, 1124, 1, 20, 265, 527]]}], "meta": ["678,195", "783,62", "783,62", "756,105", "756,105", "756,105", "756,105", "756,105", "786,550", "786,550", "786,550", "785,547", "679,301", "679,301", "679,301", "695,334", "695,334", "192,517", "192,517", "192,517", "196,513", "196,513", "189,486", "188,518", "107,265", "107,265", "253,293", "253,293", "253,293", "253,293", "253,293", "267,327", "266,327", "264,517", "264,516", "264,516", "264,516"], "height": 580};})(window, "resources/anim_index");
(function(global, name){global.animationData = global.animationData = {};global.animationData[name] = {"width": 863, "timeline": [{"delay": 1, "blit": [[0, 0, 863, 580, 0, 0]]}, {"delay": 1, "blit": [[861, 597, 1, 14, 125, 50]]}, {"delay": 1, "blit": [[850, 1089, 13, 17, 124, 50], [838, 1251, 19, 17, 793, 50], [0, 1072, 718, 122, 98, 74]]}, {"delay": 1, "blit": [[847, 1072, 14, 17, 136, 50], [718, 1119, 132, 15, 123, 80], [780, 1251, 58, 12, 123, 104], [810, 1173, 45, 12, 135, 128], [855, 597, 6, 10, 799, 130], [688, 1268, 84, 16, 105, 151], [358, 1359, 249, 15, 456, 176], [810, 1162, 53, 11, 402, 177]]}, {"delay": 1, "blit": [[855, 580, 8, 17, 142, 50], [718, 1170, 92, 18, 427, 50], [688, 1238, 161, 13, 522, 52], [718, 1088, 129, 16, 685, 52], [718, 1104, 132, 15, 123, 80], [0, 1194, 688, 111, 124, 80], [772, 1280, 61, 11, 123, 105], [17, 1243, 68, 11, 141, 129], [688, 1210, 164, 15, 123, 152], [164, 1266, 114, 12, 288, 152], [281, 1266, 56, 12, 405, 152], [0, 1354, 718, 25, 98, 195], [855, 607, 2, 3, 861, 577]]}, {"delay": 1, "blit": [[479, 1418, 186, 23, 101, 47], [718, 1152, 92, 18, 427, 50], [688, 1225, 161, 13, 522, 52], [718, 1072, 129, 16, 685, 52], [665, 1418, 193, 18, 102, 77], [850, 1106, 9, 14, 799, 80], [861, 577, 2, 3, 861, 577]]}, {"delay": 1, "blit": [[45, 1419, 329, 15, 290, 52], [0, 1434, 387, 15, 123, 80], [665, 1436, 188, 15, 513, 80], [772, 1268, 90, 12, 702, 80], [718, 1134, 100, 18, 102, 101], [0, 1402, 707, 16, 105, 127], [0, 1418, 479, 16, 105, 151], [0, 1305, 718, 49, 98, 171]]}, {"delay": 1, "blit": [[0, 1379, 686, 23, 71, 47], [818, 1134, 27, 28, 4, 50], [793, 50, 19, 17, 793, 50], [98, 74, 718, 98, 98, 74]]}, {"delay": 0, "blit": [[688, 1194, 160, 16, 290, 22], [71, 49, 18, 18, 71, 49], [688, 1251, 92, 17, 665, 50], [862, 597, 1, 1, 4, 77], [0, 907, 855, 165, 4, 83], [0, 580, 855, 327, 4, 249]]}], "meta": ["186,140", "453,58", "453,58", "453,58", "453,58", "453,58", "453,58", "453,58", "453,58"], "height": 580};})(window, "resources/anim_omnibox_open");
(function(global, name){global.animationData = global.animationData = {};global.animationData[name] = {"width": 863, "timeline": [{"delay": 1, "blit": [[0, 0, 863, 580, 0, 0]]}, {"delay": 1, "blit": [[796, 725, 27, 40, 800, 532]]}, {"delay": 1, "blit": [[0, 816, 27, 40, 800, 532]]}, {"delay": 1, "blit": [[0, 580, 855, 236, 4, 340]]}, {"delay": 0, "blit": [[27, 816, 30, 30, 11, 538]]}], "meta": ["636,329", "813,552", "813,552", "813,552", "813,552"], "height": 580};})(window, "resources/anim_save_trace");
(function(global, name){global.animationData = global.animationData = {};global.animationData[name] = {"width": 863, "timeline": [{"delay": 1, "blit": [[0, 0, 863, 580, 0, 0]]}, {"delay": 1, "blit": [[830, 1536, 27, 40, 772, 532]]}, {"delay": 1, "blit": [[803, 1536, 27, 40, 772, 532]]}, {"delay": 1, "blit": [[0, 1536, 426, 26, 80, 15], [0, 580, 855, 526, 4, 50]]}, {"delay": 0, "blit": [[238, 1582, 115, 13, 310, 23], [776, 1536, 25, 11, 425, 23], [426, 1536, 350, 29, 503, 83], [347, 1565, 250, 17, 12, 89], [597, 1565, 206, 13, 275, 93], [0, 1405, 855, 131, 4, 117], [0, 1106, 855, 299, 4, 249], [597, 1578, 199, 12, 257, 555], [0, 1562, 347, 13, 500, 555], [0, 1575, 238, 11, 17, 556]]}], "meta": ["714,454", "786,551", "786,551", "786,551", "786,551"], "height": 580};})(window, "resources/anim_show_trace");
(function(global, name){global.animationData = global.animationData = {};global.animationData[name] = {"width": 863, "timeline": [{"delay": 1, "blit": [[0, 0, 863, 580, 0, 0]]}, {"delay": 1, "blit": []}, {"delay": 1, "blit": [[827, 637, 5, 3, 778, 67], [432, 737, 302, 7, 496, 70], [841, 654, 2, 127, 495, 77], [839, 654, 2, 127, 797, 77], [432, 635, 280, 29, 507, 87], [712, 683, 116, 10, 506, 132], [712, 663, 127, 10, 507, 148], [432, 708, 280, 22, 507, 171], [432, 745, 300, 1, 497, 204]]}, {"delay": 1, "blit": [[786, 606, 74, 31, 506, 87], [435, 689, 1, 16, 510, 174]]}, {"delay": 1, "blit": [[712, 606, 74, 31, 506, 87], [432, 686, 280, 22, 507, 171]]}, {"delay": 1, "blit": [[432, 580, 426, 26, 80, 15], [796, 637, 18, 16, 13, 50], [0, 804, 542, 15, 125, 52], [839, 637, 19, 17, 772, 53], [432, 730, 302, 7, 496, 70], [858, 637, 2, 127, 495, 77], [860, 580, 2, 127, 797, 77], [432, 606, 280, 29, 507, 87], [712, 637, 84, 16, 24, 88], [814, 637, 13, 11, 11, 89], [712, 673, 116, 10, 506, 132], [712, 653, 127, 10, 507, 148], [432, 664, 280, 22, 507, 171], [432, 744, 300, 1, 497, 204], [0, 580, 432, 224, 216, 219]]}, {"delay": 0, "blit": []}], "meta": ["687,99", "783,60", "783,60", "551,107", "551,107", "551,107", "551,107"], "height": 580};})(window, "resources/anim_show_ui");
