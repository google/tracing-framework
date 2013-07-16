#!/usr/bin/env node
/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Trace storage server.
 * Accepts POSTs of trace files for saving to the local disk.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

var fs = require('fs');
var http = require('http');
var mkdirp = require('mkdirp');
var optimist = require('optimist');
var os = require('os');
var path = require('path');
var url = require('url');



function main(argv) {
  var httpPort = argv['http-port'];
  var storagePath = argv['path'];
  console.log('Launching trace server...');
  console.log('   http: ' + httpPort);
  console.log('   path: ' + storagePath);

  mkdirp.sync(storagePath);

  function handleGet(req, res, url) {
  res.writeHead(200, ['Content-Type', 'text/plain']);
    res.end('get');
  };

  function handlePost(req, res, url) {
    var filename = req.headers['x-filename'] || null;
    if (filename) {
      filename = path.basename(filename);
    } else {
      filename = 'trace.wtf-trace';
    }

    var filePath = path.join(storagePath, filename);
    var file = fs.createWriteStream(filePath);
    console.log('Writing trace to ' + filePath + '...');

    req.pipe(file);

    req.on('end', function() {
      console.log('Done!');

      res.writeHead(200, ['Content-Type', 'text/plain']);
      res.end('Done!');
    });
  };

  var httpServer = http.createServer(function(req, res) {
    var parsedUrl = url.parse(req.url, true);
    switch (req.method) {
      case 'GET':
        handleGet(req, res, url);
        break;
      case 'POST':
        handlePost(req, res, url);
        break;
      default:
        res.writeHead(405, ['Content-Type', 'text/plain']);
        res.end('Invalid Method');
        break;
    }
  });
  httpServer.listen(httpPort);

  console.log('Server ready, use ctrl-c to exit...');
  console.log('');
};


main(optimist
    .usage('Store trace files from remote clients.\nUsage: $0 [--path=store]')
    .options('p', {
      alias: 'http-port',
      type: 'string',
      default: 8090,
      desc: 'HTTP port to listen on.'
    })
    .options('path', {
      type: 'string',
      default: '/tmp/wtf/traces/',
      desc: 'File system path to store trace files.'
    })
    .check(function(argv) {
      if (argv['help']) {
        throw '';
      }
      return true;
    })
    .argv);
