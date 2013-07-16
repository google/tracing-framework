/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Release mode UI page runner.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-37275478-1']);
_gaq.push(['_setSessionCookieTimeout', 0]);
_gaq.push(['_trackPageview', '/maindisplay']);

// Only include analytics when not on localhost.
if (window.location.hostname != 'localhost') {
  (function() {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = false;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
  })();
}


// Launch UI.
wtf.app.show({
});
