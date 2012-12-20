/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Chrome extension page action popup.
 *
 * @author benvanik@google.com (Ben Vanik)
 */


// Connect to the background page so we can query page status/etc.
var port = chrome.extension.connect({
  name: 'popup'
});
port.onMessage.addListener(function(data, port) {
  switch (data['command']) {
    case 'info':
      updateWithInfo(data['info']);
      break;
  }
});

document.addEventListener('DOMContentLoaded', function() {
  document.querySelector('.buttonToggleInjector').onclick =
      toggleInjectorClicked;
  document.querySelector('.buttonResetSettings').onclick =
      resetSettingsClicked;
  document.querySelector('.buttonShowUi').onclick =
      showUiClicked;
});


/**
 * Updates the popup with the given page information.
 * @param {!Object} info Page information.
 */
function updateWithInfo(info) {
  var toggleButton = document.querySelector('.buttonToggleInjector');
  var status = info.status;
  switch (status) {
    case 'whitelisted':
      // Tracing is enabled for the page.
      toggleButton.innerText = 'Disable';
      break;
    default:
      // Tracing is disabled for the page.
      toggleButton.innerText = 'Enable';
      break;
  }
};


/**
 * Toggles the injector content script on the given page.
 */
function toggleInjectorClicked() {
  port.postMessage({
    command: 'toggle'
  });
  window.close();
};


/**
 * Resets the pages settings to their defaults.
 */
function resetSettingsClicked() {
  port.postMessage({
    command: 'reset_settings'
  });
  window.close();
};


/**
 * Shows the UI.
 */
function showUiClicked() {
  port.postMessage({
    command: 'show_ui'
  });
  window.close();
};
