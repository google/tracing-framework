#!/usr/bin/env node

var webdriver = require('wd');
var assert = require('assert');
var http = require('http');

var BASE_URL = 'http://localhost:8001';
var SAUCE_USERNAME = process.env.SAUCE_USERNAME || 'tracing-framework';
var SAUCE_PASSWORD = process.env.SAUCE_ACCESS_KEY;

if (!SAUCE_PASSWORD) {
  console.log('No access key specified; talk to ben and set your ' +
      'SAUCE_ACCESS_KEY env variable');
  process.exit(1);
}

var anyFailed = false;
process.on('exit', function() {
  process.exit(anyFailed ? 1 : 0);
});

function runTest(name, url, checkCallback) {
  var browser = webdriver.remote(
      'ondemand.saucelabs.com', 80,
      SAUCE_USERNAME, SAUCE_PASSWORD);
  browser.on('status', function(info){
    console.log('\x1b[36m%s\x1b[0m', info);
  });
  browser.on('command', function(meth, path){
    console.log(' > \x1b[33m%s\x1b[0m: %s', meth, path);
  });

  var browserConfigs = [
    {
      browserName: 'opera',
      platform: 'Windows 2008',
      version: '12'
    },
    {
      browserName: 'internet explorer',
      platform: 'Windows 2012',
      version: '10'
    },
    {
      browserName: 'firefox',
      platform: 'Windows 2012',
      version: '17'
    },
    {
      browserName: 'chrome',
      platform: 'Windows 2008'
    },
    {
      browserName: 'iphone',
      platform: 'Mac 10.8',
      version: '6.0'
    },
    {
      browserName: 'safari',
      platform: 'Mac 10.6',
      version: '5'
    },
    {
      browserName: 'android',
      platform: 'Linux',
      version: '4'
    }
  ];

  function setPassed(jobId, value) {
    var data = JSON.stringify({
      'passed': value
    });
    var req = http.request({
      host: 'saucelabs.com',
      port: 80,
      auth: SAUCE_USERNAME + ':' + SAUCE_PASSWORD,
      path: '/rest/v1/' + SAUCE_USERNAME + '/jobs/' + jobId,
      method: 'PUT',
      headers: {
        'Content-Type': 'text/json',
        'Content-Length': data.length
      }
    });
    req.write(data);
    req.end();
  };

  for (var n = 0; n < browserConfigs.length; n++) {
    var browserConfig = browserConfigs[n];
    browserConfig.name = name;
    browserConfig.tags = ['manual'];
    browserConfig.build = process.env.TRAVIS_JOB_ID || '(local)';
    browser.init(browserConfig, function() {
      browser.setAsyncScriptTimeout(30 * 1000);
      browser.get(url, function() {
        try {
          checkCallback(browser, function(result) {
            if (!result) {
              anyFailed = true;
            }
            setPassed(browser.sessionID, result);
            browser.quit();
          });
        } catch(e) {
          // TODO(benvanik): track exception
          setPassed(browser.sessionID, false);
          browser.quit();
        }
      });
    });
  }
};

runTest(
    'Unit Tests',
    BASE_URL + '/src/wtf/testing/test.html',
    function(browser, complete) {
      // Unfortunately executeAsync isn't supported everywhere, so poll.
      function poll() {
        browser.execute([
          'if (wtf.testing.mocha.run.hasCompleted) {',
          '  return allMochaFailures;',
          '} else {',
          '  return null;',
          '}'
        ].join('\n'), function(err, failures) {
          if (err) {
            console.log('Test runner error!');
            console.log(JSON.stringify(err));
            complete(false);
          } else {
            if (failures) {
              // Completed!
              if (failures.length) {
                // Failures present.
                // TODO(benvanik): add [test, err] values to custom-data?
                console.log(failures.length + ' failures!');
                for (var n = 0; n < failures.length; n++) {
                  console.log(failures[n]);
                }
                complete(false);
              } else {
                // Succeeded.
                complete(true);
              }
            } else {
              // Not yet done - run again.
              setTimeout(poll, 100);
            }
          }
        });
      };
      setTimeout(poll, 100);

      // TODO(benvanik): use executeAsync when it's supported by Android/etc.
      // browser.executeAsync([
      //   '(function(callback) {',
      //   '  if (wtf.testing.mocha.run.hasCompleted) {',
      //   '    callback(allMochaFailures);',
      //   '  } else {',
      //   '    window.mochaCompletionWaiter = function() {',
      //   '      callback(allMochaFailures);',
      //   '    };',
      //   '  }',
      //   '})(arguments[arguments.length - 1]);'
      // ].join('\n'), function(err, failures) {
      //   // Same as above.
      // });
    });

// TODO(benvanik): implement some end-to-end tests
// runTest(
//     'Trace End-to-End',
//     BASE_URL + '/test/trace_compiled.html',
//     function(browser, complete) {
//       browser.eval('window.location.href', function(err, value) {
//         complete(false);
//       });
//     });
