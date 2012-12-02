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
