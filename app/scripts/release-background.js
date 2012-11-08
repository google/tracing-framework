/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Release mode background page runner.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


// Launch the background page code.
wtf.app.background.run({
  'endpoints': [
    'http:8022'
  ]
});
