/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Google Drive API utilities.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.io.drive');
goog.provide('wtf.io.drive.DriveFile');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.result');
goog.require('goog.result.Result');
goog.require('goog.result.SimpleResult');
goog.require('wtf');
goog.require('wtf.timing');


/**
 * App ID.
 * @const
 * @type {string}
 * @private
 */
wtf.io.drive.APP_ID_ = 'gmdhhnlkjmknaopofnadmoamhmnlicme';


/**
 * Release client ID key.
 * @const
 * @type {string}
 * @private
 */
wtf.io.drive.RELEASE_CLIENT_ID_ =
    '918719667958.apps.googleusercontent.com';


/**
 * Debug client ID key.
 * @const
 * @type {string}
 * @private
 */
wtf.io.drive.DEBUG_CLIENT_ID_ =
    '918719667958-u64iesb8p6a7urc1mcnccv3ism7tuqns.apps.googleusercontent.com';


/**
 * OAuth scopes that will be requested.
 * @const
 * @type {!Array.<string>}
 * @private
 */
wtf.io.drive.OAUTH_SCOPES_ = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/urlshortener'
];


/**
 * Gets a value indicating whether the drive API is usable.
 * @return {boolean} True if the drive API can be used.
 */
wtf.io.drive.isSupported = function() {
  // Ignore in debug builds too, as it throws exceptions on load that are
  // annoying.
  return COMPILED && !wtf.CHROME_EXTENSION;
};


/**
 * Gets the OAuth client ID.
 * @return {string} Client ID.
 * @private
 */
wtf.io.drive.getClientId_ = function() {
  // Use the debug (localhost) oauth token unless running in the extension.
  var clientId = wtf.io.drive.DEBUG_CLIENT_ID_;
  if (wtf.CHROME_EXTENSION) {
    clientId = wtf.io.drive.RELEASE_CLIENT_ID_;
  }
  return clientId;
};


/**
 * Prepares the Drive API.
 * This should be called at startup. If it's not called the oauth popup will
 * flicker if the user is authenticated already when calling
 * {@see #authenticate}.
 */
wtf.io.drive.prepare = function() {
  // Ignore if not supported.
  if (!wtf.io.drive.isSupported()) {
    return;
  }

  var dom = goog.dom.getDomHelper();
  var body = dom.getDocument().body;
  goog.asserts.assert(body);
  var script;

  goog.global['wtf_io_drive_prepare_callback'] = function() {
    delete goog.global['wtf_io_drive_prepare_callback'];
    wtf.timing.setImmediate(function() {
      // This does an immediate authenticate attempt - if the user is not authed
      // it'll fail, otherwise it'll prevent the need for the popup later on.
      // Unfortunately gapi cannot be used in its onload callback, so we wait.
      var clientId = wtf.io.drive.getClientId_();
      var scope = wtf.io.drive.OAUTH_SCOPES_.join(' ');
      var config = {
        'client_id': clientId,
        'scope': scope,
        'immediate': true
      };
      gapi.auth.authorize(config, function() {
        // TODO(benvanik): set a result? make the whole flow async?
        // Error detection is flaky here.
      });
    });
  };

  script = dom.createElement(goog.dom.TagName.SCRIPT);
  script.src = 'https://apis.google.com/js/client.js?onload=' +
      'wtf_io_drive_prepare_callback';
  body.appendChild(script);

  script = dom.createElement(goog.dom.TagName.SCRIPT);
  script.src = 'https://www.google.com/jsapi';
  body.appendChild(script);
};


/**
 * Authenticates the user.
 * This should be called from an input event (onclick/etc) otherwise the popup
 * blocker will kill the dialog.
 * @return {!goog.result.Result} Async result, set when authenticated.
 */
wtf.io.drive.authenticate = function() {
  var result = new goog.result.SimpleResult();

  if (gapi.auth.getToken()) {
    result.setValue(true);
    return result;
  }

  var clientId = wtf.io.drive.getClientId_();
  var scope = wtf.io.drive.OAUTH_SCOPES_.join(' ');
  var config = {
    'client_id': clientId,
    'scope': scope,
    'immediate': false
  };
  gapi.auth.authorize(config, function() {
    var accessToken = gapi.auth.getToken();
    if (!accessToken) {
      result.setError();
    } else {
      result.setValue(true);
    }
  });

  return result;
};


/**
 * Async result for the file picker scripts.
 * This will be set when the picker is loading or has loaded.
 * @type {goog.result.Result}
 * @private
 */
wtf.io.drive.filePickerLoadResult_ = null;


/**
 * Shows a file picker.
 * {@see #prepare} must have been called and completed before this can
 * be used.
 * @param {{
 *   title: string
 * }} options Picker options.
 * @return {!goog.result.Result} Async result. The value will be a list of
 *     ['file name', 'file id'] tuples.
 */
