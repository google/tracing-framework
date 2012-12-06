/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Main WTF UI.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.MainDisplay');

goog.require('goog.asserts');
goog.require('goog.async.DeferredList');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.fs.FileReader');
goog.require('goog.net.EventType');
goog.require('goog.net.XhrIo');
goog.require('goog.soy');
goog.require('goog.string');
goog.require('goog.style');
goog.require('wtf.app.ui.DocumentView');
goog.require('wtf.app.ui.HelpOverlay');
goog.require('wtf.app.ui.maindisplay');
goog.require('wtf.doc.Document');
goog.require('wtf.events');
goog.require('wtf.events.CommandManager');
goog.require('wtf.events.KeyboardScope');
goog.require('wtf.io');
goog.require('wtf.ipc');
goog.require('wtf.ipc.Channel');
goog.require('wtf.pal');
goog.require('wtf.timing');
goog.require('wtf.ui.Control');
goog.require('wtf.ui.Dialog');



/**
 * Main WTF UI.
 * Manages the main UI (menus/etc), active traces (and their trace views), etc.
 *
 * @param {!wtf.pal.IPlatform} platform Platform abstraction layer.
 * @param {!wtf.util.Options} options Options.
 * @param {Element=} opt_parentElement Element to display in.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.app.ui.MainDisplay = function(
    platform, options, opt_parentElement, opt_dom) {
  var dom = opt_dom || goog.dom.getDomHelper(opt_parentElement);
  var parentElement = /** @type {!Element} */ (
      opt_parentElement || dom.getDocument().body);
  goog.base(this, parentElement, dom);

  /**
   * Options overrides.
   * @type {!wtf.util.Options}
   * @private
   */
  this.options_ = options;

  /**
   * Platform abstraction layer.
   * @type {!wtf.pal.IPlatform}
   * @private
   */
  this.platform_ = platform;

  /**
   * Command manager.
   * @type {!wtf.events.CommandManager}
   * @private
   */
  this.commandManager_ = new wtf.events.CommandManager();
  wtf.events.CommandManager.setShared(this.commandManager_);

  /**
   * Any active dialog.
   * @type {wtf.ui.Dialog}
   * @private
   */
  this.activeDialog_ = null;

  /**
   * The current document view, if any.
   * @type {wtf.app.ui.DocumentView}
   * @private
   */
  this.documentView_ = null;

  /**
   * Parent window channel, if one exists.
   * @type {wtf.ipc.Channel}
   * @private
   */
  this.channel_ = wtf.ipc.connectToParentWindow();
  if (this.channel_) {
    this.channel_.addListener(
        wtf.ipc.Channel.EventType.MESSAGE,
        this.channelMessage_, this);
  }

  // Setup command manager.
  this.commandManager_.registerSimpleCommand(
      'open_trace', this.requestTraceLoad, this);
  this.commandManager_.registerSimpleCommand(
      'save_trace', this.saveTrace_, this);
  this.commandManager_.registerSimpleCommand(
      'share_trace', this.shareTrace_, this);
  this.commandManager_.registerSimpleCommand(
      'show_settings', this.showSettings_, this);
  this.commandManager_.registerSimpleCommand(
      'toggle_help', this.toggleHelpOverlay_, this);

  // Setup keyboard shortcuts.
  var keyboard = wtf.events.getWindowKeyboard(dom);
  var keyboardScope = new wtf.events.KeyboardScope(keyboard);
  this.registerDisposable(keyboardScope);
  keyboardScope.addCommandShortcut('ctrl+o', 'open_trace');
  keyboardScope.addCommandShortcut('ctrl+s', 'save_trace');
  keyboardScope.addCommandShortcut('shift+/', 'toggle_help');

  this.setupDragDropLoading_();

  // Use the query string as a URL.
  // TODO(benvanik): use goog.Uri to parse the query string args and pull off
  //     the URL.
  var queryString = dom.getWindow().location.search;
  if (queryString) {
    var url = queryString.replace(/\?url=/, '');
    this.loadNetworkTrace(url);
  }
};
goog.inherits(wtf.app.ui.MainDisplay, wtf.ui.Control);


/**
 * @override
 */
