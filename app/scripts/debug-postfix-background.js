/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Postfix for the background page in debug mode.
 * This should be included last, after Closure base.js and deps.js.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


debugImportAndExecute([
  'wtf.app.background'
], function() {
  wtf.app.background.run({
    'mainDisplayUrl': 'build-bin/debug/app/maindisplay-debug.html',
    'endpoints': [
      'http:9024'
    ]
  });
});
