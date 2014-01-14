#!/usr/bin/env node
/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Query tool.
 * A debug query tool.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

var readline = require('readline');

var toolRunner = require('./tool-runner');
var util = toolRunner.util;
toolRunner.launch(runTool);


/**
 * Query tool.
 * @param {!wtf.pal.IPlatform} platform Platform abstraction layer.
 * @param {!Array.<string>} args Command line arguments.
 * @param {function(number)} done Call to end the program with a return code.
 */
function runTool(platform, args, done) {
  if (args.length < 1) {
    console.log('usage: query.js file.wtf-trace "[query string]"');
    done(1);
    return;
  }

  var inputFile = args[0];
  var exprArgs = args.slice(1);
  var expr = exprArgs.join(' ').trim();

  console.log('Querying ' + inputFile + '...');

  // Create database for querying.
  var loadStart = wtf.now();
  wtf.db.load(inputFile, function(db) {
    if (db instanceof Error) {
      console.log('ERROR: unable to open ' + inputFile, db);
      done(1);
      return;
    }

    var loadDuration = wtf.now() - loadStart;
    console.log('Database loaded in ' + loadDuration.toFixed(3) + 'ms');
    console.log('');

    queryDatabase(db, expr);

    done(0);
  });
};


/**
 * Runs a REPL that queries a database.
 * @param {!wtf.db.Database} db Database.
 * @param {string} expr Query string.
 */
function queryDatabase(db, expr) {
  // TODO(benvanik): allow the user to switch zone.
  var zone = db.getZones()[0];

  // If the user provided an expression on the command line, use that.
  if (expr && expr.length) {
    issue(expr);
    return 0;
  }

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.on('line', function(line) {
    line = line.trim();
    if (line == 'q' || line == 'quit') {
      rl.close();
      return;
    }

    issue(line);

    rl.prompt();
  });
  rl.on('close', function() {
    console.log('');
    db.dispose();
    process.exit(0);
  });
  rl.setPrompt('> ');
  rl.prompt();

  function issue(expr) {
    console.log('Expression: ' + expr);

    var result;
    try {
      result = zone.query(expr);
    } catch (e) {
      console.log(e);
      return;
    }

    var xexpr = result.getCompiledExpression();
    console.log(xexpr.toString());
    console.log('');

    var resultValue = result.getValue();
    if (resultValue instanceof wtf.db.EventIterator) {
      var it = resultValue;
      if (!it.getCount()) {
        console.log('Nothing matched');
      } else {
        console.log('Results: (' + it.getCount() + ' total)');
        for (; !it.done(); it.next()) {
          util.logEvent(it, zone);
        }
      }
    } else if (typeof resultValue == 'boolean' ||
        typeof resultValue == 'number' ||
        typeof resultValue == 'string') {
      console.log('Result:');
      logResult(resultValue);
    } else if (!resultValue) {
      // Note we test this after so that 0/strings/etc are handled.
      console.log('Nothing matched');
    } else if (resultValue.length) {
      console.log('Results: (' + resultValue.length + ' total)');
      for (var n = 0; n < resultValue.length; n++) {
        logResult(resultValue[n]);
      }
    } else {
      console.log('Result:');
      logResult(resultValue);
    }

    console.log('');
    console.log('Took ' + result.getDuration().toFixed(3) + 'ms');
  }
};


function logResult(resultValue) {
  if (typeof resultValue == 'boolean' ||
      typeof resultValue == 'number' ||
      typeof resultValue == 'string') {
    console.log(resultValue);
    return;
  }

  console.log(resultValue.toString());
};
