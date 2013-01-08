module.exports = (function(exports){// Input 0
'use strict';var COMPILED = !0, goog = goog || {};
goog.global = this;
goog.DEBUG = !1;
goog.LOCALE = "en";
goog.TRUSTED_SITE = !0;
goog.provide = function(a) {
  if(!COMPILED) {
    if(goog.isProvided_(a)) {
      throw Error('Namespace "' + a + '" already declared.');
    }
    delete goog.implicitNamespaces_[a];
    for(var b = a;(b = b.substring(0, b.lastIndexOf("."))) && !goog.getObjectByName(b);) {
      goog.implicitNamespaces_[b] = !0
    }
  }
  goog.exportPath_(a)
};
goog.setTestOnly = function(a) {
  if(COMPILED && !goog.DEBUG) {
    throw a = a || "", Error("Importing test-only code into non-debug environment" + a ? ": " + a : ".");
  }
};
COMPILED || (goog.isProvided_ = function(a) {
  return!goog.implicitNamespaces_[a] && !!goog.getObjectByName(a)
}, goog.implicitNamespaces_ = {});
goog.exportPath_ = function(a, b, c) {
  a = a.split(".");
  c = c || goog.global;
  !(a[0] in c) && c.execScript && c.execScript("var " + a[0]);
  for(var d;a.length && (d = a.shift());) {
    !a.length && goog.isDef(b) ? c[d] = b : c = c[d] ? c[d] : c[d] = {}
  }
};
goog.getObjectByName = function(a, b) {
  for(var c = a.split("."), d = b || goog.global, e;e = c.shift();) {
    if(goog.isDefAndNotNull(d[e])) {
      d = d[e]
    }else {
      return null
    }
  }
  return d
};
goog.globalize = function(a, b) {
  var c = b || goog.global, d;
  for(d in a) {
    c[d] = a[d]
  }
};
goog.addDependency = function(a, b, c) {
  if(!COMPILED) {
    var d;
    a = a.replace(/\\/g, "/");
    for(var e = goog.dependencies_, f = 0;d = b[f];f++) {
      e.nameToPath[d] = a, a in e.pathToNames || (e.pathToNames[a] = {}), e.pathToNames[a][d] = !0
    }
    for(d = 0;b = c[d];d++) {
      a in e.requires || (e.requires[a] = {}), e.requires[a][b] = !0
    }
  }
};
goog.ENABLE_DEBUG_LOADER = !0;
goog.require = function(a) {
  if(!COMPILED && !goog.isProvided_(a)) {
    if(goog.ENABLE_DEBUG_LOADER) {
      var b = goog.getPathFromDeps_(a);
      if(b) {
        goog.included_[b] = !0;
        goog.writeScripts_();
        return
      }
    }
    a = "goog.require could not find: " + a;
    goog.global.console && goog.global.console.error(a);
    throw Error(a);
  }
};
goog.basePath = "";
goog.nullFunction = function() {
};
goog.identityFunction = function(a) {
  return a
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(a) {
  a.getInstance = function() {
    if(a.instance_) {
      return a.instance_
    }
    goog.DEBUG && (goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = a);
    return a.instance_ = new a
  }
};
goog.instantiatedSingletons_ = [];
!COMPILED && goog.ENABLE_DEBUG_LOADER && (goog.included_ = {}, goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}}, goog.inHtmlDocument_ = function() {
  var a = goog.global.document;
  return"undefined" != typeof a && "write" in a
}, goog.findBasePath_ = function() {
  if(goog.global.CLOSURE_BASE_PATH) {
    goog.basePath = goog.global.CLOSURE_BASE_PATH
  }else {
    if(goog.inHtmlDocument_()) {
      for(var a = goog.global.document.getElementsByTagName("script"), b = a.length - 1;0 <= b;--b) {
        var c = a[b].src, d = c.lastIndexOf("?"), d = -1 == d ? c.length : d;
        if("base.js" == c.substr(d - 7, 7)) {
          goog.basePath = c.substr(0, d - 7);
          break
        }
      }
    }
  }
}, goog.importScript_ = function(a) {
  var b = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
  !goog.dependencies_.written[a] && b(a) && (goog.dependencies_.written[a] = !0)
}, goog.writeScriptTag_ = function(a) {
  if(goog.inHtmlDocument_()) {
    var b = goog.global.document;
    if("complete" == b.readyState) {
      if(/\bdeps.js$/.test(a)) {
        return!1
      }
      throw Error('Cannot write "' + a + '" after document load');
    }
    b.write('<script type="text/javascript" src="' + a + '">\x3c/script>');
    return!0
  }
  return!1
}, goog.writeScripts_ = function() {
  function a(e) {
    if(!(e in d.written)) {
      if(!(e in d.visited) && (d.visited[e] = !0, e in d.requires)) {
        for(var g in d.requires[e]) {
          if(!goog.isProvided_(g)) {
            if(g in d.nameToPath) {
              a(d.nameToPath[g])
            }else {
              throw Error("Undefined nameToPath for " + g);
            }
          }
        }
      }
      e in c || (c[e] = !0, b.push(e))
    }
  }
  var b = [], c = {}, d = goog.dependencies_, e;
  for(e in goog.included_) {
    d.written[e] || a(e)
  }
  for(e = 0;e < b.length;e++) {
    if(b[e]) {
      goog.importScript_(goog.basePath + b[e])
    }else {
      throw Error("Undefined script input");
    }
  }
}, goog.getPathFromDeps_ = function(a) {
  return a in goog.dependencies_.nameToPath ? goog.dependencies_.nameToPath[a] : null
}, goog.findBasePath_(), goog.global.CLOSURE_NO_DEPS || goog.importScript_(goog.basePath + "deps.js"));
goog.typeOf = function(a) {
  var b = typeof a;
  if("object" == b) {
    if(a) {
      if(a instanceof Array) {
        return"array"
      }
      if(a instanceof Object) {
        return b
      }
      var c = Object.prototype.toString.call(a);
      if("[object Window]" == c) {
        return"object"
      }
      if("[object Array]" == c || "number" == typeof a.length && "undefined" != typeof a.splice && "undefined" != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable("splice")) {
        return"array"
      }
      if("[object Function]" == c || "undefined" != typeof a.call && "undefined" != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if("function" == b && "undefined" == typeof a.call) {
      return"object"
    }
  }
  return b
};
goog.isDef = function(a) {
  return void 0 !== a
};
goog.isNull = function(a) {
  return null === a
};
goog.isDefAndNotNull = function(a) {
  return null != a
};
goog.isArray = function(a) {
  return"array" == goog.typeOf(a)
};
goog.isArrayLike = function(a) {
  var b = goog.typeOf(a);
  return"array" == b || "object" == b && "number" == typeof a.length
};
goog.isDateLike = function(a) {
  return goog.isObject(a) && "function" == typeof a.getFullYear
};
goog.isString = function(a) {
  return"string" == typeof a
};
goog.isBoolean = function(a) {
  return"boolean" == typeof a
};
goog.isNumber = function(a) {
  return"number" == typeof a
};
goog.isFunction = function(a) {
  return"function" == goog.typeOf(a)
};
goog.isObject = function(a) {
  var b = typeof a;
  return"object" == b && null != a || "function" == b
};
goog.getUid = function(a) {
  return a[goog.UID_PROPERTY_] || (a[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(a) {
  "removeAttribute" in a && a.removeAttribute(goog.UID_PROPERTY_);
  try {
    delete a[goog.UID_PROPERTY_]
  }catch(b) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(2147483648 * Math.random()).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(a) {
  var b = goog.typeOf(a);
  if("object" == b || "array" == b) {
    if(a.clone) {
      return a.clone()
    }
    var b = "array" == b ? [] : {}, c;
    for(c in a) {
      b[c] = goog.cloneObject(a[c])
    }
    return b
  }
  return a
};
goog.bindNative_ = function(a, b, c) {
  return a.call.apply(a.bind, arguments)
};
goog.bindJs_ = function(a, b, c) {
  if(!a) {
    throw Error();
  }
  if(2 < arguments.length) {
    var d = Array.prototype.slice.call(arguments, 2);
    return function() {
      var c = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(c, d);
      return a.apply(b, c)
    }
  }
  return function() {
    return a.apply(b, arguments)
  }
};
goog.bind = function(a, b, c) {
  goog.bind = Function.prototype.bind && -1 != Function.prototype.bind.toString().indexOf("native code") ? goog.bindNative_ : goog.bindJs_;
  return goog.bind.apply(null, arguments)
};
goog.partial = function(a, b) {
  var c = Array.prototype.slice.call(arguments, 1);
  return function() {
    var b = Array.prototype.slice.call(arguments);
    b.unshift.apply(b, c);
    return a.apply(this, b)
  }
};
goog.mixin = function(a, b) {
  for(var c in b) {
    a[c] = b[c]
  }
};
goog.now = goog.TRUSTED_SITE && Date.now || function() {
  return+new Date
};
goog.globalEval = function(a) {
  if(goog.global.execScript) {
    goog.global.execScript(a, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(null == goog.evalWorksForGlobals_ && (goog.global.eval("var _et_ = 1;"), "undefined" != typeof goog.global._et_ ? (delete goog.global._et_, goog.evalWorksForGlobals_ = !0) : goog.evalWorksForGlobals_ = !1), goog.evalWorksForGlobals_) {
        goog.global.eval(a)
      }else {
        var b = goog.global.document, c = b.createElement("script");
        c.type = "text/javascript";
        c.defer = !1;
        c.appendChild(b.createTextNode(a));
        b.body.appendChild(c);
        b.body.removeChild(c)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.getCssName = function(a, b) {
  var c = function(a) {
    return goog.cssNameMapping_[a] || a
  }, d = function(a) {
    a = a.split("-");
    for(var b = [], d = 0;d < a.length;d++) {
      b.push(c(a[d]))
    }
    return b.join("-")
  }, d = goog.cssNameMapping_ ? "BY_WHOLE" == goog.cssNameMappingStyle_ ? c : d : function(a) {
    return a
  };
  return b ? a + "-" + d(b) : d(a)
};
goog.setCssNameMapping = function(a, b) {
  goog.cssNameMapping_ = a;
  goog.cssNameMappingStyle_ = b
};
!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING && (goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING);
goog.getMsg = function(a, b) {
  var c = b || {}, d;
  for(d in c) {
    var e = ("" + c[d]).replace(/\$/g, "$$$$");
    a = a.replace(RegExp("\\{\\$" + d + "\\}", "gi"), e)
  }
  return a
};
goog.getMsgWithFallback = function(a) {
  return a
};
goog.exportSymbol = function(a, b, c) {
  goog.exportPath_(a, b, c)
};
goog.exportProperty = function(a, b, c) {
  a[b] = c
};
goog.inherits = function(a, b) {
  function c() {
  }
  c.prototype = b.prototype;
  a.superClass_ = b.prototype;
  a.prototype = new c;
  a.prototype.constructor = a
};
goog.base = function(a, b, c) {
  var d = arguments.callee.caller;
  if(d.superClass_) {
    return d.superClass_.constructor.apply(a, Array.prototype.slice.call(arguments, 1))
  }
  for(var e = Array.prototype.slice.call(arguments, 2), f = !1, g = a.constructor;g;g = g.superClass_ && g.superClass_.constructor) {
    if(g.prototype[b] === d) {
      f = !0
    }else {
      if(f) {
        return g.prototype[b].apply(a, e)
      }
    }
  }
  if(a[b] === d) {
    return a.constructor.prototype[b].apply(a, e)
  }
  throw Error("goog.base called from a method of one name to a method of a different name");
};
goog.scope = function(a) {
  a.call(goog.global)
};
// Input 1
goog.string = {};
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(a, b) {
  return 0 == a.lastIndexOf(b, 0)
};
goog.string.endsWith = function(a, b) {
  var c = a.length - b.length;
  return 0 <= c && a.indexOf(b, c) == c
};
goog.string.caseInsensitiveStartsWith = function(a, b) {
  return 0 == goog.string.caseInsensitiveCompare(b, a.substr(0, b.length))
};
goog.string.caseInsensitiveEndsWith = function(a, b) {
  return 0 == goog.string.caseInsensitiveCompare(b, a.substr(a.length - b.length, b.length))
};
goog.string.subs = function(a, b) {
  for(var c = 1;c < arguments.length;c++) {
    var d = String(arguments[c]).replace(/\$/g, "$$$$");
    a = a.replace(/\%s/, d)
  }
  return a
};
goog.string.collapseWhitespace = function(a) {
  return a.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(a) {
  return/^[\s\xa0]*$/.test(a)
};
goog.string.isEmptySafe = function(a) {
  return goog.string.isEmpty(goog.string.makeSafe(a))
};
goog.string.isBreakingWhitespace = function(a) {
  return!/[^\t\n\r ]/.test(a)
};
goog.string.isAlpha = function(a) {
  return!/[^a-zA-Z]/.test(a)
};
goog.string.isNumeric = function(a) {
  return!/[^0-9]/.test(a)
};
goog.string.isAlphaNumeric = function(a) {
  return!/[^a-zA-Z0-9]/.test(a)
};
goog.string.isSpace = function(a) {
  return" " == a
};
goog.string.isUnicodeChar = function(a) {
  return 1 == a.length && " " <= a && "~" >= a || "\u0080" <= a && "\ufffd" >= a
};
goog.string.stripNewlines = function(a) {
  return a.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(a) {
  return a.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(a) {
  return a.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(a) {
  return a.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(a) {
  return a.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(a) {
  return a.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(a) {
  return a.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(a) {
  return a.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(a, b) {
  var c = String(a).toLowerCase(), d = String(b).toLowerCase();
  return c < d ? -1 : c == d ? 0 : 1
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(a, b) {
  if(a == b) {
    return 0
  }
  if(!a) {
    return-1
  }
  if(!b) {
    return 1
  }
  for(var c = a.toLowerCase().match(goog.string.numerateCompareRegExp_), d = b.toLowerCase().match(goog.string.numerateCompareRegExp_), e = Math.min(c.length, d.length), f = 0;f < e;f++) {
    var g = c[f], h = d[f];
    if(g != h) {
      return c = parseInt(g, 10), !isNaN(c) && (d = parseInt(h, 10), !isNaN(d) && c - d) ? c - d : g < h ? -1 : 1
    }
  }
  return c.length != d.length ? c.length - d.length : a < b ? -1 : 1
};
goog.string.urlEncode = function(a) {
  return encodeURIComponent(String(a))
};
goog.string.urlDecode = function(a) {
  return decodeURIComponent(a.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(a, b) {
  return a.replace(/(\r\n|\r|\n)/g, b ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(a, b) {
  if(b) {
    return a.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }
  if(!goog.string.allRe_.test(a)) {
    return a
  }
  -1 != a.indexOf("&") && (a = a.replace(goog.string.amperRe_, "&amp;"));
  -1 != a.indexOf("<") && (a = a.replace(goog.string.ltRe_, "&lt;"));
  -1 != a.indexOf(">") && (a = a.replace(goog.string.gtRe_, "&gt;"));
  -1 != a.indexOf('"') && (a = a.replace(goog.string.quotRe_, "&quot;"));
  return a
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(a) {
  return goog.string.contains(a, "&") ? "document" in goog.global ? goog.string.unescapeEntitiesUsingDom_(a) : goog.string.unescapePureXmlEntities_(a) : a
};
goog.string.unescapeEntitiesUsingDom_ = function(a) {
  var b = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'}, c = document.createElement("div");
  return a.replace(goog.string.HTML_ENTITY_PATTERN_, function(a, e) {
    var f = b[a];
    if(f) {
      return f
    }
    if("#" == e.charAt(0)) {
      var g = Number("0" + e.substr(1));
      isNaN(g) || (f = String.fromCharCode(g))
    }
    f || (c.innerHTML = a + " ", f = c.firstChild.nodeValue.slice(0, -1));
    return b[a] = f
  })
};
goog.string.unescapePureXmlEntities_ = function(a) {
  return a.replace(/&([^;]+);/g, function(a, c) {
    switch(c) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if("#" == c.charAt(0)) {
          var d = Number("0" + c.substr(1));
          if(!isNaN(d)) {
            return String.fromCharCode(d)
          }
        }
        return a
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(a, b) {
  return goog.string.newLineToBr(a.replace(/  /g, " &#160;"), b)
};
goog.string.stripQuotes = function(a, b) {
  for(var c = b.length, d = 0;d < c;d++) {
    var e = 1 == c ? b : b.charAt(d);
    if(a.charAt(0) == e && a.charAt(a.length - 1) == e) {
      return a.substring(1, a.length - 1)
    }
  }
  return a
};
goog.string.truncate = function(a, b, c) {
  c && (a = goog.string.unescapeEntities(a));
  a.length > b && (a = a.substring(0, b - 3) + "...");
  c && (a = goog.string.htmlEscape(a));
  return a
};
goog.string.truncateMiddle = function(a, b, c, d) {
  c && (a = goog.string.unescapeEntities(a));
  if(d && a.length > b) {
    d > b && (d = b);
    var e = a.length - d;
    a = a.substring(0, b - d) + "..." + a.substring(e)
  }else {
    a.length > b && (d = Math.floor(b / 2), e = a.length - d, a = a.substring(0, d + b % 2) + "..." + a.substring(e))
  }
  c && (a = goog.string.htmlEscape(a));
  return a
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(a) {
  a = String(a);
  if(a.quote) {
    return a.quote()
  }
  for(var b = ['"'], c = 0;c < a.length;c++) {
    var d = a.charAt(c), e = d.charCodeAt(0);
    b[c + 1] = goog.string.specialEscapeChars_[d] || (31 < e && 127 > e ? d : goog.string.escapeChar(d))
  }
  b.push('"');
  return b.join("")
};
goog.string.escapeString = function(a) {
  for(var b = [], c = 0;c < a.length;c++) {
    b[c] = goog.string.escapeChar(a.charAt(c))
  }
  return b.join("")
};
goog.string.escapeChar = function(a) {
  if(a in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[a]
  }
  if(a in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[a] = goog.string.specialEscapeChars_[a]
  }
  var b = a, c = a.charCodeAt(0);
  if(31 < c && 127 > c) {
    b = a
  }else {
    if(256 > c) {
      if(b = "\\x", 16 > c || 256 < c) {
        b += "0"
      }
    }else {
      b = "\\u", 4096 > c && (b += "0")
    }
    b += c.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[a] = b
};
goog.string.toMap = function(a) {
  for(var b = {}, c = 0;c < a.length;c++) {
    b[a.charAt(c)] = !0
  }
  return b
};
goog.string.contains = function(a, b) {
  return-1 != a.indexOf(b)
};
goog.string.countOf = function(a, b) {
  return a && b ? a.split(b).length - 1 : 0
};
goog.string.removeAt = function(a, b, c) {
  var d = a;
  0 <= b && (b < a.length && 0 < c) && (d = a.substr(0, b) + a.substr(b + c, a.length - b - c));
  return d
};
goog.string.remove = function(a, b) {
  var c = RegExp(goog.string.regExpEscape(b), "");
  return a.replace(c, "")
};
goog.string.removeAll = function(a, b) {
  var c = RegExp(goog.string.regExpEscape(b), "g");
  return a.replace(c, "")
};
goog.string.regExpEscape = function(a) {
  return String(a).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(a, b) {
  return Array(b + 1).join(a)
};
goog.string.padNumber = function(a, b, c) {
  a = goog.isDef(c) ? a.toFixed(c) : String(a);
  c = a.indexOf(".");
  -1 == c && (c = a.length);
  return goog.string.repeat("0", Math.max(0, b - c)) + a
};
goog.string.makeSafe = function(a) {
  return null == a ? "" : String(a)
};
goog.string.buildString = function(a) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  return Math.floor(2147483648 * Math.random()).toString(36) + Math.abs(Math.floor(2147483648 * Math.random()) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(a, b) {
  for(var c = 0, d = goog.string.trim(String(a)).split("."), e = goog.string.trim(String(b)).split("."), f = Math.max(d.length, e.length), g = 0;0 == c && g < f;g++) {
    var h = d[g] || "", i = e[g] || "", j = /(\d*)(\D*)/g, k = /(\d*)(\D*)/g;
    do {
      var m = j.exec(h) || ["", "", ""], l = k.exec(i) || ["", "", ""];
      if(0 == m[0].length && 0 == l[0].length) {
        break
      }
      var c = 0 == m[1].length ? 0 : parseInt(m[1], 10), n = 0 == l[1].length ? 0 : parseInt(l[1], 10), c = goog.string.compareElements_(c, n) || goog.string.compareElements_(0 == m[2].length, 0 == l[2].length) || goog.string.compareElements_(m[2], l[2])
    }while(0 == c)
  }
  return c
};
goog.string.compareElements_ = function(a, b) {
  return a < b ? -1 : a > b ? 1 : 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(a) {
  for(var b = 0, c = 0;c < a.length;++c) {
    b = 31 * b + a.charCodeAt(c), b %= goog.string.HASHCODE_MAX_
  }
  return b
};
goog.string.uniqueStringCounter_ = 2147483648 * Math.random() | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(a) {
  var b = Number(a);
  return 0 == b && goog.string.isEmpty(a) ? NaN : b
};
goog.string.toCamelCase = function(a) {
  return String(a).replace(/\-([a-z])/g, function(a, c) {
    return c.toUpperCase()
  })
};
goog.string.toSelectorCase = function(a) {
  return String(a).replace(/([A-Z])/g, "-$1").toLowerCase()
};
goog.string.toTitleCase = function(a, b) {
  var c = goog.isString(b) ? goog.string.regExpEscape(b) : "\\s";
  return a.replace(RegExp("(^" + (c ? "|[" + c + "]+" : "") + ")([a-z])", "g"), function(a, b, c) {
    return b + c.toUpperCase()
  })
};
goog.string.parseInt = function(a) {
  isFinite(a) && (a = String(a));
  return goog.isString(a) ? /^\s*-?0x/i.test(a) ? parseInt(a, 16) : parseInt(a, 10) : NaN
};
// Input 2
var wtf = {analysis:{}};
wtf.analysis.Zone = function(a, b, c) {
  this.name_ = a;
  this.type_ = b;
  this.location_ = c
};
wtf.analysis.Zone.prototype.toString = function() {
  return this.name_
};
wtf.analysis.Zone.prototype.getName = function() {
  return this.name_
};
wtf.analysis.Zone.prototype.getType = function() {
  return this.type_
};
wtf.analysis.Zone.prototype.getLocation = function() {
  return this.location_
};
goog.exportSymbol("wtf.analysis.Zone", wtf.analysis.Zone);
goog.exportProperty(wtf.analysis.Zone.prototype, "toString", wtf.analysis.Zone.prototype.toString);
goog.exportProperty(wtf.analysis.Zone.prototype, "getName", wtf.analysis.Zone.prototype.getName);
goog.exportProperty(wtf.analysis.Zone.prototype, "getType", wtf.analysis.Zone.prototype.getType);
goog.exportProperty(wtf.analysis.Zone.prototype, "getLocation", wtf.analysis.Zone.prototype.getLocation);
// Input 3
goog.disposable = {};
goog.disposable.IDisposable = function() {
};
// Input 4
goog.Disposable = function() {
  goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF && (this.creationStack = Error().stack, goog.Disposable.instances_[goog.getUid(this)] = this)
};
goog.Disposable.MonitoringMode = {OFF:0, PERMANENT:1, INTERACTIVE:2};
goog.Disposable.MONITORING_MODE = 0;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var a = [], b;
  for(b in goog.Disposable.instances_) {
    goog.Disposable.instances_.hasOwnProperty(b) && a.push(goog.Disposable.instances_[Number(b)])
  }
  return a
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = !1;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_ && (this.disposed_ = !0, this.disposeInternal(), goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF)) {
    var a = goog.getUid(this);
    if(goog.Disposable.MONITORING_MODE == goog.Disposable.MonitoringMode.PERMANENT && !goog.Disposable.instances_.hasOwnProperty(a)) {
      throw Error(this + " did not call the goog.Disposable base constructor or was disposed of after a clearUndisposedObjects call");
    }
    delete goog.Disposable.instances_[a]
  }
};
goog.Disposable.prototype.registerDisposable = function(a) {
  this.dependentDisposables_ || (this.dependentDisposables_ = []);
  this.dependentDisposables_.push(a)
};
goog.Disposable.prototype.addOnDisposeCallback = function(a, b) {
  this.onDisposeCallbacks_ || (this.onDisposeCallbacks_ = []);
  this.onDisposeCallbacks_.push(goog.bind(a, b))
};
goog.Disposable.prototype.disposeInternal = function() {
  this.dependentDisposables_ && goog.disposeAll.apply(null, this.dependentDisposables_);
  if(this.onDisposeCallbacks_) {
    for(;this.onDisposeCallbacks_.length;) {
      this.onDisposeCallbacks_.shift()()
    }
  }
};
goog.Disposable.isDisposed = function(a) {
  return a && "function" == typeof a.isDisposed ? a.isDisposed() : !1
};
goog.dispose = function(a) {
  a && "function" == typeof a.dispose && a.dispose()
};
goog.disposeAll = function(a) {
  for(var b = 0, c = arguments.length;b < c;++b) {
    var d = arguments[b];
    goog.isArrayLike(d) ? goog.disposeAll.apply(null, d) : goog.dispose(d)
  }
};
// Input 5
wtf.events = {};
wtf.events.EventEmitter = function() {
  goog.Disposable.call(this);
  this.eventTypes_ = {}
};
goog.inherits(wtf.events.EventEmitter, goog.Disposable);
wtf.events.EventEmitter.prototype.disposeInternal = function() {
  this.eventTypes_ = {};
  wtf.events.EventEmitter.superClass_.disposeInternal.call(this)
};
wtf.events.EventEmitter.prototype.addListener = function(a, b, c) {
  var d = this.eventTypes_[a];
  d || (d = new wtf.events.EventListenerList_(a), this.eventTypes_[a] = d);
  d.addListener(b, c)
};
wtf.events.EventEmitter.prototype.addListeners = function(a, b) {
  for(var c in a) {
    this.addListener(c, a[c], b)
  }
};
wtf.events.EventEmitter.prototype.hasListeners = function(a) {
  return!!this.eventTypes_[a]
};
wtf.events.EventEmitter.prototype.removeListener = function(a, b, c) {
  (a = this.eventTypes_[a]) && a.removeListener(b, c)
};
wtf.events.EventEmitter.prototype.removeAllListeners = function(a) {
  a ? delete this.eventTypes_[a] : this.eventTypes_ = {}
};
wtf.events.EventEmitter.prototype.emitEvent = function(a, b) {
  var c = this.eventTypes_[a];
  if(c) {
    var d = void 0;
    if(1 < arguments.length) {
      for(var d = [], e = 1;e < arguments.length;e++) {
        d.push(arguments[e])
      }
    }
    c.emitEvent(d)
  }
};
wtf.events.EventListener_ = function(a, b, c) {
  this.eventType_ = a;
  this.callback_ = b;
  this.scope_ = c
};
wtf.events.EventListenerList_ = function(a) {
  this.eventType_ = a;
  this.listeners_ = []
};
wtf.events.EventListenerList_.prototype.addListener = function(a, b) {
  this.listeners_.push(new wtf.events.EventListener_(this.eventType_, a, b))
};
wtf.events.EventListenerList_.prototype.removeListener = function(a, b) {
  for(var c = 0;c < this.listeners_.length;c++) {
    var d = this.listeners_[c];
    if(d.callback_ == a && d.scope_ === b) {
      this.listeners_.splice(c, 1);
      break
    }
  }
};
wtf.events.EventListenerList_.prototype.emitEvent = function(a) {
  for(var b = this.listeners_, c = b.length, d = 0;d < c;d++) {
    var e = b[d];
    e.callback_.apply(e.scope_, a)
  }
};
// Input 6
wtf.analysis.TraceListener = function() {
  wtf.events.EventEmitter.call(this);
  this.commonTimebase_ = -1;
  this.allZones_ = {};
  this.defaultZone_ = null;
  this.eventTable_ = {}
};
goog.inherits(wtf.analysis.TraceListener, wtf.events.EventEmitter);
wtf.analysis.TraceListener.prototype.getCommonTimebase = function() {
  return-1 == this.commonTimebase_ ? 0 : this.commonTimebase_
};
wtf.analysis.TraceListener.prototype.computeTimeDelay = function(a) {
  return-1 == this.commonTimebase_ ? (this.commonTimebase_ = a, 0) : a - this.commonTimebase_
};
wtf.analysis.TraceListener.prototype.createOrGetZone = function(a, b, c) {
  var d = a + ":" + b + ":" + c;
  if(this.defaultZone_ && "" == this.defaultZone_.name) {
    return this.defaultZone_.name = a, this.defaultZone_.type = b, this.defaultZone_.location = c, this.allZones_[d] = this.defaultZone_
  }
  var e = this.allZones_[d];
  e || (e = new wtf.analysis.Zone(a, b, c), this.allZones_[d] = e, this.defaultZone_ || (this.defaultZone_ = e));
  return e
};
wtf.analysis.TraceListener.prototype.getDefaultZone = function() {
  this.defaultZone_ || (this.defaultZone_ = new wtf.analysis.Zone("", "", ""));
  return this.defaultZone_
};
wtf.analysis.TraceListener.prototype.defineEventType = function(a) {
  var b = this.eventTable_[a.name];
  return!b ? this.eventTable_[a.name] = a : b
};
wtf.analysis.TraceListener.prototype.getEventType = function(a) {
  return this.eventTable_[a] || null
};
wtf.analysis.TraceListener.prototype.sourceAdded = goog.nullFunction;
wtf.analysis.TraceListener.prototype.sourceError = goog.nullFunction;
wtf.analysis.TraceListener.prototype.beginEventBatch = goog.nullFunction;
wtf.analysis.TraceListener.prototype.endEventBatch = goog.nullFunction;
wtf.analysis.TraceListener.prototype.traceRawEvent = goog.nullFunction;
wtf.analysis.TraceListener.prototype.traceEvent = goog.nullFunction;
// Input 7
wtf.data = {};
wtf.data.EventClass = {INSTANCE:0, SCOPE:1};
goog.exportSymbol("wtf.data.EventClass", wtf.data.EventClass);
goog.exportProperty(wtf.data.EventClass, "INSTANCE", wtf.data.EventClass.INSTANCE);
goog.exportProperty(wtf.data.EventClass, "SCOPE", wtf.data.EventClass.SCOPE);
wtf.data.EventFlag = {HIGH_FREQUENCY:2, SYSTEM_TIME:4, INTERNAL:8, APPEND_SCOPE_DATA:16, BUILTIN:32, APPEND_FLOW_DATA:64};
goog.exportSymbol("wtf.data.EventFlag", wtf.data.EventFlag);
goog.exportProperty(wtf.data.EventFlag, "HIGH_FREQUENCY", wtf.data.EventFlag.HIGH_FREQUENCY);
goog.exportProperty(wtf.data.EventFlag, "SYSTEM_TIME", wtf.data.EventFlag.SYSTEM_TIME);
goog.exportProperty(wtf.data.EventFlag, "INTERNAL", wtf.data.EventFlag.INTERNAL);
goog.exportProperty(wtf.data.EventFlag, "APPEND_SCOPE_DATA", wtf.data.EventFlag.APPEND_SCOPE_DATA);
goog.exportProperty(wtf.data.EventFlag, "BUILTIN", wtf.data.EventFlag.BUILTIN);
goog.exportProperty(wtf.data.EventFlag, "APPEND_FLOW_DATA", wtf.data.EventFlag.APPEND_FLOW_DATA);
// Input 8
wtf.analysis.EventfulTraceListener = function() {
  wtf.analysis.TraceListener.call(this)
};
goog.inherits(wtf.analysis.EventfulTraceListener, wtf.analysis.TraceListener);
wtf.analysis.EventfulTraceListener.prototype.sourceAdded = function(a, b) {
  this.emitEvent(wtf.analysis.EventfulTraceListener.EventType.SOURCE_ADDED, a, b)
};
wtf.analysis.EventfulTraceListener.prototype.sourceError = function(a, b) {
  this.emitEvent(wtf.analysis.EventfulTraceListener.EventType.SOURCE_ERROR, a, b)
};
wtf.analysis.EventfulTraceListener.prototype.traceEvent = function(a) {
  a.eventType.flags & wtf.data.EventFlag.BUILTIN || this.emitEvent(wtf.analysis.EventfulTraceListener.EventType.CUSTOM, a);
  this.emitEvent(a.eventType.name, a)
};
wtf.analysis.EventfulTraceListener.EventType = {SOURCE_ADDED:"sourceAdded", SOURCE_ERROR:"sourceError", DISCONTINUITY:"wtf.trace#discontinuity", CREATE_ZONE:"wtf.zone#create", DELETE_ZONE:"wtf.zone#delete", ENTER_SCOPE:"wtf.scope#enter", LEAVE_SCOPE:"wtf.scope#leave", BRANCH_FLOW:"wtf.flow#branch", EXTEND_FLOW:"wtf.flow#extend", TERMINATE_FLOW:"wtf.flow#terminate", MARK:"wtf.trace#mark", TIMESTAMP:"wtf.trace#timeStamp", CUSTOM:"custom"};
// Input 9
goog.debug = {};
goog.debug.Error = function(a) {
  Error.captureStackTrace ? Error.captureStackTrace(this, goog.debug.Error) : this.stack = Error().stack || "";
  a && (this.message = String(a))
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
// Input 10
goog.asserts = {};
goog.asserts.ENABLE_ASSERTS = !1;
goog.asserts.AssertionError = function(a, b) {
  b.unshift(a);
  goog.debug.Error.call(this, goog.string.subs.apply(null, b));
  b.shift();
  this.messagePattern = a
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(a, b, c, d) {
  var e = "Assertion failed";
  if(c) {
    var e = e + (": " + c), f = d
  }else {
    a && (e += ": " + a, f = b)
  }
  throw new goog.asserts.AssertionError("" + e, f || []);
};
goog.asserts.assert = function(a, b, c) {
  goog.asserts.ENABLE_ASSERTS && !a && goog.asserts.doAssertFailure_("", null, b, Array.prototype.slice.call(arguments, 2));
  return a
};
goog.asserts.fail = function(a, b) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (a ? ": " + a : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(a, b, c) {
  goog.asserts.ENABLE_ASSERTS && !goog.isNumber(a) && goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(a), a], b, Array.prototype.slice.call(arguments, 2));
  return a
};
goog.asserts.assertString = function(a, b, c) {
  goog.asserts.ENABLE_ASSERTS && !goog.isString(a) && goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(a), a], b, Array.prototype.slice.call(arguments, 2));
  return a
};
goog.asserts.assertFunction = function(a, b, c) {
  goog.asserts.ENABLE_ASSERTS && !goog.isFunction(a) && goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(a), a], b, Array.prototype.slice.call(arguments, 2));
  return a
};
goog.asserts.assertObject = function(a, b, c) {
  goog.asserts.ENABLE_ASSERTS && !goog.isObject(a) && goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(a), a], b, Array.prototype.slice.call(arguments, 2));
  return a
};
goog.asserts.assertArray = function(a, b, c) {
  goog.asserts.ENABLE_ASSERTS && !goog.isArray(a) && goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(a), a], b, Array.prototype.slice.call(arguments, 2));
  return a
};
goog.asserts.assertBoolean = function(a, b, c) {
  goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(a) && goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(a), a], b, Array.prototype.slice.call(arguments, 2));
  return a
};
goog.asserts.assertInstanceof = function(a, b, c, d) {
  goog.asserts.ENABLE_ASSERTS && !(a instanceof b) && goog.asserts.doAssertFailure_("instanceof check failed.", null, c, Array.prototype.slice.call(arguments, 3));
  return a
};
// Input 11
goog.array = {};
goog.NATIVE_ARRAY_PROTOTYPES = goog.TRUSTED_SITE;
goog.array.peek = function(a) {
  return a[a.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(a, b, c) {
  goog.asserts.assert(null != a.length);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(a, b, c)
} : function(a, b, c) {
  c = null == c ? 0 : 0 > c ? Math.max(0, a.length + c) : c;
  if(goog.isString(a)) {
    return!goog.isString(b) || 1 != b.length ? -1 : a.indexOf(b, c)
  }
  for(;c < a.length;c++) {
    if(c in a && a[c] === b) {
      return c
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(a, b, c) {
  goog.asserts.assert(null != a.length);
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(a, b, null == c ? a.length - 1 : c)
} : function(a, b, c) {
  c = null == c ? a.length - 1 : c;
  0 > c && (c = Math.max(0, a.length + c));
  if(goog.isString(a)) {
    return!goog.isString(b) || 1 != b.length ? -1 : a.lastIndexOf(b, c)
  }
  for(;0 <= c;c--) {
    if(c in a && a[c] === b) {
      return c
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(a, b, c) {
  goog.asserts.assert(null != a.length);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(a, b, c)
} : function(a, b, c) {
  for(var d = a.length, e = goog.isString(a) ? a.split("") : a, f = 0;f < d;f++) {
    f in e && b.call(c, e[f], f, a)
  }
};
goog.array.forEachRight = function(a, b, c) {
  for(var d = a.length, e = goog.isString(a) ? a.split("") : a, d = d - 1;0 <= d;--d) {
    d in e && b.call(c, e[d], d, a)
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(a, b, c) {
  goog.asserts.assert(null != a.length);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(a, b, c)
} : function(a, b, c) {
  for(var d = a.length, e = [], f = 0, g = goog.isString(a) ? a.split("") : a, h = 0;h < d;h++) {
    if(h in g) {
      var i = g[h];
      b.call(c, i, h, a) && (e[f++] = i)
    }
  }
  return e
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(a, b, c) {
  goog.asserts.assert(null != a.length);
  return goog.array.ARRAY_PROTOTYPE_.map.call(a, b, c)
} : function(a, b, c) {
  for(var d = a.length, e = Array(d), f = goog.isString(a) ? a.split("") : a, g = 0;g < d;g++) {
    g in f && (e[g] = b.call(c, f[g], g, a))
  }
  return e
};
goog.array.reduce = function(a, b, c, d) {
  if(a.reduce) {
    return d ? a.reduce(goog.bind(b, d), c) : a.reduce(b, c)
  }
  var e = c;
  goog.array.forEach(a, function(c, g) {
    e = b.call(d, e, c, g, a)
  });
  return e
};
goog.array.reduceRight = function(a, b, c, d) {
  if(a.reduceRight) {
    return d ? a.reduceRight(goog.bind(b, d), c) : a.reduceRight(b, c)
  }
  var e = c;
  goog.array.forEachRight(a, function(c, g) {
    e = b.call(d, e, c, g, a)
  });
  return e
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(a, b, c) {
  goog.asserts.assert(null != a.length);
  return goog.array.ARRAY_PROTOTYPE_.some.call(a, b, c)
} : function(a, b, c) {
  for(var d = a.length, e = goog.isString(a) ? a.split("") : a, f = 0;f < d;f++) {
    if(f in e && b.call(c, e[f], f, a)) {
      return!0
    }
  }
  return!1
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(a, b, c) {
  goog.asserts.assert(null != a.length);
  return goog.array.ARRAY_PROTOTYPE_.every.call(a, b, c)
} : function(a, b, c) {
  for(var d = a.length, e = goog.isString(a) ? a.split("") : a, f = 0;f < d;f++) {
    if(f in e && !b.call(c, e[f], f, a)) {
      return!1
    }
  }
  return!0
};
goog.array.count = function(a, b, c) {
  var d = 0;
  goog.array.forEach(a, function(a, f, g) {
    b.call(c, a, f, g) && ++d
  }, c);
  return d
};
goog.array.find = function(a, b, c) {
  b = goog.array.findIndex(a, b, c);
  return 0 > b ? null : goog.isString(a) ? a.charAt(b) : a[b]
};
goog.array.findIndex = function(a, b, c) {
  for(var d = a.length, e = goog.isString(a) ? a.split("") : a, f = 0;f < d;f++) {
    if(f in e && b.call(c, e[f], f, a)) {
      return f
    }
  }
  return-1
};
goog.array.findRight = function(a, b, c) {
  b = goog.array.findIndexRight(a, b, c);
  return 0 > b ? null : goog.isString(a) ? a.charAt(b) : a[b]
};
goog.array.findIndexRight = function(a, b, c) {
  for(var d = a.length, e = goog.isString(a) ? a.split("") : a, d = d - 1;0 <= d;d--) {
    if(d in e && b.call(c, e[d], d, a)) {
      return d
    }
  }
  return-1
};
goog.array.contains = function(a, b) {
  return 0 <= goog.array.indexOf(a, b)
};
goog.array.isEmpty = function(a) {
  return 0 == a.length
};
goog.array.clear = function(a) {
  if(!goog.isArray(a)) {
    for(var b = a.length - 1;0 <= b;b--) {
      delete a[b]
    }
  }
  a.length = 0
};
goog.array.insert = function(a, b) {
  goog.array.contains(a, b) || a.push(b)
};
goog.array.insertAt = function(a, b, c) {
  goog.array.splice(a, c, 0, b)
};
goog.array.insertArrayAt = function(a, b, c) {
  goog.partial(goog.array.splice, a, c, 0).apply(null, b)
};
goog.array.insertBefore = function(a, b, c) {
  var d;
  2 == arguments.length || 0 > (d = goog.array.indexOf(a, c)) ? a.push(b) : goog.array.insertAt(a, b, d)
};
goog.array.remove = function(a, b) {
  var c = goog.array.indexOf(a, b), d;
  (d = 0 <= c) && goog.array.removeAt(a, c);
  return d
};
goog.array.removeAt = function(a, b) {
  goog.asserts.assert(null != a.length);
  return 1 == goog.array.ARRAY_PROTOTYPE_.splice.call(a, b, 1).length
};
goog.array.removeIf = function(a, b, c) {
  b = goog.array.findIndex(a, b, c);
  return 0 <= b ? (goog.array.removeAt(a, b), !0) : !1
};
goog.array.concat = function(a) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.toArray = function(a) {
  var b = a.length;
  if(0 < b) {
    for(var c = Array(b), d = 0;d < b;d++) {
      c[d] = a[d]
    }
    return c
  }
  return[]
};
goog.array.clone = goog.array.toArray;
goog.array.extend = function(a, b) {
  for(var c = 1;c < arguments.length;c++) {
    var d = arguments[c], e;
    if(goog.isArray(d) || (e = goog.isArrayLike(d)) && Object.prototype.hasOwnProperty.call(d, "callee")) {
      a.push.apply(a, d)
    }else {
      if(e) {
        for(var f = a.length, g = d.length, h = 0;h < g;h++) {
          a[f + h] = d[h]
        }
      }else {
        a.push(d)
      }
    }
  }
};
goog.array.splice = function(a, b, c, d) {
  goog.asserts.assert(null != a.length);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(a, goog.array.slice(arguments, 1))
};
goog.array.slice = function(a, b, c) {
  goog.asserts.assert(null != a.length);
  return 2 >= arguments.length ? goog.array.ARRAY_PROTOTYPE_.slice.call(a, b) : goog.array.ARRAY_PROTOTYPE_.slice.call(a, b, c)
};
goog.array.removeDuplicates = function(a, b) {
  for(var c = b || a, d = {}, e = 0, f = 0;f < a.length;) {
    var g = a[f++], h = goog.isObject(g) ? "o" + goog.getUid(g) : (typeof g).charAt(0) + g;
    Object.prototype.hasOwnProperty.call(d, h) || (d[h] = !0, c[e++] = g)
  }
  c.length = e
};
goog.array.binarySearch = function(a, b, c) {
  return goog.array.binarySearch_(a, c || goog.array.defaultCompare, !1, b)
};
goog.array.binarySelect = function(a, b, c) {
  return goog.array.binarySearch_(a, b, !0, void 0, c)
};
goog.array.binarySearch_ = function(a, b, c, d, e) {
  for(var f = 0, g = a.length, h;f < g;) {
    var i = f + g >> 1, j;
    j = c ? b.call(e, a[i], i, a) : b(d, a[i]);
    0 < j ? f = i + 1 : (g = i, h = !j)
  }
  return h ? f : ~f
};
goog.array.sort = function(a, b) {
  goog.asserts.assert(null != a.length);
  goog.array.ARRAY_PROTOTYPE_.sort.call(a, b || goog.array.defaultCompare)
};
goog.array.stableSort = function(a, b) {
  for(var c = 0;c < a.length;c++) {
    a[c] = {index:c, value:a[c]}
  }
  var d = b || goog.array.defaultCompare;
  goog.array.sort(a, function(a, b) {
    return d(a.value, b.value) || a.index - b.index
  });
  for(c = 0;c < a.length;c++) {
    a[c] = a[c].value
  }
};
goog.array.sortObjectsByKey = function(a, b, c) {
  var d = c || goog.array.defaultCompare;
  goog.array.sort(a, function(a, c) {
    return d(a[b], c[b])
  })
};
goog.array.isSorted = function(a, b, c) {
  b = b || goog.array.defaultCompare;
  for(var d = 1;d < a.length;d++) {
    var e = b(a[d - 1], a[d]);
    if(0 < e || 0 == e && c) {
      return!1
    }
  }
  return!0
};
goog.array.equals = function(a, b, c) {
  if(!goog.isArrayLike(a) || !goog.isArrayLike(b) || a.length != b.length) {
    return!1
  }
  var d = a.length;
  c = c || goog.array.defaultCompareEquality;
  for(var e = 0;e < d;e++) {
    if(!c(a[e], b[e])) {
      return!1
    }
  }
  return!0
};
goog.array.compare = function(a, b, c) {
  return goog.array.equals(a, b, c)
};
goog.array.compare3 = function(a, b, c) {
  c = c || goog.array.defaultCompare;
  for(var d = Math.min(a.length, b.length), e = 0;e < d;e++) {
    var f = c(a[e], b[e]);
    if(0 != f) {
      return f
    }
  }
  return goog.array.defaultCompare(a.length, b.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(a, b, c) {
  c = goog.array.binarySearch(a, b, c);
  return 0 > c ? (goog.array.insertAt(a, b, -(c + 1)), !0) : !1
};
goog.array.binaryRemove = function(a, b, c) {
  b = goog.array.binarySearch(a, b, c);
  return 0 <= b ? goog.array.removeAt(a, b) : !1
};
goog.array.bucket = function(a, b) {
  for(var c = {}, d = 0;d < a.length;d++) {
    var e = a[d], f = b(e, d, a);
    goog.isDef(f) && (c[f] || (c[f] = [])).push(e)
  }
  return c
};
goog.array.toObject = function(a, b, c) {
  var d = {};
  goog.array.forEach(a, function(e, f) {
    d[b.call(c, e, f, a)] = e
  });
  return d
};
goog.array.repeat = function(a, b) {
  for(var c = [], d = 0;d < b;d++) {
    c[d] = a
  }
  return c
};
goog.array.flatten = function(a) {
  for(var b = [], c = 0;c < arguments.length;c++) {
    var d = arguments[c];
    goog.isArray(d) ? b.push.apply(b, goog.array.flatten.apply(null, d)) : b.push(d)
  }
  return b
};
goog.array.rotate = function(a, b) {
  goog.asserts.assert(null != a.length);
  a.length && (b %= a.length, 0 < b ? goog.array.ARRAY_PROTOTYPE_.unshift.apply(a, a.splice(-b, b)) : 0 > b && goog.array.ARRAY_PROTOTYPE_.push.apply(a, a.splice(0, -b)));
  return a
};
goog.array.zip = function(a) {
  if(!arguments.length) {
    return[]
  }
  for(var b = [], c = 0;;c++) {
    for(var d = [], e = 0;e < arguments.length;e++) {
      var f = arguments[e];
      if(c >= f.length) {
        return b
      }
      d.push(f[c])
    }
    b.push(d)
  }
};
goog.array.shuffle = function(a, b) {
  for(var c = b || Math.random, d = a.length - 1;0 < d;d--) {
    var e = Math.floor(c() * (d + 1)), f = a[d];
    a[d] = a[e];
    a[e] = f
  }
};
// Input 12
goog.debug.entryPointRegistry = {};
goog.debug.EntryPointMonitor = function() {
};
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.monitors_ = [];
goog.debug.entryPointRegistry.monitorsMayExist_ = !1;
goog.debug.entryPointRegistry.register = function(a) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = a;
  if(goog.debug.entryPointRegistry.monitorsMayExist_) {
    for(var b = goog.debug.entryPointRegistry.monitors_, c = 0;c < b.length;c++) {
      a(goog.bind(b[c].wrap, b[c]))
    }
  }
};
goog.debug.entryPointRegistry.monitorAll = function(a) {
  goog.debug.entryPointRegistry.monitorsMayExist_ = !0;
  for(var b = goog.bind(a.wrap, a), c = 0;c < goog.debug.entryPointRegistry.refList_.length;c++) {
    goog.debug.entryPointRegistry.refList_[c](b)
  }
  goog.debug.entryPointRegistry.monitors_.push(a)
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(a) {
  var b = goog.debug.entryPointRegistry.monitors_;
  goog.asserts.assert(a == b[b.length - 1], "Only the most recent monitor can be unwrapped.");
  a = goog.bind(a.unwrap, a);
  for(var c = 0;c < goog.debug.entryPointRegistry.refList_.length;c++) {
    goog.debug.entryPointRegistry.refList_[c](a)
  }
  b.length--
};
// Input 13
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(a) {
  return a
}};
// Input 14
goog.userAgent = {};
goog.userAgent.ASSUME_IE = !1;
goog.userAgent.ASSUME_GECKO = !1;
goog.userAgent.ASSUME_WEBKIT = !1;
goog.userAgent.ASSUME_MOBILE_WEBKIT = !1;
goog.userAgent.ASSUME_OPERA = !1;
goog.userAgent.ASSUME_ANY_VERSION = !1;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global.navigator ? goog.global.navigator.userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global.navigator
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = !1;
  goog.userAgent.detectedIe_ = !1;
  goog.userAgent.detectedWebkit_ = !1;
  goog.userAgent.detectedMobile_ = !1;
  goog.userAgent.detectedGecko_ = !1;
  var a;
  if(!goog.userAgent.BROWSER_KNOWN_ && (a = goog.userAgent.getUserAgentString())) {
    var b = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = 0 == a.indexOf("Opera");
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && -1 != a.indexOf("MSIE");
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && -1 != a.indexOf("WebKit");
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && -1 != a.indexOf("Mobile");
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && "Gecko" == b.product
  }
};
goog.userAgent.BROWSER_KNOWN_ || goog.userAgent.init_();
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var a = goog.userAgent.getNavigator();
  return a && a.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = !1;
goog.userAgent.ASSUME_WINDOWS = !1;
goog.userAgent.ASSUME_LINUX = !1;
goog.userAgent.ASSUME_X11 = !1;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator().appVersion || "", "X11")
};
goog.userAgent.PLATFORM_KNOWN_ || goog.userAgent.initPlatform_();
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var a = "", b;
  goog.userAgent.OPERA && goog.global.opera ? (a = goog.global.opera.version, a = "function" == typeof a ? a() : a) : (goog.userAgent.GECKO ? b = /rv\:([^\);]+)(\)|;)/ : goog.userAgent.IE ? b = /MSIE\s+([^\);]+)(\)|;)/ : goog.userAgent.WEBKIT && (b = /WebKit\/(\S+)/), b && (a = (a = b.exec(goog.userAgent.getUserAgentString())) ? a[1] : ""));
  return goog.userAgent.IE && (b = goog.userAgent.getDocumentMode_(), b > parseFloat(a)) ? String(b) : a
};
goog.userAgent.getDocumentMode_ = function() {
  var a = goog.global.document;
  return a ? a.documentMode : void 0
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(a, b) {
  return goog.string.compareVersions(a, b)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(a) {
  return goog.userAgent.ASSUME_ANY_VERSION || goog.userAgent.isVersionCache_[a] || (goog.userAgent.isVersionCache_[a] = 0 <= goog.string.compareVersions(goog.userAgent.VERSION, a))
};
goog.userAgent.isDocumentMode = function(a) {
  return goog.userAgent.IE && goog.userAgent.DOCUMENT_MODE >= a
};
goog.userAgent.DOCUMENT_MODE = function() {
  var a = goog.global.document;
  return!a || !goog.userAgent.IE ? void 0 : goog.userAgent.getDocumentMode_() || ("CSS1Compat" == a.compatMode ? parseInt(goog.userAgent.VERSION, 10) : 5)
}();
// Input 15
goog.events = {};
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), HAS_W3C_EVENT_SUPPORT:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), HAS_NAVIGATOR_ONLINE_PROPERTY:!goog.userAgent.WEBKIT || goog.userAgent.isVersion("528"), HAS_HTML5_NETWORK_EVENT_SUPPORT:goog.userAgent.GECKO && goog.userAgent.isVersion("1.9b") || goog.userAgent.IE && goog.userAgent.isVersion("8") || goog.userAgent.OPERA && 
goog.userAgent.isVersion("9.5") || goog.userAgent.WEBKIT && goog.userAgent.isVersion("528"), HTML5_NETWORK_EVENTS_FIRE_ON_BODY:goog.userAgent.GECKO && !goog.userAgent.isVersion("8") || goog.userAgent.IE && !goog.userAgent.isVersion("9"), TOUCH_ENABLED:"ontouchstart" in goog.global || !(!goog.global.document || !(document.documentElement && "ontouchstart" in document.documentElement)) || !(!goog.global.navigator || !goog.global.navigator.msMaxTouchPoints)};
// Input 16
goog.events.Event = function(a, b) {
  this.type = a;
  this.currentTarget = this.target = b
};
goog.events.Event.prototype.disposeInternal = function() {
};
goog.events.Event.prototype.dispose = function() {
};
goog.events.Event.prototype.propagationStopped_ = !1;
goog.events.Event.prototype.defaultPrevented = !1;
goog.events.Event.prototype.returnValue_ = !0;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = !0
};
goog.events.Event.prototype.preventDefault = function() {
  this.defaultPrevented = !0;
  this.returnValue_ = !1
};
goog.events.Event.stopPropagation = function(a) {
  a.stopPropagation()
};
goog.events.Event.preventDefault = function(a) {
  a.preventDefault()
};
// Input 17
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAG:"drag", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", DRAGEND:"dragend", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", BEFOREUNLOAD:"beforeunload", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", 
POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", BEFORECOPY:"beforecopy", BEFORECUT:"beforecut", BEFOREPASTE:"beforepaste", ONLINE:"online", OFFLINE:"offline", MESSAGE:"message", CONNECT:"connect", TRANSITIONEND:goog.userAgent.WEBKIT ? "webkitTransitionEnd" : goog.userAgent.OPERA ? "oTransitionEnd" : "transitionend", MSGESTURECHANGE:"MSGestureChange", MSGESTUREEND:"MSGestureEnd", MSGESTUREHOLD:"MSGestureHold", MSGESTURESTART:"MSGestureStart", MSGESTURETAP:"MSGestureTap", MSGOTPOINTERCAPTURE:"MSGotPointerCapture", 
MSINERTIASTART:"MSInertiaStart", MSLOSTPOINTERCAPTURE:"MSLostPointerCapture", MSPOINTERCANCEL:"MSPointerCancel", MSPOINTERDOWN:"MSPointerDown", MSPOINTERMOVE:"MSPointerMove", MSPOINTEROVER:"MSPointerOver", MSPOINTEROUT:"MSPointerOut", MSPOINTERUP:"MSPointerUp", TEXTINPUT:"textinput", COMPOSITIONSTART:"compositionstart", COMPOSITIONUPDATE:"compositionupdate", COMPOSITIONEND:"compositionend"};
// Input 18
goog.reflect = {};
goog.reflect.object = function(a, b) {
  return b
};
goog.reflect.sinkValue = function(a) {
  goog.reflect.sinkValue[" "](a);
  return a
};
goog.reflect.sinkValue[" "] = goog.nullFunction;
goog.reflect.canAccessProperty = function(a, b) {
  try {
    return goog.reflect.sinkValue(a[b]), !0
  }catch(c) {
  }
  return!1
};
// Input 19
goog.events.BrowserEvent = function(a, b) {
  a && this.init(a, b)
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = !1;
goog.events.BrowserEvent.prototype.altKey = !1;
goog.events.BrowserEvent.prototype.shiftKey = !1;
goog.events.BrowserEvent.prototype.metaKey = !1;
goog.events.BrowserEvent.prototype.platformModifierKey = !1;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(a, b) {
  var c = this.type = a.type;
  goog.events.Event.call(this, c);
  this.target = a.target || a.srcElement;
  this.currentTarget = b;
  var d = a.relatedTarget;
  d ? goog.userAgent.GECKO && (goog.reflect.canAccessProperty(d, "nodeName") || (d = null)) : c == goog.events.EventType.MOUSEOVER ? d = a.fromElement : c == goog.events.EventType.MOUSEOUT && (d = a.toElement);
  this.relatedTarget = d;
  this.offsetX = goog.userAgent.WEBKIT || void 0 !== a.offsetX ? a.offsetX : a.layerX;
  this.offsetY = goog.userAgent.WEBKIT || void 0 !== a.offsetY ? a.offsetY : a.layerY;
  this.clientX = void 0 !== a.clientX ? a.clientX : a.pageX;
  this.clientY = void 0 !== a.clientY ? a.clientY : a.pageY;
  this.screenX = a.screenX || 0;
  this.screenY = a.screenY || 0;
  this.button = a.button;
  this.keyCode = a.keyCode || 0;
  this.charCode = a.charCode || ("keypress" == c ? a.keyCode : 0);
  this.ctrlKey = a.ctrlKey;
  this.altKey = a.altKey;
  this.shiftKey = a.shiftKey;
  this.metaKey = a.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? a.metaKey : a.ctrlKey;
  this.state = a.state;
  this.event_ = a;
  a.defaultPrevented && this.preventDefault();
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(a) {
  return goog.events.BrowserFeature.HAS_W3C_BUTTON ? this.event_.button == a : "click" == this.type ? a == goog.events.BrowserEvent.MouseButton.LEFT : !!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[a])
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  this.event_.stopPropagation ? this.event_.stopPropagation() : this.event_.cancelBubble = !0
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var a = this.event_;
  if(a.preventDefault) {
    a.preventDefault()
  }else {
    if(a.returnValue = !1, goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        if(a.ctrlKey || 112 <= a.keyCode && 123 >= a.keyCode) {
          a.keyCode = -1
        }
      }catch(b) {
      }
    }
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
};
// Input 20
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function() {
};
goog.events.EventWrapper.prototype.unlisten = function() {
};
// Input 21
goog.events.Listenable = function() {
};
goog.events.Listenable.USE_LISTENABLE_INTERFACE = !1;
goog.events.ListenableKey = function() {
};
// Input 22
goog.events.Listener = function() {
  goog.events.Listener.ENABLE_MONITORING && (this.creationStack = Error().stack)
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.ENABLE_MONITORING = !1;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = !1;
goog.events.Listener.prototype.callOnce = !1;
goog.events.Listener.prototype.init = function(a, b, c, d, e, f) {
  if(goog.isFunction(a)) {
    this.isFunctionListener_ = !0
  }else {
    if(a && a.handleEvent && goog.isFunction(a.handleEvent)) {
      this.isFunctionListener_ = !1
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = a;
  this.proxy = b;
  this.src = c;
  this.type = d;
  this.capture = !!e;
  this.handler = f;
  this.callOnce = !1;
  this.key = ++goog.events.Listener.counter_;
  this.removed = !1
};
goog.events.Listener.prototype.handleEvent = function(a) {
  return this.isFunctionListener_ ? this.listener.call(this.handler || this.src, a) : this.listener.handleEvent.call(this.listener, a)
};
// Input 23
goog.object = {};
goog.object.forEach = function(a, b, c) {
  for(var d in a) {
    b.call(c, a[d], d, a)
  }
};
goog.object.filter = function(a, b, c) {
  var d = {}, e;
  for(e in a) {
    b.call(c, a[e], e, a) && (d[e] = a[e])
  }
  return d
};
goog.object.map = function(a, b, c) {
  var d = {}, e;
  for(e in a) {
    d[e] = b.call(c, a[e], e, a)
  }
  return d
};
goog.object.some = function(a, b, c) {
  for(var d in a) {
    if(b.call(c, a[d], d, a)) {
      return!0
    }
  }
  return!1
};
goog.object.every = function(a, b, c) {
  for(var d in a) {
    if(!b.call(c, a[d], d, a)) {
      return!1
    }
  }
  return!0
};
goog.object.getCount = function(a) {
  var b = 0, c;
  for(c in a) {
    b++
  }
  return b
};
goog.object.getAnyKey = function(a) {
  for(var b in a) {
    return b
  }
};
goog.object.getAnyValue = function(a) {
  for(var b in a) {
    return a[b]
  }
};
goog.object.contains = function(a, b) {
  return goog.object.containsValue(a, b)
};
goog.object.getValues = function(a) {
  var b = [], c = 0, d;
  for(d in a) {
    b[c++] = a[d]
  }
  return b
};
goog.object.getKeys = function(a) {
  var b = [], c = 0, d;
  for(d in a) {
    b[c++] = d
  }
  return b
};
goog.object.getValueByKeys = function(a, b) {
  for(var c = goog.isArrayLike(b), d = c ? b : arguments, c = c ? 0 : 1;c < d.length && !(a = a[d[c]], !goog.isDef(a));c++) {
  }
  return a
};
goog.object.containsKey = function(a, b) {
  return b in a
};
goog.object.containsValue = function(a, b) {
  for(var c in a) {
    if(a[c] == b) {
      return!0
    }
  }
  return!1
};
goog.object.findKey = function(a, b, c) {
  for(var d in a) {
    if(b.call(c, a[d], d, a)) {
      return d
    }
  }
};
goog.object.findValue = function(a, b, c) {
  return(b = goog.object.findKey(a, b, c)) && a[b]
};
goog.object.isEmpty = function(a) {
  for(var b in a) {
    return!1
  }
  return!0
};
goog.object.clear = function(a) {
  for(var b in a) {
    delete a[b]
  }
};
goog.object.remove = function(a, b) {
  var c;
  (c = b in a) && delete a[b];
  return c
};
goog.object.add = function(a, b, c) {
  if(b in a) {
    throw Error('The object already contains the key "' + b + '"');
  }
  goog.object.set(a, b, c)
};
goog.object.get = function(a, b, c) {
  return b in a ? a[b] : c
};
goog.object.set = function(a, b, c) {
  a[b] = c
};
goog.object.setIfUndefined = function(a, b, c) {
  return b in a ? a[b] : a[b] = c
};
goog.object.clone = function(a) {
  var b = {}, c;
  for(c in a) {
    b[c] = a[c]
  }
  return b
};
goog.object.unsafeClone = function(a) {
  var b = goog.typeOf(a);
  if("object" == b || "array" == b) {
    if(a.clone) {
      return a.clone()
    }
    var b = "array" == b ? [] : {}, c;
    for(c in a) {
      b[c] = goog.object.unsafeClone(a[c])
    }
    return b
  }
  return a
};
goog.object.transpose = function(a) {
  var b = {}, c;
  for(c in a) {
    b[a[c]] = c
  }
  return b
};
goog.object.PROTOTYPE_FIELDS_ = "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");
goog.object.extend = function(a, b) {
  for(var c, d, e = 1;e < arguments.length;e++) {
    d = arguments[e];
    for(c in d) {
      a[c] = d[c]
    }
    for(var f = 0;f < goog.object.PROTOTYPE_FIELDS_.length;f++) {
      c = goog.object.PROTOTYPE_FIELDS_[f], Object.prototype.hasOwnProperty.call(d, c) && (a[c] = d[c])
    }
  }
};
goog.object.create = function(a) {
  var b = arguments.length;
  if(1 == b && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(b % 2) {
    throw Error("Uneven number of arguments");
  }
  for(var c = {}, d = 0;d < b;d += 2) {
    c[arguments[d]] = arguments[d + 1]
  }
  return c
};
goog.object.createSet = function(a) {
  var b = arguments.length;
  if(1 == b && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  for(var c = {}, d = 0;d < b;d++) {
    c[arguments[d]] = !0
  }
  return c
};
goog.object.createImmutableView = function(a) {
  var b = a;
  Object.isFrozen && !Object.isFrozen(a) && (b = Object.create(a), Object.freeze(b));
  return b
};
goog.object.isImmutableView = function(a) {
  return!!Object.isFrozen && Object.isFrozen(a)
};
// Input 24
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.listen = function(a, b, c, d, e) {
  if(goog.isArray(b)) {
    for(var f = 0;f < b.length;f++) {
      goog.events.listen(a, b[f], c, d, e)
    }
    return null
  }
  return goog.events.listen_(a, b, c, !1, d, e)
};
goog.events.listen_ = function(a, b, c, d, e, f) {
  if(!b) {
    throw Error("Invalid event type");
  }
  e = !!e;
  var g = goog.events.listenerTree_;
  b in g || (g[b] = {count_:0, remaining_:0});
  g = g[b];
  e in g || (g[e] = {count_:0, remaining_:0}, g.count_++);
  var g = g[e], h = goog.getUid(a), i;
  g.remaining_++;
  if(g[h]) {
    i = g[h];
    for(var j = 0;j < i.length;j++) {
      if(g = i[j], g.listener == c && g.handler == f) {
        if(g.removed) {
          break
        }
        d || (i[j].callOnce = !1);
        return i[j].key
      }
    }
  }else {
    i = g[h] = [], g.count_++
  }
  j = goog.events.getProxy();
  j.src = a;
  g = new goog.events.Listener;
  g.init(c, j, a, b, e, f);
  g.callOnce = d;
  c = g.key;
  j.key = c;
  i.push(g);
  goog.events.listeners_[c] = g;
  goog.events.sources_[h] || (goog.events.sources_[h] = []);
  goog.events.sources_[h].push(g);
  a.addEventListener ? (a == goog.global || !a.customEvent_) && a.addEventListener(b, j, e) : a.attachEvent(goog.events.getOnString_(b), j);
  return c
};
goog.events.getProxy = function() {
  var a = goog.events.handleBrowserEvent_, b = goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT ? function(c) {
    return a.call(b.src, b.key, c)
  } : function(c) {
    c = a.call(b.src, b.key, c);
    if(!c) {
      return c
    }
  };
  return b
};
goog.events.listenOnce = function(a, b, c, d, e) {
  if(goog.isArray(b)) {
    for(var f = 0;f < b.length;f++) {
      goog.events.listenOnce(a, b[f], c, d, e)
    }
    return null
  }
  return goog.events.listen_(a, b, c, !0, d, e)
};
goog.events.listenWithWrapper = function(a, b, c, d, e) {
  b.listen(a, c, d, e)
};
goog.events.unlisten = function(a, b, c, d, e) {
  if(goog.isArray(b)) {
    for(var f = 0;f < b.length;f++) {
      goog.events.unlisten(a, b[f], c, d, e)
    }
    return null
  }
  d = !!d;
  a = goog.events.getListeners_(a, b, d);
  if(!a) {
    return!1
  }
  for(f = 0;f < a.length;f++) {
    if(a[f].listener == c && a[f].capture == d && a[f].handler == e) {
      return goog.events.unlistenByKey(a[f].key)
    }
  }
  return!1
};
goog.events.unlistenByKey = function(a) {
  if(!goog.events.listeners_[a]) {
    return!1
  }
  var b = goog.events.listeners_[a];
  if(b.removed) {
    return!1
  }
  var c = b.src, d = b.type, e = b.proxy, f = b.capture;
  c.removeEventListener ? (c == goog.global || !c.customEvent_) && c.removeEventListener(d, e, f) : c.detachEvent && c.detachEvent(goog.events.getOnString_(d), e);
  c = goog.getUid(c);
  goog.events.sources_[c] && (e = goog.events.sources_[c], goog.array.remove(e, b), 0 == e.length && delete goog.events.sources_[c]);
  b.removed = !0;
  if(b = goog.events.listenerTree_[d][f][c]) {
    b.needsCleanup_ = !0, goog.events.cleanUp_(d, f, c, b)
  }
  delete goog.events.listeners_[a];
  return!0
};
goog.events.unlistenWithWrapper = function(a, b, c, d, e) {
  b.unlisten(a, c, d, e)
};
goog.events.cleanUp_ = function(a, b, c, d) {
  if(!d.locked_ && d.needsCleanup_) {
    for(var e = 0, f = 0;e < d.length;e++) {
      d[e].removed ? d[e].proxy.src = null : (e != f && (d[f] = d[e]), f++)
    }
    d.length = f;
    d.needsCleanup_ = !1;
    0 == f && (delete goog.events.listenerTree_[a][b][c], goog.events.listenerTree_[a][b].count_--, 0 == goog.events.listenerTree_[a][b].count_ && (delete goog.events.listenerTree_[a][b], goog.events.listenerTree_[a].count_--), 0 == goog.events.listenerTree_[a].count_ && delete goog.events.listenerTree_[a])
  }
};
goog.events.removeAll = function(a, b, c) {
  var d = 0, e = null == b, f = null == c;
  c = !!c;
  if(null == a) {
    goog.object.forEach(goog.events.sources_, function(a) {
      for(var g = a.length - 1;0 <= g;g--) {
        var h = a[g];
        if((e || b == h.type) && (f || c == h.capture)) {
          goog.events.unlistenByKey(h.key), d++
        }
      }
    })
  }else {
    if(a = goog.getUid(a), goog.events.sources_[a]) {
      a = goog.events.sources_[a];
      for(var g = a.length - 1;0 <= g;g--) {
        var h = a[g];
        if((e || b == h.type) && (f || c == h.capture)) {
          goog.events.unlistenByKey(h.key), d++
        }
      }
    }
  }
  return d
};
goog.events.getListeners = function(a, b, c) {
  return goog.events.getListeners_(a, b, c) || []
};
goog.events.getListeners_ = function(a, b, c) {
  var d = goog.events.listenerTree_;
  return b in d && (d = d[b], c in d && (d = d[c], a = goog.getUid(a), d[a])) ? d[a] : null
};
goog.events.getListener = function(a, b, c, d, e) {
  d = !!d;
  if(a = goog.events.getListeners_(a, b, d)) {
    for(b = 0;b < a.length;b++) {
      if(!a[b].removed && a[b].listener == c && a[b].capture == d && a[b].handler == e) {
        return a[b]
      }
    }
  }
  return null
};
goog.events.hasListener = function(a, b, c) {
  a = goog.getUid(a);
  var d = goog.events.sources_[a];
  if(d) {
    var e = goog.isDef(b), f = goog.isDef(c);
    return e && f ? (d = goog.events.listenerTree_[b], !!d && !!d[c] && a in d[c]) : !e && !f ? !0 : goog.array.some(d, function(a) {
      return e && a.type == b || f && a.capture == c
    })
  }
  return!1
};
goog.events.expose = function(a) {
  var b = [], c;
  for(c in a) {
    a[c] && a[c].id ? b.push(c + " = " + a[c] + " (" + a[c].id + ")") : b.push(c + " = " + a[c])
  }
  return b.join("\n")
};
goog.events.getOnString_ = function(a) {
  return a in goog.events.onStringMap_ ? goog.events.onStringMap_[a] : goog.events.onStringMap_[a] = goog.events.onString_ + a
};
goog.events.fireListeners = function(a, b, c, d) {
  var e = goog.events.listenerTree_;
  return b in e && (e = e[b], c in e) ? goog.events.fireListeners_(e[c], a, b, c, d) : !0
};
goog.events.fireListeners_ = function(a, b, c, d, e) {
  var f = 1;
  b = goog.getUid(b);
  if(a[b]) {
    a.remaining_--;
    a = a[b];
    a.locked_ ? a.locked_++ : a.locked_ = 1;
    try {
      for(var g = a.length, h = 0;h < g;h++) {
        var i = a[h];
        i && !i.removed && (f &= !1 !== goog.events.fireListener(i, e))
      }
    }finally {
      a.locked_--, goog.events.cleanUp_(c, d, b, a)
    }
  }
  return Boolean(f)
};
goog.events.fireListener = function(a, b) {
  a.callOnce && goog.events.unlistenByKey(a.key);
  return a.handleEvent(b)
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(a, b) {
  var c = b.type || b, d = goog.events.listenerTree_;
  if(!(c in d)) {
    return!0
  }
  if(goog.isString(b)) {
    b = new goog.events.Event(b, a)
  }else {
    if(b instanceof goog.events.Event) {
      b.target = b.target || a
    }else {
      var e = b;
      b = new goog.events.Event(c, a);
      goog.object.extend(b, e)
    }
  }
  var e = 1, f, d = d[c], c = !0 in d, g;
  if(c) {
    f = [];
    for(g = a;g;g = g.getParentEventTarget()) {
      f.push(g)
    }
    g = d[!0];
    g.remaining_ = g.count_;
    for(var h = f.length - 1;!b.propagationStopped_ && 0 <= h && g.remaining_;h--) {
      b.currentTarget = f[h], e &= goog.events.fireListeners_(g, f[h], b.type, !0, b) && !1 != b.returnValue_
    }
  }
  if(!1 in d) {
    if(g = d[!1], g.remaining_ = g.count_, c) {
      for(h = 0;!b.propagationStopped_ && h < f.length && g.remaining_;h++) {
        b.currentTarget = f[h], e &= goog.events.fireListeners_(g, f[h], b.type, !1, b) && !1 != b.returnValue_
      }
    }else {
      for(d = a;!b.propagationStopped_ && d && g.remaining_;d = d.getParentEventTarget()) {
        b.currentTarget = d, e &= goog.events.fireListeners_(g, d, b.type, !1, b) && !1 != b.returnValue_
      }
    }
  }
  return Boolean(e)
};
goog.events.protectBrowserEventEntryPoint = function(a) {
  goog.events.handleBrowserEvent_ = a.protectEntryPoint(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(a, b) {
  if(!goog.events.listeners_[a]) {
    return!0
  }
  var c = goog.events.listeners_[a], d = c.type, e = goog.events.listenerTree_;
  if(!(d in e)) {
    return!0
  }
  var e = e[d], f, g;
  if(!goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    f = b || goog.getObjectByName("window.event");
    var h = !0 in e, i = !1 in e;
    if(h) {
      if(goog.events.isMarkedIeEvent_(f)) {
        return!0
      }
      goog.events.markIeEvent_(f)
    }
    var j = new goog.events.BrowserEvent;
    j.init(f, this);
    f = !0;
    try {
      if(h) {
        for(var k = [], m = j.currentTarget;m;m = m.parentNode) {
          k.push(m)
        }
        g = e[!0];
        g.remaining_ = g.count_;
        for(var l = k.length - 1;!j.propagationStopped_ && 0 <= l && g.remaining_;l--) {
          j.currentTarget = k[l], f &= goog.events.fireListeners_(g, k[l], d, !0, j)
        }
        if(i) {
          g = e[!1];
          g.remaining_ = g.count_;
          for(l = 0;!j.propagationStopped_ && l < k.length && g.remaining_;l++) {
            j.currentTarget = k[l], f &= goog.events.fireListeners_(g, k[l], d, !1, j)
          }
        }
      }else {
        f = goog.events.fireListener(c, j)
      }
    }finally {
      k && (k.length = 0)
    }
    return f
  }
  d = new goog.events.BrowserEvent(b, this);
  return f = goog.events.fireListener(c, d)
};
goog.events.markIeEvent_ = function(a) {
  var b = !1;
  if(0 == a.keyCode) {
    try {
      a.keyCode = -1;
      return
    }catch(c) {
      b = !0
    }
  }
  if(b || void 0 == a.returnValue) {
    a.returnValue = !0
  }
};
goog.events.isMarkedIeEvent_ = function(a) {
  return 0 > a.keyCode || void 0 != a.returnValue
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(a) {
  return a + "_" + goog.events.uniqueIdCounter_++
};
goog.debug.entryPointRegistry.register(function(a) {
  goog.events.handleBrowserEvent_ = a(goog.events.handleBrowserEvent_)
});
// Input 25
wtf.io = {};
wtf.io.EventType = {READ:goog.events.getUniqueId("read")};
// Input 26
goog.crypt = {};
goog.crypt.stringToByteArray = function(a) {
  for(var b = [], c = 0, d = 0;d < a.length;d++) {
    for(var e = a.charCodeAt(d);255 < e;) {
      b[c++] = e & 255, e >>= 8
    }
    b[c++] = e
  }
  return b
};
goog.crypt.byteArrayToString = function(a) {
  return String.fromCharCode.apply(null, a)
};
goog.crypt.byteArrayToHex = function(a) {
  return goog.array.map(a, function(a) {
    a = a.toString(16);
    return 1 < a.length ? a : "0" + a
  }).join("")
};
goog.crypt.hexToByteArray = function(a) {
  goog.asserts.assert(0 == a.length % 2, "Key string length must be multiple of 2");
  for(var b = [], c = 0;c < a.length;c += 2) {
    b.push(parseInt(a.substring(c, c + 2), 16))
  }
  return b
};
goog.crypt.stringToUtf8ByteArray = function(a) {
  a = a.replace(/\r\n/g, "\n");
  for(var b = [], c = 0, d = 0;d < a.length;d++) {
    var e = a.charCodeAt(d);
    128 > e ? b[c++] = e : (2048 > e ? b[c++] = e >> 6 | 192 : (b[c++] = e >> 12 | 224, b[c++] = e >> 6 & 63 | 128), b[c++] = e & 63 | 128)
  }
  return b
};
goog.crypt.utf8ByteArrayToString = function(a) {
  for(var b = [], c = 0, d = 0;c < a.length;) {
    var e = a[c++];
    if(128 > e) {
      b[d++] = String.fromCharCode(e)
    }else {
      if(191 < e && 224 > e) {
        var f = a[c++];
        b[d++] = String.fromCharCode((e & 31) << 6 | f & 63)
      }else {
        var f = a[c++], g = a[c++];
        b[d++] = String.fromCharCode((e & 15) << 12 | (f & 63) << 6 | g & 63)
      }
    }
  }
  return b.join("")
};
goog.crypt.xorByteArray = function(a, b) {
  goog.asserts.assert(a.length == b.length, "XOR array lengths must match");
  for(var c = [], d = 0;d < a.length;d++) {
    c.push(a[d] ^ b[d])
  }
  return c
};
// Input 27
goog.crypt.base64 = {};
goog.crypt.base64.byteToCharMap_ = null;
goog.crypt.base64.charToByteMap_ = null;
goog.crypt.base64.byteToCharMapWebSafe_ = null;
goog.crypt.base64.charToByteMapWebSafe_ = null;
goog.crypt.base64.ENCODED_VALS_BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
goog.crypt.base64.ENCODED_VALS = goog.crypt.base64.ENCODED_VALS_BASE + "+/=";
goog.crypt.base64.ENCODED_VALS_WEBSAFE = goog.crypt.base64.ENCODED_VALS_BASE + "-_.";
goog.crypt.base64.HAS_NATIVE_SUPPORT = goog.userAgent.GECKO || goog.userAgent.WEBKIT || goog.userAgent.OPERA || "function" == typeof goog.global.atob;
goog.crypt.base64.encodeByteArray = function(a, b) {
  if(!goog.isArrayLike(a)) {
    throw Error("encodeByteArray takes an array as a parameter");
  }
  goog.crypt.base64.init_();
  for(var c = b ? goog.crypt.base64.byteToCharMapWebSafe_ : goog.crypt.base64.byteToCharMap_, d = [], e = 0;e < a.length;e += 3) {
    var f = a[e], g = e + 1 < a.length, h = g ? a[e + 1] : 0, i = e + 2 < a.length, j = i ? a[e + 2] : 0, k = f >> 2, f = (f & 3) << 4 | h >> 4, h = (h & 15) << 2 | j >> 6, j = j & 63;
    i || (j = 64, g || (h = 64));
    d.push(c[k], c[f], c[h], c[j])
  }
  return d.join("")
};
goog.crypt.base64.encodeString = function(a, b) {
  return goog.crypt.base64.HAS_NATIVE_SUPPORT && !b ? goog.global.btoa(a) : goog.crypt.base64.encodeByteArray(goog.crypt.stringToByteArray(a), b)
};
goog.crypt.base64.decodeString = function(a, b) {
  return goog.crypt.base64.HAS_NATIVE_SUPPORT && !b ? goog.global.atob(a) : goog.crypt.byteArrayToString(goog.crypt.base64.decodeStringToByteArray(a, b))
};
goog.crypt.base64.decodeStringToByteArray = function(a, b) {
  goog.crypt.base64.init_();
  for(var c = b ? goog.crypt.base64.charToByteMapWebSafe_ : goog.crypt.base64.charToByteMap_, d = [], e = 0;e < a.length;) {
    var f = c[a.charAt(e++)], g = e < a.length ? c[a.charAt(e)] : 0;
    ++e;
    var h = e < a.length ? c[a.charAt(e)] : 0;
    ++e;
    var i = e < a.length ? c[a.charAt(e)] : 0;
    ++e;
    if(null == f || null == g || null == h || null == i) {
      throw Error();
    }
    d.push(f << 2 | g >> 4);
    64 != h && (d.push(g << 4 & 240 | h >> 2), 64 != i && d.push(h << 6 & 192 | i))
  }
  return d
};
goog.crypt.base64.init_ = function() {
  if(!goog.crypt.base64.byteToCharMap_) {
    goog.crypt.base64.byteToCharMap_ = {};
    goog.crypt.base64.charToByteMap_ = {};
    goog.crypt.base64.byteToCharMapWebSafe_ = {};
    goog.crypt.base64.charToByteMapWebSafe_ = {};
    for(var a = 0;a < goog.crypt.base64.ENCODED_VALS.length;a++) {
      goog.crypt.base64.byteToCharMap_[a] = goog.crypt.base64.ENCODED_VALS.charAt(a), goog.crypt.base64.charToByteMap_[goog.crypt.base64.byteToCharMap_[a]] = a, goog.crypt.base64.byteToCharMapWebSafe_[a] = goog.crypt.base64.ENCODED_VALS_WEBSAFE.charAt(a), goog.crypt.base64.charToByteMapWebSafe_[goog.crypt.base64.byteToCharMapWebSafe_[a]] = a
    }
  }
};
// Input 28
wtf.io.FILE_EXTENSION = ".wtf-trace";
wtf.io.HAS_TYPED_ARRAYS = !!goog.global.Uint8Array;
wtf.io.createByteArray = wtf.io.HAS_TYPED_ARRAYS ? function(a) {
  return new Uint8Array(a)
} : function(a) {
  a = Array(a);
  for(var b = 0;b < a.length;b++) {
    a[b] = 0
  }
  return a
};
wtf.io.isByteArray = function(a) {
  return!a ? !1 : wtf.io.HAS_TYPED_ARRAYS && a instanceof Uint8Array || goog.isArray(a)
};
wtf.io.createByteArrayFromArray = function(a) {
  for(var b = wtf.io.createByteArray(a.length), c = 0;c < a.length;c++) {
    b[c] = a[c] & 255
  }
  return b
};
wtf.io.byteArraysEqual = function(a, b) {
  if(a.length != b.length) {
    return!1
  }
  for(var c = 0;c < a.length;c++) {
    if(a[c] != b[c]) {
      return!1
    }
  }
  return!0
};
wtf.io.copyByteArray = function(a, b, c) {
  c = c || 0;
  if(wtf.io.HAS_TYPED_ARRAYS) {
    b.set(a, c)
  }else {
    for(var d = 0;d < a.length;d++) {
      b[c + d] = a[d]
    }
  }
};
wtf.io.combineByteArrays = function(a) {
  for(var b = 0, c = 0;c < a.length;c++) {
    b += a[c].length
  }
  for(var b = wtf.io.createByteArray(b), d = c = 0;c < a.length;c++) {
    wtf.io.copyByteArray(a[c], b, d), d += a[c].length
  }
  return b
};
wtf.io.sliceByteArray = wtf.io.HAS_TYPED_ARRAYS ? function(a, b, c) {
  for(var d = new Uint8Array(c), e = 0;e < c;e++) {
    d[e] = a[b + e]
  }
  return d
} : function(a, b, c) {
  return a.slice(b, c)
};
wtf.io.byteArrayToString = function(a) {
  return goog.crypt.base64.encodeByteArray(a)
};
wtf.io.stringToByteArray = function(a, b) {
  var c = goog.crypt.base64.decodeStringToByteArray(a);
  if(!c) {
    return 0
  }
  if(c.length > b.length) {
    return-1
  }
  for(var d = 0;d < c.length;d++) {
    b[d] = c[d]
  }
  return c.length
};
wtf.io.stringToNewByteArray = function(a) {
  a = goog.crypt.base64.decodeStringToByteArray(a);
  return!a ? null : wtf.io.createByteArrayFromArray(a)
};
wtf.io.JavaScriptFloatConverter_ = function() {
  return{float32ToUint8Array:function() {
    goog.asserts.fail("JS float converter not yet implemented")
  }, uint8ArrayToFloat32:function() {
    goog.asserts.fail("JS float converter not yet implemented");
    return NaN
  }, float64ToUint8Array:function() {
    goog.asserts.fail("JS float converter not yet implemented")
  }, uint8ArrayToFloat64:function() {
    goog.asserts.fail("JS float converter not yet implemented");
    return NaN
  }}
}();
wtf.io.TypedArrayFloatConverter_ = function() {
  var a = new Float32Array(16), b = new Uint8Array(a.buffer), c = new Float64Array(16), d = new Uint8Array(c.buffer);
  return{float32ToUint8Array:function(c, d, g) {
    a[0] = c;
    d[g++] = b[0];
    d[g++] = b[1];
    d[g++] = b[2];
    d[g++] = b[3]
  }, uint8ArrayToFloat32:function(c, d) {
    b[0] = c[d++];
    b[1] = c[d++];
    b[2] = c[d++];
    b[3] = c[d++];
    return a[0]
  }, float64ToUint8Array:function(a, b, g) {
    c[0] = a;
    b[g++] = d[0];
    b[g++] = d[1];
    b[g++] = d[2];
    b[g++] = d[3];
    b[g++] = d[4];
    b[g++] = d[5];
    b[g++] = d[6];
    b[g++] = d[7]
  }, uint8ArrayToFloat64:function(a, b) {
    d[0] = a[b++];
    d[1] = a[b++];
    d[2] = a[b++];
    d[3] = a[b++];
    d[4] = a[b++];
    d[5] = a[b++];
    d[6] = a[b++];
    d[7] = a[b++];
    return c[0]
  }}
}();
wtf.io.floatConverter = goog.global.Float32Array && goog.global.Float64Array ? wtf.io.TypedArrayFloatConverter_ : wtf.io.JavaScriptFloatConverter_;
// Input 29
wtf.io.Buffer = function(a, b) {
  this.capacity = a;
  this.offset = 0;
  this.data = b || wtf.io.createByteArray(a)
};
wtf.io.Buffer.ENABLE_ASSERTS = !1;
wtf.io.Buffer.prototype.clone = function(a) {
  a = goog.isDef(a) ? a : this.offset;
  a = Math.min(a, this.capacity);
  for(var b = new wtf.io.Buffer(a), c = this.data, d = b.data, e = 0;e < a;e++) {
    d[e] = c[e]
  }
  return b
};
wtf.io.Buffer.prototype.truncate = function() {
  this.data = wtf.io.sliceByteArray(this.data, 0, this.offset);
  this.capacity = this.offset
};
wtf.io.Buffer.prototype.ensureAvailable_ = wtf.io.Buffer.ENABLE_ASSERTS ? function(a) {
  goog.asserts.assert(this.offset + a <= this.data.length)
} : goog.nullFunction;
wtf.io.Buffer.prototype.ensureCapacity_ = wtf.io.Buffer.ENABLE_ASSERTS ? function(a) {
  goog.asserts.assert(this.offset + a <= this.capacity)
} : goog.nullFunction;
wtf.io.Buffer.prototype.readInt8 = function() {
  this.ensureAvailable_(1);
  var a = this.data[this.offset++];
  return 127 < a ? a - 256 : a
};
wtf.io.Buffer.prototype.writeInt8 = function(a) {
  this.ensureCapacity_(1);
  this.data[this.offset++] = a & 255
};
wtf.io.Buffer.prototype.readInt16 = function() {
  this.ensureAvailable_(2);
  var a = this.data, b = this.offset, c = a[b++], a = a[b++];
  this.offset = b;
  b = c << 8 | a;
  return 32767 < b ? b - 65536 : b
};
wtf.io.Buffer.prototype.writeInt16 = function(a) {
  this.ensureCapacity_(2);
  var b = this.data, c = this.offset;
  b[c++] = a >> 8 & 255;
  b[c++] = a & 255;
  this.offset = c
};
wtf.io.Buffer.prototype.readInt32 = function() {
  this.ensureAvailable_(4);
  var a = this.data, b = this.offset, c = a[b++], d = a[b++], e = a[b++], a = a[b++];
  this.offset = b;
  b = c << 24 >>> 0 | d << 16 | e << 8 | a;
  return 2147483647 < b ? b - 4294967296 : b
};
wtf.io.Buffer.prototype.writeInt32 = function(a) {
  this.ensureCapacity_(4);
  var b = this.data, c = this.offset;
  b[c++] = a >> 24 & 255;
  b[c++] = a >> 16 & 255;
  b[c++] = a >> 8 & 255;
  b[c++] = a & 255;
  this.offset = c
};
wtf.io.Buffer.prototype.readUint8 = function() {
  this.ensureAvailable_(1);
  return this.data[this.offset++]
};
wtf.io.Buffer.prototype.writeUint8 = function(a) {
  this.ensureCapacity_(1);
  this.data[this.offset++] = a & 255
};
wtf.io.Buffer.prototype.readUint16 = function() {
  this.ensureAvailable_(2);
  var a = this.data, b = this.offset, c = a[b++], a = a[b++];
  this.offset = b;
  return c << 8 | a
};
wtf.io.Buffer.prototype.writeUint16 = function(a) {
  this.ensureCapacity_(2);
  var b = this.data, c = this.offset;
  b[c++] = a >> 8 & 255;
  b[c++] = a & 255;
  this.offset = c
};
wtf.io.Buffer.prototype.readUint32 = function() {
  this.ensureAvailable_(4);
  var a = this.data, b = this.offset, c = a[b++], d = a[b++], e = a[b++], a = a[b++];
  this.offset = b;
  return(c << 24 >>> 0 | d << 16 | e << 8 | a) >>> 0
};
wtf.io.Buffer.prototype.writeUint32 = function(a) {
  this.ensureCapacity_(4);
  var b = this.data, c = this.offset;
  b[c++] = a >> 24 & 255;
  b[c++] = a >> 16 & 255;
  b[c++] = a >> 8 & 255;
  b[c++] = a & 255;
  this.offset = c
};
wtf.io.Buffer.prototype.readVarUint = function() {
  this.ensureAvailable_(1);
  for(var a = 0, b = 0, c, d = this.data, e = this.offset;(c = d[e++] & 255) & 128;) {
    a |= (c & 127) << b, b += 7
  }
  this.offset = e;
  return a | c << b
};
wtf.io.Buffer.prototype.writeVarUint = function(a) {
  this.ensureCapacity_(5);
  a &= 4294967295;
  for(var b = this.data, c = this.offset;a & 4294967168;) {
    b[c++] = a & 127 | 128, a >>>= 7
  }
  b[c++] = a & 127;
  this.offset = c
};
wtf.io.Buffer.prototype.readVarInt = function() {
  var a = this.readVarUint();
  return(a << 31 >> 31 ^ a) >> 1 ^ a & -2147483648
};
wtf.io.Buffer.prototype.writeVarInt = function(a) {
  this.writeVarUint(a << 1 ^ a >> 31)
};
wtf.io.Buffer.prototype.readUint8Array = function(a) {
  this.ensureAvailable_(4);
  var b = this.readVarUint();
  this.ensureAvailable_(b);
  a = a && a.length == b ? a : wtf.io.createByteArray(b);
  for(var c = 0;c < b;c++) {
    a[c] = this.data[this.offset++]
  }
  return a
};
wtf.io.Buffer.prototype.writeUint8Array = function(a) {
  this.writeVarUint(a.length);
  this.ensureCapacity_(a.length);
  for(var b = 0;b < a.length;b++) {
    this.data[this.offset++] = a[b]
  }
};
wtf.io.Buffer.prototype.readFixedUint8Array = function(a) {
  this.ensureAvailable_(a.length);
  for(var b = 0;b < a.length;b++) {
    a[b] = this.data[this.offset++]
  }
  return a
};
wtf.io.Buffer.prototype.writeFixedUint8Array = function(a) {
  this.ensureCapacity_(a.length);
  for(var b = 0;b < a.length;b++) {
    this.data[this.offset++] = a[b]
  }
};
wtf.io.Buffer.prototype.readFloat32 = function() {
  this.ensureAvailable_(4);
  var a = wtf.io.floatConverter.uint8ArrayToFloat32(this.data, this.offset);
  this.offset += 4;
  return a
};
wtf.io.Buffer.prototype.writeFloat32 = function(a) {
  this.ensureCapacity_(4);
  wtf.io.floatConverter.float32ToUint8Array(a, this.data, this.offset);
  this.offset += 4
};
wtf.io.Buffer.prototype.readFloat64 = function() {
  this.ensureAvailable_(8);
  var a = wtf.io.floatConverter.uint8ArrayToFloat64(this.data, this.offset);
  this.offset += 8;
  return a
};
wtf.io.Buffer.prototype.writeFloat64 = function(a) {
  this.ensureCapacity_(8);
  wtf.io.floatConverter.float64ToUint8Array(a, this.data, this.offset);
  this.offset += 8
};
wtf.io.Buffer.prototype.readAsciiString = function() {
  this.ensureAvailable_(2);
  var a = this.data[this.offset++], b = this.data[this.offset++], a = a << 8 | b;
  if(!a) {
    return null
  }
  for(var b = this.data, c = this.offset, d = Array(a), e = 0;e < a;e++) {
    d[e] = String.fromCharCode(b[c++])
  }
  this.offset = c;
  return d.join("")
};
wtf.io.Buffer.prototype.writeAsciiString = function(a) {
  if(!a || !a.length) {
    this.ensureCapacity_(2), this.data[this.offset++] = 0, this.data[this.offset++] = 0
  }else {
    this.ensureCapacity_(2 + a.length);
    var b = this.data, c = this.offset;
    b[c++] = a.length >> 8 & 255;
    b[c++] = a.length & 255;
    for(var d = 0;d < a.length;d++) {
      b[c++] = a.charCodeAt(d) & 255
    }
    this.offset = c
  }
};
wtf.io.Buffer.MAX_UTF8_STRING_BYTE_LENGTH_ = 65535;
wtf.io.Buffer.MAX_UTF8_STRING_LENGTH_ = wtf.io.Buffer.MAX_UTF8_STRING_BYTE_LENGTH_ / 3;
wtf.io.Buffer.prototype.readUtf8String = function() {
  this.ensureAvailable_(2);
  var a = this.data[this.offset++], b = this.data[this.offset++], c = a << 8 | b;
  if(!c) {
    return null
  }
  var d = this.data, e = this.offset;
  this.ensureAvailable_(2);
  a = d[e++];
  b = d[e++];
  this.ensureAvailable_(a << 8 | b);
  a = Array(c);
  for(b = 0;b < c;) {
    var f = d[e++];
    if(128 > f) {
      a[b++] = String.fromCharCode(f)
    }else {
      if(191 < f && 224 > f) {
        var g = d[e++];
        a[b++] = String.fromCharCode((f & 31) << 6 | g & 63)
      }else {
        var g = d[e++], h = d[e++];
        a[b++] = String.fromCharCode((f & 15) << 12 | (g & 63) << 6 | h & 63)
      }
    }
  }
  this.offset = e;
  return a.join("")
};
wtf.io.Buffer.prototype.writeUtf8String = function(a) {
  if(!a || !a.length) {
    this.ensureCapacity_(2), this.data[this.offset++] = 0, this.data[this.offset++] = 0
  }else {
    goog.asserts.assert(a.length <= wtf.io.Buffer.MAX_UTF8_STRING_LENGTH_);
    a.length > wtf.io.Buffer.MAX_UTF8_STRING_LENGTH_ && (a = a.substr(0, wtf.io.Buffer.MAX_UTF8_STRING_LENGTH_));
    this.ensureCapacity_(4 + 3 * a.length);
    var b = this.data, c = this.offset;
    b[c++] = a.length >> 8 & 255;
    b[c++] = a.length & 255;
    for(var d = c, c = c + 2, e = 0, f = 0;f < a.length;f++) {
      var g = a.charCodeAt(f);
      128 > g ? (b[c++] = g, e++) : 2048 > g ? (b[c++] = g >> 6 | 192, b[c++] = g & 63 | 128, e += 2) : (b[c++] = g >> 12 | 224, b[c++] = g >> 6 & 63 | 128, b[c++] = g & 63 | 128, e += 3)
    }
    b[d] = e >> 8 & 255;
    b[d + 1] = e & 255;
    this.offset = c
  }
};
wtf.io.Buffer.getNameMap = function() {
  var a = goog.reflect.object(wtf.io.Buffer, {offset:0, data:1, readInt8:2, writeInt8:3, readInt16:4, writeInt16:5, readInt32:6, writeInt32:7, readUint8:8, writeUint8:9, readUint16:10, writeUint16:11, readUint32:12, writeUint32:13, readVarUint:14, writeVarUint:15, readVarInt:16, writeVarInt:17, readUint8Array:18, writeUint8Array:19, readFixedUint8Array:20, writeFixedUint8Array:21, readFloat32:22, writeFloat32:23, readFloat64:24, writeFloat64:25, readAsciiString:26, writeAsciiString:27, readUtf8String:28, 
  writeUtf8String:29}), a = goog.object.transpose(a);
  return{offset:a[0], data:a[1], readInt8:a[2], writeInt8:a[3], readInt16:a[4], writeInt16:a[5], readInt32:a[6], writeInt32:a[7], readUint8:a[8], writeUint8:a[9], readUint16:a[10], writeUint16:a[11], readUint32:a[12], writeUint32:a[13], readVarUint:a[14], writeVarUint:a[15], readVarInt:a[16], writeVarInt:a[17], readUint8Array:a[18], writeUint8Array:a[19], readFixedUint8Array:a[20], writeFixedUint8Array:a[21], readFloat32:a[22], writeFloat32:a[23], readFloat64:a[24], writeFloat64:a[25], readAsciiString:a[26], 
  writeAsciiString:a[27], readUtf8String:a[28], writeUtf8String:a[29]}
};
// Input 30
wtf.io.ReadStream = function() {
  wtf.events.EventEmitter.call(this);
  this.listening_ = !1
};
goog.inherits(wtf.io.ReadStream, wtf.events.EventEmitter);
wtf.io.ReadStream.prototype.isListening = function() {
  return this.listening_
};
wtf.io.ReadStream.prototype.listen = function() {
  goog.asserts.assert(!this.listening_);
  this.listening_ = !0;
  this.listeningBegan()
};
wtf.io.ReadStream.prototype.fireReadEvent = function(a, b) {
  goog.asserts.assert(this.listening_);
  this.emitEvent(wtf.io.EventType.READ, a, b)
};
wtf.io.ReadStream.prototype.getBuffer = function(a) {
  return new wtf.io.Buffer(a)
};
wtf.io.ReadStream.prototype.releaseBuffer = function() {
};
// Input 31
wtf.io.CopyReadStream = function(a, b) {
  wtf.io.ReadStream.call(this);
  this.sourceStream_ = a;
  this.registerDisposable(this.sourceStream_);
  this.targetStream_ = b;
  this.registerDisposable(this.targetStream_);
  this.sourceStream_.addListener(wtf.io.EventType.READ, this.bufferRead_, this)
};
goog.inherits(wtf.io.CopyReadStream, wtf.io.ReadStream);
wtf.io.CopyReadStream.prototype.bufferRead_ = function(a, b) {
  var c = a.clone(b);
  c.offset = b;
  this.targetStream_.write(c, function() {
  }, this);
  this.targetStream_.flush();
  this.fireReadEvent(a, b)
};
wtf.io.CopyReadStream.prototype.listeningBegan = function() {
  this.sourceStream_.listen()
};
wtf.io.CopyReadStream.prototype.getBuffer = function(a) {
  return this.sourceStream_.getBuffer(a)
};
wtf.io.CopyReadStream.prototype.releaseBuffer = function(a) {
  this.sourceStream_.releaseBuffer(a)
};
// Input 32
wtf.io.WriteStream = function() {
  goog.Disposable.call(this)
};
goog.inherits(wtf.io.WriteStream, goog.Disposable);
// Input 33
wtf.io.MemoryWriteStream = function(a) {
  wtf.io.WriteStream.call(this);
  this.resultArray_ = a;
  this.buffers_ = [];
  this.totalLength_ = 0
};
goog.inherits(wtf.io.MemoryWriteStream, wtf.io.WriteStream);
wtf.io.MemoryWriteStream.prototype.disposeInternal = function() {
  this.resultArray_.push(this.getData());
  wtf.io.MemoryWriteStream.superClass_.disposeInternal.call(this)
};
wtf.io.MemoryWriteStream.prototype.getLength = function() {
  return this.totalLength_
};
wtf.io.MemoryWriteStream.prototype.getData = function() {
  return wtf.io.combineByteArrays(this.buffers_)
};
wtf.io.MemoryWriteStream.prototype.write = function(a) {
  a = a.clone();
  this.buffers_.push(a.data);
  this.totalLength_ += a.capacity;
  return!0
};
wtf.io.MemoryWriteStream.prototype.flush = function() {
};
// Input 34
wtf.analysis.Storage = function() {
  goog.Disposable.call(this);
  this.allStreams_ = []
};
goog.inherits(wtf.analysis.Storage, goog.Disposable);
wtf.analysis.Storage.prototype.captureStream = function(a) {
  var b = new wtf.io.MemoryWriteStream([]);
  this.allStreams_.push(b);
  return new wtf.io.CopyReadStream(a, b)
};
wtf.analysis.Storage.prototype.snapshotDataStreamBuffers = function() {
  for(var a = [], b = 0;b < this.allStreams_.length;b++) {
    var c = this.allStreams_[b];
    c instanceof wtf.io.MemoryWriteStream && a.push({type:"application/x-extension-wtf-trace", data:c.getData()})
  }
  return a
};
// Input 35
goog.math = {};
goog.math.Long = function(a, b) {
  this.low_ = a | 0;
  this.high_ = b | 0
};
goog.math.Long.IntCache_ = {};
goog.math.Long.fromInt = function(a) {
  if(-128 <= a && 128 > a) {
    var b = goog.math.Long.IntCache_[a];
    if(b) {
      return b
    }
  }
  b = new goog.math.Long(a | 0, 0 > a ? -1 : 0);
  -128 <= a && 128 > a && (goog.math.Long.IntCache_[a] = b);
  return b
};
goog.math.Long.fromNumber = function(a) {
  return isNaN(a) || !isFinite(a) ? goog.math.Long.ZERO : a <= -goog.math.Long.TWO_PWR_63_DBL_ ? goog.math.Long.MIN_VALUE : a + 1 >= goog.math.Long.TWO_PWR_63_DBL_ ? goog.math.Long.MAX_VALUE : 0 > a ? goog.math.Long.fromNumber(-a).negate() : new goog.math.Long(a % goog.math.Long.TWO_PWR_32_DBL_ | 0, a / goog.math.Long.TWO_PWR_32_DBL_ | 0)
};
goog.math.Long.fromBits = function(a, b) {
  return new goog.math.Long(a, b)
};
goog.math.Long.fromString = function(a, b) {
  if(0 == a.length) {
    throw Error("number format error: empty string");
  }
  var c = b || 10;
  if(2 > c || 36 < c) {
    throw Error("radix out of range: " + c);
  }
  if("-" == a.charAt(0)) {
    return goog.math.Long.fromString(a.substring(1), c).negate()
  }
  if(0 <= a.indexOf("-")) {
    throw Error('number format error: interior "-" character: ' + a);
  }
  for(var d = goog.math.Long.fromNumber(Math.pow(c, 8)), e = goog.math.Long.ZERO, f = 0;f < a.length;f += 8) {
    var g = Math.min(8, a.length - f), h = parseInt(a.substring(f, f + g), c);
    8 > g ? (g = goog.math.Long.fromNumber(Math.pow(c, g)), e = e.multiply(g).add(goog.math.Long.fromNumber(h))) : (e = e.multiply(d), e = e.add(goog.math.Long.fromNumber(h)))
  }
  return e
};
goog.math.Long.TWO_PWR_16_DBL_ = 65536;
goog.math.Long.TWO_PWR_24_DBL_ = 16777216;
goog.math.Long.TWO_PWR_32_DBL_ = goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
goog.math.Long.TWO_PWR_31_DBL_ = goog.math.Long.TWO_PWR_32_DBL_ / 2;
goog.math.Long.TWO_PWR_48_DBL_ = goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
goog.math.Long.TWO_PWR_64_DBL_ = goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;
goog.math.Long.TWO_PWR_63_DBL_ = goog.math.Long.TWO_PWR_64_DBL_ / 2;
goog.math.Long.ZERO = goog.math.Long.fromInt(0);
goog.math.Long.ONE = goog.math.Long.fromInt(1);
goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);
goog.math.Long.MAX_VALUE = goog.math.Long.fromBits(-1, 2147483647);
goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, -2147483648);
goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(16777216);
goog.math.Long.prototype.toInt = function() {
  return this.low_
};
goog.math.Long.prototype.toNumber = function() {
  return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ + this.getLowBitsUnsigned()
};
goog.math.Long.prototype.toString = function(a) {
  a = a || 10;
  if(2 > a || 36 < a) {
    throw Error("radix out of range: " + a);
  }
  if(this.isZero()) {
    return"0"
  }
  if(this.isNegative()) {
    if(this.equals(goog.math.Long.MIN_VALUE)) {
      var b = goog.math.Long.fromNumber(a), c = this.div(b), b = c.multiply(b).subtract(this);
      return c.toString(a) + b.toInt().toString(a)
    }
    return"-" + this.negate().toString(a)
  }
  for(var c = goog.math.Long.fromNumber(Math.pow(a, 6)), b = this, d = "";;) {
    var e = b.div(c), f = b.subtract(e.multiply(c)).toInt().toString(a), b = e;
    if(b.isZero()) {
      return f + d
    }
    for(;6 > f.length;) {
      f = "0" + f
    }
    d = "" + f + d
  }
};
goog.math.Long.prototype.getHighBits = function() {
  return this.high_
};
goog.math.Long.prototype.getLowBits = function() {
  return this.low_
};
goog.math.Long.prototype.getLowBitsUnsigned = function() {
  return 0 <= this.low_ ? this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_
};
goog.math.Long.prototype.getNumBitsAbs = function() {
  if(this.isNegative()) {
    return this.equals(goog.math.Long.MIN_VALUE) ? 64 : this.negate().getNumBitsAbs()
  }
  for(var a = 0 != this.high_ ? this.high_ : this.low_, b = 31;0 < b && 0 == (a & 1 << b);b--) {
  }
  return 0 != this.high_ ? b + 33 : b + 1
};
goog.math.Long.prototype.isZero = function() {
  return 0 == this.high_ && 0 == this.low_
};
goog.math.Long.prototype.isNegative = function() {
  return 0 > this.high_
};
goog.math.Long.prototype.isOdd = function() {
  return 1 == (this.low_ & 1)
};
goog.math.Long.prototype.equals = function(a) {
  return this.high_ == a.high_ && this.low_ == a.low_
};
goog.math.Long.prototype.notEquals = function(a) {
  return this.high_ != a.high_ || this.low_ != a.low_
};
goog.math.Long.prototype.lessThan = function(a) {
  return 0 > this.compare(a)
};
goog.math.Long.prototype.lessThanOrEqual = function(a) {
  return 0 >= this.compare(a)
};
goog.math.Long.prototype.greaterThan = function(a) {
  return 0 < this.compare(a)
};
goog.math.Long.prototype.greaterThanOrEqual = function(a) {
  return 0 <= this.compare(a)
};
goog.math.Long.prototype.compare = function(a) {
  if(this.equals(a)) {
    return 0
  }
  var b = this.isNegative(), c = a.isNegative();
  return b && !c ? -1 : !b && c ? 1 : this.subtract(a).isNegative() ? -1 : 1
};
goog.math.Long.prototype.negate = function() {
  return this.equals(goog.math.Long.MIN_VALUE) ? goog.math.Long.MIN_VALUE : this.not().add(goog.math.Long.ONE)
};
goog.math.Long.prototype.add = function(a) {
  var b = this.high_ >>> 16, c = this.high_ & 65535, d = this.low_ >>> 16, e = a.high_ >>> 16, f = a.high_ & 65535, g = a.low_ >>> 16, h;
  h = 0 + ((this.low_ & 65535) + (a.low_ & 65535));
  a = 0 + (h >>> 16);
  a += d + g;
  d = 0 + (a >>> 16);
  d += c + f;
  c = 0 + (d >>> 16);
  c = c + (b + e) & 65535;
  return goog.math.Long.fromBits((a & 65535) << 16 | h & 65535, c << 16 | d & 65535)
};
goog.math.Long.prototype.subtract = function(a) {
  return this.add(a.negate())
};
goog.math.Long.prototype.multiply = function(a) {
  if(this.isZero() || a.isZero()) {
    return goog.math.Long.ZERO
  }
  if(this.equals(goog.math.Long.MIN_VALUE)) {
    return a.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO
  }
  if(a.equals(goog.math.Long.MIN_VALUE)) {
    return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO
  }
  if(this.isNegative()) {
    return a.isNegative() ? this.negate().multiply(a.negate()) : this.negate().multiply(a).negate()
  }
  if(a.isNegative()) {
    return this.multiply(a.negate()).negate()
  }
  if(this.lessThan(goog.math.Long.TWO_PWR_24_) && a.lessThan(goog.math.Long.TWO_PWR_24_)) {
    return goog.math.Long.fromNumber(this.toNumber() * a.toNumber())
  }
  var b = this.high_ >>> 16, c = this.high_ & 65535, d = this.low_ >>> 16, e = this.low_ & 65535, f = a.high_ >>> 16, g = a.high_ & 65535, h = a.low_ >>> 16;
  a = a.low_ & 65535;
  var i, j, k, m;
  m = 0 + e * a;
  k = 0 + (m >>> 16);
  k += d * a;
  j = 0 + (k >>> 16);
  k = (k & 65535) + e * h;
  j += k >>> 16;
  k &= 65535;
  j += c * a;
  i = 0 + (j >>> 16);
  j = (j & 65535) + d * h;
  i += j >>> 16;
  j &= 65535;
  j += e * g;
  i += j >>> 16;
  j &= 65535;
  i = i + (b * a + c * h + d * g + e * f) & 65535;
  return goog.math.Long.fromBits(k << 16 | m & 65535, i << 16 | j)
};
goog.math.Long.prototype.div = function(a) {
  if(a.isZero()) {
    throw Error("division by zero");
  }
  if(this.isZero()) {
    return goog.math.Long.ZERO
  }
  if(this.equals(goog.math.Long.MIN_VALUE)) {
    if(a.equals(goog.math.Long.ONE) || a.equals(goog.math.Long.NEG_ONE)) {
      return goog.math.Long.MIN_VALUE
    }
    if(a.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ONE
    }
    var b = this.shiftRight(1).div(a).shiftLeft(1);
    if(b.equals(goog.math.Long.ZERO)) {
      return a.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE
    }
    var c = this.subtract(a.multiply(b));
    return b.add(c.div(a))
  }
  if(a.equals(goog.math.Long.MIN_VALUE)) {
    return goog.math.Long.ZERO
  }
  if(this.isNegative()) {
    return a.isNegative() ? this.negate().div(a.negate()) : this.negate().div(a).negate()
  }
  if(a.isNegative()) {
    return this.div(a.negate()).negate()
  }
  for(var d = goog.math.Long.ZERO, c = this;c.greaterThanOrEqual(a);) {
    for(var b = Math.max(1, Math.floor(c.toNumber() / a.toNumber())), e = Math.ceil(Math.log(b) / Math.LN2), e = 48 >= e ? 1 : Math.pow(2, e - 48), f = goog.math.Long.fromNumber(b), g = f.multiply(a);g.isNegative() || g.greaterThan(c);) {
      b -= e, f = goog.math.Long.fromNumber(b), g = f.multiply(a)
    }
    f.isZero() && (f = goog.math.Long.ONE);
    d = d.add(f);
    c = c.subtract(g)
  }
  return d
};
goog.math.Long.prototype.modulo = function(a) {
  return this.subtract(this.div(a).multiply(a))
};
goog.math.Long.prototype.not = function() {
  return goog.math.Long.fromBits(~this.low_, ~this.high_)
};
goog.math.Long.prototype.and = function(a) {
  return goog.math.Long.fromBits(this.low_ & a.low_, this.high_ & a.high_)
};
goog.math.Long.prototype.or = function(a) {
  return goog.math.Long.fromBits(this.low_ | a.low_, this.high_ | a.high_)
};
goog.math.Long.prototype.xor = function(a) {
  return goog.math.Long.fromBits(this.low_ ^ a.low_, this.high_ ^ a.high_)
};
goog.math.Long.prototype.shiftLeft = function(a) {
  a &= 63;
  if(0 == a) {
    return this
  }
  var b = this.low_;
  return 32 > a ? goog.math.Long.fromBits(b << a, this.high_ << a | b >>> 32 - a) : goog.math.Long.fromBits(0, b << a - 32)
};
goog.math.Long.prototype.shiftRight = function(a) {
  a &= 63;
  if(0 == a) {
    return this
  }
  var b = this.high_;
  return 32 > a ? goog.math.Long.fromBits(this.low_ >>> a | b << 32 - a, b >> a) : goog.math.Long.fromBits(b >> a - 32, 0 <= b ? 0 : -1)
};
goog.math.Long.prototype.shiftRightUnsigned = function(a) {
  a &= 63;
  if(0 == a) {
    return this
  }
  var b = this.high_;
  return 32 > a ? goog.math.Long.fromBits(this.low_ >>> a | b << 32 - a, b >>> a) : 32 == a ? goog.math.Long.fromBits(b, 0) : goog.math.Long.fromBits(b >>> a - 32, 0)
};
// Input 36
wtf.analysis.Event = function(a, b, c, d) {
  this.eventId_ = wtf.analysis.Event.nextEventId_++;
  this.eventType = a;
  this.zone = b;
  this.scope = null;
  this.time = c;
  this.args = d;
  this.tag = null
};
wtf.analysis.Event.nextEventId_ = 0;
wtf.analysis.Event.prototype.getId = function() {
  return this.eventId_
};
wtf.analysis.Event.prototype.getEventType = function() {
  return this.eventType
};
wtf.analysis.Event.prototype.getZone = function() {
  return this.zone
};
wtf.analysis.Event.prototype.getScope = function() {
  return this.scope
};
wtf.analysis.Event.prototype.setScope = function(a) {
  this.scope = a
};
wtf.analysis.Event.prototype.getTime = function() {
  return this.time
};
wtf.analysis.Event.prototype.getArguments = function() {
  return this.args
};
wtf.analysis.Event.prototype.getTag = function() {
  return this.tag
};
wtf.analysis.Event.prototype.setTag = function(a) {
  this.tag != a && (goog.dispose(this.tag), this.tag = a)
};
wtf.analysis.Event.prototype.drop = function() {
  this.setTag(null)
};
wtf.analysis.Event.comparer = function(a, b) {
  return a.time == b.time ? a.eventId_ - b.eventId_ : a.time - b.time
};
goog.exportSymbol("wtf.analysis.Event", wtf.analysis.Event);
goog.exportProperty(wtf.analysis.Event.prototype, "getId", wtf.analysis.Event.prototype.getId);
goog.exportProperty(wtf.analysis.Event.prototype, "getEventType", wtf.analysis.Event.prototype.getEventType);
goog.exportProperty(wtf.analysis.Event.prototype, "getZone", wtf.analysis.Event.prototype.getZone);
goog.exportProperty(wtf.analysis.Event.prototype, "getScope", wtf.analysis.Event.prototype.getScope);
goog.exportProperty(wtf.analysis.Event.prototype, "getTime", wtf.analysis.Event.prototype.getTime);
goog.exportProperty(wtf.analysis.Event.prototype, "getArguments", wtf.analysis.Event.prototype.getArguments);
goog.exportProperty(wtf.analysis.Event.prototype, "getTag", wtf.analysis.Event.prototype.getTime);
goog.exportProperty(wtf.analysis.Event.prototype, "setTag", wtf.analysis.Event.prototype.getTime);
wtf.analysis.ScopeEvent = function(a, b, c, d, e) {
  wtf.analysis.Event.call(this, a, b, c, d);
  this.scope = e
};
goog.inherits(wtf.analysis.ScopeEvent, wtf.analysis.Event);
wtf.analysis.ScopeEvent.prototype.getValue = function() {
  return this.scope
};
goog.exportSymbol("wtf.analysis.ScopeEvent", wtf.analysis.ScopeEvent);
goog.exportProperty(wtf.analysis.ScopeEvent.prototype, "getValue", wtf.analysis.ScopeEvent.prototype.getValue);
wtf.analysis.FlowEvent = function(a, b, c, d, e) {
  wtf.analysis.Event.call(this, a, b, c, d);
  this.value = e
};
goog.inherits(wtf.analysis.FlowEvent, wtf.analysis.Event);
wtf.analysis.FlowEvent.prototype.getValue = function() {
  return this.value
};
goog.exportSymbol("wtf.analysis.FlowEvent", wtf.analysis.FlowEvent);
goog.exportProperty(wtf.analysis.FlowEvent.prototype, "getValue", wtf.analysis.FlowEvent.prototype.getValue);
wtf.analysis.ZoneEvent = function(a, b, c, d, e) {
  wtf.analysis.Event.call(this, a, b, c, d);
  this.value = e
};
goog.inherits(wtf.analysis.ZoneEvent, wtf.analysis.Event);
wtf.analysis.ZoneEvent.prototype.getValue = function() {
  return this.value
};
goog.exportSymbol("wtf.analysis.ZoneEvent", wtf.analysis.ZoneEvent);
goog.exportProperty(wtf.analysis.ZoneEvent.prototype, "getValue", wtf.analysis.ZoneEvent.prototype.getValue);
wtf.analysis.TimeRangeEvent = function(a, b, c, d, e) {
  wtf.analysis.Event.call(this, a, b, c, d);
  this.value = e
};
goog.inherits(wtf.analysis.TimeRangeEvent, wtf.analysis.Event);
wtf.analysis.TimeRangeEvent.prototype.getValue = function() {
  return this.value
};
goog.exportSymbol("wtf.analysis.TimeRangeEvent", wtf.analysis.TimeRangeEvent);
goog.exportProperty(wtf.analysis.TimeRangeEvent.prototype, "getValue", wtf.analysis.TimeRangeEvent.prototype.getValue);
wtf.analysis.FrameEvent = function(a, b, c, d, e) {
  wtf.analysis.Event.call(this, a, b, c, d);
  this.value = e
};
goog.inherits(wtf.analysis.FrameEvent, wtf.analysis.Event);
wtf.analysis.FrameEvent.prototype.getValue = function() {
  return this.value
};
goog.exportSymbol("wtf.analysis.FrameEvent", wtf.analysis.FrameEvent);
goog.exportProperty(wtf.analysis.FrameEvent.prototype, "getValue", wtf.analysis.FrameEvent.prototype.getValue);
// Input 37
goog.json = {};
goog.json.isValid_ = function(a) {
  return/^\s*$/.test(a) ? !1 : /^[\],:{}\s\u2028\u2029]*$/.test(a.replace(/\\["\\\/bfnrtu]/g, "@").replace(/"[^"\\\n\r\u2028\u2029\x00-\x08\x0a-\x1f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g, ""))
};
goog.json.parse = function(a) {
  a = String(a);
  if(goog.json.isValid_(a)) {
    try {
      return eval("(" + a + ")")
    }catch(b) {
    }
  }
  throw Error("Invalid JSON string: " + a);
};
goog.json.unsafeParse = function(a) {
  return eval("(" + a + ")")
};
goog.json.serialize = function(a, b) {
  return(new goog.json.Serializer(b)).serialize(a)
};
goog.json.Serializer = function(a) {
  this.replacer_ = a
};
goog.json.Serializer.prototype.serialize = function(a) {
  var b = [];
  this.serialize_(a, b);
  return b.join("")
};
goog.json.Serializer.prototype.serialize_ = function(a, b) {
  switch(typeof a) {
    case "string":
      this.serializeString_(a, b);
      break;
    case "number":
      this.serializeNumber_(a, b);
      break;
    case "boolean":
      b.push(a);
      break;
    case "undefined":
      b.push("null");
      break;
    case "object":
      if(null == a) {
        b.push("null");
        break
      }
      if(goog.isArray(a)) {
        this.serializeArray(a, b);
        break
      }
      this.serializeObject_(a, b);
      break;
    case "function":
      break;
    default:
      throw Error("Unknown type: " + typeof a);
  }
};
goog.json.Serializer.charToJsonCharCache_ = {'"':'\\"', "\\":"\\\\", "/":"\\/", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\u000b"};
goog.json.Serializer.charsToReplace_ = /\uffff/.test("\uffff") ? /[\\\"\x00-\x1f\x7f-\uffff]/g : /[\\\"\x00-\x1f\x7f-\xff]/g;
goog.json.Serializer.prototype.serializeString_ = function(a, b) {
  b.push('"', a.replace(goog.json.Serializer.charsToReplace_, function(a) {
    if(a in goog.json.Serializer.charToJsonCharCache_) {
      return goog.json.Serializer.charToJsonCharCache_[a]
    }
    var b = a.charCodeAt(0), e = "\\u";
    16 > b ? e += "000" : 256 > b ? e += "00" : 4096 > b && (e += "0");
    return goog.json.Serializer.charToJsonCharCache_[a] = e + b.toString(16)
  }), '"')
};
goog.json.Serializer.prototype.serializeNumber_ = function(a, b) {
  b.push(isFinite(a) && !isNaN(a) ? a : "null")
};
goog.json.Serializer.prototype.serializeArray = function(a, b) {
  var c = a.length;
  b.push("[");
  for(var d = "", e = 0;e < c;e++) {
    b.push(d), d = a[e], this.serialize_(this.replacer_ ? this.replacer_.call(a, String(e), d) : d, b), d = ","
  }
  b.push("]")
};
goog.json.Serializer.prototype.serializeObject_ = function(a, b) {
  b.push("{");
  var c = "", d;
  for(d in a) {
    if(Object.prototype.hasOwnProperty.call(a, d)) {
      var e = a[d];
      "function" != typeof e && (b.push(c), this.serializeString_(d, b), b.push(":"), this.serialize_(this.replacer_ ? this.replacer_.call(a, d, e) : e, b), c = ",")
    }
  }
  b.push("}")
};
// Input 38
wtf.util = {};
wtf.util.FunctionBuilder = function() {
  this.isBuilding_ = !1;
  this.currentScopeVariableNames_ = [];
  this.currentScopeVariableValues_ = [];
  this.currentArgs_ = [];
  this.currentSource_ = []
};
wtf.util.FunctionBuilder.isSupported_ = void 0;
wtf.util.FunctionBuilder.isSupported = function() {
  if(void 0 === wtf.util.FunctionBuilder.isSupported_) {
    wtf.util.FunctionBuilder.isSupported_ = !0;
    try {
      wtf.util.FunctionBuilder.isSupported_ = !!new Function("")
    }catch(a) {
      wtf.util.FunctionBuilder.isSupported_ = !1
    }
  }
  return wtf.util.FunctionBuilder.isSupported_
};
wtf.util.FunctionBuilder.prototype.begin = function() {
  goog.asserts.assert(!this.isBuilding_);
  goog.asserts.assert(!this.currentArgs_.length);
  goog.asserts.assert(!this.currentSource_.length);
  this.isBuilding_ = !0
};
wtf.util.FunctionBuilder.prototype.addScopeVariable = function(a, b) {
  goog.asserts.assert(this.isBuilding_);
  this.currentScopeVariableNames_.push(a);
  this.currentScopeVariableValues_.push(b)
};
wtf.util.FunctionBuilder.prototype.addArgument = function(a) {
  goog.asserts.assert(this.isBuilding_);
  this.currentArgs_.push(a)
};
wtf.util.FunctionBuilder.prototype.append = function(a) {
  goog.asserts.assert(this.isBuilding_);
  for(var b = 0;b < arguments.length;b++) {
    this.currentSource_.push(arguments[b])
  }
};
wtf.util.FunctionBuilder.prototype.end = function(a) {
  goog.asserts.assert(this.isBuilding_);
  var b = this.currentSource_.join("\n"), c = a.replace(/#/g, "/"), b = new Function(this.currentScopeVariableNames_, ['"use strict";', "return function(" + this.currentArgs_.join(", ") + ") {", b, "};", "//@ sourceURL=x://wtf/" + c].join("\n"));
  b.displayName = a;
  b = b.apply(null, this.currentScopeVariableValues_);
  b.displayName = a;
  this.currentScopeVariableNames_.length = 0;
  this.currentScopeVariableValues_.length = 0;
  this.currentArgs_.length = 0;
  this.currentSource_.length = 0;
  this.isBuilding_ = !1;
  return b
};
// Input 39
wtf.analysis.EventTypeBuilder = function() {
  wtf.util.FunctionBuilder.call(this);
  this.bufferNames_ = wtf.io.Buffer.getNameMap()
};
goog.inherits(wtf.analysis.EventTypeBuilder, wtf.util.FunctionBuilder);
wtf.analysis.EventTypeBuilder.prototype.generate = function(a) {
  var b = wtf.analysis.EventTypeBuilder.READERS_;
  if(!wtf.util.FunctionBuilder.isSupported()) {
    var c = a.args;
    return function(a) {
      for(var d = {}, e = 0;e < c.length;e++) {
        var i = c[e];
        d[i.name] = b[i.typeName].read(a)
      }
      return d
    }
  }
  this.begin();
  this.addScopeVariable("jsonParse", goog.json.parse);
  this.addArgument("buffer");
  this.append("var value = {};");
  for(var d = 0;d < a.args.length;d++) {
    var e = a.args[d];
    this.append.apply(this, b[e.typeName].readSource(e.name, this.bufferNames_))
  }
  this.append("return value;");
  return this.end(a.toString())
};
wtf.analysis.EventTypeBuilder.READ_BOOL_ = {read:function(a) {
  return!!a.readInt8()
}, readSource:function(a, b) {
  return['value["' + a + '"] = !!buffer.' + b.readInt8 + "();"]
}};
wtf.analysis.EventTypeBuilder.READ_INT8_ = {read:function(a) {
  return a.readInt8()
}, readSource:function(a, b) {
  return['value["' + a + '"] = buffer.' + b.readInt8 + "();"]
}};
wtf.analysis.EventTypeBuilder.READ_INT8ARRAY_ = {read:function(a) {
  for(var b = a.readUint32(), c = new Int8Array(b), d = 0;d < b;d++) {
    c[d] = a.readInt8()
  }
  return c
}, readSource:function(a, b) {
  return["var " + a + "_len = buffer." + b.readUint32 + "();", "var " + a + '_ = value["' + a + '"] = new Int8Array(' + a + "_len);", "for (var n = 0; n < " + a + "_len; n++) {", "  " + a + "_[n] = buffer." + b.readInt8 + "();", "}"]
}};
wtf.analysis.EventTypeBuilder.READ_UINT8_ = {read:function(a) {
  return a.readUint8()
}, readSource:function(a, b) {
  return['value["' + a + '"] = buffer.' + b.readUint8 + "();"]
}};
wtf.analysis.EventTypeBuilder.READ_UINT8ARRAY_ = {read:function(a) {
  for(var b = a.readUint32(), c = new Uint8Array(b), d = 0;d < b;d++) {
    c[d] = a.readUint8()
  }
  return c
}, readSource:function(a, b) {
  return["var " + a + "_len = buffer." + b.readUint32 + "();", "var " + a + '_ = value["' + a + '"] = new Uint8Array(' + a + "_len);", "for (var n = 0; n < " + a + "_len; n++) {", "  " + a + "_[n] = buffer." + b.readUint8 + "();", "}"]
}};
wtf.analysis.EventTypeBuilder.READ_INT16_ = {read:function(a) {
  return a.readInt16()
}, readSource:function(a, b) {
  return['value["' + a + '"] = buffer.' + b.readInt16 + "();"]
}};
wtf.analysis.EventTypeBuilder.READ_INT16ARRAY_ = {read:function(a) {
  for(var b = a.readUint32(), c = new Uint16Array(b), d = 0;d < b;d++) {
    c[d] = a.readUint16()
  }
  return c
}, readSource:function(a, b) {
  return["var " + a + "_len = buffer." + b.readUint32 + "();", "var " + a + '_ = value["' + a + '"] = new Int16Array(' + a + "_len);", "for (var n = 0; n < " + a + "_len; n++) {", "  " + a + "_[n] = buffer." + b.readUint16 + "();", "}"]
}};
wtf.analysis.EventTypeBuilder.READ_UINT16_ = {read:function(a) {
  return a.readUint16()
}, readSource:function(a, b) {
  return['value["' + a + '"] = buffer.' + b.readUint16 + "();"]
}};
wtf.analysis.EventTypeBuilder.READ_UINT16ARRAY_ = {read:function(a) {
  for(var b = a.readUint32(), c = new Uint16Array(b), d = 0;d < b;d++) {
    c[d] = a.readUint16()
  }
  return c
}, readSource:function(a, b) {
  return["var " + a + "_len = buffer." + b.readUint32 + "();", "var " + a + '_ = value["' + a + '"] = new Uint16Array(' + a + "_len);", "for (var n = 0; n < " + a + "_len; n++) {", "  " + a + "_[n] = buffer." + b.readUint16 + "();", "}"]
}};
wtf.analysis.EventTypeBuilder.READ_INT32_ = {read:function(a) {
  return a.readInt32()
}, readSource:function(a, b) {
  return['value["' + a + '"] = buffer.' + b.readInt32 + "();"]
}};
wtf.analysis.EventTypeBuilder.READ_INT32ARRAY_ = {read:function(a) {
  for(var b = a.readUint32(), c = new Int32Array(b), d = 0;d < b;d++) {
    c[d] = a.readInt32()
  }
  return c
}, readSource:function(a, b) {
  return["var " + a + "_len = buffer." + b.readUint32 + "();", "var " + a + '_ = value["' + a + '"] = new Int32Array(' + a + "_len);", "for (var n = 0; n < " + a + "_len; n++) {", "  " + a + "_[n] = buffer." + b.readInt32 + "();", "}"]
}};
wtf.analysis.EventTypeBuilder.READ_UINT32_ = {read:function(a) {
  return a.readUint32()
}, readSource:function(a, b) {
  return['value["' + a + '"] = buffer.' + b.readUint32 + "();"]
}};
wtf.analysis.EventTypeBuilder.READ_UINT32ARRAY_ = {read:function(a) {
  for(var b = a.readUint32(), c = new Uint32Array(b), d = 0;d < b;d++) {
    c[d] = a.readUint32()
  }
  return c
}, readSource:function(a, b) {
  return["var " + a + "_len = buffer." + b.readUint32 + "();", "var " + a + '_ = value["' + a + '"] = new Uint32Array(' + a + "_len);", "for (var n = 0; n < " + a + "_len; n++) {", "  " + a + "_[n] = buffer." + b.readUint32 + "();", "}"]
}};
wtf.analysis.EventTypeBuilder.READ_FLOAT32_ = {read:function(a) {
  return a.readFloat32()
}, readSource:function(a, b) {
  return['value["' + a + '"] = buffer.' + b.readFloat32 + "();"]
}};
wtf.analysis.EventTypeBuilder.READ_FLOAT32ARRAY_ = {read:function(a) {
  for(var b = a.readUint32(), c = new Float32Array(b), d = 0;d < b;d++) {
    c[d] = a.readFloat32()
  }
  return c
}, readSource:function(a, b) {
  return["var " + a + "_len = buffer." + b.readUint32 + "();", "var " + a + '_ = value["' + a + '"] = new Float32Array(' + a + "_len);", "for (var n = 0; n < " + a + "_len; n++) {", "  " + a + "_[n] = buffer." + b.readFloat32 + "();", "}"]
}};
wtf.analysis.EventTypeBuilder.READ_ASCII_ = {read:function(a) {
  return a.readAsciiString()
}, readSource:function(a, b) {
  return['value["' + a + '"] = buffer.' + b.readAsciiString + "();"]
}};
wtf.analysis.EventTypeBuilder.READ_UTF8_ = {read:function(a) {
  return a.readUtf8String()
}, readSource:function(a, b) {
  return['value["' + a + '"] = buffer.' + b.readUtf8String + "();"]
}};
wtf.analysis.EventTypeBuilder.READ_ANY_ = {read:function(a) {
  a = a.readUtf8String();
  return goog.global.JSON.parse(a)
}, readSource:function(a, b) {
  return['value["' + a + '"] = jsonParse(buffer.' + b.readUtf8String + "());"]
}};
wtf.analysis.EventTypeBuilder.READ_FLOWID_ = {read:function(a) {
  return a.readUint32()
}, readSource:function(a, b) {
  return['value["' + a + '"] = buffer.' + b.readUint32 + "();"]
}};
wtf.analysis.EventTypeBuilder.READ_TIME32_ = {read:function(a) {
  return a.readUint32() / 1E3
}, readSource:function(a, b) {
  return['value["' + a + '"] = buffer.' + b.readUint32 + "() / 1000;"]
}};
wtf.analysis.EventTypeBuilder.READERS_ = {bool:wtf.analysis.EventTypeBuilder.READ_BOOL_, int8:wtf.analysis.EventTypeBuilder.READ_INT8_, "int8[]":wtf.analysis.EventTypeBuilder.READ_INT8ARRAY_, uint8:wtf.analysis.EventTypeBuilder.READ_UINT8_, "uint8[]":wtf.analysis.EventTypeBuilder.READ_UINT8ARRAY_, int16:wtf.analysis.EventTypeBuilder.READ_INT16_, "int16[]":wtf.analysis.EventTypeBuilder.READ_INT16ARRAY_, uint16:wtf.analysis.EventTypeBuilder.READ_UINT16_, "uint16[]":wtf.analysis.EventTypeBuilder.READ_UINT16ARRAY_, 
int32:wtf.analysis.EventTypeBuilder.READ_INT32_, "int32[]":wtf.analysis.EventTypeBuilder.READ_INT32ARRAY_, uint32:wtf.analysis.EventTypeBuilder.READ_UINT32_, "uint32[]":wtf.analysis.EventTypeBuilder.READ_UINT32ARRAY_, float32:wtf.analysis.EventTypeBuilder.READ_FLOAT32_, "float32[]":wtf.analysis.EventTypeBuilder.READ_FLOAT32ARRAY_, ascii:wtf.analysis.EventTypeBuilder.READ_ASCII_, utf8:wtf.analysis.EventTypeBuilder.READ_UTF8_, any:wtf.analysis.EventTypeBuilder.READ_ANY_, flowId:wtf.analysis.EventTypeBuilder.READ_FLOWID_, 
time32:wtf.analysis.EventTypeBuilder.READ_TIME32_};
// Input 40
wtf.data.VariableFlag = {};
wtf.data.Variable = function(a, b, c) {
  this.name = a;
  this.typeName = b;
  this.flags = c || 0
};
wtf.data.Variable.TYPE_MAP_ = {bool:"bool", int8:"int8", "byte":"int8", uint8:"uint8", octet:"uint8", int16:"int16", "short":"int16", uint16:"uint16", "unsigned short":"uint16", int32:"int32", "long":"int32", uint32:"uint32", "unsigned long":"uint32", float32:"float32", "float":"float32", ascii:"ascii", utf8:"utf8", DOMString:"utf8", any:"any", flowId:"flowId", time32:"time32"};
wtf.data.Variable.create = function(a, b) {
  var c = !1;
  goog.string.endsWith(b, "[]") && (c = !0, b = b.replace("[]", ""));
  goog.string.startsWith(b, "sequence<") && (c = !0, b = b.substr(9, b.length - 10));
  b = wtf.data.Variable.TYPE_MAP_[b];
  if(!b) {
    return null
  }
  c && (b += "[]");
  return new wtf.data.Variable(a, b, 0)
};
wtf.data.Variable.SIGNATURE_REGEX_ = /[ ]*([a-zA-Z0-9 \[\]\<\>]+) ([a-zA-Z0-9_]+)/;
wtf.data.Variable.parseSignatureArguments = function(a) {
  a = a.split(",");
  for(var b = [], c = 0, d = wtf.data.Variable.SIGNATURE_REGEX_, e = 0;e < a.length;e++) {
    var f = d.exec(a[e]), g = f[1], f = f[2], h = f.indexOf("@");
    -1 != h && (c = Number(f.substr(h + 1)), f = f.substr(0, h));
    g = wtf.data.Variable.create(f, g);
    goog.asserts.assert(g);
    g && b.push({ordinal:c, variable:g});
    c++
  }
  return b
};
wtf.data.Variable.parseSignature = function(a) {
  var b = /^([a-zA-Z0-9_\.#:]+)(\((.*)\)$)?/.exec(a);
  a = b[1];
  var c = b[3], b = [], d = [];
  if(c) {
    b = wtf.data.Variable.parseSignatureArguments(c);
    for(c = 0;c < b.length;c++) {
      d.push(b[c].variable)
    }
  }
  return{name:a, args:d, argMap:b}
};
// Input 41
wtf.analysis.EventType = function(a, b, c, d) {
  this.name = a;
  this.eventClass = b;
  this.flags = c;
  this.args = d;
  a = wtf.analysis.EventType.getBuilder_();
  this.parse = d.length ? a.generate(this) : null
};
wtf.analysis.EventType.prototype.toString = function() {
  return this.name
};
wtf.analysis.EventType.prototype.getName = function() {
  return this.name
};
wtf.analysis.EventType.prototype.getClass = function() {
  return this.eventClass
};
wtf.analysis.EventType.prototype.getFlags = function() {
  return this.flags
};
wtf.analysis.EventType.prototype.getArguments = function() {
  return this.args
};
wtf.analysis.EventType.parse = function(a) {
  for(var b = a.args, b = b ? wtf.data.Variable.parseSignatureArguments(b) : [], c = [], d = 0;d < b.length;d++) {
    c.push(b[d].variable)
  }
  return new wtf.analysis.EventType(a.name, a.eventClass, a.flags, c)
};
wtf.analysis.EventType.createInstance = function(a, b) {
  var c = wtf.data.Variable.parseSignature(a);
  return new wtf.analysis.EventType(c.name, wtf.data.EventClass.INSTANCE, b || 0, c.args)
};
wtf.analysis.EventType.createScope = function(a, b) {
  var c = wtf.data.Variable.parseSignature(a);
  return new wtf.analysis.EventType(c.name, wtf.data.EventClass.SCOPE, b || 0, c.args)
};
wtf.analysis.EventType.builder_ = null;
wtf.analysis.EventType.getBuilder_ = function() {
  wtf.analysis.EventType.builder_ || (wtf.analysis.EventType.builder_ = new wtf.analysis.EventTypeBuilder);
  return wtf.analysis.EventType.builder_
};
goog.exportSymbol("wtf.analysis.EventType", wtf.analysis.EventType);
goog.exportProperty(wtf.analysis.EventType.prototype, "toString", wtf.analysis.EventType.prototype.toString);
goog.exportProperty(wtf.analysis.EventType.prototype, "getName", wtf.analysis.EventType.prototype.getName);
goog.exportProperty(wtf.analysis.EventType.prototype, "getClass", wtf.analysis.EventType.prototype.getClass);
goog.exportProperty(wtf.analysis.EventType.prototype, "getFlags", wtf.analysis.EventType.prototype.getFlags);
goog.exportProperty(wtf.analysis.EventType.prototype, "getArguments", wtf.analysis.EventType.prototype.getArguments);
// Input 42
wtf.analysis.Flow = function(a, b) {
  this.flowId_ = a;
  this.parentFlow_ = b;
  this.branchEvent_ = null;
  this.extendEvents_ = [];
  this.dataEvents_ = this.terminateEvent_ = null
};
wtf.analysis.Flow.prototype.getId = function() {
  return this.flowId_
};
wtf.analysis.Flow.prototype.getParent = function() {
  return this.parentFlow_
};
wtf.analysis.Flow.prototype.getBranchEvent = function() {
  return this.branchEvent_
};
wtf.analysis.Flow.prototype.setBranchEvent = function(a) {
  this.branchEvent_ = a
};
wtf.analysis.Flow.prototype.getExtendEvents = function() {
  return this.extendEvents_
};
wtf.analysis.Flow.prototype.addExtendEvent = function(a) {
  this.extendEvents_.push(a)
};
wtf.analysis.Flow.prototype.getTerminateEvent = function() {
  return this.terminateEvent_
};
wtf.analysis.Flow.prototype.setTerminateEvent = function(a) {
  this.terminateEvent_ = a
};
wtf.analysis.Flow.prototype.addDataEvent = function(a) {
  this.dataEvents_ ? this.dataEvents_.push(a) : this.dataEvents_ = [a]
};
wtf.analysis.Flow.prototype.getData = function() {
  var a = {};
  if(this.dataEvents_) {
    for(var b = 0;b < this.dataEvents_.length;b++) {
      var c = this.dataEvents_[b];
      if(c.eventType.flags & wtf.data.EventFlag.INTERNAL) {
        a[c.args.name] = c.args.value
      }else {
        for(var d = 1;d < c.eventType.args.length;d++) {
          var e = c.eventType.args[d];
          a[e.name] = c.args[e.name]
        }
      }
    }
  }
  return a
};
goog.exportSymbol("wtf.analysis.Flow", wtf.analysis.Flow);
goog.exportProperty(wtf.analysis.Flow.prototype, "getId", wtf.analysis.Flow.prototype.getId);
goog.exportProperty(wtf.analysis.Flow.prototype, "getParent", wtf.analysis.Flow.prototype.getParent);
goog.exportProperty(wtf.analysis.Flow.prototype, "getBranchEvent", wtf.analysis.Flow.prototype.getBranchEvent);
goog.exportProperty(wtf.analysis.Flow.prototype, "getExtendEvents", wtf.analysis.Flow.prototype.getExtendEvents);
goog.exportProperty(wtf.analysis.Flow.prototype, "getTerminateEvent", wtf.analysis.Flow.prototype.getTerminateEvent);
goog.exportProperty(wtf.analysis.Flow.prototype, "getData", wtf.analysis.Flow.prototype.getData);
// Input 43
wtf.analysis.Scope = function() {
  this.id_ = wtf.analysis.Scope.nextId_++;
  this.parent_ = this.dataEvents_ = this.leaveEvent_ = this.enterEvent_ = null;
  this.depth_ = 0;
  this.children_ = [];
  this.totalChildSystemTime_ = this.totalChildTime_ = 0;
  this.renderData_ = null
};
wtf.analysis.Scope.nextId_ = 0;
wtf.analysis.Scope.prototype.getId = function() {
  return this.id_
};
wtf.analysis.Scope.prototype.getEnterEvent = function() {
  return this.enterEvent_
};
wtf.analysis.Scope.prototype.setEnterEvent = function(a) {
  this.enterEvent_ = a
};
wtf.analysis.Scope.prototype.getLeaveEvent = function() {
  return this.leaveEvent_
};
wtf.analysis.Scope.prototype.setLeaveEvent = function(a) {
  this.leaveEvent_ = a
};
wtf.analysis.Scope.prototype.addDataEvent = function(a) {
  this.dataEvents_ ? this.dataEvents_.push(a) : this.dataEvents_ = [a]
};
wtf.analysis.Scope.prototype.getData = function() {
  var a = {};
  if(this.enterEvent_) {
    for(var b = this.enterEvent_.eventType.args, c = 0;c < b.length;c++) {
      var d = b[c];
      a[d.name] = this.enterEvent_.args[d.name]
    }
  }
  if(this.dataEvents_) {
    for(c = 0;c < this.dataEvents_.length;c++) {
      if(b = this.dataEvents_[c], b.eventType.flags & wtf.data.EventFlag.INTERNAL) {
        a[b.args.name] = b.args.value
      }else {
        for(var e = 0;e < b.eventType.args.length;e++) {
          d = b.eventType.args[e], a[d.name] = b.args[d.name]
        }
      }
    }
  }
  return a
};
wtf.analysis.Scope.prototype.getParent = function() {
  return this.parent_
};
wtf.analysis.Scope.prototype.getDepth = function() {
  return this.depth_
};
wtf.analysis.Scope.prototype.getTotalDuration = function() {
  return this.enterEvent_ && this.leaveEvent_ ? this.leaveEvent_.time - this.enterEvent_.time : 0
};
wtf.analysis.Scope.prototype.getUserDuration = function() {
  return this.enterEvent_ && this.leaveEvent_ ? this.leaveEvent_.time - this.enterEvent_.time - this.totalChildSystemTime_ : 0
};
wtf.analysis.Scope.prototype.getOwnDuration = function() {
  return this.enterEvent_ && this.leaveEvent_ ? this.leaveEvent_.time - this.enterEvent_.time - this.totalChildTime_ : 0
};
wtf.analysis.Scope.prototype.addChild = function(a) {
  a.parent_ = this;
  a.depth_ = this.depth_ + 1;
  this.children_.push(a)
};
wtf.analysis.Scope.prototype.getChildren = function() {
  return this.children_
};
wtf.analysis.Scope.prototype.computeTimes = function() {
  for(var a = this.totalChildTime_ = 0;a < this.children_.length;a++) {
    this.totalChildTime_ += this.children_[a].getTotalDuration()
  }
};
wtf.analysis.Scope.prototype.adjustSystemTime = function() {
  var a = this.getTotalDuration();
  this.totalChildSystemTime_ = a;
  for(var b = this.parent_;b;) {
    b.totalChildSystemTime_ += a, b = b.parent_
  }
};
wtf.analysis.Scope.prototype.getRenderData = function() {
  return this.renderData_
};
wtf.analysis.Scope.prototype.setRenderData = function(a) {
  this.renderData_ = a
};
goog.exportSymbol("wtf.analysis.Scope", wtf.analysis.Scope);
goog.exportProperty(wtf.analysis.Scope.prototype, "getId", wtf.analysis.Scope.prototype.getId);
goog.exportProperty(wtf.analysis.Scope.prototype, "getEnterEvent", wtf.analysis.Scope.prototype.getEnterEvent);
goog.exportProperty(wtf.analysis.Scope.prototype, "getLeaveEvent", wtf.analysis.Scope.prototype.getLeaveEvent);
goog.exportProperty(wtf.analysis.Scope.prototype, "getData", wtf.analysis.Scope.prototype.getData);
goog.exportProperty(wtf.analysis.Scope.prototype, "getParent", wtf.analysis.Scope.prototype.getParent);
goog.exportProperty(wtf.analysis.Scope.prototype, "getDepth", wtf.analysis.Scope.prototype.getDepth);
goog.exportProperty(wtf.analysis.Scope.prototype, "getTotalDuration", wtf.analysis.Scope.prototype.getTotalDuration);
goog.exportProperty(wtf.analysis.Scope.prototype, "getUserDuration", wtf.analysis.Scope.prototype.getUserDuration);
goog.exportProperty(wtf.analysis.Scope.prototype, "getChildren", wtf.analysis.Scope.prototype.getChildren);
goog.exportProperty(wtf.analysis.Scope.prototype, "getRenderData", wtf.analysis.Scope.prototype.getRenderData);
goog.exportProperty(wtf.analysis.Scope.prototype, "setRenderData", wtf.analysis.Scope.prototype.setRenderData);
// Input 44
wtf.analysis.TimeRange = function() {
  this.id_ = wtf.analysis.TimeRange.nextId_++;
  this.endEvent_ = this.beginEvent_ = null;
  this.overlap_ = this.level_ = 0
};
wtf.analysis.TimeRange.nextId_ = 0;
wtf.analysis.TimeRange.prototype.getId = function() {
  return this.id_
};
wtf.analysis.TimeRange.prototype.getBeginEvent = function() {
  return this.beginEvent_
};
wtf.analysis.TimeRange.prototype.setBeginEvent = function(a) {
  this.beginEvent_ = a
};
wtf.analysis.TimeRange.prototype.getEndEvent = function() {
  return this.endEvent_
};
wtf.analysis.TimeRange.prototype.setEndEvent = function(a) {
  this.endEvent_ = a
};
wtf.analysis.TimeRange.prototype.getLevel = function() {
  return this.level_
};
wtf.analysis.TimeRange.prototype.getOverlap = function() {
  return this.overlap_
};
wtf.analysis.TimeRange.prototype.setLevel = function(a, b) {
  this.level_ = a;
  this.overlap_ = b
};
wtf.analysis.TimeRange.prototype.getName = function() {
  return this.beginEvent_ ? this.beginEvent_.args.name : null
};
wtf.analysis.TimeRange.prototype.getData = function() {
  var a = {};
  if(this.beginEvent_) {
    var b = this.beginEvent_.args.value;
    b && (a.value = b)
  }
  return a
};
wtf.analysis.TimeRange.prototype.getTotalDuration = function() {
  return this.beginEvent_ && this.endEvent_ ? this.endEvent_.time - this.beginEvent_.time : 0
};
goog.exportSymbol("wtf.analysis.TimeRange", wtf.analysis.TimeRange);
goog.exportProperty(wtf.analysis.TimeRange.prototype, "getId", wtf.analysis.TimeRange.prototype.getId);
goog.exportProperty(wtf.analysis.TimeRange.prototype, "getBeginEvent", wtf.analysis.TimeRange.prototype.getBeginEvent);
goog.exportProperty(wtf.analysis.TimeRange.prototype, "getEndEvent", wtf.analysis.TimeRange.prototype.getEndEvent);
goog.exportProperty(wtf.analysis.TimeRange.prototype, "getLevel", wtf.analysis.TimeRange.prototype.getLevel);
goog.exportProperty(wtf.analysis.TimeRange.prototype, "getName", wtf.analysis.TimeRange.prototype.getName);
goog.exportProperty(wtf.analysis.TimeRange.prototype, "getData", wtf.analysis.TimeRange.prototype.getData);
goog.exportProperty(wtf.analysis.TimeRange.prototype, "getTotalDuration", wtf.analysis.TimeRange.prototype.getTotalDuration);
// Input 45
wtf.data.formats = {};
wtf.data.formats.BinaryTrace = {};
wtf.data.formats.JsonTrace = {};
wtf.data.formats.BinaryTrace.VERSION = 3;
wtf.data.formats.JsonTrace.VERSION = 2;
wtf.data.formats.FileFlags = {HAS_HIGH_RESOLUTION_TIMES:1};
// Input 46
wtf.analysis.TraceSource = function(a) {
  goog.Disposable.call(this);
  this.traceListener = a;
  this.isInitialized_ = !1;
  this.contextInfo_ = null;
  this.flags_ = 0;
  this.metadata_ = {};
  this.timeDelay_ = this.timebase_ = 0
};
goog.inherits(wtf.analysis.TraceSource, goog.Disposable);
wtf.analysis.TraceSource.prototype.isInitialized = function() {
  return this.isInitialized_
};
wtf.analysis.TraceSource.prototype.getContextInfo = function() {
  goog.asserts.assert(this.isInitialized_);
  goog.asserts.assert(this.contextInfo_);
  return this.contextInfo_
};
wtf.analysis.TraceSource.prototype.getFlags = function() {
  return this.flags_
};
wtf.analysis.TraceSource.prototype.hasHighResolutionTimes = function() {
  goog.asserts.assert(this.isInitialized_);
  return!!(this.flags_ & wtf.data.formats.FileFlags.HAS_HIGH_RESOLUTION_TIMES)
};
wtf.analysis.TraceSource.prototype.getMetadata = function() {
  return this.metadata_
};
wtf.analysis.TraceSource.prototype.getTimebase = function() {
  goog.asserts.assert(this.isInitialized_);
  return this.timebase_
};
wtf.analysis.TraceSource.prototype.getTimeDelay = function() {
  goog.asserts.assert(this.isInitialized_);
  return this.timeDelay_
};
wtf.analysis.TraceSource.prototype.initialize = function(a, b, c, d, e) {
  goog.asserts.assert(!this.isInitialized_);
  this.isInitialized_ = !0;
  this.contextInfo_ = a;
  this.flags_ = b;
  this.metadata_ = c;
  this.timebase_ = d;
  this.timeDelay_ = e
};
// Input 47
goog.structs = {};
goog.structs.getCount = function(a) {
  return"function" == typeof a.getCount ? a.getCount() : goog.isArrayLike(a) || goog.isString(a) ? a.length : goog.object.getCount(a)
};
goog.structs.getValues = function(a) {
  if("function" == typeof a.getValues) {
    return a.getValues()
  }
  if(goog.isString(a)) {
    return a.split("")
  }
  if(goog.isArrayLike(a)) {
    for(var b = [], c = a.length, d = 0;d < c;d++) {
      b.push(a[d])
    }
    return b
  }
  return goog.object.getValues(a)
};
goog.structs.getKeys = function(a) {
  if("function" == typeof a.getKeys) {
    return a.getKeys()
  }
  if("function" != typeof a.getValues) {
    if(goog.isArrayLike(a) || goog.isString(a)) {
      var b = [];
      a = a.length;
      for(var c = 0;c < a;c++) {
        b.push(c)
      }
      return b
    }
    return goog.object.getKeys(a)
  }
};
goog.structs.contains = function(a, b) {
  return"function" == typeof a.contains ? a.contains(b) : "function" == typeof a.containsValue ? a.containsValue(b) : goog.isArrayLike(a) || goog.isString(a) ? goog.array.contains(a, b) : goog.object.containsValue(a, b)
};
goog.structs.isEmpty = function(a) {
  return"function" == typeof a.isEmpty ? a.isEmpty() : goog.isArrayLike(a) || goog.isString(a) ? goog.array.isEmpty(a) : goog.object.isEmpty(a)
};
goog.structs.clear = function(a) {
  "function" == typeof a.clear ? a.clear() : goog.isArrayLike(a) ? goog.array.clear(a) : goog.object.clear(a)
};
goog.structs.forEach = function(a, b, c) {
  if("function" == typeof a.forEach) {
    a.forEach(b, c)
  }else {
    if(goog.isArrayLike(a) || goog.isString(a)) {
      goog.array.forEach(a, b, c)
    }else {
      for(var d = goog.structs.getKeys(a), e = goog.structs.getValues(a), f = e.length, g = 0;g < f;g++) {
        b.call(c, e[g], d && d[g], a)
      }
    }
  }
};
goog.structs.filter = function(a, b, c) {
  if("function" == typeof a.filter) {
    return a.filter(b, c)
  }
  if(goog.isArrayLike(a) || goog.isString(a)) {
    return goog.array.filter(a, b, c)
  }
  var d, e = goog.structs.getKeys(a), f = goog.structs.getValues(a), g = f.length;
  if(e) {
    d = {};
    for(var h = 0;h < g;h++) {
      b.call(c, f[h], e[h], a) && (d[e[h]] = f[h])
    }
  }else {
    d = [];
    for(h = 0;h < g;h++) {
      b.call(c, f[h], void 0, a) && d.push(f[h])
    }
  }
  return d
};
goog.structs.map = function(a, b, c) {
  if("function" == typeof a.map) {
    return a.map(b, c)
  }
  if(goog.isArrayLike(a) || goog.isString(a)) {
    return goog.array.map(a, b, c)
  }
  var d, e = goog.structs.getKeys(a), f = goog.structs.getValues(a), g = f.length;
  if(e) {
    d = {};
    for(var h = 0;h < g;h++) {
      d[e[h]] = b.call(c, f[h], e[h], a)
    }
  }else {
    d = [];
    for(h = 0;h < g;h++) {
      d[h] = b.call(c, f[h], void 0, a)
    }
  }
  return d
};
goog.structs.some = function(a, b, c) {
  if("function" == typeof a.some) {
    return a.some(b, c)
  }
  if(goog.isArrayLike(a) || goog.isString(a)) {
    return goog.array.some(a, b, c)
  }
  for(var d = goog.structs.getKeys(a), e = goog.structs.getValues(a), f = e.length, g = 0;g < f;g++) {
    if(b.call(c, e[g], d && d[g], a)) {
      return!0
    }
  }
  return!1
};
goog.structs.every = function(a, b, c) {
  if("function" == typeof a.every) {
    return a.every(b, c)
  }
  if(goog.isArrayLike(a) || goog.isString(a)) {
    return goog.array.every(a, b, c)
  }
  for(var d = goog.structs.getKeys(a), e = goog.structs.getValues(a), f = e.length, g = 0;g < f;g++) {
    if(!b.call(c, e[g], d && d[g], a)) {
      return!1
    }
  }
  return!0
};
// Input 48
goog.iter = {};
goog.iter.StopIteration = "StopIteration" in goog.global ? goog.global.StopIteration : Error("StopIteration");
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function() {
  return this
};
goog.iter.toIterator = function(a) {
  if(a instanceof goog.iter.Iterator) {
    return a
  }
  if("function" == typeof a.__iterator__) {
    return a.__iterator__(!1)
  }
  if(goog.isArrayLike(a)) {
    var b = 0, c = new goog.iter.Iterator;
    c.next = function() {
      for(;;) {
        if(b >= a.length) {
          throw goog.iter.StopIteration;
        }
        if(b in a) {
          return a[b++]
        }
        b++
      }
    };
    return c
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(a, b, c) {
  if(goog.isArrayLike(a)) {
    try {
      goog.array.forEach(a, b, c)
    }catch(d) {
      if(d !== goog.iter.StopIteration) {
        throw d;
      }
    }
  }else {
    a = goog.iter.toIterator(a);
    try {
      for(;;) {
        b.call(c, a.next(), void 0, a)
      }
    }catch(e) {
      if(e !== goog.iter.StopIteration) {
        throw e;
      }
    }
  }
};
goog.iter.filter = function(a, b, c) {
  var d = goog.iter.toIterator(a);
  a = new goog.iter.Iterator;
  a.next = function() {
    for(;;) {
      var a = d.next();
      if(b.call(c, a, void 0, d)) {
        return a
      }
    }
  };
  return a
};
goog.iter.range = function(a, b, c) {
  var d = 0, e = a, f = c || 1;
  1 < arguments.length && (d = a, e = b);
  if(0 == f) {
    throw Error("Range step argument must not be zero");
  }
  var g = new goog.iter.Iterator;
  g.next = function() {
    if(0 < f && d >= e || 0 > f && d <= e) {
      throw goog.iter.StopIteration;
    }
    var a = d;
    d += f;
    return a
  };
  return g
};
goog.iter.join = function(a, b) {
  return goog.iter.toArray(a).join(b)
};
goog.iter.map = function(a, b, c) {
  var d = goog.iter.toIterator(a);
  a = new goog.iter.Iterator;
  a.next = function() {
    for(;;) {
      var a = d.next();
      return b.call(c, a, void 0, d)
    }
  };
  return a
};
goog.iter.reduce = function(a, b, c, d) {
  var e = c;
  goog.iter.forEach(a, function(a) {
    e = b.call(d, e, a)
  });
  return e
};
goog.iter.some = function(a, b, c) {
  a = goog.iter.toIterator(a);
  try {
    for(;;) {
      if(b.call(c, a.next(), void 0, a)) {
        return!0
      }
    }
  }catch(d) {
    if(d !== goog.iter.StopIteration) {
      throw d;
    }
  }
  return!1
};
goog.iter.every = function(a, b, c) {
  a = goog.iter.toIterator(a);
  try {
    for(;;) {
      if(!b.call(c, a.next(), void 0, a)) {
        return!1
      }
    }
  }catch(d) {
    if(d !== goog.iter.StopIteration) {
      throw d;
    }
  }
  return!0
};
goog.iter.chain = function(a) {
  var b = arguments, c = b.length, d = 0, e = new goog.iter.Iterator;
  e.next = function() {
    try {
      if(d >= c) {
        throw goog.iter.StopIteration;
      }
      return goog.iter.toIterator(b[d]).next()
    }catch(a) {
      if(a !== goog.iter.StopIteration || d >= c) {
        throw a;
      }
      d++;
      return this.next()
    }
  };
  return e
};
goog.iter.dropWhile = function(a, b, c) {
  var d = goog.iter.toIterator(a);
  a = new goog.iter.Iterator;
  var e = !0;
  a.next = function() {
    for(;;) {
      var a = d.next();
      if(!e || !b.call(c, a, void 0, d)) {
        return e = !1, a
      }
    }
  };
  return a
};
goog.iter.takeWhile = function(a, b, c) {
  var d = goog.iter.toIterator(a);
  a = new goog.iter.Iterator;
  var e = !0;
  a.next = function() {
    for(;;) {
      if(e) {
        var a = d.next();
        if(b.call(c, a, void 0, d)) {
          return a
        }
        e = !1
      }else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return a
};
goog.iter.toArray = function(a) {
  if(goog.isArrayLike(a)) {
    return goog.array.toArray(a)
  }
  a = goog.iter.toIterator(a);
  var b = [];
  goog.iter.forEach(a, function(a) {
    b.push(a)
  });
  return b
};
goog.iter.equals = function(a, b) {
  a = goog.iter.toIterator(a);
  b = goog.iter.toIterator(b);
  var c, d;
  try {
    for(;;) {
      c = d = !1;
      var e = a.next();
      c = !0;
      var f = b.next();
      d = !0;
      if(e != f) {
        break
      }
    }
  }catch(g) {
    if(g !== goog.iter.StopIteration) {
      throw g;
    }
    if(c && !d) {
      return!1
    }
    if(!d) {
      try {
        b.next()
      }catch(h) {
        if(h !== goog.iter.StopIteration) {
          throw h;
        }
        return!0
      }
    }
  }
  return!1
};
goog.iter.nextOrValue = function(a, b) {
  try {
    return goog.iter.toIterator(a).next()
  }catch(c) {
    if(c != goog.iter.StopIteration) {
      throw c;
    }
    return b
  }
};
goog.iter.product = function(a) {
  if(goog.array.some(arguments, function(a) {
    return!a.length
  }) || !arguments.length) {
    return new goog.iter.Iterator
  }
  var b = new goog.iter.Iterator, c = arguments, d = goog.array.repeat(0, c.length);
  b.next = function() {
    if(d) {
      for(var a = goog.array.map(d, function(a, b) {
        return c[b][a]
      }), b = d.length - 1;0 <= b;b--) {
        goog.asserts.assert(d);
        if(d[b] < c[b].length - 1) {
          d[b]++;
          break
        }
        if(0 == b) {
          d = null;
          break
        }
        d[b] = 0
      }
      return a
    }
    throw goog.iter.StopIteration;
  };
  return b
};
goog.iter.cycle = function(a) {
  var b = goog.iter.toIterator(a), c = [], d = 0;
  a = new goog.iter.Iterator;
  var e = !1;
  a.next = function() {
    var a = null;
    if(!e) {
      try {
        return a = b.next(), c.push(a), a
      }catch(g) {
        if(g != goog.iter.StopIteration || goog.array.isEmpty(c)) {
          throw g;
        }
        e = !0
      }
    }
    a = c[d];
    d = (d + 1) % c.length;
    return a
  };
  return a
};
// Input 49
goog.structs.Map = function(a, b) {
  this.map_ = {};
  this.keys_ = [];
  var c = arguments.length;
  if(1 < c) {
    if(c % 2) {
      throw Error("Uneven number of arguments");
    }
    for(var d = 0;d < c;d += 2) {
      this.set(arguments[d], arguments[d + 1])
    }
  }else {
    a && this.addAll(a)
  }
};
goog.structs.Map.prototype.count_ = 0;
goog.structs.Map.prototype.version_ = 0;
goog.structs.Map.prototype.getCount = function() {
  return this.count_
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  for(var a = [], b = 0;b < this.keys_.length;b++) {
    a.push(this.map_[this.keys_[b]])
  }
  return a
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat()
};
goog.structs.Map.prototype.containsKey = function(a) {
  return goog.structs.Map.hasKey_(this.map_, a)
};
goog.structs.Map.prototype.containsValue = function(a) {
  for(var b = 0;b < this.keys_.length;b++) {
    var c = this.keys_[b];
    if(goog.structs.Map.hasKey_(this.map_, c) && this.map_[c] == a) {
      return!0
    }
  }
  return!1
};
goog.structs.Map.prototype.equals = function(a, b) {
  if(this === a) {
    return!0
  }
  if(this.count_ != a.getCount()) {
    return!1
  }
  var c = b || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for(var d, e = 0;d = this.keys_[e];e++) {
    if(!c(this.get(d), a.get(d))) {
      return!1
    }
  }
  return!0
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b
};
goog.structs.Map.prototype.isEmpty = function() {
  return 0 == this.count_
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.version_ = this.count_ = this.keys_.length = 0
};
goog.structs.Map.prototype.remove = function(a) {
  return goog.structs.Map.hasKey_(this.map_, a) ? (delete this.map_[a], this.count_--, this.version_++, this.keys_.length > 2 * this.count_ && this.cleanupKeysArray_(), !0) : !1
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if(this.count_ != this.keys_.length) {
    for(var a = 0, b = 0;a < this.keys_.length;) {
      var c = this.keys_[a];
      goog.structs.Map.hasKey_(this.map_, c) && (this.keys_[b++] = c);
      a++
    }
    this.keys_.length = b
  }
  if(this.count_ != this.keys_.length) {
    for(var d = {}, b = a = 0;a < this.keys_.length;) {
      c = this.keys_[a], goog.structs.Map.hasKey_(d, c) || (this.keys_[b++] = c, d[c] = 1), a++
    }
    this.keys_.length = b
  }
};
goog.structs.Map.prototype.get = function(a, b) {
  return goog.structs.Map.hasKey_(this.map_, a) ? this.map_[a] : b
};
goog.structs.Map.prototype.set = function(a, b) {
  goog.structs.Map.hasKey_(this.map_, a) || (this.count_++, this.keys_.push(a), this.version_++);
  this.map_[a] = b
};
goog.structs.Map.prototype.addAll = function(a) {
  var b;
  a instanceof goog.structs.Map ? (b = a.getKeys(), a = a.getValues()) : (b = goog.object.getKeys(a), a = goog.object.getValues(a));
  for(var c = 0;c < b.length;c++) {
    this.set(b[c], a[c])
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this)
};
goog.structs.Map.prototype.transpose = function() {
  for(var a = new goog.structs.Map, b = 0;b < this.keys_.length;b++) {
    var c = this.keys_[b];
    a.set(this.map_[c], c)
  }
  return a
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  for(var a = {}, b = 0;b < this.keys_.length;b++) {
    var c = this.keys_[b];
    a[c] = this.map_[c]
  }
  return a
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(!0)
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(!1)
};
goog.structs.Map.prototype.__iterator__ = function(a) {
  this.cleanupKeysArray_();
  var b = 0, c = this.keys_, d = this.map_, e = this.version_, f = this, g = new goog.iter.Iterator;
  g.next = function() {
    for(;;) {
      if(e != f.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if(b >= c.length) {
        throw goog.iter.StopIteration;
      }
      var g = c[b++];
      return a ? g : d[g]
    }
  };
  return g
};
goog.structs.Map.hasKey_ = function(a, b) {
  return Object.prototype.hasOwnProperty.call(a, b)
};
// Input 50
goog.uri = {};
goog.uri.utils = {};
goog.uri.utils.CharCode_ = {AMPERSAND:38, EQUAL:61, HASH:35, QUESTION:63};
goog.uri.utils.buildFromEncodedParts = function(a, b, c, d, e, f, g) {
  var h = "";
  a && (h += a + ":");
  c && (h += "//", b && (h += b + "@"), h += c, d && (h += ":" + d));
  e && (h += e);
  f && (h += "?" + f);
  g && (h += "#" + g);
  return h
};
goog.uri.utils.splitRe_ = RegExp("^(?:([^:/?#.]+):)?(?://(?:([^/?#]*)@)?([^/#?]*?)(?::([0-9]+))?(?=[/#?]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#(.*))?$");
goog.uri.utils.ComponentIndex = {SCHEME:1, USER_INFO:2, DOMAIN:3, PORT:4, PATH:5, QUERY_DATA:6, FRAGMENT:7};
goog.uri.utils.split = function(a) {
  return a.match(goog.uri.utils.splitRe_)
};
goog.uri.utils.decodeIfPossible_ = function(a) {
  return a && decodeURIComponent(a)
};
goog.uri.utils.getComponentByIndex_ = function(a, b) {
  return goog.uri.utils.split(b)[a] || null
};
goog.uri.utils.getScheme = function(a) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.SCHEME, a)
};
goog.uri.utils.getEffectiveScheme = function(a) {
  a = goog.uri.utils.getScheme(a);
  !a && self.location && (a = self.location.protocol, a = a.substr(0, a.length - 1));
  return a ? a.toLowerCase() : ""
};
goog.uri.utils.getUserInfoEncoded = function(a) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.USER_INFO, a)
};
goog.uri.utils.getUserInfo = function(a) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getUserInfoEncoded(a))
};
goog.uri.utils.getDomainEncoded = function(a) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.DOMAIN, a)
};
goog.uri.utils.getDomain = function(a) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getDomainEncoded(a))
};
goog.uri.utils.getPort = function(a) {
  return Number(goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PORT, a)) || null
};
goog.uri.utils.getPathEncoded = function(a) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PATH, a)
};
goog.uri.utils.getPath = function(a) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getPathEncoded(a))
};
goog.uri.utils.getQueryData = function(a) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.QUERY_DATA, a)
};
goog.uri.utils.getFragmentEncoded = function(a) {
  var b = a.indexOf("#");
  return 0 > b ? null : a.substr(b + 1)
};
goog.uri.utils.setFragmentEncoded = function(a, b) {
  return goog.uri.utils.removeFragment(a) + (b ? "#" + b : "")
};
goog.uri.utils.getFragment = function(a) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getFragmentEncoded(a))
};
goog.uri.utils.getHost = function(a) {
  a = goog.uri.utils.split(a);
  return goog.uri.utils.buildFromEncodedParts(a[goog.uri.utils.ComponentIndex.SCHEME], a[goog.uri.utils.ComponentIndex.USER_INFO], a[goog.uri.utils.ComponentIndex.DOMAIN], a[goog.uri.utils.ComponentIndex.PORT])
};
goog.uri.utils.getPathAndAfter = function(a) {
  a = goog.uri.utils.split(a);
  return goog.uri.utils.buildFromEncodedParts(null, null, null, null, a[goog.uri.utils.ComponentIndex.PATH], a[goog.uri.utils.ComponentIndex.QUERY_DATA], a[goog.uri.utils.ComponentIndex.FRAGMENT])
};
goog.uri.utils.removeFragment = function(a) {
  var b = a.indexOf("#");
  return 0 > b ? a : a.substr(0, b)
};
goog.uri.utils.haveSameDomain = function(a, b) {
  var c = goog.uri.utils.split(a), d = goog.uri.utils.split(b);
  return c[goog.uri.utils.ComponentIndex.DOMAIN] == d[goog.uri.utils.ComponentIndex.DOMAIN] && c[goog.uri.utils.ComponentIndex.SCHEME] == d[goog.uri.utils.ComponentIndex.SCHEME] && c[goog.uri.utils.ComponentIndex.PORT] == d[goog.uri.utils.ComponentIndex.PORT]
};
goog.uri.utils.assertNoFragmentsOrQueries_ = function(a) {
  if(goog.DEBUG && (0 <= a.indexOf("#") || 0 <= a.indexOf("?"))) {
    throw Error("goog.uri.utils: Fragment or query identifiers are not supported: [" + a + "]");
  }
};
goog.uri.utils.appendQueryData_ = function(a) {
  if(a[1]) {
    var b = a[0], c = b.indexOf("#");
    0 <= c && (a.push(b.substr(c)), a[0] = b = b.substr(0, c));
    c = b.indexOf("?");
    0 > c ? a[1] = "?" : c == b.length - 1 && (a[1] = void 0)
  }
  return a.join("")
};
goog.uri.utils.appendKeyValuePairs_ = function(a, b, c) {
  if(goog.isArray(b)) {
    goog.asserts.assertArray(b);
    for(var d = 0;d < b.length;d++) {
      goog.uri.utils.appendKeyValuePairs_(a, String(b[d]), c)
    }
  }else {
    null != b && c.push("&", a, "" === b ? "" : "=", goog.string.urlEncode(b))
  }
};
goog.uri.utils.buildQueryDataBuffer_ = function(a, b, c) {
  goog.asserts.assert(0 == Math.max(b.length - (c || 0), 0) % 2, "goog.uri.utils: Key/value lists must be even in length.");
  for(c = c || 0;c < b.length;c += 2) {
    goog.uri.utils.appendKeyValuePairs_(b[c], b[c + 1], a)
  }
  return a
};
goog.uri.utils.buildQueryData = function(a, b) {
  var c = goog.uri.utils.buildQueryDataBuffer_([], a, b);
  c[0] = "";
  return c.join("")
};
goog.uri.utils.buildQueryDataBufferFromMap_ = function(a, b) {
  for(var c in b) {
    goog.uri.utils.appendKeyValuePairs_(c, b[c], a)
  }
  return a
};
goog.uri.utils.buildQueryDataFromMap = function(a) {
  a = goog.uri.utils.buildQueryDataBufferFromMap_([], a);
  a[0] = "";
  return a.join("")
};
goog.uri.utils.appendParams = function(a, b) {
  return goog.uri.utils.appendQueryData_(2 == arguments.length ? goog.uri.utils.buildQueryDataBuffer_([a], arguments[1], 0) : goog.uri.utils.buildQueryDataBuffer_([a], arguments, 1))
};
goog.uri.utils.appendParamsFromMap = function(a, b) {
  return goog.uri.utils.appendQueryData_(goog.uri.utils.buildQueryDataBufferFromMap_([a], b))
};
goog.uri.utils.appendParam = function(a, b, c) {
  return goog.uri.utils.appendQueryData_([a, "&", b, "=", goog.string.urlEncode(c)])
};
goog.uri.utils.findParam_ = function(a, b, c, d) {
  for(var e = c.length;0 <= (b = a.indexOf(c, b)) && b < d;) {
    var f = a.charCodeAt(b - 1);
    if(f == goog.uri.utils.CharCode_.AMPERSAND || f == goog.uri.utils.CharCode_.QUESTION) {
      if(f = a.charCodeAt(b + e), !f || f == goog.uri.utils.CharCode_.EQUAL || f == goog.uri.utils.CharCode_.AMPERSAND || f == goog.uri.utils.CharCode_.HASH) {
        return b
      }
    }
    b += e + 1
  }
  return-1
};
goog.uri.utils.hashOrEndRe_ = /#|$/;
goog.uri.utils.hasParam = function(a, b) {
  return 0 <= goog.uri.utils.findParam_(a, 0, b, a.search(goog.uri.utils.hashOrEndRe_))
};
goog.uri.utils.getParamValue = function(a, b) {
  var c = a.search(goog.uri.utils.hashOrEndRe_), d = goog.uri.utils.findParam_(a, 0, b, c);
  if(0 > d) {
    return null
  }
  var e = a.indexOf("&", d);
  if(0 > e || e > c) {
    e = c
  }
  d += b.length + 1;
  return goog.string.urlDecode(a.substr(d, e - d))
};
goog.uri.utils.getParamValues = function(a, b) {
  for(var c = a.search(goog.uri.utils.hashOrEndRe_), d = 0, e, f = [];0 <= (e = goog.uri.utils.findParam_(a, d, b, c));) {
    d = a.indexOf("&", e);
    if(0 > d || d > c) {
      d = c
    }
    e += b.length + 1;
    f.push(goog.string.urlDecode(a.substr(e, d - e)))
  }
  return f
};
goog.uri.utils.trailingQueryPunctuationRe_ = /[?&]($|#)/;
goog.uri.utils.removeParam = function(a, b) {
  for(var c = a.search(goog.uri.utils.hashOrEndRe_), d = 0, e, f = [];0 <= (e = goog.uri.utils.findParam_(a, d, b, c));) {
    f.push(a.substring(d, e)), d = Math.min(a.indexOf("&", e) + 1 || c, c)
  }
  f.push(a.substr(d));
  return f.join("").replace(goog.uri.utils.trailingQueryPunctuationRe_, "$1")
};
goog.uri.utils.setParam = function(a, b, c) {
  return goog.uri.utils.appendParam(goog.uri.utils.removeParam(a, b), b, c)
};
goog.uri.utils.appendPath = function(a, b) {
  goog.uri.utils.assertNoFragmentsOrQueries_(a);
  goog.string.endsWith(a, "/") && (a = a.substr(0, a.length - 1));
  goog.string.startsWith(b, "/") && (b = b.substr(1));
  return goog.string.buildString(a, "/", b)
};
goog.uri.utils.StandardQueryParam = {RANDOM:"zx"};
goog.uri.utils.makeUnique = function(a) {
  return goog.uri.utils.setParam(a, goog.uri.utils.StandardQueryParam.RANDOM, goog.string.getRandomString())
};
// Input 51
goog.Uri = function(a, b) {
  var c;
  a instanceof goog.Uri ? (this.ignoreCase_ = goog.isDef(b) ? b : a.getIgnoreCase(), this.setScheme(a.getScheme()), this.setUserInfo(a.getUserInfo()), this.setDomain(a.getDomain()), this.setPort(a.getPort()), this.setPath(a.getPath()), this.setQueryData(a.getQueryData().clone()), this.setFragment(a.getFragment())) : a && (c = goog.uri.utils.split(String(a))) ? (this.ignoreCase_ = !!b, this.setScheme(c[goog.uri.utils.ComponentIndex.SCHEME] || "", !0), this.setUserInfo(c[goog.uri.utils.ComponentIndex.USER_INFO] || 
  "", !0), this.setDomain(c[goog.uri.utils.ComponentIndex.DOMAIN] || "", !0), this.setPort(c[goog.uri.utils.ComponentIndex.PORT]), this.setPath(c[goog.uri.utils.ComponentIndex.PATH] || "", !0), this.setQueryData(c[goog.uri.utils.ComponentIndex.QUERY_DATA] || "", !0), this.setFragment(c[goog.uri.utils.ComponentIndex.FRAGMENT] || "", !0)) : (this.ignoreCase_ = !!b, this.queryData_ = new goog.Uri.QueryData(null, null, this.ignoreCase_))
};
goog.Uri.preserveParameterTypesCompatibilityFlag = !1;
goog.Uri.RANDOM_PARAM = goog.uri.utils.StandardQueryParam.RANDOM;
goog.Uri.prototype.scheme_ = "";
goog.Uri.prototype.userInfo_ = "";
goog.Uri.prototype.domain_ = "";
goog.Uri.prototype.port_ = null;
goog.Uri.prototype.path_ = "";
goog.Uri.prototype.fragment_ = "";
goog.Uri.prototype.isReadOnly_ = !1;
goog.Uri.prototype.ignoreCase_ = !1;
goog.Uri.prototype.toString = function() {
  var a = [], b = this.getScheme();
  b && a.push(goog.Uri.encodeSpecialChars_(b, goog.Uri.reDisallowedInSchemeOrUserInfo_), ":");
  if(b = this.getDomain()) {
    a.push("//");
    var c = this.getUserInfo();
    c && a.push(goog.Uri.encodeSpecialChars_(c, goog.Uri.reDisallowedInSchemeOrUserInfo_), "@");
    a.push(goog.string.urlEncode(b));
    b = this.getPort();
    null != b && a.push(":", String(b))
  }
  if(b = this.getPath()) {
    this.hasDomain() && "/" != b.charAt(0) && a.push("/"), a.push(goog.Uri.encodeSpecialChars_(b, "/" == b.charAt(0) ? goog.Uri.reDisallowedInAbsolutePath_ : goog.Uri.reDisallowedInRelativePath_))
  }
  (b = this.getEncodedQuery()) && a.push("?", b);
  (b = this.getFragment()) && a.push("#", goog.Uri.encodeSpecialChars_(b, goog.Uri.reDisallowedInFragment_));
  return a.join("")
};
goog.Uri.prototype.resolve = function(a) {
  var b = this.clone(), c = a.hasScheme();
  c ? b.setScheme(a.getScheme()) : c = a.hasUserInfo();
  c ? b.setUserInfo(a.getUserInfo()) : c = a.hasDomain();
  c ? b.setDomain(a.getDomain()) : c = a.hasPort();
  var d = a.getPath();
  if(c) {
    b.setPort(a.getPort())
  }else {
    if(c = a.hasPath()) {
      if("/" != d.charAt(0)) {
        if(this.hasDomain() && !this.hasPath()) {
          d = "/" + d
        }else {
          var e = b.getPath().lastIndexOf("/");
          -1 != e && (d = b.getPath().substr(0, e + 1) + d)
        }
      }
      d = goog.Uri.removeDotSegments(d)
    }
  }
  c ? b.setPath(d) : c = a.hasQuery();
  c ? b.setQueryData(a.getDecodedQuery()) : c = a.hasFragment();
  c && b.setFragment(a.getFragment());
  return b
};
goog.Uri.prototype.clone = function() {
  return new goog.Uri(this)
};
goog.Uri.prototype.getScheme = function() {
  return this.scheme_
};
goog.Uri.prototype.setScheme = function(a, b) {
  this.enforceReadOnly();
  if(this.scheme_ = b ? goog.Uri.decodeOrEmpty_(a) : a) {
    this.scheme_ = this.scheme_.replace(/:$/, "")
  }
  return this
};
goog.Uri.prototype.hasScheme = function() {
  return!!this.scheme_
};
goog.Uri.prototype.getUserInfo = function() {
  return this.userInfo_
};
goog.Uri.prototype.setUserInfo = function(a, b) {
  this.enforceReadOnly();
  this.userInfo_ = b ? goog.Uri.decodeOrEmpty_(a) : a;
  return this
};
goog.Uri.prototype.hasUserInfo = function() {
  return!!this.userInfo_
};
goog.Uri.prototype.getDomain = function() {
  return this.domain_
};
goog.Uri.prototype.setDomain = function(a, b) {
  this.enforceReadOnly();
  this.domain_ = b ? goog.Uri.decodeOrEmpty_(a) : a;
  return this
};
goog.Uri.prototype.hasDomain = function() {
  return!!this.domain_
};
goog.Uri.prototype.getPort = function() {
  return this.port_
};
goog.Uri.prototype.setPort = function(a) {
  this.enforceReadOnly();
  if(a) {
    a = Number(a);
    if(isNaN(a) || 0 > a) {
      throw Error("Bad port number " + a);
    }
    this.port_ = a
  }else {
    this.port_ = null
  }
  return this
};
goog.Uri.prototype.hasPort = function() {
  return null != this.port_
};
goog.Uri.prototype.getPath = function() {
  return this.path_
};
goog.Uri.prototype.setPath = function(a, b) {
  this.enforceReadOnly();
  this.path_ = b ? goog.Uri.decodeOrEmpty_(a) : a;
  return this
};
goog.Uri.prototype.hasPath = function() {
  return!!this.path_
};
goog.Uri.prototype.hasQuery = function() {
  return"" !== this.queryData_.toString()
};
goog.Uri.prototype.setQueryData = function(a, b) {
  this.enforceReadOnly();
  a instanceof goog.Uri.QueryData ? (this.queryData_ = a, this.queryData_.setIgnoreCase(this.ignoreCase_)) : (b || (a = goog.Uri.encodeSpecialChars_(a, goog.Uri.reDisallowedInQuery_)), this.queryData_ = new goog.Uri.QueryData(a, null, this.ignoreCase_));
  return this
};
goog.Uri.prototype.setQuery = function(a, b) {
  return this.setQueryData(a, b)
};
goog.Uri.prototype.getEncodedQuery = function() {
  return this.queryData_.toString()
};
goog.Uri.prototype.getDecodedQuery = function() {
  return this.queryData_.toDecodedString()
};
goog.Uri.prototype.getQueryData = function() {
  return this.queryData_
};
goog.Uri.prototype.getQuery = function() {
  return this.getEncodedQuery()
};
goog.Uri.prototype.setParameterValue = function(a, b) {
  this.enforceReadOnly();
  this.queryData_.set(a, b);
  return this
};
goog.Uri.prototype.setParameterValues = function(a, b) {
  this.enforceReadOnly();
  goog.isArray(b) || (b = [String(b)]);
  this.queryData_.setValues(a, b);
  return this
};
goog.Uri.prototype.getParameterValues = function(a) {
  return this.queryData_.getValues(a)
};
goog.Uri.prototype.getParameterValue = function(a) {
  return this.queryData_.get(a)
};
goog.Uri.prototype.getFragment = function() {
  return this.fragment_
};
goog.Uri.prototype.setFragment = function(a, b) {
  this.enforceReadOnly();
  this.fragment_ = b ? goog.Uri.decodeOrEmpty_(a) : a;
  return this
};
goog.Uri.prototype.hasFragment = function() {
  return!!this.fragment_
};
goog.Uri.prototype.hasSameDomainAs = function(a) {
  return(!this.hasDomain() && !a.hasDomain() || this.getDomain() == a.getDomain()) && (!this.hasPort() && !a.hasPort() || this.getPort() == a.getPort())
};
goog.Uri.prototype.makeUnique = function() {
  this.enforceReadOnly();
  this.setParameterValue(goog.Uri.RANDOM_PARAM, goog.string.getRandomString());
  return this
};
goog.Uri.prototype.removeParameter = function(a) {
  this.enforceReadOnly();
  this.queryData_.remove(a);
  return this
};
goog.Uri.prototype.setReadOnly = function(a) {
  this.isReadOnly_ = a;
  return this
};
goog.Uri.prototype.isReadOnly = function() {
  return this.isReadOnly_
};
goog.Uri.prototype.enforceReadOnly = function() {
  if(this.isReadOnly_) {
    throw Error("Tried to modify a read-only Uri");
  }
};
goog.Uri.prototype.setIgnoreCase = function(a) {
  this.ignoreCase_ = a;
  this.queryData_ && this.queryData_.setIgnoreCase(a);
  return this
};
goog.Uri.prototype.getIgnoreCase = function() {
  return this.ignoreCase_
};
goog.Uri.parse = function(a, b) {
  return a instanceof goog.Uri ? a.clone() : new goog.Uri(a, b)
};
goog.Uri.create = function(a, b, c, d, e, f, g, h) {
  h = new goog.Uri(null, h);
  a && h.setScheme(a);
  b && h.setUserInfo(b);
  c && h.setDomain(c);
  d && h.setPort(d);
  e && h.setPath(e);
  f && h.setQueryData(f);
  g && h.setFragment(g);
  return h
};
goog.Uri.resolve = function(a, b) {
  a instanceof goog.Uri || (a = goog.Uri.parse(a));
  b instanceof goog.Uri || (b = goog.Uri.parse(b));
  return a.resolve(b)
};
goog.Uri.removeDotSegments = function(a) {
  if(".." == a || "." == a) {
    return""
  }
  if(!goog.string.contains(a, "./") && !goog.string.contains(a, "/.")) {
    return a
  }
  var b = goog.string.startsWith(a, "/");
  a = a.split("/");
  for(var c = [], d = 0;d < a.length;) {
    var e = a[d++];
    "." == e ? b && d == a.length && c.push("") : ".." == e ? ((1 < c.length || 1 == c.length && "" != c[0]) && c.pop(), b && d == a.length && c.push("")) : (c.push(e), b = !0)
  }
  return c.join("/")
};
goog.Uri.decodeOrEmpty_ = function(a) {
  return a ? decodeURIComponent(a) : ""
};
goog.Uri.encodeSpecialChars_ = function(a, b) {
  return goog.isString(a) ? encodeURI(a).replace(b, goog.Uri.encodeChar_) : null
};
goog.Uri.encodeChar_ = function(a) {
  a = a.charCodeAt(0);
  return"%" + (a >> 4 & 15).toString(16) + (a & 15).toString(16)
};
goog.Uri.reDisallowedInSchemeOrUserInfo_ = /[#\/\?@]/g;
goog.Uri.reDisallowedInRelativePath_ = /[\#\?:]/g;
goog.Uri.reDisallowedInAbsolutePath_ = /[\#\?]/g;
goog.Uri.reDisallowedInQuery_ = /[\#\?@]/g;
goog.Uri.reDisallowedInFragment_ = /#/g;
goog.Uri.haveSameDomain = function(a, b) {
  var c = goog.uri.utils.split(a), d = goog.uri.utils.split(b);
  return c[goog.uri.utils.ComponentIndex.DOMAIN] == d[goog.uri.utils.ComponentIndex.DOMAIN] && c[goog.uri.utils.ComponentIndex.PORT] == d[goog.uri.utils.ComponentIndex.PORT]
};
goog.Uri.QueryData = function(a, b, c) {
  this.encodedQuery_ = a || null;
  this.ignoreCase_ = !!c
};
goog.Uri.QueryData.prototype.ensureKeyMapInitialized_ = function() {
  if(!this.keyMap_ && (this.keyMap_ = new goog.structs.Map, this.count_ = 0, this.encodedQuery_)) {
    for(var a = this.encodedQuery_.split("&"), b = 0;b < a.length;b++) {
      var c = a[b].indexOf("="), d = null, e = null;
      0 <= c ? (d = a[b].substring(0, c), e = a[b].substring(c + 1)) : d = a[b];
      d = goog.string.urlDecode(d);
      d = this.getKeyName_(d);
      this.add(d, e ? goog.string.urlDecode(e) : "")
    }
  }
};
goog.Uri.QueryData.createFromMap = function(a, b, c) {
  b = goog.structs.getKeys(a);
  if("undefined" == typeof b) {
    throw Error("Keys are undefined");
  }
  c = new goog.Uri.QueryData(null, null, c);
  a = goog.structs.getValues(a);
  for(var d = 0;d < b.length;d++) {
    var e = b[d], f = a[d];
    goog.isArray(f) ? c.setValues(e, f) : c.add(e, f)
  }
  return c
};
goog.Uri.QueryData.createFromKeysValues = function(a, b, c, d) {
  if(a.length != b.length) {
    throw Error("Mismatched lengths for keys/values");
  }
  c = new goog.Uri.QueryData(null, null, d);
  for(d = 0;d < a.length;d++) {
    c.add(a[d], b[d])
  }
  return c
};
goog.Uri.QueryData.prototype.keyMap_ = null;
goog.Uri.QueryData.prototype.count_ = null;
goog.Uri.QueryData.prototype.getCount = function() {
  this.ensureKeyMapInitialized_();
  return this.count_
};
goog.Uri.QueryData.prototype.add = function(a, b) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  a = this.getKeyName_(a);
  var c = this.keyMap_.get(a);
  c || this.keyMap_.set(a, c = []);
  c.push(b);
  this.count_++;
  return this
};
goog.Uri.QueryData.prototype.remove = function(a) {
  this.ensureKeyMapInitialized_();
  a = this.getKeyName_(a);
  return this.keyMap_.containsKey(a) ? (this.invalidateCache_(), this.count_ -= this.keyMap_.get(a).length, this.keyMap_.remove(a)) : !1
};
goog.Uri.QueryData.prototype.clear = function() {
  this.invalidateCache_();
  this.keyMap_ = null;
  this.count_ = 0
};
goog.Uri.QueryData.prototype.isEmpty = function() {
  this.ensureKeyMapInitialized_();
  return 0 == this.count_
};
goog.Uri.QueryData.prototype.containsKey = function(a) {
  this.ensureKeyMapInitialized_();
  a = this.getKeyName_(a);
  return this.keyMap_.containsKey(a)
};
goog.Uri.QueryData.prototype.containsValue = function(a) {
  var b = this.getValues();
  return goog.array.contains(b, a)
};
goog.Uri.QueryData.prototype.getKeys = function() {
  this.ensureKeyMapInitialized_();
  for(var a = this.keyMap_.getValues(), b = this.keyMap_.getKeys(), c = [], d = 0;d < b.length;d++) {
    for(var e = a[d], f = 0;f < e.length;f++) {
      c.push(b[d])
    }
  }
  return c
};
goog.Uri.QueryData.prototype.getValues = function(a) {
  this.ensureKeyMapInitialized_();
  var b = [];
  if(a) {
    this.containsKey(a) && (b = goog.array.concat(b, this.keyMap_.get(this.getKeyName_(a))))
  }else {
    a = this.keyMap_.getValues();
    for(var c = 0;c < a.length;c++) {
      b = goog.array.concat(b, a[c])
    }
  }
  return b
};
goog.Uri.QueryData.prototype.set = function(a, b) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  a = this.getKeyName_(a);
  this.containsKey(a) && (this.count_ -= this.keyMap_.get(a).length);
  this.keyMap_.set(a, [b]);
  this.count_++;
  return this
};
goog.Uri.QueryData.prototype.get = function(a, b) {
  var c = a ? this.getValues(a) : [];
  return goog.Uri.preserveParameterTypesCompatibilityFlag ? 0 < c.length ? c[0] : b : 0 < c.length ? String(c[0]) : b
};
goog.Uri.QueryData.prototype.setValues = function(a, b) {
  this.remove(a);
  0 < b.length && (this.invalidateCache_(), this.keyMap_.set(this.getKeyName_(a), goog.array.clone(b)), this.count_ += b.length)
};
goog.Uri.QueryData.prototype.toString = function() {
  if(this.encodedQuery_) {
    return this.encodedQuery_
  }
  if(!this.keyMap_) {
    return""
  }
  for(var a = [], b = this.keyMap_.getKeys(), c = 0;c < b.length;c++) {
    for(var d = b[c], e = goog.string.urlEncode(d), d = this.getValues(d), f = 0;f < d.length;f++) {
      var g = e;
      "" !== d[f] && (g += "=" + goog.string.urlEncode(d[f]));
      a.push(g)
    }
  }
  return this.encodedQuery_ = a.join("&")
};
goog.Uri.QueryData.prototype.toDecodedString = function() {
  return goog.Uri.decodeOrEmpty_(this.toString())
};
goog.Uri.QueryData.prototype.invalidateCache_ = function() {
  this.encodedQuery_ = null
};
goog.Uri.QueryData.prototype.filterKeys = function(a) {
  this.ensureKeyMapInitialized_();
  goog.structs.forEach(this.keyMap_, function(b, c) {
    goog.array.contains(a, c) || this.remove(c)
  }, this);
  return this
};
goog.Uri.QueryData.prototype.clone = function() {
  var a = new goog.Uri.QueryData;
  a.encodedQuery_ = this.encodedQuery_;
  this.keyMap_ && (a.keyMap_ = this.keyMap_.clone(), a.count_ = this.count_);
  return a
};
goog.Uri.QueryData.prototype.getKeyName_ = function(a) {
  a = String(a);
  this.ignoreCase_ && (a = a.toLowerCase());
  return a
};
goog.Uri.QueryData.prototype.setIgnoreCase = function(a) {
  a && !this.ignoreCase_ && (this.ensureKeyMapInitialized_(), this.invalidateCache_(), goog.structs.forEach(this.keyMap_, function(a, c) {
    var d = c.toLowerCase();
    c != d && (this.remove(c), this.setValues(d, a))
  }, this));
  this.ignoreCase_ = a
};
goog.Uri.QueryData.prototype.extend = function(a) {
  for(var b = 0;b < arguments.length;b++) {
    goog.structs.forEach(arguments[b], function(a, b) {
      this.add(b, a)
    }, this)
  }
};
// Input 52
goog.userAgent.platform = {};
goog.userAgent.platform.determineVersion_ = function() {
  var a;
  return goog.userAgent.WINDOWS ? (a = /Windows NT ([0-9.]+)/, (a = a.exec(goog.userAgent.getUserAgentString())) ? a[1] : "0") : goog.userAgent.MAC ? (a = /10[_.][0-9_.]+/, (a = a.exec(goog.userAgent.getUserAgentString())) ? a[0].replace(/_/g, ".") : "10") : ""
};
goog.userAgent.platform.VERSION = goog.userAgent.platform.determineVersion_();
goog.userAgent.platform.isVersion = function(a) {
  return 0 <= goog.string.compareVersions(goog.userAgent.platform.VERSION, a)
};
// Input 53
goog.userAgent.product = {};
goog.userAgent.product.ASSUME_FIREFOX = !1;
goog.userAgent.product.ASSUME_CAMINO = !1;
goog.userAgent.product.ASSUME_IPHONE = !1;
goog.userAgent.product.ASSUME_IPAD = !1;
goog.userAgent.product.ASSUME_ANDROID = !1;
goog.userAgent.product.ASSUME_CHROME = !1;
goog.userAgent.product.ASSUME_SAFARI = !1;
goog.userAgent.product.PRODUCT_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_OPERA || goog.userAgent.product.ASSUME_FIREFOX || goog.userAgent.product.ASSUME_CAMINO || goog.userAgent.product.ASSUME_IPHONE || goog.userAgent.product.ASSUME_IPAD || goog.userAgent.product.ASSUME_ANDROID || goog.userAgent.product.ASSUME_CHROME || goog.userAgent.product.ASSUME_SAFARI;
goog.userAgent.product.init_ = function() {
  goog.userAgent.product.detectedFirefox_ = !1;
  goog.userAgent.product.detectedCamino_ = !1;
  goog.userAgent.product.detectedIphone_ = !1;
  goog.userAgent.product.detectedIpad_ = !1;
  goog.userAgent.product.detectedAndroid_ = !1;
  goog.userAgent.product.detectedChrome_ = !1;
  goog.userAgent.product.detectedSafari_ = !1;
  var a = goog.userAgent.getUserAgentString();
  a && (-1 != a.indexOf("Firefox") ? goog.userAgent.product.detectedFirefox_ = !0 : -1 != a.indexOf("Camino") ? goog.userAgent.product.detectedCamino_ = !0 : -1 != a.indexOf("iPhone") || -1 != a.indexOf("iPod") ? goog.userAgent.product.detectedIphone_ = !0 : -1 != a.indexOf("iPad") ? goog.userAgent.product.detectedIpad_ = !0 : -1 != a.indexOf("Android") ? goog.userAgent.product.detectedAndroid_ = !0 : -1 != a.indexOf("Chrome") ? goog.userAgent.product.detectedChrome_ = !0 : -1 != a.indexOf("Safari") && 
  (goog.userAgent.product.detectedSafari_ = !0))
};
goog.userAgent.product.PRODUCT_KNOWN_ || goog.userAgent.product.init_();
goog.userAgent.product.OPERA = goog.userAgent.OPERA;
goog.userAgent.product.IE = goog.userAgent.IE;
goog.userAgent.product.FIREFOX = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_FIREFOX : goog.userAgent.product.detectedFirefox_;
goog.userAgent.product.CAMINO = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_CAMINO : goog.userAgent.product.detectedCamino_;
goog.userAgent.product.IPHONE = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_IPHONE : goog.userAgent.product.detectedIphone_;
goog.userAgent.product.IPAD = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_IPAD : goog.userAgent.product.detectedIpad_;
goog.userAgent.product.ANDROID = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_ANDROID : goog.userAgent.product.detectedAndroid_;
goog.userAgent.product.CHROME = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_CHROME : goog.userAgent.product.detectedChrome_;
goog.userAgent.product.SAFARI = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_SAFARI : goog.userAgent.product.detectedSafari_;
// Input 54
wtf.version = {};
wtf.version.getValue = function() {
  return 13576356E5
};
wtf.version.getCommit = function() {
  return"549f0a286d9f7e412473c95e9ff9a49a999a1215"
};
wtf.version.toString = function() {
  return"2013.1.8-1"
};
goog.exportSymbol("wtf.version.getValue", wtf.version.getValue);
goog.exportSymbol("wtf.version.getCommit", wtf.version.getCommit);
goog.exportSymbol("wtf.version.toString", wtf.version.toString);
// Input 55
wtf.NODE = !0;
wtf.CHROME_EXTENSION = goog.global.chrome && chrome.runtime && chrome.runtime.id;
wtf.hasHighResolutionTimes = wtf.NODE || !(!goog.global.performance || !goog.global.performance.now && !goog.global.performance.webkitNow);
wtf.performanceNow_ = function() {
  var a = goog.global.performance;
  if(a && a.now) {
    return function() {
      return a.now()
    }
  }
  if(a && a.webkitNow) {
    return function() {
      return a.webkitNow()
    }
  }
}();
wtf.computeHighPrecissionTimebase_ = function() {
  for(var a = Date.now(), b, c, d = 0;25E4 > d;d++) {
    if(b = Date.now(), b != a) {
      c = wtf.performanceNow_();
      break
    }
  }
  return b - c
};
wtf.timebase = function() {
  var a;
  if(wtf.NODE) {
    try {
      a = 1E3 * require("microtime").nowDouble()
    }catch(b) {
      var c = goog.global.process.hrtime();
      a = 1E3 * c[0] + c[1] / 1E6
    }
  }else {
    a = wtf.performanceNow_ ? wtf.computeHighPrecissionTimebase_() : Date.now()
  }
  return function() {
    return a
  }
}();
wtf.now = function() {
  if(wtf.NODE) {
    var a = wtf.timebase();
    try {
      var b = require("microtime");
      return function() {
        return 1E3 * b.nowDouble() - a
      }
    }catch(c) {
      var d = goog.global.process.hrtime;
      return function() {
        var b = d();
        return 1E3 * b[0] - a + b[1] / 1E6
      }
    }
  }
  if(wtf.performanceNow_) {
    return wtf.performanceNow_
  }
  a = wtf.timebase();
  return Date.now ? Date.now : function() {
    return Date.now() - a
  }
}();
goog.exportSymbol("wtf.hasHighResolutionTimes", wtf.hasHighResolutionTimes);
goog.exportSymbol("wtf.timebase", wtf.timebase);
goog.exportSymbol("wtf.now", wtf.now);
// Input 56
wtf.data.UserAgent = {};
wtf.data.ContextType = {SCRIPT:"script"};
wtf.data.ContextInfo = function() {
};
wtf.data.ContextInfo.prototype.write = function(a) {
  var b = this.serialize(), b = goog.json.serialize(b);
  a.writeUtf8String(b);
  return!0
};
wtf.data.ContextInfo.parse = function(a) {
  a = a.readUtf8String();
  if(!a) {
    return null
  }
  a = goog.global.JSON.parse(a);
  var b;
  switch(a.contextType) {
    case wtf.data.ContextType.SCRIPT:
      b = new wtf.data.ScriptContextInfo
  }
  return!b || !b.parse(a) ? null : b
};
wtf.data.ContextInfo.detect = function() {
  var a;
  a = new wtf.data.ScriptContextInfo;
  goog.asserts.assert(a);
  a.detect();
  return a
};
wtf.data.UserAgent.Type = {UNKNOWN:"unknown", NODEJS:"nodejs", OPERA:"opera", IE:"ie", GECKO:"gecko", WEBKIT:"webkit"};
wtf.data.UserAgent.Platform = {MAC:"mac", WINDOWS:"windows", LINUX:"linux", OTHER:"other"};
wtf.data.UserAgent.Device = {DESKTOP:"desktop", SERVER:"server", CHROME:"chrome", IPHONE:"iphone", IPAD:"ipad", ANDROID:"android", OTHER_MOBILE:"mobile"};
wtf.data.ScriptContextInfo = function() {
  wtf.data.ContextInfo.call(this);
  this.uri = "";
  this.taskId = this.icon = this.title = null;
  this.args = [];
  this.userAgent = {value:"", type:wtf.data.UserAgent.Type.UNKNOWN, platform:wtf.data.UserAgent.Platform.OTHER, platformVersion:"", device:wtf.data.UserAgent.Device.DESKTOP}
};
goog.inherits(wtf.data.ScriptContextInfo, wtf.data.ContextInfo);
wtf.data.ScriptContextInfo.prototype.getFilename = function() {
  if(this.title) {
    var a = goog.string.stripQuotes(this.title, "\"`'"), a = goog.string.collapseWhitespace(a), a = a.replace(/[\/ \n\r]/g, "-"), a = a.replace(/[-]+/g, "-");
    return a = a.toLowerCase()
  }
  if(this.uri) {
    var b = goog.Uri.parse(this.uri), a = b.getDomain();
    b.hasPort() && (a += "-" + b.getPort());
    b.hasPath() && (b = b.getPath(), b = b.replace(/\//g, "-"), b = b.replace(/\./g, "-"), goog.string.endsWith(a, "-") && (b = b.substr(0, b.length - 1)), a += b);
    return a
  }
  return"script"
};
wtf.data.ScriptContextInfo.prototype.detect = function() {
  if(wtf.NODE) {
    this.uri = process.argv[1] || process.argv[0], "node" == process.title ? (this.title = this.uri.substr(this.uri.lastIndexOf("/") + 1), this.title = this.title.replace(/\.js$/, "")) : this.title = process.title, this.icon = null, this.taskId = String(process.pid), this.args = process.argv.slice()
  }else {
    this.uri = goog.global.location.href;
    if(goog.global.document) {
      this.title = goog.global.document.title;
      var a = goog.global.document.querySelector('link[rel~="icon"]');
      a && a.href && (this.icon = {uri:a.href})
    }
    this.taskId = "";
    this.args = []
  }
  this.userAgent.value = goog.userAgent.getUserAgentString() || "";
  this.userAgent.type = wtf.NODE ? wtf.data.UserAgent.Type.NODEJS : goog.userAgent.OPERA ? wtf.data.UserAgent.Type.OPERA : goog.userAgent.IE ? wtf.data.UserAgent.Type.IE : goog.userAgent.GECKO ? wtf.data.UserAgent.Type.GECKO : goog.userAgent.WEBKIT ? wtf.data.UserAgent.Type.WEBKIT : wtf.data.UserAgent.Type.UNKNOWN;
  this.userAgent.platform = wtf.NODE ? process.platform : goog.userAgent.MAC ? wtf.data.UserAgent.Platform.MAC : goog.userAgent.WINDOWS ? wtf.data.UserAgent.Platform.WINDOWS : goog.userAgent.LINUX ? wtf.data.UserAgent.Platform.LINUX : wtf.data.UserAgent.Platform.OTHER;
  this.userAgent.platformVersion = wtf.NODE ? process.version : goog.userAgent.platform.VERSION;
  this.userAgent.device = wtf.NODE ? wtf.data.UserAgent.Device.SERVER : goog.userAgent.product.CHROME ? wtf.data.UserAgent.Device.CHROME : goog.userAgent.product.IPHONE ? wtf.data.UserAgent.Device.IPHONE : goog.userAgent.product.IPAD ? wtf.data.UserAgent.Device.IPAD : goog.userAgent.product.ANDROID ? wtf.data.UserAgent.Device.ANDROID : goog.userAgent.MOBILE ? wtf.data.UserAgent.Device.OTHER_MOBILE : wtf.data.UserAgent.Device.DESKTOP
};
wtf.data.ScriptContextInfo.prototype.parse = function(a) {
  this.uri = a.uri;
  this.title = a.title || null;
  this.icon = a.icon ? {uri:a.icon.uri} : null;
  this.taskId = a.taskId || null;
  this.args = a.args;
  this.userAgent.value = a.userAgent.value;
  this.userAgent.type = a.userAgent.type;
  this.userAgent.platform = a.userAgent.platform;
  this.userAgent.platformVersion = a.userAgent.platformVersion;
  this.userAgent.device = a.userAgent.device;
  return!0
};
wtf.data.ScriptContextInfo.prototype.serialize = function() {
  return{contextType:wtf.data.ContextType.SCRIPT, uri:this.uri, title:this.title, icon:this.icon ? {uri:this.icon.uri} : null, taskId:this.taskId, args:this.args, userAgent:{value:this.userAgent.value, type:this.userAgent.type, platform:this.userAgent.platform, platformVersion:this.userAgent.platformVersion, device:this.userAgent.device}}
};
// Input 57
wtf.analysis.sources = {};
wtf.analysis.sources.BinaryTraceSource = function(a, b) {
  wtf.analysis.TraceSource.call(this, a);
  this.readStream_ = b;
  this.registerDisposable(this.readStream_);
  this.hasReadTraceHeader_ = !1;
  this.eventTable_ = [];
  this.zoneTable_ = {};
  this.currentZone_ = null;
  this.flowTable_ = {};
  this.timeRangeTable_ = {};
  this.builtinDispatch_ = {};
  this.setupDispatchTable_();
  this.readStream_.addListener(wtf.io.EventType.READ, this.processBuffer_, this);
  this.readStream_.listen()
};
goog.inherits(wtf.analysis.sources.BinaryTraceSource, wtf.analysis.TraceSource);
wtf.analysis.sources.BinaryTraceSource.prototype.processBuffer_ = function(a, b) {
  var c;
  if(!this.hasReadTraceHeader_) {
    if(!this.readTraceHeader_(a)) {
      return!1
    }
    c = this.getContextInfo();
    goog.asserts.assert(c);
    this.traceListener.sourceAdded(this.getTimebase(), c);
    this.hasReadTraceHeader_ = !0
  }
  c = this.getContextInfo();
  goog.asserts.assert(c);
  this.traceListener.beginEventBatch(c);
  c = !0;
  for(var d = a.data;a.offset < b;) {
    var e = a.offset, f = d[e++] << 8 | d[e++], g = (d[e++] << 24 >>> 0 | d[e++] << 16 | d[e++] << 8 | d[e++]) >>> 0, g = g / 1E3;
    a.offset = e;
    e = this.eventTable_[f];
    if(!e) {
      c = !1;
      this.traceListener.sourceError("Undefined event type", "The file tried to reference an event it didn't define. Perhaps it's corrupted?");
      break
    }
    f = e.parse ? e.parse(a) : {};
    this.dispatchEvent_(e, g, f)
  }
  this.traceListener.endEventBatch();
  return c
};
wtf.analysis.sources.BinaryTraceSource.prototype.readTraceHeader_ = function(a) {
  var b = this.traceListener;
  if(3735928559 != a.readUint32()) {
    return b.sourceError("File type not supported or corrupt", "The header of the file doesn't match the expected value."), !1
  }
  a.readUint32();
  var c = a.readUint32();
  if(c != wtf.data.formats.BinaryTrace.VERSION) {
    return this.traceListener.sourceError("File version not supported or too old", "Sorry, the parser for this file version is not available :("), !1
  }
  var d = wtf.data.ContextInfo.parse(a);
  if(!d) {
    return this.traceListener.sourceError("Invalid context information"), !1
  }
  var e = a.readUint32(), f = goog.math.Long.fromBits(a.readUint32(), a.readUint32()).toNumber(), g = b.computeTimeDelay(f);
  a = (a = a.readUtf8String()) ? goog.global.JSON.parse(a) : {};
  goog.isObject(a) || (a = {});
  this.initialize(d, e, a, f, g);
  switch(c) {
    default:
      b.defineEventType(wtf.analysis.EventType.createInstance("wtf.event#define(uint16 wireId, uint16 eventClass, uint32 flags, ascii name, ascii args)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL))
  }
  this.eventTable_[1] = b.getEventType("wtf.event#define");
  return!0
};
wtf.analysis.sources.BinaryTraceSource.prototype.setupDispatchTable_ = function() {
  this.builtinDispatch_["wtf.event#define"] = function(a, b, c, d, e) {
    a = a.defineEventType(wtf.analysis.EventType.parse(e));
    this.eventTable_[e.wireId] = a
  };
  this.builtinDispatch_["wtf.zone#create"] = function(a, b, c, d, e) {
    a = a.createOrGetZone(e.name, e.type, e.location);
    this.zoneTable_[e.zoneId] = a;
    return new wtf.analysis.ZoneEvent(b, c, d, e, a)
  };
  this.builtinDispatch_["wtf.zone#delete"] = function(a, b, c, d, e) {
    return new wtf.analysis.ZoneEvent(b, c, d, e, this.zoneTable_[e.zoneId] || null)
  };
  this.builtinDispatch_["wtf.zone#set"] = function(a, b, c, d, e) {
    this.currentZone_ = this.zoneTable_[e.zoneId] || null
  };
  this.builtinDispatch_["wtf.flow#branch"] = function(a, b, c, d, e) {
    var f = e.parentId;
    a = e.id;
    f = new wtf.analysis.Flow(a, f ? this.flowTable_[f] : null);
    this.flowTable_[a] = f;
    b = new wtf.analysis.FlowEvent(b, c, d, e, f);
    f.setBranchEvent(b);
    return b
  };
  this.builtinDispatch_["wtf.flow#extend"] = function(a, b, c, d, e) {
    a = this.flowTable_[e.id];
    if(!a) {
      return null
    }
    b = new wtf.analysis.FlowEvent(b, c, d, e, a);
    a.addExtendEvent(b);
    return b
  };
  this.builtinDispatch_["wtf.flow#terminate"] = function(a, b, c, d, e) {
    a = this.flowTable_[e.id];
    if(!a) {
      return null
    }
    b = new wtf.analysis.FlowEvent(b, c, d, e, a);
    a.setTerminateEvent(b);
    return b
  };
  this.builtinDispatch_["wtf.scope#enter"] = function(a, b, c, d, e) {
    b = new wtf.analysis.Scope;
    var f = a.getEventType(e.name);
    f || (f = a.defineEventType(new wtf.analysis.EventType(e.name, wtf.data.EventClass.SCOPE, 0, [])));
    a = new wtf.analysis.ScopeEvent(f, c, d, [], b);
    b.setEnterEvent(a);
    return a
  };
  this.builtinDispatch_["wtf.trace#timeStamp"] = function(a, b, c, d, e) {
    (b = a.getEventType(e.name)) || (b = a.defineEventType(new wtf.analysis.EventType(e.name, wtf.data.EventClass.INSTANCE, 0, [wtf.data.Variable.create("value", "any")])));
    return new wtf.analysis.Event(b, c, d, {value:e.value})
  };
  this.builtinDispatch_["wtf.timeRange#begin"] = function(a, b, c, d, e) {
    var f = e.id;
    (a = this.timeRangeTable_[f]) ? delete this.timeRangeTable_[f] : (a = new wtf.analysis.TimeRange, this.timeRangeTable_[f] = a);
    b = new wtf.analysis.TimeRangeEvent(b, c, d, e, a);
    a.setBeginEvent(b);
    return b
  };
  this.builtinDispatch_["wtf.timeRange#end"] = function(a, b, c, d, e) {
    var f = e.id;
    (a = this.timeRangeTable_[f]) ? delete this.timeRangeTable_[f] : (a = new wtf.analysis.TimeRange, this.timeRangeTable_[f] = a);
    b = new wtf.analysis.TimeRangeEvent(b, c, d, e, a);
    a.setEndEvent(b);
    return b
  }
};
wtf.analysis.sources.BinaryTraceSource.prototype.dispatchEvent_ = function(a, b, c) {
  b += this.getTimeDelay();
  var d = this.currentZone_, e = this.traceListener;
  e.traceRawEvent(a, d, this.getTimebase(), b, c);
  var f = null;
  if(a.flags & wtf.data.EventFlag.APPEND_FLOW_DATA) {
    var g = this.flowTable_[c.id];
    if(!g) {
      return
    }
    f = new wtf.analysis.FlowEvent(a, d, b, c, g);
    g.addDataEvent(f)
  }else {
    a.flags & wtf.data.EventFlag.BUILTIN && (g = this.builtinDispatch_[a.name]) && (f = g.call(this, e, a, d, b, c))
  }
  if(!f) {
    switch(a.eventClass) {
      case wtf.data.EventClass.SCOPE:
        g = new wtf.analysis.Scope;
        f = new wtf.analysis.ScopeEvent(a, d, b, c, g);
        g.setEnterEvent(f);
        break;
      default:
      ;
      case wtf.data.EventClass.INSTANCE:
        f = new wtf.analysis.Event(a, d, b, c)
    }
  }
  f && e.traceEvent(f)
};
// Input 58
wtf.analysis.sources.JsonTraceSource = function(a, b) {
  wtf.analysis.TraceSource.call(this, a);
  this.zoneTable_ = {};
  this.currentZone_ = a.getDefaultZone();
  goog.isString(b) && (b = this.parseJson_(b));
  goog.isObject(b) && !goog.isArray(b) && (b = b.events);
  goog.isArray(b) && this.parseEvents_(b)
};
goog.inherits(wtf.analysis.sources.JsonTraceSource, wtf.analysis.TraceSource);
wtf.analysis.sources.JsonTraceSource.BuiltinEvents_ = {"wtf.event#define":wtf.analysis.EventType.createInstance("wtf.event#define(uint16 wireId, uint16 eventClass, uint32 flags, ascii name, ascii args)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), "wtf.trace.#discontinuity":wtf.analysis.EventType.createInstance("wtf.trace.#discontinuity()", wtf.data.EventFlag.BUILTIN), "wtf.zone#create":wtf.analysis.EventType.createInstance("wtf.zone#create(uint16 zoneId, ascii name, ascii type, ascii location)", 
wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), "wtf.zone#delete":wtf.analysis.EventType.createInstance("wtf.zone#delete(uint16 zoneId)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), "wtf.zone#set":wtf.analysis.EventType.createInstance("wtf.zone#set(uint16 zoneId)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), "wtf.scope#enter":wtf.analysis.EventType.createScope("wtf.scope#enter(ascii name)", wtf.data.EventFlag.BUILTIN), "wtf.scope#enterTracing":wtf.analysis.EventType.createScope("wtf.scope#enterTracing()", 
wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.SYSTEM_TIME), "wtf.scope#leave":wtf.analysis.EventType.createInstance("wtf.scope#leave()", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), "wtf.flow#branch":wtf.analysis.EventType.createInstance("wtf.flow#branch(flowId id, flowId parentId, ascii name, any value)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), "wtf.flow#extend":wtf.analysis.EventType.createInstance("wtf.flow#extend(flowId id, ascii name, any value)", 
wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), "wtf.flow#terminate":wtf.analysis.EventType.createInstance("wtf.flow#terminate(flowId id, any value)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), "wtf.trace#mark":wtf.analysis.EventType.createInstance("wtf.trace#mark(ascii name, any value)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), "wtf.trace#timeStamp":wtf.analysis.EventType.createInstance("wtf.trace#timeStamp(ascii name, any value)", wtf.data.EventFlag.BUILTIN)};
wtf.analysis.sources.JsonTraceSource.prototype.parseJson_ = function(a) {
  if(!a.length) {
    return[]
  }
  if("{" == a[0]) {
    return goog.global.JSON.parse(a)
  }
  for(var b = a.length - 1;b && "\n" == a[b];) {
    b--
  }
  "," == a[b] ? a = a.substr(0, b - 1) + "]" : "]" != a[b] && (a += "]");
  return goog.global.JSON.parse(a)
};
wtf.analysis.sources.JsonTraceSource.prototype.parseEvents_ = function(a) {
  var b = this.traceListener, c = wtf.analysis.sources.JsonTraceSource.BuiltinEvents_;
  b.defineEventType(c["wtf.scope#leave"]);
  var d = [];
  d[-1] = b.getEventType("wtf.scope#leave");
  for(var e = !1, f = 0;f < a.length;f++) {
    var g = a[f];
    if(g.event) {
      e || (this.parseHeader_(null), b.beginEventBatch(this.getContextInfo()), e = !0);
      var h = g.event, i = g.time, g = g.args || null, j = d[h] || b.getEventType(h);
      if(!j) {
        if(j = c[h]) {
          b.defineEventType(j)
        }else {
          return b.sourceError("Undefined event type", "The file tried to reference an event it didn't define. Perhaps it's corrupted?"), !1
        }
      }
      this.dispatchEvent_(j, i, g)
    }else {
      switch(g.type) {
        case "wtf.json#header":
          if(!e) {
            if(!this.parseHeader_(g)) {
              return!1
            }
            b.beginEventBatch(this.getContextInfo());
            e = !0
          }
          break;
        case "wtf.event#define":
          j = b.defineEventType(this.parseEventType_(g)), h = g.event_id, goog.isDef(h) && (d[h] = j)
      }
    }
  }
  e && b.endEventBatch();
  return!0
};
wtf.analysis.sources.JsonTraceSource.prototype.parseHeader_ = function(a) {
  var b = this.traceListener;
  a = a || {};
  if((a.format_version || 1) != wtf.data.formats.JsonTrace.VERSION) {
    return b.sourceError("File version not supported or too old", "Sorry, the parser for this file version is not available :("), !1
  }
  var c = 0;
  if(goog.isDef(a.high_resolution_times) ? a.high_resolution_times : 1) {
    c |= wtf.data.formats.FileFlags.HAS_HIGH_RESOLUTION_TIMES
  }
  var d = a.timebase || 0;
  a = a.metadata || {};
  var e = new wtf.data.ScriptContextInfo, f = b.computeTimeDelay(d);
  this.initialize(e, c, a, d, f);
  b.sourceAdded(this.getTimebase(), e);
  return!0
};
wtf.analysis.sources.JsonTraceSource.prototype.parseEventType_ = function(a) {
  var b = a.signature;
  goog.asserts.assert(b);
  var c = a.flags || 0, d = wtf.data.EventClass.SCOPE;
  switch(a["class"]) {
    default:
    ;
    case "scope":
      d = wtf.data.EventClass.SCOPE;
      break;
    case "instance":
      d = wtf.data.EventClass.INSTANCE
  }
  a = wtf.data.Variable.parseSignature(b);
  return new wtf.analysis.EventType(a.name, d, c, a.args)
};
wtf.analysis.sources.JsonTraceSource.prototype.dispatchEvent_ = function(a, b, c) {
  b += this.getTimeDelay();
  var d = {};
  if(c && c.length && c.length == a.args.length) {
    for(var e = 0;e < c.length;e++) {
      d[a.args[e].name] = c[e]
    }
  }
  c = this.currentZone_;
  e = this.traceListener;
  e.traceRawEvent(a, c, this.getTimebase(), b, d);
  var f = null;
  if(a.flags & wtf.data.EventFlag.BUILTIN && a.eventClass != wtf.data.EventClass.SCOPE) {
    switch(a.name) {
      case "wtf.zone#create":
        f = e.createOrGetZone(d.name, d.type, d.location);
        this.zoneTable_[d.zoneId] = f;
        f = new wtf.analysis.ZoneEvent(a, c, b, d, f);
        break;
      case "wtf.zone#delete":
        f = new wtf.analysis.ZoneEvent(a, c, b, d, this.zoneTable_[d.zoneId] || null);
        break;
      case "wtf.zone#set":
        this.currentZone_ = this.zoneTable_[d.zoneId] || null;
        break;
      default:
        f = new wtf.analysis.Event(a, c, b, d)
    }
  }else {
    switch(a.eventClass) {
      case wtf.data.EventClass.SCOPE:
        var g = new wtf.analysis.Scope, f = new wtf.analysis.ScopeEvent(a, c, b, d, g);
        g.setEnterEvent(f);
        break;
      default:
      ;
      case wtf.data.EventClass.INSTANCE:
        f = new wtf.analysis.Event(a, c, b, d)
    }
  }
  f && e.traceEvent(f)
};
// Input 59
wtf.io.MemoryReadStream = function() {
  wtf.io.ReadStream.call(this);
  this.queue_ = []
};
goog.inherits(wtf.io.MemoryReadStream, wtf.io.ReadStream);
wtf.io.MemoryReadStream.prototype.disposeInternal = function() {
  this.queue_.length = 0;
  wtf.io.MemoryReadStream.superClass_.disposeInternal.call(this)
};
wtf.io.MemoryReadStream.prototype.listeningBegan = function() {
  for(var a = 0;a < this.queue_.length;a++) {
    var b = this.queue_[a];
    this.fireReadEvent(b, b.capacity)
  }
  this.queue_.length = 0
};
wtf.io.MemoryReadStream.prototype.addData = function(a) {
  a = new wtf.io.Buffer(a.length, a);
  this.isListening() ? this.fireReadEvent(a, a.capacity) : this.queue_.push(a)
};
// Input 60
wtf.analysis.Session = function(a) {
  goog.Disposable.call(this);
  this.traceListener_ = a;
  this.storage_ = null;
  this.traceSources_ = []
};
goog.inherits(wtf.analysis.Session, goog.Disposable);
wtf.analysis.Session.prototype.disposeInternal = function() {
  goog.dispose(this.storage_);
  wtf.analysis.Session.superClass_.disposeInternal.call(this)
};
wtf.analysis.Session.prototype.getTraceListener = function() {
  return this.traceListener_
};
wtf.analysis.Session.prototype.getStorage = function() {
  return this.storage_
};
wtf.analysis.Session.prototype.setStorageEnabled = function(a) {
  a != !!this.storage_ && (a ? this.storage_ = new wtf.analysis.Storage : (goog.dispose(this.storage_), this.storage_ = null))
};
wtf.analysis.Session.prototype.addTraceSource_ = function(a) {
  this.traceSources_.push(a);
  this.registerDisposable(a)
};
wtf.analysis.Session.prototype.addStreamingSource = function(a) {
  this.storage_ && (a = this.storage_.captureStream(a));
  this.addTraceSource_(new wtf.analysis.sources.BinaryTraceSource(this.getTraceListener(), a))
};
wtf.analysis.Session.prototype.addBinarySource = function(a) {
  var b = new wtf.io.MemoryReadStream;
  b.addData(a);
  this.storage_ && (b = this.storage_.captureStream(b));
  this.addTraceSource_(new wtf.analysis.sources.BinaryTraceSource(this.getTraceListener(), b))
};
wtf.analysis.Session.prototype.addJsonSource = function(a) {
  this.addTraceSource_(new wtf.analysis.sources.JsonTraceSource(this.getTraceListener(), a))
};
// Input 61
/*
 Portions of this code are from MochiKit, received by
 The Closure Authors under the MIT license. All other code is Copyright
 2005-2009 The Closure Authors. All Rights Reserved.
*/
goog.async = {};
goog.async.Deferred = function(a, b) {
  this.sequence_ = [];
  this.onCancelFunction_ = a;
  this.defaultScope_ = b || null
};
goog.async.Deferred.prototype.fired_ = !1;
goog.async.Deferred.prototype.hadError_ = !1;
goog.async.Deferred.prototype.blocked_ = !1;
goog.async.Deferred.prototype.blocking_ = !1;
goog.async.Deferred.prototype.silentlyCancelled_ = !1;
goog.async.Deferred.prototype.branches_ = 0;
goog.async.Deferred.prototype.cancel = function(a) {
  if(this.hasFired()) {
    this.result_ instanceof goog.async.Deferred && this.result_.cancel()
  }else {
    if(this.parent_) {
      var b = this.parent_;
      delete this.parent_;
      a ? b.cancel(a) : b.branchCancel_()
    }
    this.onCancelFunction_ ? this.onCancelFunction_.call(this.defaultScope_, this) : this.silentlyCancelled_ = !0;
    this.hasFired() || this.errback(new goog.async.Deferred.CancelledError(this))
  }
};
goog.async.Deferred.prototype.branchCancel_ = function() {
  this.branches_--;
  0 >= this.branches_ && this.cancel()
};
goog.async.Deferred.prototype.continue_ = function(a, b) {
  this.blocked_ = !1;
  this.updateResult_(a, b)
};
goog.async.Deferred.prototype.updateResult_ = function(a, b) {
  this.fired_ = !0;
  this.result_ = b;
  this.hadError_ = !a;
  this.fire_()
};
goog.async.Deferred.prototype.check_ = function() {
  if(this.hasFired()) {
    if(!this.silentlyCancelled_) {
      throw new goog.async.Deferred.AlreadyCalledError(this);
    }
    this.silentlyCancelled_ = !1
  }
};
goog.async.Deferred.prototype.callback = function(a) {
  this.check_();
  this.assertNotDeferred_(a);
  this.updateResult_(!0, a)
};
goog.async.Deferred.prototype.errback = function(a) {
  this.check_();
  this.assertNotDeferred_(a);
  this.updateResult_(!1, a)
};
goog.async.Deferred.prototype.assertNotDeferred_ = function(a) {
  goog.asserts.assert(!(a instanceof goog.async.Deferred), "An execution sequence may not be initiated with a blocking Deferred.")
};
goog.async.Deferred.prototype.addCallback = function(a, b) {
  return this.addCallbacks(a, null, b)
};
goog.async.Deferred.prototype.addErrback = function(a, b) {
  return this.addCallbacks(null, a, b)
};
goog.async.Deferred.prototype.addBoth = function(a, b) {
  return this.addCallbacks(a, a, b)
};
goog.async.Deferred.prototype.addCallbacks = function(a, b, c) {
  goog.asserts.assert(!this.blocking_, "Blocking Deferreds can not be re-used");
  this.sequence_.push([a, b, c]);
  this.hasFired() && this.fire_();
  return this
};
goog.async.Deferred.prototype.chainDeferred = function(a) {
  this.addCallbacks(a.callback, a.errback, a);
  return this
};
goog.async.Deferred.prototype.awaitDeferred = function(a) {
  return this.addCallback(goog.bind(a.branch, a))
};
goog.async.Deferred.prototype.branch = function(a) {
  var b = new goog.async.Deferred;
  this.chainDeferred(b);
  a && (b.parent_ = this, this.branches_++);
  return b
};
goog.async.Deferred.prototype.hasFired = function() {
  return this.fired_
};
goog.async.Deferred.prototype.isError = function(a) {
  return a instanceof Error
};
goog.async.Deferred.prototype.hasErrback_ = function() {
  return goog.array.some(this.sequence_, function(a) {
    return goog.isFunction(a[1])
  })
};
goog.async.Deferred.prototype.fire_ = function() {
  this.unhandledExceptionTimeoutId_ && (this.hasFired() && this.hasErrback_()) && (goog.global.clearTimeout(this.unhandledExceptionTimeoutId_), delete this.unhandledExceptionTimeoutId_);
  this.parent_ && (this.parent_.branches_--, delete this.parent_);
  for(var a = this.result_, b = !1, c = !1;this.sequence_.length && !this.blocked_;) {
    var d = this.sequence_.shift(), e = d[0], f = d[1], d = d[2];
    if(e = this.hadError_ ? f : e) {
      try {
        var g = e.call(d || this.defaultScope_, a);
        goog.isDef(g) && (this.hadError_ = this.hadError_ && (g == a || this.isError(g)), this.result_ = a = g);
        a instanceof goog.async.Deferred && (this.blocked_ = c = !0)
      }catch(h) {
        a = h, this.hadError_ = !0, this.hasErrback_() || (b = !0)
      }
    }
  }
  this.result_ = a;
  c && (a.addCallbacks(goog.bind(this.continue_, this, !0), goog.bind(this.continue_, this, !1)), a.blocking_ = !0);
  b && (this.unhandledExceptionTimeoutId_ = goog.global.setTimeout(function() {
    throw a;
  }, 0))
};
goog.async.Deferred.succeed = function(a) {
  var b = new goog.async.Deferred;
  b.callback(a);
  return b
};
goog.async.Deferred.fail = function(a) {
  var b = new goog.async.Deferred;
  b.errback(a);
  return b
};
goog.async.Deferred.cancelled = function() {
  var a = new goog.async.Deferred;
  a.cancel();
  return a
};
goog.async.Deferred.when = function(a, b, c) {
  return a instanceof goog.async.Deferred ? a.branch(!0).addCallback(b, c) : goog.async.Deferred.succeed(a).addCallback(b, c)
};
goog.async.Deferred.AlreadyCalledError = function(a) {
  goog.debug.Error.call(this);
  this.deferred = a
};
goog.inherits(goog.async.Deferred.AlreadyCalledError, goog.debug.Error);
goog.async.Deferred.AlreadyCalledError.prototype.message = "Deferred has already fired";
goog.async.Deferred.AlreadyCalledError.prototype.name = "AlreadyCalledError";
goog.async.Deferred.CancelledError = function(a) {
  goog.debug.Error.call(this);
  this.deferred = a
};
goog.inherits(goog.async.Deferred.CancelledError, goog.debug.Error);
goog.async.Deferred.CancelledError.prototype.message = "Deferred was cancelled";
goog.async.Deferred.CancelledError.prototype.name = "CancelledError";
// Input 62
wtf.analysis.db = {};
wtf.analysis.db.Chunk = function() {
  goog.Disposable.call(this);
  this.eventCount_ = this.referenceCount_ = 0;
  this.timeStart_ = Number.MAX_VALUE;
  this.timeEnd_ = Number.MIN_VALUE;
  this.events_ = [];
  this.insertedEventCount_ = 0;
  this.insertionOutOfOrder_ = !1
};
goog.inherits(wtf.analysis.db.Chunk, goog.Disposable);
wtf.analysis.db.Chunk.SOFT_MAX_EVENTS_ = 500;
wtf.analysis.db.Chunk.prototype.acquire = function() {
  this.referenceCount_++;
  return null
};
wtf.analysis.db.Chunk.prototype.release = function() {
  goog.asserts.assert(this.referenceCount_);
  this.referenceCount_--
};
wtf.analysis.db.Chunk.prototype.getTimeStart = function() {
  return this.timeStart_ == Number.MAX_VALUE ? 0 : this.timeStart_
};
wtf.analysis.db.Chunk.prototype.getTimeEnd = function() {
  return this.timeEnd_ == Number.MIN_VALUE ? 0 : this.timeEnd_
};
wtf.analysis.db.Chunk.prototype.getEvents = function() {
  return this.events_
};
wtf.analysis.db.Chunk.prototype.isFull = function() {
  return this.eventCount_ >= wtf.analysis.db.Chunk.SOFT_MAX_EVENTS_
};
wtf.analysis.db.Chunk.prototype.insertEvent = function(a) {
  var b = !this.insertedEventCount_;
  this.events_.push(a);
  this.eventCount_++;
  this.insertedEventCount_++;
  this.timeStart_ = Math.min(this.timeStart_, a.time);
  this.timeEnd_ = Math.max(this.timeEnd_, a.time);
  !this.insertionOutOfOrder_ && (1 < this.events_.length && this.events_[this.events_.length - 2].time > a.time) && (this.insertionOutOfOrder_ = !0);
  return b
};
wtf.analysis.db.Chunk.prototype.reconcileInsertion = function() {
  this.insertedEventCount_ && (this.insertionOutOfOrder_ && this.events_.sort(wtf.analysis.Event.comparer), this.timeStart_ = this.events_[0].time, this.timeEnd_ = this.events_[this.events_.length - 1].time, this.insertionOutOfOrder_ = !1, this.insertedEventCount_ = 0)
};
wtf.analysis.db.Chunk.comparer = function(a, b) {
  return a.timeStart_ - b.timeStart_
};
// Input 63
wtf.analysis.db.IEventTarget = function() {
};
wtf.analysis.db.IEventTarget.prototype.beginInserting = goog.nullFunction;
wtf.analysis.db.IEventTarget.prototype.insertEvent = goog.nullFunction;
wtf.analysis.db.IEventTarget.prototype.endInserting = goog.nullFunction;
// Input 64
wtf.events.EventType = {INVALIDATED:goog.events.getUniqueId("invalidated")};
// Input 65
wtf.analysis.db.EventList = function() {
  wtf.events.EventEmitter.call(this);
  this.firstEventTime_ = Number.MAX_VALUE;
  this.lastEventTime_ = Number.MIN_VALUE;
  this.count_ = 0;
  this.insertingEvents_ = !1;
  this.insertedEventCount_ = 0;
  this.chunks_ = [];
  this.needsResortChunks_ = !1;
  this.dirtyChunks_ = []
};
goog.inherits(wtf.analysis.db.EventList, wtf.events.EventEmitter);
wtf.analysis.db.EventList.prototype.disposeInternal = function() {
  goog.disposeAll(this.chunks_);
  wtf.analysis.db.EventList.superClass_.disposeInternal.call(this)
};
wtf.analysis.db.EventList.prototype.getFirstEventTime = function() {
  return this.firstEventTime_ == Number.MAX_VALUE ? 0 : this.firstEventTime_
};
wtf.analysis.db.EventList.prototype.getLastEventTime = function() {
  return this.lastEventTime_ == Number.MIN_VALUE ? 0 : this.lastEventTime_
};
wtf.analysis.db.EventList.prototype.getCount = function() {
  return this.count_
};
wtf.analysis.db.EventList.prototype.indexOfChunkNear_ = function(a) {
  for(var b = this.chunks_, c = b.length, d = 0;d < c;d++) {
    var e = b[d];
    if(!(e.getTimeEnd() < a)) {
      return e.getTimeStart() > a ? d ? d - 1 : -1 : d
    }
  }
  return c ? b[c - 1].getTimeEnd() < a ? c - 1 : 0 : -1
};
wtf.analysis.db.EventList.prototype.indexOfEventNear_ = function(a, b) {
  var c = a.getEvents();
  if(!c) {
    return 0
  }
  for(var d = 0, e = c.length - 1;d < e;) {
    var f = (d + e) / 2 | 0;
    c[f].time < b ? d = f + 1 : e = f
  }
  return d
};
wtf.analysis.db.EventList.prototype.search = function(a, b) {
  this.dirtyChunks_.length && this.reconcileChanges_();
  var c = this.chunks_;
  if(!c.length) {
    return null
  }
  var d = this.indexOfChunkNear_(a);
  if(0 > d) {
    return null
  }
  for(;0 <= d;d--) {
    var e = c[d], f = e.getEvents();
    if(f) {
      for(var g = 0, g = e.getTimeEnd() < a ? f.length - 1 : this.indexOfEventNear_(e, a);0 <= g;g--) {
        if(e = f[g], e.time <= a && b(e)) {
          return e
        }
      }
    }
  }
  return null
};
wtf.analysis.db.EventList.findEventWithScope_ = function(a) {
  return!!a.scope && !!a.scope.getEnterEvent() && !!a.scope.getLeaveEvent()
};
wtf.analysis.db.EventList.prototype.findEnclosingScope = function(a) {
  var b = this.search(a, wtf.analysis.db.EventList.findEventWithScope_);
  if(!b) {
    return null
  }
  for(b = b.scope;b;b = b.getParent()) {
    var c = b.getEnterEvent(), d = b.getLeaveEvent();
    if(c && c.time <= a && d && d.time >= a) {
      return b
    }
  }
  return null
};
wtf.analysis.db.EventList.prototype.findInstances = function(a, b, c, d) {
  return this.find(a, b, c ? function(a) {
    return a.scope == c && a.eventType.eventClass == wtf.data.EventClass.INSTANCE && (d || !(a.eventType.flags & wtf.data.EventFlag.INTERNAL))
  } : function(a) {
    return a.eventType.eventClass == wtf.data.EventClass.INSTANCE && (d || !(a.eventType.flags & wtf.data.EventFlag.INTERNAL))
  })
};
wtf.analysis.db.EventList.prototype.find = function(a, b, c, d) {
  var e = [];
  this.forEach(a, b, function(a) {
    c.call(d, a) && e.push(a)
  });
  return e
};
wtf.analysis.db.EventList.prototype.forEach = function(a, b, c, d) {
  goog.asserts.assert(!this.dirtyChunks_.length);
  var e = this.chunks_, f = e.length;
  if(f) {
    var g = this.indexOfChunkNear_(a);
    for(0 > g && (g = 0);g < f;g++) {
      var h = e[g];
      if(h.getTimeStart() > b) {
        break
      }
      var i = h.getEvents();
      if(i) {
        var j = 0;
        if(h.getTimeStart() < a) {
          for(;j < i.length && !(h = i[j], h.time >= a);j++) {
          }
        }
        for(;j < i.length;j++) {
          if(h = i[j], h.time > b || !1 === c.call(d, h)) {
            return
          }
        }
      }
    }
  }
};
wtf.analysis.db.EventList.prototype.beginInserting = function() {
  goog.asserts.assert(!this.insertingEvents_);
  this.insertingEvents_ = !0
};
wtf.analysis.db.EventList.prototype.insertEvent = function(a) {
  goog.asserts.assert(this.insertingEvents_);
  a.time && a.time < this.firstEventTime_ && (this.firstEventTime_ = a.time);
  a.time && a.time > this.lastEventTime_ && (this.lastEventTime_ = a.time);
  this.insertedEventCount_++;
  this.count_++;
  if(this.chunks_.length) {
    if(c = this.chunks_[this.chunks_.length - 1], a.time >= c.getTimeStart()) {
      c.isFull() && (c = new wtf.analysis.db.Chunk, this.chunks_.push(c), this.needsResortChunks_ = !0), c.insertEvent(a) && this.dirtyChunks_.push(c)
    }else {
      for(var b = this.chunks_.length - 2;0 <= b;b--) {
        if(c = this.chunks_[b], a.time >= c.getTimeStart()) {
          c.insertEvent(a) && this.dirtyChunks_.push(c);
          return
        }
      }
      c = this.chunks_[0];
      c.insertEvent(a);
      this.dirtyChunks_.push(c)
    }
  }else {
    var c = new wtf.analysis.db.Chunk;
    this.chunks_.push(c);
    this.needsResortChunks_ = !0;
    c.insertEvent(a) && this.dirtyChunks_.push(c)
  }
};
wtf.analysis.db.EventList.prototype.endInserting = function() {
  goog.asserts.assert(this.insertingEvents_);
  this.insertingEvents_ = !1;
  this.reconcileChanges_();
  this.insertedEventCount_ && (this.insertedEventCount_ = 0, this.invalidate())
};
wtf.analysis.db.EventList.prototype.reconcileChanges_ = function() {
  for(var a = 0;a < this.dirtyChunks_.length;a++) {
    this.dirtyChunks_[a].reconcileInsertion()
  }
  this.dirtyChunks_.length = 0;
  this.needsResortChunks_ && (this.needsResortChunks_ = !1, this.chunks_.sort(wtf.analysis.db.Chunk.comparer))
};
wtf.analysis.db.EventList.prototype.invalidate = function() {
  this.emitEvent(wtf.events.EventType.INVALIDATED)
};
goog.exportProperty(wtf.analysis.db.EventList.prototype, "getFirstEventTime", wtf.analysis.db.EventList.prototype.getFirstEventTime);
goog.exportProperty(wtf.analysis.db.EventList.prototype, "getLastEventTime", wtf.analysis.db.EventList.prototype.getLastEventTime);
goog.exportProperty(wtf.analysis.db.EventList.prototype, "getCount", wtf.analysis.db.EventList.prototype.getCount);
goog.exportProperty(wtf.analysis.db.EventList.prototype, "search", wtf.analysis.db.EventList.prototype.search);
goog.exportProperty(wtf.analysis.db.EventList.prototype, "findEnclosingScope", wtf.analysis.db.EventList.prototype.findEnclosingScope);
goog.exportProperty(wtf.analysis.db.EventList.prototype, "forEach", wtf.analysis.db.EventList.prototype.forEach);
// Input 66
wtf.analysis.db.EventIndex = function(a) {
  wtf.analysis.db.EventList.call(this);
  this.eventName_ = a
};
goog.inherits(wtf.analysis.db.EventIndex, wtf.analysis.db.EventList);
wtf.analysis.db.EventIndex.prototype.getEventName = function() {
  return this.eventName_
};
wtf.analysis.db.EventIndex.prototype.insertEvent = function(a) {
  a.eventType.name == this.eventName_ && wtf.analysis.db.EventList.prototype.insertEvent.call(this, a)
};
goog.exportProperty(wtf.analysis.db.EventIndex.prototype, "getEventName", wtf.analysis.db.EventIndex.prototype.getEventName);
// Input 67
wtf.analysis.db.Granularity = {SECOND:1E3, DECISECOND:100, CENTISECOND:10, MILLISECOND:1, FINEST:100};
wtf.analysis.db.SortMode = {ANY:0, COUNT:1, TOTAL_TIME:2, MEAN_TIME:3};
goog.exportSymbol("wtf.analysis.db.SortMode", wtf.analysis.db.SortMode);
goog.exportProperty(wtf.analysis.db.SortMode, "ANY", wtf.analysis.db.SortMode.ANY);
goog.exportProperty(wtf.analysis.db.SortMode, "COUNT", wtf.analysis.db.SortMode.COUNT);
goog.exportProperty(wtf.analysis.db.SortMode, "TOTAL_TIME", wtf.analysis.db.SortMode.TOTAL_TIME);
goog.exportProperty(wtf.analysis.db.SortMode, "MEAN_TIME", wtf.analysis.db.SortMode.MEAN_TIME);
// Input 68
wtf.analysis.db.SummaryGenerator = function() {
  goog.Disposable.call(this)
};
goog.inherits(wtf.analysis.db.SummaryGenerator, goog.Disposable);
wtf.analysis.db.SummaryData = function(a, b) {
  this.timeStart = a;
  this.timeEnd = b;
  this.totalEventCount = 0
};
// Input 69
wtf.analysis.db.SummaryIndex = function() {
  wtf.events.EventEmitter.call(this);
  this.summaryGenerators_ = [];
  this.rootNode_ = null;
  this.firstEventTime_ = Number.MAX_VALUE;
  this.lastEventTime_ = Number.MIN_VALUE;
  this.insertingEvents_ = !1;
  this.insertedEventCount_ = 0
};
goog.inherits(wtf.analysis.db.SummaryIndex, wtf.events.EventEmitter);
wtf.analysis.db.SummaryIndex.prototype.disposeInternal = function() {
  goog.disposeAll(this.summaryGenerators_);
  wtf.analysis.db.SummaryIndex.superClass_.disposeInternal.call(this)
};
wtf.analysis.db.SummaryIndex.prototype.dump = function() {
  this.rootNode_ && this.rootNode_.dump()
};
wtf.analysis.db.SummaryIndex.prototype.addSummaryGenerator = function(a) {
  goog.asserts.assert(!goog.array.contains(this.summaryGenerators_, a));
  this.summaryGenerators_.push(a);
  goog.asserts.assert(!this.rootNode_)
};
wtf.analysis.db.SummaryIndex.prototype.getFirstEventTime = function() {
  return this.rootNode_ ? this.firstEventTime_ : 0
};
wtf.analysis.db.SummaryIndex.prototype.getLastEventTime = function() {
  return this.rootNode_ ? this.lastEventTime_ : 0
};
wtf.analysis.db.SummaryIndex.prototype.growToInclude_ = function(a) {
  for(var b = this.rootNode_;a < b.timeStart_ || a >= b.timeEnd_;) {
    var c = 10 * b.granularity_, d = b.timeStart_ - b.timeStart_ % c;
    d == b.timeStart_ && (d -= c);
    c = new wtf.analysis.db.SummaryIndexNode_(null, d, d + c);
    c.growFrom(b);
    b = c
  }
  this.rootNode_ = b
};
wtf.analysis.db.SummaryIndex.prototype.beginInserting = function() {
  goog.asserts.assert(!this.insertingEvents_);
  this.insertingEvents_ = !0
};
wtf.analysis.db.SummaryIndex.prototype.insertEvent = function(a) {
  goog.asserts.assert(this.insertingEvents_);
  if(!this.rootNode_) {
    var b = wtf.analysis.db.Granularity.SECOND, c = a.time - a.time % b;
    this.rootNode_ = new wtf.analysis.db.SummaryIndexNode_(null, c, c + b)
  }
  (a.time < this.rootNode_.timeStart_ || a.time >= this.rootNode_.timeEnd_) && this.growToInclude_(a.time);
  a.time && a.time < this.firstEventTime_ && (this.firstEventTime_ = a.time);
  a.time && a.time > this.lastEventTime_ && (this.lastEventTime_ = a.time);
  this.rootNode_.insertEvent(a);
  this.insertedEventCount_++
};
wtf.analysis.db.SummaryIndex.prototype.endInserting = function() {
  goog.asserts.assert(this.insertingEvents_);
  this.insertingEvents_ = !1;
  this.insertedEventCount_ && (this.insertedEventCount_ = 0, this.invalidate_())
};
wtf.analysis.db.SummaryIndex.prototype.forEach = function() {
};
wtf.analysis.db.SummaryIndex.prototype.querySummary = function(a, b) {
  var c = new wtf.analysis.db.SummaryData(Number.MAX_VALUE, Number.MIN_VALUE);
  this.rootNode_ && this.rootNode_.walkShallowRange(a, b, function(a) {
    a.timeStart_ < c.timeStart && (c.timeStart = a.timeStart_);
    a.timeEnd_ > c.timeEnd && (c.timeEnd = a.timeEnd_);
    c.totalEventCount += a.data.totalEventCount
  });
  c.timeStart == Number.MAX_VALUE && (c.timeStart = c.timeEnd = 0);
  return c
};
wtf.analysis.db.SummaryIndex.prototype.invalidate_ = function() {
  this.emitEvent(wtf.events.EventType.INVALIDATED)
};
wtf.analysis.db.SummaryIndexNode_ = function(a, b, c) {
  this.timeStart_ = b;
  this.timeEnd_ = c;
  this.granularity_ = c - b;
  this.children_ = null;
  this.data = new wtf.analysis.db.SummaryData(b, this.granularity_)
};
wtf.analysis.db.SummaryIndexNode_.prototype.growFrom = function(a) {
  this.expand_();
  this.children_[10 * ((a.timeStart_ - this.timeStart_) / this.granularity_) | 0] = a;
  a.parent_ = this
};
wtf.analysis.db.SummaryIndexNode_.prototype.expand_ = function() {
  if(!this.children_) {
    var a = this.timeEnd_ - this.timeStart_;
    if(!(a <= wtf.analysis.db.Granularity.FINEST)) {
      a /= 10;
      this.children_ = [];
      for(var b = 0, c = this.timeStart_;10 > b;b++, c += a) {
        this.children_.push(new wtf.analysis.db.SummaryIndexNode_(this, c, c + a))
      }
    }
  }
};
wtf.analysis.db.SummaryIndexNode_.prototype.insertEvent = function(a) {
  this.data.totalEventCount++;
  !this.children_ && this.granularity_ > wtf.analysis.db.Granularity.FINEST && this.expand_();
  this.children_ && this.children_[10 * ((a.time - this.timeStart_) / this.granularity_) | 0].insertEvent(a)
};
wtf.analysis.db.SummaryIndexNode_.prototype.dump = function(a) {
  a = a || 0;
  var b = goog.string.repeat("  ", a);
  window.console.log(b + this.timeStart_ + "-" + this.timeEnd_ + "/" + this.granularity_ + " " + this.data.totalEventCount);
  if(this.children_) {
    for(b = 0;b < this.children_.length;b++) {
      this.children_[b].dump(a + 1)
    }
  }
};
wtf.analysis.db.SummaryIndexNode_.prototype.walkShallowRange = function(a, b, c, d) {
  if(!(a > this.timeEnd_ || b < this.timeStart_)) {
    if(a < this.timeStart_ && (a = this.timeStart_), b > this.timeEnd_ && (b = this.timeEnd_), !this.children_ || a == this.timeStart_ && b == this.timeEnd_) {
      c.call(d, this)
    }else {
      var e = 10 * ((a - this.timeStart_) / this.granularity_) | 0, f = 10 * ((b - this.timeStart_) / this.granularity_) | 0;
      for(f >= this.children_.length && (f = this.children_.length - 1);e <= f;e++) {
        this.children_[e].walkShallowRange(a, b, c, d)
      }
    }
  }
};
// Input 70
wtf.analysis.Frame = function(a) {
  this.number_ = a;
  this.endEvent_ = this.startEvent_ = null
};
wtf.analysis.Frame.prototype.getNumber = function() {
  return this.number_
};
wtf.analysis.Frame.prototype.getStartEvent = function() {
  return this.startEvent_
};
wtf.analysis.Frame.prototype.setStartEvent = function(a) {
  this.startEvent_ = a
};
wtf.analysis.Frame.prototype.getEndEvent = function() {
  return this.endEvent_
};
wtf.analysis.Frame.prototype.setEndEvent = function(a) {
  this.endEvent_ = a
};
wtf.analysis.Frame.prototype.getStartTime = function() {
  return this.startEvent_ ? this.startEvent_.time : 0
};
wtf.analysis.Frame.prototype.getEndTime = function() {
  return this.endEvent_ ? this.endEvent_.time : 0
};
wtf.analysis.Frame.prototype.getDuration = function() {
  return this.startEvent_ && this.endEvent_ ? this.endEvent_.time - this.startEvent_.time : 0
};
goog.exportSymbol("wtf.analysis.Frame", wtf.analysis.Frame);
goog.exportProperty(wtf.analysis.Frame.prototype, "getNumber", wtf.analysis.Frame.prototype.getNumber);
goog.exportProperty(wtf.analysis.Frame.prototype, "getStartEvent", wtf.analysis.Frame.prototype.getStartEvent);
goog.exportProperty(wtf.analysis.Frame.prototype, "getEndEvent", wtf.analysis.Frame.prototype.getEndEvent);
goog.exportProperty(wtf.analysis.Frame.prototype, "getDuration", wtf.analysis.Frame.prototype.getDuration);
// Input 71
wtf.analysis.db.FrameIndex = function(a, b) {
  wtf.analysis.db.EventList.call(this);
  this.traceListener_ = a;
  this.zone_ = b;
  this.frames_ = [];
  this.frameEventType_ = a.defineEventType(new wtf.analysis.EventType("wtf.timing#frame", wtf.data.EventClass.INSTANCE, 0, []));
  this.eventTypes_ = {frameStart:null, frameEnd:null}
};
goog.inherits(wtf.analysis.db.FrameIndex, wtf.analysis.db.EventList);
wtf.analysis.db.FrameIndex.prototype.getZone = function() {
  return this.zone_
};
wtf.analysis.db.FrameIndex.prototype.insertEvent = function(a) {
  this.eventTypes_.frameStart || (this.eventTypes_.frameStart = this.traceListener_.getEventType("wtf.timing#frameStart"), this.eventTypes_.frameEnd = this.traceListener_.getEventType("wtf.timing#frameEnd"));
  var b = a.args.number, c = this.frames_[b];
  c || (c = this.frames_[b] = new wtf.analysis.Frame(b));
  a.eventType == this.eventTypes_.frameStart ? (c.setStartEvent(a), a = new wtf.analysis.FrameEvent(this.frameEventType_, a.zone, a.time, a.args, c), wtf.analysis.db.EventList.prototype.insertEvent.call(this, a)) : c.setEndEvent(a)
};
wtf.analysis.db.FrameIndex.prototype.getFrame = function(a) {
  return this.frames_[a] || null
};
wtf.analysis.db.FrameIndex.prototype.getPreviousFrame = function(a) {
  return this.frames_[a.getNumber() - 1] || null
};
wtf.analysis.db.FrameIndex.prototype.getNextFrame = function(a) {
  return this.frames_[a.getNumber() + 1] || null
};
wtf.analysis.db.FrameIndex.prototype.getFrameAtTime = function(a) {
  var b = this.search(a, function(b) {
    b = b.value;
    return b.getStartTime() <= a && a <= b.getEndTime()
  });
  return b ? b.value : null
};
wtf.analysis.db.FrameIndex.prototype.getIntraFrameAtTime = function(a) {
  if(!this.getCount()) {
    return null
  }
  a = this.search(a, function() {
    return!0
  });
  if(!a) {
    for(a = -1;!this.frames_[++a];) {
    }
    return[null, this.frames_[a]]
  }
  var b = a.value.getNumber();
  return[a.value, this.frames_[b + 1] || null]
};
wtf.analysis.db.FrameIndex.prototype.forEachIntersecting = function(a, b, c, d) {
  var e = this.search(a, function() {
    return!0
  });
  this.forEach(e ? e.time : a, b, function(a) {
    a = a.value;
    var b = a.getStartEvent(), e = a.getEndEvent();
    b && e && c.call(d, a)
  })
};
goog.exportProperty(wtf.analysis.db.FrameIndex.prototype, "getZone", wtf.analysis.db.FrameIndex.prototype.getZone);
goog.exportProperty(wtf.analysis.db.FrameIndex.prototype, "getFrame", wtf.analysis.db.FrameIndex.prototype.getFrame);
goog.exportProperty(wtf.analysis.db.FrameIndex.prototype, "getPreviousFrame", wtf.analysis.db.FrameIndex.prototype.getPreviousFrame);
goog.exportProperty(wtf.analysis.db.FrameIndex.prototype, "getNextFrame", wtf.analysis.db.FrameIndex.prototype.getNextFrame);
goog.exportProperty(wtf.analysis.db.FrameIndex.prototype, "getFrameAtTime", wtf.analysis.db.FrameIndex.prototype.getFrameAtTime);
goog.exportProperty(wtf.analysis.db.FrameIndex.prototype, "getIntraFrameAtTime", wtf.analysis.db.FrameIndex.prototype.getIntraFrameAtTime);
goog.exportProperty(wtf.analysis.db.FrameIndex.prototype, "forEachIntersecting", wtf.analysis.db.FrameIndex.prototype.forEachIntersecting);
// Input 72
wtf.analysis.db.TimeRangeIndex = function(a, b) {
  wtf.analysis.db.EventList.call(this);
  this.traceListener_ = a;
  this.zone_ = b;
  this.maximumLevel_ = 0
};
goog.inherits(wtf.analysis.db.TimeRangeIndex, wtf.analysis.db.EventList);
wtf.analysis.db.TimeRangeIndex.prototype.getZone = function() {
  return this.zone_
};
wtf.analysis.db.TimeRangeIndex.prototype.getMaximumLevel = function() {
  return this.maximumLevel_
};
wtf.analysis.db.TimeRangeIndex.prototype.computeLevels_ = function() {
  var a = this.traceListener_.getEventType("wtf.timeRange#begin"), b = [], c = 0;
  this.forEach(Number.MIN_VALUE, Number.MAX_VALUE, function(d) {
    var e = d.value;
    if(d.eventType == a) {
      for(d = 0;b[d];d++) {
      }
      b[d] = e;
      e.setLevel(d, c++)
    }else {
      d = e.getLevel(), b[d] == e && (b[d] = null, c--)
    }
  });
  this.maximumLevel_ = b.length
};
wtf.analysis.db.TimeRangeIndex.prototype.invalidate = function() {
  wtf.analysis.db.TimeRangeIndex.superClass_.invalidate.call(this);
  this.computeLevels_()
};
wtf.analysis.db.TimeRangeIndex.prototype.forEachIntersecting = function(a, b, c, d) {
  var e = this.search(a, function(a) {
    return a == a.value.getBeginEvent() && !a.value.getOverlap() ? !0 : !1
  });
  this.forEach(e ? e.time : a, b, function(a) {
    var b = a.value, e = b.getBeginEvent(), i = b.getEndEvent();
    e && (i && a != i) && c.call(d, b)
  })
};
goog.exportProperty(wtf.analysis.db.TimeRangeIndex.prototype, "getZone", wtf.analysis.db.TimeRangeIndex.prototype.getZone);
goog.exportProperty(wtf.analysis.db.TimeRangeIndex.prototype, "getMaximumLevel", wtf.analysis.db.TimeRangeIndex.prototype.getMaximumLevel);
goog.exportProperty(wtf.analysis.db.TimeRangeIndex.prototype, "forEachIntersecting", wtf.analysis.db.TimeRangeIndex.prototype.forEachIntersecting);
// Input 73
wtf.analysis.db.ZoneIndex = function(a, b) {
  wtf.analysis.db.EventList.call(this);
  this.traceListener_ = a;
  this.zone_ = b;
  this.timeRangeIndex_ = new wtf.analysis.db.TimeRangeIndex(this.traceListener_, this.zone_);
  this.registerDisposable(this.timeRangeIndex_);
  this.frameIndex_ = new wtf.analysis.db.FrameIndex(this.traceListener_, this.zone_);
  this.registerDisposable(this.frameIndex_);
  this.maxScopeDepth_ = this.rootUserTime_ = this.rootTotalTime_ = 0;
  this.eventTypes_ = {scopeLeave:null, frameStart:null, frameEnd:null};
  this.currentScope_ = null;
  this.lastAddEventTime_ = 0;
  this.pendingOutOfOrderEvents_ = [];
  this.pendingSystemScopes_ = []
};
goog.inherits(wtf.analysis.db.ZoneIndex, wtf.analysis.db.EventList);
wtf.analysis.db.ZoneIndex.prototype.getZone = function() {
  return this.zone_
};
wtf.analysis.db.ZoneIndex.prototype.getTimeRangeIndex = function() {
  return this.timeRangeIndex_
};
wtf.analysis.db.ZoneIndex.prototype.getFrameIndex = function() {
  return this.frameIndex_
};
wtf.analysis.db.ZoneIndex.prototype.getRootTotalTime = function() {
  return this.rootTotalTime_
};
wtf.analysis.db.ZoneIndex.prototype.getRootUserTime = function() {
  return this.rootUserTime_
};
wtf.analysis.db.ZoneIndex.prototype.getMaximumScopeDepth = function() {
  return this.maxScopeDepth_
};
wtf.analysis.db.ZoneIndex.prototype.beginInserting = function() {
  wtf.analysis.db.EventList.prototype.beginInserting.call(this);
  this.currentScope_ = null;
  this.lastAddEventTime_ = this.getLastEventTime();
  this.timeRangeIndex_.beginInserting();
  this.frameIndex_.beginInserting()
};
wtf.analysis.db.ZoneIndex.prototype.insertEvent = function(a) {
  if(a.zone == this.zone_) {
    if(this.eventTypes_.scopeLeave || (this.eventTypes_.scopeLeave = this.traceListener_.getEventType("wtf.scope#leave"), this.eventTypes_.frameStart = this.traceListener_.getEventType("wtf.timing#frameStart"), this.eventTypes_.frameEnd = this.traceListener_.getEventType("wtf.timing#frameEnd")), a instanceof wtf.analysis.TimeRangeEvent) {
      this.timeRangeIndex_.insertEvent(a)
    }else {
      var b = a.eventType;
      b == this.eventTypes_.frameStart || b == this.eventTypes_.frameEnd ? this.frameIndex_.insertEvent(a) : (a.time < this.lastAddEventTime_ ? this.pendingOutOfOrderEvents_.push(a) : (this.lastAddEventTime_ = a.time, b.eventClass == wtf.data.EventClass.SCOPE ? (this.currentScope_ && (this.currentScope_.addChild(a.scope), a.scope.getDepth() > this.maxScopeDepth_ && (this.maxScopeDepth_ = a.scope.getDepth())), this.currentScope_ = a.scope, b.flags & wtf.data.EventFlag.SYSTEM_TIME && this.pendingSystemScopes_.push(a.scope)) : 
      b == this.eventTypes_.scopeLeave ? (b = this.currentScope_, a.setScope(b), b && (b.setLeaveEvent(a), this.currentScope_ = b.getParent())) : b.flags & wtf.data.EventFlag.APPEND_SCOPE_DATA ? this.currentScope_ && this.currentScope_.addDataEvent(a) : this.currentScope_ && a.setScope(this.currentScope_)), wtf.analysis.db.EventList.prototype.insertEvent.call(this, a))
    }
  }
};
wtf.analysis.db.ZoneIndex.prototype.endInserting = function() {
  this.currentScope_ = null;
  this.eventTypes_.scopeLeave || (this.eventTypes_.scopeLeave = this.traceListener_.getEventType("wtf.scope#leave"));
  for(var a = null, b = 0;b < this.pendingOutOfOrderEvents_.length;b++) {
    var c = this.pendingOutOfOrderEvents_[b], d = c.eventType;
    if(d.eventClass == wtf.data.EventClass.SCOPE) {
      if(a = this.findEnclosingScope(c.time)) {
        a.addChild(c.scope), c.scope.getDepth() > this.maxScopeDepth_ && (this.maxScopeDepth_ = c.scope.getDepth())
      }
      a = c.scope;
      d.flags & wtf.data.EventFlag.SYSTEM_TIME && this.pendingSystemScopes_.push(c.scope)
    }else {
      d == this.eventTypes_.scopeLeave ? (c.setScope(a), a && (a.setLeaveEvent(c), a = null)) : d.flags & wtf.data.EventFlag.APPEND_SCOPE_DATA ? a && a.addDataEvent(c) : c.setScope(a)
    }
  }
  for(b = this.pendingOutOfOrderEvents_.length = 0;b < this.pendingSystemScopes_.length;b++) {
    this.pendingSystemScopes_[b].adjustSystemTime()
  }
  this.pendingSystemScopes_.length = 0;
  wtf.analysis.db.EventList.prototype.endInserting.call(this);
  this.rootUserTime_ = this.rootTotalTime_ = 0;
  this.forEach(Number.MIN_VALUE, Number.MAX_VALUE, function(a) {
    a instanceof wtf.analysis.ScopeEvent && (a = a.scope, a.computeTimes(), a.getDepth() || (this.rootTotalTime_ += a.getTotalDuration(), this.rootUserTime_ += a.getUserDuration()))
  }, this);
  this.timeRangeIndex_.endInserting();
  this.frameIndex_.endInserting()
};
goog.exportProperty(wtf.analysis.db.ZoneIndex.prototype, "getZone", wtf.analysis.db.ZoneIndex.prototype.getZone);
goog.exportProperty(wtf.analysis.db.ZoneIndex.prototype, "getTimeRangeIndex", wtf.analysis.db.ZoneIndex.prototype.getTimeRangeIndex);
goog.exportProperty(wtf.analysis.db.ZoneIndex.prototype, "getFrameIndex", wtf.analysis.db.ZoneIndex.prototype.getFrameIndex);
goog.exportProperty(wtf.analysis.db.ZoneIndex.prototype, "getRootTotalTime", wtf.analysis.db.ZoneIndex.prototype.getRootTotalTime);
goog.exportProperty(wtf.analysis.db.ZoneIndex.prototype, "getRootUserTime", wtf.analysis.db.ZoneIndex.prototype.getRootUserTime);
// Input 74
wtf.analysis.db.EventDatabase = function() {
  wtf.events.EventEmitter.call(this);
  this.sources_ = [];
  this.totalEventCount_ = 0;
  this.summaryIndex_ = new wtf.analysis.db.SummaryIndex;
  this.registerDisposable(this.summaryIndex_);
  this.zoneIndices_ = [];
  this.eventIndices_ = [];
  this.listener_ = new wtf.analysis.db.EventDatabase.Listener_(this)
};
goog.inherits(wtf.analysis.db.EventDatabase, wtf.events.EventEmitter);
wtf.analysis.db.EventDatabase.prototype.disposeInternal = function() {
  goog.disposeAll(this.eventIndices_);
  goog.disposeAll(this.zoneIndices_);
  wtf.analysis.db.EventDatabase.superClass_.disposeInternal.call(this)
};
wtf.analysis.db.EventDatabase.EventType = {SOURCES_CHANGED:goog.events.getUniqueId("sources_changed"), SOURCE_ERROR:goog.events.getUniqueId("source_error"), ZONES_ADDED:goog.events.getUniqueId("zones_added")};
wtf.analysis.db.EventDatabase.prototype.getSources = function() {
  return this.sources_
};
wtf.analysis.db.EventDatabase.prototype.getTotalEventCount = function() {
  return this.totalEventCount_
};
wtf.analysis.db.EventDatabase.prototype.getTimebase = function() {
  return this.listener_.getCommonTimebase()
};
wtf.analysis.db.EventDatabase.prototype.getFirstEventTime = function() {
  return this.summaryIndex_.getFirstEventTime()
};
wtf.analysis.db.EventDatabase.prototype.getLastEventTime = function() {
  return this.summaryIndex_.getLastEventTime()
};
wtf.analysis.db.EventDatabase.prototype.getSummaryIndex = function() {
  return this.summaryIndex_
};
wtf.analysis.db.EventDatabase.prototype.getZoneIndices = function() {
  return this.zoneIndices_
};
wtf.analysis.db.EventDatabase.prototype.getFirstFrameIndex = function() {
  for(var a = 0;a < this.zoneIndices_.length;a++) {
    var b = this.zoneIndices_[a].getFrameIndex();
    if(b.getCount()) {
      return b
    }
  }
  return null
};
wtf.analysis.db.EventDatabase.prototype.createEventIndex = function(a) {
  var b = this.getEventIndex(a);
  if(b) {
    return goog.async.Deferred.succeed(b)
  }
  b = new wtf.analysis.db.EventIndex(a);
  this.eventIndices_.push(b);
  return goog.async.Deferred.succeed(b)
};
wtf.analysis.db.EventDatabase.prototype.getEventIndex = function(a) {
  for(var b = 0;b < this.eventIndices_.length;b++) {
    var c = this.eventIndices_[b];
    if(c.getEventName() == a) {
      return c
    }
  }
  return null
};
wtf.analysis.db.EventDatabase.prototype.getTraceListener = function() {
  return this.listener_
};
wtf.analysis.db.EventDatabase.prototype.invalidate_ = function() {
  this.emitEvent(wtf.events.EventType.INVALIDATED)
};
wtf.analysis.db.EventDatabase.Listener_ = function(a) {
  wtf.analysis.TraceListener.call(this);
  this.db_ = a;
  this.eventTargets_ = [];
  this.insertingEvents_ = !1;
  this.dirtyTimeEnd_ = this.dirtyTimeStart_ = this.beginningZoneCount_ = this.insertedEventCount_ = 0;
  this.eventTypes_ = {zoneCreate:null, scopeLeave:null}
};
goog.inherits(wtf.analysis.db.EventDatabase.Listener_, wtf.analysis.TraceListener);
wtf.analysis.db.EventDatabase.Listener_.prototype.sourceAdded = function(a, b) {
  this.db_.sources_.push(b);
  this.db_.emitEvent(wtf.analysis.db.EventDatabase.EventType.SOURCES_CHANGED);
  this.db_.invalidate_()
};
wtf.analysis.db.EventDatabase.Listener_.prototype.sourceError = function(a, b) {
  this.db_.emitEvent(wtf.analysis.db.EventDatabase.EventType.SOURCE_ERROR, a, b)
};
wtf.analysis.db.EventDatabase.Listener_.prototype.beginEventBatch = function() {
  goog.asserts.assert(!this.insertingEvents_);
  this.insertingEvents_ = !0;
  this.beginningZoneCount_ = this.db_.zoneIndices_.length;
  this.dirtyTimeStart_ = Number.MAX_VALUE;
  this.dirtyTimeEnd_ = Number.MIN_VALUE;
  var a = this.db_;
  this.eventTargets_.length = 0;
  this.eventTargets_.push(a.summaryIndex_);
  this.eventTargets_.push.apply(this.eventTargets_, a.zoneIndices_);
  this.eventTargets_.push.apply(this.eventTargets_, a.eventIndices_);
  for(a = 0;a < this.eventTargets_.length;a++) {
    this.eventTargets_[a].beginInserting()
  }
};
wtf.analysis.db.EventDatabase.Listener_.prototype.endEventBatch = function() {
  goog.asserts.assert(this.insertingEvents_);
  this.insertingEvents_ = !1;
  for(var a = this.eventTargets_.length - 1;0 <= a;a--) {
    this.eventTargets_[a].endInserting()
  }
  this.beginningZoneCount_ != this.db_.zoneIndices_.length && (a = this.db_.zoneIndices_.slice(this.beginningZoneCount_), this.db_.emitEvent(wtf.analysis.db.EventDatabase.EventType.ZONES_ADDED, a));
  this.insertedEventCount_ && (this.insertedEventCount_ = 0, this.db_.invalidate_());
  this.eventTargets_.length = 0
};
wtf.analysis.db.EventDatabase.Listener_.prototype.traceEvent = function(a) {
  a.time < this.dirtyTimeStart_ && (this.dirtyTimeStart_ = a.time);
  a.time > this.dirtyTimeEnd_ && (this.dirtyTimeEnd_ = a.time);
  this.insertedEventCount_++;
  this.eventTypes_.scopeLeave || (this.eventTypes_.scopeLeave = this.getEventType("wtf.scope#leave"));
  this.eventTypes_.zoneCreate || (this.eventTypes_.zoneCreate = this.getEventType("wtf.zone#create"));
  a.eventType.flags & wtf.data.EventFlag.INTERNAL || a.eventType == this.eventTypes_.scopeLeave || this.db_.totalEventCount_++;
  if(a.eventType == this.eventTypes_.zoneCreate) {
    var b = new wtf.analysis.db.ZoneIndex(this, a.value);
    this.db_.zoneIndices_.push(b);
    this.eventTargets_.push(b);
    b.beginInserting()
  }
  for(b = 0;b < this.eventTargets_.length;b++) {
    this.eventTargets_[b].insertEvent(a)
  }
};
goog.exportSymbol("wtf.analysis.db.EventDatabase", wtf.analysis.db.EventDatabase);
goog.exportProperty(wtf.analysis.db.EventDatabase.prototype, "getSources", wtf.analysis.db.EventDatabase.prototype.getSources);
goog.exportProperty(wtf.analysis.db.EventDatabase.prototype, "getTotalEventCount", wtf.analysis.db.EventDatabase.prototype.getTotalEventCount);
goog.exportProperty(wtf.analysis.db.EventDatabase.prototype, "getTimebase", wtf.analysis.db.EventDatabase.prototype.getTimebase);
goog.exportProperty(wtf.analysis.db.EventDatabase.prototype, "getFirstEventTime", wtf.analysis.db.EventDatabase.prototype.getFirstEventTime);
goog.exportProperty(wtf.analysis.db.EventDatabase.prototype, "getLastEventTime", wtf.analysis.db.EventDatabase.prototype.getLastEventTime);
goog.exportProperty(wtf.analysis.db.EventDatabase.prototype, "getSummaryIndex", wtf.analysis.db.EventDatabase.prototype.getSummaryIndex);
goog.exportProperty(wtf.analysis.db.EventDatabase.prototype, "getZoneIndices", wtf.analysis.db.EventDatabase.prototype.getZoneIndices);
goog.exportProperty(wtf.analysis.db.EventDatabase.prototype, "createEventIndex", wtf.analysis.db.EventDatabase.prototype.createEventIndex);
goog.exportProperty(wtf.analysis.db.EventDatabase.prototype, "getEventIndex", wtf.analysis.db.EventDatabase.prototype.getEventIndex);
goog.exportProperty(wtf.analysis.db.EventDatabase.prototype, "getTraceListener", wtf.analysis.db.EventDatabase.prototype.getTraceListener);
// Input 75
goog.dom = {};
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isDocumentMode(9) || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), CAN_USE_PARENT_ELEMENT_PROPERTY:goog.userAgent.IE || goog.userAgent.OPERA || goog.userAgent.WEBKIT, INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
// Input 76
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", ARTICLE:"ARTICLE", ASIDE:"ASIDE", AUDIO:"AUDIO", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDI:"BDI", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", COMMAND:"COMMAND", DATA:"DATA", DATALIST:"DATALIST", DD:"DD", DEL:"DEL", DETAILS:"DETAILS", DFN:"DFN", 
DIALOG:"DIALOG", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", EMBED:"EMBED", FIELDSET:"FIELDSET", FIGCAPTION:"FIGCAPTION", FIGURE:"FIGURE", FONT:"FONT", FOOTER:"FOOTER", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HEADER:"HEADER", HGROUP:"HGROUP", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", KEYGEN:"KEYGEN", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", 
MAP:"MAP", MARK:"MARK", MATH:"MATH", MENU:"MENU", META:"META", METER:"METER", NAV:"NAV", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", OUTPUT:"OUTPUT", P:"P", PARAM:"PARAM", PRE:"PRE", PROGRESS:"PROGRESS", Q:"Q", RP:"RP", RT:"RT", RUBY:"RUBY", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SECTION:"SECTION", SELECT:"SELECT", SMALL:"SMALL", SOURCE:"SOURCE", SPAN:"SPAN", STRIKE:"STRIKE", STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUMMARY:"SUMMARY", 
SUP:"SUP", SVG:"SVG", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TIME:"TIME", TITLE:"TITLE", TR:"TR", TRACK:"TRACK", TT:"TT", U:"U", UL:"UL", VAR:"VAR", VIDEO:"VIDEO", WBR:"WBR"};
// Input 77
goog.dom.classes = {};
goog.dom.classes.set = function(a, b) {
  a.className = b
};
goog.dom.classes.get = function(a) {
  a = a.className;
  return goog.isString(a) && a.match(/\S+/g) || []
};
goog.dom.classes.add = function(a, b) {
  var c = goog.dom.classes.get(a), d = goog.array.slice(arguments, 1), e = c.length + d.length;
  goog.dom.classes.add_(c, d);
  a.className = c.join(" ");
  return c.length == e
};
goog.dom.classes.remove = function(a, b) {
  var c = goog.dom.classes.get(a), d = goog.array.slice(arguments, 1), e = goog.dom.classes.getDifference_(c, d);
  a.className = e.join(" ");
  return e.length == c.length - d.length
};
goog.dom.classes.add_ = function(a, b) {
  for(var c = 0;c < b.length;c++) {
    goog.array.contains(a, b[c]) || a.push(b[c])
  }
};
goog.dom.classes.getDifference_ = function(a, b) {
  return goog.array.filter(a, function(a) {
    return!goog.array.contains(b, a)
  })
};
goog.dom.classes.swap = function(a, b, c) {
  for(var d = goog.dom.classes.get(a), e = !1, f = 0;f < d.length;f++) {
    d[f] == b && (goog.array.splice(d, f--, 1), e = !0)
  }
  e && (d.push(c), a.className = d.join(" "));
  return e
};
goog.dom.classes.addRemove = function(a, b, c) {
  var d = goog.dom.classes.get(a);
  goog.isString(b) ? goog.array.remove(d, b) : goog.isArray(b) && (d = goog.dom.classes.getDifference_(d, b));
  goog.isString(c) && !goog.array.contains(d, c) ? d.push(c) : goog.isArray(c) && goog.dom.classes.add_(d, c);
  a.className = d.join(" ")
};
goog.dom.classes.has = function(a, b) {
  return goog.array.contains(goog.dom.classes.get(a), b)
};
goog.dom.classes.enable = function(a, b, c) {
  c ? goog.dom.classes.add(a, b) : goog.dom.classes.remove(a, b)
};
goog.dom.classes.toggle = function(a, b) {
  var c = !goog.dom.classes.has(a, b);
  goog.dom.classes.enable(a, b, c);
  return c
};
// Input 78
goog.math.randomInt = function(a) {
  return Math.floor(Math.random() * a)
};
goog.math.uniformRandom = function(a, b) {
  return a + Math.random() * (b - a)
};
goog.math.clamp = function(a, b, c) {
  return Math.min(Math.max(a, b), c)
};
goog.math.modulo = function(a, b) {
  var c = a % b;
  return 0 > c * b ? c + b : c
};
goog.math.lerp = function(a, b, c) {
  return a + c * (b - a)
};
goog.math.nearlyEquals = function(a, b, c) {
  return Math.abs(a - b) <= (c || 1E-6)
};
goog.math.standardAngle = function(a) {
  return goog.math.modulo(a, 360)
};
goog.math.toRadians = function(a) {
  return a * Math.PI / 180
};
goog.math.toDegrees = function(a) {
  return 180 * a / Math.PI
};
goog.math.angleDx = function(a, b) {
  return b * Math.cos(goog.math.toRadians(a))
};
goog.math.angleDy = function(a, b) {
  return b * Math.sin(goog.math.toRadians(a))
};
goog.math.angle = function(a, b, c, d) {
  return goog.math.standardAngle(goog.math.toDegrees(Math.atan2(d - b, c - a)))
};
goog.math.angleDifference = function(a, b) {
  var c = goog.math.standardAngle(b) - goog.math.standardAngle(a);
  180 < c ? c -= 360 : -180 >= c && (c = 360 + c);
  return c
};
goog.math.sign = function(a) {
  return 0 == a ? 0 : 0 > a ? -1 : 1
};
goog.math.longestCommonSubsequence = function(a, b, c, d) {
  c = c || function(a, b) {
    return a == b
  };
  d = d || function(b) {
    return a[b]
  };
  for(var e = a.length, f = b.length, g = [], h = 0;h < e + 1;h++) {
    g[h] = [], g[h][0] = 0
  }
  for(var i = 0;i < f + 1;i++) {
    g[0][i] = 0
  }
  for(h = 1;h <= e;h++) {
    for(i = 1;i <= e;i++) {
      g[h][i] = c(a[h - 1], b[i - 1]) ? g[h - 1][i - 1] + 1 : Math.max(g[h - 1][i], g[h][i - 1])
    }
  }
  for(var j = [], h = e, i = f;0 < h && 0 < i;) {
    c(a[h - 1], b[i - 1]) ? (j.unshift(d(h - 1, i - 1)), h--, i--) : g[h - 1][i] > g[h][i - 1] ? h-- : i--
  }
  return j
};
goog.math.sum = function(a) {
  return goog.array.reduce(arguments, function(a, c) {
    return a + c
  }, 0)
};
goog.math.average = function(a) {
  return goog.math.sum.apply(null, arguments) / arguments.length
};
goog.math.standardDeviation = function(a) {
  var b = arguments.length;
  if(2 > b) {
    return 0
  }
  var c = goog.math.average.apply(null, arguments), b = goog.math.sum.apply(null, goog.array.map(arguments, function(a) {
    return Math.pow(a - c, 2)
  })) / (b - 1);
  return Math.sqrt(b)
};
goog.math.isInt = function(a) {
  return isFinite(a) && 0 == a % 1
};
goog.math.isFiniteNumber = function(a) {
  return isFinite(a) && !isNaN(a)
};
// Input 79
goog.math.Coordinate = function(a, b) {
  this.x = goog.isDef(a) ? a : 0;
  this.y = goog.isDef(b) ? b : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
goog.DEBUG && (goog.math.Coordinate.prototype.toString = function() {
  return"(" + this.x + ", " + this.y + ")"
});
goog.math.Coordinate.equals = function(a, b) {
  return a == b ? !0 : !a || !b ? !1 : a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var c = a.x - b.x, d = a.y - b.y;
  return Math.sqrt(c * c + d * d)
};
goog.math.Coordinate.magnitude = function(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y)
};
goog.math.Coordinate.azimuth = function(a) {
  return goog.math.angle(0, 0, a.x, a.y)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var c = a.x - b.x, d = a.y - b.y;
  return c * c + d * d
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
// Input 80
goog.math.Size = function(a, b) {
  this.width = a;
  this.height = b
};
goog.math.Size.equals = function(a, b) {
  return a == b ? !0 : !a || !b ? !1 : a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
goog.DEBUG && (goog.math.Size.prototype.toString = function() {
  return"(" + this.width + " x " + this.height + ")"
});
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return 2 * (this.width + this.height)
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(a) {
  return this.width <= a.width && this.height <= a.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(a) {
  this.width *= a;
  this.height *= a;
  return this
};
goog.math.Size.prototype.scaleToFit = function(a) {
  a = this.aspectRatio() > a.aspectRatio() ? a.width / this.width : a.height / this.height;
  return this.scale(a)
};
// Input 81
goog.dom.ASSUME_QUIRKS_MODE = !1;
goog.dom.ASSUME_STANDARDS_MODE = !1;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(a) {
  return a ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(a)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(a) {
  return goog.isString(a) ? document.getElementById(a) : a
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(a, b, c) {
  return goog.dom.getElementsByTagNameAndClass_(document, a, b, c)
};
goog.dom.getElementsByClass = function(a, b) {
  var c = b || document;
  return goog.dom.canUseQuerySelector_(c) ? c.querySelectorAll("." + a) : c.getElementsByClassName ? c.getElementsByClassName(a) : goog.dom.getElementsByTagNameAndClass_(document, "*", a, b)
};
goog.dom.getElementByClass = function(a, b) {
  var c = b || document, d = null;
  return(d = goog.dom.canUseQuerySelector_(c) ? c.querySelector("." + a) : goog.dom.getElementsByClass(a, b)[0]) || null
};
goog.dom.canUseQuerySelector_ = function(a) {
  return!(!a.querySelectorAll || !a.querySelector)
};
goog.dom.getElementsByTagNameAndClass_ = function(a, b, c, d) {
  a = d || a;
  b = b && "*" != b ? b.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(a) && (b || c)) {
    return a.querySelectorAll(b + (c ? "." + c : ""))
  }
  if(c && a.getElementsByClassName) {
    a = a.getElementsByClassName(c);
    if(b) {
      d = {};
      for(var e = 0, f = 0, g;g = a[f];f++) {
        b == g.nodeName && (d[e++] = g)
      }
      d.length = e;
      return d
    }
    return a
  }
  a = a.getElementsByTagName(b || "*");
  if(c) {
    d = {};
    for(f = e = 0;g = a[f];f++) {
      b = g.className, "function" == typeof b.split && goog.array.contains(b.split(/\s+/), c) && (d[e++] = g)
    }
    d.length = e;
    return d
  }
  return a
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(a, b) {
  goog.object.forEach(b, function(b, d) {
    "style" == d ? a.style.cssText = b : "class" == d ? a.className = b : "for" == d ? a.htmlFor = b : d in goog.dom.DIRECT_ATTRIBUTE_MAP_ ? a.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[d], b) : goog.string.startsWith(d, "aria-") || goog.string.startsWith(d, "data-") ? a.setAttribute(d, b) : a[d] = b
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {cellpadding:"cellPadding", cellspacing:"cellSpacing", colspan:"colSpan", frameborder:"frameBorder", height:"height", maxlength:"maxLength", role:"role", rowspan:"rowSpan", type:"type", usemap:"useMap", valign:"vAlign", width:"width"};
goog.dom.getViewportSize = function(a) {
  return goog.dom.getViewportSize_(a || window)
};
goog.dom.getViewportSize_ = function(a) {
  a = a.document;
  a = goog.dom.isCss1CompatMode_(a) ? a.documentElement : a.body;
  return new goog.math.Size(a.clientWidth, a.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(a) {
  var b = a.document, c = 0;
  if(b) {
    a = goog.dom.getViewportSize_(a).height;
    var c = b.body, d = b.documentElement;
    if(goog.dom.isCss1CompatMode_(b) && d.scrollHeight) {
      c = d.scrollHeight != a ? d.scrollHeight : d.offsetHeight
    }else {
      var b = d.scrollHeight, e = d.offsetHeight;
      d.clientHeight != e && (b = c.scrollHeight, e = c.offsetHeight);
      c = b > a ? b > e ? b : e : b < e ? b : e
    }
  }
  return c
};
goog.dom.getPageScroll = function(a) {
  return goog.dom.getDomHelper((a || goog.global || window).document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(a) {
  var b = goog.dom.getDocumentScrollElement_(a);
  a = goog.dom.getWindow_(a);
  return new goog.math.Coordinate(a.pageXOffset || b.scrollLeft, a.pageYOffset || b.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(a) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(a) ? a.documentElement : a.body
};
goog.dom.getWindow = function(a) {
  return a ? goog.dom.getWindow_(a) : window
};
goog.dom.getWindow_ = function(a) {
  return a.parentWindow || a.defaultView
};
goog.dom.createDom = function(a, b, c) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(a, b) {
  var c = b[0], d = b[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && d && (d.name || d.type)) {
    c = ["<", c];
    d.name && c.push(' name="', goog.string.htmlEscape(d.name), '"');
    if(d.type) {
      c.push(' type="', goog.string.htmlEscape(d.type), '"');
      var e = {};
      goog.object.extend(e, d);
      delete e.type;
      d = e
    }
    c.push(">");
    c = c.join("")
  }
  c = a.createElement(c);
  d && (goog.isString(d) ? c.className = d : goog.isArray(d) ? goog.dom.classes.add.apply(null, [c].concat(d)) : goog.dom.setProperties(c, d));
  2 < b.length && goog.dom.append_(a, c, b, 2);
  return c
};
goog.dom.append_ = function(a, b, c, d) {
  function e(c) {
    c && b.appendChild(goog.isString(c) ? a.createTextNode(c) : c)
  }
  for(;d < c.length;d++) {
    var f = c[d];
    goog.isArrayLike(f) && !goog.dom.isNodeLike(f) ? goog.array.forEach(goog.dom.isNodeList(f) ? goog.array.toArray(f) : f, e) : e(f)
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(a) {
  return document.createElement(a)
};
goog.dom.createTextNode = function(a) {
  return document.createTextNode(a)
};
goog.dom.createTable = function(a, b, c) {
  return goog.dom.createTable_(document, a, b, !!c)
};
goog.dom.createTable_ = function(a, b, c, d) {
  for(var e = ["<tr>"], f = 0;f < c;f++) {
    e.push(d ? "<td>&nbsp;</td>" : "<td></td>")
  }
  e.push("</tr>");
  e = e.join("");
  c = ["<table>"];
  for(f = 0;f < b;f++) {
    c.push(e)
  }
  c.push("</table>");
  a = a.createElement(goog.dom.TagName.DIV);
  a.innerHTML = c.join("");
  return a.removeChild(a.firstChild)
};
goog.dom.htmlToDocumentFragment = function(a) {
  return goog.dom.htmlToDocumentFragment_(document, a)
};
goog.dom.htmlToDocumentFragment_ = function(a, b) {
  var c = a.createElement("div");
  goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT ? (c.innerHTML = "<br>" + b, c.removeChild(c.firstChild)) : c.innerHTML = b;
  if(1 == c.childNodes.length) {
    return c.removeChild(c.firstChild)
  }
  for(var d = a.createDocumentFragment();c.firstChild;) {
    d.appendChild(c.firstChild)
  }
  return d
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(a) {
  return goog.dom.COMPAT_MODE_KNOWN_ ? goog.dom.ASSUME_STANDARDS_MODE : "CSS1Compat" == a.compatMode
};
goog.dom.canHaveChildren = function(a) {
  if(a.nodeType != goog.dom.NodeType.ELEMENT) {
    return!1
  }
  switch(a.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.COMMAND:
    ;
    case goog.dom.TagName.EMBED:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.KEYGEN:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.SOURCE:
    ;
    case goog.dom.TagName.STYLE:
    ;
    case goog.dom.TagName.TRACK:
    ;
    case goog.dom.TagName.WBR:
      return!1
  }
  return!0
};
goog.dom.appendChild = function(a, b) {
  a.appendChild(b)
};
goog.dom.append = function(a, b) {
  goog.dom.append_(goog.dom.getOwnerDocument(a), a, arguments, 1)
};
goog.dom.removeChildren = function(a) {
  for(var b;b = a.firstChild;) {
    a.removeChild(b)
  }
};
goog.dom.insertSiblingBefore = function(a, b) {
  b.parentNode && b.parentNode.insertBefore(a, b)
};
goog.dom.insertSiblingAfter = function(a, b) {
  b.parentNode && b.parentNode.insertBefore(a, b.nextSibling)
};
goog.dom.insertChildAt = function(a, b, c) {
  a.insertBefore(b, a.childNodes[c] || null)
};
goog.dom.removeNode = function(a) {
  return a && a.parentNode ? a.parentNode.removeChild(a) : null
};
goog.dom.replaceNode = function(a, b) {
  var c = b.parentNode;
  c && c.replaceChild(a, b)
};
goog.dom.flattenElement = function(a) {
  var b, c = a.parentNode;
  if(c && c.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(a.removeNode) {
      return a.removeNode(!1)
    }
    for(;b = a.firstChild;) {
      c.insertBefore(b, a)
    }
    return goog.dom.removeNode(a)
  }
};
goog.dom.getChildren = function(a) {
  return goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && void 0 != a.children ? a.children : goog.array.filter(a.childNodes, function(a) {
    return a.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(a) {
  return void 0 != a.firstElementChild ? a.firstElementChild : goog.dom.getNextElementNode_(a.firstChild, !0)
};
goog.dom.getLastElementChild = function(a) {
  return void 0 != a.lastElementChild ? a.lastElementChild : goog.dom.getNextElementNode_(a.lastChild, !1)
};
goog.dom.getNextElementSibling = function(a) {
  return void 0 != a.nextElementSibling ? a.nextElementSibling : goog.dom.getNextElementNode_(a.nextSibling, !0)
};
goog.dom.getPreviousElementSibling = function(a) {
  return void 0 != a.previousElementSibling ? a.previousElementSibling : goog.dom.getNextElementNode_(a.previousSibling, !1)
};
goog.dom.getNextElementNode_ = function(a, b) {
  for(;a && a.nodeType != goog.dom.NodeType.ELEMENT;) {
    a = b ? a.nextSibling : a.previousSibling
  }
  return a
};
goog.dom.getNextNode = function(a) {
  if(!a) {
    return null
  }
  if(a.firstChild) {
    return a.firstChild
  }
  for(;a && !a.nextSibling;) {
    a = a.parentNode
  }
  return a ? a.nextSibling : null
};
goog.dom.getPreviousNode = function(a) {
  if(!a) {
    return null
  }
  if(!a.previousSibling) {
    return a.parentNode
  }
  for(a = a.previousSibling;a && a.lastChild;) {
    a = a.lastChild
  }
  return a
};
goog.dom.isNodeLike = function(a) {
  return goog.isObject(a) && 0 < a.nodeType
};
goog.dom.isElement = function(a) {
  return goog.isObject(a) && a.nodeType == goog.dom.NodeType.ELEMENT
};
goog.dom.isWindow = function(a) {
  return goog.isObject(a) && a.window == a
};
goog.dom.getParentElement = function(a) {
  if(goog.dom.BrowserFeature.CAN_USE_PARENT_ELEMENT_PROPERTY) {
    return a.parentElement
  }
  a = a.parentNode;
  return goog.dom.isElement(a) ? a : null
};
goog.dom.contains = function(a, b) {
  if(a.contains && b.nodeType == goog.dom.NodeType.ELEMENT) {
    return a == b || a.contains(b)
  }
  if("undefined" != typeof a.compareDocumentPosition) {
    return a == b || Boolean(a.compareDocumentPosition(b) & 16)
  }
  for(;b && a != b;) {
    b = b.parentNode
  }
  return b == a
};
goog.dom.compareNodeOrder = function(a, b) {
  if(a == b) {
    return 0
  }
  if(a.compareDocumentPosition) {
    return a.compareDocumentPosition(b) & 2 ? 1 : -1
  }
  if(goog.userAgent.IE && !goog.userAgent.isDocumentMode(9)) {
    if(a.nodeType == goog.dom.NodeType.DOCUMENT) {
      return-1
    }
    if(b.nodeType == goog.dom.NodeType.DOCUMENT) {
      return 1
    }
  }
  if("sourceIndex" in a || a.parentNode && "sourceIndex" in a.parentNode) {
    var c = a.nodeType == goog.dom.NodeType.ELEMENT, d = b.nodeType == goog.dom.NodeType.ELEMENT;
    if(c && d) {
      return a.sourceIndex - b.sourceIndex
    }
    var e = a.parentNode, f = b.parentNode;
    return e == f ? goog.dom.compareSiblingOrder_(a, b) : !c && goog.dom.contains(e, b) ? -1 * goog.dom.compareParentsDescendantNodeIe_(a, b) : !d && goog.dom.contains(f, a) ? goog.dom.compareParentsDescendantNodeIe_(b, a) : (c ? a.sourceIndex : e.sourceIndex) - (d ? b.sourceIndex : f.sourceIndex)
  }
  d = goog.dom.getOwnerDocument(a);
  c = d.createRange();
  c.selectNode(a);
  c.collapse(!0);
  d = d.createRange();
  d.selectNode(b);
  d.collapse(!0);
  return c.compareBoundaryPoints(goog.global.Range.START_TO_END, d)
};
goog.dom.compareParentsDescendantNodeIe_ = function(a, b) {
  var c = a.parentNode;
  if(c == b) {
    return-1
  }
  for(var d = b;d.parentNode != c;) {
    d = d.parentNode
  }
  return goog.dom.compareSiblingOrder_(d, a)
};
goog.dom.compareSiblingOrder_ = function(a, b) {
  for(var c = b;c = c.previousSibling;) {
    if(c == a) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(a) {
  var b, c = arguments.length;
  if(c) {
    if(1 == c) {
      return arguments[0]
    }
  }else {
    return null
  }
  var d = [], e = Infinity;
  for(b = 0;b < c;b++) {
    for(var f = [], g = arguments[b];g;) {
      f.unshift(g), g = g.parentNode
    }
    d.push(f);
    e = Math.min(e, f.length)
  }
  f = null;
  for(b = 0;b < e;b++) {
    for(var g = d[0][b], h = 1;h < c;h++) {
      if(g != d[h][b]) {
        return f
      }
    }
    f = g
  }
  return f
};
goog.dom.getOwnerDocument = function(a) {
  return a.nodeType == goog.dom.NodeType.DOCUMENT ? a : a.ownerDocument || a.document
};
goog.dom.getFrameContentDocument = function(a) {
  return a.contentDocument || a.contentWindow.document
};
goog.dom.getFrameContentWindow = function(a) {
  return a.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(a))
};
goog.dom.setTextContent = function(a, b) {
  if("textContent" in a) {
    a.textContent = b
  }else {
    if(a.firstChild && a.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      for(;a.lastChild != a.firstChild;) {
        a.removeChild(a.lastChild)
      }
      a.firstChild.data = b
    }else {
      goog.dom.removeChildren(a);
      var c = goog.dom.getOwnerDocument(a);
      a.appendChild(c.createTextNode(b))
    }
  }
};
goog.dom.getOuterHtml = function(a) {
  if("outerHTML" in a) {
    return a.outerHTML
  }
  var b = goog.dom.getOwnerDocument(a).createElement("div");
  b.appendChild(a.cloneNode(!0));
  return b.innerHTML
};
goog.dom.findNode = function(a, b) {
  var c = [];
  return goog.dom.findNodes_(a, b, c, !0) ? c[0] : void 0
};
goog.dom.findNodes = function(a, b) {
  var c = [];
  goog.dom.findNodes_(a, b, c, !1);
  return c
};
goog.dom.findNodes_ = function(a, b, c, d) {
  if(null != a) {
    for(a = a.firstChild;a;) {
      if(b(a) && (c.push(a), d) || goog.dom.findNodes_(a, b, c, d)) {
        return!0
      }
      a = a.nextSibling
    }
  }
  return!1
};
goog.dom.TAGS_TO_IGNORE_ = {SCRIPT:1, STYLE:1, HEAD:1, IFRAME:1, OBJECT:1};
goog.dom.PREDEFINED_TAG_VALUES_ = {IMG:" ", BR:"\n"};
goog.dom.isFocusableTabIndex = function(a) {
  var b = a.getAttributeNode("tabindex");
  return b && b.specified ? (a = a.tabIndex, goog.isNumber(a) && 0 <= a && 32768 > a) : !1
};
goog.dom.setFocusableTabIndex = function(a, b) {
  b ? a.tabIndex = 0 : (a.tabIndex = -1, a.removeAttribute("tabIndex"))
};
goog.dom.getTextContent = function(a) {
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in a) {
    a = goog.string.canonicalizeNewlines(a.innerText)
  }else {
    var b = [];
    goog.dom.getTextContent_(a, b, !0);
    a = b.join("")
  }
  a = a.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  a = a.replace(/\u200B/g, "");
  goog.dom.BrowserFeature.CAN_USE_INNER_TEXT || (a = a.replace(/ +/g, " "));
  " " != a && (a = a.replace(/^\s*/, ""));
  return a
};
goog.dom.getRawTextContent = function(a) {
  var b = [];
  goog.dom.getTextContent_(a, b, !1);
  return b.join("")
};
goog.dom.getTextContent_ = function(a, b, c) {
  if(!(a.nodeName in goog.dom.TAGS_TO_IGNORE_)) {
    if(a.nodeType == goog.dom.NodeType.TEXT) {
      c ? b.push(String(a.nodeValue).replace(/(\r\n|\r|\n)/g, "")) : b.push(a.nodeValue)
    }else {
      if(a.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        b.push(goog.dom.PREDEFINED_TAG_VALUES_[a.nodeName])
      }else {
        for(a = a.firstChild;a;) {
          goog.dom.getTextContent_(a, b, c), a = a.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(a) {
  return goog.dom.getTextContent(a).length
};
goog.dom.getNodeTextOffset = function(a, b) {
  for(var c = b || goog.dom.getOwnerDocument(a).body, d = [];a && a != c;) {
    for(var e = a;e = e.previousSibling;) {
      d.unshift(goog.dom.getTextContent(e))
    }
    a = a.parentNode
  }
  return goog.string.trimLeft(d.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(a, b, c) {
  a = [a];
  for(var d = 0, e = null;0 < a.length && d < b;) {
    if(e = a.pop(), !(e.nodeName in goog.dom.TAGS_TO_IGNORE_)) {
      if(e.nodeType == goog.dom.NodeType.TEXT) {
        var f = e.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " "), d = d + f.length
      }else {
        if(e.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          d += goog.dom.PREDEFINED_TAG_VALUES_[e.nodeName].length
        }else {
          for(f = e.childNodes.length - 1;0 <= f;f--) {
            a.push(e.childNodes[f])
          }
        }
      }
    }
  }
  goog.isObject(c) && (c.remainder = e ? e.nodeValue.length + b - d - 1 : 0, c.node = e);
  return e
};
goog.dom.isNodeList = function(a) {
  if(a && "number" == typeof a.length) {
    if(goog.isObject(a)) {
      return"function" == typeof a.item || "string" == typeof a.item
    }
    if(goog.isFunction(a)) {
      return"function" == typeof a.item
    }
  }
  return!1
};
goog.dom.getAncestorByTagNameAndClass = function(a, b, c) {
  if(!b && !c) {
    return null
  }
  var d = b ? b.toUpperCase() : null;
  return goog.dom.getAncestor(a, function(a) {
    return(!d || a.nodeName == d) && (!c || goog.dom.classes.has(a, c))
  }, !0)
};
goog.dom.getAncestorByClass = function(a, b) {
  return goog.dom.getAncestorByTagNameAndClass(a, null, b)
};
goog.dom.getAncestor = function(a, b, c, d) {
  c || (a = a.parentNode);
  c = null == d;
  for(var e = 0;a && (c || e <= d);) {
    if(b(a)) {
      return a
    }
    a = a.parentNode;
    e++
  }
  return null
};
goog.dom.getActiveElement = function(a) {
  try {
    return a && a.activeElement
  }catch(b) {
  }
  return null
};
goog.dom.DomHelper = function(a) {
  this.document_ = a || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(a) {
  this.document_ = a
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(a) {
  return goog.isString(a) ? this.document_.getElementById(a) : a
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(a, b, c) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, a, b, c)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(a, b) {
  return goog.dom.getElementsByClass(a, b || this.document_)
};
goog.dom.DomHelper.prototype.getElementByClass = function(a, b) {
  return goog.dom.getElementByClass(a, b || this.document_)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(a) {
  return goog.dom.getViewportSize(a || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.DomHelper.prototype.createDom = function(a, b, c) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(a) {
  return this.document_.createElement(a)
};
goog.dom.DomHelper.prototype.createTextNode = function(a) {
  return this.document_.createTextNode(a)
};
goog.dom.DomHelper.prototype.createTable = function(a, b, c) {
  return goog.dom.createTable_(this.document_, a, b, !!c)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(a) {
  return goog.dom.htmlToDocumentFragment_(this.document_, a)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.getActiveElement = function(a) {
  return goog.dom.getActiveElement(a || this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.canHaveChildren = goog.dom.canHaveChildren;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.insertChildAt = goog.dom.insertChildAt;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getChildren = goog.dom.getChildren;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.isElement = goog.dom.isElement;
goog.dom.DomHelper.prototype.isWindow = goog.dom.isWindow;
goog.dom.DomHelper.prototype.getParentElement = goog.dom.getParentElement;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.compareNodeOrder = goog.dom.compareNodeOrder;
goog.dom.DomHelper.prototype.findCommonAncestor = goog.dom.findCommonAncestor;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.getOuterHtml = goog.dom.getOuterHtml;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.isFocusableTabIndex = goog.dom.isFocusableTabIndex;
goog.dom.DomHelper.prototype.setFocusableTabIndex = goog.dom.setFocusableTabIndex;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getNodeAtOffset = goog.dom.getNodeAtOffset;
goog.dom.DomHelper.prototype.isNodeList = goog.dom.isNodeList;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestorByClass = goog.dom.getAncestorByClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
// Input 82
goog.fs = {};
goog.fs.Error = function(a, b) {
  goog.debug.Error.call(this, goog.string.subs("Error %s: %s", b, goog.fs.Error.getDebugMessage(a)));
  this.code = a
};
goog.inherits(goog.fs.Error, goog.debug.Error);
goog.fs.Error.ErrorCode = {NOT_FOUND:1, SECURITY:2, ABORT:3, NOT_READABLE:4, ENCODING:5, NO_MODIFICATION_ALLOWED:6, INVALID_STATE:7, SYNTAX:8, INVALID_MODIFICATION:9, QUOTA_EXCEEDED:10, TYPE_MISMATCH:11, PATH_EXISTS:12};
goog.fs.Error.getDebugMessage = function(a) {
  switch(a) {
    case goog.fs.Error.ErrorCode.NOT_FOUND:
      return"File or directory not found";
    case goog.fs.Error.ErrorCode.SECURITY:
      return"Insecure or disallowed operation";
    case goog.fs.Error.ErrorCode.ABORT:
      return"Operation aborted";
    case goog.fs.Error.ErrorCode.NOT_READABLE:
      return"File or directory not readable";
    case goog.fs.Error.ErrorCode.ENCODING:
      return"Invalid encoding";
    case goog.fs.Error.ErrorCode.NO_MODIFICATION_ALLOWED:
      return"Cannot modify file or directory";
    case goog.fs.Error.ErrorCode.INVALID_STATE:
      return"Invalid state";
    case goog.fs.Error.ErrorCode.SYNTAX:
      return"Invalid line-ending specifier";
    case goog.fs.Error.ErrorCode.INVALID_MODIFICATION:
      return"Invalid modification";
    case goog.fs.Error.ErrorCode.QUOTA_EXCEEDED:
      return"Quota exceeded";
    case goog.fs.Error.ErrorCode.TYPE_MISMATCH:
      return"Invalid filetype";
    case goog.fs.Error.ErrorCode.PATH_EXISTS:
      return"File or directory already exists at specified path";
    default:
      return"Unrecognized error"
  }
};
// Input 83
goog.events.EventTarget = function() {
  goog.Disposable.call(this);
  goog.events.Listenable.USE_LISTENABLE_INTERFACE && (this.eventTargetListeners_ = {})
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.EventTarget.prototype.customEvent_ = !0;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_
};
goog.events.EventTarget.prototype.setParentEventTarget = function(a) {
  this.parentEventTarget_ = a
};
goog.events.EventTarget.prototype.addEventListener = function(a, b, c, d) {
  goog.events.listen(this, a, b, c, d)
};
goog.events.EventTarget.prototype.removeEventListener = function(a, b, c, d) {
  goog.events.unlisten(this, a, b, c, d)
};
goog.events.EventTarget.prototype.dispatchEvent = function(a) {
  if(goog.events.Listenable.USE_LISTENABLE_INTERFACE) {
    if(this.isDisposed()) {
      return!0
    }
    var b, c = this.getParentEventTarget();
    if(c) {
      for(b = [];c;c = c.getParentEventTarget()) {
        b.push(c)
      }
    }
    return goog.events.EventTarget.dispatchEventInternal_(this, a, b)
  }
  return goog.events.dispatchEvent(this, a)
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null;
  goog.events.Listenable.USE_LISTENABLE_INTERFACE && (this.eventTargetListeners_ = null)
};
goog.events.Listenable.USE_LISTENABLE_INTERFACE && (goog.events.EventTarget.prototype.listen = function(a, b, c, d) {
  return this.listenInternal_(a, b, !1, c, d)
}, goog.events.EventTarget.prototype.listenOnce = function(a, b, c, d) {
  return this.listenInternal_(a, b, !0, c, d)
}, goog.events.EventTarget.prototype.listenInternal_ = function(a, b, c, d, e) {
  goog.asserts.assert(!this.isDisposed());
  var f = this.eventTargetListeners_[a] || (this.eventTargetListeners_[a] = []), g;
  g = goog.events.EventTarget.findListenerIndex_(f, b, d, e);
  if(-1 < g) {
    return g = f[g], c || (g.callOnce = !1), g
  }
  g = new goog.events.Listener;
  g.init(b, null, this, a, !!d, e);
  g.callOnce = c;
  f.push(g);
  return g
}, goog.events.EventTarget.prototype.unlisten = function(a, b, c, d) {
  goog.asserts.assert(!this.isDisposed());
  if(!(a in this.eventTargetListeners_)) {
    return!1
  }
  a = this.eventTargetListeners_[a];
  b = goog.events.EventTarget.findListenerIndex_(a, b, c, d);
  return-1 < b ? (a[b].removed = !0, goog.array.removeAt(a, b)) : !1
}, goog.events.EventTarget.prototype.unlistenByKey = function(a) {
  goog.asserts.assert(!this.isDisposed());
  var b = a.type;
  return!(b in this.eventTargetListeners_) ? !1 : goog.array.remove(this.eventTargetListeners_[b], a)
}, goog.events.EventTarget.prototype.fireListeners = function(a, b, c) {
  goog.asserts.assert(!this.isDisposed());
  if(!(a in this.eventTargetListeners_)) {
    return!0
  }
  var d = !0;
  a = goog.array.clone(this.eventTargetListeners_[a]);
  for(var e = 0;e < a.length;++e) {
    var f = a[e];
    f && (!f.removed && f.capture == b) && (f.callOnce && this.unlistenByKey(f), d = !1 !== f.handleEvent(c) && d)
  }
  return d && !1 != c.returnValue_
}, goog.events.EventTarget.dispatchEventInternal_ = function(a, b, c) {
  var d = b.type || b;
  if(goog.isString(b)) {
    b = new goog.events.Event(b, a)
  }else {
    if(b instanceof goog.events.Event) {
      b.target = b.target || a
    }else {
      var e = b;
      b = new goog.events.Event(d, a);
      goog.object.extend(b, e)
    }
  }
  var e = !0, f;
  if(c) {
    for(var g = c.length - 1;!b.propagationStopped_ && 0 <= g;g--) {
      f = b.currentTarget = c[g], e = f.fireListeners(d, !0, b) && e
    }
  }
  b.propagationStopped_ || (f = b.currentTarget = a, e = f.fireListeners(d, !0, b) && e, b.propagationStopped_ || (e = f.fireListeners(d, !1, b) && e));
  if(c) {
    for(g = 0;!b.propagationStopped_ && g < c.length;g++) {
      f = b.currentTarget = c[g], e = f.fireListeners(d, !1, b) && e
    }
  }
  return e
}, goog.events.EventTarget.findListenerIndex_ = function(a, b, c, d) {
  for(var e = 0;e < a.length;++e) {
    var f = a[e];
    if(f.listener == b && f.capture == !!c && f.handler == d) {
      return e
    }
  }
  return-1
});
// Input 84
goog.fs.ProgressEvent = function(a, b) {
  goog.events.Event.call(this, a.type, b);
  this.event_ = a
};
goog.inherits(goog.fs.ProgressEvent, goog.events.Event);
goog.fs.ProgressEvent.prototype.isLengthComputable = function() {
  return this.event_.lengthComputable
};
goog.fs.ProgressEvent.prototype.getLoaded = function() {
  return this.event_.loaded
};
goog.fs.ProgressEvent.prototype.getTotal = function() {
  return this.event_.total
};
// Input 85
goog.fs.FileReader = function() {
  goog.events.EventTarget.call(this);
  this.reader_ = new FileReader;
  this.reader_.onloadstart = goog.bind(this.dispatchProgressEvent_, this);
  this.reader_.onprogress = goog.bind(this.dispatchProgressEvent_, this);
  this.reader_.onload = goog.bind(this.dispatchProgressEvent_, this);
  this.reader_.onabort = goog.bind(this.dispatchProgressEvent_, this);
  this.reader_.onerror = goog.bind(this.dispatchProgressEvent_, this);
  this.reader_.onloadend = goog.bind(this.dispatchProgressEvent_, this)
};
goog.inherits(goog.fs.FileReader, goog.events.EventTarget);
goog.fs.FileReader.ReadyState = {INIT:0, LOADING:1, DONE:2};
goog.fs.FileReader.EventType = {LOAD_START:"loadstart", PROGRESS:"progress", LOAD:"load", ABORT:"abort", ERROR:"error", LOAD_END:"loadend"};
goog.fs.FileReader.prototype.abort = function() {
  try {
    this.reader_.abort()
  }catch(a) {
    throw new goog.fs.Error(a.code, "aborting read");
  }
};
goog.fs.FileReader.prototype.getReadyState = function() {
  return this.reader_.readyState
};
goog.fs.FileReader.prototype.getResult = function() {
  return this.reader_.result
};
goog.fs.FileReader.prototype.getError = function() {
  return this.reader_.error && new goog.fs.Error(this.reader_.error.code, "reading file")
};
goog.fs.FileReader.prototype.dispatchProgressEvent_ = function(a) {
  this.dispatchEvent(new goog.fs.ProgressEvent(a, this))
};
goog.fs.FileReader.prototype.disposeInternal = function() {
  goog.fs.FileReader.superClass_.disposeInternal.call(this);
  delete this.reader_
};
goog.fs.FileReader.prototype.readAsBinaryString = function(a) {
  this.reader_.readAsBinaryString(a)
};
goog.fs.FileReader.readAsBinaryString = function(a) {
  var b = new goog.fs.FileReader, c = goog.fs.FileReader.createDeferred_(b);
  b.readAsBinaryString(a);
  return c
};
goog.fs.FileReader.prototype.readAsArrayBuffer = function(a) {
  this.reader_.readAsArrayBuffer(a)
};
goog.fs.FileReader.readAsArrayBuffer = function(a) {
  var b = new goog.fs.FileReader, c = goog.fs.FileReader.createDeferred_(b);
  b.readAsArrayBuffer(a);
  return c
};
goog.fs.FileReader.prototype.readAsText = function(a, b) {
  this.reader_.readAsText(a, b)
};
goog.fs.FileReader.readAsText = function(a, b) {
  var c = new goog.fs.FileReader, d = goog.fs.FileReader.createDeferred_(c);
  c.readAsText(a, b);
  return d
};
goog.fs.FileReader.prototype.readAsDataUrl = function(a) {
  this.reader_.readAsDataURL(a)
};
goog.fs.FileReader.readAsDataUrl = function(a) {
  var b = new goog.fs.FileReader, c = goog.fs.FileReader.createDeferred_(b);
  b.readAsDataUrl(a);
  return c
};
goog.fs.FileReader.createDeferred_ = function(a) {
  var b = new goog.async.Deferred;
  a.addEventListener(goog.fs.FileReader.EventType.LOAD_END, goog.partial(function(a, b) {
    var e = b.getResult(), f = b.getError();
    null != e && !f ? a.callback(e) : a.errback(f);
    b.dispose()
  }, b, a));
  return b
};
// Input 86
goog.fs.FileSaver = function(a) {
  goog.events.EventTarget.call(this);
  this.saver_ = a;
  this.saver_.onwritestart = goog.bind(this.dispatchProgressEvent_, this);
  this.saver_.onprogress = goog.bind(this.dispatchProgressEvent_, this);
  this.saver_.onwrite = goog.bind(this.dispatchProgressEvent_, this);
  this.saver_.onabort = goog.bind(this.dispatchProgressEvent_, this);
  this.saver_.onerror = goog.bind(this.dispatchProgressEvent_, this);
  this.saver_.onwriteend = goog.bind(this.dispatchProgressEvent_, this)
};
goog.inherits(goog.fs.FileSaver, goog.events.EventTarget);
goog.fs.FileSaver.ReadyState = {INIT:0, WRITING:1, DONE:2};
goog.fs.FileSaver.EventType = {WRITE_START:"writestart", PROGRESS:"progress", WRITE:"write", ABORT:"abort", ERROR:"error", WRITE_END:"writeend"};
goog.fs.FileSaver.prototype.abort = function() {
  try {
    this.saver_.abort()
  }catch(a) {
    throw new goog.fs.Error(a.code, "aborting save");
  }
};
goog.fs.FileSaver.prototype.getReadyState = function() {
  return this.saver_.readyState
};
goog.fs.FileSaver.prototype.getError = function() {
  return this.saver_.error && new goog.fs.Error(this.saver_.error.code, "saving file")
};
goog.fs.FileSaver.prototype.dispatchProgressEvent_ = function(a) {
  this.dispatchEvent(new goog.fs.ProgressEvent(a, this))
};
goog.fs.FileSaver.prototype.disposeInternal = function() {
  delete this.saver_;
  goog.fs.FileSaver.superClass_.disposeInternal.call(this)
};
goog.fs.FileSaver.ProgressEvent = goog.fs.ProgressEvent;
// Input 87
goog.fs.FileWriter = function(a) {
  goog.fs.FileSaver.call(this, a);
  this.writer_ = a
};
goog.inherits(goog.fs.FileWriter, goog.fs.FileSaver);
goog.fs.FileWriter.prototype.getPosition = function() {
  return this.writer_.position
};
goog.fs.FileWriter.prototype.getLength = function() {
  return this.writer_.length
};
goog.fs.FileWriter.prototype.write = function(a) {
  try {
    this.writer_.write(a)
  }catch(b) {
    throw new goog.fs.Error(b.code, "writing file");
  }
};
goog.fs.FileWriter.prototype.seek = function(a) {
  try {
    this.writer_.seek(a)
  }catch(b) {
    throw new goog.fs.Error(b.code, "seeking in file");
  }
};
goog.fs.FileWriter.prototype.truncate = function(a) {
  try {
    this.writer_.truncate(a)
  }catch(b) {
    throw new goog.fs.Error(b.code, "truncating file");
  }
};
// Input 88
goog.functions = {};
goog.functions.constant = function(a) {
  return function() {
    return a
  }
};
goog.functions.FALSE = goog.functions.constant(!1);
goog.functions.TRUE = goog.functions.constant(!0);
goog.functions.NULL = goog.functions.constant(null);
goog.functions.identity = function(a) {
  return a
};
goog.functions.error = function(a) {
  return function() {
    throw Error(a);
  }
};
goog.functions.lock = function(a, b) {
  b = b || 0;
  return function() {
    return a.apply(this, Array.prototype.slice.call(arguments, 0, b))
  }
};
goog.functions.withReturnValue = function(a, b) {
  return goog.functions.sequence(a, goog.functions.constant(b))
};
goog.functions.compose = function(a, b) {
  var c = arguments, d = c.length;
  return function() {
    var a;
    d && (a = c[d - 1].apply(this, arguments));
    for(var b = d - 2;0 <= b;b--) {
      a = c[b].call(this, a)
    }
    return a
  }
};
goog.functions.sequence = function(a) {
  var b = arguments, c = b.length;
  return function() {
    for(var a, e = 0;e < c;e++) {
      a = b[e].apply(this, arguments)
    }
    return a
  }
};
goog.functions.and = function(a) {
  var b = arguments, c = b.length;
  return function() {
    for(var a = 0;a < c;a++) {
      if(!b[a].apply(this, arguments)) {
        return!1
      }
    }
    return!0
  }
};
goog.functions.or = function(a) {
  var b = arguments, c = b.length;
  return function() {
    for(var a = 0;a < c;a++) {
      if(b[a].apply(this, arguments)) {
        return!0
      }
    }
    return!1
  }
};
goog.functions.not = function(a) {
  return function() {
    return!a.apply(this, arguments)
  }
};
goog.functions.create = function(a, b) {
  var c = function() {
  };
  c.prototype = a.prototype;
  c = new c;
  a.apply(c, Array.prototype.slice.call(arguments, 1));
  return c
};
// Input 89
goog.fs.Entry = function(a, b) {
  this.fs_ = a;
  this.entry_ = b
};
goog.fs.Entry.prototype.isFile = function() {
  return this.entry_.isFile
};
goog.fs.Entry.prototype.isDirectory = function() {
  return this.entry_.isDirectory
};
goog.fs.Entry.prototype.getName = function() {
  return this.entry_.name
};
goog.fs.Entry.prototype.getFullPath = function() {
  return this.entry_.fullPath
};
goog.fs.Entry.prototype.getFileSystem = function() {
  return this.fs_
};
goog.fs.Entry.prototype.getLastModified = function() {
  return this.getMetadata().addCallback(function(a) {
    return a.modificationTime
  })
};
goog.fs.Entry.prototype.getMetadata = function() {
  var a = new goog.async.Deferred;
  this.entry_.getMetadata(function(b) {
    a.callback(b)
  }, goog.bind(function(b) {
    var c = "retrieving metadata for " + this.getFullPath();
    a.errback(new goog.fs.Error(b.code, c))
  }, this));
  return a
};
goog.fs.Entry.prototype.moveTo = function(a, b) {
  var c = new goog.async.Deferred;
  this.entry_.moveTo(a.dir_, b, goog.bind(function(a) {
    c.callback(this.wrapEntry(a))
  }, this), goog.bind(function(d) {
    var e = "moving " + this.getFullPath() + " into " + a.getFullPath() + (b ? ", renaming to " + b : "");
    c.errback(new goog.fs.Error(d.code, e))
  }, this));
  return c
};
goog.fs.Entry.prototype.copyTo = function(a, b) {
  var c = new goog.async.Deferred;
  this.entry_.copyTo(a.dir_, b, goog.bind(function(a) {
    c.callback(this.wrapEntry(a))
  }, this), goog.bind(function(d) {
    var e = "copying " + this.getFullPath() + " into " + a.getFullPath() + (b ? ", renaming to " + b : "");
    c.errback(new goog.fs.Error(d.code, e))
  }, this));
  return c
};
goog.fs.Entry.prototype.wrapEntry = function(a) {
  return a.isFile ? new goog.fs.FileEntry(this.fs_, a) : new goog.fs.DirectoryEntry(this.fs_, a)
};
goog.fs.Entry.prototype.toUrl = function(a) {
  return this.entry_.toURL(a)
};
goog.fs.Entry.prototype.toUri = goog.fs.Entry.prototype.toUrl;
goog.fs.Entry.prototype.remove = function() {
  var a = new goog.async.Deferred;
  this.entry_.remove(goog.bind(a.callback, a, !0), goog.bind(function(b) {
    var c = "removing " + this.getFullPath();
    a.errback(new goog.fs.Error(b.code, c))
  }, this));
  return a
};
goog.fs.Entry.prototype.getParent = function() {
  var a = new goog.async.Deferred;
  this.entry_.getParent(goog.bind(function(b) {
    a.callback(new goog.fs.DirectoryEntry(this.fs_, b))
  }, this), goog.bind(function(b) {
    var c = "getting parent of " + this.getFullPath();
    a.errback(new goog.fs.Error(b.code, c))
  }, this));
  return a
};
goog.fs.DirectoryEntry = function(a, b) {
  goog.fs.Entry.call(this, a, b);
  this.dir_ = b
};
goog.inherits(goog.fs.DirectoryEntry, goog.fs.Entry);
goog.fs.DirectoryEntry.Behavior = {DEFAULT:1, CREATE:2, CREATE_EXCLUSIVE:3};
goog.fs.DirectoryEntry.prototype.getFile = function(a, b) {
  var c = new goog.async.Deferred;
  this.dir_.getFile(a, this.getOptions_(b), goog.bind(function(a) {
    c.callback(new goog.fs.FileEntry(this.fs_, a))
  }, this), goog.bind(function(b) {
    var e = "loading file " + a + " from " + this.getFullPath();
    c.errback(new goog.fs.Error(b.code, e))
  }, this));
  return c
};
goog.fs.DirectoryEntry.prototype.getDirectory = function(a, b) {
  var c = new goog.async.Deferred;
  this.dir_.getDirectory(a, this.getOptions_(b), goog.bind(function(a) {
    c.callback(new goog.fs.DirectoryEntry(this.fs_, a))
  }, this), goog.bind(function(b) {
    var e = "loading directory " + a + " from " + this.getFullPath();
    c.errback(new goog.fs.Error(b.code, e))
  }, this));
  return c
};
goog.fs.DirectoryEntry.prototype.createPath = function(a) {
  function b(a) {
    if(!d.length) {
      return goog.async.Deferred.succeed(a)
    }
    var c = d.shift();
    return(".." == c ? a.getParent() : "." == c ? goog.async.Deferred.succeed(a) : a.getDirectory(c, goog.fs.DirectoryEntry.Behavior.CREATE)).addCallback(b)
  }
  if(goog.string.startsWith(a, "/")) {
    var c = this.getFileSystem().getRoot();
    if(this.getFullPath() != c.getFullPath()) {
      return c.createPath(a)
    }
  }
  var d = goog.array.filter(a.split("/"), goog.functions.identity);
  return b(this)
};
goog.fs.DirectoryEntry.prototype.listDirectory = function() {
  var a = new goog.async.Deferred, b = this.dir_.createReader(), c = [], d = goog.bind(function(b) {
    var c = "listing directory " + this.getFullPath();
    a.errback(new goog.fs.Error(b.code, c))
  }, this), e = goog.bind(function(f) {
    if(f.length) {
      for(var g = 0, h;h = f[g];g++) {
        c.push(this.wrapEntry(h))
      }
      b.readEntries(e, d)
    }else {
      a.callback(c)
    }
  }, this);
  b.readEntries(e, d);
  return a
};
goog.fs.DirectoryEntry.prototype.removeRecursively = function() {
  var a = new goog.async.Deferred;
  this.dir_.removeRecursively(goog.bind(a.callback, a, !0), goog.bind(function(b) {
    var c = "removing " + this.getFullPath() + " recursively";
    a.errback(new goog.fs.Error(b.code, c))
  }, this));
  return a
};
goog.fs.DirectoryEntry.prototype.getOptions_ = function(a) {
  return a == goog.fs.DirectoryEntry.Behavior.CREATE ? {create:!0} : a == goog.fs.DirectoryEntry.Behavior.CREATE_EXCLUSIVE ? {create:!0, exclusive:!0} : {}
};
goog.fs.FileEntry = function(a, b) {
  goog.fs.Entry.call(this, a, b);
  this.file_ = b
};
goog.inherits(goog.fs.FileEntry, goog.fs.Entry);
goog.fs.FileEntry.prototype.createWriter = function() {
  var a = new goog.async.Deferred;
  this.file_.createWriter(function(b) {
    a.callback(new goog.fs.FileWriter(b))
  }, goog.bind(function(b) {
    var c = "creating writer for " + this.getFullPath();
    a.errback(new goog.fs.Error(b.code, c))
  }, this));
  return a
};
goog.fs.FileEntry.prototype.file = function() {
  var a = new goog.async.Deferred;
  this.file_.file(function(b) {
    a.callback(b)
  }, goog.bind(function(b) {
    var c = "getting file for " + this.getFullPath();
    a.errback(new goog.fs.Error(b.code, c))
  }, this));
  return a
};
// Input 90
goog.fs.FileSystem = function(a) {
  this.fs_ = a
};
goog.fs.FileSystem.prototype.getName = function() {
  return this.fs_.name
};
goog.fs.FileSystem.prototype.getRoot = function() {
  return new goog.fs.DirectoryEntry(this, this.fs_.root)
};
// Input 91
goog.fs.get_ = function(a, b) {
  var c = goog.global.requestFileSystem || goog.global.webkitRequestFileSystem;
  if(!goog.isFunction(c)) {
    return goog.async.Deferred.fail(Error("File API unsupported"))
  }
  var d = new goog.async.Deferred;
  c(a, b, function(a) {
    d.callback(new goog.fs.FileSystem(a))
  }, function(a) {
    d.errback(new goog.fs.Error(a.code, "requesting filesystem"))
  });
  return d
};
goog.fs.FileSystemType_ = {TEMPORARY:0, PERSISTENT:1};
goog.fs.getTemporary = function(a) {
  return goog.fs.get_(goog.fs.FileSystemType_.TEMPORARY, a)
};
goog.fs.getPersistent = function(a) {
  return goog.fs.get_(goog.fs.FileSystemType_.PERSISTENT, a)
};
goog.fs.createObjectUrl = function(a) {
  return goog.fs.getUrlObject_().createObjectURL(a)
};
goog.fs.revokeObjectUrl = function(a) {
  goog.fs.getUrlObject_().revokeObjectURL(a)
};
goog.fs.getUrlObject_ = function() {
  if(goog.isDef(goog.global.URL) && goog.isDef(goog.global.URL.createObjectURL)) {
    return goog.global.URL
  }
  if(goog.isDef(goog.global.webkitURL) && goog.isDef(goog.global.webkitURL.createObjectURL)) {
    return goog.global.webkitURL
  }
  if(goog.isDef(goog.global.createObjectURL)) {
    return goog.global
  }
  throw Error("This browser doesn't seem to support blob URLs");
};
goog.fs.getBlob = function(a) {
  var b = goog.global.BlobBuilder || goog.global.WebKitBlobBuilder;
  if(goog.isDef(b)) {
    for(var b = new b, c = 0;c < arguments.length;c++) {
      b.append(arguments[c])
    }
    return b.getBlob()
  }
  return new Blob(goog.array.toArray(arguments))
};
goog.fs.blobToString = function(a, b) {
  return goog.fs.FileReader.readAsText(a, b)
};
goog.fs.sliceBlob = function(a, b, c) {
  goog.isDef(c) || (c = a.size);
  return a.webkitSlice ? a.webkitSlice(b, c) : a.mozSlice ? a.mozSlice(b, c) : a.slice ? goog.userAgent.GECKO && !goog.userAgent.isVersion("13.0") || goog.userAgent.WEBKIT && !goog.userAgent.isVersion("537.1") ? (0 > b && (b += a.size), 0 > b && (b = 0), 0 > c && (c += a.size), c < b && (c = b), a.slice(b, c - b)) : a.slice(b, c) : null
};
// Input 92
wtf.pal = {};
wtf.pal.IPlatform = function() {
};
wtf.pal.IPlatform.prototype.getWorkingDirectory = goog.nullFunction;
wtf.pal.IPlatform.prototype.readTextFile = goog.nullFunction;
wtf.pal.IPlatform.prototype.readBinaryFile = goog.nullFunction;
wtf.pal.IPlatform.prototype.writeTextFile = goog.nullFunction;
wtf.pal.IPlatform.prototype.writeBinaryFile = goog.nullFunction;
wtf.pal.IPlatform.prototype.getNetworkInterfaces = goog.nullFunction;
wtf.pal.IPlatform.prototype.createListenSocket = goog.nullFunction;
// Input 93
wtf.pal.BrowserPlatform = function() {
};
wtf.pal.BrowserPlatform.prototype.getWorkingDirectory = function() {
  throw Error();
};
wtf.pal.BrowserPlatform.prototype.readTextFile = function() {
  throw Error();
};
wtf.pal.BrowserPlatform.prototype.readBinaryFile = function() {
  throw Error();
};
wtf.pal.BrowserPlatform.prototype.writeTextFile = function(a, b, c) {
  b = new Blob([b], {type:c || "text/plain"});
  this.downloadBlob_(a, b)
};
wtf.pal.BrowserPlatform.prototype.writeBinaryFile = function(a, b, c) {
  wtf.io.HAS_TYPED_ARRAYS ? c = new Blob([b], {type:c || "application/octet-stream"}) : (b = wtf.io.byteArrayToString(b), c = new Blob([b], {type:c || "text/plain"}));
  this.downloadBlob_(a, c)
};
wtf.pal.BrowserPlatform.prototype.downloadBlob_ = function(a, b) {
  if(goog.global.navigator.msSaveBlob) {
    goog.global.navigator.msSaveBlob(b, a)
  }else {
    var c = goog.dom.getDocument(), d = c.createElement(goog.dom.TagName.A);
    d.download = a;
    d.href = goog.fs.createObjectUrl(b);
    c = c.createEvent("MouseEvents");
    c.initMouseEvent(goog.events.EventType.CLICK, !0, !1, goog.global, 0, 0, 0, 0, 0, !1, !1, !1, !1, 0, null);
    d.dispatchEvent(c)
  }
};
wtf.pal.BrowserPlatform.prototype.getNetworkInterfaces = function() {
  throw Error();
};
wtf.pal.BrowserPlatform.prototype.createListenSocket = function() {
  throw Error();
};
// Input 94
wtf.net = {};
wtf.net.EventType = {CONNECTION:goog.events.getUniqueId("connection"), DATA:goog.events.getUniqueId("data"), CLOSE:goog.events.getUniqueId("close"), REQUEST:goog.events.getUniqueId("request"), END:goog.events.getUniqueId("end")};
// Input 95
wtf.net.ListenSocket = function() {
  wtf.events.EventEmitter.call(this)
};
goog.inherits(wtf.net.ListenSocket, wtf.events.EventEmitter);
wtf.net.ListenSocket.prototype.emitConnection = function(a) {
  this.emitEvent(wtf.net.EventType.CONNECTION, this, a)
};
// Input 96
wtf.net.Socket = function() {
  wtf.events.EventEmitter.call(this)
};
goog.inherits(wtf.net.Socket, wtf.events.EventEmitter);
wtf.net.Socket.prototype.emitData = function(a) {
  this.emitEvent(wtf.net.EventType.DATA, this, a)
};
wtf.net.Socket.prototype.emitClose = function() {
  this.emitEvent(wtf.net.EventType.CLOSE, this)
};
wtf.net.Socket.prototype.setBufferSize = goog.nullFunction;
// Input 97
wtf.pal.ChromePlatform = function() {
  wtf.pal.BrowserPlatform.call(this)
};
goog.inherits(wtf.pal.ChromePlatform, wtf.pal.BrowserPlatform);
wtf.pal.ChromePlatform.prototype.getNetworkInterfaces = function(a, b) {
  chrome.socket.getNetworkList(function(c) {
    for(var d = [], e = 0;e < c.length;e++) {
      d.push({name:c[e].name, address:c[e].address})
    }
    a.call(b, d)
  })
};
wtf.pal.ChromePlatform.prototype.createListenSocket = function(a, b) {
  return new wtf.pal.ChromePlatform.ListenSocket_(a, b)
};
wtf.pal.ChromePlatform.ListenSocket_ = function(a, b) {
  wtf.net.ListenSocket.call(this);
  this.port_ = a;
  this.hostname_ = b || "127.0.0.1";
  this.socketId_ = void 0;
  chrome.socket.create("tcp", {}, goog.bind(this.socketCreated_, this))
};
goog.inherits(wtf.pal.ChromePlatform.ListenSocket_, wtf.net.ListenSocket);
wtf.pal.ChromePlatform.ListenSocket_.prototype.disposeInternal = function() {
  void 0 !== this.socketId_ && chrome.socket.destroy(this.socketId_);
  this.socketId_ = void 0;
  wtf.pal.ChromePlatform.ListenSocket_.superClass_.disposeInternal.call(this)
};
wtf.pal.ChromePlatform.ListenSocket_.prototype.socketCreated_ = function(a) {
  this.socketId_ = a.socketId;
  chrome.socket.listen(this.socketId_, this.hostname_, this.port_, goog.bind(this.socketListening_, this))
};
wtf.pal.ChromePlatform.ListenSocket_.prototype.socketListening_ = function(a) {
  0 > a ? (window.console.log("failed to listen on " + this.hostname_ + ":" + this.port_ + " - already in use?"), goog.dispose(this)) : this.requestAccept_()
};
wtf.pal.ChromePlatform.ListenSocket_.prototype.requestAccept_ = function() {
  void 0 !== this.socketId_ && chrome.socket.accept(this.socketId_, goog.bind(this.socketAccepted_, this))
};
wtf.pal.ChromePlatform.ListenSocket_.prototype.socketAccepted_ = function(a) {
  this.requestAccept_();
  0 > a.result || void 0 === a.socketId ? (window.console.log("failed to accept socket"), goog.dispose(this)) : (a = new wtf.pal.ChromePlatform.Socket_(a.socketId), this.emitConnection(a))
};
wtf.pal.ChromePlatform.Socket_ = function(a) {
  wtf.net.Socket.call(this);
  this.socketId_ = a;
  this.isOpen_ = !0;
  this.bufferSize_ = 0;
  this.requestRead_()
};
goog.inherits(wtf.pal.ChromePlatform.Socket_, wtf.net.Socket);
wtf.pal.ChromePlatform.Socket_.prototype.disposeInternal = function() {
  this.isOpen_ || (this.isOpen_ = !1, this.emitClose());
  chrome.socket.destroy(this.socketId_);
  wtf.pal.ChromePlatform.Socket_.superClass_.disposeInternal.call(this)
};
wtf.pal.ChromePlatform.Socket_.prototype.setBufferSize = function(a) {
  this.bufferSize_ = a
};
wtf.pal.ChromePlatform.Socket_.prototype.requestRead_ = function(a) {
  a = a || this.bufferSize_;
  (a = Math.min(a, 16777216)) || (a = void 0);
  chrome.socket.read(this.socketId_, a, goog.bind(this.socketRead_, this))
};
wtf.pal.ChromePlatform.Socket_.prototype.socketRead_ = function(a) {
  0 > a.resultCode ? this.dispose() : 0 != a.data.byteLength && (a = new Uint8Array(a.data), this.emitData(a), this.requestRead_())
};
wtf.pal.ChromePlatform.Socket_.prototype.write = function(a) {
  chrome.socket.write(this.socketId_, a.buffer, goog.bind(function(a) {
    0 > a.bytesWritten && goog.dispose(this)
  }, this))
};
// Input 98
wtf.pal.NodePlatform = function() {
  this.workingDirectory_ = process.cwd();
  this.fs_ = require("fs")
};
wtf.pal.NodePlatform.prototype.getWorkingDirectory = function() {
  return this.workingDirectory_
};
wtf.pal.NodePlatform.prototype.readTextFile = function(a) {
  try {
    return this.fs_.readFileSync(a, "utf8")
  }catch(b) {
    return null
  }
};
wtf.pal.NodePlatform.prototype.readBinaryFile = function(a) {
  var b = null;
  try {
    b = this.fs_.readFileSync(a)
  }catch(c) {
    return null
  }
  a = new Uint8Array(b.length);
  for(var d = 0;d < a.length;d++) {
    a[d] = b[d]
  }
  return a
};
wtf.pal.NodePlatform.prototype.writeTextFile = function(a, b) {
  this.fs_.writeFileSync(a, b, "utf8")
};
wtf.pal.NodePlatform.prototype.writeBinaryFile = function(a, b) {
  for(var c = new Buffer(b.length), d = 0;d < c.length;d++) {
    c[d] = b[d]
  }
  this.fs_.writeFileSync(a, c)
};
wtf.pal.NodePlatform.prototype.getNetworkInterfaces = function() {
  throw Error();
};
wtf.pal.NodePlatform.prototype.createListenSocket = function() {
  throw Error();
};
// Input 99
wtf.pal.sharedPlatform_ = null;
wtf.pal.getPlatform = function() {
  wtf.pal.sharedPlatform_ || (wtf.pal.sharedPlatform_ = wtf.NODE ? new wtf.pal.NodePlatform : goog.global.chrome && goog.global.chrome.runtime ? new wtf.pal.ChromePlatform : new wtf.pal.BrowserPlatform);
  return wtf.pal.sharedPlatform_
};
goog.exportSymbol("wtf.pal.getPlatform", wtf.pal.getPlatform);
// Input 100
wtf.analysis.createTraceListener = function(a, b) {
  var c = new wtf.analysis.EventfulTraceListener;
  c.addListeners(a, b);
  return c
};
wtf.analysis.run = function(a, b) {
  var c = wtf.pal.getPlatform(), d = new wtf.analysis.Session(a, {});
  if(goog.isString(b)) {
    if(goog.string.endsWith(b, ".wtf-trace")) {
      c = c.readBinaryFile(b);
      if(!c) {
        return goog.dispose(d), !1
      }
      d.addBinarySource(c)
    }else {
      if(goog.string.endsWith(b, ".wtf-json")) {
        c = c.readTextFile(b);
        if(!c) {
          return goog.dispose(d), !1
        }
        d.addJsonSource(c)
      }else {
        d.addJsonSource(b)
      }
    }
  }else {
    wtf.io.isByteArray(b) ? d.addBinarySource(b) : goog.isObject(b) && d.addJsonSource(b)
  }
  goog.dispose(d);
  return!0
};
wtf.analysis.loadDatabase = function(a) {
  var b = new wtf.analysis.db.EventDatabase;
  return!wtf.analysis.run(b.getTraceListener(), a) ? (goog.dispose(b), null) : b
};
goog.exportSymbol("wtf.analysis.createTraceListener", wtf.analysis.createTraceListener);
goog.exportSymbol("wtf.analysis.run", wtf.analysis.run);
goog.exportSymbol("wtf.analysis.loadDatabase", wtf.analysis.loadDatabase);
// Input 101
wtf.analysis.EventFilter = function(a) {
  this.sourceString_ = "";
  this.evaluator_ = null;
  a && this.setFromString(a)
};
wtf.analysis.EventFilter.Result = {UPDATED:0, FAILED:1, NO_CHANGE:2};
wtf.analysis.EventFilter.prototype.getEvaluator = function() {
  return this.evaluator_
};
wtf.analysis.EventFilter.prototype.clear = function() {
  if(!this.evaluator_) {
    return wtf.analysis.EventFilter.Result.NO_CHANGE
  }
  this.sourceString_ = "";
  this.evaluator_ = null;
  return wtf.analysis.EventFilter.Result.UPDATED
};
wtf.analysis.EventFilter.prototype.toString = function() {
  return this.sourceString_
};
wtf.analysis.EventFilter.prototype.setFromString = function(a) {
  a = goog.string.trim(a);
  if(this.sourceString_ == a) {
    return wtf.analysis.EventFilter.Result.NO_CHANGE
  }
  if(!a.length) {
    return this.clear(), wtf.analysis.EventFilter.Result.UPDATED
  }
  var b = null;
  try {
    b = this.parseExpression_(a)
  }catch(c) {
  }
  if(!b) {
    return wtf.analysis.EventFilter.Result.FAILED
  }
  b = this.generateEvaluatorFn_(b);
  this.sourceString_ = a;
  this.evaluator_ = b;
  return wtf.analysis.EventFilter.Result.UPDATED
};
wtf.analysis.EventFilter.regexMatch_ = /^\/(.+)\/([gim]*)$/;
wtf.analysis.EventFilter.prototype.parseExpression_ = function(a) {
  var b = null, b = wtf.analysis.EventFilter.regexMatch_;
  b.test(a) ? (a = b.exec(a), b = RegExp(a[1], a[2])) : (a = goog.string.regExpEscape(a), b = RegExp(".*" + a + ".*", "i"));
  return{name:b}
};
wtf.analysis.EventFilter.prototype.generateEvaluatorFn_ = function(a) {
  return function(b) {
    return a.name.test(b.eventType.name)
  }
};
goog.exportSymbol("wtf.analysis.EventFilter", wtf.analysis.EventFilter);
goog.exportProperty(wtf.analysis.EventFilter.prototype, "clear", wtf.analysis.EventFilter.prototype.clear);
goog.exportProperty(wtf.analysis.EventFilter.prototype, "toString", wtf.analysis.EventFilter.prototype.toString);
goog.exportProperty(wtf.analysis.EventFilter.prototype, "setFromString", wtf.analysis.EventFilter.prototype.setFromString);
// Input 102
wtf.analysis.db.EventDataTable = function(a, b) {
  goog.Disposable.call(this);
  this.db_ = a;
  a.getTraceListener();
  this.eventTypes_ = {scopeLeave:null};
  this.table_ = {};
  this.entriesByClass_ = {};
  this.entriesByClass_[wtf.data.EventClass.INSTANCE] = {};
  this.entriesByClass_[wtf.data.EventClass.SCOPE] = {};
  this.list_ = [];
  this.listSortMode_ = wtf.analysis.db.SortMode.ANY;
  this.filteredEventCount_ = 0;
  this.rebuild(Number.MIN_VALUE, Number.MAX_VALUE, b)
};
goog.inherits(wtf.analysis.db.EventDataTable, goog.Disposable);
wtf.analysis.db.EventDataTable.prototype.rebuild = function(a, b, c) {
  var d = null, d = c instanceof wtf.analysis.EventFilter ? c.getEvaluator() : c || null;
  this.eventTypes_.scopeLeave || (this.eventTypes_.scopeLeave = this.db_.getTraceListener().getEventType("wtf.scope#leave"));
  var e = {}, f = [];
  this.filteredEventCount_ = 0;
  var g = {};
  this.entriesByClass_[wtf.data.EventClass.SCOPE] = g;
  var h = {};
  this.entriesByClass_[wtf.data.EventClass.INSTANCE] = h;
  c = this.db_.getZoneIndices();
  for(var i = 0;i < c.length;i++) {
    c[i].forEach(a, b, function(a) {
      if(!(a.eventType.flags & wtf.data.EventFlag.INTERNAL || a.eventType.flags & wtf.data.EventFlag.APPEND_SCOPE_DATA || a.eventType == this.eventTypes_.scopeLeave)) {
        if(!d || d(a)) {
          var b = a.eventType.name, c = e[b];
          if(!c) {
            switch(a.eventType.eventClass) {
              case wtf.data.EventClass.SCOPE:
                c = new wtf.analysis.db.ScopeEventDataEntry(a.eventType);
                g[b] = c;
                break;
              case wtf.data.EventClass.INSTANCE:
                c = new wtf.analysis.db.InstanceEventDataEntry(a.eventType), h[b] = c
            }
            e[b] = c;
            f.push(c)
          }
          c && (c.appendEvent(a), this.filteredEventCount_++)
        }
      }
    }, this)
  }
  this.table_ = e;
  this.list_ = f;
  this.listSortMode_ = wtf.analysis.db.SortMode.ANY
};
wtf.analysis.db.EventDataTable.prototype.getFilteredEventCount = function() {
  return this.filteredEventCount_
};
wtf.analysis.db.EventDataTable.prototype.getEventTypeEntry = function(a) {
  return this.table_[a] || null
};
wtf.analysis.db.EventDataTable.prototype.getEntriesByClass = function(a) {
  return this.entriesByClass_[a]
};
wtf.analysis.db.EventDataTable.getAllEventTypeNames = function(a, b) {
  for(var c = {}, d = 0;d < a.length;d++) {
    for(var e = a[d], f = 0;f < e.list_.length;f++) {
      var g = e.list_[f].eventType;
      if(void 0 === b || g.eventClass == b) {
        c[g.name] = !0
      }
    }
  }
  return goog.object.getKeys(c)
};
wtf.analysis.db.EventDataTable.prototype.forEach = function(a, b, c) {
  if(c && this.listSortMode_ != c) {
    switch(this.listSortMode_ = c, this.listSortMode_) {
      case wtf.analysis.db.SortMode.COUNT:
        this.list_.sort(function(a, b) {
          return b.count - a.count
        });
        break;
      case wtf.analysis.db.SortMode.TOTAL_TIME:
        this.list_.sort(function(a, b) {
          return a instanceof wtf.analysis.db.ScopeEventDataEntry && b instanceof wtf.analysis.db.ScopeEventDataEntry ? b.totalTime_ - a.totalTime_ : a instanceof wtf.analysis.db.ScopeEventDataEntry ? -1 : b instanceof wtf.analysis.db.ScopeEventDataEntry ? 1 : b.count - a.count
        });
        break;
      case wtf.analysis.db.SortMode.MEAN_TIME:
        this.list_.sort(function(a, b) {
          return a instanceof wtf.analysis.db.ScopeEventDataEntry && b instanceof wtf.analysis.db.ScopeEventDataEntry ? b.getMeanTime() - a.getMeanTime() : a instanceof wtf.analysis.db.ScopeEventDataEntry ? -1 : b instanceof wtf.analysis.db.ScopeEventDataEntry ? 1 : b.count - a.count
        })
    }
  }
  for(c = 0;c < this.list_.length;c++) {
    a.call(b, this.list_[c])
  }
};
goog.exportSymbol("wtf.analysis.db.EventDataTable", wtf.analysis.db.EventDataTable);
goog.exportProperty(wtf.analysis.db.EventDataTable.prototype, "rebuild", wtf.analysis.db.EventDataTable.prototype.rebuild);
goog.exportProperty(wtf.analysis.db.EventDataTable.prototype, "getFilteredEventCount", wtf.analysis.db.EventDataTable.prototype.getFilteredEventCount);
goog.exportProperty(wtf.analysis.db.EventDataTable.prototype, "getEventTypeEntry", wtf.analysis.db.EventDataTable.prototype.getEventTypeEntry);
goog.exportProperty(wtf.analysis.db.EventDataTable.prototype, "getEntriesByClass", wtf.analysis.db.EventDataTable.prototype.getEntriesByClass);
goog.exportProperty(wtf.analysis.db.EventDataTable.prototype, "forEach", wtf.analysis.db.EventDataTable.prototype.forEach);
goog.exportSymbol("wtf.analysis.db.EventDataTable.getAllEventTypeNames", wtf.analysis.db.EventDataTable.getAllEventTypeNames);
wtf.analysis.db.EventDataEntry = function(a) {
  this.eventType = a;
  this.count = 0
};
wtf.analysis.db.EventDataEntry.prototype.getEventType = function() {
  return this.eventType
};
wtf.analysis.db.EventDataEntry.prototype.getCount = function() {
  return this.count
};
wtf.analysis.db.EventDataEntry.prototype.getFrequency = function() {
  return 0
};
goog.exportSymbol("wtf.analysis.db.EventDataEntry", wtf.analysis.db.EventDataEntry);
goog.exportProperty(wtf.analysis.db.EventDataEntry.prototype, "getEventType", wtf.analysis.db.EventDataEntry.prototype.getEventType);
goog.exportProperty(wtf.analysis.db.EventDataEntry.prototype, "getCount", wtf.analysis.db.EventDataEntry.prototype.getCount);
goog.exportProperty(wtf.analysis.db.EventDataEntry.prototype, "getFrequency", wtf.analysis.db.EventDataEntry.prototype.getFrequency);
wtf.analysis.db.ScopeEventDataEntry = function(a) {
  wtf.analysis.db.EventDataEntry.call(this, a);
  this.userTime_ = this.totalTime_ = 0;
  this.buckets_ = new Uint32Array(1E3)
};
goog.inherits(wtf.analysis.db.ScopeEventDataEntry, wtf.analysis.db.EventDataEntry);
wtf.analysis.db.ScopeEventDataEntry.prototype.appendEvent = function(a) {
  this.count++;
  a = a.scope;
  var b = a.getUserDuration();
  this.totalTime_ += a.getTotalDuration();
  this.userTime_ += b;
  a = Math.round(b) | 0;
  1E3 <= a && (a = 999);
  this.buckets_[a]++
};
wtf.analysis.db.ScopeEventDataEntry.prototype.getTotalTime = function() {
  return this.totalTime_
};
wtf.analysis.db.ScopeEventDataEntry.prototype.getUserTime = function() {
  return this.userTime_
};
wtf.analysis.db.ScopeEventDataEntry.prototype.getMeanTime = function() {
  return this.count ? this.eventType.flags & wtf.data.EventFlag.SYSTEM_TIME ? this.totalTime_ / this.count : this.userTime_ / this.count : 0
};
wtf.analysis.db.ScopeEventDataEntry.prototype.getDistribution = function() {
  return this.buckets_
};
goog.exportSymbol("wtf.analysis.db.ScopeEventDataEntry", wtf.analysis.db.ScopeEventDataEntry);
goog.exportProperty(wtf.analysis.db.ScopeEventDataEntry.prototype, "getTotalTime", wtf.analysis.db.ScopeEventDataEntry.prototype.getTotalTime);
goog.exportProperty(wtf.analysis.db.ScopeEventDataEntry.prototype, "getUserTime", wtf.analysis.db.ScopeEventDataEntry.prototype.getUserTime);
goog.exportProperty(wtf.analysis.db.ScopeEventDataEntry.prototype, "getMeanTime", wtf.analysis.db.ScopeEventDataEntry.prototype.getMeanTime);
goog.exportProperty(wtf.analysis.db.ScopeEventDataEntry.prototype, "getDistribution", wtf.analysis.db.ScopeEventDataEntry.prototype.getDistribution);
wtf.analysis.db.InstanceEventDataEntry = function(a) {
  wtf.analysis.db.EventDataEntry.call(this, a)
};
goog.inherits(wtf.analysis.db.InstanceEventDataEntry, wtf.analysis.db.EventDataEntry);
wtf.analysis.db.InstanceEventDataEntry.prototype.appendEvent = function() {
  this.count++
};
goog.exportSymbol("wtf.analysis.db.InstanceEventDataEntry", wtf.analysis.db.InstanceEventDataEntry);
// Input 103
wtf.data.ZoneType = {SCRIPT:"script"};
goog.exportSymbol("wtf.data.ZoneType", wtf.data.ZoneType);
goog.exportProperty(wtf.data.ZoneType, "SCRIPT", wtf.data.ZoneType.SCRIPT);
// Input 104
goog.structs.Collection = function() {
};
// Input 105
goog.structs.Set = function(a) {
  this.map_ = new goog.structs.Map;
  a && this.addAll(a)
};
goog.structs.Set.getKey_ = function(a) {
  var b = typeof a;
  return"object" == b && a || "function" == b ? "o" + goog.getUid(a) : b.substr(0, 1) + a
};
goog.structs.Set.prototype.getCount = function() {
  return this.map_.getCount()
};
goog.structs.Set.prototype.add = function(a) {
  this.map_.set(goog.structs.Set.getKey_(a), a)
};
goog.structs.Set.prototype.addAll = function(a) {
  a = goog.structs.getValues(a);
  for(var b = a.length, c = 0;c < b;c++) {
    this.add(a[c])
  }
};
goog.structs.Set.prototype.removeAll = function(a) {
  a = goog.structs.getValues(a);
  for(var b = a.length, c = 0;c < b;c++) {
    this.remove(a[c])
  }
};
goog.structs.Set.prototype.remove = function(a) {
  return this.map_.remove(goog.structs.Set.getKey_(a))
};
goog.structs.Set.prototype.clear = function() {
  this.map_.clear()
};
goog.structs.Set.prototype.isEmpty = function() {
  return this.map_.isEmpty()
};
goog.structs.Set.prototype.contains = function(a) {
  return this.map_.containsKey(goog.structs.Set.getKey_(a))
};
goog.structs.Set.prototype.containsAll = function(a) {
  return goog.structs.every(a, this.contains, this)
};
goog.structs.Set.prototype.intersection = function(a) {
  var b = new goog.structs.Set;
  a = goog.structs.getValues(a);
  for(var c = 0;c < a.length;c++) {
    var d = a[c];
    this.contains(d) && b.add(d)
  }
  return b
};
goog.structs.Set.prototype.difference = function(a) {
  var b = this.clone();
  b.removeAll(a);
  return b
};
goog.structs.Set.prototype.getValues = function() {
  return this.map_.getValues()
};
goog.structs.Set.prototype.clone = function() {
  return new goog.structs.Set(this)
};
goog.structs.Set.prototype.equals = function(a) {
  return this.getCount() == goog.structs.getCount(a) && this.isSubsetOf(a)
};
goog.structs.Set.prototype.isSubsetOf = function(a) {
  var b = goog.structs.getCount(a);
  if(this.getCount() > b) {
    return!1
  }
  !(a instanceof goog.structs.Set) && 5 < b && (a = new goog.structs.Set(a));
  return goog.structs.every(this, function(b) {
    return goog.structs.contains(a, b)
  })
};
goog.structs.Set.prototype.__iterator__ = function() {
  return this.map_.__iterator__(!1)
};
// Input 106
goog.debug.catchErrors = function(a, b, c) {
  c = c || goog.global;
  var d = c.onerror, e = !!b;
  goog.userAgent.WEBKIT && !goog.userAgent.isVersion("535.3") && (e = !e);
  c.onerror = function(b, c, h) {
    d && d(b, c, h);
    a({message:b, fileName:c, line:h});
    return e
  }
};
goog.debug.expose = function(a, b) {
  if("undefined" == typeof a) {
    return"undefined"
  }
  if(null == a) {
    return"NULL"
  }
  var c = [], d;
  for(d in a) {
    if(b || !goog.isFunction(a[d])) {
      var e = d + " = ";
      try {
        e += a[d]
      }catch(f) {
        e += "*** " + f + " ***"
      }
      c.push(e)
    }
  }
  return c.join("\n")
};
goog.debug.deepExpose = function(a, b) {
  var c = new goog.structs.Set, d = [], e = function(a, g) {
    var h = g + "  ";
    try {
      if(goog.isDef(a)) {
        if(goog.isNull(a)) {
          d.push("NULL")
        }else {
          if(goog.isString(a)) {
            d.push('"' + a.replace(/\n/g, "\n" + g) + '"')
          }else {
            if(goog.isFunction(a)) {
              d.push(String(a).replace(/\n/g, "\n" + g))
            }else {
              if(goog.isObject(a)) {
                if(c.contains(a)) {
                  d.push("*** reference loop detected ***")
                }else {
                  c.add(a);
                  d.push("{");
                  for(var i in a) {
                    if(b || !goog.isFunction(a[i])) {
                      d.push("\n"), d.push(h), d.push(i + " = "), e(a[i], h)
                    }
                  }
                  d.push("\n" + g + "}")
                }
              }else {
                d.push(a)
              }
            }
          }
        }
      }else {
        d.push("undefined")
      }
    }catch(j) {
      d.push("*** " + j + " ***")
    }
  };
  e(a, "");
  return d.join("")
};
goog.debug.exposeArray = function(a) {
  for(var b = [], c = 0;c < a.length;c++) {
    goog.isArray(a[c]) ? b.push(goog.debug.exposeArray(a[c])) : b.push(a[c])
  }
  return"[ " + b.join(", ") + " ]"
};
goog.debug.exposeException = function(a, b) {
  try {
    var c = goog.debug.normalizeErrorObject(a);
    return"Message: " + goog.string.htmlEscape(c.message) + '\nUrl: <a href="view-source:' + c.fileName + '" target="_new">' + c.fileName + "</a>\nLine: " + c.lineNumber + "\n\nBrowser stack:\n" + goog.string.htmlEscape(c.stack + "-> ") + "[end]\n\nJS stack traversal:\n" + goog.string.htmlEscape(goog.debug.getStacktrace(b) + "-> ")
  }catch(d) {
    return"Exception trying to expose exception! You win, we lose. " + d
  }
};
goog.debug.normalizeErrorObject = function(a) {
  var b = goog.getObjectByName("window.location.href");
  if(goog.isString(a)) {
    return{message:a, name:"Unknown error", lineNumber:"Not available", fileName:b, stack:"Not available"}
  }
  var c, d, e = !1;
  try {
    c = a.lineNumber || a.line || "Not available"
  }catch(f) {
    c = "Not available", e = !0
  }
  try {
    d = a.fileName || a.filename || a.sourceURL || b
  }catch(g) {
    d = "Not available", e = !0
  }
  return e || !a.lineNumber || !a.fileName || !a.stack ? {message:a.message, name:a.name, lineNumber:c, fileName:d, stack:a.stack || "Not available"} : a
};
goog.debug.enhanceError = function(a, b) {
  var c = "string" == typeof a ? Error(a) : a;
  c.stack || (c.stack = goog.debug.getStacktrace(arguments.callee.caller));
  if(b) {
    for(var d = 0;c["message" + d];) {
      ++d
    }
    c["message" + d] = String(b)
  }
  return c
};
goog.debug.getStacktraceSimple = function(a) {
  for(var b = [], c = arguments.callee.caller, d = 0;c && (!a || d < a);) {
    b.push(goog.debug.getFunctionName(c));
    b.push("()\n");
    try {
      c = c.caller
    }catch(e) {
      b.push("[exception trying to get caller]\n");
      break
    }
    d++;
    if(d >= goog.debug.MAX_STACK_DEPTH) {
      b.push("[...long stack...]");
      break
    }
  }
  a && d >= a ? b.push("[...reached max depth limit...]") : b.push("[end]");
  return b.join("")
};
goog.debug.MAX_STACK_DEPTH = 50;
goog.debug.getStacktrace = function(a) {
  return goog.debug.getStacktraceHelper_(a || arguments.callee.caller, [])
};
goog.debug.getStacktraceHelper_ = function(a, b) {
  var c = [];
  if(goog.array.contains(b, a)) {
    c.push("[...circular reference...]")
  }else {
    if(a && b.length < goog.debug.MAX_STACK_DEPTH) {
      c.push(goog.debug.getFunctionName(a) + "(");
      for(var d = a.arguments, e = 0;e < d.length;e++) {
        0 < e && c.push(", ");
        var f;
        f = d[e];
        switch(typeof f) {
          case "object":
            f = f ? "object" : "null";
            break;
          case "string":
            break;
          case "number":
            f = String(f);
            break;
          case "boolean":
            f = f ? "true" : "false";
            break;
          case "function":
            f = (f = goog.debug.getFunctionName(f)) ? f : "[fn]";
            break;
          default:
            f = typeof f
        }
        40 < f.length && (f = f.substr(0, 40) + "...");
        c.push(f)
      }
      b.push(a);
      c.push(")\n");
      try {
        c.push(goog.debug.getStacktraceHelper_(a.caller, b))
      }catch(g) {
        c.push("[exception trying to get caller]\n")
      }
    }else {
      a ? c.push("[...long stack...]") : c.push("[end]")
    }
  }
  return c.join("")
};
goog.debug.setFunctionResolver = function(a) {
  goog.debug.fnNameResolver_ = a
};
goog.debug.getFunctionName = function(a) {
  if(goog.debug.fnNameCache_[a]) {
    return goog.debug.fnNameCache_[a]
  }
  if(goog.debug.fnNameResolver_) {
    var b = goog.debug.fnNameResolver_(a);
    if(b) {
      return goog.debug.fnNameCache_[a] = b
    }
  }
  a = String(a);
  goog.debug.fnNameCache_[a] || (b = /function ([^\(]+)/.exec(a), goog.debug.fnNameCache_[a] = b ? b[1] : "[Anonymous]");
  return goog.debug.fnNameCache_[a]
};
goog.debug.makeWhitespaceVisible = function(a) {
  return a.replace(/ /g, "[_]").replace(/\f/g, "[f]").replace(/\n/g, "[n]\n").replace(/\r/g, "[r]").replace(/\t/g, "[t]")
};
goog.debug.fnNameCache_ = {};
// Input 107
goog.debug.LogRecord = function(a, b, c, d, e) {
  this.reset(a, b, c, d, e)
};
goog.debug.LogRecord.prototype.sequenceNumber_ = 0;
goog.debug.LogRecord.prototype.exception_ = null;
goog.debug.LogRecord.prototype.exceptionText_ = null;
goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS = !0;
goog.debug.LogRecord.nextSequenceNumber_ = 0;
goog.debug.LogRecord.prototype.reset = function(a, b, c, d, e) {
  goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS && (this.sequenceNumber_ = "number" == typeof e ? e : goog.debug.LogRecord.nextSequenceNumber_++);
  this.time_ = d || goog.now();
  this.level_ = a;
  this.msg_ = b;
  this.loggerName_ = c;
  delete this.exception_;
  delete this.exceptionText_
};
goog.debug.LogRecord.prototype.getLoggerName = function() {
  return this.loggerName_
};
goog.debug.LogRecord.prototype.getException = function() {
  return this.exception_
};
goog.debug.LogRecord.prototype.setException = function(a) {
  this.exception_ = a
};
goog.debug.LogRecord.prototype.getExceptionText = function() {
  return this.exceptionText_
};
goog.debug.LogRecord.prototype.setExceptionText = function(a) {
  this.exceptionText_ = a
};
goog.debug.LogRecord.prototype.setLoggerName = function(a) {
  this.loggerName_ = a
};
goog.debug.LogRecord.prototype.getLevel = function() {
  return this.level_
};
goog.debug.LogRecord.prototype.setLevel = function(a) {
  this.level_ = a
};
goog.debug.LogRecord.prototype.getMessage = function() {
  return this.msg_
};
goog.debug.LogRecord.prototype.setMessage = function(a) {
  this.msg_ = a
};
goog.debug.LogRecord.prototype.getMillis = function() {
  return this.time_
};
goog.debug.LogRecord.prototype.setMillis = function(a) {
  this.time_ = a
};
goog.debug.LogRecord.prototype.getSequenceNumber = function() {
  return this.sequenceNumber_
};
// Input 108
goog.debug.LogBuffer = function() {
  goog.asserts.assert(goog.debug.LogBuffer.isBufferingEnabled(), "Cannot use goog.debug.LogBuffer without defining goog.debug.LogBuffer.CAPACITY.");
  this.clear()
};
goog.debug.LogBuffer.getInstance = function() {
  goog.debug.LogBuffer.instance_ || (goog.debug.LogBuffer.instance_ = new goog.debug.LogBuffer);
  return goog.debug.LogBuffer.instance_
};
goog.debug.LogBuffer.CAPACITY = 0;
goog.debug.LogBuffer.prototype.addRecord = function(a, b, c) {
  var d = (this.curIndex_ + 1) % goog.debug.LogBuffer.CAPACITY;
  this.curIndex_ = d;
  if(this.isFull_) {
    return d = this.buffer_[d], d.reset(a, b, c), d
  }
  this.isFull_ = d == goog.debug.LogBuffer.CAPACITY - 1;
  return this.buffer_[d] = new goog.debug.LogRecord(a, b, c)
};
goog.debug.LogBuffer.isBufferingEnabled = function() {
  return 0 < goog.debug.LogBuffer.CAPACITY
};
goog.debug.LogBuffer.prototype.clear = function() {
  this.buffer_ = Array(goog.debug.LogBuffer.CAPACITY);
  this.curIndex_ = -1;
  this.isFull_ = !1
};
goog.debug.LogBuffer.prototype.forEachRecord = function(a) {
  var b = this.buffer_;
  if(b[0]) {
    var c = this.curIndex_, d = this.isFull_ ? c : -1;
    do {
      d = (d + 1) % goog.debug.LogBuffer.CAPACITY, a(b[d])
    }while(d != c)
  }
};
// Input 109
goog.debug.Logger = function(a) {
  this.name_ = a
};
goog.debug.Logger.prototype.parent_ = null;
goog.debug.Logger.prototype.level_ = null;
goog.debug.Logger.prototype.children_ = null;
goog.debug.Logger.prototype.handlers_ = null;
goog.debug.Logger.ENABLE_HIERARCHY = !0;
goog.debug.Logger.ENABLE_HIERARCHY || (goog.debug.Logger.rootHandlers_ = []);
goog.debug.Logger.Level = function(a, b) {
  this.name = a;
  this.value = b
};
goog.debug.Logger.Level.prototype.toString = function() {
  return this.name
};
goog.debug.Logger.Level.OFF = new goog.debug.Logger.Level("OFF", Infinity);
goog.debug.Logger.Level.SHOUT = new goog.debug.Logger.Level("SHOUT", 1200);
goog.debug.Logger.Level.SEVERE = new goog.debug.Logger.Level("SEVERE", 1E3);
goog.debug.Logger.Level.WARNING = new goog.debug.Logger.Level("WARNING", 900);
goog.debug.Logger.Level.INFO = new goog.debug.Logger.Level("INFO", 800);
goog.debug.Logger.Level.CONFIG = new goog.debug.Logger.Level("CONFIG", 700);
goog.debug.Logger.Level.FINE = new goog.debug.Logger.Level("FINE", 500);
goog.debug.Logger.Level.FINER = new goog.debug.Logger.Level("FINER", 400);
goog.debug.Logger.Level.FINEST = new goog.debug.Logger.Level("FINEST", 300);
goog.debug.Logger.Level.ALL = new goog.debug.Logger.Level("ALL", 0);
goog.debug.Logger.Level.PREDEFINED_LEVELS = [goog.debug.Logger.Level.OFF, goog.debug.Logger.Level.SHOUT, goog.debug.Logger.Level.SEVERE, goog.debug.Logger.Level.WARNING, goog.debug.Logger.Level.INFO, goog.debug.Logger.Level.CONFIG, goog.debug.Logger.Level.FINE, goog.debug.Logger.Level.FINER, goog.debug.Logger.Level.FINEST, goog.debug.Logger.Level.ALL];
goog.debug.Logger.Level.predefinedLevelsCache_ = null;
goog.debug.Logger.Level.createPredefinedLevelsCache_ = function() {
  goog.debug.Logger.Level.predefinedLevelsCache_ = {};
  for(var a = 0, b;b = goog.debug.Logger.Level.PREDEFINED_LEVELS[a];a++) {
    goog.debug.Logger.Level.predefinedLevelsCache_[b.value] = b, goog.debug.Logger.Level.predefinedLevelsCache_[b.name] = b
  }
};
goog.debug.Logger.Level.getPredefinedLevel = function(a) {
  goog.debug.Logger.Level.predefinedLevelsCache_ || goog.debug.Logger.Level.createPredefinedLevelsCache_();
  return goog.debug.Logger.Level.predefinedLevelsCache_[a] || null
};
goog.debug.Logger.Level.getPredefinedLevelByValue = function(a) {
  goog.debug.Logger.Level.predefinedLevelsCache_ || goog.debug.Logger.Level.createPredefinedLevelsCache_();
  if(a in goog.debug.Logger.Level.predefinedLevelsCache_) {
    return goog.debug.Logger.Level.predefinedLevelsCache_[a]
  }
  for(var b = 0;b < goog.debug.Logger.Level.PREDEFINED_LEVELS.length;++b) {
    var c = goog.debug.Logger.Level.PREDEFINED_LEVELS[b];
    if(c.value <= a) {
      return c
    }
  }
  return null
};
goog.debug.Logger.getLogger = function(a) {
  return goog.debug.LogManager.getLogger(a)
};
goog.debug.Logger.logToProfilers = function(a) {
  goog.global.console && (goog.global.console.timeStamp ? goog.global.console.timeStamp(a) : goog.global.console.markTimeline && goog.global.console.markTimeline(a));
  goog.global.msWriteProfilerMark && goog.global.msWriteProfilerMark(a)
};
goog.debug.Logger.prototype.getName = function() {
  return this.name_
};
goog.debug.Logger.prototype.addHandler = function(a) {
  goog.debug.Logger.ENABLE_HIERARCHY ? (this.handlers_ || (this.handlers_ = []), this.handlers_.push(a)) : (goog.asserts.assert(!this.name_, "Cannot call addHandler on a non-root logger when goog.debug.Logger.ENABLE_HIERARCHY is false."), goog.debug.Logger.rootHandlers_.push(a))
};
goog.debug.Logger.prototype.removeHandler = function(a) {
  var b = goog.debug.Logger.ENABLE_HIERARCHY ? this.handlers_ : goog.debug.Logger.rootHandlers_;
  return!!b && goog.array.remove(b, a)
};
goog.debug.Logger.prototype.getParent = function() {
  return this.parent_
};
goog.debug.Logger.prototype.getChildren = function() {
  this.children_ || (this.children_ = {});
  return this.children_
};
goog.debug.Logger.prototype.setLevel = function(a) {
  goog.debug.Logger.ENABLE_HIERARCHY ? this.level_ = a : (goog.asserts.assert(!this.name_, "Cannot call setLevel() on a non-root logger when goog.debug.Logger.ENABLE_HIERARCHY is false."), goog.debug.Logger.rootLevel_ = a)
};
goog.debug.Logger.prototype.getLevel = function() {
  return this.level_
};
goog.debug.Logger.prototype.getEffectiveLevel = function() {
  if(!goog.debug.Logger.ENABLE_HIERARCHY) {
    return goog.debug.Logger.rootLevel_
  }
  if(this.level_) {
    return this.level_
  }
  if(this.parent_) {
    return this.parent_.getEffectiveLevel()
  }
  goog.asserts.fail("Root logger has no level set.");
  return null
};
goog.debug.Logger.prototype.isLoggable = function(a) {
  return a.value >= this.getEffectiveLevel().value
};
goog.debug.Logger.prototype.log = function(a, b, c) {
  this.isLoggable(a) && this.doLogRecord_(this.getLogRecord(a, b, c))
};
goog.debug.Logger.prototype.getLogRecord = function(a, b, c) {
  var d = goog.debug.LogBuffer.isBufferingEnabled() ? goog.debug.LogBuffer.getInstance().addRecord(a, b, this.name_) : new goog.debug.LogRecord(a, String(b), this.name_);
  c && (d.setException(c), d.setExceptionText(goog.debug.exposeException(c, arguments.callee.caller)));
  return d
};
goog.debug.Logger.prototype.shout = function(a, b) {
  this.log(goog.debug.Logger.Level.SHOUT, a, b)
};
goog.debug.Logger.prototype.severe = function(a, b) {
  this.log(goog.debug.Logger.Level.SEVERE, a, b)
};
goog.debug.Logger.prototype.warning = function(a, b) {
  this.log(goog.debug.Logger.Level.WARNING, a, b)
};
goog.debug.Logger.prototype.info = function(a, b) {
  this.log(goog.debug.Logger.Level.INFO, a, b)
};
goog.debug.Logger.prototype.config = function(a, b) {
  this.log(goog.debug.Logger.Level.CONFIG, a, b)
};
goog.debug.Logger.prototype.fine = function(a, b) {
  this.log(goog.debug.Logger.Level.FINE, a, b)
};
goog.debug.Logger.prototype.finer = function(a, b) {
  this.log(goog.debug.Logger.Level.FINER, a, b)
};
goog.debug.Logger.prototype.finest = function(a, b) {
  this.log(goog.debug.Logger.Level.FINEST, a, b)
};
goog.debug.Logger.prototype.logRecord = function(a) {
  this.isLoggable(a.getLevel()) && this.doLogRecord_(a)
};
goog.debug.Logger.prototype.doLogRecord_ = function(a) {
  goog.debug.Logger.logToProfilers("log:" + a.getMessage());
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    for(var b = this;b;) {
      b.callPublish_(a), b = b.getParent()
    }
  }else {
    for(var b = 0, c;c = goog.debug.Logger.rootHandlers_[b++];) {
      c(a)
    }
  }
};
goog.debug.Logger.prototype.callPublish_ = function(a) {
  if(this.handlers_) {
    for(var b = 0, c;c = this.handlers_[b];b++) {
      c(a)
    }
  }
};
goog.debug.Logger.prototype.setParent_ = function(a) {
  this.parent_ = a
};
goog.debug.Logger.prototype.addChild_ = function(a, b) {
  this.getChildren()[a] = b
};
goog.debug.LogManager = {};
goog.debug.LogManager.loggers_ = {};
goog.debug.LogManager.rootLogger_ = null;
goog.debug.LogManager.initialize = function() {
  goog.debug.LogManager.rootLogger_ || (goog.debug.LogManager.rootLogger_ = new goog.debug.Logger(""), goog.debug.LogManager.loggers_[""] = goog.debug.LogManager.rootLogger_, goog.debug.LogManager.rootLogger_.setLevel(goog.debug.Logger.Level.CONFIG))
};
goog.debug.LogManager.getLoggers = function() {
  return goog.debug.LogManager.loggers_
};
goog.debug.LogManager.getRoot = function() {
  goog.debug.LogManager.initialize();
  return goog.debug.LogManager.rootLogger_
};
goog.debug.LogManager.getLogger = function(a) {
  goog.debug.LogManager.initialize();
  return goog.debug.LogManager.loggers_[a] || goog.debug.LogManager.createLogger_(a)
};
goog.debug.LogManager.createFunctionForCatchErrors = function(a) {
  return function(b) {
    (a || goog.debug.LogManager.getRoot()).severe("Error: " + b.message + " (" + b.fileName + " @ Line: " + b.line + ")")
  }
};
goog.debug.LogManager.createLogger_ = function(a) {
  var b = new goog.debug.Logger(a);
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var c = a.lastIndexOf("."), d = a.substr(0, c), c = a.substr(c + 1), d = goog.debug.LogManager.getLogger(d);
    d.addChild_(c, b);
    b.setParent_(d)
  }
  return goog.debug.LogManager.loggers_[a] = b
};
// Input 110
goog.structs.SimplePool = function(a, b) {
  goog.Disposable.call(this);
  this.maxCount_ = b;
  this.freeQueue_ = [];
  this.createInitial_(a)
};
goog.inherits(goog.structs.SimplePool, goog.Disposable);
goog.structs.SimplePool.prototype.createObjectFn_ = null;
goog.structs.SimplePool.prototype.disposeObjectFn_ = null;
goog.structs.SimplePool.prototype.setCreateObjectFn = function(a) {
  this.createObjectFn_ = a
};
goog.structs.SimplePool.prototype.setDisposeObjectFn = function(a) {
  this.disposeObjectFn_ = a
};
goog.structs.SimplePool.prototype.getObject = function() {
  return this.freeQueue_.length ? this.freeQueue_.pop() : this.createObject()
};
goog.structs.SimplePool.prototype.releaseObject = function(a) {
  this.freeQueue_.length < this.maxCount_ ? this.freeQueue_.push(a) : this.disposeObject(a)
};
goog.structs.SimplePool.prototype.createInitial_ = function(a) {
  if(a > this.maxCount_) {
    throw Error("[goog.structs.SimplePool] Initial cannot be greater than max");
  }
  for(var b = 0;b < a;b++) {
    this.freeQueue_.push(this.createObject())
  }
};
goog.structs.SimplePool.prototype.createObject = function() {
  return this.createObjectFn_ ? this.createObjectFn_() : {}
};
goog.structs.SimplePool.prototype.disposeObject = function(a) {
  if(this.disposeObjectFn_) {
    this.disposeObjectFn_(a)
  }else {
    if(goog.isObject(a)) {
      if(goog.isFunction(a.dispose)) {
        a.dispose()
      }else {
        for(var b in a) {
          delete a[b]
        }
      }
    }
  }
};
goog.structs.SimplePool.prototype.disposeInternal = function() {
  goog.structs.SimplePool.superClass_.disposeInternal.call(this);
  for(var a = this.freeQueue_;a.length;) {
    this.disposeObject(a.pop())
  }
  delete this.freeQueue_
};
// Input 111
goog.debug.Trace_ = function() {
  this.events_ = [];
  this.outstandingEvents_ = new goog.structs.Map;
  this.tracerOverheadComment_ = this.tracerOverheadEnd_ = this.tracerOverheadStart_ = this.startTime_ = 0;
  this.stats_ = new goog.structs.Map;
  this.commentCount_ = this.tracerCount_ = 0;
  this.nextId_ = 1;
  this.eventPool_ = new goog.structs.SimplePool(0, 4E3);
  this.eventPool_.createObject = function() {
    return new goog.debug.Trace_.Event_
  };
  this.statPool_ = new goog.structs.SimplePool(0, 50);
  this.statPool_.createObject = function() {
    return new goog.debug.Trace_.Stat_
  };
  var a = this;
  this.idPool_ = new goog.structs.SimplePool(0, 2E3);
  this.idPool_.createObject = function() {
    return String(a.nextId_++)
  };
  this.idPool_.disposeObject = function() {
  };
  this.defaultThreshold_ = 3
};
goog.debug.Trace_.prototype.logger_ = goog.debug.Logger.getLogger("goog.debug.Trace");
goog.debug.Trace_.prototype.MAX_TRACE_SIZE = 1E3;
goog.debug.Trace_.EventType = {START:0, STOP:1, COMMENT:2};
goog.debug.Trace_.Stat_ = function() {
  this.varAlloc = this.time = this.count = 0
};
goog.debug.Trace_.Stat_.prototype.toString = function() {
  var a = [];
  a.push(this.type, " ", this.count, " (", Math.round(10 * this.time) / 10, " ms)");
  this.varAlloc && a.push(" [VarAlloc = ", this.varAlloc, "]");
  return a.join("")
};
goog.debug.Trace_.Event_ = function() {
};
goog.debug.Trace_.Event_.prototype.toTraceString = function(a, b, c) {
  var d = [];
  -1 == b ? d.push("    ") : d.push(goog.debug.Trace_.longToPaddedString_(this.eventTime - b));
  d.push(" ", goog.debug.Trace_.formatTime_(this.eventTime - a));
  this.eventType == goog.debug.Trace_.EventType.START ? d.push(" Start        ") : this.eventType == goog.debug.Trace_.EventType.STOP ? (d.push(" Done "), d.push(goog.debug.Trace_.longToPaddedString_(this.stopTime - this.startTime), " ms ")) : d.push(" Comment      ");
  d.push(c, this);
  0 < this.totalVarAlloc && d.push("[VarAlloc ", this.totalVarAlloc, "] ");
  return d.join("")
};
goog.debug.Trace_.Event_.prototype.toString = function() {
  return null == this.type ? this.comment : "[" + this.type + "] " + this.comment
};
goog.debug.Trace_.prototype.setStartTime = function(a) {
  this.startTime_ = a
};
goog.debug.Trace_.prototype.initCurrentTrace = function(a) {
  this.reset(a)
};
goog.debug.Trace_.prototype.clearCurrentTrace = function() {
  this.reset(0)
};
goog.debug.Trace_.prototype.reset = function(a) {
  this.defaultThreshold_ = a;
  for(a = 0;a < this.events_.length;a++) {
    var b = this.eventPool_.id;
    b && this.idPool_.releaseObject(b);
    this.eventPool_.releaseObject(this.events_[a])
  }
  this.events_.length = 0;
  this.outstandingEvents_.clear();
  this.startTime_ = goog.debug.Trace_.now();
  this.commentCount_ = this.tracerCount_ = this.tracerOverheadComment_ = this.tracerOverheadEnd_ = this.tracerOverheadStart_ = 0;
  b = this.stats_.getKeys();
  for(a = 0;a < b.length;a++) {
    var c = this.stats_.get(b[a]);
    c.count = 0;
    c.time = 0;
    c.varAlloc = 0;
    this.statPool_.releaseObject(c)
  }
  this.stats_.clear()
};
goog.debug.Trace_.prototype.startTracer = function(a, b) {
  var c = goog.debug.Trace_.now(), d = this.getTotalVarAlloc(), e = this.outstandingEvents_.getCount();
  if(this.events_.length + e > this.MAX_TRACE_SIZE) {
    this.logger_.warning("Giant thread trace. Clearing to avoid memory leak.");
    if(this.events_.length > this.MAX_TRACE_SIZE / 2) {
      for(var f = 0;f < this.events_.length;f++) {
        var g = this.events_[f];
        g.id && this.idPool_.releaseObject(g.id);
        this.eventPool_.releaseObject(g)
      }
      this.events_.length = 0
    }
    e > this.MAX_TRACE_SIZE / 2 && this.outstandingEvents_.clear()
  }
  goog.debug.Logger.logToProfilers("Start : " + a);
  g = this.eventPool_.getObject();
  g.totalVarAlloc = d;
  g.eventType = goog.debug.Trace_.EventType.START;
  g.id = Number(this.idPool_.getObject());
  g.comment = a;
  g.type = b;
  this.events_.push(g);
  this.outstandingEvents_.set(String(g.id), g);
  this.tracerCount_++;
  d = goog.debug.Trace_.now();
  g.startTime = g.eventTime = d;
  this.tracerOverheadStart_ += d - c;
  return g.id
};
goog.debug.Trace_.prototype.stopTracer = function(a, b) {
  var c = goog.debug.Trace_.now(), d;
  d = 0 === b ? 0 : b ? b : this.defaultThreshold_;
  var e = this.outstandingEvents_.get(String(a));
  if(null == e) {
    return null
  }
  this.outstandingEvents_.remove(String(a));
  var f, g = c - e.startTime;
  if(g < d) {
    for(d = this.events_.length - 1;0 <= d;d--) {
      if(this.events_[d] == e) {
        this.events_.splice(d, 1);
        this.idPool_.releaseObject(e.id);
        this.eventPool_.releaseObject(e);
        break
      }
    }
  }else {
    f = this.eventPool_.getObject(), f.eventType = goog.debug.Trace_.EventType.STOP, f.startTime = e.startTime, f.comment = e.comment, f.type = e.type, f.stopTime = f.eventTime = c, this.events_.push(f)
  }
  d = e.type;
  var h = null;
  d && (h = this.getStat_(d), h.count++, h.time += g);
  f && (goog.debug.Logger.logToProfilers("Stop : " + f.comment), f.totalVarAlloc = this.getTotalVarAlloc(), h && (h.varAlloc += f.totalVarAlloc - e.totalVarAlloc));
  e = goog.debug.Trace_.now();
  this.tracerOverheadEnd_ += e - c;
  return g
};
goog.debug.Trace_.prototype.setGcTracer = function(a) {
  this.gcTracer_ = a
};
goog.debug.Trace_.prototype.getTotalVarAlloc = function() {
  var a = this.gcTracer_;
  return a && a.isTracing() ? a.totalVarAlloc : -1
};
goog.debug.Trace_.prototype.addComment = function(a, b, c) {
  var d = goog.debug.Trace_.now(), e = c ? c : d, f = this.eventPool_.getObject();
  f.eventType = goog.debug.Trace_.EventType.COMMENT;
  f.eventTime = e;
  f.type = b;
  f.comment = a;
  f.totalVarAlloc = this.getTotalVarAlloc();
  this.commentCount_++;
  if(c) {
    a = this.events_.length;
    for(b = 0;b < a;b++) {
      if(this.events_[b].eventTime > e) {
        goog.array.insertAt(this.events_, f, b);
        break
      }
    }
    b == a && this.events_.push(f)
  }else {
    this.events_.push(f)
  }
  (e = f.type) && this.getStat_(e).count++;
  this.tracerOverheadComment_ += goog.debug.Trace_.now() - d
};
goog.debug.Trace_.prototype.getStat_ = function(a) {
  var b = this.stats_.get(a);
  b || (b = this.statPool_.getObject(), b.type = a, this.stats_.set(a, b));
  return b
};
goog.debug.Trace_.prototype.getFormattedTrace = function() {
  return this.toString()
};
goog.debug.Trace_.prototype.toString = function() {
  for(var a = [], b = -1, c = [], d = 0;d < this.events_.length;d++) {
    var e = this.events_[d];
    e.eventType == goog.debug.Trace_.EventType.STOP && c.pop();
    a.push(" ", e.toTraceString(this.startTime_, b, c.join("")));
    b = e.eventTime;
    a.push("\n");
    e.eventType == goog.debug.Trace_.EventType.START && c.push("|  ")
  }
  if(0 != this.outstandingEvents_.getCount()) {
    var f = goog.debug.Trace_.now();
    a.push(" Unstopped timers:\n");
    goog.iter.forEach(this.outstandingEvents_, function(b) {
      a.push("  ", b, " (", f - b.startTime, " ms, started at ", goog.debug.Trace_.formatTime_(b.startTime), ")\n")
    })
  }
  b = this.stats_.getKeys();
  for(d = 0;d < b.length;d++) {
    c = this.stats_.get(b[d]), 1 < c.count && a.push(" TOTAL ", c, "\n")
  }
  a.push("Total tracers created ", this.tracerCount_, "\n", "Total comments created ", this.commentCount_, "\n", "Overhead start: ", this.tracerOverheadStart_, " ms\n", "Overhead end: ", this.tracerOverheadEnd_, " ms\n", "Overhead comment: ", this.tracerOverheadComment_, " ms\n");
  return a.join("")
};
goog.debug.Trace_.longToPaddedString_ = function(a) {
  a = Math.round(a);
  var b = "";
  1E3 > a && (b = " ");
  100 > a && (b = "  ");
  10 > a && (b = "   ");
  return b + a
};
goog.debug.Trace_.formatTime_ = function(a) {
  a = Math.round(a);
  var b = a % 1E3;
  return String(100 + a / 1E3 % 60).substring(1, 3) + "." + String(1E3 + b).substring(1, 4)
};
goog.debug.Trace_.now = function() {
  return goog.now()
};
goog.debug.Trace = new goog.debug.Trace_;
// Input 112
goog.debug.ErrorHandler = function(a) {
  goog.Disposable.call(this);
  this.errorHandlerFn_ = a
};
goog.inherits(goog.debug.ErrorHandler, goog.Disposable);
goog.debug.ErrorHandler.prototype.addTracersToProtectedFunctions_ = !1;
goog.debug.ErrorHandler.prototype.setAddTracersToProtectedFunctions = function(a) {
  this.addTracersToProtectedFunctions_ = a
};
goog.debug.ErrorHandler.prototype.wrap = function(a) {
  return this.protectEntryPoint(goog.asserts.assertFunction(a))
};
goog.debug.ErrorHandler.prototype.unwrap = function(a) {
  goog.asserts.assertFunction(a);
  return a[this.getFunctionIndex_(!1)] || a
};
goog.debug.ErrorHandler.prototype.getStackTraceHolder_ = function(a) {
  var b = [];
  b.push("##PE_STACK_START##");
  b.push(a.replace(/(\r\n|\r|\n)/g, "##STACK_BR##"));
  b.push("##PE_STACK_END##");
  return b.join("")
};
goog.debug.ErrorHandler.prototype.getFunctionIndex_ = function(a) {
  return(a ? "__wrapper_" : "__protected_") + goog.getUid(this) + "__"
};
goog.debug.ErrorHandler.prototype.protectEntryPoint = function(a) {
  var b = this.getFunctionIndex_(!0);
  a[b] || ((a[b] = this.getProtectedFunction(a))[this.getFunctionIndex_(!1)] = a);
  return a[b]
};
goog.debug.ErrorHandler.prototype.getProtectedFunction = function(a) {
  var b = this, c = this.addTracersToProtectedFunctions_;
  if(c) {
    var d = goog.debug.getStacktraceSimple(15)
  }
  var e = function() {
    if(b.isDisposed()) {
      return a.apply(this, arguments)
    }
    if(c) {
      var e = goog.debug.Trace.startTracer("protectedEntryPoint: " + b.getStackTraceHolder_(d))
    }
    try {
      return a.apply(this, arguments)
    }catch(g) {
      throw b.errorHandlerFn_(g), new goog.debug.ErrorHandler.ProtectedFunctionError(g);
    }finally {
      c && goog.debug.Trace.stopTracer(e)
    }
  };
  e[this.getFunctionIndex_(!1)] = a;
  return e
};
goog.debug.ErrorHandler.prototype.protectWindowSetTimeout = function() {
  this.protectWindowFunctionsHelper_("setTimeout")
};
goog.debug.ErrorHandler.prototype.protectWindowSetInterval = function() {
  this.protectWindowFunctionsHelper_("setInterval")
};
goog.debug.ErrorHandler.prototype.protectWindowFunctionsHelper_ = function(a) {
  var b = goog.getObjectByName("window"), c = b[a], d = this;
  b[a] = function(a, b) {
    goog.isString(a) && (a = goog.partial(goog.globalEval, a));
    a = d.protectEntryPoint(a);
    return c.call ? c.call(this, a, b) : c(a, b)
  };
  b[a][this.getFunctionIndex_(!1)] = c
};
goog.debug.ErrorHandler.prototype.disposeInternal = function() {
  var a = goog.getObjectByName("window");
  a.setTimeout = this.unwrap(a.setTimeout);
  a.setInterval = this.unwrap(a.setInterval);
  goog.debug.ErrorHandler.superClass_.disposeInternal.call(this)
};
goog.debug.ErrorHandler.ProtectedFunctionError = function(a) {
  goog.debug.Error.call(this, goog.debug.ErrorHandler.ProtectedFunctionError.MESSAGE_PREFIX + (a && a.message ? String(a.message) : String(a)));
  if((a = (this.cause = a) && a.stack) && goog.isString(a)) {
    this.stack = a
  }
};
goog.inherits(goog.debug.ErrorHandler.ProtectedFunctionError, goog.debug.Error);
goog.debug.ErrorHandler.ProtectedFunctionError.MESSAGE_PREFIX = "Error in protected function: ";
// Input 113
wtf.util.pad0 = function(a, b) {
  for(a = String(a);a.length < b;) {
    a = "0" + a
  }
  return a
};
wtf.util.formatTime = function(a) {
  return a.toFixed(3) + "ms"
};
wtf.util.formatSmallTime = function(a) {
  return 0 == a ? "0ms" : 1 > a ? a.toFixed(3) + "ms" : 10 > a ? a.toFixed(2) + "ms" : a.toFixed(0) + "ms"
};
wtf.util.formatWallTime = function(a) {
  var b = new Date(a);
  return"" + goog.string.padNumber(b.getHours(), 2) + ":" + goog.string.padNumber(b.getMinutes(), 2) + ":" + goog.string.padNumber(b.getSeconds(), 2) + "." + String((b.getMilliseconds() / 1E3).toFixed(3)).slice(2, 5) + "." + goog.string.padNumber(Math.floor(1E4 * (a - Math.floor(a))), 4)
};
wtf.util.addArgumentLines = function(a, b) {
  if(b) {
    for(var c in b) {
      var d = b[c];
      if(void 0 !== d) {
        if(null === d) {
          d = "null"
        }else {
          if(goog.isArray(d)) {
            d = "[" + d + "]"
          }else {
            if(d.buffer && d.buffer instanceof ArrayBuffer) {
              for(var e = "[", f = 0;f < Math.min(d.length, 16);f++) {
                f && (e += ","), e += d[f]
              }
              16 < d.length && (e += " ...");
              d = e += "]"
            }else {
              goog.isObject(d) && (d = goog.global.JSON.stringify(d))
            }
          }
        }
        a.push(c + ": " + d)
      }
    }
  }
};
wtf.util.getCompiledMemberName = function(a, b) {
  var c = null, d;
  for(d in a) {
    if(a[d] === b) {
      if(c) {
        return goog.asserts.fail("duplicate members found"), null
      }
      c = d
    }
  }
  return c
};
wtf.util.callWhenDomReady = function(a, b) {
  if("complete" == document.readyState || "interactive" == document.readyState) {
    a.call(b)
  }else {
    if(document.addEventListener) {
      var c = function() {
        document.removeEventListener("DOMContentLoaded", c, !1);
        a.call(b)
      };
      c.__wtf_ignore__ = !0;
      document.addEventListener("DOMContentLoaded", c, !1)
    }else {
      document.attachEvent && (c = function() {
        document.detachEvent("onload", c);
        a.call(b)
      }, c.__wtf_ignore__ = !0, document.attachEvent("onload", c))
    }
  }
};
wtf.util.convertAsciiStringToUint8Array = function(a) {
  for(var b = new Uint8Array(a.length), c = 0;c < b.length;c++) {
    b[c] = a.charCodeAt(c) & 255
  }
  return b
};
goog.exportSymbol("wtf.util.formatTime", wtf.util.formatTime);
goog.exportSymbol("wtf.util.formatSmallTime", wtf.util.formatSmallTime);
goog.exportSymbol("wtf.util.formatWallTime", wtf.util.formatWallTime);
// Input 114
wtf.analysis.exports = {};
wtf.analysis.exports.ENABLE_EXPORTS = !0;
// Input 115
goog.events.EventHandler = function(a) {
  goog.Disposable.call(this);
  this.handler_ = a;
  this.keys_ = []
};
goog.inherits(goog.events.EventHandler, goog.Disposable);
goog.events.EventHandler.typeArray_ = [];
goog.events.EventHandler.prototype.listen = function(a, b, c, d, e) {
  goog.isArray(b) || (goog.events.EventHandler.typeArray_[0] = b, b = goog.events.EventHandler.typeArray_);
  for(var f = 0;f < b.length;f++) {
    var g = goog.events.listen(a, b[f], c || this, d || !1, e || this.handler_ || this);
    this.keys_.push(g)
  }
  return this
};
goog.events.EventHandler.prototype.listenOnce = function(a, b, c, d, e) {
  if(goog.isArray(b)) {
    for(var f = 0;f < b.length;f++) {
      this.listenOnce(a, b[f], c, d, e)
    }
  }else {
    a = goog.events.listenOnce(a, b, c || this, d, e || this.handler_ || this), this.keys_.push(a)
  }
  return this
};
goog.events.EventHandler.prototype.listenWithWrapper = function(a, b, c, d, e) {
  b.listen(a, c, d, e || this.handler_ || this, this);
  return this
};
goog.events.EventHandler.prototype.getListenerCount = function() {
  return this.keys_.length
};
goog.events.EventHandler.prototype.unlisten = function(a, b, c, d, e) {
  if(goog.isArray(b)) {
    for(var f = 0;f < b.length;f++) {
      this.unlisten(a, b[f], c, d, e)
    }
  }else {
    if(a = goog.events.getListener(a, b, c || this, d, e || this.handler_ || this)) {
      a = a.key, goog.events.unlistenByKey(a), goog.array.remove(this.keys_, a)
    }
  }
  return this
};
goog.events.EventHandler.prototype.unlistenWithWrapper = function(a, b, c, d, e) {
  b.unlisten(a, c, d, e || this.handler_ || this, this);
  return this
};
goog.events.EventHandler.prototype.removeAll = function() {
  goog.array.forEach(this.keys_, goog.events.unlistenByKey);
  this.keys_.length = 0
};
goog.events.EventHandler.prototype.disposeInternal = function() {
  goog.events.EventHandler.superClass_.disposeInternal.call(this);
  this.removeAll()
};
goog.events.EventHandler.prototype.handleEvent = function() {
  throw Error("EventHandler.handleEvent not implemented");
};
// Input 116
wtf.analysis.node = function() {
};
// Input 117
goog.net = {};
goog.net.HttpStatus = {CONTINUE:100, SWITCHING_PROTOCOLS:101, OK:200, CREATED:201, ACCEPTED:202, NON_AUTHORITATIVE_INFORMATION:203, NO_CONTENT:204, RESET_CONTENT:205, PARTIAL_CONTENT:206, MULTIPLE_CHOICES:300, MOVED_PERMANENTLY:301, FOUND:302, SEE_OTHER:303, NOT_MODIFIED:304, USE_PROXY:305, TEMPORARY_REDIRECT:307, BAD_REQUEST:400, UNAUTHORIZED:401, PAYMENT_REQUIRED:402, FORBIDDEN:403, NOT_FOUND:404, METHOD_NOT_ALLOWED:405, NOT_ACCEPTABLE:406, PROXY_AUTHENTICATION_REQUIRED:407, REQUEST_TIMEOUT:408, 
CONFLICT:409, GONE:410, LENGTH_REQUIRED:411, PRECONDITION_FAILED:412, REQUEST_ENTITY_TOO_LARGE:413, REQUEST_URI_TOO_LONG:414, UNSUPPORTED_MEDIA_TYPE:415, REQUEST_RANGE_NOT_SATISFIABLE:416, EXPECTATION_FAILED:417, INTERNAL_SERVER_ERROR:500, NOT_IMPLEMENTED:501, BAD_GATEWAY:502, SERVICE_UNAVAILABLE:503, GATEWAY_TIMEOUT:504, HTTP_VERSION_NOT_SUPPORTED:505, QUIRK_IE_NO_CONTENT:1223};
goog.net.HttpStatus.isSuccess = function(a) {
  switch(a) {
    case goog.net.HttpStatus.OK:
    ;
    case goog.net.HttpStatus.CREATED:
    ;
    case goog.net.HttpStatus.ACCEPTED:
    ;
    case goog.net.HttpStatus.NO_CONTENT:
    ;
    case goog.net.HttpStatus.PARTIAL_CONTENT:
    ;
    case goog.net.HttpStatus.NOT_MODIFIED:
    ;
    case goog.net.HttpStatus.QUIRK_IE_NO_CONTENT:
      return!0;
    default:
      return!1
  }
};
// Input 118
goog.net.XmlHttpFactory = function() {
};
goog.net.XmlHttpFactory.prototype.cachedOptions_ = null;
goog.net.XmlHttpFactory.prototype.getOptions = function() {
  return this.cachedOptions_ || (this.cachedOptions_ = this.internalGetOptions())
};
// Input 119
goog.net.WrapperXmlHttpFactory = function(a, b) {
  goog.net.XmlHttpFactory.call(this);
  this.xhrFactory_ = a;
  this.optionsFactory_ = b
};
goog.inherits(goog.net.WrapperXmlHttpFactory, goog.net.XmlHttpFactory);
goog.net.WrapperXmlHttpFactory.prototype.createInstance = function() {
  return this.xhrFactory_()
};
goog.net.WrapperXmlHttpFactory.prototype.getOptions = function() {
  return this.optionsFactory_()
};
// Input 120
goog.net.XmlHttp = function() {
  return goog.net.XmlHttp.factory_.createInstance()
};
goog.net.XmlHttp.ASSUME_NATIVE_XHR = !1;
goog.net.XmlHttp.getOptions = function() {
  return goog.net.XmlHttp.factory_.getOptions()
};
goog.net.XmlHttp.OptionType = {USE_NULL_FUNCTION:0, LOCAL_REQUEST_ERROR:1};
goog.net.XmlHttp.ReadyState = {UNINITIALIZED:0, LOADING:1, LOADED:2, INTERACTIVE:3, COMPLETE:4};
goog.net.XmlHttp.setFactory = function(a, b) {
  goog.net.XmlHttp.setGlobalFactory(new goog.net.WrapperXmlHttpFactory(a, b))
};
goog.net.XmlHttp.setGlobalFactory = function(a) {
  goog.net.XmlHttp.factory_ = a
};
goog.net.DefaultXmlHttpFactory = function() {
  goog.net.XmlHttpFactory.call(this)
};
goog.inherits(goog.net.DefaultXmlHttpFactory, goog.net.XmlHttpFactory);
goog.net.DefaultXmlHttpFactory.prototype.createInstance = function() {
  var a = this.getProgId_();
  return a ? new ActiveXObject(a) : new XMLHttpRequest
};
goog.net.DefaultXmlHttpFactory.prototype.internalGetOptions = function() {
  var a = {};
  this.getProgId_() && (a[goog.net.XmlHttp.OptionType.USE_NULL_FUNCTION] = !0, a[goog.net.XmlHttp.OptionType.LOCAL_REQUEST_ERROR] = !0);
  return a
};
goog.net.DefaultXmlHttpFactory.prototype.getProgId_ = function() {
  if(goog.net.XmlHttp.ASSUME_NATIVE_XHR) {
    return""
  }
  if(!this.ieProgId_ && "undefined" == typeof XMLHttpRequest && "undefined" != typeof ActiveXObject) {
    for(var a = ["MSXML2.XMLHTTP.6.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"], b = 0;b < a.length;b++) {
      var c = a[b];
      try {
        return new ActiveXObject(c), this.ieProgId_ = c
      }catch(d) {
      }
    }
    throw Error("Could not create ActiveXObject. ActiveX might be disabled, or MSXML might not be installed");
  }
  return this.ieProgId_
};
goog.net.XmlHttp.setGlobalFactory(new goog.net.DefaultXmlHttpFactory);
// Input 121
goog.result = {};
goog.result.Result = function() {
};
goog.result.Result.prototype.wait = function() {
};
goog.result.Result.State = {SUCCESS:"success", ERROR:"error", PENDING:"pending"};
goog.result.Result.prototype.getState = function() {
};
goog.result.Result.prototype.getValue = function() {
};
goog.result.Result.prototype.getError = function() {
};
goog.result.Result.prototype.cancel = function() {
};
goog.result.Result.prototype.isCanceled = function() {
};
goog.result.Result.CancelError = function(a) {
  goog.debug.Error.call(this, a || "Result canceled")
};
goog.inherits(goog.result.Result.CancelError, goog.debug.Error);
// Input 122
goog.result.SimpleResult = function() {
  this.state_ = goog.result.Result.State.PENDING;
  this.handlers_ = [];
  this.error_ = this.value_ = void 0
};
goog.result.SimpleResult.StateError = function() {
  goog.debug.Error.call(this, "Multiple attempts to set the state of this Result")
};
goog.inherits(goog.result.SimpleResult.StateError, goog.debug.Error);
goog.result.SimpleResult.prototype.getState = function() {
  return this.state_
};
goog.result.SimpleResult.prototype.getValue = function() {
  return this.value_
};
goog.result.SimpleResult.prototype.getError = function() {
  return this.error_
};
goog.result.SimpleResult.prototype.wait = function(a) {
  this.isPending_() ? this.handlers_.push(a) : a(this)
};
goog.result.SimpleResult.prototype.setValue = function(a) {
  if(this.isPending_()) {
    this.value_ = a, this.state_ = goog.result.Result.State.SUCCESS, this.callHandlers_()
  }else {
    if(!this.isCanceled()) {
      throw new goog.result.SimpleResult.StateError;
    }
  }
};
goog.result.SimpleResult.prototype.setError = function(a) {
  if(this.isPending_()) {
    this.error_ = a, this.state_ = goog.result.Result.State.ERROR, this.callHandlers_()
  }else {
    if(!this.isCanceled()) {
      throw new goog.result.SimpleResult.StateError;
    }
  }
};
goog.result.SimpleResult.prototype.callHandlers_ = function() {
  for(;this.handlers_.length;) {
    this.handlers_.shift()(this)
  }
};
goog.result.SimpleResult.prototype.isPending_ = function() {
  return this.state_ == goog.result.Result.State.PENDING
};
goog.result.SimpleResult.prototype.cancel = function() {
  return this.isPending_() ? (this.setError(new goog.result.Result.CancelError), !0) : !1
};
goog.result.SimpleResult.prototype.isCanceled = function() {
  return this.state_ == goog.result.Result.State.ERROR && this.error_ instanceof goog.result.Result.CancelError
};
// Input 123
goog.result.wait = function(a, b, c) {
  a.wait(c ? goog.bind(b, c) : b)
};
goog.result.waitOnSuccess = function(a, b, c) {
  goog.result.wait(a, function(a) {
    a.getState() == goog.result.Result.State.SUCCESS && b.call(this, a.getValue(), a)
  }, c)
};
goog.result.waitOnError = function(a, b, c) {
  goog.result.wait(a, function(a) {
    a.getState() == goog.result.Result.State.ERROR && b.call(this, a)
  }, c)
};
goog.result.transform = function(a, b) {
  var c = new goog.result.SimpleResult;
  goog.result.wait(a, function(a) {
    a.getState() == goog.result.Result.State.SUCCESS ? c.setValue(b(a.getValue())) : c.setError(a.getError())
  });
  return c
};
goog.result.chain = function(a, b) {
  var c = new goog.result.SimpleResult;
  goog.result.wait(a, function(a) {
    a.getState() == goog.result.Result.State.SUCCESS ? (a = b(a), goog.result.wait(a, function(a) {
      a.getState() == goog.result.Result.State.SUCCESS ? c.setValue(a.getValue()) : c.setError(a.getError())
    })) : c.setError(a.getError())
  });
  return c
};
goog.result.combine = function(a) {
  var b = goog.array.clone(arguments), c = new goog.result.SimpleResult, d = function(a) {
    return a.getState() != goog.result.Result.State.PENDING
  }, e = function() {
    c.getState() == goog.result.Result.State.PENDING && goog.array.every(b, d) && c.setValue(b)
  };
  goog.array.forEach(b, function(a) {
    goog.result.wait(a, e)
  });
  return c
};
goog.result.combineOnSuccess = function(a) {
  var b = new goog.result.SimpleResult, c = function(a) {
    return a.getState() == goog.result.Result.State.SUCCESS
  };
  goog.result.wait(goog.result.combine.apply(goog.result.combine, arguments), function(a) {
    a = a.getValue();
    goog.array.every(a, c) ? b.setValue(a) : b.setError(a)
  });
  return b
};
// Input 124
goog.labs = {};
goog.labs.net = {};
goog.labs.net.xhr = {};
goog.labs.net.xhr.CONTENT_TYPE_HEADER = "Content-Type";
goog.labs.net.xhr.FORM_CONTENT_TYPE = "application/x-www-form-urlencoded;charset=utf-8";
goog.labs.net.xhr.get = function(a, b) {
  var c = goog.labs.net.xhr.send("GET", a, null, b);
  return goog.result.transform(c, goog.labs.net.xhr.getResponseText_)
};
goog.labs.net.xhr.post = function(a, b, c) {
  a = goog.labs.net.xhr.send("POST", a, b, c);
  return goog.result.transform(a, goog.labs.net.xhr.getResponseText_)
};
goog.labs.net.xhr.getJson = function(a, b) {
  var c = goog.labs.net.xhr.send("GET", a, null, b);
  return goog.labs.net.xhr.addJsonParsingCallbacks_(c, b)
};
goog.labs.net.xhr.postJson = function(a, b, c) {
  a = goog.labs.net.xhr.send("POST", a, b, c);
  return goog.labs.net.xhr.addJsonParsingCallbacks_(a, c)
};
goog.labs.net.xhr.send = function(a, b, c, d) {
  var e = new goog.result.SimpleResult;
  goog.result.waitOnError(e, function(a) {
    a.isCanceled() && (f.abort(), f.onreadystatechange = goog.nullFunction)
  });
  var f = goog.labs.net.xhr.makeRequest(a, b, c, d, function(a) {
    e.setValue(a)
  }, function(a) {
    e.setError(a)
  });
  return e
};
goog.labs.net.xhr.makeRequest = function(a, b, c, d, e, f) {
  d = d || {};
  var g = e || goog.nullFunction, h = f || goog.nullFunction, i, j = goog.net.XmlHttp();
  try {
    j.open(a, b, !0)
  }catch(k) {
    return h(new goog.labs.net.xhr.Error("Error opening XHR: " + k.message, b, j)), j
  }
  j.onreadystatechange = function() {
    j.readyState == goog.net.XmlHttp.ReadyState.COMPLETE && (window.clearTimeout(i), goog.net.HttpStatus.isSuccess(j.status) || 0 === j.status && !goog.labs.net.xhr.isEffectiveSchemeHttp_(b) ? g(j) : h(new goog.labs.net.xhr.HttpError(j.status, b, j)))
  };
  e = !1;
  if(d.headers) {
    for(var m in d.headers) {
      j.setRequestHeader(m, d.headers[m])
    }
    e = goog.labs.net.xhr.CONTENT_TYPE_HEADER in d.headers
  }
  "POST" == a && !e && j.setRequestHeader(goog.labs.net.xhr.CONTENT_TYPE_HEADER, goog.labs.net.xhr.FORM_CONTENT_TYPE);
  d.withCredentials && (j.withCredentials = d.withCredentials);
  d.mimeType && j.overrideMimeType(d.mimeType);
  0 < d.timeoutMs && (i = window.setTimeout(function() {
    j.onreadystatechange = goog.nullFunction;
    j.abort();
    h(new goog.labs.net.xhr.TimeoutError(b, j))
  }, d.timeoutMs));
  try {
    j.send(c)
  }catch(l) {
    j.onreadystatechange = goog.nullFunction, window.clearTimeout(i), h(new goog.labs.net.xhr.Error("Error sending XHR: " + l.message, b, j))
  }
  return j
};
goog.labs.net.xhr.isEffectiveSchemeHttp_ = function(a) {
  a = goog.uri.utils.getEffectiveScheme(a);
  return"http" == a || "https" == a || "" == a
};
goog.labs.net.xhr.getResponseText_ = function(a) {
  return a.responseText
};
goog.labs.net.xhr.addJsonParsingCallbacks_ = function(a, b) {
  var c = goog.result.transform(a, goog.labs.net.xhr.getResponseText_), d = c;
  b && b.xssiPrefix && (d = goog.result.transform(c, goog.partial(goog.labs.net.xhr.stripXssiPrefix_, b.xssiPrefix)));
  return goog.result.transform(d, goog.json.parse)
};
goog.labs.net.xhr.stripXssiPrefix_ = function(a, b) {
  goog.string.startsWith(b, a) && (b = b.substring(a.length));
  return b
};
goog.labs.net.xhr.Error = function(a, b, c) {
  goog.debug.Error.call(this, a + ", url=" + b);
  this.url = b;
  this.xhr = c
};
goog.inherits(goog.labs.net.xhr.Error, goog.debug.Error);
goog.labs.net.xhr.Error.prototype.name = "XhrError";
goog.labs.net.xhr.HttpError = function(a, b, c) {
  goog.labs.net.xhr.Error.call(this, "Request Failed, status=" + a, b, c);
  this.status = a
};
goog.inherits(goog.labs.net.xhr.HttpError, goog.labs.net.xhr.Error);
goog.labs.net.xhr.HttpError.prototype.name = "XhrHttpError";
goog.labs.net.xhr.TimeoutError = function(a, b) {
  goog.labs.net.xhr.Error.call(this, "Request timed out", a, b)
};
goog.inherits(goog.labs.net.xhr.TimeoutError, goog.labs.net.xhr.Error);
goog.labs.net.xhr.TimeoutError.prototype.name = "XhrTimeoutError";
// Input 125
wtf.io.HttpWriteStream = function() {
  wtf.io.WriteStream.call(this)
};
goog.inherits(wtf.io.HttpWriteStream, wtf.io.WriteStream);
wtf.io.HttpWriteStream.prototype.postData = function(a, b, c) {
  var d = null;
  wtf.io.HAS_TYPED_ARRAYS && (goog.userAgent.product.CHROME ? d = c : c.length < c.buffer.byteLength ? (d = new Uint8Array(c.length), d.set(c), d = d.buffer) : d = c.buffer);
  goog.asserts.assert(d);
  return goog.labs.net.xhr.post(a, d, {headers:{"Content-Type":b}, mimeType:b})
};
// Input 126
wtf.io.BufferedHttpWriteStream = function(a) {
  wtf.io.HttpWriteStream.call(this);
  this.url_ = a;
  this.buffers_ = []
};
goog.inherits(wtf.io.BufferedHttpWriteStream, wtf.io.HttpWriteStream);
wtf.io.BufferedHttpWriteStream.prototype.disposeInternal = function() {
  this.flush();
  wtf.io.BufferedHttpWriteStream.superClass_.disposeInternal.call(this)
};
wtf.io.BufferedHttpWriteStream.prototype.write = function(a) {
  a = a.clone();
  this.buffers_.push(a);
  return!0
};
wtf.io.BufferedHttpWriteStream.prototype.flush = function() {
  for(var a = [], b = 0;b < this.buffers_.length;b++) {
    a.push(this.buffers_[b].data)
  }
  a = wtf.io.combineByteArrays(a);
  this.postData(this.url_, "application/x-extension-wtf-trace", a);
  this.buffers_.length = 0
};
// Input 127
wtf.io.CustomWriteStream = function(a) {
  wtf.io.WriteStream.call(this);
  goog.asserts.assert(a.write);
  this.target_ = a
};
goog.inherits(wtf.io.CustomWriteStream, wtf.io.WriteStream);
wtf.io.CustomWriteStream.prototype.disposeInternal = function() {
  this.target_.close && this.target_.close();
  wtf.io.CustomWriteStream.superClass_.disposeInternal.call(this)
};
wtf.io.CustomWriteStream.prototype.write = function(a, b, c) {
  return this.target_.write(a.data, a.offset, function() {
    b.call(c, a)
  })
};
wtf.io.CustomWriteStream.prototype.flush = function() {
  this.target_.flush && this.target_.flush()
};
// Input 128
wtf.io.LocalFileWriteStream = function(a) {
  wtf.io.WriteStream.call(this);
  var b = new Date, b = "-" + b.getFullYear() + goog.string.padNumber(b.getMonth() + 1, 2) + goog.string.padNumber(b.getDate(), 2) + "T" + goog.string.padNumber(b.getHours(), 2) + goog.string.padNumber(b.getMinutes(), 2) + goog.string.padNumber(b.getSeconds(), 2);
  this.filename_ = a + b + wtf.io.FILE_EXTENSION;
  this.bufferDatas_ = []
};
goog.inherits(wtf.io.LocalFileWriteStream, wtf.io.WriteStream);
wtf.io.LocalFileWriteStream.prototype.disposeInternal = function() {
  var a = wtf.pal.getPlatform();
  if(1 == this.bufferDatas_.length) {
    a.writeBinaryFile(this.filename_, this.bufferDatas_[0])
  }else {
    var b = wtf.io.combineByteArrays(this.bufferDatas_);
    a.writeBinaryFile(this.filename_, b)
  }
  this.bufferDatas_.length = 0;
  wtf.io.LocalFileWriteStream.superClass_.disposeInternal.call(this)
};
wtf.io.LocalFileWriteStream.prototype.write = function(a) {
  a = a.clone();
  this.bufferDatas_.push(a.data);
  return!0
};
wtf.io.LocalFileWriteStream.prototype.flush = function() {
};
// Input 129
wtf.io.NullWriteStream = function() {
  wtf.io.WriteStream.call(this)
};
goog.inherits(wtf.io.NullWriteStream, wtf.io.WriteStream);
wtf.io.NullWriteStream.prototype.write = function() {
  return!0
};
wtf.io.NullWriteStream.prototype.flush = function() {
};
// Input 130
wtf.io.StreamingHttpWriteStream = function(a) {
  wtf.io.HttpWriteStream.call(this);
  this.endpoint_ = a;
  this.sessionId_ = "" + (0 | 1073741824 * Math.random());
  this.streamId_ = "" + (0 | 1073741824 * Math.random());
  this.baseUrl_ = [this.endpoint_, "session", this.sessionId_, "stream", this.streamId_].join("/");
  this.createWaiter_ = goog.labs.net.xhr.post(this.baseUrl_ + "/create", "", {headers:{"X-Trace-Format":"application/x-extension-wtf-trace"}})
};
goog.inherits(wtf.io.StreamingHttpWriteStream, wtf.io.HttpWriteStream);
wtf.io.StreamingHttpWriteStream.prototype.disposeInternal = function() {
  wtf.io.StreamingHttpWriteStream.superClass_.disposeInternal.call(this)
};
wtf.io.StreamingHttpWriteStream.prototype.write = function(a, b, c) {
  var d = !0, e = null;
  wtf.io.HAS_TYPED_ARRAYS ? (d = !0, e = new Uint8Array(a.data.buffer, 0, a.offset)) : (d = !1, e = wtf.io.sliceByteArray(a.data, 0, a.offset));
  goog.asserts.assert(e);
  if(!d && this.createWaiter_.getState() == goog.result.Result.State.SUCCESS) {
    return this.postData(this.baseUrl_ + "/append", "application/octet-stream", e), !0
  }
  goog.result.wait(this.createWaiter_, function() {
    goog.asserts.assert(e);
    var d = this.postData(this.baseUrl_ + "/append", "application/octet-stream", e);
    goog.result.wait(d, function() {
      b.call(c, a)
    }, this)
  }, this);
  return!1
};
wtf.io.StreamingHttpWriteStream.prototype.flush = function() {
};
// Input 131
wtf.trace = {};
wtf.trace.EventType = function(a, b, c, d) {
  this.name = a;
  this.eventClass = b;
  this.flags = c;
  this.args = d || [];
  this.wireId = wtf.trace.EventType.nextEventWireId_++;
  goog.asserts.assert(this.wireId <= wtf.trace.EventType.MAX_EVENT_WIRE_ID_);
  this.append = null;
  this.count = 0
};
wtf.trace.EventType.MAX_EVENT_WIRE_ID_ = 65535;
wtf.trace.EventType.nextEventWireId_ = 1;
wtf.trace.EventType.prototype.toString = function() {
  return this.name
};
wtf.trace.EventType.prototype.getArgString = function() {
  if(!this.args.length) {
    return null
  }
  for(var a = [], b = 0;b < this.args.length;b++) {
    var c = this.args[b];
    a.push(c.typeName + " " + c.name)
  }
  return a.join(", ")
};
wtf.trace.EventType.prototype.generateCode = function(a, b) {
  this.append = a.generate(b, this)
};
wtf.trace.EventType.getNameMap = function() {
  var a = goog.reflect.object(wtf.trace.EventType, {count:0}), a = goog.object.transpose(a);
  return{count:a[0]}
};
// Input 132
wtf.trace.EventTypeBuilder = function() {
  wtf.util.FunctionBuilder.call(this);
  this.eventTypeNames_ = wtf.trace.EventType.getNameMap();
  this.bufferNames_ = wtf.io.Buffer.getNameMap()
};
goog.inherits(wtf.trace.EventTypeBuilder, wtf.util.FunctionBuilder);
wtf.trace.EventTypeBuilder.prototype.generate = function(a, b) {
  var c = wtf.trace.EventTypeBuilder.WRITERS_;
  this.begin();
  this.addScopeVariable("sessionPtr", a);
  this.addScopeVariable("eventType", b);
  this.addScopeVariable("now", wtf.now);
  this.addScopeVariable("writeFloat32", wtf.io.floatConverter.float32ToUint8Array);
  this.addScopeVariable("stringify", function(a) {
    var b = null;
    return b = "number" == typeof a ? "" + a : "boolean" == typeof a ? "" + a : a ? "string" == typeof a ? '"' + a + '"' : goog.global.JSON ? goog.global.JSON.stringify(a) : goog.json.serialize(a) : null
  });
  this.append("eventType." + this.eventTypeNames_.count + "++;");
  for(var d = 6, e = b.args, f = 0;f < e.length;f++) {
    var g = e[f];
    this.addArgument(g.name + "_");
    var h = c[g.typeName];
    goog.asserts.assert(h);
    d += h.size
  }
  this.append("var size = " + d + ";");
  for(f = 0;f < e.length;f++) {
    g = e[f], h = c[g.typeName], h.prepare && this.append.apply(this, h.prepare(g.name + "_"))
  }
  this.addArgument("opt_time");
  this.addArgument("opt_buffer");
  this.append("var time = opt_time || now();");
  this.append("var session = sessionPtr[0];");
  this.append("var buffer = opt_buffer;");
  this.append("if (!buffer && (!session || !(buffer = session.acquireBuffer(time, size)))) {", "  return undefined;", "}");
  this.append("var d = buffer." + this.bufferNames_.data + ";", "var o = buffer." + this.bufferNames_.offset + ";", "d[o++] = " + (b.wireId >> 8 & 255) + ";", "d[o++] = " + (b.wireId & 255) + ";", "var itime = (time * 1000) >>> 0;", "d[o++] = (itime >>> 24) & 0xFF;", "d[o++] = (itime >>> 16) & 0xFF;", "d[o++] = (itime >>> 8) & 0xFF;", "d[o++] = itime & 0xFF;");
  if(e.length) {
    this.append("var t = 0;");
    for(f = 0;f < e.length;f++) {
      g = e[f], h = c[g.typeName], this.append.apply(this, h.write(g.name + "_", this.bufferNames_))
    }
  }
  this.append("buffer." + this.bufferNames_.offset + " = o;");
  b.eventClass == wtf.data.EventClass.SCOPE && this.append("return session.enterTypedScope(time);");
  c = this.end(b.toString());
  c.eventType = b;
  return c
};
wtf.trace.EventTypeBuilder.WRITE_BOOL_ = {size:1, prepare:null, write:function() {
  return["d[o++] = a ? 1 : 0;"]
}};
wtf.trace.EventTypeBuilder.WRITE_INT8_ = {size:1, prepare:null, write:function(a) {
  return["d[o++] = " + a + " & 0xFF;"]
}};
wtf.trace.EventTypeBuilder.WRITE_INT8ARRAY_ = {size:0, prepare:function(a) {
  return["size += " + a + ".length;"]
}, write:function(a) {
  return["if (" + a + " && (t = " + a + ".length)) {", "  d[o++] = (t >>> 24) & 0xFF;", "  d[o++] = (t >>> 16) & 0xFF;", "  d[o++] = (t >>> 8) & 0xFF;", "  d[o++] = t & 0xFF;", "  for (var n = 0; n < t; n++, o++) {", "    d[o] = " + a + "[n];", "  }", "} else {", "  d[o++] = d[o++] = d[o++] = d[o++] = 0;", "}"]
}};
wtf.trace.EventTypeBuilder.WRITE_INT16_ = {size:2, prepare:null, write:function(a) {
  return["d[o++] = (" + a + " >> 8) & 0xFF;", "d[o++] = " + a + " & 0xFF;"]
}};
wtf.trace.EventTypeBuilder.WRITE_INT16ARRAY_ = {size:0, prepare:function(a) {
  return["size += " + a + ".length * 2;"]
}, write:function(a) {
  return["if (" + a + " && (t = " + a + ".length)) {", "  d[o++] = (t >>> 24) & 0xFF;", "  d[o++] = (t >>> 16) & 0xFF;", "  d[o++] = (t >>> 8) & 0xFF;", "  d[o++] = t & 0xFF;", "  for (var n = 0; n < t; n++, o += 2) {", "    var v = " + a + "[n];", "    d[o] = (v >> 8) & 0xFF;", "    d[o + 1] = v & 0xFF;", "  }", "} else {", "  d[o++] = d[o++] = d[o++] = d[o++] = 0;", "}"]
}};
wtf.trace.EventTypeBuilder.WRITE_INT32_ = {size:4, prepare:null, write:function(a) {
  return["var " + a + "_ = " + a + " >>> 0;", "d[o++] = (" + a + "_ >>> 24) & 0xFF;", "d[o++] = (" + a + "_ >>> 16) & 0xFF;", "d[o++] = (" + a + "_ >>> 8) & 0xFF;", "d[o++] = " + a + "_ & 0xFF;"]
}};
wtf.trace.EventTypeBuilder.WRITE_INT32ARRAY_ = {size:0, prepare:function(a) {
  return["size += " + a + ".length * 4;"]
}, write:function(a) {
  return["if (" + a + " && (t = " + a + ".length)) {", "  d[o++] = (t >>> 24) & 0xFF;", "  d[o++] = (t >>> 16) & 0xFF;", "  d[o++] = (t >>> 8) & 0xFF;", "  d[o++] = t & 0xFF;", "  for (var n = 0; n < t; n++, o += 4) {", "    var v = " + a + "[n] >>> 0;", "    d[o] = (v >>> 24) & 0xFF;", "    d[o + 1] = (v >>> 16) & 0xFF;", "    d[o + 2] = (v >>> 8) & 0xFF;", "    d[o + 3] = v & 0xFF;", "  }", "} else {", "  d[o++] = d[o++] = d[o++] = d[o++] = 0;", "}"]
}};
wtf.trace.EventTypeBuilder.WRITE_FLOAT32_ = {size:4, prepare:null, write:function(a) {
  return["writeFloat32(" + a + ", d, o); o += 4;"]
}};
wtf.trace.EventTypeBuilder.WRITE_FLOAT32ARRAY_ = {size:0, prepare:function(a) {
  return["size += " + a + ".length * 4;"]
}, write:function(a) {
  return["if (" + a + " && (t = " + a + ".length)) {", "  d[o++] = (t >>> 24) & 0xFF;", "  d[o++] = (t >>> 16) & 0xFF;", "  d[o++] = (t >>> 8) & 0xFF;", "  d[o++] = t & 0xFF;", "  for (var n = 0; n < t; n++, o += 4) {", "    writeFloat32(" + a + "[n], d, o);", "  }", "} else {", "  d[o++] = d[o++] = d[o++] = d[o++] = 0;", "}"]
}};
wtf.trace.EventTypeBuilder.WRITE_ASCII_ = {size:0, prepare:function(a) {
  return["size += " + a + " ? (2 + " + a + ".length) : 2;"]
}, write:function(a, b) {
  return["if (" + a + " && " + a + ".length) {", "  buffer." + b.offset + " = o;", "  buffer." + b.writeAsciiString + "(" + a + ");", "  o = buffer." + b.offset + ";", "} else {", "  d[o++] = d[o++] = 0;", "}"]
}};
wtf.trace.EventTypeBuilder.WRITE_UTF8_ = {size:0, prepare:function(a) {
  return["size += " + a + " ? (2 + 2 + " + a + ".length * 3) : 2;"]
}, write:function(a, b) {
  return["if (" + a + " && " + a + ".length) {", "  buffer." + b.offset + " = o;", "  buffer." + b.writeUtf8String + "(" + a + ");", "  o = buffer." + b.offset + ";", "} else {", "  d[o++] = d[o++] = 0;", "}"]
}};
wtf.trace.EventTypeBuilder.WRITE_ANY_ = {size:0, prepare:function(a) {
  return["var " + a + "_ = stringify(" + a + ");", "size += " + a + "_ ? (2 + 2 + " + a + "_.length * 3) : 2;"]
}, write:function(a, b) {
  return["if (" + a + "_ && " + a + "_.length) {", "  buffer." + b.offset + " = o;", "  buffer." + b.writeUtf8String + "(" + a + "_);", "  o = buffer." + b.offset + ";", "} else {", "  d[o++] = d[o++] = 0;", "}"]
}};
wtf.trace.EventTypeBuilder.WRITE_FLOWID_ = {size:4, prepare:null, write:function(a) {
  return["var " + a + "_ = " + a + " ? (" + a + ".getId() >>> 0) : 0;", "d[o++] = (" + a + "_ >>> 24) & 0xFF;", "d[o++] = (" + a + "_ >>> 16) & 0xFF;", "d[o++] = (" + a + "_ >>> 8) & 0xFF;", "d[o++] = " + a + "_ & 0xFF;"]
}};
wtf.trace.EventTypeBuilder.WRITE_TIME32_ = {size:4, prepare:null, write:function(a) {
  return["var " + a + "_ = (" + a + " * 1000) >>> 0;", "d[o++] = (" + a + "_ >>> 24) & 0xFF;", "d[o++] = (" + a + "_ >>> 16) & 0xFF;", "d[o++] = (" + a + "_ >>> 8) & 0xFF;", "d[o++] = " + a + "_ & 0xFF;"]
}};
wtf.trace.EventTypeBuilder.WRITERS_ = {bool:wtf.trace.EventTypeBuilder.WRITE_BOOL_, int8:wtf.trace.EventTypeBuilder.WRITE_INT8_, "int8[]":wtf.trace.EventTypeBuilder.WRITE_INT8ARRAY_, uint8:wtf.trace.EventTypeBuilder.WRITE_INT8_, "uint8[]":wtf.trace.EventTypeBuilder.WRITE_INT8ARRAY_, int16:wtf.trace.EventTypeBuilder.WRITE_INT16_, "int16[]":wtf.trace.EventTypeBuilder.WRITE_INT16ARRAY_, uint16:wtf.trace.EventTypeBuilder.WRITE_INT16_, "uint16[]":wtf.trace.EventTypeBuilder.WRITE_INT16ARRAY_, int32:wtf.trace.EventTypeBuilder.WRITE_INT32_, 
"int32[]":wtf.trace.EventTypeBuilder.WRITE_INT32ARRAY_, uint32:wtf.trace.EventTypeBuilder.WRITE_INT32_, "uint32[]":wtf.trace.EventTypeBuilder.WRITE_INT32ARRAY_, float32:wtf.trace.EventTypeBuilder.WRITE_FLOAT32_, "float32[]":wtf.trace.EventTypeBuilder.WRITE_FLOAT32ARRAY_, ascii:wtf.trace.EventTypeBuilder.WRITE_ASCII_, utf8:wtf.trace.EventTypeBuilder.WRITE_UTF8_, any:wtf.trace.EventTypeBuilder.WRITE_ANY_, flowId:wtf.trace.EventTypeBuilder.WRITE_FLOWID_, time32:wtf.trace.EventTypeBuilder.WRITE_TIME32_};
// Input 133
wtf.trace.EventRegistry = function() {
  wtf.events.EventEmitter.call(this);
  this.currentSessionPtr_ = [null];
  this.eventTypes_ = [];
  this.eventTypesByName_ = {}
};
goog.inherits(wtf.trace.EventRegistry, wtf.events.EventEmitter);
wtf.trace.EventRegistry.prototype.getSessionPtr = function() {
  return this.currentSessionPtr_
};
wtf.trace.EventRegistry.prototype.registerEventType = function(a) {
  goog.asserts.assert(!this.eventTypesByName_[a.name]);
  this.eventTypesByName_[a.name] || (this.eventTypes_.push(a), this.eventTypesByName_[a.name] = a, this.eventTypeBuilder_ = new wtf.trace.EventTypeBuilder, a.generateCode(this.eventTypeBuilder_, this.currentSessionPtr_), this.emitEvent(wtf.trace.EventRegistry.EventType.EVENT_TYPE_REGISTERED, a))
};
wtf.trace.EventRegistry.EventType = {EVENT_TYPE_REGISTERED:goog.events.getUniqueId("etr")};
wtf.trace.EventRegistry.prototype.getEventTypes = function() {
  return this.eventTypes_
};
wtf.trace.EventRegistry.prototype.getEventType = function(a) {
  return this.eventTypesByName_[a] || null
};
wtf.trace.EventRegistry.sharedInstance_ = null;
wtf.trace.EventRegistry.getShared = function() {
  wtf.trace.EventRegistry.sharedInstance_ || (wtf.trace.EventRegistry.sharedInstance_ = new wtf.trace.EventRegistry);
  return wtf.trace.EventRegistry.sharedInstance_
};
// Input 134
wtf.trace.events = {};
wtf.trace.events.create_ = function(a, b, c) {
  var d = wtf.trace.EventRegistry.getShared(), e = wtf.data.Variable.parseSignature(a);
  a = e.name;
  var e = e.args, f = d.getEventType(a);
  if(f) {
    return f
  }
  b = new wtf.trace.EventType(a, b, c, e);
  d.registerEventType(b);
  return b
};
wtf.trace.events.createInstance = function(a, b) {
  return wtf.trace.events.create_(a, wtf.data.EventClass.INSTANCE, b || 0).append
};
wtf.trace.events.createScope = function(a, b) {
  return wtf.trace.events.create_(a, wtf.data.EventClass.SCOPE, b || 0).append
};
// Input 135
wtf.trace.BuiltinEvents = {defineEvent:wtf.trace.events.createInstance("wtf.event#define(uint16 wireId, uint16 eventClass, uint32 flags, ascii name, ascii args)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), discontinuity:wtf.trace.events.createInstance("wtf.trace#discontinuity()", wtf.data.EventFlag.BUILTIN), createZone:wtf.trace.events.createInstance("wtf.zone#create(uint16 zoneId, ascii name, ascii type, ascii location)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), 
deleteZone:wtf.trace.events.createInstance("wtf.zone#delete(uint16 zoneId)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), setZone:wtf.trace.events.createInstance("wtf.zone#set(uint16 zoneId)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), enterScope:wtf.trace.events.createScope("wtf.scope#enter(ascii name)", wtf.data.EventFlag.BUILTIN), enterTracingScope:wtf.trace.events.createScope("wtf.scope#enterTracing()", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.SYSTEM_TIME), 
leaveScope:wtf.trace.events.createInstance("wtf.scope#leave()", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), appendScopeData:wtf.trace.events.createInstance("wtf.scope#appendData(ascii name, any value)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.APPEND_SCOPE_DATA), branchFlow:wtf.trace.events.createInstance("wtf.flow#branch(flowId id, flowId parentId, ascii name, any value)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), extendFlow:wtf.trace.events.createInstance("wtf.flow#extend(flowId id, ascii name, any value)", 
wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), terminateFlow:wtf.trace.events.createInstance("wtf.flow#terminate(flowId id, any value)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), appendFlowData:wtf.trace.events.createInstance("wtf.flow#appendData(flowId id, ascii name, any value)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.APPEND_FLOW_DATA), mark:wtf.trace.events.createInstance("wtf.trace#mark(ascii name, any value)", wtf.data.EventFlag.BUILTIN | 
wtf.data.EventFlag.INTERNAL), timeStamp:wtf.trace.events.createInstance("wtf.trace#timeStamp(ascii name, any value)", wtf.data.EventFlag.BUILTIN), beginTimeRange:wtf.trace.events.createInstance("wtf.timeRange#begin(uint32 id, ascii name, any value)", wtf.data.EventFlag.BUILTIN), endTimeRange:wtf.trace.events.createInstance("wtf.timeRange#end(uint32 id)", wtf.data.EventFlag.BUILTIN)};
// Input 136
wtf.trace.Scope = function() {
  this.flow_ = null;
  this.stackDepth_ = 0
};
wtf.trace.Scope.pool_ = {unusedScopes:[], unusedIndex:0, currentDepth:-1, stack:[]};
wtf.trace.Scope.enterTyped = function() {
  var a = wtf.trace.Scope.pool_, b;
  b = a.unusedIndex ? a.unusedScopes[--a.unusedIndex] : new wtf.trace.Scope;
  b.stackDepth_ = ++a.currentDepth;
  return a.stack[b.stackDepth_] = b
};
wtf.trace.Scope.leave = function(a, b, c) {
  if(!a) {
    return b
  }
  c = c || wtf.now();
  for(var d = wtf.trace.Scope.pool_;d.currentDepth > a.stackDepth_;) {
    wtf.trace.Scope.leave(d.stack[d.currentDepth], void 0, c)
  }
  d.currentDepth--;
  d.stack[a.stackDepth_] = null;
  wtf.trace.BuiltinEvents.leaveScope(c);
  d.unusedScopes[d.unusedIndex++] = a;
  a.flow_ = null;
  return b
};
wtf.trace.Scope.getCurrentFlow = function() {
  for(var a = wtf.trace.Scope.pool_, b = a.currentDepth;0 < b;) {
    var c = a.stack[b--];
    if(c && c.flow_) {
      return c.flow_
    }
  }
  return null
};
wtf.trace.Scope.setCurrentFlow = function(a) {
  var b = wtf.trace.Scope.pool_;
  if(b = b.stack[b.currentDepth]) {
    b.flow_ = a
  }
};
// Input 137
wtf.trace.Flow = function(a) {
  this.terminated_ = !1;
  this.flowId_ = !a ? wtf.trace.Flow.generateId_() : a
};
wtf.trace.Flow.INVALID_ID = 0;
wtf.trace.Flow.generateId_ = function() {
  var a = 0 | -2147483648 * Math.random();
  a || (a = 1);
  return a
};
wtf.trace.Flow.prototype.getId = function() {
  return this.flowId_
};
wtf.trace.Flow.branch = function(a, b, c, d) {
  (c = c || wtf.trace.Scope.getCurrentFlow()) && c.terminated_ && (c = null);
  var e = new wtf.trace.Flow;
  wtf.trace.BuiltinEvents.branchFlow(e, c, a, b, d);
  return e
};
wtf.trace.Flow.extend = function(a, b, c, d) {
  a && !a.terminated_ && (wtf.trace.Scope.setCurrentFlow(a), wtf.trace.BuiltinEvents.extendFlow(a, b, c, d))
};
wtf.trace.Flow.terminate = function(a, b, c) {
  a && !a.terminated_ && (a.terminated_ = !0, wtf.trace.BuiltinEvents.terminateFlow(a, b, c))
};
wtf.trace.Flow.clear = function() {
  wtf.trace.Scope.setCurrentFlow(null)
};
wtf.trace.Flow.span = function(a) {
  return new wtf.trace.Flow(a)
};
goog.exportProperty(wtf.trace.Flow.prototype, "getId", wtf.trace.Flow.prototype.getId);
// Input 138
wtf.trace.Session = function(a, b, c) {
  goog.Disposable.call(this);
  this.traceManager_ = a;
  this.options_ = b;
  this.metadata_ = {};
  this.maximumMemoryUsage = this.options_.getNumber("wtf.trace.session.maximumMemoryUsage", wtf.trace.Session.DEFAULT_MAX_MEMORY_USAGE_);
  this.bufferSize = this.options_.getNumber("wtf.trace.session.bufferSize", c);
  this.currentBuffer = null;
  this.hasDiscontinuity_ = !1
};
goog.inherits(wtf.trace.Session, goog.Disposable);
wtf.trace.Session.DEFAULT_MAX_MEMORY_USAGE_ = 16777216;
wtf.trace.Session.prototype.disposeInternal = function() {
  this.currentBuffer && (this.retireBuffer(this.currentBuffer), this.currentBuffer = null);
  wtf.trace.Session.superClass_.disposeInternal.call(this)
};
wtf.trace.Session.prototype.getOptions = function() {
  return this.options_
};
wtf.trace.Session.prototype.getMetadata = function() {
  return this.metadata_
};
wtf.trace.Session.prototype.startInternal = function() {
  goog.asserts.assert(!this.currentBuffer);
  this.currentBuffer = this.nextBuffer()
};
wtf.trace.Session.prototype.writeTraceHeader = function(a) {
  a.writeUint32(3735928559);
  a.writeUint32(wtf.version.getValue());
  a.writeUint32(wtf.data.formats.BinaryTrace.VERSION);
  if(!this.traceManager_.detectContextInfo().write(a)) {
    return!1
  }
  var b = 0;
  wtf.hasHighResolutionTimes && (b |= wtf.data.formats.FileFlags.HAS_HIGH_RESOLUTION_TIMES);
  a.writeUint32(b);
  b = wtf.timebase();
  b = goog.math.Long.fromNumber(b);
  a.writeUint32(b.getLowBits());
  a.writeUint32(b.getHighBits());
  b = goog.json.serialize(this.metadata_);
  a.writeUtf8String(b);
  if(!this.traceManager_.writeEventHeader(a)) {
    return!1
  }
  this.traceManager_.appendAllZones(a);
  return!0
};
wtf.trace.Session.prototype.acquireBuffer = function(a, b) {
  var c = this.currentBuffer;
  if(c && c.capacity - c.offset >= b) {
    return c
  }
  if(b > this.bufferSize) {
    return null
  }
  c && this.retireBuffer(c);
  (c = this.currentBuffer = this.nextBuffer()) ? this.hasDiscontinuity_ && (this.hasDiscontinuity_ = !1, wtf.trace.BuiltinEvents.discontinuity(a, c)) : this.hasDiscontinuity_ = !0;
  if(c) {
    var d = this.traceManager_.getCurrentZone();
    d && wtf.trace.BuiltinEvents.setZone(d.id, a, c);
    if(b > c.capacity - c.offset) {
      return null
    }
  }
  return c
};
wtf.trace.Session.prototype.enterTypedScope = wtf.trace.Scope.enterTyped;
goog.exportProperty(wtf.trace.Session.prototype, "acquireBuffer", wtf.trace.Session.prototype.acquireBuffer);
goog.exportProperty(wtf.trace.Session.prototype, "enterTypedScope", wtf.trace.Session.prototype.enterTypedScope);
// Input 139
wtf.trace.NullSession = function(a, b) {
  wtf.trace.Session.call(this, a, b, 0)
};
goog.inherits(wtf.trace.NullSession, wtf.trace.Session);
wtf.trace.NullSession.prototype.nextBuffer = function() {
  return null
};
wtf.trace.NullSession.prototype.retireBuffer = goog.nullFunction;
// Input 140
wtf.trace.SnapshottingSession = function(a, b) {
  wtf.trace.Session.call(this, a, b, wtf.trace.SnapshottingSession.DEFAULT_BUFFER_SIZE_);
  var c = Math.max(1, Math.floor(this.maximumMemoryUsage / this.bufferSize));
  this.resetOnSnapshot_ = b.getBoolean("wtf.trace.snapshotting.resetOnSnapshot", !1);
  this.buffers_ = Array(c);
  this.dirtyBuffers_ = Array(c);
  for(var d = 0;d < c;d++) {
    this.buffers_[d] = new wtf.io.Buffer(this.bufferSize), this.dirtyBuffers_[d] = !1
  }
  for(d = this.pendingWrites_ = this.nextBufferIndex_ = 0;d < this.dirtyBuffers_.length;d++) {
    this.dirtyBuffers_[d] = !1
  }
  this.startInternal()
};
goog.inherits(wtf.trace.SnapshottingSession, wtf.trace.Session);
wtf.trace.SnapshottingSession.DEFAULT_BUFFER_SIZE_ = 1048576;
wtf.trace.SnapshottingSession.prototype.reset = function() {
  if(!this.pendingWrites_) {
    for(var a = 0;a < this.buffers_.length;a++) {
      this.buffers_[a].offset = 0, this.dirtyBuffers_[a] = !1
    }
  }
};
wtf.trace.SnapshottingSession.prototype.snapshot = function(a, b) {
  if(!this.pendingWrites_) {
    var c = this.currentBuffer;
    this.currentBuffer && (this.retireBuffer(this.currentBuffer), this.currentBuffer = null);
    for(var d = null, e = 0;e < this.buffers_.length;e++) {
      var f = (this.nextBufferIndex_ + e) % this.buffers_.length, g = this.buffers_[f], h = this.dirtyBuffers_[f];
      this.resetOnSnapshot_ && (this.dirtyBuffers_[f] = !1);
      h && g.offset && (d || (d = a.call(b), this.setupStream_(d)), d.write(g, this.returnBufferCallback_, this) || this.pendingWrites_++)
    }
    goog.dispose(d);
    this.currentBuffer = this.pendingWrites_ ? this.nextBuffer() : c
  }
};
wtf.trace.SnapshottingSession.prototype.setupStream_ = function(a) {
  var b = new wtf.io.Buffer(this.bufferSize);
  this.writeTraceHeader(b, !1);
  a.write(b, this.returnBufferCallback_, this) || this.pendingWrites_++
};
wtf.trace.SnapshottingSession.prototype.returnBufferCallback_ = function() {
  goog.asserts.assert(0 < this.pendingWrites_);
  this.pendingWrites_--
};
wtf.trace.SnapshottingSession.prototype.nextBuffer = function() {
  if(this.pendingWrites_) {
    return null
  }
  var a = this.buffers_[this.nextBufferIndex_];
  this.dirtyBuffers_[this.nextBufferIndex_] = !1;
  a.offset = 0;
  this.nextBufferIndex_ = (this.nextBufferIndex_ + 1) % this.buffers_.length;
  return a
};
wtf.trace.SnapshottingSession.prototype.retireBuffer = function() {
  var a = this.nextBufferIndex_ - 1;
  0 > a && (a = this.buffers_.length + a);
  this.dirtyBuffers_[a] = !0
};
// Input 141
wtf.timing = {};
wtf.timing.Handle = function(a) {
  this.func_ = a
};
wtf.timing.Handle.prototype.callback = function() {
  if(this.func_) {
    try {
      this.func_.apply(goog.global, arguments)
    }catch(a) {
      goog.asserts.fail("Unhandled exception in callback: " + a)
    }
  }
};
wtf.timing.Handle.prototype.clear = function() {
  this.func_ = null
};
// Input 142
wtf.timing.BrowserInterval = function(a, b) {
  wtf.timing.Handle.call(this, a);
  var c = this;
  this.intervalId_ = (goog.global.setInterval.raw || goog.global.setInterval).call(goog.global, function() {
    c.callback()
  }, b)
};
goog.inherits(wtf.timing.BrowserInterval, wtf.timing.Handle);
wtf.timing.BrowserInterval.prototype.clear = function() {
  (goog.global.clearInterval.raw || goog.global.clearInterval).call(goog.global, this.intervalId_);
  this.intervalId_ = null;
  wtf.timing.BrowserInterval.superClass_.clear.call(this)
};
// Input 143
wtf.timing.RenderInterval = function(a) {
  wtf.timing.Handle.call(this, a)
};
goog.inherits(wtf.timing.RenderInterval, wtf.timing.Handle);
// Input 144
wtf.timing.util = {};
wtf.timing.util.FRAMERATE = 60;
wtf.timing.util.getWindowFunction_ = function(a) {
  for(var b = a.replace(/^[a-z]/, function(a) {
    return a.toUpperCase()
  }), c = goog.array.map([null, "webkit", "moz", "o", "ms", "Webkit", "Moz", "O", "Ms"], function(c) {
    return c ? c + b : a
  }), d = 0;d < c.length;d++) {
    var e = goog.global[c[d]];
    if(e) {
      return e.raw && (e = e.raw), function(a) {
        return function() {
          a.apply(goog.global, arguments)
        }
      }(e)
    }
  }
  return null
};
wtf.timing.util.getRequestAnimationFrame = function(a) {
  var b = wtf.timing.util.getWindowFunction_("requestAnimationFrame");
  if(b) {
    return b
  }
  if(a) {
    var c = goog.global.setTimeout.raw || goog.global.setTimeout;
    return function(a) {
      return c.call(goog.global, a, 1E3 / wtf.timing.util.FRAMERATE)
    }
  }
  return null
};
wtf.timing.util.getCancelRequestAnimationFrame = function(a) {
  var b = wtf.timing.util.getWindowFunction_("cancelRequestAnimationFrame");
  if(b) {
    return b
  }
  if(a) {
    var c = goog.global.clearTimeout.raw || goog.global.clearTimeout;
    return function(a) {
      c(a)
    }
  }
  return null
};
// Input 145
wtf.timing.RenderTimer = function() {
  this.intervals_ = [];
  this.browserRequestAnimationFrame_ = wtf.timing.util.getRequestAnimationFrame();
  this.browserCancelRequestAnimationFrame_ = wtf.timing.util.getCancelRequestAnimationFrame() || goog.nullFunction;
  this.browserIntervalId_ = this.browserRequestAnimationId_ = null;
  this.boundRequestAnimationFrameTick_ = goog.bind(this.requestAnimationFrameTick_, this);
  this.boundIntervalTick_ = goog.bind(this.intervalTick_, this)
};
wtf.timing.RenderTimer.prototype.requestAnimationFrameTick_ = function(a) {
  for(var b = this.intervals_.slice(), c = 0;c < b.length;c++) {
    b[c].callback(a)
  }
  this.intervals_.length && (this.browserRequestAnimationId_ = this.browserRequestAnimationFrame_(this.boundRequestAnimationFrameTick_) || 1)
};
wtf.timing.RenderTimer.prototype.intervalTick_ = function() {
  for(var a = wtf.now(), b = this.intervals_.slice(), c = 0;c < b.length;c++) {
    b[c].callback(a)
  }
};
wtf.timing.RenderTimer.prototype.setInterval = function(a) {
  a = new wtf.timing.RenderInterval(a);
  this.intervals_.push(a);
  1 == this.intervals_.length && (this.browserRequestAnimationFrame_ ? (goog.asserts.assert(null === this.browserRequestAnimationId_), this.browserRequestAnimationId_ = this.browserRequestAnimationFrame_(this.boundRequestAnimationFrameTick_) || 1) : (goog.asserts.assert(null === this.browserIntervalId_), this.browserIntervalId_ = (goog.global.setInterval.raw || goog.global.setInterval)(this.boundIntervalTick_, 1E3 / wtf.timing.util.FRAMERATE)));
  return a
};
wtf.timing.RenderTimer.prototype.clearInterval = function(a) {
  a.clear();
  goog.array.remove(this.intervals_, a);
  this.intervals_.length || (this.browserRequestAnimationFrame_ ? (goog.asserts.assert(null !== this.browserRequestAnimationId_), this.browserCancelRequestAnimationFrame_(this.browserRequestAnimationId_), this.browserRequestAnimationId_ = null) : (goog.asserts.assert(null !== this.browserIntervalId_), (goog.global.clearInterval.raw || goog.global.clearInterval).call(goog.global, this.browserIntervalId_), this.browserIntervalId_ = null))
};
// Input 146
wtf.timing.MILLISECONDS_30HZ = 33;
wtf.timing.MILLISECONDS_60HZ = 16;
wtf.timing.renderTimer_ = null;
wtf.timing.RunMode = {DEFAULT:0, RENDERING:1};
wtf.timing.setInterval = function(a, b, c, d) {
  c = d ? goog.bind(c, d) : c;
  switch(a) {
    default:
    ;
    case wtf.timing.RunMode.DEFAULT:
      return new wtf.timing.BrowserInterval(c, b);
    case wtf.timing.RunMode.RENDERING:
      return wtf.timing.renderTimer_ || (wtf.timing.renderTimer_ = new wtf.timing.RenderTimer), wtf.timing.renderTimer_.setInterval(c)
  }
};
wtf.timing.clearInterval = function(a) {
  a instanceof wtf.timing.RenderInterval ? wtf.timing.renderTimer_ && wtf.timing.renderTimer_.clearInterval(a) : a.clear()
};
wtf.timing.setTimeout = function() {
  var a = goog.global.setTimeout.raw || goog.global.setTimeout;
  return function(b, c, d) {
    a.call(goog.global, function() {
      c.call(d)
    }, b)
  }
}();
wtf.timing.setImmediate = function() {
  var a = goog.global.setTimeout.raw || goog.global.setTimeout;
  return function(b, c) {
    a.call(goog.global, function() {
      b.call(c || goog.global)
    }, 0)
  }
}();
wtf.timing.waitingFrameCallbacks_ = [];
wtf.timing.deferToNextFrame = function(a, b) {
  wtf.timing.renderTimer_ || (wtf.timing.renderTimer_ = new wtf.timing.RenderTimer);
  var c = 0 == wtf.timing.waitingFrameCallbacks_.length;
  wtf.timing.waitingFrameCallbacks_.push({callback:a, scope:b || null});
  if(c) {
    var d = wtf.timing.renderTimer_.setInterval(function() {
      wtf.timing.renderTimer_.clearInterval(d);
      wtf.timing.runDeferredCallbacks_()
    })
  }
};
wtf.timing.runDeferredCallbacks_ = function() {
  for(var a = wtf.timing.waitingFrameCallbacks_, b = 0;b < a.length;b++) {
    var c = a[b];
    c.callback.call(c.scope)
  }
  wtf.timing.waitingFrameCallbacks_.length = 0
};
// Input 147
wtf.trace.StreamingSession = function(a, b, c) {
  wtf.trace.Session.call(this, a, c, wtf.trace.StreamingSession.DEFAULT_BUFFER_SIZE_);
  this.stream_ = b;
  this.unusedBuffers_ = [];
  this.totalUnusedSize_ = 0;
  this.flushIntervalMs_ = c.getNumber("wtf.trace.streaming.flushIntervalMs", wtf.trace.StreamingSession.DEFAULT_FLUSH_INTERVAL_MS_);
  this.flushIntervalId_ = null;
  a = Math.max(1, Math.floor(this.maximumMemoryUsage / this.bufferSize));
  for(b = 0;b < a;b++) {
    this.unusedBuffers_.push(new wtf.io.Buffer(this.bufferSize)), this.totalUnusedSize_ += this.bufferSize
  }
  this.startInternal();
  a = this.acquireBuffer(wtf.now(), this.bufferSize);
  goog.asserts.assert(a);
  this.writeTraceHeader(a, !0);
  this.flush();
  this.flushIntervalMs_ && (this.flushIntervalId_ = wtf.timing.setInterval(wtf.timing.RunMode.DEFAULT, this.flushIntervalMs_, this.flush, this))
};
goog.inherits(wtf.trace.StreamingSession, wtf.trace.Session);
wtf.trace.StreamingSession.DEFAULT_BUFFER_SIZE_ = 262144;
wtf.trace.StreamingSession.DEFAULT_FLUSH_INTERVAL_MS_ = 1E3;
wtf.trace.StreamingSession.prototype.disposeInternal = function() {
  this.flushIntervalId_ && (wtf.timing.clearInterval(this.flushIntervalId_), this.flushIntervalId_ = null);
  this.stream_.flush();
  goog.dispose(this.stream_);
  wtf.trace.StreamingSession.superClass_.disposeInternal.call(this)
};
wtf.trace.StreamingSession.prototype.flush = function() {
  this.currentBuffer && (this.retireBuffer(this.currentBuffer), this.currentBuffer = null);
  this.stream_.flush();
  this.currentBuffer = this.nextBuffer()
};
wtf.trace.StreamingSession.prototype.nextBuffer = function() {
  if(this.unusedBuffers_.length) {
    var a = this.unusedBuffers_.pop();
    a.offset = 0;
    this.totalUnusedSize_ -= a.capacity;
    return a
  }
  return null
};
wtf.trace.StreamingSession.prototype.retireBuffer = function(a) {
  a.offset ? this.stream_.write(a, this.returnBufferCallback_, this) && (this.unusedBuffers_.push(a), this.totalUnusedSize_ += a.capacity) : (this.unusedBuffers_.push(a), this.totalUnusedSize_ += a.capacity)
};
wtf.trace.StreamingSession.prototype.returnBufferCallback_ = function(a) {
  this.unusedBuffers_.push(a);
  this.totalUnusedSize_ += a.capacity
};
// Input 148
wtf.trace.Zone = function(a, b, c, d, e) {
  this.id = a;
  this.timestamp = b;
  this.name = c;
  this.type = d;
  this.location = e
};
// Input 149
wtf.trace.ISessionListener = function() {
};
wtf.trace.ISessionListener.prototype.sessionStarted = goog.nullFunction;
wtf.trace.ISessionListener.prototype.sessionStopped = goog.nullFunction;
wtf.trace.TraceManager = function() {
  goog.Disposable.call(this);
  this.listeners_ = [];
  this.providers_ = [];
  this.nextZoneId_ = 1;
  this.zoneStack_ = [];
  this.allZones_ = {};
  this.currentSession_ = null;
  var a = wtf.trace.EventRegistry.getShared();
  this.currentSessionPtr_ = a.getSessionPtr();
  a.addListener(wtf.trace.EventRegistry.EventType.EVENT_TYPE_REGISTERED, this.eventTypeRegistered_, this);
  a = this.createZone("Script", wtf.data.ZoneType.SCRIPT, wtf.NODE ? goog.global.process.argv[1] : goog.global.location.href);
  this.pushZone(a)
};
goog.inherits(wtf.trace.TraceManager, goog.Disposable);
wtf.trace.TraceManager.prototype.disposeInternal = function() {
  this.stopSession();
  goog.disposeAll(this.providers_);
  this.providers_.length = 0;
  wtf.trace.TraceManager.superClass_.disposeInternal.call(this)
};
wtf.trace.TraceManager.prototype.detectContextInfo = function() {
  return wtf.data.ContextInfo.detect()
};
wtf.trace.TraceManager.prototype.addListener = function(a) {
  this.listeners_.push(a);
  this.currentSession_ && a.sessionStarted(this.currentSession_)
};
wtf.trace.TraceManager.prototype.addProvider = function(a) {
  this.providers_.push(a)
};
wtf.trace.TraceManager.prototype.getProviders = function() {
  return this.providers_
};
wtf.trace.TraceManager.prototype.createZone = function(a, b, c) {
  a = new wtf.trace.Zone(this.nextZoneId_++, wtf.now(), a, b, c);
  this.allZones_[a.id] = a;
  wtf.trace.BuiltinEvents.createZone(a.id, a.name, a.type, a.location, a.timestamp);
  return a
};
wtf.trace.TraceManager.prototype.deleteZone = function(a) {
  goog.asserts.assert(!goog.array.contains(this.zoneStack_, a));
  wtf.trace.BuiltinEvents.deleteZone(a.id)
};
wtf.trace.TraceManager.prototype.appendAllZones = function(a) {
  for(var b in this.allZones_) {
    var c = this.allZones_[b];
    wtf.trace.BuiltinEvents.createZone(c.id, c.name, c.type, c.location, 0, a)
  }
  (b = this.getCurrentZone()) && wtf.trace.BuiltinEvents.setZone(b.id, 0, a)
};
wtf.trace.TraceManager.prototype.pushZone = function(a) {
  this.zoneStack_.push(a);
  wtf.trace.BuiltinEvents.setZone(a.id)
};
wtf.trace.TraceManager.prototype.popZone = function() {
  goog.asserts.assert(this.zoneStack_.length);
  this.zoneStack_.pop();
  var a = this.getCurrentZone();
  wtf.trace.BuiltinEvents.setZone(a.id)
};
wtf.trace.TraceManager.prototype.getCurrentZone = function() {
  return this.zoneStack_.length ? this.zoneStack_[this.zoneStack_.length - 1] : null
};
wtf.trace.TraceManager.prototype.getCurrentSession = function() {
  return this.currentSession_
};
wtf.trace.TraceManager.prototype.startSession = function(a) {
  goog.asserts.assert(!this.currentSession_);
  this.currentSession_ = a;
  this.currentSessionPtr_[0] = a;
  a = wtf.trace.EventRegistry.getShared().getEventTypes();
  for(var b = 0;b < a.length;b++) {
    a[b].count = 0
  }
  if(this.currentSession_) {
    for(b = 0;b < this.listeners_.length;b++) {
      this.listeners_[b].sessionStarted(this.currentSession_)
    }
  }
};
wtf.trace.TraceManager.prototype.stopSession = function() {
  if(this.currentSession_) {
    for(var a = 0;a < this.listeners_.length;a++) {
      this.listeners_[a].sessionStopped(this.currentSession_)
    }
  }
  goog.dispose(this.currentSession_);
  this.currentSession_ = null;
  this.currentSessionPtr_[0] = null
};
wtf.trace.TraceManager.prototype.eventTypeRegistered_ = function(a) {
  this.currentSession_ && wtf.trace.BuiltinEvents.defineEvent(a.wireId, a.eventClass, a.flags, a.name, a.getArgString())
};
wtf.trace.TraceManager.prototype.writeEventHeader = function(a, b) {
  for(var c = wtf.trace.EventRegistry.getShared().getEventTypes(), d = 0;d < c.length;d++) {
    var e = c[d];
    (b || e.flags & wtf.data.EventFlag.BUILTIN || e.count) && wtf.trace.BuiltinEvents.defineEvent(e.wireId, e.eventClass, e.flags, e.name, e.getArgString(), void 0, a)
  }
  return!0
};
// Input 150
wtf.trace.eventtarget = {};
wtf.trace.eventtarget.DEFINE_SUPPORT = function() {
  if(!goog.global.document) {
    return{available:!1, needsDelete:!1}
  }
  var a = !1, b = !1;
  try {
    var c = goog.global.HTMLHeadElement.prototype, d = 123;
    Object.defineProperty(c, "onmousemove", {configurable:!0, enumerable:!1, get:function() {
      return d
    }, set:function(a) {
      d = a
    }});
    var e = document.createElement("head");
    e.onmousemove = 456;
    456 == e.onmousemove && 456 == d && (a = !0);
    a || (delete e.onmousemove, e.onmousemove = 456, 456 == e.onmousemove && 456 == d && (b = a = !0));
    delete c.onmousemove
  }catch(f) {
  }
  return{available:a, needsDelete:b}
}();
wtf.trace.eventtarget.getEventNames = function(a) {
  if(!Object.getOwnPropertyNames) {
    return[]
  }
  var b = [];
  a = Object.getOwnPropertyNames(a);
  for(var c = 0;c < a.length;c++) {
    var d = a[c];
    0 == d.indexOf("on") && d.toLowerCase() == d && (d = d.substr(2), b.push(d))
  }
  return b
};
wtf.trace.eventtarget.createDescriptor = function(a, b) {
  for(var c = {}, d = [], e = 0;e < b.length;e++) {
    var f = b[e], g = wtf.trace.events.createScope(a + "#on" + f);
    c[f] = g;
    var h = "__wtf_event_value_" + f;
    d.push({name:f, scopeEvent:g, getter:function(a) {
      return function() {
        return this[a]
      }
    }(h), setter:function(a, b) {
      return function(c) {
        var d = this[a];
        d && this.removeEventListener(b, d, !1);
        c && this.addEventListener(b, c, !1);
        this[a] = c
      }
    }(h, f)})
  }
  return{prefix:a, eventNames:b, eventMap:c, eventInfos:d}
};
wtf.trace.eventtarget.getDescriptor = function(a) {
  return a.__wtf_eventtarget_descriptor__ || null
};
wtf.trace.eventtarget.setDescriptor = function(a, b) {
  a.__wtf_eventtarget_descriptor__ = b
};
wtf.trace.eventtarget.mixin = function(a, b) {
  var c = b.addEventListener;
  b.addEventListener = function(b, d, g) {
    var h = a.eventMap[b];
    if(!h || this.__wtf_ignore__ || d.__wtf_ignore__) {
      c.call(this, b, d, g)
    }else {
      var i = function(a) {
        var b = this.__wtf_ignore__ ? null : h();
        try {
          if(d.handleEvent) {
            d.handleEvent(a)
          }else {
            return d.apply(this, arguments)
          }
        }finally {
          wtf.trace.Scope.leave(b)
        }
      };
      d.__wrapped__ = i;
      c.call(this, b, i, g)
    }
  };
  var d = b.removeEventListener;
  b.removeEventListener = function(a, b, c) {
    b && b.__wrapped__ && (b = b.__wrapped__);
    d.call(this, a, b, c)
  }
};
wtf.trace.eventtarget.setEventProperties = function(a, b) {
  if(wtf.trace.eventtarget.DEFINE_SUPPORT.available) {
    for(var c = a.eventInfos, d = 0;d < c.length;d++) {
      var e = c[d];
      Object.defineProperty(b, "on" + e.name, {configurable:!1, enumerable:!1, get:e.getter, set:e.setter})
    }
  }
};
wtf.trace.eventtarget.initializeEventProperties = function(a) {
  if(!wtf.trace.eventtarget.DEFINE_SUPPORT.available || !wtf.trace.eventtarget.DEFINE_SUPPORT.needsDelete) {
    return!1
  }
  var b = wtf.trace.eventtarget.getDescriptor(a);
  if(b) {
    for(var b = b.eventNames, c = 0;c < b.length;c++) {
      var d = "on" + b[c], e = a[d];
      a[d] = null;
      delete a[d];
      e && (a[d] = e)
    }
    return!0
  }
  return!1
};
wtf.trace.eventtarget.initializeDomEventProperties = function(a, b) {
  if(!a.__wtf_ignore__ && wtf.trace.eventtarget.initializeEventProperties(a) && b) {
    for(var c = a.getElementsByTagName("*"), d = 0;d < c.length;d++) {
      var e = c[d];
      if(!e.__wtf_ignore__) {
        var f = wtf.trace.eventtarget.getDescriptor(e);
        if(f) {
          for(var f = f.eventNames, g = 0;g < f.length;g++) {
            var h = "on" + f[g], i = e[h];
            e[h] = null;
            delete e[h];
            i && (e[h] = i)
          }
        }
      }
    }
  }
};
wtf.trace.eventtarget.BaseEventTarget = function(a) {
  this.descriptor_ = a;
  this.listeners_ = {};
  this.onListeners_ = {};
  this.eventHooks_ = {}
};
wtf.trace.eventtarget.BaseEventTarget.prototype.addEventListener = function(a, b, c) {
  var d = this.listeners_[a] || [];
  this.listeners_[a] = d;
  d.push({listener:b, capture:c || !1});
  1 == d.length && this.beginTrackingEvent(a)
};
wtf.trace.eventtarget.BaseEventTarget.prototype.removeEventListener = function(a, b, c) {
  var d = this.listeners_[a];
  if(d) {
    for(var e = 0;e < d.length;e++) {
      if(d[e].listener == b && d[e].capture == c) {
        d.splice(e, 1);
        break
      }
    }
    d.length || (delete this.listeners_[a], this.endTrackingEvent(a))
  }
};
wtf.trace.eventtarget.BaseEventTarget.prototype.setEventHook = function(a, b, c) {
  this.eventHooks_[a] = {callback:b, scope:c || this}
};
wtf.trace.eventtarget.BaseEventTarget.prototype.dispatchEvent = function(a) {
  var b = this.onListeners_[a.type];
  if(b) {
    this.dispatchToListener(a, b)
  }else {
    for(var b = this.listeners_[a.type], c = 0;c < b.length;c++) {
      this.dispatchToListener(a, b[c].listener)
    }
  }
};
wtf.trace.eventtarget.BaseEventTarget.prototype.dispatchToListener = function(a, b) {
  var c = a.type, d = this.descriptor_.eventMap[c], c = this.eventHooks_[c], d = this.__wtf_ignore__ ? null : d ? d() : null;
  c && c.callback.call(c.scope, a);
  try {
    if(b.handleEvent) {
      b.handleEvent(a)
    }else {
      return b.apply(this, arguments)
    }
  }finally {
    wtf.trace.Scope.leave(d)
  }
};
// Input 151
wtf.trace.util = {};
wtf.trace.util.getScriptUrl = function() {
  if(goog.global.WTF_TRACE_SCRIPT_URL) {
    return goog.global.WTF_TRACE_SCRIPT_URL
  }
  if(!wtf.NODE) {
    if(!goog.global.document) {
      return null
    }
    for(var a = goog.dom.getElementsByTagNameAndClass(goog.dom.TagName.SCRIPT), b = 0;b < a.length;b++) {
      var c = a[b];
      if(goog.string.contains(c.src, "wtf_trace_web_js_compiled.js")) {
        return c.src
      }
    }
  }
  return null
};
wtf.trace.util.ignoreListener = function(a) {
  a.__wtf_ignore__ = !0;
  return a
};
wtf.trace.util.ignoreDomTree = function(a) {
  a.__wtf_ignore__ = !0;
  a = a.getElementsByTagName("*");
  for(var b = 0;b < a.length;b++) {
    a[b].__wtf_ignore__ = !0
  }
};
// Input 152
wtf.util.Options = function() {
  wtf.events.EventEmitter.call(this);
  this.obj_ = {};
  this.changingDepth_ = 0;
  this.changedKeys_ = {}
};
goog.inherits(wtf.util.Options, wtf.events.EventEmitter);
wtf.util.Options.EventType = {CHANGED:goog.events.getUniqueId("changed")};
wtf.util.Options.prototype.load = function(a) {
  var b;
  try {
    b = goog.global.JSON.parse(a)
  }catch(c) {
    return!1
  }
  goog.isObject(b) && this.mixin(b);
  return!0
};
wtf.util.Options.prototype.save = function() {
  return goog.global.JSON.stringify(this.obj_)
};
wtf.util.Options.prototype.clear = function() {
  this.beginChanging();
  for(var a in this.obj_) {
    this.changedKeys_[a] = !0
  }
  this.obj_ = {};
  this.endChanging()
};
wtf.util.Options.prototype.getValues = function() {
  return goog.object.unsafeClone(this.obj_)
};
wtf.util.Options.prototype.beginChanging = function() {
  this.changingDepth_++
};
wtf.util.Options.prototype.endChanging = function() {
  this.changingDepth_--;
  if(!this.changingDepth_) {
    var a = [], b;
    for(b in this.changedKeys_) {
      a.push(b)
    }
    this.changedKeys_ = {};
    a.length && this.emitEvent(wtf.util.Options.EventType.CHANGED, a)
  }
};
wtf.util.Options.prototype.mixin = function(a) {
  if(a) {
    this.beginChanging();
    for(var b in a) {
      if(a.hasOwnProperty(b) && this.obj_[b] !== a[b]) {
        if(goog.isArray(a[b])) {
          for(var c = this.obj_[b] || [], d = a[b], e = 0;e < d.length;e++) {
            goog.array.insert(c, d[e])
          }
          this.obj_[b] = c
        }else {
          this.obj_[b] = a[b]
        }
        this.changedKeys_[b] = !0
      }
    }
    this.endChanging()
  }
};
wtf.util.Options.prototype.setValue_ = function(a, b) {
  this.obj_[a] !== b && (this.beginChanging(), void 0 !== b ? this.obj_[a] = b : delete this.obj_[a], this.changedKeys_[a] = !0, this.endChanging())
};
wtf.util.Options.prototype.getBoolean = function(a, b) {
  var c = this.obj_[a];
  void 0 === c ? c = b : goog.asserts.assert(goog.isBoolean(c));
  return c
};
wtf.util.Options.prototype.getOptionalBoolean = function(a, b) {
  var c = this.obj_[a];
  void 0 === c ? c = b : goog.asserts.assert(goog.isBoolean(c));
  return c
};
wtf.util.Options.prototype.setBoolean = function(a, b) {
  this.setValue_(a, b)
};
wtf.util.Options.prototype.getNumber = function(a, b) {
  var c = this.obj_[a];
  void 0 === c ? c = b : goog.asserts.assert(goog.isNumber(c));
  return c
};
wtf.util.Options.prototype.getOptionalNumber = function(a, b) {
  var c = this.obj_[a];
  void 0 === c ? c = b : goog.asserts.assert(goog.isNumber(c));
  return c
};
wtf.util.Options.prototype.setNumber = function(a, b) {
  this.setValue_(a, b)
};
wtf.util.Options.prototype.getString = function(a, b) {
  var c = this.obj_[a];
  void 0 === c ? c = b : goog.asserts.assert(goog.isString(c));
  return c
};
wtf.util.Options.prototype.getOptionalString = function(a, b) {
  var c = this.obj_[a];
  void 0 === c ? c = b : goog.asserts.assert(goog.isString(c));
  return c
};
wtf.util.Options.prototype.setString = function(a, b) {
  this.setValue_(a, b)
};
wtf.util.Options.prototype.getArray = function(a, b) {
  var c = this.obj_[a];
  void 0 === c ? c = b : goog.asserts.assert(goog.isArray(c));
  return c.slice()
};
wtf.util.Options.prototype.getOptionalArray = function(a, b) {
  var c = this.obj_[a];
  void 0 === c ? c = b : goog.asserts.assert(goog.isArray(c));
  return c ? c.slice() : c
};
wtf.util.Options.prototype.addArrayValue = function(a, b) {
  var c = this.getArray(a, []);
  goog.array.contains(c, b) || (c.push(b), this.setValue_(a, c))
};
wtf.util.Options.prototype.removeArrayValue = function(a, b) {
  var c = this.getArray(a, []);
  goog.array.remove(c, b) && this.setValue_(a, c.length ? c : void 0)
};
// Input 153
wtf.trace.API_VERSION = 2;
wtf.trace.traceManager_ = null;
wtf.trace.getTraceManager = function() {
  if(wtf.trace.traceManager_) {
    return wtf.trace.traceManager_
  }
  var a = new wtf.trace.TraceManager;
  return wtf.trace.traceManager_ = a
};
wtf.trace.prepare = function() {
  return wtf.trace.getTraceManager()
};
wtf.trace.shutdown = function() {
  goog.asserts.assert(wtf.trace.traceManager_);
  wtf.trace.traceManager_ && (wtf.trace.stop(), goog.dispose(wtf.trace.traceManager_), wtf.trace.traceManager_ = null)
};
wtf.trace.addSessionListener = function(a) {
  wtf.trace.getTraceManager().addListener(a)
};
wtf.trace.getOptions_ = function(a) {
  var b = new wtf.util.Options;
  b.mixin(a);
  b.mixin(goog.global.wtf_trace_options);
  return b
};
wtf.trace.getTraceFilename_ = function(a) {
  var b = wtf.trace.getTraceManager().detectContextInfo();
  a.length ? "file://" != a && (a += "-") : a = "file://";
  return(a + b.getFilename()).replace("file://", "")
};
wtf.trace.createStream_ = function(a, b) {
  var c = b || a.getOptionalString("wtf.trace.target");
  if(c instanceof wtf.io.WriteStream) {
    return c
  }
  if(goog.isObject(c) && c.write) {
    return new wtf.io.CustomWriteStream(c)
  }
  if(goog.isString(c)) {
    if("null" == c || goog.string.startsWith(c, "ws://")) {
      return new wtf.io.NullWriteStream
    }
    if(goog.string.startsWith(c, "http://") || goog.string.startsWith(c, "https://") || goog.string.startsWith(c, "//") || goog.string.startsWith(c, "http-rel:")) {
      return goog.string.startsWith(c, "http-rel:") && (c = c.substring(9)), "snapshotting" == a.getOptionalString("wtf.trace.mode") ? new wtf.io.BufferedHttpWriteStream(c) : new wtf.io.StreamingHttpWriteStream(c)
    }
    if(goog.string.startsWith(c, "file://")) {
      return c = wtf.trace.getTraceFilename_(c), new wtf.io.LocalFileWriteStream(c)
    }
  }else {
    if(goog.isArray(c)) {
      return new wtf.io.MemoryWriteStream(c)
    }
  }
  return new wtf.io.MemoryWriteStream([])
};
wtf.trace.start = function(a) {
  var b = wtf.trace.getTraceManager();
  a = wtf.trace.getOptions_(a);
  b.stopSession();
  var c = null;
  switch(a.getOptionalString("wtf.trace.mode")) {
    case "null":
      c = new wtf.trace.NullSession(b, a);
      break;
    default:
    ;
    case "snapshotting":
      c = new wtf.trace.SnapshottingSession(b, a);
      break;
    case "streaming":
      c = wtf.trace.createStream_(a), c = new wtf.trace.StreamingSession(b, c, a)
  }
  b.startSession(c)
};
wtf.trace.snapshot = function(a) {
  var b = wtf.trace.getTraceManager().getCurrentSession();
  b instanceof wtf.trace.SnapshottingSession && (goog.isFunction(a) ? b.snapshot(a) : b.snapshot(function() {
    return wtf.trace.createStream_(b.getOptions(), a)
  }))
};
wtf.trace.reset = function() {
  var a = wtf.trace.getTraceManager().getCurrentSession();
  a instanceof wtf.trace.SnapshottingSession && a.reset()
};
wtf.trace.stop = function() {
  wtf.trace.getTraceManager().stopSession()
};
wtf.trace.createZone = function(a, b, c) {
  return wtf.trace.getTraceManager().createZone(a, b, c)
};
wtf.trace.deleteZone = function(a) {
  wtf.trace.getTraceManager().deleteZone(a)
};
wtf.trace.pushZone = function(a) {
  wtf.trace.getTraceManager().pushZone(a)
};
wtf.trace.popZone = function() {
  wtf.trace.getTraceManager().popZone()
};
wtf.trace.enterScope = wtf.trace.BuiltinEvents.enterScope;
wtf.trace.enterTracingScope = wtf.trace.BuiltinEvents.enterTracingScope;
wtf.trace.leaveScope = wtf.trace.Scope.leave;
wtf.trace.appendScopeData = wtf.trace.BuiltinEvents.appendScopeData;
wtf.trace.branchFlow = wtf.trace.Flow.branch;
wtf.trace.extendFlow = wtf.trace.Flow.extend;
wtf.trace.terminateFlow = wtf.trace.Flow.terminate;
wtf.trace.appendFlowData = wtf.trace.BuiltinEvents.appendFlowData;
wtf.trace.clearFlow = wtf.trace.Flow.clear;
wtf.trace.spanFlow = wtf.trace.Flow.span;
wtf.trace.mark = wtf.trace.BuiltinEvents.mark;
wtf.trace.timeStamp = wtf.trace.BuiltinEvents.timeStamp;
wtf.trace.nextTimeRange_ = 0;
wtf.trace.beginTimeRange = function(a, b, c) {
  var d = wtf.trace.nextTimeRange_++;
  wtf.trace.BuiltinEvents.beginTimeRange(d, a, b, c);
  return d
};
wtf.trace.endTimeRange = wtf.trace.BuiltinEvents.endTimeRange;
wtf.trace.ignoreListener = wtf.trace.util.ignoreListener;
wtf.trace.ignoreDomTree = wtf.trace.util.ignoreDomTree;
wtf.trace.initializeDomEventProperties = wtf.trace.eventtarget.initializeDomEventProperties;
// Input 154
wtf.trace.instrument = function(a, b, c, d, e) {
  c && (b = c + b);
  var f = wtf.data.Variable.parseSignature(b).argMap, g = wtf.trace.events.createScope(b);
  goog.asserts.assert(g);
  if(d) {
    b = d(a, g)
  }else {
    if(!f || !f.length) {
      b = function() {
        e && e.call(this);
        var b = g(), c = a.apply(this, arguments);
        return wtf.trace.leaveScope(b, c)
      }
    }else {
      var h = Array(f.length);
      b = function() {
        e && e.call(this);
        for(var b = 0;b < f.length;b++) {
          h[b] = arguments[f[b].ordinal]
        }
        var b = g.apply(g, h), c = a.apply(this, arguments);
        return wtf.trace.leaveScope(b, c)
      }
    }
  }
  b.uninstrumented = a;
  return b
};
wtf.trace.instrumentType = function(a, b, c) {
  function d() {
  }
  var e = wtf.trace.instrument(a, b);
  d.prototype = a.prototype;
  e.superClass_ = a.prototype;
  e.prototype = new d;
  e.prototype.constructor = e;
  for(var f in a) {
    a.hasOwnProperty(f) && (e[f] = a[f])
  }
  e.uninstrumented = a;
  a = wtf.data.Variable.parseSignature(b).name;
  if(c) {
    b = e.prototype;
    for(var g in c) {
      f = c[g];
      var h = b[g];
      h && (b[g] = wtf.trace.instrument(h, f, a + "#"))
    }
  }
  return e
};
wtf.trace.instrumentTypeSimple = function(a, b, c) {
  for(var d in c) {
    var e = wtf.util.getCompiledMemberName(b, c[d]);
    e && (b[e] = wtf.trace.instrument(b[e], d, a + "#"))
  }
};
// Input 155
wtf.trace.Provider = function() {
  goog.Disposable.call(this);
  this.injections_ = []
};
goog.inherits(wtf.trace.Provider, goog.Disposable);
wtf.trace.Provider.prototype.disposeInternal = function() {
  for(var a = 0;a < this.injections_.length;a++) {
    var b = this.injections_[a];
    b.target[b.name] = b.original
  }
  wtf.trace.Provider.superClass_.disposeInternal.call(this)
};
wtf.trace.Provider.prototype.injectFunction = function(a, b, c) {
  var d = a[b];
  this.injections_.push({target:a, name:b, original:d});
  a[b] = c;
  c.raw = d
};
wtf.trace.Provider.prototype.getSettingsSectionConfigs = function() {
  return[]
};
// Input 156
wtf.trace.providers = {};
wtf.trace.providers.ConsoleProvider = function() {
  wtf.trace.Provider.call(this);
  this.injectConsoleProfiling_()
};
goog.inherits(wtf.trace.providers.ConsoleProvider, wtf.trace.Provider);
wtf.trace.providers.ConsoleProvider.prototype.injectConsoleProfiling_ = function() {
  var a = goog.global.console;
  if(a) {
    var b = {};
    this.injectFunction(a, "time", function(a) {
      b[a] = wtf.trace.beginTimeRange(a)
    });
    this.injectFunction(a, "timeEnd", function(a) {
      var d = b[a];
      delete b[a];
      wtf.trace.endTimeRange(d)
    });
    a.timeStamp && this.injectFunction(a, "timeStamp", function(a) {
      wtf.trace.timeStamp(a)
    })
  }
};
// Input 157
wtf.trace.providers.DomProvider = function() {
  wtf.trace.Provider.call(this);
  if(goog.global.document) {
    try {
      this.injectWindow_()
    }catch(a) {
    }
    try {
      this.injectDocument_()
    }catch(b) {
    }
    try {
      this.injectElements_()
    }catch(c) {
    }
  }
};
goog.inherits(wtf.trace.providers.DomProvider, wtf.trace.Provider);
wtf.trace.providers.DomProvider.prototype.injectWindow_ = function() {
  this.injectElement_("Window", goog.global.Window, Window.prototype)
};
wtf.trace.providers.DomProvider.prototype.injectDocument_ = function() {
  this.injectElement_("Document", goog.global.Document, document)
};
wtf.trace.providers.DomProvider.prototype.injectElements_ = function() {
  var a = {HTMLAnchorElement:"a", HTMLAppletElement:"applet", HTMLAreaElement:"area", HTMLAudioElement:"audio", HTMLBRElement:"br", HTMLBaseElement:"base", HTMLBaseFontElement:"basefont", HTMLBodyElement:"body", HTMLButtonElement:"button", HTMLCanvasElement:"canvas", HTMLContentElement:"content", HTMLDListElement:"dl", HTMLDirectoryElement:"dir", HTMLDivElement:"div", HTMLEmbedElement:"embed", HTMLFieldSetElement:"fieldset", HTMLFontElement:"font", HTMLFormElement:"form", HTMLFrameElement:"frame", 
  HTMLFrameSetElement:"frameset", HTMLHRElement:"hr", HTMLHeadElement:"head", HTMLHeadingElement:"h1", HTMLHtmlElement:"html", HTMLIFrameElement:"iframe", HTMLImageElement:"img", HTMLInputElement:"input", HTMLKeygenElement:"keygen", HTMLLIElement:"li", HTMLLabelElement:"label", HTMLLegendElement:"legend", HTMLLinkElement:"link", HTMLMapElement:"map", HTMLMarqueeElement:"marquee", HTMLMediaElement:"media", HTMLMenuElement:"menu", HTMLMetaElement:"meta", HTMLMeterElement:"meter", HTMLModElement:"ins", 
  HTMLOListElement:"ol", HTMLObjectElement:"object", HTMLOptGroupElement:"optgroup", HTMLOptionElement:"option", HTMLOutputElement:"output", HTMLParagraphElement:"p", HTMLPreElement:"pre", HTMLProgressElement:"progress", HTMLQuoteElement:"quote", HTMLScriptElement:"script", HTMLSelectElement:"select", HTMLSourceElement:"source", HTMLSpanElement:"span", HTMLStyleElement:"style", HTMLTableCaptionElement:"caption", HTMLTableCellElement:"td", HTMLTableColElement:"col", HTMLTableElement:"table", HTMLTableRowElement:"tr", 
  HTMLTableSectionElement:"thead", HTMLTextAreaElement:"textarea", HTMLTitleElement:"title", HTMLTrackElement:"track", HTMLUListElement:"ul", HTMLUnknownElement:"UNKNOWN", HTMLVideoElement:"video"}, b;
  for(b in a) {
    var c = a[b], d = goog.global[b];
    if(d) {
      c = document.createElement(c);
      try {
        this.injectElement_(b, d, c)
      }catch(e) {
      }
    }
  }
};
wtf.trace.providers.DomProvider.prototype.injectElement_ = function(a, b, c) {
  b = b.prototype;
  c = wtf.trace.eventtarget.getEventNames(c);
  c.length || (c = wtf.trace.eventtarget.getEventNames(b));
  a = wtf.trace.eventtarget.createDescriptor(a, c);
  wtf.trace.eventtarget.setDescriptor(b, a);
  wtf.trace.eventtarget.mixin(a, b);
  wtf.trace.eventtarget.setEventProperties(a, b)
};
// Input 158
wtf.ipc = {};
wtf.ipc.Channel = function() {
  wtf.events.EventEmitter.call(this)
};
goog.inherits(wtf.ipc.Channel, wtf.events.EventEmitter);
wtf.ipc.Channel.EventType = {MESSAGE:goog.events.getUniqueId("message")};
// Input 159
wtf.ipc.DomChannel = function(a, b) {
  wtf.ipc.Channel.call(this);
  this.el_ = a;
  this.eventType_ = b;
  this.localId_ = String(goog.now());
  this.boundHandleMessage_ = wtf.trace.util.ignoreListener(goog.bind(this.handleMessage_, this));
  this.el_.addEventListener(this.eventType_, this.boundHandleMessage_, !1)
};
goog.inherits(wtf.ipc.DomChannel, wtf.ipc.Channel);
wtf.ipc.DomChannel.prototype.disposeInternal = function() {
  this.el_.removeEventListener(this.eventType_, this.boundHandleMessage_, !1);
  wtf.ipc.DomChannel.superClass_.disposeInternal.call(this)
};
wtf.ipc.DomChannel.PACKET_TOKEN = "wtf_ipc_connect_token";
wtf.ipc.DomChannel.SENDER_TOKEN = "wtf_ipc_sender_token";
wtf.ipc.DomChannel.prototype.isConnected = function() {
  return!0
};
wtf.ipc.DomChannel.prototype.handleMessage_ = function(a) {
  (a = a.detail) && a && (a[wtf.ipc.DomChannel.PACKET_TOKEN] && a[wtf.ipc.DomChannel.SENDER_TOKEN] != this.localId_) && this.emitEvent(wtf.ipc.Channel.EventType.MESSAGE, a.data)
};
wtf.ipc.DomChannel.prototype.postMessage = function(a) {
  a = {data:a};
  a[wtf.ipc.DomChannel.PACKET_TOKEN] = !0;
  a[wtf.ipc.DomChannel.SENDER_TOKEN] = this.localId_;
  var b = goog.dom.getOwnerDocument(this.el_).createEvent("CustomEvent");
  b.initCustomEvent(this.eventType_, !1, !1, a);
  this.el_.dispatchEvent(b)
};
// Input 160
wtf.ipc.ExtensionChannel = function(a) {
  wtf.ipc.Channel.call(this);
  this.port_ = a;
  a.onMessage.addListener(goog.bind(this.handleMessage_, this));
  a.onDisconnect.addListener(goog.bind(this.handleDisconnect_, this))
};
goog.inherits(wtf.ipc.ExtensionChannel, wtf.ipc.Channel);
wtf.ipc.ExtensionChannel.prototype.disposeInternal = function() {
  this.port_ = null;
  wtf.ipc.ExtensionChannel.superClass_.disposeInternal.call(this)
};
wtf.ipc.ExtensionChannel.PACKET_TOKEN = "wtf_ipc_connect_token";
wtf.ipc.ExtensionChannel.prototype.handleDisconnect_ = function() {
  this.port_ = null
};
wtf.ipc.ExtensionChannel.prototype.isConnected = function() {
  return!!this.port_
};
wtf.ipc.ExtensionChannel.prototype.handleMessage_ = function(a) {
  a && a[wtf.ipc.ExtensionChannel.PACKET_TOKEN] && this.emitEvent(wtf.ipc.Channel.EventType.MESSAGE, a.data)
};
wtf.ipc.ExtensionChannel.prototype.postMessage = function(a) {
  this.port_ && (a = {data:a}, a[wtf.ipc.ExtensionChannel.PACKET_TOKEN] = !0, this.port_.postMessage(a))
};
// Input 161
wtf.ipc.MessageChannel = function(a, b) {
  wtf.ipc.Channel.call(this);
  this.recvPort_ = a;
  this.sendPort_ = b;
  this.hasTransferablePostMessage_ = !1;
  this.boundHandleMessage_ = wtf.trace.util.ignoreListener(goog.bind(this.handleMessage_, this));
  this.recvPort_.addEventListener(goog.events.EventType.MESSAGE, this.boundHandleMessage_, !0)
};
goog.inherits(wtf.ipc.MessageChannel, wtf.ipc.Channel);
wtf.ipc.MessageChannel.prototype.disposeInternal = function() {
  this.recvPort_.removeEventListener(goog.events.EventType.MESSAGE, this.boundHandleMessage_, !0);
  this.sendPort_ = this.recvPort_ = null;
  wtf.ipc.MessageChannel.superClass_.disposeInternal.call(this)
};
wtf.ipc.MessageChannel.PACKET_TOKEN = "wtf_ipc_connect_token";
wtf.ipc.MessageChannel.prototype.isConnected = function() {
  return!!this.sendPort_ && !this.sendPort_.closed
};
wtf.ipc.MessageChannel.prototype.focus = function() {
  this.sendPort_ && this.sendPort_.focus()
};
wtf.ipc.MessageChannel.prototype.handleMessage_ = function(a) {
  var b = a.data;
  b && b[wtf.ipc.MessageChannel.PACKET_TOKEN] && (a.stopPropagation(), this.emitEvent(wtf.ipc.Channel.EventType.MESSAGE, b.data))
};
wtf.ipc.MessageChannel.prototype.postMessage = function(a, b) {
  if(this.sendPort_) {
    var c = {data:a};
    c[wtf.ipc.MessageChannel.PACKET_TOKEN] = !0;
    if(void 0 === this.hasTransferablePostMessage_) {
      try {
        this.sendPort_.postMessage(c, "*", b), this.hasTransferablePostMessage_ = !0
      }catch(d) {
        this.hasTransferablePostMessage_ = !1, this.sendPort_.postMessage(c, "*")
      }
    }else {
      this.hasTransferablePostMessage_ ? this.sendPort_.postMessage(c, "*", b) : this.sendPort_.postMessage(c, "*")
    }
  }
};
// Input 162
wtf.ipc.connectToParentWindow = function(a, b) {
  var c = goog.global.chrome;
  if(c && c.runtime && c.runtime.getBackgroundPage) {
    c.runtime.getBackgroundPage(function(c) {
      c = new wtf.ipc.MessageChannel(window, c);
      c.postMessage({hello:!0});
      a.call(b, c)
    })
  }else {
    if(window.opener) {
      var d = new wtf.ipc.MessageChannel(window, window.opener);
      d.postMessage({hello:!0});
      wtf.timing.setImmediate(function() {
        a.call(b, d)
      })
    }else {
      wtf.timing.setImmediate(function() {
        a.call(b, null)
      })
    }
  }
};
wtf.ipc.waitForChildWindow = function(a, b) {
  var c = wtf.trace.util.ignoreListener(function(d) {
    d.data && (d.data[wtf.ipc.MessageChannel.PACKET_TOKEN] && d.data.data && !0 == d.data.data.hello) && (d.stopPropagation(), window.removeEventListener(goog.events.EventType.MESSAGE, c, !0), goog.asserts.assert(d.source), d = new wtf.ipc.MessageChannel(window, d.source), a.call(b, d))
  });
  window.addEventListener(goog.events.EventType.MESSAGE, c, !0)
};
wtf.ipc.listenForChildWindows = function(a, b) {
  var c = wtf.trace.util.ignoreListener(function(d) {
    d.data && (d.data[wtf.ipc.MessageChannel.PACKET_TOKEN] && d.data.data && !0 == d.data.data.hello) && (d.stopPropagation(), window.removeEventListener(goog.events.EventType.MESSAGE, c, !0), goog.asserts.assert(d.source), d = new wtf.ipc.MessageChannel(window, d.source), a.call(b, d))
  });
  window.addEventListener(goog.events.EventType.MESSAGE, c, !0)
};
wtf.ipc.connectToExtension = function(a) {
  a = chrome.extension.connect(a);
  return!a ? null : new wtf.ipc.ExtensionChannel(a)
};
wtf.ipc.openDomChannel = function(a, b) {
  return new wtf.ipc.DomChannel(a, b)
};
// Input 163
wtf.trace.providers.ExtendedInfoProvider = function() {
  wtf.trace.Provider.call(this);
  this.timelineDispatch_ = {};
  this.setupTimelineDispatch_();
  this.extensionChannel_ = null;
  goog.global.document && (this.extensionChannel_ = wtf.ipc.openDomChannel(goog.global.document, "WtfContentScriptEvent"));
  this.registerDisposable(this.extensionChannel_);
  this.extensionChannel_ && this.extensionChannel_.addListener(wtf.ipc.Channel.EventType.MESSAGE, this.extensionMessage_, this)
};
goog.inherits(wtf.trace.providers.ExtendedInfoProvider, wtf.trace.Provider);
wtf.trace.providers.ExtendedInfoProvider.prototype.getSettingsSectionConfigs = function() {
  return[{title:"System Events", widgets:[{type:"checkbox", key:"wtf.trace.provider.browser", title:"GCs/paints/layouts/etc", "default":!1}]}]
};
wtf.trace.providers.ExtendedInfoProvider.prototype.setupTimelineDispatch_ = function() {
  var a = wtf.timebase(), b = wtf.trace.events.createScope("javascript#gc(uint32 usedHeapSize, uint32 usedHeapSizeDelta)", wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_.GCEvent = function(c) {
    var d = c.endTime - a;
    c = b(c.usedHeapSize, c.usedHeapSizeDelta, c.startTime - a);
    wtf.trace.leaveScope(c, void 0, d)
  };
  var c = wtf.trace.events.createScope("javascript#evalscript(uint32 usedHeapSize, uint32 usedHeapSizeDelta)", wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_.EvaluateScript = function(b) {
    var d = b.endTime - a;
    b = c(b.usedHeapSize, b.usedHeapSizeDelta, b.startTime - a);
    wtf.trace.leaveScope(b, void 0, d)
  };
  var d = wtf.trace.events.createScope("browser#parseHtml(uint32 contentLength)", wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_.ParseHTML = function(b) {
    var c = b.endTime - a;
    b = d(b.length, b.startTime - a);
    wtf.trace.leaveScope(b, void 0, c)
  };
  var e = wtf.trace.events.createInstance("browser#invalidateStyles()");
  this.timelineDispatch_.ScheduleStyleRecalculation = function(b) {
    e(b.time - a)
  };
  var f = wtf.trace.events.createScope("browser#recalculateStyles()", wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_.ParseHTML = function(b) {
    var c = b.endTime - a;
    b = f(b.startTime - a);
    wtf.trace.leaveScope(b, void 0, c)
  };
  var g = wtf.trace.events.createInstance("browser#invalidateLayout()");
  this.timelineDispatch_.InvalidateLayout = function(b) {
    g(b.time - a)
  };
  var h = wtf.trace.events.createScope("browser#layout(int32 x, int32 y, int32 width, int32 height)", wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_.Layout = function(b) {
    var c = b.endTime - a;
    b = h(b.x, b.y, b.width, b.height, b.startTime - a);
    wtf.trace.leaveScope(b, void 0, c)
  };
  var i = wtf.trace.events.createScope("browser#paint(int32 x, int32 y, int32 width, int32 height)", wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_.Paint = function(b) {
    var c = b.endTime - a;
    b = i(b.x, b.y, b.width, b.height, b.startTime - a);
    wtf.trace.leaveScope(b, void 0, c)
  };
  var j = wtf.trace.events.createScope("browser#compositeLayers()", wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_.CompositeLayers = function(b) {
    var c = b.endTime - a;
    b = j(b.startTime - a);
    wtf.trace.leaveScope(b, void 0, c)
  };
  var k = wtf.trace.events.createScope("browser#decodeImage(ascii imageType)", wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_.DecodeImage = function(b) {
    var c = b.endTime - a;
    b = k(b.imageType, b.startTime - a);
    wtf.trace.leaveScope(b, void 0, c)
  };
  var m = wtf.trace.events.createScope("browser#resizeImage(bool cached)", wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_.ResizeImage = function(b) {
    var c = b.endTime - a;
    b = m(b.cached, b.startTime - a);
    wtf.trace.leaveScope(b, void 0, c)
  }
};
wtf.trace.providers.ExtendedInfoProvider.prototype.extensionMessage_ = function(a) {
  switch(a.command) {
    case "trace_events":
      a = a.contents;
      for(var b = 0;b < a.length;b++) {
        var c = a[b], d = this.timelineDispatch_[c.type];
        d && d(c)
      }
  }
};
// Input 164
wtf.trace.providers.ImageProvider = function() {
  wtf.trace.Provider.call(this);
  goog.global.Image && this.injectImage_()
};
goog.inherits(wtf.trace.providers.ImageProvider, wtf.trace.Provider);
wtf.trace.providers.ImageProvider.prototype.injectImage_ = function() {
  var a = Image.prototype, b = new Image, b = wtf.trace.eventtarget.getEventNames(b);
  b.length || (b = wtf.trace.eventtarget.getEventNames(a));
  b = wtf.trace.eventtarget.createDescriptor("Image", b);
  wtf.trace.eventtarget.setDescriptor(a, b);
  wtf.trace.eventtarget.mixin(b, a);
  wtf.trace.eventtarget.setEventProperties(b, a)
};
// Input 165
wtf.trace.providers.TimingProvider = function() {
  wtf.trace.Provider.call(this);
  this.injectTimeouts_();
  this.injectSetImmediate_();
  this.injectRequestAnimationFrame_()
};
goog.inherits(wtf.trace.providers.TimingProvider, wtf.trace.Provider);
wtf.trace.providers.TimingProvider.prototype.injectTimeouts_ = function() {
  var a = wtf.trace.events.createInstance("window#setTimeout(uint32 delay, uint32 timeoutId)"), b = wtf.trace.events.createScope("window#setTimeout:callback(uint32 timeoutId)"), c = goog.global.setTimeout, d = {};
  this.injectFunction(goog.global, "setTimeout", function(e, f) {
    var g = Array.prototype.slice.call(arguments, 2), h = [-1], j, i = c.call(goog.global, function() {
      var a = b(h[0]);
      wtf.trace.extendFlow(j, "callback");
      try {
        e && (goog.isString(e) ? eval(e) : e.apply(goog.global, g))
      }finally {
        delete d[h[0]], wtf.trace.terminateFlow(j), wtf.trace.leaveScope(a)
      }
    }, f);
    h[0] = i;
    a(f, i);
    j = wtf.trace.branchFlow("window#setTimeout");
    d[i] = j;
    return i
  });
  var e = wtf.trace.events.createInstance("window#clearTimeout(uint32 timeoutId)"), f = goog.global.clearTimeout;
  this.injectFunction(goog.global, "clearTimeout", function(a) {
    f.call(goog.global, a);
    var b = d[a];
    b && (wtf.trace.terminateFlow(b), delete d[a]);
    e(a)
  });
  var g = wtf.trace.events.createInstance("window#setInterval(uint32 delay, uint32 intervalId)"), h = wtf.trace.events.createScope("window#setInterval:callback(uint32 intervalId)"), i = goog.global.setInterval, j = {};
  this.injectFunction(goog.global, "setInterval", function(a, b) {
    var c = Array.prototype.slice.call(arguments, 2), d = [-1], e, f = i.call(goog.global, function() {
      var b = h(d[0]);
      wtf.trace.extendFlow(e, "callback");
      try {
        a && (goog.isString(a) ? eval(a) : a.apply(goog.global, c))
      }finally {
        wtf.trace.leaveScope(b)
      }
    }, b);
    d[0] = f;
    g(b, f);
    e = wtf.trace.branchFlow("window#setInterval");
    j[f] = e;
    return f
  });
  var k = wtf.trace.events.createInstance("window#clearInterval(uint32 intervalId)"), m = goog.global.clearInterval;
  this.injectFunction(goog.global, "clearInterval", function(a) {
    m.call(goog.global, a);
    var b = j[a];
    b && (wtf.trace.terminateFlow(b), delete j[a]);
    k(a)
  })
};
wtf.trace.providers.TimingProvider.prototype.injectSetImmediate_ = function() {
  var a = goog.global.msSetImmediate;
  if(a) {
    var b = wtf.trace.events.createInstance("window#setImmediate(uint32 immediateId)"), c = wtf.trace.events.createScope("window#setImmediate:callback(uint32 immediateId)"), d = {};
    this.injectFunction(goog.global, "msSetImmediate", function(e) {
      var f = Array.prototype.slice.call(arguments, 2), i = [-1], j, k = a.call(goog.global, function() {
        var a = c(i[0]);
        wtf.trace.extendFlow(j, "callback");
        try {
          e && (goog.isString(e) ? eval(e) : e.apply(goog.global, f))
        }finally {
          delete d[i[0]], wtf.trace.terminateFlow(j), wtf.trace.leaveScope(a)
        }
      });
      i[0] = k;
      b(k);
      j = wtf.trace.branchFlow("window#setImmediate");
      d[k] = j;
      return k
    });
    var e = wtf.trace.events.createInstance("window#clearImmediate(uint32 immediateId)"), f = goog.global.msClearInterval;
    this.injectFunction(goog.global, "msClearImmediate", function(a) {
      f.call(goog.global, a);
      var b = d[a];
      b && (wtf.trace.terminateFlow(b), delete d[a]);
      e(a)
    })
  }
};
wtf.trace.providers.TimingProvider.RAF_NAMES_ = "requestAnimationFrame cancelAnimationFrame mozRequestAnimationFrame mozCancelAnimationFrame msRequestAnimationFrame msCAncelAnimationFrame oRequestAnimationFrame oCancelAnimationFrame webkitRequestAnimationFrame webkitCancelAnimationFrame".split(" ");
wtf.trace.providers.TimingProvider.prototype.injectRequestAnimationFrame_ = function() {
  for(var a = {frameStart:wtf.trace.events.createInstance("wtf.timing#frameStart(uint32 number)", wtf.data.EventFlag.INTERNAL), frameEnd:wtf.trace.events.createInstance("wtf.timing#frameEnd(uint32 number)", wtf.data.EventFlag.INTERNAL), requestAnimationFrame:wtf.trace.events.createInstance("window#requestAnimationFrame(uint32 handle)"), requestAnimationFrameCallback:wtf.trace.events.createScope("window#requestAnimationFrame:callback(uint32 handle)"), cancelAnimationFrame:wtf.trace.events.createInstance("window#cancelAnimationFrame(uint32 handle)")}, 
  b = wtf.trace.providers.TimingProvider.RAF_NAMES_, c = 0;c < b.length;c += 2) {
    var d = b[c], e = b[c + 1];
    goog.global[d] && this.injectRequestAnimationFrameFn_(d, e, a)
  }
};
wtf.trace.providers.TimingProvider.prototype.injectRequestAnimationFrameFn_ = function(a, b, c) {
  var d = 0, e = [], f = [], g = {}, h = goog.global[a];
  this.injectFunction(goog.global, a, function(a) {
    var b = [-1], i, l = h.call(goog.global, function() {
      var h = wtf.now();
      f.length || (d++, f.push.apply(f, e), e.length = 0, c.frameStart(d, h));
      h = c.requestAnimationFrameCallback(b[0], h);
      wtf.trace.extendFlow(i, "callback");
      try {
        a.apply(this, arguments)
      }finally {
        delete g[b[0]], wtf.trace.terminateFlow(i), wtf.trace.leaveScope(h), f[f.length - 1] == b[0] && (h = wtf.now(), c.frameEnd(d, h), f.length = 0)
      }
    });
    b[0] = l;
    e.push(l);
    c.requestAnimationFrame(l);
    i = wtf.trace.branchFlow("window#requestAnimationFrame");
    g[l] = i;
    return l
  });
  var i = goog.global[b];
  a = function(a) {
    goog.array.remove(e, a);
    i.call(goog.global, a);
    var b = g[a];
    b && (wtf.trace.terminateFlow(b), delete g[a]);
    c.cancelAnimationFrame(a)
  };
  i && this.injectFunction(goog.global, b, a)
};
// Input 166
wtf.trace.providers.WebWorkerProvider = function() {
  wtf.trace.Provider.call(this);
  this.childWorkers_ = [];
  "function" == typeof goog.global.Worker && this.injectBrowserShim_();
  goog.global.HTMLDivElement || this.injectProxyWorker_()
};
goog.inherits(wtf.trace.providers.WebWorkerProvider, wtf.trace.Provider);
wtf.trace.providers.WebWorkerProvider.prototype.getSettingsSectionConfigs = function() {
  return[{title:"Web Workers", widgets:[{type:"checkbox", key:"wtf.trace.provider.webworker.inject", title:"Auto Inject", "default":!0}]}]
};
wtf.trace.providers.WebWorkerProvider.prototype.injectBrowserShim_ = function() {
  var a = this, b = goog.global.Worker, c = wtf.trace.eventtarget.createDescriptor("Worker", ["error", "message"]), d = wtf.trace.util.getScriptUrl(), e = new goog.Uri(goog.global.location.href), f = 0, g = wtf.trace.events.createScope("Worker(ascii scriptUrl, uint32 id)"), h = function(h) {
    wtf.trace.eventtarget.BaseEventTarget.call(this, c);
    this.scriptUrl_ = h;
    this.workerId_ = f++;
    var j = goog.Uri.resolve(e, h).toString(), j = ["this.WTF_WORKER_ID = " + this.workerId_ + ";", 'this.WTF_WORKER_BASE_URI = "' + goog.global.location.href + '";', 'importScripts("' + d + '");', "wtf.trace.start({\n});", 'importScripts("' + j + '");'].join("\n"), j = new Blob([j], {type:"text/javascript"}), j = goog.global.URL ? goog.global.URL.createObjectURL(j) : goog.global.webkitURL.createObjectURL(j);
    h = g(h, this.workerId_);
    var i;
    try {
      i = new b(j)
    }finally {
      wtf.trace.leaveScope(h)
    }
    this.handle_ = i;
    this.trackers_ = {};
    this.setEventHook("error", function() {
      wtf.trace.appendScopeData("id", this.workerId_)
    }, this);
    this.setEventHook("message", function() {
      wtf.trace.appendScopeData("id", this.workerId_)
    }, this);
    var k = this;
    this.handle_.addEventListener("message", function(b) {
      if(b.data.__wtf_worker_msg__) {
        var c = b.data.value;
        switch(b.data.command) {
          case "snapshot":
            b = n[c.id];
            delete n[c.id];
            b.getError() || b.setValue(c.data);
            break;
          case "close":
            goog.array.remove(a.childWorkers_, k)
        }
      }
    }, !1);
    a.childWorkers_.push(this)
  };
  goog.inherits(h, wtf.trace.eventtarget.BaseEventTarget);
  h.prototype.beginTrackingEvent = function(a) {
    var b = this, c = function(a) {
      b.dispatchEvent(a)
    };
    this.trackers_[a] = c;
    this.handle_.addEventListener(a, c, !1)
  };
  h.prototype.endTrackingEvent = function(a) {
    this.handle_.removeEventListener(a, this.trackers_[a], !1);
    delete this.trackers_[a]
  };
  for(var i = c.eventInfos, j = 0;j < i.length;j++) {
    var k = i[j];
    Object.defineProperty(h.prototype, "on" + k.name, {configurable:!1, enumerable:!1, get:k.getter, set:k.setter})
  }
  h.prototype.sendMessage = function(a, b) {
    this.handle_.postMessage({__wtf_worker_msg__:!0, command:a, value:b || null})
  };
  var m = wtf.trace.events.createScope("Worker#postMessage(uint32 id)");
  h.prototype.postMessage = function(a, b) {
    var c = m(this.workerId_);
    try {
      this.handle_.postMessage(a, b)
    }finally {
      wtf.trace.leaveScope(c)
    }
  };
  var l = wtf.trace.events.createInstance("Worker#terminate(uint32 id)");
  h.prototype.terminate = function() {
    goog.array.remove(a.childWorkers_, this);
    l(this.workerId_);
    this.handle_.terminate()
  };
  var n = {}, p = 0;
  h.prototype.requestSnapshot = function() {
    var a = new goog.result.SimpleResult, b = p++;
    n[b] = a;
    this.sendMessage("snapshot", {id:b});
    return a
  };
  this.injectFunction(goog.global, "Worker", h)
};
wtf.trace.providers.WebWorkerProvider.prototype.injectProxyWorker_ = function() {
  function a(a, b) {
    h.call(goog.global, {__wtf_worker_msg__:!0, command:a, value:b || null}, [])
  }
  var b = new goog.Uri(goog.global.WTF_WORKER_BASE_URI), c = wtf.trace.eventtarget.createDescriptor("WorkerGlobalScope", ["error", "online", "offline", "message"]);
  wtf.trace.eventtarget.mixin(c, goog.global);
  wtf.trace.eventtarget.setEventProperties(c, goog.global);
  var d = goog.global.importScripts, e = wtf.trace.events.createScope("WorkerUtils#importScripts(any urls)");
  this.injectFunction(goog.global, "importScripts", function(a) {
    for(var c = Array(arguments.length), f = 0;f < arguments.length;f++) {
      c[f] = goog.Uri.resolve(b, arguments[f]).toString()
    }
    f = e(c);
    try {
      return d.apply(goog.global, c)
    }finally {
      wtf.trace.leaveScope(f)
    }
  });
  var f = goog.global.close, g = wtf.trace.events.createInstance("WorkerGlobalScope#close()");
  this.injectFunction(goog.global, "close", function() {
    g();
    a("close");
    f.call(goog.global)
  });
  var h = goog.global.postMessage, i = wtf.trace.events.createScope("DedicatedWorkerGlobalScope#postMessage()");
  this.injectFunction(goog.global, "postMessage", function(a, b) {
    var c = i();
    try {
      h.call(goog.global, a, b)
    }finally {
      wtf.trace.leaveScope(c)
    }
  });
  goog.global.addEventListener("message", function(b) {
    if(b.data.__wtf_worker_msg__) {
      var c = b.data.value;
      switch(b.data.command) {
        case "snapshot":
          var d = [];
          wtf.trace.snapshot(d);
          a("snapshot", {id:c.id, data:d}, d[0])
      }
      delete b.data.__wtf_worker_msg__;
      delete b.data.command;
      delete b.data.value
    }
  }, !1)
};
// Input 167
wtf.trace.providers.XhrProvider = function() {
  wtf.trace.Provider.call(this);
  goog.global.XMLHttpRequest && this.injectXhr_()
};
goog.inherits(wtf.trace.providers.XhrProvider, wtf.trace.Provider);
wtf.trace.providers.XhrProvider.prototype.injectXhr_ = function() {
  function a(a, b) {
    Object.defineProperty(d.prototype, a, {configurable:!0, enumerable:!0, get:function() {
      return this.handle_[a]
    }, set:b ? function(b) {
      this.props_[a] = b;
      this.handle_[a] = b
    } : function(b) {
      this.handle_[a] = b
    }})
  }
  var b = goog.global.XMLHttpRequest, c = wtf.trace.eventtarget.createDescriptor("XMLHttpRequest", "loadstart progress abort error load timeout loadend readystatechange".split(" ")), d = function() {
    wtf.trace.eventtarget.BaseEventTarget.call(this, c);
    this.handle_ = new b;
    this.trackers_ = {};
    this.props_ = {method:null, url:null, async:!0, user:null, headers:{}, timeout:0, withCredentials:!1, overrideMimeType:null, responseType:""};
    this.flow_ = null;
    var a = this, d = this.handle_, e = this.props_;
    this.handle_.addEventListener("readystatechange", function() {
      var b = a.flow_;
      if(b) {
        var c = void 0;
        if(2 == d.readyState) {
          for(var c = {}, e = d.getAllResponseHeaders().split("\r\n"), f = 0;f < e.length;f++) {
            if(e[f].length) {
              var g = e[f].split(":");
              c[g[0]] = g[1].substr(1)
            }
          }
          c = {status:this.status, statusText:this.statusText, headers:c}
        }
        4 > d.readyState ? wtf.trace.Flow.extend(b, "readyState: " + d.readyState, c) : wtf.trace.Flow.terminate(b, "readyState: " + d.readyState)
      }
    }, !1);
    this.setEventHook("readystatechange", function() {
      wtf.trace.appendScopeData("url", e.url);
      wtf.trace.appendScopeData("readyState", d.readyState)
    });
    this.setEventHook("load", function() {
      wtf.trace.appendScopeData("url", e.url)
    })
  };
  goog.inherits(d, wtf.trace.eventtarget.BaseEventTarget);
  d.UNSENT = 0;
  d.OPENED = 1;
  d.HEADERS_RECEIVED = 2;
  d.LOADING = 3;
  d.DONE = 4;
  d.prototype.UNSENT = 0;
  d.prototype.OPENED = 1;
  d.prototype.HEADERS_RECEIVED = 2;
  d.prototype.LOADING = 3;
  d.prototype.DONE = 4;
  d.prototype.beginTrackingEvent = function(a) {
    var b = this, c = function(a) {
      b.dispatchEvent(a)
    };
    this.trackers_[a] = c;
    this.handle_.addEventListener(a, c, !1)
  };
  d.prototype.endTrackingEvent = function(a) {
    this.handle_.removeEventListener(a, this.trackers_[a], !1);
    delete this.trackers_[a]
  };
  for(var e = c.eventInfos, f = 0;f < e.length;f++) {
    var g = e[f];
    Object.defineProperty(d.prototype, "on" + g.name, {configurable:!1, enumerable:!1, get:g.getter, set:g.setter})
  }
  a("readyState");
  a("timeout", !0);
  a("withCredentials", !0);
  a("upload");
  d.prototype.setRequestHeader = function(a, b) {
    this.props_.headers[a] = b;
    this.handle_.setRequestHeader(a, b)
  };
  d.prototype.overrideMimeType = function(a) {
    this.props_.overrideMimeType = a;
    this.handle_.overrideMimeType(a)
  };
  var h = wtf.trace.events.createScope("XMLHttpRequest#open(ascii method, ascii url, any props)");
  d.prototype.open = function(a, b, c, d, e) {
    var f = this.props_;
    f.method = a;
    f.url = b;
    f.async = void 0 === c ? !0 : c;
    f.user = d || null;
    this.flow_ = wtf.trace.Flow.branch("open");
    f = h(f.method, f.url, f);
    try {
      return this.handle_.open(a, b, c, d, e)
    }finally {
      wtf.trace.Scope.leave(f)
    }
  };
  var i = wtf.trace.events.createScope("XMLHttpRequest#send(ascii method, ascii url, any props)");
  d.prototype.send = function(a) {
    var b = this.flow_, c = this.props_;
    b && wtf.trace.Flow.extend(b, "send");
    b = i(c.method, c.url, c);
    try {
      this.handle_.send(a)
    }finally {
      wtf.trace.Scope.leave(b)
    }
  };
  var j = wtf.trace.events.createScope("XMLHttpRequest#abort()");
  d.prototype.abort = function() {
    var a = j(), b = this.flow_;
    this.flow_ = null;
    b && wtf.trace.Flow.terminate(b, "aborted");
    try {
      this.handle_.abort()
    }finally {
      wtf.trace.Scope.leave(a)
    }
  };
  a("status");
  a("statusText");
  a("responseType", !0);
  a("response");
  a("responseText");
  a("responseXML");
  d.prototype.getResponseHeader = function(a) {
    return this.handle_.getResponseHeader(a)
  };
  d.prototype.getAllResponseHeaders = function() {
    return this.handle_.getAllResponseHeaders()
  };
  this.injectFunction(goog.global, "XMLHttpRequest", d)
};
// Input 168
wtf.trace.providers.setup = function() {
  var a = wtf.trace.getTraceManager();
  a.addProvider(new wtf.trace.providers.ConsoleProvider);
  a.addProvider(new wtf.trace.providers.TimingProvider);
  wtf.NODE || (a.addProvider(new wtf.trace.providers.DomProvider), a.addProvider(new wtf.trace.providers.ImageProvider), a.addProvider(new wtf.trace.providers.XhrProvider), a.addProvider(new wtf.trace.providers.WebWorkerProvider), a.addProvider(new wtf.trace.providers.ExtendedInfoProvider))
};
// Input 169
wtf.trace.exports = {};
wtf.trace.providers.setup();
wtf.trace.exports.ENABLE_EXPORTS = !0;
wtf.trace.exports.ENABLE_EXPORTS && (goog.exportSymbol("wtf.trace.API_VERSION", wtf.trace.API_VERSION), goog.exportSymbol("wtf.trace.prepare", wtf.trace.prepare), goog.exportSymbol("wtf.trace.shutdown", wtf.trace.shutdown), goog.exportSymbol("wtf.trace.start", wtf.trace.start), goog.exportSymbol("wtf.trace.snapshot", wtf.trace.snapshot), goog.exportSymbol("wtf.trace.reset", wtf.trace.reset), goog.exportSymbol("wtf.trace.stop", wtf.trace.stop), goog.exportSymbol("wtf.trace.events.createInstance", 
wtf.trace.events.createInstance), goog.exportSymbol("wtf.trace.events.createScope", wtf.trace.events.createScope), goog.exportSymbol("wtf.trace.createZone", wtf.trace.createZone), goog.exportSymbol("wtf.trace.deleteZone", wtf.trace.deleteZone), goog.exportSymbol("wtf.trace.pushZone", wtf.trace.pushZone), goog.exportSymbol("wtf.trace.popZone", wtf.trace.popZone), goog.exportSymbol("wtf.trace.enterScope", wtf.trace.enterScope), goog.exportSymbol("wtf.trace.enterTracingScope", wtf.trace.enterTracingScope), 
goog.exportSymbol("wtf.trace.leaveScope", wtf.trace.leaveScope), goog.exportSymbol("wtf.trace.appendScopeData", wtf.trace.appendScopeData), goog.exportSymbol("wtf.trace.branchFlow", wtf.trace.branchFlow), goog.exportSymbol("wtf.trace.extendFlow", wtf.trace.extendFlow), goog.exportSymbol("wtf.trace.terminateFlow", wtf.trace.terminateFlow), goog.exportSymbol("wtf.trace.appendFlowData", wtf.trace.appendFlowData), goog.exportSymbol("wtf.trace.clearFlow", wtf.trace.clearFlow), goog.exportSymbol("wtf.trace.spanFlow", 
wtf.trace.spanFlow), goog.exportSymbol("wtf.trace.mark", wtf.trace.mark), goog.exportSymbol("wtf.trace.timeStamp", wtf.trace.timeStamp), goog.exportSymbol("wtf.trace.beginTimeRange", wtf.trace.beginTimeRange), goog.exportSymbol("wtf.trace.endTimeRange", wtf.trace.endTimeRange), goog.exportSymbol("wtf.trace.ignoreListener", wtf.trace.ignoreListener), goog.exportSymbol("wtf.trace.ignoreDomTree", wtf.trace.ignoreDomTree), goog.exportSymbol("wtf.trace.initializeDomEventProperties", wtf.trace.initializeDomEventProperties), 
goog.exportSymbol("wtf.trace.instrument", wtf.trace.instrument), goog.exportSymbol("wtf.trace.instrumentType", wtf.trace.instrumentType), goog.exportSymbol("wtf.trace.instrumentTypeSimple", wtf.trace.instrumentTypeSimple));
// Input 170
wtf.trace.node = {};
wtf.NODE && (wtf.trace.node.start = function(a) {
  wtf.trace.start(a);
  process.on("exit", function() {
    wtf.trace.snapshot("file://");
    wtf.trace.stop()
  });
  process.on("SIGINT", function() {
    process.exit()
  })
}, goog.exportSymbol("wtf.trace.node.start", wtf.trace.node.start));
;return this.wtf;}).call(global); delete global.wtf;
