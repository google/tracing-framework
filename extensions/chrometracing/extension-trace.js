(function() {

var available = wtf.trace.browser.hasChromeTracing();
if (!available) {
  return;
}

var active = false;
var syncIntervalId = undefined;

var progressDiv = null;
function showProgress(message) {
  if (!progressDiv) {
    progressDiv = document.createElement('div');
    progressDiv.style.position = 'absolute';
    progressDiv.style.top = '5px';
    progressDiv.style.right = '5px';
    progressDiv.style.backgroundColor = 'white';
    progressDiv.style.border = '1px solid black';
    progressDiv.style.color = 'black';
    progressDiv.style.zIndex = 9999999;
    document.body.appendChild(progressDiv);
  }
  progressDiv.innerHTML = message;
};
function hideProgress() {
  document.body.removeChild(progressDiv);
  progressDiv = null;
};

function emitSync() {
  var syncName = '$WTFSYNCINTERVAL:' + Math.floor(wtf.now() * 1000);
  if (console.time.raw) {
    console.time.raw.call(console, syncName);
    console.timeEnd.raw.call(console, syncName);
  } else {
    console.time(syncName);
    console.timeEnd(syncName);
  }
};

wtf.hud.addButton({
  title: 'chrome:tracing',
  icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="21px" height="21px"><path d="M10.488,6.586c2.437,0,4.412,1.976,4.412,4.414h-2.206l3.163,5.359L19,11h-2.208c0-3.481-2.822-6.304-6.304-6.304"/><path d="M10.488,6.586c2.437,0,4.412,1.976,4.412,4.414h-2.206l3.163,5.359L19,11h-2.208c0-3.481-2.822-6.304-6.304-6.304V6.586z"/><path d="M10.512,17.304c-3.481,0-6.304-2.822-6.304-6.304H2l3.143-5.359L8.306,11H6.1c0,2.438,1.976,4.414,4.412,4.414V17.304z"/></svg>',
  shortcut: 'f3',
  callback: function() {
    if (!active) {
      active = true;
      wtf.trace.browser.startChromeTracing();
      syncIntervalId = window.setInterval.raw.call(window, emitSync, 100);
      emitSync();
      wtf.trace.mark('tracing');
      showProgress('tracing...');
    } else {
      wtf.trace.mark('');
      window.clearInterval.raw.call(window, syncIntervalId);
      active = false;
      showProgress('waiting for data...');
      console.log('waiting for chrome:tracing data...');
      wtf.trace.browser.stopChromeTracing(function(data) {
        var scope = wtf.trace.enterTracingScope();
        showProgress('importing data...');
        console.log('importing chrome:tracing data...');
        processTraceData(data);
        console.log('done!');
        hideProgress();
        wtf.trace.leaveScope(scope);
      });
    }
  },
  scope: null
});

function processTraceData(data) {
  var threads = {};
  var timeDelta = 0;

  data = JSON.parse('[' + data.join(',') + ']');

  // First we need to walk the data to find the threads by __metadata.
  // Unfortunately these come out of order.
  // We also search for sync events and assume they all come from us. The thread
  // that has them is our thread for inspection.
  var currentThreadId = 0;
  for (var n = 0; n < data.length; n++) {
    var e = data[n];
    if (!e) {
      continue;
    }

    var thread = threads[e.tid];
    if (!thread) {
      thread = threads[e.tid] = {
        name: null,
        included: false,
        openScopes: [],
        zone: null
      };
    }

    if (e.cat == '__metadata') {
      if (e.name == 'thread_name') {
        thread.name = e.args.name;
        //e.args.name == 'CrBrowserMain' ||
        if (e.args.name == 'CrGpuMain') {
          thread.included = true;
        }
      }
      data[n] = null;
    }

    // Sniff out our sync interval events.
    if (e.ph == 'S' &&
        e.name[0] == '$' &&
        e.name.lastIndexOf('$WTFSYNCINTERVAL') == 0) {
      var time = parseFloat(e.name.substr(e.name.lastIndexOf(':') + 1));
      timeDelta = e.ts - time;
      data[n] = null;

      // Assume this thread is us.
      currentThreadId = e.tid;
    }
  }
  console.log('time delta: ' + timeDelta);

  // Create thread zones.
  // Perhaps we should do this only when we see events.
  for (var tid in threads) {
    var thread = threads[tid];
    var name = thread.name || String(tid);
    var type;
    switch (thread.name) {
      case 'CrBrowserMain':
        type = 'native_browser';
        thread.included = true;
        break;
      case 'CrGpuMain':
        type = 'native_gpu';
        thread.included = true;
        break;
      default:
        type = 'native_script';
        thread.included = tid == currentThreadId;
        break;
    }
    if (!thread.included) {
      continue;
    }
    var location = '';
    thread.zone = wtf.trace.createZone(name, type, location);
  }

  // Run through and emit events we are interested in.
  for (var n = 0; n < data.length; n++) {
    var e = data[n];
    if (!e) {
      continue;
    }
    var thread = threads[e.tid];
    if (!thread.included || !e.ts) {
      continue;
    }

    wtf.trace.pushZone(thread.zone);

    var openScopes = thread.openScopes;
    if (!e.ts) {
      console.log(e);
    }
    var ts = (e.ts - timeDelta) / 1000;
    switch (e.ph) {
      case 'B':
        {
          var scope = wtf.trace.enterScope(e.name, ts);
          for (var key in e.args) {
            wtf.trace.appendScopeData(key, e.args[key], ts);
          }
          openScopes.push(scope);
        }
        break;
      case 'E':
        {
          var scope = openScopes.pop();
          wtf.trace.leaveScope(scope, undefined, ts);
        }
        break;
      case 'I':
        {
          wtf.trace.timeStamp(e.name, ts);
        }
        break;
    }

    wtf.trace.popZone();
  }

  // Close all open scopes.
  for (var tid in threads) {
    var thread = threads[tid];
    while (thread.openScopes.length) {
      wtf.trace.leaveScope(thread.openScopes.pop());
    }
  }
}

})();
