/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Simple proxy redirector.
 * This will redirect all requests that could be scripts to a local server.
 * It should only be enabled when instrumentation is desired.
 *
 * NOTE: this requires --disable-web-security to work. It'd be nice to fix that.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


function registerRules() {
  chrome.webRequest.onBeforeRequest.addListener(function(details) {
    // Ignore everything not from a real tab.
    if (details.tabId == -1) {
      return;
    }

    // Only inspect scripts.
    if (details.method == 'GET' &&
        (details.type == 'script' || details.type == 'xmlhttprequest') &&
        details.url.indexOf('blob:') != 0 &&
        details.url.indexOf('http://localhost:8081/inject') != 0) {
      console.log(details.url);
      var localUrl = 'http://localhost:8081/inject?url=' + details.url;
      return {
        redirectUrl: localUrl
      };
    }
  }, {
    urls: ['<all_urls>']
  }, [
    'blocking'
  ]);
}

registerRules();
