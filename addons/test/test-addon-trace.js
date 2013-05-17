(function() {

// Add a HUD button:
wtf.hud.addButton({
  title: 'hello',
  icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="21px" height="21px"><path d="M10.488,6.586c2.437,0,4.412,1.976,4.412,4.414h-2.206l3.163,5.359L19,11h-2.208c0-3.481-2.822-6.304-6.304-6.304"/><path d="M10.488,6.586c2.437,0,4.412,1.976,4.412,4.414h-2.206l3.163,5.359L19,11h-2.208c0-3.481-2.822-6.304-6.304-6.304V6.586z"/><path d="M10.512,17.304c-3.481,0-6.304-2.822-6.304-6.304H2l3.143-5.359L8.306,11H6.1c0,2.438,1.976,4.414,4.412,4.414V17.304z"/></svg>',
  shortcut: 'f3',
  callback: function() {
    console.log('hello!');
  },
  scope: null
});

console.log('test addon loaded', wtf);

})();