wtf.app.ui.MainDisplay.prototype.disposeInternal = function() {
  goog.dispose(this.activeDialog_);
  this.activeDialog_ = null;

  goog.dom.removeNode(this.getRootElement());
  this.setDocumentView(null);

  wtf.events.CommandManager.setShared(null);

  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
wtf.app.ui.MainDisplay.prototype.createDom = function(dom) {
  return /** @type {!Element} */ (goog.soy.renderAsFragment(
      wtf.app.ui.maindisplay.control, undefined, undefined, dom));
};


/**
 * Sets up drag-drop file loading for wtf-trace files.
 * @private
 */
wtf.app.ui.MainDisplay.prototype.setupDragDropLoading_ = function() {
  var doc = this.getDom().getDocument();
  var eh = this.getHandler();
  eh.listen(doc.body, goog.events.EventType.DRAGENTER, function(e) {
    e.preventDefault();
  }, false, this);
  eh.listen(doc.body, goog.events.EventType.DRAGOVER, function(e) {
    e.preventDefault();
  }, false, this);
  eh.listen(doc.body, goog.events.EventType.DROP, function(e) {
    var browserEvent = e.getBrowserEvent();
    if (browserEvent.dataTransfer && browserEvent.dataTransfer.files &&
        browserEvent.dataTransfer.files.length) {
      e.stopPropagation();
      e.preventDefault();
      this.loadTraceFiles(browserEvent.dataTransfer.files);
    }
  }, false, this);
};


/**
 * Gets the active document view.
 * @return {wtf.app.ui.DocumentView} Document view, if any.
 */
wtf.app.ui.MainDisplay.prototype.getDocumentView = function() {
  return this.documentView_;
};


/**
 * Sets the active document view, disposing any previous one.
 * @param {wtf.app.ui.DocumentView} documentView New document view.
 */
wtf.app.ui.MainDisplay.prototype.setDocumentView = function(documentView) {
  if (this.documentView_ == documentView) {
    return;
  }

  goog.dispose(this.documentView_);
  this.documentView_ = null;

  goog.style.showElement(
      this.getChildElement(goog.getCssName('wtfAppUiMainEmpty')),
      !documentView);

  if (documentView) {
    // TODO(benvanik): notify of change?
    this.documentView_ = documentView;
  }
};


/**
 * Sets up a new document view for the given document and switches to it.
 * @param {!wtf.doc.Document} doc Document.
 */
wtf.app.ui.MainDisplay.prototype.openDocument = function(doc) {
  this.setDocumentView(null);
  var documentView = new wtf.app.ui.DocumentView(
      this.getChildElement(goog.getCssName('wtfAppUiMainDocumentView')),
      this.getDom(),
      doc);
  this.setDocumentView(documentView);
};


/**
 * Handles channel messages from the parent window.
 * @param {!Object} data Incoming data.
 * @private
 */
wtf.app.ui.MainDisplay.prototype.channelMessage_ = function(data) {
  switch (data['command']) {
    case 'snapshot':
      this.handleSnapshotCommand_(data);
      break;
    case 'stream_created':
      this.handleStreamCreatedCommand_(data);
      break;
    case 'stream_appended':
      this.handleStreamAppendedCommand_(data);
      break;
  }
};


/**
 * Handles snapshot IPC commands.
 * @param {!Object} data Command data.
 * @private
 */
wtf.app.ui.MainDisplay.prototype.handleSnapshotCommand_ = function(data) {
  var contentType = data['content_type'];
  var datas = data['contents'];

  if (!datas.length) {
    return;
  }

  // Convert data from Arrays to ensure we are typed all the way through.
  for (var n = 0; n < datas.length; n++) {
    if (!(datas[n] instanceof Uint8Array)) {
      datas[n] = wtf.io.createByteArrayFromArray(datas[n]);
    }
  }

  // Create document with snapshot data.
  var doc = new wtf.doc.Document(this.platform_);
  this.openDocument(doc);

  // Append data after a bit - gives the UI time to setup.
  wtf.timing.setImmediate(function() {
    for (var n = 0; n < datas.length; n++) {
      doc.addBinaryEventSource(datas[n]);
    }

    // Zoom to fit.
    // TODO(benvanik): remove setTimeout when zoomToFit is based on view
    wtf.timing.setTimeout(50, function() {
      this.documentView_.zoomToFit();
    }, this);
  }, this);
};


/**
 * Handles stream create IPC commands.
 * @param {!Object} data Command data.
 * @private
 */
wtf.app.ui.MainDisplay.prototype.handleStreamCreatedCommand_ = function(data) {
  var sessionId = data['session_id'];
  var streamId = data['stream_id'] || '0';
  var contentType = data['content_type'];

  // TODO(benvanik): support multiple streams into the same trace/etc
  var doc = new wtf.doc.Document(this.platform_);
  this.openDocument(doc);
  doc.beginEventStream(streamId, contentType);
};


/**
 * Handles stream append IPC commands.
 * @param {!Object} data Command data.
 * @private
 */
wtf.app.ui.MainDisplay.prototype.handleStreamAppendedCommand_ = function(data) {
  var sessionId = data['session_id'];
  var streamId = data['stream_id'] || '0';
  var datas = data['contents'];

  // Note that if this is not the right document the data is ignored.
  if (this.documentView_) {
    var doc = this.documentView_.getDocument();
    if (!doc.appendEventStreamData(streamId, datas)) {
      return;
    }
  }
};


/**
 * Requests a load of a trace file.
 */
wtf.app.ui.MainDisplay.prototype.requestTraceLoad = function() {
  var dom = this.getDom();
  var inputElement = dom.createElement(goog.dom.TagName.INPUT);
  inputElement['type'] = 'file';
  inputElement['multiple'] = true;
  inputElement['accept'] = [
    '.wtf-trace,application/x-extension-wtf-trace',
    '.wtf-json,application/x-extension-wtf-json',
    '.part,application/x-extension-part'
  ].join(',');
  inputElement.click();
  goog.events.listenOnce(inputElement, goog.events.EventType.CHANGE,
      function(e) {
        this.loadTraceFiles(inputElement.files);
      }, false, this);
};


/**
 * Loads a list of trace files.
 * Multiple files are merged into a single trace session. The name will be
 * based on the first file found.
 * @param {!Array.<!File>} traceFiles Files to load.
 */
wtf.app.ui.MainDisplay.prototype.loadTraceFiles = function(traceFiles) {
  var binarySources = [];
  var jsonSources = [];
  for (var n = 0; n < traceFiles.length; n++) {
    var file = traceFiles[n];
    if (goog.string.endsWith(file.name, '.wtf-trace') ||
        goog.string.endsWith(file.name, '.bin.part') ||
        file.type == 'application/x-extension-wtf-trace') {
      binarySources.push(file);
    } else if (goog.string.endsWith(file.name, '.wtf-json') ||
        file.type == 'application/x-extension-wtf-json') {
      jsonSources.push(file);
    }
  }
  if (!binarySources.length && !jsonSources.length) {
    return;
  }

  var name = '';
  if (binarySources.length) {
    name = binarySources[0].name;
  } else {
    name = jsonSources[0].name;
  }

  var doc = new wtf.doc.Document(this.platform_);
  this.openDocument(doc);

  // Add all sources to the trace.
  // TODO(benvanik): move into wtf.analysis?
  var deferreds = [];
  for (var n = 0; n < binarySources.length; n++) {
    deferreds.push(goog.fs.FileReader.readAsArrayBuffer(binarySources[n]));
  }
  for (var n = 0; n < jsonSources.length; n++) {
    deferreds.push(goog.fs.FileReader.readAsText(jsonSources[n]));
  }
  goog.async.DeferredList.gatherResults(deferreds).addCallbacks(
      function(datas) {
        // Add all data.
        for (var n = 0; n < datas.length; n++) {
          var data = datas[n];
          if (data instanceof ArrayBuffer) {
            doc.addBinaryEventSource(new Uint8Array(data));
          } else if (goog.isString(data)) {
            doc.addJsonEventSource(data);
          }
        }

        // Zoom to fit.
        // TODO(benvanik): remove setTimeout when zoomToFit is based on view
        wtf.timing.setTimeout(50, function() {
          this.documentView_.zoomToFit();
        }, this);
      },
      function(arg) {
        // TODO(benvanik): handle errors better
        window.alert('Unable to load files');
      }, this);
};


/**
 * Loads a trace file by url.
 * @param {!string} url Resource to load.
 */
wtf.app.ui.MainDisplay.prototype.loadNetworkTrace = function(url) {
  var doc = new wtf.doc.Document(this.platform_);
  this.openDocument(doc);

  var responseType = goog.net.XhrIo.ResponseType.ARRAY_BUFFER;
  if (goog.string.endsWith(url, '.wtf-trace') ||
      goog.string.endsWith(url, '.bin.part')) {
    responseType = goog.net.XhrIo.ResponseType.ARRAY_BUFFER;
  } else if (goog.string.endsWith(url, '.wtf-json')) {
    responseType = goog.net.XhrIo.ResponseType.TEXT;
  }

  var xhr = new goog.net.XhrIo();
  xhr.setResponseType(responseType);
  goog.events.listen(xhr, goog.net.EventType.COMPLETE, function() {
    var success = xhr.isSuccess();
    if (!success) {
      window.alert('Unable to load url: ' + url);
      return;
    }
    var data = xhr.getResponse();
    goog.asserts.assert(data);

    // Add data.
    if (data instanceof ArrayBuffer) {
      doc.addBinaryEventSource(
          new Uint8Array(/** @type {ArrayBuffer} */ (data)));
    } else {
      doc.addJsonEventSource(
          /** @type {string} */ (data));
    }

    // Zoom to fit.
    // TODO(benvanik): remove setTimeout when zoomToFit is based on view
    wtf.timing.setTimeout(50, function() {
      this.documentView_.zoomToFit();
    }, this);
  }, false, this);
  xhr.send(url);
};


/**
 * Saves the current trace document, if any.
 * @private
 */
wtf.app.ui.MainDisplay.prototype.saveTrace_ = function() {
  if (!this.documentView_) {
    return;
  }

  var doc = this.documentView_.getDocument();
  var db = doc.getDatabase();
  var sources = db.getSources();
  if (!sources.length) {
    return;
  }
  // Just pick the first source for naming.
  var contextInfo = sources[0];
  var filename = contextInfo.getFilename();

  // prefix-YYYY-MM-DDTHH-MM-SS
  var dt = new Date();
  var filenameSuffix = '-' +
      dt.getFullYear() +
      goog.string.padNumber(dt.getMonth() + 1, 2) +
      goog.string.padNumber(dt.getDate(), 2) + 'T' +
      goog.string.padNumber(dt.getHours(), 2) +
      goog.string.padNumber(dt.getMinutes(), 2) +
      goog.string.padNumber(dt.getSeconds(), 2);
  filename += filenameSuffix;

  var storage = doc.getStorage();
  var dataStreams = storage.snapshotDataStreamBuffers();
  for (var n = 0; n < dataStreams.length; n++) {
    var dataStream = dataStreams[n];
    var streamFilename = filename;
    if (dataStreams.length > 1) {
      streamFilename += '-' + n;
    }
    switch (dataStream.type) {
      case 'application/x-extension-wtf-trace':
        streamFilename += wtf.io.FILE_EXTENSION;
        break;
    }
    var platform = wtf.pal.getPlatform();
    platform.writeBinaryFile(streamFilename, dataStream.data, dataStream.type);
  }
};


/**
 * Shares the current trace document, if any.
 * @private
 */
wtf.app.ui.MainDisplay.prototype.shareTrace_ = function() {
  if (!this.documentView_) {
    return;
  }

  // TODO(benvanik): share trace.
};


/**
 * Shows the settings dialog.
 * @private
 */
wtf.app.ui.MainDisplay.prototype.showSettings_ = function() {
  // TODO(benvanik): show a settings dialog.
};


/**
 * Toggles the display of the help overlay.
 * @private
 */
wtf.app.ui.MainDisplay.prototype.toggleHelpOverlay_ = function() {
  // Close existing help dialog (only).
  if (this.activeDialog_) {
    if (this.activeDialog_ instanceof wtf.app.ui.HelpOverlay) {
      goog.dispose(this.activeDialog_);
      this.activeDialog_ = null;
    }
    return;
  }

  // Show help dialog.
  var body = this.getDom().getDocument().body;
  goog.asserts.assert(body);
  this.activeDialog_ = new wtf.app.ui.HelpOverlay(
      body,
      this.getDom());
  this.activeDialog_.addListener(wtf.ui.Dialog.EventType.CLOSED, function() {
    this.activeDialog_ = null;
  }, this);
};
