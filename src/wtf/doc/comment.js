/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview A single comment in the document.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.doc.Comment');



/**
 * Immutable comment data.
 * @param {string} author Comment author.
 * @param {number} timeStart Wall-time of the comment.
 * @param {number} timeEnd Wall-time end of range or {@code timeStart}.
 * @param {string} value Comment value.
 * @constructor
 */
wtf.doc.Comment = function(author, timeStart, timeEnd, value) {
  /**
   * The author of this comment.
   * @type {string}
   * @private
   */
  this.author_ = author;

  /**
   * Wall-time this comment is placed at.
   * @type {number}
   * @private
   */
  this.timeStart_ = timeStart;

  /**
   * Wall-time this comment extends to.
   * If the comment is not covering a range this will be the same as
   * {@see #timeStart_}.
   * @type {number}
   * @private
   */
  this.timeEnd_ = timeEnd;

  /**
   * Comment value.
   * @type {string}
   * @private
   */
  this.value_ = value;
};


/**
 * Gets the author name.
 * @return {string} Author.
 */
wtf.doc.Comment.prototype.getAuthor = function() {
  return this.author_;
};


/**
 * Gets the wall time the comment range starts at.
 * @return {number} Wall time.
 */
wtf.doc.Comment.prototype.getStartTime = function() {
  return this.timeStart_;
};


/**
 * Gets the wall time the comment range ends at.
 * @return {number} Wall time.
 */
wtf.doc.Comment.prototype.getEndTime = function() {
  return this.timeEnd_;
};


/**
 * Gets the comment value.
 * @return {string} Comment value.
 */
wtf.doc.Comment.prototype.getValue = function() {
  return this.value_;
};


/**
 * Compares two comments by start time.
 * @param {!wtf.doc.Comment} a First comment.
 * @param {!wtf.doc.Comment} b Second comment.
 * @return {number} Comparison value.
 */
wtf.doc.Comment.compare = function(a, b) {
  return a.timeStart_ - b.timeStart_;
};
