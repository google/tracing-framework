#!/usr/bin/env node
/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Instrumentation tool.
 * Manually instruments code for producing wtf-calls files, or runs as a proxy
 * to instrument code on the fly.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

var child_process = require('child_process');
var fs = require('fs');
var http = require('http');
var https = require('https');
var optimist = require('optimist');
var os = require('os');
var path = require('path');
var querystring = require('querystring');
var url = require('url');
var hash = require('string-hash');
var vm = require('vm');

var falafel = require('falafel');

/**
 * Maps hash-keys to a mapping from source code to transformed code.
 * @type {!Object.<string, !Object.<string, string>}
 */
var transformMap = {}


var ctx = {
  'ENABLE_LOGGING': true,
  'wtfi': {
    'falafel': falafel
  }
};
var processScriptPath = 'extensions/wtf-injector-chrome/wtf-process.js';
vm.runInNewContext(fs.readFileSync(processScriptPath), ctx, processScriptPath);
var processScript = ctx['wtfi']['process'];


/**
 * Transforms JavaScript source code into a instrumented version.
 * @param {number} moduleId Module ID, [0-126].
 * @param {string} url URL of the source code.
 * @param {string} sourceCode Source code.
 * @param {!Object} argv Parsed arguments.
 * @return {string} Transformed code.
 */
