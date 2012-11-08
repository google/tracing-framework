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

goog.require('goog.async.DeferredList');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.fs.FileReader');
goog.require('goog.soy');
goog.require('goog.string');
goog.require('goog.style');
goog.require('wtf.app.ui.DocumentView');
goog.require('wtf.app.ui.maindisplay');
goog.require('wtf.doc.Document');
goog.require('wtf.events.Keyboard');
goog.require('wtf.events.KeyboardScope');
goog.require('wtf.ipc');
goog.require('wtf.ipc.Channel');
goog.require('wtf.ui.Control');



/**
 * Main WTF UI.
 * Manages the main UI (menus/etc), active traces (and their trace views), etc.
 *
 * @param {!Object} options Options overrides.
 * @param {Element=} opt_parentElement Element to display in.
 * @param {goog.dom.DomHelper=} opt_dom DOM helper.
 * @constructor
 * @extends {wtf.ui.Control}
 */
wtf.app.ui.MainDisplay = function(options, opt_parentElement, opt_dom) {
  var dom = opt_dom || goog.dom.getDomHelper(opt_parentElement);
  var parentElement = /** @type {!Element} */ (
      opt_parentElement || dom.getDocument().body);
  goog.base(this, parentElement, dom);

  /**
   * Options overrides.
   * @type {!Object}
   * @private
   */
  this.options_ = options;

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

  // Setup keyboard shortcuts.
  var keyboard = wtf.events.Keyboard.getWindowKeyboard(dom.getWindow());
  var keyboardScope = new wtf.events.KeyboardScope(keyboard);
  this.registerDisposable(keyboardScope);
  keyboardScope.addShortcut('ctrl+o', this.requestTraceLoad, this);

  this.setupDragDropLoading_();
};
goog.inherits(wtf.app.ui.MainDisplay, wtf.ui.Control);


/**
 * @override
 */
wtf.app.ui.MainDisplay.prototype.disposeInternal = function() {
  goog.dom.removeNode(this.getRootElement());
  this.setDocumentView(null);
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

  var doc = new wtf.doc.Document();
  this.openDocument(doc);
  for (var n = 0; n < datas.length; n++) {
    doc.addBinaryEventSource(datas[n]);
  }
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
  var doc = new wtf.doc.Document();
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
  inputElement['accept'] = '.wtf-trace,application/x-extension-wtf-trace';
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
  var sources = [];
  for (var n = 0; n < traceFiles.length; n++) {
    var file = traceFiles[n];
    if (goog.string.endsWith(file.name, '.wtf-trace') ||
        file.type == 'application/x-extension-wtf-trace') {
      sources.push(file);
    }
  }
  if (!sources.length) {
    return;
  }

  var name = sources[0].name;

  var doc = new wtf.doc.Document();
  this.openDocument(doc);

  // Add all sources to the trace.
  // TODO(benvanik): move into wtf.analysis?
  var deferreds = [];
  for (var n = 0; n < sources.length; n++) {
    deferreds.push(goog.fs.FileReader.readAsArrayBuffer(sources[n]));
  }
  goog.async.DeferredList.gatherResults(deferreds).addCallbacks(
      function(datas) {
        for (var n = 0; n < datas.length; n++) {
          var data = datas[n];
          doc.addBinaryEventSource(new Uint8Array(data));
        }
      },
      function(arg) {
        // TODO(benvanik): handle errors better
        window.alert('Unable to load files');
      }, this);
};
