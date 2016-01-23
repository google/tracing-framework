#!/usr/bin/env node
/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Remote controller server.
 * Provides a server for remotely controlling WTF instrumented pages.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

var fs = require('fs');
var http = require('http');
var optimist = require('optimist');
var os = require('os');
var path = require('path');
var querystring = require('querystring');
var url = require('url');
var ws = require('ws');


var Server = function(argv) {
  this.argv_ = argv;

  this.nextId_ = 1;
  this.clientMap_ = {};

  var uri = 'ws://' + os.hostname() + ':' + argv['ws-port'];

  this.httpServer_ = http.createServer();
  this.httpServer_.listen(Number(argv['http-port']));
  this.httpServer_.on('request', function(request, response) {
    // We only have the one HTTP file right now.
    var filePath = path.join(__dirname, 'controller.html');
    var content = fs.readFileSync(filePath, 'utf8');
    content = content.replace('%%CONTROL_URI%%', uri);
    contentBuffer = new Buffer(content);
    response.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Length': contentBuffer.length
    });
    response.end(contentBuffer);
  });

  this.wsServer_ = new ws.Server({
    port: Number(argv['ws-port'])
  });
  this.wsServer_.on('connection', (function(socket) {
    // Setup a periodic ping.
    var pingIntervalId = setInterval(function() {
      socket.ping(undefined, undefined, true);
    }, 1000);
    socket.on('close', function() {
      clearInterval(pingIntervalId);
    });

    // Wait until the hello packet to create the client object.
    socket.once('message', (function(message) {
      var packet = JSON.parse(message);
      if (!packet || packet['command'] != 'hello') {
        console.log('[WS] Bad hello packet:');
        console.log(packet);
        socket.terminate();
        return;
      }

      var client = null;
      switch (packet['client_type']) {
        case 'controller':
          client = new ControlClient(this.nextId_++, this, socket, packet);
          break;
        case 'tracer':
          client = new TraceClient(this.nextId_++, this, socket, packet);
          break;
        default:
          console.log('[WS] Bad client type: ' + packet['client_type']);
          socket.terminate();
          break;
      }
      this.clientMap_[client.id] = client;

      socket.on('error', (function(error) {
        console.log('[WS] Socket error: ' + error);
      }).bind(this));
      socket.on('close', (function(code) {
        console.log('[WS] Client disconnected: ' + code);
        delete this.clientMap_[client.id];
        client.dispose();
      }).bind(this));
    }).bind(this));
  }).bind(this));
  this.wsServer_.on('error', function(error) {
    console.log('[WS] Server Error: ' + error);
  });
};

Server.prototype.getClient = function(id) {
  return this.clientMap_[id] || null;
};

Server.prototype.forEachControlClient = function(callback, opt_scope) {
  for (var key in this.clientMap_) {
    var client = this.clientMap_[key];
    if (client instanceof ControlClient) {
      callback.call(opt_scope, client);
    }
  }
};

Server.prototype.forEachTraceClient = function(callback, opt_scope) {
  for (var key in this.clientMap_) {
    var client = this.clientMap_[key];
    if (client instanceof TraceClient) {
      callback.call(opt_scope, client);
    }
  }
};


var ControlClient = function(id, server, socket, packet) {
  this.id = id;
  this.server = server;
  this.socket = socket;

  console.log('[Control] New controller connected');

  socket.on('message', (function(message) {
    var data = JSON.parse(message);
    switch (data['command']) {
      case 'execute':
        var client = server.getClient(data['id']);
        data['source_id'] = id;
        client.socket.send(JSON.stringify(data));
        break;
    }
  }).bind(this));

  // Send the controller all currently connected tracers.
  server.forEachTraceClient(function(client) {
    socket.send(JSON.stringify(client.serialize()));
  }, this);
};

ControlClient.prototype.dispose = function() {
  this.socket.terminate();
};


var TraceClient = function(id, server, socket, packet) {
  this.id = id;
  this.server = server;
  this.socket = socket;
  this.contextInfo = packet['context_info'];
  this.commands = packet['commands'];

  console.log('[Tracer] New tracer connected: ' + this.contextInfo['title']);

  var previousTargetId = -1;
  socket.on('message', (function(message) {
    if (message instanceof Buffer ||
        message instanceof Uint8Array) {
      // Binary message - just pass along to whoever was last targetted.
      var client = server.getClient(previousTargetId);
      if (client) {
        client.socket.send(message, {
          binary: true
        });
      }
    } else {
      var data = JSON.parse(message);
      switch (data['command']) {
        case 'response':
          previousTargetId = data['id'];
          var client = server.getClient(data['id']);
          data['source_id'] = id;
          client.socket.send(JSON.stringify(data));
          break;
      }
    }
  }).bind(this));

  // Notify all controllers that we are connected.
  server.forEachControlClient(function(client) {
    client.socket.send(JSON.stringify(this.serialize()));
  }, this);
};

TraceClient.prototype.dispose = function() {
  this.socket.terminate();

  // Notify all controllers that we are gone.
  this.server.forEachControlClient(function(client) {
    client.socket.send(JSON.stringify({
      'command': 'remove_trace_client',
      'id': this.id
    }));
  }, this);
};

TraceClient.prototype.serialize = function() {
  return {
    'command': 'add_trace_client',
    'id': this.id,
    'context_info': this.contextInfo,
    'commands': this.commands
  };
};


function main(argv) {
  var uri = 'ws://' + os.hostname() + ':' + argv['ws-port'];

  console.log('Launching remote control server...');
  console.log('   http: ' + argv['http-port']);
  console.log('     ws: ' + argv['ws-port']);
  console.log('');
  console.log('Open the control page:');
  console.log('  http://' + os.hostname() + ':' + argv['http-port']);
  console.log('');
  console.log('Add this to your page <head> BEFORE anything else:');
  console.log('<script src="//google.github.io/tracing-framework/bin/wtf_trace_web_js_compiled.js"></script>');
  console.log('<script>');
  console.log('  wtf.remote.connect({');
  console.log('    \'wtf.remote.target\': \'' + uri + '\'');
  console.log('  });');
  console.log('  wtf.trace.start();');
  console.log('</script>');
  console.log('');

  var server = new Server(argv);

  console.log('Server ready, use ctrl-c to exit...');
  console.log('');
};


main(optimist
    .usage('Remote control server.\nUsage: $0')
    .options('p', {
      alias: 'http-port',
      type: 'string',
      default: 8083,
      desc: 'HTTP control page listen port.'
    })
    .options('P', {
      alias: 'ws-port',
      type: 'string',
      default: 8084,
      desc: 'WebSocket listen port.'
    })
    .check(function(argv) {
      if (argv['help']) {
        throw '';
      }
      return true;
    })
    .argv);
