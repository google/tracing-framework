/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Execution context information.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.data.ContextInfo');
goog.provide('wtf.data.ContextType');
goog.provide('wtf.data.ScriptContextInfo');
goog.provide('wtf.data.UserAgent');

goog.require('goog.Uri');
goog.require('goog.asserts');
goog.require('goog.string');
goog.require('goog.userAgent');
goog.require('goog.userAgent.platform');
goog.require('goog.userAgent.product');
goog.require('wtf');


/**
 * Context type.
 * @enum {string}
 */
wtf.data.ContextType = {
  /**
   * Scripts; {@see wtf.data.ScriptContextInfo}.
   */
  SCRIPT: 'script'
};



/**
 * Generic context information.
 * Subclassed to provide information about execution contexts to tools.
 *
 * @constructor
 */
wtf.data.ContextInfo = function() {
};


/**
 * Infers a filename from the given context info.
 * @return {string} A filename fragment.
 */
wtf.data.ContextInfo.prototype.getFilename = goog.abstractMethod;


/**
 * Detects and sets the context information.
 */
wtf.data.ContextInfo.prototype.detect = goog.abstractMethod;


/**
 * Parses the context information from the given JSON object.
 * @param {!Object} json Source JSON.
 * @return {boolean} Whether the parse was successful.
 */
wtf.data.ContextInfo.prototype.parse = goog.abstractMethod;


/**
 * Serializes the context information into a JSON object.
 * @return {!Object} JSON object.
 */
wtf.data.ContextInfo.prototype.serialize = goog.abstractMethod;


/**
 * Gets a human-readable version of the context info.
 * @return {string} String version.
 */
wtf.data.ContextInfo.prototype.toString = goog.abstractMethod;


/**
 * Parses context information from the given buffer.
 * The appropriate subclass type will be returned.
 * @param {!Object} json Source JSON object.
 * @return {wtf.data.ContextInfo} Parsed context information.
 */
wtf.data.ContextInfo.parse = function(json) {
  // Create appropriate subclass.
  var contextInfo;
  var contextType = /** @type {wtf.data.ContextType} */ (json['contextType']);
  switch (contextType) {
    case wtf.data.ContextType.SCRIPT:
      contextInfo = new wtf.data.ScriptContextInfo();
      break;
  }
  if (!contextInfo) {
    return null;
  }

  // Parse contents.
  if (!contextInfo.parse(json)) {
    return null;
  }

  return contextInfo;
};


/**
 * Detects the current context information.
 * @return {!wtf.data.ContextInfo} Current context information.
 */
wtf.data.ContextInfo.detect = function() {
  var contextInfo;

  // TODO(benvanik): support other context types?
  contextInfo = new wtf.data.ScriptContextInfo();
  goog.asserts.assert(contextInfo);

  // Perform detection to populate the information.
  contextInfo.detect();

  return contextInfo;
};


/**
 * User agent types.
 * @enum {string}
 */
wtf.data.UserAgent.Type = {
  UNKNOWN: 'unknown',
  NODEJS: 'nodejs',
  OPERA: 'opera',
  IE: 'ie',
  GECKO: 'gecko',
  WEBKIT: 'webkit'
};


/**
 * Operating system types.
 * @enum {string}
 */
wtf.data.UserAgent.Platform = {
  MAC: 'mac',
  WINDOWS: 'windows',
  LINUX: 'linux',
  OTHER: 'other'
};


/**
 * Device types.
 * @enum {string}
 */
wtf.data.UserAgent.Device = {
  DESKTOP: 'desktop',
  SERVER: 'server',
  CHROME: 'chrome',
  IPHONE: 'iphone',
  IPAD: 'ipad',
  ANDROID: 'android',
  OTHER_MOBILE: 'mobile'
};



/**
 * Execution context information for scripts.
 * These can be scripts in a browser page, worker, or node.js application.
 *
 * @constructor
 * @extends {wtf.data.ContextInfo}
 */
wtf.data.ScriptContextInfo = function() {
  goog.base(this);

  /**
   * Full script URI.
   * @type {string}
   */
  this.uri = '';

  /**
   * Page/process title, if available.
   * @type {string?}
   */
  this.title = null;

  /**
   * Icon URI, if available.
   * @type {{
   *   uri: string
   * }?}
   */
  this.icon = null;

  /**
   * Process/task ID.
   * @type {string?}
   */
  this.taskId = null;

  /**
   * Entire arguments list.
   * @type {!Array.<string>}
   */
  this.args = [];

  /**
   * Full user-agent info.
   * @type {{
   *   value: string,
   *   type: wtf.data.UserAgent.Type,
   *   platform: (wtf.data.UserAgent.Platform|string),
   *   platformVersion: string,
   *   device: wtf.data.UserAgent.Device
   * }}
   */
  this.userAgent = {
    value: '',
    type: wtf.data.UserAgent.Type.UNKNOWN,
    platform: wtf.data.UserAgent.Platform.OTHER,
    platformVersion: '',
    device: wtf.data.UserAgent.Device.DESKTOP
  };
};
goog.inherits(wtf.data.ScriptContextInfo, wtf.data.ContextInfo);


/**
 * @override
 */
