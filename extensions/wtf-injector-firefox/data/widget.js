/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Firefox extension widget.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


var icon = document.querySelector('.icon-wtf');

var currentState = null;
self.port.on('update', function(state) {
  currentState = state;
  if (currentState && currentState['enabled']) {
    icon.src = 'assets/icons/wtf-on-32.png';
  } else {
    icon.src = 'assets/icons/wtf-32.png';
  }
});
