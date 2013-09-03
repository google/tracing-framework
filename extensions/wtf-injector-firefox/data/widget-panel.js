/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Firefox extension widget panel.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


var buttonToggle = document.querySelector('.buttonToggleInjector');
buttonToggle.onclick = function(e) {
  e.preventDefault();
  self.port.emit('perform', 'toggle');
};


var buttonReset = document.querySelector('.buttonResetSettings');
buttonReset.onclick = function(e) {
  e.preventDefault();
  self.port.emit('perform', 'reset');
};


var buttonShowUi = document.querySelector('.buttonShowUi');
buttonShowUi.onclick = function(e) {
  e.preventDefault();
  self.port.emit('perform', 'show_ui');
};


var currentState = null;
self.port.on('show', function(state) {
  currentState = state;
  if (currentState && currentState['enabled']) {
    buttonToggle.innerHTML = 'Disable For This URL';
  } else {
    buttonToggle.innerHTML = 'Enable For This URL';
  }
});

