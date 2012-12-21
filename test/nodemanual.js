#!/usr/bin/env node
var wtf = require('../build-out/wtf_node_js_compiled');
wtf.trace.node.start();
var scope = wtf.trace.enterScope('hello');
for (var n = 0; n < 100000000; n++) {
}
wtf.trace.leaveScope(scope);
