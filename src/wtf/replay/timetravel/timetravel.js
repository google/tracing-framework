/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Time travel main namespace.
 *
 * Replay works by including the WTF JS on a page and calling the setup method
 * with a saved database. A popup will be opened that allows the user to drive
 * the interactions on the page without interfering with page actions.
 *
 * There are several hacky things that must be done to get this to work
 * correctly:
 * - Any seeking backwards requires a page reload.
 * - The database must be loaded before any user code is executed.
 * - The user cannot be allowed to send events to the page (mousemove/etc).
 *
 * To accomplish this a popup is used to load and store persistent state such
 * as the database. When the host page loads it looks for an existing popup and
 * if it is found the state is grabbed from that synchronously. If the popup
 * is not found, it's created and told to load things. Since there's no way to
 * prevent user javascript from executing during this process the host page
 * is reloaded once the database load has completed. On that next load the
 * database is there and things can progress as needed.
 *
 * To prevent the user from interacting with the page we capture and cancel all
 * non-replay generated events on the document. There's a chance that events
 * could leak around this and if we detect that we warn.
 *
 * The popup controller window needs to outlive the page due to these reloads.
 * To prevent weirdness with objects being retained across reloads, the entire
 * WTF JS is loaded into the popup when it's opened and objects are only shared
 * from the popup into the page (for example, the persistent state).
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.replay.timeTravel');

goog.require('wtf.replay.timeTravel.ReplaySession');


/**
 * Current replay session, if any.
 * @type {wtf.replay.timeTravel.ReplaySession}
 * @private
 */
wtf.replay.timeTravel.session_ = null;


/**
 * Sets up a time travel replay session in the current window.
 * This must be called immediately upon document creation to ensure no user code
 * executes before setup has completed.
 * This will open a popup window to allow the user to control the replay. If the
 * popup window exists it will be reused.
 *
 * @param {string} databasePath Path or URL to the WTF trace file.
 * @param {Object=} opt_options Replay options.
 */
wtf.replay.timeTravel.setup = function(databasePath, opt_options) {
  var session = wtf.replay.timeTravel.session_;
  if (session) {
    // Reuse the existing session if the options match.
    if (session.canReuse(databasePath, opt_options)) {
      // Reusable - done.
      session.prepareReuse();
      return;
    }

    // Destroy the old, unusable session.
    goog.dispose(session);
    wtf.replay.timeTravel.session_ = session = null;
  }

  // Create the session.
  session = new wtf.replay.timeTravel.ReplaySession(
      databasePath, opt_options);
  wtf.replay.timeTravel.session_ = session;

  // Prepare the session for use.
  // This may kick off loading/etc.
  session.prepareFirstUse();
};


goog.exportSymbol(
    'wtf.replay.timeTravel.setup',
    wtf.replay.timeTravel.setup);
