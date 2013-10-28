/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview node.js Closure library loader utility.
 * This makes it possible to easily load compiled Closure code into the global
 * execution context.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

var fs = require('fs');
var path = require('path');
var vm = require('vm');


/**
 * Imports the Closure Library base.js file as well as any user deps.js files.
 * The base 'goog' object is placed on the global scope. {@code goog.require}
 * can be used to import code via the require system.
 *
 * @param {!Array.<string>} depsFiles deps.js files to load.
 * @param {string=} opt_basePath Base Closure Library path. Defaults to
 *     {@code closure-library/closure/goog/}.
 * @param {boolean=} opt_baseDeps Whether to include the Closure Library deps.js
 *     file in addition to the user supplied deps.
 * @return {!Object} {@code goog} namespace object.
 */
exports.importClosureLibrary = function(depsFiles, opt_basePath, opt_baseDeps) {
  var basePath = opt_basePath || 'third_party/closure-library/closure/goog/';

  // Stash settings on global. base.js looks for these to change behavior.
  global.CLOSURE_NO_DEPS = !(opt_baseDeps || false);
  global.CLOSURE_BASE_PATH = basePath;

  // Windows is not a fan of the base path.
  // TODO(benvanik): check if this is an anvil issue.
  if (process.platform == 'win32') {
    global.CLOSURE_BASE_PATH = '';
  }

  // Override the goog.importScript_ function with our own.
  global.CLOSURE_IMPORT_SCRIPT = importScript;

  // Export a 'goog' to place things on.
  global.goog = {};

  // Export require so we can make node-like requires.
  global.require = require;

  // Create a dummy window object to make most of the common operations in the
  // Closure Library happy.
  global.window = {
    require: require,
    setTimeout: global.setTimeout,
    clearTimeout: global.clearTimeout,
    setInterval: global.setInterval,
    clearInterval: global.clearInterval,
    console: global.console
  };

  // Load the library base.js file. It will merge itself into global.goog.
  importScript(path.join(basePath, 'base.js'));

  // Load any deps given.
  for (var n = 0; n < depsFiles.length; n++) {
    importScript(depsFiles[n]);
  }

  return global.goog;
};


/**
 * Merged directory paths that should be searched for files.
 * @const
 * @type {!Array.<string>}
 */
var SEARCH_PATHS = [
  'build-out',
  'build-gen',
  '.'
];


/**
 * Checks to see if a file exists.
 * Compatibility shim for old node.js' that lack fs.existsSync.
 * @param {string} path File path.
 * @return {boolean} True if the file exists.
 */
function fileExistsSync(path) {
  if (fs.existsSync) {
    return fs.existsSync(path);
  } else {
    try {
      fs.statSync(path);
      return true;
    } catch (e) {
      return false;
    }
  }
}


/**
 * Imports a Closure file.
 * This overrides the {@code goog.importScript_} method and is called by base.js
 * when it needs a new file.
 * @param {string} src Script source.
 * @return {boolean} Whether the script was imported successfully.
 */
function importScript(src) {
  // Scan all search paths in order, trying to find the file.
  //var relPath = path.join(path.dirname(process.argv[1]) + '/', src);
  var filePath = src;//path.relative(process.cwd(), relPath);
  for (var n = 0; n < SEARCH_PATHS.length; n++) {
    var searchPath = path.join(process.cwd(), SEARCH_PATHS[n]);
    var searchFilePath = path.join(searchPath, filePath);
    if (fileExistsSync(searchFilePath)) {
      var sourceCode = fs.readFileSync(searchFilePath, 'utf8');
      try {
        vm.runInThisContext(sourceCode, searchFilePath);
      } catch (e) {
        console.log('Error running script ' + src);
        throw e;
      }
      return true;
    }
  }

  // File not found.
  console.log('ERROR: could not find ' + src);
  return false;
}
