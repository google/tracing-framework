/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Settings profile.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.doc.Profile');

goog.require('wtf.doc.ProfileScope');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.events.SimpleEventfulMap');



/**
 * Settings profile.
 * @param {string} name Profile name.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.doc.Profile = function(name) {
  goog.base(this);

  /**
   * Profile name.
   * @type {string}
   * @private
   */
  this.name_ = name;

  /**
   * Profile scopes.
   * @type {!wtf.events.EventfulMap}
   * @private
   */
  this.scopes_ = new wtf.events.SimpleEventfulMap();
  this.registerDisposable(this.scopes_);
};
goog.inherits(wtf.doc.Profile, wtf.events.EventEmitter);


/**
 * Gets the profile name.
 * @return {string} Profile name.
 */
wtf.doc.Profile.prototype.getName = function() {
  return this.name_;
};


/**
 * Gets the profile scope with the given name, creating it if needed.
 * @param {string} name Profile scope name.
 * @return {!wtf.doc.ProfileScope} The requested profile scope.
 */
wtf.doc.Profile.prototype.getScope = function(name) {
  var value = this.scopes_.get(name);
  if (!value) {
    value = new wtf.doc.ProfileScope(name);
    this.scopes_.set(name, value);
  }
  return /** @type {!wtf.doc.ProfileScope} */ (value);
};
