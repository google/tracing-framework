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


var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-37275478-1']);
_gaq.push(['_setSessionCookieTimeout', 0]);
_gaq.push(['_trackPageview', '/background']);

(function() {
  var ga = document.createElement('script');
  ga.type = 'text/javascript';
  ga.async = false;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(ga, s);
})();


// main()
var extension = new Extension();
extension.setup();
