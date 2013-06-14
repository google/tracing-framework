/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview File header data chunk part.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.cff.parts.FileHeaderPart');

goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('wtf');
goog.require('wtf.data.ContextInfo');
goog.require('wtf.data.ScriptContextInfo');
goog.require('wtf.data.formats.FileFlags');
goog.require('wtf.io.Blob');
goog.require('wtf.io.cff.Part');
goog.require('wtf.io.cff.PartType');



/**
 * A part containing a the file header.
 *
 * @param {wtf.data.ContextInfo=} opt_contextInfo Initial context info.
 * @param {Object=} opt_metadata Metadata.
 * @constructor
 * @extends {wtf.io.cff.Part}
 */
wtf.io.cff.parts.FileHeaderPart = function(opt_contextInfo, opt_metadata) {
  goog.base(this, wtf.io.cff.PartType.FILE_HEADER);

  /**
   * File flags.
   * A bitmask of {@see wtf.data.formats.FileFlags} values.
   * @type {number}
   * @private
   */
  this.flags_ = 0;

  /**
   * Timebase.
   * @type {number}
   * @private
   */
  this.timebase_ = 0;

  /**
   * Context info.
   * @type {wtf.data.ContextInfo}
   * @private
   */
  this.contextInfo_ = opt_contextInfo || null;

  /**
   * User metadata.
   * @type {!Object}
   * @private
   */
  this.metadata_ = opt_metadata || {};
};
goog.inherits(wtf.io.cff.parts.FileHeaderPart, wtf.io.cff.Part);


/**
 * Gets the flags in the file header.
 * @return {number} A bitmask of {@see wtf.data.formats.FileFlags} values.
 */
wtf.io.cff.parts.FileHeaderPart.prototype.getFlags = function() {
  return this.flags_;
};


/**
 * Sets the flags in the file header.
 * @param {number} value A bitmask of {@see wtf.data.formats.FileFlags} values.
 */
wtf.io.cff.parts.FileHeaderPart.prototype.setFlags = function(value) {
  this.flags_ = value;
};


/**
 * Gets the timebase in the file header.
 * @return {number} Timebase value.
 */
wtf.io.cff.parts.FileHeaderPart.prototype.getTimebase = function() {
  return this.timebase_;
};


/**
 * Sets the timebase in the file header.
 * @param {number} value Timebase value.
 */
wtf.io.cff.parts.FileHeaderPart.prototype.setTimebase = function(value) {
  this.timebase_ = value;
};


/**
 * Gets the context info in the file header.
 * @return {!wtf.data.ContextInfo} Context info value.
 */
wtf.io.cff.parts.FileHeaderPart.prototype.getContextInfo = function() {
  goog.asserts.assert(this.contextInfo_);
  return this.contextInfo_;
};


/**
 * Sets the context info value.
 * @param {!wtf.data.ContextInfo} value New context info value.
 */
wtf.io.cff.parts.FileHeaderPart.prototype.setContextInfo = function(value) {
  this.contextInfo_ = value;
};


/**
 * Gets the metadata object in the file header.
 * This is not a clone and should not be modified.
 * @return {!Object} Metadata object.
 */
wtf.io.cff.parts.FileHeaderPart.prototype.getMetadata = function() {
  return this.metadata_;
};


/**
 * Sets the metadata object in the file header.
 * This will not be cloned and should not be modified after set.
 * @param {Object} value Metadata object.
 */
wtf.io.cff.parts.FileHeaderPart.prototype.setMetadata = function(value) {
  this.metadata_ = value || {};
};


/**
 * @override
 */
wtf.io.cff.parts.FileHeaderPart.prototype.initFromBlobData = function(data) {
  var deferred = new goog.async.Deferred();

  var blob = wtf.io.Blob.create([data]);
  blob.readAsText(function(value) {
    try {
      var json = value ? goog.global.JSON.parse(value) : {};
      if (!json || typeof json != 'object') {
        throw new Error('File header expected to be a JSON object.');
      }
      this.initFromJsonObject(/** @type {!Object} */ (json));
      deferred.callback(this);
    } catch (e) {
      deferred.errback(e);
    }
  }, this);

  return deferred;
};


/**
 * @override
 */
wtf.io.cff.parts.FileHeaderPart.prototype.toBlobData = function() {
  var json = goog.global.JSON.stringify(this.toJsonObject());
  return json;
};


/**
 * @override
 */
wtf.io.cff.parts.FileHeaderPart.prototype.initFromJsonObject = function(
    value) {
  var flags = value['flags'];
  var timebase = value['timebase'];
  var contextInfoRaw = value['contextInfo'];
  var metadata = value['metadata'];

  if (flags) {
    if (!goog.isArray(flags)) {
      throw new Error('File header flags must be an array of strings.');
    }
    this.flags_ = wtf.data.formats.FileFlags.fromStrings(flags);
  } else {
    this.flags_ = 0;
  }

  if (!goog.isDef(timebase)) {
    throw new Error('File header missing required field "timebase".');
  }
  this.timebase_ = timebase;

  if (contextInfoRaw) {
    if (typeof contextInfoRaw != 'object') {
      throw new Error('File header context info must be an object.');
    }
    this.contextInfo_ = wtf.data.ContextInfo.parse(contextInfoRaw);
    if (!this.contextInfo_) {
      throw new Error('Unable to parse file header context info.');
    }
  } else {
    // TODO(benvanik): a better default?
    this.contextInfo_ = new wtf.data.ScriptContextInfo();
  }

  if (metadata) {
    if (typeof metadata != 'object') {
      throw new Error('File header metadata must be an object.');
    }
    this.metadata_ = /** @type {!Object} */ (metadata);
  } else {
    this.metadata_ = {};
  }
};


/**
 * @override
 */
wtf.io.cff.parts.FileHeaderPart.prototype.toJsonObject = function() {
  // Write time information.
  var flags = 0;
  if (wtf.hasHighResolutionTimes) {
    flags |= wtf.data.formats.FileFlags.HAS_HIGH_RESOLUTION_TIMES;
  }

  // Fetch context info, if required.
  var contextInfo = this.contextInfo_;
  if (!contextInfo) {
    contextInfo = wtf.data.ContextInfo.detect();
  }

  // Metadata can be overridden by the user-supplied value.
  var metadata = {
    // Run the now() benchmark and stash that in metadata.
    // This isn't in the format as it's just informational.
    'nowTimeNs': wtf.computeNowOverhead()
  };
  for (var key in this.metadata_) {
    metadata[key] = this.metadata_[key];
  }

  return {
    'type': this.getType(),
    'flags': wtf.data.formats.FileFlags.toStrings(flags),
    'timebase': wtf.timebase(),
    'contextInfo': contextInfo.serialize(),
    'metadata': metadata
  };
};
