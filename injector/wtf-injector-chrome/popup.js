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


var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-37275478-1']);
_gaq.push(['_trackPageview', '/pageaction_popup']);


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

  setupAddBox();
});


/**
 * Sets up the add extensions box.
 */
function setupAddBox() {
  var addBox = document.querySelector('.addRow input');
  addBox.oninput = function() {
    if (addBox.value == '') {
      clearError();
      return;
    }
    fetchExtensionManifest(addBox.value);
  };
  function fetchExtensionManifest(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onerror = function() {
      setError();
    };
    xhr.onload = function() {
      var contentType = xhr.getResponseHeader('content-type') || '';
      if (xhr.status != 200 ||
          contentType.indexOf('/json') == -1) {
        setError();
        return;
      }

      var manifest;
      try {
        manifest = JSON.parse(xhr.responseText);
      } catch (e) {
      }
      if (!manifest) {
        setError();
        return;
      }

      clearError();
      addExtension(url, manifest);
    };
    try {
      xhr.send(null);
    } catch (e) {
      setError();
    }
  };
  function setError() {
    addBox.classList.add('kTextFieldError');
  };
  function clearError() {
    addBox.classList.remove('kTextFieldError');
  };

  function addExtension(url, manifest) {
    _gaq.push(['_trackEvent', 'popup', 'extension_added']);

    addBox.value = '';
    port.postMessage({
      command: 'add_extension',
      url: url,
      manifest: manifest
    });
    port.postMessage({
      command: 'toggle_extension',
      enabled: true,
      url: url
    });
  };
};


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

  buildExtensionTable(info.all_extensions, info.options['wtf.extensions']);
};


/**
 * Builds the extension table.
 * @param {!Array.<!Object>} extensions Extension information.
 * @param {!Array.<string>} enabledExtensions Extensions that are enabled.
 */
function buildExtensionTable(extensions, enabledExtensions) {
  var tbody = document.querySelector('.extensionPicker tbody');

  // Remove all old content.
  while (tbody.firstChild) {
    tbody.firstChild.remove();
  }

  // Add empty row.
  if (!extensions.length) {
    var tr = document.createElement('tr');
    tr.className = 'emptyRow';
    var td = document.createElement('td');
    td.innerText = 'No extensions added.';
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  // Build the table.
  for (var n = 0; n < extensions.length; n++) {
    var extension = extensions[n];
    addExtensionRow(extension);
  }
  function addExtensionRow(extension) {
    var isEnabled = enabledExtensions.indexOf(extension.url) >= 0;;

    var td = document.createElement('td');
    var input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = isEnabled;
    td.appendChild(input);
    var span = document.createElement('span');
    span.innerText = extension.manifest.name;
    span.title = extension.url;
    td.appendChild(span);

    var remove = document.createElement('td');
    remove.className = 'remove';
    var removeImg = document.createElement('img');
    removeImg.title = 'Remove extension';
    remove.appendChild(removeImg);

    var tr = document.createElement('tr');
    tr.appendChild(td);
    tr.appendChild(remove);

    tbody.appendChild(tr);

    function changed() {
      _gaq.push(['_trackEvent', 'popup', 'extension_toggled']);

      port.postMessage({
        command: 'toggle_extension',
        enabled: input.checked,
        url: extension.url
      });
    };
    input.onchange = function() {
      changed();
    };
    span.onclick = function() {
      input.checked = !input.checked;
      changed();
    };

    remove.onclick = function() {
      _gaq.push(['_trackEvent', 'popup', 'extension_removed']);

      if (isEnabled) {
        port.postMessage({
          command: 'toggle_extension',
          enabled: false,
          url: extension.url
        });
      }
      port.postMessage({
        command: 'remove_extension',
        url: extension.url
      });
    };
  };
};


/**
 * Toggles the injector content script on the given page.
 */
function toggleInjectorClicked() {
  _gaq.push(['_trackEvent', 'popup', 'toggled']);

  port.postMessage({
    command: 'toggle'
  });
  window.close();
};


/**
 * Resets the pages settings to their defaults.
 */
function resetSettingsClicked() {
  _gaq.push(['_trackEvent', 'popup', 'reset_settings']);

  port.postMessage({
    command: 'reset_settings'
  });
  window.close();
};


/**
 * Shows the UI.
 */
function showUiClicked() {
  _gaq.push(['_trackEvent', 'popup', 'show_ui']);

  port.postMessage({
    command: 'show_ui'
  });
  window.close();
};
