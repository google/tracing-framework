/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

goog.provide('wtf.replay.graphics.Session_test');

goog.require('goog.dom.DomHelper');
goog.require('wtf.db.Database');
goog.require('wtf.replay.graphics.Session');


/**
 * wtf.replay.graphics.Session testing.
 */
wtf.replay.graphics.Session_test = suite(
    'wtf.replay.graphics.Session', function() {
      test('#ctor', function() {
        // Only run this test if the DOM exists.
        if (!window || !window.document) {
          return;
        }

        var db = new wtf.db.Database();
        var domHelper = new goog.dom.DomHelper();
        var parentElement = domHelper.createElement('div');
        domHelper.appendChild(domHelper.getDocument().body, parentElement);
        var session = new wtf.replay.graphics.Session(
            db, parentElement, domHelper);
        assert.isNotNull(session);
        assert.isTrue(domHelper.getChildren(parentElement).length > 0);

        goog.dispose(db);
        goog.dispose(session);

        // The parent element should have no children now.
        assert.equal(domHelper.getChildren(parentElement).length, 0);
      });
    });
