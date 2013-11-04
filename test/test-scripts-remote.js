(function remote() {
  console.log('remote');
})();

var someLink = document.getElementById('someLink');
someLink.onclick = function(e) {
  e.preventDefault();

  if (window.wtf) {
    wtf.trace.timeStamp('hello');
  }
};
