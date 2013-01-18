/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Tracing browser entry point.
 * Exports some utility functions for browser applications.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.trace.browser');

goog.require('wtf');
goog.require('wtf.trace.TraceManager');
goog.require('wtf.trace.providers.BrowserProvider');


if (!wtf.NODE) {
  /**
   * Gets the browser info provider, if found.
   * @return {wtf.trace.providers.BrowserProvider} Browser info provider if
   *     available.
   * @private
   */
  wtf.trace.browser.getBrowserProvider_ = function() {
    var traceManager = wtf.trace.TraceManager.getSharedInstance();
    var providers = traceManager.getProviders();
    var provider = null;
    for (var n = 0; n < providers.length; n++) {
      if (providers[n] instanceof wtf.trace.providers.BrowserProvider) {
        return /** @type {wtf.trace.providers.BrowserProvider} */ (
            providers[n]);
      }
    }
    return null;
  };


  /**
 * Gets a value indicating whether chrome:tracing functionality is available.
 * @return {boolean} True if chrome:tracing can be used.
 */
  wtf.trace.browser.hasChromeTracing = function() {
    var provider = wtf.trace.browser.getBrowserProvider_();
    return !!provider && provider.hasChromeTracing();
  };

  /**
   * Starts capturing chrome:tracing data.
   * Only call this method if {@see #checkChromeTracingAvailable} has returned
   * true.
   */
  wtf.trace.browser.startChromeTracing = function() {
    var provider = wtf.trace.browser.getBrowserProvider_();
    provider.startChromeTracing();
  };

  /**
   * Stops capturing chrome:tracing data and asynchronously returns the result.
   * Only call this method if {@see #checkChromeTracingAvailable} has returned
   * true.
   * @param {function(this:T, string)} callback Callback. Receives the tracing
   *     data JSON as an unparsed string.
   * @param {T=} opt_scope Callback scope.
   * @template T
   */
  wtf.trace.browser.stopChromeTracing = function(callback, opt_scope) {
    var provider = wtf.trace.browser.getBrowserProvider_();
    provider.stopChromeTracing(callback, opt_scope);
  };


  goog.exportSymbol(
      'wtf.trace.browser.hasChromeTracing',
      wtf.trace.browser.hasChromeTracing);
  goog.exportSymbol(
      'wtf.trace.browser.startChromeTracing',
      wtf.trace.browser.startChromeTracing);
  goog.exportSymbol(
      'wtf.trace.browser.stopChromeTracing',
      wtf.trace.browser.stopChromeTracing);
}
