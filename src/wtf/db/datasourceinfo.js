/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Data source info.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.db.BlobDataSourceInfo');
goog.provide('wtf.db.DataSourceInfo');
goog.provide('wtf.db.DriveDataSourceInfo');
goog.provide('wtf.db.UrlDataSourceInfo');

/** @suppress {extraRequire} */
goog.require('wtf.io.drive.DriveFile');



/**
 * Base source information about a data source.
 * @param {string} filename Filename.
 * @param {string} contentType MIME type.
 * @constructor
 */
wtf.db.DataSourceInfo = function(filename, contentType) {
  /**
   * @type {string}
   */
  this.filename = filename;

  /**
   * @type {string}
   */
  this.contentType = contentType;
};



/**
 * Source information for a blob.
 * @param {string} filename Filename.
 * @param {string} contentType MIME type.
 * @param {!wtf.io.Blob} blob Blob data.
 * @extends {wtf.db.DataSourceInfo}
 * @constructor
 */
wtf.db.BlobDataSourceInfo = function(filename, contentType, blob) {
  goog.base(this, filename, contentType);

  /**
   * Blob.
   * @type {!wtf.io.Blob}
   */
  this.blob = blob;
};
goog.inherits(wtf.db.BlobDataSourceInfo, wtf.db.DataSourceInfo);



/**
 * Source information for a file loaded from Drive.
 * @param {string} filename Filename.
 * @param {string} contentType MIME type.
 * @param {string} fileId Drive file ID.
 * @param {wtf.io.drive.DriveFile=} opt_driveFile Drive file data.
 * @extends {wtf.db.DataSourceInfo}
 * @constructor
 */
wtf.db.DriveDataSourceInfo = function(filename, contentType, fileId,
    opt_driveFile) {
  goog.base(this, filename, contentType);

  /**
   * Drive file ID.
   * @type {string}
   */
  this.fileId = fileId;

  /**
   * Drive file data.
   * This is optional but can speed up downloading.
   * @type {?wtf.io.drive.DriveFile}
   */
  this.driveFile = opt_driveFile || null;
};
goog.inherits(wtf.db.DriveDataSourceInfo, wtf.db.DataSourceInfo);



/**
 * Source information for a URL-based resource.
 * @param {string} filename Filename.
 * @param {string} contentType MIME type.
 * @param {string} url Source URL.
 * @extends {wtf.db.DataSourceInfo}
 * @constructor
 */
wtf.db.UrlDataSourceInfo = function(filename, contentType, url) {
  goog.base(this, filename, contentType);

  /**
   * URL.
   * @type {string}
   */
  this.url = url;
};
goog.inherits(wtf.db.UrlDataSourceInfo, wtf.db.DataSourceInfo);