wtf.data.ScriptContextInfo.prototype.getFilename = function() {
  if (this.title) {
    var filename = goog.string.stripQuotes(this.title, '"`\'');
    filename = goog.string.collapseWhitespace(filename);
    filename = filename.replace(/[\/ \n\r]/g, '-');
    filename = filename.replace(/[-]+/g, '-');
    filename = filename.toLowerCase();
    return filename;
  } else if (this.uri) {
    var uri = goog.Uri.parse(this.uri);
    var filename = uri.getDomain();
    if (uri.hasPort()) {
      filename += '-' + uri.getPort();
    }
    if (uri.hasPath()) {
      var path = uri.getPath();
      path = path.replace(/\//g, '-');
      path = path.replace(/\./g, '-');
      if (goog.string.endsWith(filename, '-')) {
        path = path.substr(0, path.length - 1);
      }
      filename += path;
    }
    return filename;
  }
  return 'script';
};


/**
 * @override
 */
wtf.data.ScriptContextInfo.prototype.detect = function() {
  if (wtf.NODE) {
    this.uri = process.argv[1] || process.argv[0];
    if (process.title == 'node') {
      this.title = this.uri.substr(this.uri.lastIndexOf('/') + 1);
      this.title = this.title.replace(/\.js$/, '');
    } else {
      this.title = process.title;
    }
    this.icon = null;
    this.taskId = String(process.pid);
    this.args = process.argv.slice();
  } else {
    this.uri = goog.global.location.href;
    if (goog.global.document) {
      this.title = goog.global.document.title;
      var link = goog.global.document.querySelector('link[rel~="icon"]');
      if (link && link.href) {
        this.icon = {
          uri: link.href
        };
      }
    }
    // TODO(benvanik): find something meaningful for browsers
    this.taskId = '';
    this.args = [];
  }

  // Full user-agent string.
  this.userAgent.value = goog.userAgent.getUserAgentString() || '';

  // User-agent type.
  if (wtf.NODE) {
    this.userAgent.type = wtf.data.UserAgent.Type.NODEJS;
  } else if (goog.userAgent.OPERA) {
    this.userAgent.type = wtf.data.UserAgent.Type.OPERA;
  } else if (goog.userAgent.IE) {
    this.userAgent.type = wtf.data.UserAgent.Type.IE;
  } else if (goog.userAgent.GECKO) {
    this.userAgent.type = wtf.data.UserAgent.Type.GECKO;
  } else if (goog.userAgent.WEBKIT) {
    this.userAgent.type = wtf.data.UserAgent.Type.WEBKIT;
  } else {
    this.userAgent.type = wtf.data.UserAgent.Type.UNKNOWN;
  }

  // Platform.
  if (wtf.NODE) {
    // TODO(benvanik): better detection/mapping
    this.userAgent.platform = process.platform;
  } else if (goog.userAgent.MAC) {
    this.userAgent.platform = wtf.data.UserAgent.Platform.MAC;
  } else if (goog.userAgent.WINDOWS) {
    this.userAgent.platform = wtf.data.UserAgent.Platform.WINDOWS;
  } else if (goog.userAgent.LINUX) {
    this.userAgent.platform = wtf.data.UserAgent.Platform.LINUX;
  } else {
    this.userAgent.platform = wtf.data.UserAgent.Platform.OTHER;
  }

  // Platform version.
  if (wtf.NODE) {
    this.userAgent.platformVersion = process.version;
  } else {
    this.userAgent.platformVersion = goog.userAgent.platform.VERSION;
  }

  // Device.
  if (wtf.NODE) {
    this.userAgent.device = wtf.data.UserAgent.Device.SERVER;
  } else if (goog.userAgent.product.CHROME) {
    this.userAgent.device = wtf.data.UserAgent.Device.CHROME;
  } else if (goog.userAgent.product.IPHONE) {
    this.userAgent.device = wtf.data.UserAgent.Device.IPHONE;
  } else if (goog.userAgent.product.IPAD) {
    this.userAgent.device = wtf.data.UserAgent.Device.IPAD;
  } else if (goog.userAgent.product.ANDROID) {
    this.userAgent.device = wtf.data.UserAgent.Device.ANDROID;
  } else if (goog.userAgent.MOBILE) {
    this.userAgent.device = wtf.data.UserAgent.Device.OTHER_MOBILE;
  } else {
    this.userAgent.device = wtf.data.UserAgent.Device.DESKTOP;
  }

  // TODO(benvanik): browser features (webgl/touch/etc)
  // TODO(benvanik): screen info (window size/dpi/etc)
};


/**
 * @override
 */
wtf.data.ScriptContextInfo.prototype.parse = function(json) {
  this.uri = json['uri'];
  this.title = json['title'] || null;
  this.icon = json['icon'] ? {
    uri: json['icon']['uri']
  } : null;
  this.taskId = json['taskId'] || null;
  this.args = json['args'];
  if (json['userAgent']) {
    this.userAgent.value = json['userAgent']['value'];
    this.userAgent.type = json['userAgent']['type'];
    this.userAgent.platform = json['userAgent']['platform'];
    this.userAgent.platformVersion = json['userAgent']['platformVersion'];
    this.userAgent.device = json['userAgent']['device'];
  }
  return true;
};


/**
 * @override
 */
wtf.data.ScriptContextInfo.prototype.serialize = function() {
  return {
    'contextType': wtf.data.ContextType.SCRIPT,
    'uri': this.uri,
    'title': this.title,
    'icon': this.icon ? {
      'uri': this.icon.uri
    } : null,
    'taskId': this.taskId,
    'args': this.args,
    'userAgent': {
      'value': this.userAgent.value,
      'type': this.userAgent.type,
      'platform': this.userAgent.platform,
      'platformVersion': this.userAgent.platformVersion,
      'device': this.userAgent.device
    }
  };
};


/**
 * @override
 */
wtf.data.ScriptContextInfo.prototype.toString = function() {
  return this.title || this.uri;
};
