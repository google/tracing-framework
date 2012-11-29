/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Chrome extension background page.
 * Entry point for the extension, setting up all browser UI bits and
 * coordinating the various pieces.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


// main()
var extension = new Extension();
extension.setup();


// TODO(benvanik): use this to find the app and setup options for connecting
//     or an infobar for downloading it
chrome.management.getAll(function(results) {
  for (var n = 0; n < results.length; n++) {
    var result = results[n];
    if (result.name == 'Web Tracing Framework (App/DEBUG)') {
      // Always prefer the debug app, if installed.
      console.log('Discovered WTF App - debug ' + result.version);
      break;
    } else if (result.id == 'ofamllpnllolodilannpkikhjjcnfegg') {
      // Otherwise use CWS ID.
      console.log('Discovered WTF App - release ' + result.version);
      break;
    }
  }
});
