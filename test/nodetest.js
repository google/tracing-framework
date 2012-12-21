// TODO(benvnaik): clean this test up

function unscopedMethod(x) {
  x++;
  return x;
};

function doLotsOfControls(count) {
  var x = 0;
  for (var n = 0; n < count; n++) {
    x = unscopedMethod(x);
  }
  return x;
};

function scopedMethod(x) {
  var scope = wtf.trace.enterScope();
  x++;
  return wtf.trace.leaveScope(scope, x);
};

function doLotsOfScopes(count) {
  var x = 0;
  for (var n = 0; n < count; n++) {
    x = scopedMethod(x);
  }
  return x;
};

function consoleScopedMethod(x) {
  console.time('a');
  x++;
  console.timeEnd('a');
  return x;
}

function doLotsOfConsoleScopes(count) {
  var x = 0;
  for (var n = 0; n < count; n++) {
    x = consoleScopedMethod(x);
  }
  return x;
}

var runCount = 100;
var count = 100000;

for (var n = 0; n < 10; n++) {
  var startTime = wtf.now();

  doLotsOfControls(count);

  var duration = wtf.now() - startTime;
  console.log(
      'control total: ' + duration + ', per fn: ' + (duration / count));
}

//wtf.trace.start();

var meanDuration = 0;
for (var n = 0; n < runCount; n++) {
  var startTime = wtf.now();

  doLotsOfScopes(count);

  var duration = wtf.now() - startTime;
  meanDuration += duration;
  console.log(
      'total: ' + duration + ', per ~call: ' + (duration / count / 2));
}
meanDuration /= runCount;
console.log('scope mean duration: ' + meanDuration + ', per ~call: ' +
    (meanDuration / count / 2));

//wtf.trace.stop();
// wtf.trace.start();

// var meanDuration = 0;
// for (var n = 0; n < runCount; n++) {
//   var startTime = wtf.now();

//   doLotsOfConsoleScopes(count);

//   var duration = wtf.now() - startTime;
//   meanDuration += duration;
//   console.log(
//       'total: ' + duration + ', per ~call: ' + (duration / count / 2));
// }
// meanDuration /= runCount;
// console.log('console mean duration: ' + meanDuration + ', per ~call: ' +
//     (meanDuration / count / 2));

// wtf.trace.stop();
