/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Postfix for the main display page in debug mode.
 * This should be included last, after Closure base.js and deps.js.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


debugImportAndExecute([
  'wtf.app'
], function() {
  wtf.app.show({
  });
});