function transformCode(moduleId, url, sourceCode, argv) {
  console.log('Instrumenting ' + url + ' (' + sourceCode.length + 'b)...');
  var startTime = Date.now();

  var key = hash(sourceCode);
  if (key in transformMap) {
    var transformBucket = transformMap[key];
    if (sourceCode in transformBucket) {
      var endTime = Date.now() - startTime;
      console.log('  ' + endTime + 'ms (Cached)');
      return transformBucket[sourceCode];
    }
  } else {
    transformMap[key] = {};
  }

  var instrumentationType = argv['type'];
  if (argv['track-calls']) {
    instrumentationType = 'calls';
  } else if (argv['track-memory']) {
    instrumentationType = 'memory';
  } else if (argv['track-time']) {
    instrumentationType = 'time';
  }

  // This code is stringified and then embedded in each output file.
  // It's ok if multiple are present on the page.
  // It cannot capture any state.
  // TODO(benvanik): clean up, make support nodejs too.
  // TODO(benvanik): put in an external file, have a HUD, etc.
  var sharedInitCode = '(' + (function(global, instrumentationType) {
    // Add a global tag to let WTF know we are on the page. The extension can
    // then yell at the user for trying to use both at the same time.
    var firstBlock = !global.__wtfInstrumentationPresent;
    global.__wtfInstrumentationPresent = true;

    // Add a big warning div to let users know the proxy is active.
    // This is useful for when the proxy is accidentally left enabled.
    if (firstBlock) {
      var div = document.createElement('div');
      div.style.zIndex = 999999;
      div.style.position = 'fixed';
      div.style.left = '50%';
      div.style.top = 0;
      div.style.backgroundColor = 'red';
      div.style.color = 'white';
      div.style.font = '8pt monospace';
      div.style.padding = '3px';
      div.style.userSelect = 'none';
      div.style.webkitUserSelect = 'none';
      div.innerHTML = 'WTF INSTRUMENTATION ENABLED';
      if (document.body) {
        document.body.appendChild(div);
      } else {
        document.addEventListener('DOMContentLoaded', function() {
          document.body.appendChild(div);
        }, false);
      }

      // Check to see if WTF is active on the page.
      // The user shouldn't be trying to trace and instrument at the same time.
      if (global['wtf']) {
        div.innerHTML = 'You must disable WTF to run with instrumentation';
        window.alert('The WTF tracing feature cannot be used on ' +
            'instrumented code. Disable instrumentation and try again.');
      }

      // Add helper buttons.
      var innerDiv = document.createElement('div');
      div.appendChild(innerDiv);
      function addButton(name, tip, code) {
        var a = document.createElement('a');
        a.innerHTML = name;
        a.title = tip;
        a.href = 'javascript:' + code;
        a.style.marginRight = '5px';
        a.style.color = 'white';
        a.style.textDecoration = 'underline';
        innerDiv.appendChild(a);
      };
      addButton('Clear', 'Clear current trace data.', '__resetTrace()');
      addButton('Save', 'Save the trace to a file.', '__saveTrace()');
      addButton('Show', 'Show the trace in the WTF UI.', '__showTrace()');
    }

    var dataMagnitude = 26; // 2^26 = 67 million records
    var dataSize = 1 << dataMagnitude;
    var dataMask = dataSize - 1;
    global.__wtfm = global.__wtfm || {};
    global.__wtfd = global.__wtfd || new Int32Array(1 << dataMagnitude);
    global.__wtfi = global.__wtfi || 0;
    switch (instrumentationType) {
    default:
    case 'calls':
      global.__wtfEnter = function(id) {
        __wtfd[__wtfi++ & dataMask] = id;
      };
      global.__wtfExit = function(id) {
        __wtfd[__wtfi++ & dataMask] = -id;
      };
      break;
    case 'memory':
      var getHeapUsage = null;
      try {
        getHeapUsage = new Function('return %GetHeapUsage()');
      } catch (e) {
        window.alert('Launch Chrome with --js-flags=--allow-natives-syntax');
      }
      global.__wtfEnter = function(id) {
        __wtfd[__wtfi++ & dataMask] = id;
        __wtfd[__wtfi++ & dataMask] = getHeapUsage();
      };
      global.__wtfExit = function(id) {
        __wtfd[__wtfi++ & dataMask] = -id;
        __wtfd[__wtfi++ & dataMask] = getHeapUsage();
      };
      break;
    case 'time':
      global.__wtfEnter = function(id) {
        __wtfd[__wtfi++ & dataMask] = id;
        __wtfd[__wtfi++ & dataMask] = targetWindow.performance.now() * 1000;
      };
      global.__wtfExit = function(id) {
        __wtfd[__wtfi++ & dataMask] = -id;
        __wtfd[__wtfi++ & dataMask] = targetWindow.performance.now() * 1000;
      };
      break;
    }
    global.__wtfw = function(__wtfb, f) {
      f['__src'] = __wtfb;
      return f;
    };
    global.__resetTrace = function() {
      global.__wtfi = 0;
    };
    global.__grabTrace = function() {
      var euri = window.location.href;
      var etitle =
          window.document.title.replace(/\\/g, '\\\\').replace(/\"/g, '\\"');
      var attributes = '[]';
      switch (instrumentationType) {
      default:
      case 'calls':
        break;
      case 'memory':
        attributes = '[{"name": "heapSize", "units": "bytes"}]';
        break;
      case 'time':
        attributes = '[{"name": "time", "units": "us"}]';
        break;
      }
      var headerText = '{' +
          '"version": 1,' +
          '"context": {"uri": "' + euri + '", "title": "' + etitle + '"},' +
          '"metadata": {' +
          '  "attributes": ' + attributes +
          '},' +
          '"modules": ' + JSON.stringify(global.__wtfm) + '}';
      var headerLength = headerText.length;
      var header = new Uint8Array(4 + headerLength);
      header[0] = (headerLength) & 0xFF;
      header[1] = (headerLength >>> 8) & 0xFF;
      header[2] = (headerLength >>> 16) & 0xFF;
      header[3] = (headerLength >>> 24) & 0xFF;
      for (var n = 0; n < headerLength; n++) {
        header[4 + n] = headerText.charCodeAt(n) & 0xFF;
      }

      var padLength = 0;
      var i = 4 + headerLength;
      if (i % 4) {
        padLength = 4 - (i % 4);
      }
      var padBytes = new Uint8Array(padLength);

      var contents = new Uint8Array(global.__wtfd.buffer);
      contents = contents.subarray(0, global.__wtfi * 4);

      return [
        header,
        padBytes,
        contents
      ];
    };
    global.__showTrace = function() {
      // Grab trace data and combine into a single buffer.
      var buffers = global.__grabTrace();
      var totalLength = 0;
      for (var n = 0; n < buffers.length; n++) {
        totalLength += buffers[n].length;
      }
      var buffer = new Uint8Array(totalLength);
      for (var n = 0, o = 0; n < buffers.length; n++) {
        var sourceBuffer = buffers[n];
        for (var m = 0; m < sourceBuffer.length; m++) {
          buffer[o + m] = sourceBuffer[m];
        }
        o += sourceBuffer.length;
      }

      var boundHandler = function(e) {
        if (e.data && e.data['wtf_ipc_connect_token'] &&
            e.data.data && e.data.data['hello'] == true) {
          e.stopPropagation();
          window.removeEventListener('message', boundHandler, true);

          e.source.postMessage({
            'wtf_ipc_connect_token': true,
            'data': {
              'command': 'snapshot',
              'content_types': ['application/x-extension-wtf-calls'],
              'content_sources': [Date.now() + '.wtf-calls'],
              'content_buffers': [buffer],
              'content_length': totalLength
            }
          }, '*');
        }
      };
      window.addEventListener('message', boundHandler, true);
      var uiUrl =
          'http://google.github.com/tracing-framework/bin/app/maindisplay.html';
          //'http://localhost:8080/app/maindisplay-debug.html';
          //'http://localhost:8080/app/maindisplay.html';
      window.open(uiUrl + '?expect_data', '_blank');
    };
    global.__saveTrace = function(opt_filename) {
      // Grab trace blob URL.
      var buffers = global.__grabTrace();

      // Some arbitrary combo of types can cause Chrome to sad tab. Converting
      // buffers to blobs may prevent this.
      // TODO(chihuahua): Remove this patch once this is resolved:
      // https://bugs.chromium.org/p/chromium/issues/detail?id=619217
      var parts = buffers.map(function(buffer) {
        return buffer instanceof Blob ? buffer : new Blob([buffer]);
      });

      var blob = new Blob(parts, {
        type: 'application/octet-stream'
      });
      var url = URL.createObjectURL(blob);

      // Fake a download.
      var a = document.createElement('a');
      a.download = opt_filename || (Date.now() + '.wtf-calls');
      a.href = url;
      var e = document.createEvent('MouseEvents');
      e.initMouseEvent(
          'click',
          true, false, window, 0, 0, 0, 0, 0,
          false, false, false, false, 0, null);
      a.dispatchEvent(e);
    };
  }).toString() + ')(window, \"' + instrumentationType + '\");';

  var options = {
    'type': instrumentationType,
    'moduleId': moduleId,
    'ignore': argv['ignore'],
    'ignore-pattern': argv['ignore-regexp'],
    'sourcePrefix': sharedInitCode,
  };

  var transformedCode = processScript(sourceCode, options, url);

  transformMap[key][sourceCode] = transformedCode;
  return transformedCode;
};


/**
 * Processes a single input file.
 * @param {!Object} argv Parsed arguments.
 * @param {string} inputPath Input file path.
 * @param {string=} opt_outputPath Output file path.
 */
function processFile(argv, inputPath, opt_outputPath) {
  // Setup output path.
  var outputPath = opt_outputPath;
  if (!opt_outputPath) {
    var ext = path.extname(inputPath);
    if (ext.length) {
      outputPath = inputPath.substr(0, inputPath.length - ext.length) +
          '.instrumented' + ext;
    } else {
      outputPath = inputPath + '.instrumented.js';
    }
  }

  var sourceCode = fs.readFileSync(inputPath).toString();

  // TODO(benvanik): support setting the module ID?
  var targetCode = transformCode(0, inputPath, sourceCode, argv);

  console.log('Writing ' + outputPath + '...');
  fs.writeFileSync(outputPath, targetCode);
  fs.chmodSync(outputPath, fs.statSync(inputPath).mode);
};


/**
 * Launches a proxy server.
 * @param {!Object} argv Parsed arguments.
 * @param {number} httpPort HTTP port.
 * @param {number} httpsPort HTTPS port.
 * @param {{privateKey: string, certificate: string}} certs Certificates.
 */
function startServer(argv, httpPort, httpsPort, certs) {
  console.log('Launching proxy server...');
  console.log('   http: ' + httpPort);
  console.log('  https: ' + httpsPort);

  // Injects a node stream by buffering all data, transforming it, and writing
  // it back out.
  // Module IDs are assigned on demand and rotate 0-126.
  var nextModuleId = 0;
  function injectStream(url, source, target) {
    var moduleId = nextModuleId++;
    if (nextModuleId >= 127) {
      nextModuleId = 0;
    }
    var sourceCode = '';
    source.on('data', function(chunk) {
      sourceCode += chunk;
    });
    source.on('end', function() {
      try {
        var targetCode = transformCode(moduleId, url, sourceCode, argv);
        target.end(targetCode);
      } catch (e) {
        console.log('Error during transformation, writing through.');
        console.log(e);
        target.end(sourceCode);
      }
    });
  };

  // Handles both HTTP and HTTPS requests.
  function handler(req, res) {
    // Support both the ?url= mode and the X-WTF-URL header.
    var targetUrl;
    if (req.headers['x-wtf-url']) {
      targetUrl = req.headers['x-wtf-url'];
    } else {
      var parsedUrl = url.parse(req.url, true);
      var query = parsedUrl.query;
      targetUrl = query.url;
    }
    if (!targetUrl || targetUrl.indexOf('http') != 0) {
      res.writeHead(404, ['Content-Type', 'text/plain']);
      res.end();
      return;
    }

    res.on('error', function(e) {
      console.log('ERROR (source): ' + e);
    });

    var targetModule = targetUrl.indexOf('https') == 0 ? https : http;
    targetModule.get(targetUrl, function(originalRes) {
      // Eat errors, otherwise the app will die.
      originalRes.on('error', function(e) {
        console.log('ERROR (target): ' + e);
      });

      // Pull out content type to see if we are interested in it.
      var supportedContentType = false;
      var contentType = originalRes.headers['content-type'];
      if (contentType && contentType.indexOf(';') != 0) {
        contentType = contentType.substr(0, contentType.indexOf(';'));
      }
      switch (contentType) {
        case 'text/javascript':
        case 'application/javascript':
          supportedContentType = true;
          break;
      }

      // Also parse the URL - some servers don't return content type for some
      // reason.
      var supportedPath = false;
      var contentUrl = url.parse(targetUrl);
      if (path.extname(contentUrl.pathname) == '.js') {
        supportedPath = true;
      }

      if (supportedContentType || supportedPath) {
        var headers = [];
        for (var key in originalRes.headers) {
          if (key == 'content-length') {
            continue;
          }
          headers.push([key, originalRes.headers[key]]);
        }
        res.writeHead(originalRes.statusCode, headers);
        injectStream(targetUrl, originalRes, res);
      } else {
        console.log('Pass-through: ' + targetUrl, contentType);
        res.writeHead(originalRes.statusCode, originalRes.headers);
        originalRes.pipe(res);
      }
    }).on('error', function(e) {
      console.log(e);
      res.writeHead(404, ['Content-Type', 'text/plain']);
      res.end(e.message);
    });
  };

  // HTTP server.
  var httpServer = http.createServer(handler);
  httpServer.listen(httpPort);

  // HTTPS server.
  var httpsServer = https.createServer({
    key: certs.privateKey,
    cert: certs.certificate
  }, handler);
  httpsServer.listen(httpsPort);

  console.log('Server ready, use ctrl-c to exit...');
  console.log('');
};


/**
 * Either loads or generates the HTTPS certs/keys.
 * @param {function({privateKey: string, certificate: string})} callback
 *     Callback that receives the certs.
 */
function getHttpsCerts(callback) {
  // Certs are stored under a tmp path, ensure it exists.
  var certPath = path.join(os.tmpDir(), 'wtf-instrument-certs');
  if (!fs.existsSync(certPath)) {
    fs.mkdirSync(certPath);
  }
  var cnfPath = path.join(certPath, 'openssl.cnf');
  var privateKeyPath = path.join(certPath, 'privatekey.pem');
  var certRequestPath = path.join(certPath, 'certrequest.csr');
  var certificatePath = path.join(certPath, 'certificate.pem');

  // If the cert files are not found, create them.
  if (!fs.existsSync(path.join(certPath, 'privatekey.pem'))) {
    console.log('Generating new HTTPS certs...');
    // openssl genrsa -out privatekey.pem 1024
    // openssl req -new -key privatekey.pem -out certrequest.csr
    // openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem

    // Note that to do this sliently we need to write this conf file.
    fs.writeFileSync(cnfPath, [
      '[req]',
      'prompt = no',
      'distinguished_name = req_distinguished_name',
      '[req_distinguished_name]',
      'C = GB',
      'ST = Test State',
      'L = Test Locality',
      'O = Org Name',
      'OU = Org Unit Name',
      'CN = Common Name',
      'emailAddress = test@email.com'
    ].join('\n'));

    child_process.exec([
      'openssl genrsa -out ' + privateKeyPath + ' 1024',
      'openssl req -config ' + cnfPath + ' -new -key ' + privateKeyPath + ' -out ' + certRequestPath,
      'openssl x509 -req -in ' + certRequestPath + ' -signkey ' + privateKeyPath + ' -out ' + certificatePath,
    ].join(' && '), function(error, stdout, stderr) {
      readCerts();
    });
  } else {
    readCerts();
  }

  function readCerts() {
    var privateKey = fs.readFileSync(
        path.join(certPath, 'privatekey.pem')).toString();
    var certificate = fs.readFileSync(
        path.join(certPath, 'certificate.pem')).toString();
    callback({
      privateKey: privateKey,
      certificate: certificate
    });
  };
};


function main(argv) {
  if (argv['server']) {
    // TODO(benvanik): read ports from args/etc
    getHttpsCerts(function(certs) {
      startServer(argv, argv['http-port'], argv['https-port'], certs);
    });
  } else {
    processFile(argv, argv._[0], argv._[1]);
  }
};


main(optimist
    .usage('Instrument JavaScript for tracing.\nUsage: $0 source.js [source.instrumented.js]\n       $0 --server')
    .options('s', {
      alias: 'server',
      type: 'boolean',
      default: false,
      desc: 'Run as a proxy server.'
    })
    .options('p', {
      alias: 'http-port',
      type: 'string',
      default: 8081,
      desc: 'HTTP proxy listen port.'
    })
    .options('P', {
      alias: 'https-port',
      type: 'string',
      default: 8082,
      desc: 'HTTPS proxy listen port.'
    })
    .options('T', {
      alias: 'type',
      type: 'string',
      default: 'calls',
      desc: 'Tracking type (calls, memory, time).'
    })
    .options('c', {
      alias: 'track-calls',
      type: 'boolean',
      default: false,
      desc: 'Enable call tracking (--type=calls).'
    })
    .options('h', {
      alias: 'track-heap',
      type: 'boolean',
      default: false,
      desc: 'Enable heap size tracking (--type=memory).'
    })
    .options('t', {
      alias: 'track-time',
      type: 'boolean',
      default: false,
      desc: 'Enable call time tracking (--type=time).'
    })
    .options('m', {
      alias: 'module',
      type: 'number',
      desc: 'Module ID (0-255) to differentiate instrumented scripts.'
    })
    .options('i', {
      alias: 'ignore',
      type: 'string',
      desc: 'Don\'t trace functions with this name.'
    })
    .options('ir', {
      alias: 'ignore-regexp',
      type: 'string',
      desc: 'Don\'t trace functions with this name.'
    })
    .check(function(argv) {
      if (argv['help']) {
        throw '';
      }
      if (argv['server']) {
        // Assert no files passed too.
        if (argv._.length) {
          throw 'Server mode does not accept input files.'
        }
      } else {
        // Assert has a file.
        if (!argv._.length) {
          throw 'Pass a file to instrument.'
        }
      }
      return true;
    })
    .argv);
