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
  // Get version string from the manifest.
  var manifest = chrome.runtime.getManifest();
  var version = manifest['version'];
  document.querySelector('.versionString').innerText = version;

  // document.querySelector('.buttonShowUi').onclick =
  //     showUiClicked;
  document.querySelector('.buttonOpenFile').onclick =
      showUiClicked; //openFileClicked;
  document.querySelector('.buttonResetSettings').onclick =
      resetSettingsClicked;
  document.querySelector('.buttonInstrumentCalls').onclick =
      instrumentCallsClicked;
  document.querySelector('.buttonInstrumentTime').onclick =
      instrumentTimeClicked;
  document.querySelector('.buttonInstrumentMemory').onclick =
      instrumentMemoryClicked;
  document.querySelector('.buttonToggleInjector').onclick =
      toggleInjectorClicked;
  document.querySelector('.buttonStopRecording').onclick =
      stopRecordingClicked;

  setupAddBox();
});


/**
 * Sets up the add addons box.
 */
function setupAddBox() {
  var addBox = document.querySelector('.addRow input');
  addBox.oninput = function() {
    if (addBox.value == '') {
      clearError();
      return;
    }
    fetchAddonManifest(addBox.value);
  };
  function fetchAddonManifest(url) {
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
      addAddon(url, manifest);
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

  function addAddon(url, manifest) {
    _gaq.push(['_trackEvent', 'popup', 'addon_added']);

    addBox.value = '';
    port.postMessage({
      command: 'add_addon',
      url: url,
      manifest: manifest
    });
    port.postMessage({
      command: 'toggle_addon',
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
  var disableOverlay = document.querySelector('.disableOverlay');
  var stopRecordingButton = document.querySelector('.buttonStopRecording');

  var status = info.status;
  switch (status) {
    case 'instrumented':
      // Instrumentation is enabled for the page.
      disableOverlay.style.display = '';
      stopRecordingButton.innerText = 'Stop Recording';
      break;
    case 'whitelisted':
      // Tracing is enabled for the page.
      disableOverlay.style.display = '';
      stopRecordingButton.innerText = 'Stop Recording For This URL';
      break;
    default:
      // Tracing is disabled for the page.
      disableOverlay.style.display = 'none';
      stopRecordingButton.innerText = '';
      break;
  }

  buildAddonTable(info.all_addons, info.options['wtf.addons']);
};


/**
 * Builds the addon table.
 * @param {!Array.<!Object>} addons Addon information.
 * @param {!Array.<string>} enabledAddons Addons that are enabled.
 */
function buildAddonTable(addons, enabledAddons) {
  var tbody = document.querySelector('.addonPicker tbody');

  // Remove all old content.
  while (tbody.firstChild) {
    tbody.firstChild.remove();
  }

  // Add empty row.
  if (!addons.length) {
    var tr = document.createElement('tr');
    tr.className = 'emptyRow';
    var td = document.createElement('td');
    td.innerText = 'No addons added.';
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  // Build the table.
  for (var n = 0; n < addons.length; n++) {
    var extension = addons[n];
    addExtensionRow(extension);
  }
  function addExtensionRow(extension) {
    var isEnabled = enabledAddons.indexOf(extension.url) >= 0;;

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
      _gaq.push(['_trackEvent', 'popup', 'addon_toggled']);

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
      _gaq.push(['_trackEvent', 'popup', 'addon_removed']);

      if (isEnabled) {
        port.postMessage({
          command: 'toggle_addon',
          enabled: false,
          url: extension.url
        });
      }
      port.postMessage({
        command: 'remove_addon',
        url: extension.url
      });
    };
  };
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


/**
 * Shows the UI and brings up the open file dialog.
 */
function openFileClicked() {
  var inputElement = document.createElement('input');
  inputElement['type'] = 'file';
  inputElement['multiple'] = true;
  inputElement['accept'] = [
    '.wtf-trace,application/x-extension-wtf-trace',
    '.wtf-json,application/x-extension-wtf-json',
    '.wtf-calls,application/x-extension-wtf-calls',
    '.cpuprofile,application/x-extension-cpuprofile',
    '.part,application/x-extension-part'
  ].join(',');
  inputElement.onchange = function(e) {
    _gaq.push(['_trackEvent', 'popup', 'open_file']);

    var fileEntries = [];
    for (var n = 0; n < inputElement.files.length; n++) {
      var file = inputElement.files[n];
      var blob = new Blob([file], {
        type: 'application/octet-stream'
      });
      var blobUrl = URL.createObjectURL(blob);
      fileEntries.push({
        name: file.name,
        url: blobUrl,
        size: blob.size
      });
    }

    port.postMessage({
      command: 'show_files',
      files: fileEntries
    });
    window.close();
  };
  inputElement.click();
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
 * Toggles instrumented call tracing.
 */
function instrumentCallsClicked() {
  _gaq.push(['_trackEvent', 'popup', 'instrument_calls']);

  port.postMessage({
    command: 'instrument',
    type: 'calls'
  });
  window.close();
};


/**
 * Toggles instrumented time tracing.
 */
function instrumentTimeClicked() {
  _gaq.push(['_trackEvent', 'popup', 'instrument_time']);

  port.postMessage({
    command: 'instrument',
    type: 'time'
  });
  window.close();
};


/**
 * Toggles instrumented memory tracing.
 */
function instrumentMemoryClicked() {
  _gaq.push(['_trackEvent', 'popup', 'instrument_memory']);

  try {
    new Function('return %GetHeapUsage()');
  } catch (e) {
    // Pop open docs page.
    port.postMessage({
      command: 'instrument',
      type: 'memory',
      needsHelp: true
    });
    return;
  }

  port.postMessage({
    command: 'instrument',
    type: 'memory'
  });
  window.close();
};


/**
 * Toggles the injector content script on the given page.
 */
function toggleInjectorClicked() {
  _gaq.push(['_trackEvent', 'popup', 'start_recording']);

  port.postMessage({
    command: 'toggle'
  });
  window.close();
};


/**
 * Stops recording on the given page.
 */
function stopRecordingClicked() {
  _gaq.push(['_trackEvent', 'popup', 'stop_recording']);

  port.postMessage({
    command: 'toggle'
  });
  window.close();
};