wtf.io.drive.showFilePicker = function(options) {
  var result = new goog.result.SimpleResult();

  // Authenticate first.
  // This is a no-op if the user has already authenticated.
  goog.result.wait(wtf.io.drive.authenticate(), function(result) {
    if (result.getState() == goog.result.Result.State.ERROR) {
      result.setError(result.getError());
      return;
    }
    loadPickerApi();
  });

  function loadPickerApi() {
    if (!wtf.io.drive.filePickerLoadResult_) {
      wtf.io.drive.filePickerLoadResult_ = new goog.result.SimpleResult();
      google.load('picker', '1', {
        'callback': function() {
          wtf.io.drive.filePickerLoadResult_.setValue(true);
        }
      });
    }
    goog.result.wait(wtf.io.drive.filePickerLoadResult_, show);
  };

  function show() {
    var mimeTypes = [
      '*.wtf-trace,application/x-extension-wtf-trace',
      '*.wtf-json,application/x-extension-wtf-json',
      'application/octet-stream'
    ].join(',');

    var views = [];
    views.push(new google.picker.View('recently-picked'));
    views.push(new google.picker.View('folders'));

    var picker = new google.picker.PickerBuilder();
    picker.setTitle(options.title || 'Select a file');
    picker.enableFeature('multiselectEnabled');
    picker.setAppId(wtf.io.drive.APP_ID_);
    picker.setSelectableMimeTypes(mimeTypes);
    picker.setCallback(function(data) {
      if (data['action'] == 'picked') {
        var docs = data['docs'];
        var files = [];
        for (var n = 0; n < docs.length; n++) {
          var fileName = docs[n]['name'];
          var fileId = docs[n]['id'];
          files.push([fileName, fileId]);
        }
        result.setValue(files);
      } else if (data['action'] == 'cancel') {
        result.setError();
      }
    });
    for (var n = 0; n < views.length; n++) {
      views[n].setMimeTypes(mimeTypes);
      picker.addView(views[n]);
    }
    var builtPicker = picker.build();
    builtPicker.setVisible(true);
  };

  return result;
};


/**
 * @typedef {{
 *   title: string,
 *   filename: string,
 *   fileExtension: string,
 *   mimeType: string,
 *   downloadUrl: string
 * }}
 */
wtf.io.drive.DriveFile;


/**
 * Async result for the download file scripts.
 * This will be set when the download file script is loading or has loaded.
 * @type {goog.result.Result}
 * @private
 */
wtf.io.drive.downloadFileLoadResult_ = null;


/**
 * Begins querying a file from Drive.
 * @param {string} fileId Drive file ID.
 * @return {!goog.result.Result} Async result. The value will be a
 *     {@see wtf.io.drive.DriveFile} object.
 */
wtf.io.drive.queryFile = function(fileId) {
  var result = new goog.result.SimpleResult();

  var clientId = wtf.io.drive.getClientId_();

  // Authenticate first.
  // This is a no-op if the user has already authenticated.
  goog.result.wait(wtf.io.drive.authenticate(), function(result) {
    if (result.getState() == goog.result.Result.State.ERROR) {
      result.setError(result.getError());
      return;
    }
    loadDriveApi();
  });

  function loadDriveApi() {
    if (!wtf.io.drive.downloadFileLoadResult_) {
      wtf.io.drive.downloadFileLoadResult_ = new goog.result.SimpleResult();
      gapi.client.load('drive', 'v2', function() {
        wtf.io.drive.downloadFileLoadResult_.setValue(true);
      });
    }
    goog.result.wait(wtf.io.drive.downloadFileLoadResult_, getMetadata);
  };

  function getMetadata() {
    var token = gapi.auth.getToken();
    goog.asserts.assert(token);
    var accessToken = token.access_token;

    var url =
        'https://www.googleapis.com/drive/v2/files/' + fileId +
        '?key=' + clientId;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.onload = function() {
      if (xhr.status != 200) {
        result.setError();
        return;
      }

      var json = goog.global.JSON.parse(xhr.responseText);
      var driveFile = {
        title: json['title'],
        filename: json['originalFilename'],
        fileExtension: json['fileExtension'],
        mimeType: json['mimeType'],
        downloadUrl: json['downloadUrl']
      };
      result.setValue(driveFile);
    };
    xhr.onerror = function() {
      result.setError();
    };
    xhr.send(null);
  };

  return result;
};


/**
 * Begins downloading a file from Drive.
 * The async result from this is an XHR that is about to start downloading. Just
 * call {@code send()} on it to kick off the process. This allows you to listen
 * for any progress events you require.
 * @param {wtf.io.drive.DriveFile} driveFile Drive file result from a
 *     call to {@see wtf.io.drive#queryFile}.
 * @return {!goog.result.Result} Async result. The value will be an XHR object.
 */
wtf.io.drive.downloadFile = function(driveFile) {
  var result = new goog.result.SimpleResult();

  // Authenticate first.
  // This is a no-op if the user has already authenticated.
  goog.result.wait(wtf.io.drive.authenticate(), function(result) {
    if (result.getState() == goog.result.Result.State.ERROR) {
      result.setError(result.getError());
      return;
    }
    loadDriveApi();
  });

  function loadDriveApi() {
    if (!wtf.io.drive.downloadFileLoadResult_) {
      wtf.io.drive.downloadFileLoadResult_ = new goog.result.SimpleResult();
      gapi.client.load('drive', 'v2', function() {
        wtf.io.drive.downloadFileLoadResult_.setValue(true);
      });
    }
    goog.result.wait(wtf.io.drive.downloadFileLoadResult_, download);
  };

  function download() {
    var token = gapi.auth.getToken();
    goog.asserts.assert(token);
    var accessToken = token.access_token;

    var xhr = new XMLHttpRequest();
    switch (driveFile.mimeType) {
      case 'application/octet-stream':
        xhr.responseType = 'arraybuffer';
        break;
    }

    xhr.open('GET', driveFile.downloadUrl, true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.onerror = function() {
      result.setError();
    };

    // We don't send here, as we let the caller do it.
    // xhr.send(null);
    result.setValue(xhr);
  };

  return result;
};
