/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Comment scope.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.doc.CommentScope');

goog.require('goog.events');
goog.require('wtf.doc.Comment');
goog.require('wtf.events.EventEmitter');
goog.require('wtf.events.ListEventType');
goog.require('wtf.events.SimpleEventfulList');



/**
 * Comment scope.
 * Contains comments under a certain scoped namespace.
 * @param {string} name Scope name.
 * @constructor
 * @extends {wtf.events.EventEmitter}
 */
wtf.doc.CommentScope = function(name) {
  goog.base(this);

  /**
   * Scope name.
   * @type {string}
   * @private
   */
  this.name_ = name;

  // TODO(benvanik): info for display in the comment listing

  /**
   * The list of all comments in the scope.
   * @type {!wtf.events.EventfulList}
   * @private
   */
  this.list_ = new wtf.events.SimpleEventfulList();
  this.registerDisposable(this.list_);

  this.list_.addListener(
      wtf.events.ListEventType.VALUES_ADDED,
      function(changes) {
        var newComments = [];
        for (var n = 0; n < changes.length; n++) {
          newComments.push(changes[1]);
        }
        this.emitEvent(
            wtf.doc.CommentScope.EventType.COMMENTS_ADDED,
            newComments);
      }, this);
  this.list_.addListener(
      wtf.events.ListEventType.VALUES_REMOVED,
      function(changes) {
        var oldComments = [];
        for (var n = 0; n < changes.length; n++) {
          oldComments.push(changes[1]);
        }
        this.emitEvent(
            wtf.doc.CommentScope.EventType.COMMENTS_REMOVED,
            oldComments);
      }, this);
};
goog.inherits(wtf.doc.CommentScope, wtf.events.EventEmitter);


/**
 * Event types related to the object.
 * @enum {string}
 */
wtf.doc.CommentScope.EventType = {
  /**
   * Comments added; receives a list of added comments.
   */
  COMMENTS_ADDED: goog.events.getUniqueId('added'),

  /**
   * Comments removed; receives a list of removed comments.
   */
  COMMENTS_REMOVED: goog.events.getUniqueId('removed')
};


/**
 * Gets the name of the comment scope.
 * @return {string} Scope name.
 */
wtf.doc.CommentScope.prototype.getName = function() {
  return this.name_;
};


/**
 * Creates a new comment and adds it to the scope.
 * @param {string} author Comment author.
 * @param {number} timeStart Wall-time of the comment.
 * @param {number} timeEnd Wall-time end of range or {@code timeStart}.
 * @param {string} value Comment value.
 * @return {!wtf.doc.Comment} New comment.
 */
wtf.doc.CommentScope.prototype.createComment = function(
    author, timeStart, timeEnd, value) {
  var comment = new wtf.doc.Comment(author, timeStart, timeEnd, value);
  // TODO(benvanik): set values
  this.list_.binaryInsert(comment, wtf.doc.Comment.compare);
  // Event handled by list impl.
  return comment;
};


/**
 * Removes a comment from the scope.
 * @param {!wtf.doc.Comment} comment Comment to remove.
 */
wtf.doc.CommentScope.prototype.removeComment = function(comment) {
  this.list_.remove(comment);
  // Event handled by list impl.
};


/**
 * Iterates over the list returning all comments in the given time range.
 * @param {number} timeStart Start wall-time range.
 * @param {number} timeEnd End wall-time range.
 * @param {!function(this: T, !wtf.doc.Comment)} callback Function to call
 *     with the comments.
 * @param {T=} opt_scope Scope to call the function in.
 * @template T
 */
wtf.doc.CommentScope.prototype.forEach = function(
    timeStart, timeEnd, callback, opt_scope) {
  // TODO(benvanik): binary search start point.
  this.list_.forEach(function(value) {
    var comment = /** @type {!wtf.doc.Comment} */ (value);
    if (comment.getStartTime() > timeEnd) {
      return false;
    }
    if (comment.getEndTime() >= timeStart ||
        comment.getStartTime() >= timeStart) {
      callback.call(opt_scope, comment);
    }
  });
};
