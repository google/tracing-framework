#!/usr/bin/env node

http = require('http');
fs = require('fs');

port = 8000;
hostname = '0.0.0.0';

http.createServer(requestListener).listen(port, hostname);

function requestListener(req, res) {
  if (req.method == 'OPTIONS')
    handleOptions(req, res);
  else if (req.method == 'POST')
    handlePost(req, res);
  else
    handleDefault(req, res);
}

function handleDefault(req, res) {
  res.statusCode = 404;
  res.end();
}

// Save the posted trace file to local directory.
function handlePost(req, res) {
  var length = parseInt(req.headers['content-length'], 10);
  if (length <= 0) {
    res.end();
    return;
  }

  var filename = req.headers['x-filename'] || 'save-trace.wtf-trace';
  var writable = fs.createWriteStream(filename, {flags: 'w'});

  req.on('data', function(chunk) {
    writable.write(chunk);
  });

  req.on('end', function() {
    console.log(filename);
    writable.end();
    res.end();
  });
}

// Echo CORS headers.
function handleOptions(req, res) {
  var acrh = req.headers['access-control-request-headers'];
  var origin = req.headers['origin'];
  if (acrh) res.setHeader('Access-Control-Allow-Headers', acrh);
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.end();
}
