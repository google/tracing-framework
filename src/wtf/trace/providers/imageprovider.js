/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Image event provider.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.providers.ImageProvider');

goog.require('wtf.trace.Provider');
goog.require('wtf.trace.eventtarget');



/**
 * Provides Image API events.
 *
 * @param {!wtf.util.Options} options Options.
 * @constructor
 * @extends {wtf.trace.Provider}
 */
wtf.trace.providers.ImageProvider = function(options) {
  goog.base(this, options);

  if (!goog.global['Image']) {
    return;
  }

  var level = options.getNumber('wtf.trace.provider.image', 1);
  if (!level) {
    return;
  }

  this.injectImage_();
};
goog.inherits(wtf.trace.providers.ImageProvider, wtf.trace.Provider);


/**
 * @override
 */
wtf.trace.providers.ImageProvider.prototype.getSettingsSectionConfigs =
    function() {
  return [
    {
      'title': 'Images',
      'widgets': [
        {
          'type': 'checkbox',
          'key': 'wtf.trace.provider.image',
          'title': 'Enabled',
          'default': true
        }
      ]
    }
  ];
};


/**
 * Injects the Image shim.
 * @private
 */
wtf.trace.providers.ImageProvider.prototype.injectImage_ = function() {
  // var originalImage = goog.global['Image'];

  // TODO(benvanik): inject both Image and HTMLImageElement

  // TODO(benvanik): full proxy
  var proto = Image.prototype;
  var obj = new Image();

  // Find all 'on' event names.
  // First try the object and if that fails try the prototype.
  var eventNames = wtf.trace.eventtarget.getEventNames(obj);
  if (!eventNames.length) {
    eventNames = wtf.trace.eventtarget.getEventNames(proto);
  }

  // Get all event types from the IDL store.
  // This will be a map of event name to the {@code EVENT_TYPES} objects.
  // NOTE: disabled full events until Issue #365.
  // var eventTypes = wtf.data.webidl.getAllEvents(
  //     'HTMLImageElement', eventNames);
  var eventTypes = {};
  for (var n = 0; n < eventNames.length; n++) {
    eventTypes[eventNames[n]] = null;
  }

  // Create a descriptor object.
  var descriptor = wtf.trace.eventtarget.createDescriptor(
      'Image', eventTypes);

  // Stash the descriptor. It may be used by the hookDomEvents util.
  wtf.trace.eventtarget.setDescriptor(proto, descriptor);

  // Mixin EventTarget methods.
  wtf.trace.eventtarget.mixin(descriptor, proto);

  // Hook on* event properties (if possible).
  wtf.trace.eventtarget.setEventProperties(descriptor, proto);
};
