module.exports = (function(exports){// Input 0
'use strict';var COMPILED = !0, goog = goog || {};
goog.global = this;
goog.exportPath_ = function(a, b, c) {
  a = a.split(".");
  c = c || goog.global;
  a[0] in c || !c.execScript || c.execScript("var " + a[0]);
  for (var d;a.length && (d = a.shift());) {
    a.length || void 0 === b ? c = c[d] ? c[d] : c[d] = {} : c[d] = b;
  }
};
goog.define = function(a, b) {
  var c = b;
  COMPILED || goog.global.CLOSURE_DEFINES && Object.prototype.hasOwnProperty.call(goog.global.CLOSURE_DEFINES, a) && (c = goog.global.CLOSURE_DEFINES[a]);
  goog.exportPath_(a, c);
};
goog.DEBUG = !1;
goog.LOCALE = "en";
goog.TRUSTED_SITE = !0;
goog.provide = function(a) {
  if (!COMPILED) {
    if (goog.isProvided_(a)) {
      throw Error('Namespace "' + a + '" already declared.');
    }
    delete goog.implicitNamespaces_[a];
    for (var b = a;(b = b.substring(0, b.lastIndexOf("."))) && !goog.getObjectByName(b);) {
      goog.implicitNamespaces_[b] = !0;
    }
  }
  goog.exportPath_(a);
};
goog.setTestOnly = function(a) {
  if (COMPILED && !goog.DEBUG) {
    throw a = a || "", Error("Importing test-only code into non-debug environment" + a ? ": " + a : ".");
  }
};
COMPILED || (goog.isProvided_ = function(a) {
  return!goog.implicitNamespaces_[a] && !!goog.getObjectByName(a);
}, goog.implicitNamespaces_ = {});
goog.getObjectByName = function(a, b) {
  for (var c = a.split("."), d = b || goog.global, e;e = c.shift();) {
    if (goog.isDefAndNotNull(d[e])) {
      d = d[e];
    } else {
      return null;
    }
  }
  return d;
};
goog.globalize = function(a, b) {
  var c = b || goog.global, d;
  for (d in a) {
    c[d] = a[d];
  }
};
goog.addDependency = function(a, b, c) {
  if (goog.DEPENDENCIES_ENABLED) {
    var d;
    a = a.replace(/\\/g, "/");
    for (var e = goog.dependencies_, f = 0;d = b[f];f++) {
      e.nameToPath[d] = a, a in e.pathToNames || (e.pathToNames[a] = {}), e.pathToNames[a][d] = !0;
    }
    for (d = 0;b = c[d];d++) {
      a in e.requires || (e.requires[a] = {}), e.requires[a][b] = !0;
    }
  }
};
goog.ENABLE_DEBUG_LOADER = !0;
goog.require = function(a) {
  if (!COMPILED && !goog.isProvided_(a)) {
    if (goog.ENABLE_DEBUG_LOADER) {
      var b = goog.getPathFromDeps_(a);
      if (b) {
        goog.included_[b] = !0;
        goog.writeScripts_();
        return;
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
goog.identityFunction = function(a, b) {
  return a;
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(a) {
  a.getInstance = function() {
    if (a.instance_) {
      return a.instance_;
    }
    goog.DEBUG && (goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = a);
    return a.instance_ = new a;
  };
};
goog.instantiatedSingletons_ = [];
goog.DEPENDENCIES_ENABLED = !COMPILED && goog.ENABLE_DEBUG_LOADER;
goog.DEPENDENCIES_ENABLED && (goog.included_ = {}, goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}}, goog.inHtmlDocument_ = function() {
  var a = goog.global.document;
  return "undefined" != typeof a && "write" in a;
}, goog.findBasePath_ = function() {
  if (goog.global.CLOSURE_BASE_PATH) {
    goog.basePath = goog.global.CLOSURE_BASE_PATH;
  } else {
    if (goog.inHtmlDocument_()) {
      for (var a = goog.global.document.getElementsByTagName("script"), b = a.length - 1;0 <= b;--b) {
        var c = a[b].src, d = c.lastIndexOf("?"), d = -1 == d ? c.length : d;
        if ("base.js" == c.substr(d - 7, 7)) {
          goog.basePath = c.substr(0, d - 7);
          break;
        }
      }
    }
  }
}, goog.importScript_ = function(a) {
  var b = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
  !goog.dependencies_.written[a] && b(a) && (goog.dependencies_.written[a] = !0);
}, goog.writeScriptTag_ = function(a) {
  if (goog.inHtmlDocument_()) {
    var b = goog.global.document;
    if ("complete" == b.readyState) {
      if (/\bdeps.js$/.test(a)) {
        return!1;
      }
      throw Error('Cannot write "' + a + '" after document load');
    }
    b.write('<script type="text/javascript" src="' + a + '">\x3c/script>');
    return!0;
  }
  return!1;
}, goog.writeScripts_ = function() {
  function a(e) {
    if (!(e in d.written)) {
      if (!(e in d.visited) && (d.visited[e] = !0, e in d.requires)) {
        for (var g in d.requires[e]) {
          if (!goog.isProvided_(g)) {
            if (g in d.nameToPath) {
              a(d.nameToPath[g]);
            } else {
              throw Error("Undefined nameToPath for " + g);
            }
          }
        }
      }
      e in c || (c[e] = !0, b.push(e));
    }
  }
  var b = [], c = {}, d = goog.dependencies_, e;
  for (e in goog.included_) {
    d.written[e] || a(e);
  }
  for (e = 0;e < b.length;e++) {
    if (b[e]) {
      goog.importScript_(goog.basePath + b[e]);
    } else {
      throw Error("Undefined script input");
    }
  }
}, goog.getPathFromDeps_ = function(a) {
  return a in goog.dependencies_.nameToPath ? goog.dependencies_.nameToPath[a] : null;
}, goog.findBasePath_(), goog.global.CLOSURE_NO_DEPS || goog.importScript_(goog.basePath + "deps.js"));
goog.typeOf = function(a) {
  var b = typeof a;
  if ("object" == b) {
    if (a) {
      if (a instanceof Array) {
        return "array";
      }
      if (a instanceof Object) {
        return b;
      }
      var c = Object.prototype.toString.call(a);
      if ("[object Window]" == c) {
        return "object";
      }
      if ("[object Array]" == c || "number" == typeof a.length && "undefined" != typeof a.splice && "undefined" != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable("splice")) {
        return "array";
      }
      if ("[object Function]" == c || "undefined" != typeof a.call && "undefined" != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable("call")) {
        return "function";
      }
    } else {
      return "null";
    }
  } else {
    if ("function" == b && "undefined" == typeof a.call) {
      return "object";
    }
  }
  return b;
};
goog.isDef = function(a) {
  return void 0 !== a;
};
goog.isNull = function(a) {
  return null === a;
};
goog.isDefAndNotNull = function(a) {
  return null != a;
};
goog.isArray = function(a) {
  return "array" == goog.typeOf(a);
};
goog.isArrayLike = function(a) {
  var b = goog.typeOf(a);
  return "array" == b || "object" == b && "number" == typeof a.length;
};
goog.isDateLike = function(a) {
  return goog.isObject(a) && "function" == typeof a.getFullYear;
};
goog.isString = function(a) {
  return "string" == typeof a;
};
goog.isBoolean = function(a) {
  return "boolean" == typeof a;
};
goog.isNumber = function(a) {
  return "number" == typeof a;
};
goog.isFunction = function(a) {
  return "function" == goog.typeOf(a);
};
goog.isObject = function(a) {
  var b = typeof a;
  return "object" == b && null != a || "function" == b;
};
goog.getUid = function(a) {
  return a[goog.UID_PROPERTY_] || (a[goog.UID_PROPERTY_] = ++goog.uidCounter_);
};
goog.hasUid = function(a) {
  return!!a[goog.UID_PROPERTY_];
};
goog.removeUid = function(a) {
  "removeAttribute" in a && a.removeAttribute(goog.UID_PROPERTY_);
  try {
    delete a[goog.UID_PROPERTY_];
  } catch (b) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + (1E9 * Math.random() >>> 0);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(a) {
  var b = goog.typeOf(a);
  if ("object" == b || "array" == b) {
    if (a.clone) {
      return a.clone();
    }
    var b = "array" == b ? [] : {}, c;
    for (c in a) {
      b[c] = goog.cloneObject(a[c]);
    }
    return b;
  }
  return a;
};
goog.bindNative_ = function(a, b, c) {
  return a.call.apply(a.bind, arguments);
};
goog.bindJs_ = function(a, b, c) {
  if (!a) {
    throw Error();
  }
  if (2 < arguments.length) {
    var d = Array.prototype.slice.call(arguments, 2);
    return function() {
      var c = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(c, d);
      return a.apply(b, c);
    };
  }
  return function() {
    return a.apply(b, arguments);
  };
};
goog.bind = function(a, b, c) {
  Function.prototype.bind && -1 != Function.prototype.bind.toString().indexOf("native code") ? goog.bind = goog.bindNative_ : goog.bind = goog.bindJs_;
  return goog.bind.apply(null, arguments);
};
goog.partial = function(a, b) {
  var c = Array.prototype.slice.call(arguments, 1);
  return function() {
    var b = c.slice();
    b.push.apply(b, arguments);
    return a.apply(this, b);
  };
};
goog.mixin = function(a, b) {
  for (var c in b) {
    a[c] = b[c];
  }
};
goog.now = goog.TRUSTED_SITE && Date.now || function() {
  return+new Date;
};
goog.globalEval = function(a) {
  if (goog.global.execScript) {
    goog.global.execScript(a, "JavaScript");
  } else {
    if (goog.global.eval) {
      if (null == goog.evalWorksForGlobals_ && (goog.global.eval("var _et_ = 1;"), "undefined" != typeof goog.global._et_ ? (delete goog.global._et_, goog.evalWorksForGlobals_ = !0) : goog.evalWorksForGlobals_ = !1), goog.evalWorksForGlobals_) {
        goog.global.eval(a);
      } else {
        var b = goog.global.document, c = b.createElement("script");
        c.type = "text/javascript";
        c.defer = !1;
        c.appendChild(b.createTextNode(a));
        b.body.appendChild(c);
        b.body.removeChild(c);
      }
    } else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.getCssName = function(a, b) {
  var c = function(a) {
    return goog.cssNameMapping_[a] || a;
  }, d = function(a) {
    a = a.split("-");
    for (var b = [], d = 0;d < a.length;d++) {
      b.push(c(a[d]));
    }
    return b.join("-");
  }, d = goog.cssNameMapping_ ? "BY_WHOLE" == goog.cssNameMappingStyle_ ? c : d : function(a) {
    return a;
  };
  return b ? a + "-" + d(b) : d(a);
};
goog.setCssNameMapping = function(a, b) {
  goog.cssNameMapping_ = a;
  goog.cssNameMappingStyle_ = b;
};
!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING && (goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING);
goog.getMsg = function(a, b) {
  var c = b || {}, d;
  for (d in c) {
    var e = ("" + c[d]).replace(/\$/g, "$$$$");
    a = a.replace(RegExp("\\{\\$" + d + "\\}", "gi"), e);
  }
  return a;
};
goog.getMsgWithFallback = function(a, b) {
  return a;
};
goog.exportSymbol = function(a, b, c) {
  goog.exportPath_(a, b, c);
};
goog.exportProperty = function(a, b, c) {
  a[b] = c;
};
goog.inherits = function(a, b) {
  function c() {
  }
  c.prototype = b.prototype;
  a.superClass_ = b.prototype;
  a.prototype = new c;
  a.prototype.constructor = a;
};
goog.base = function(a, b, c) {
  var d = arguments.callee.caller;
  if (goog.DEBUG && !d) {
    throw Error("arguments.caller not defined.  goog.base() expects not to be running in strict mode. See http://www.ecma-international.org/ecma-262/5.1/#sec-C");
  }
  if (d.superClass_) {
    return d.superClass_.constructor.apply(a, Array.prototype.slice.call(arguments, 1));
  }
  for (var e = Array.prototype.slice.call(arguments, 2), f = !1, g = a.constructor;g;g = g.superClass_ && g.superClass_.constructor) {
    if (g.prototype[b] === d) {
      f = !0;
    } else {
      if (f) {
        return g.prototype[b].apply(a, e);
      }
    }
  }
  if (a[b] === d) {
    return a.constructor.prototype[b].apply(a, e);
  }
  throw Error("goog.base called from a method of one name to a method of a different name");
};
goog.scope = function(a) {
  a.call(goog.global);
};
// Input 1
var wtf = {data:{}};
wtf.data.EventClass = {INSTANCE:0, SCOPE:1};
goog.exportSymbol("wtf.data.EventClass", wtf.data.EventClass);
goog.exportProperty(wtf.data.EventClass, "INSTANCE", wtf.data.EventClass.INSTANCE);
goog.exportProperty(wtf.data.EventClass, "SCOPE", wtf.data.EventClass.SCOPE);
// Input 2
wtf.data.EventFlag = {HIGH_FREQUENCY:2, SYSTEM_TIME:4, INTERNAL:8, APPEND_SCOPE_DATA:16, BUILTIN:32, APPEND_FLOW_DATA:64};
goog.exportSymbol("wtf.data.EventFlag", wtf.data.EventFlag);
goog.exportProperty(wtf.data.EventFlag, "HIGH_FREQUENCY", wtf.data.EventFlag.HIGH_FREQUENCY);
goog.exportProperty(wtf.data.EventFlag, "SYSTEM_TIME", wtf.data.EventFlag.SYSTEM_TIME);
goog.exportProperty(wtf.data.EventFlag, "INTERNAL", wtf.data.EventFlag.INTERNAL);
goog.exportProperty(wtf.data.EventFlag, "APPEND_SCOPE_DATA", wtf.data.EventFlag.APPEND_SCOPE_DATA);
goog.exportProperty(wtf.data.EventFlag, "BUILTIN", wtf.data.EventFlag.BUILTIN);
goog.exportProperty(wtf.data.EventFlag, "APPEND_FLOW_DATA", wtf.data.EventFlag.APPEND_FLOW_DATA);
// Input 3
wtf.data.ZoneType = {SCRIPT:"script", NATIVE_SCRIPT:"native_script", NATIVE_GPU:"native_gpu", NATIVE_BROWSER:"native_browser"};
goog.exportSymbol("wtf.data.ZoneType", wtf.data.ZoneType);
goog.exportProperty(wtf.data.ZoneType, "SCRIPT", wtf.data.ZoneType.SCRIPT);
goog.exportProperty(wtf.data.ZoneType, "NATIVE_SCRIPT", wtf.data.ZoneType.NATIVE_SCRIPT);
goog.exportProperty(wtf.data.ZoneType, "NATIVE_GPU", wtf.data.ZoneType.NATIVE_GPU);
goog.exportProperty(wtf.data.ZoneType, "NATIVE_BROWSER", wtf.data.ZoneType.NATIVE_BROWSER);
// Input 4
goog.debug = {};
goog.debug.Error = function(a) {
  Error.captureStackTrace ? Error.captureStackTrace(this, goog.debug.Error) : this.stack = Error().stack || "";
  a && (this.message = String(a));
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
// Input 5
goog.dom = {};
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
// Input 6
goog.string = {};
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(a, b) {
  return 0 == a.lastIndexOf(b, 0);
};
goog.string.endsWith = function(a, b) {
  var c = a.length - b.length;
  return 0 <= c && a.indexOf(b, c) == c;
};
goog.string.caseInsensitiveStartsWith = function(a, b) {
  return 0 == goog.string.caseInsensitiveCompare(b, a.substr(0, b.length));
};
goog.string.caseInsensitiveEndsWith = function(a, b) {
  return 0 == goog.string.caseInsensitiveCompare(b, a.substr(a.length - b.length, b.length));
};
goog.string.caseInsensitiveEquals = function(a, b) {
  return a.toLowerCase() == b.toLowerCase();
};
goog.string.subs = function(a, b) {
  for (var c = a.split("%s"), d = "", e = Array.prototype.slice.call(arguments, 1);e.length && 1 < c.length;) {
    d += c.shift() + e.shift();
  }
  return d + c.join("%s");
};
goog.string.collapseWhitespace = function(a) {
  return a.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "");
};
goog.string.isEmpty = function(a) {
  return/^[\s\xa0]*$/.test(a);
};
goog.string.isEmptySafe = function(a) {
  return goog.string.isEmpty(goog.string.makeSafe(a));
};
goog.string.isBreakingWhitespace = function(a) {
  return!/[^\t\n\r ]/.test(a);
};
goog.string.isAlpha = function(a) {
  return!/[^a-zA-Z]/.test(a);
};
goog.string.isNumeric = function(a) {
  return!/[^0-9]/.test(a);
};
goog.string.isAlphaNumeric = function(a) {
  return!/[^a-zA-Z0-9]/.test(a);
};
goog.string.isSpace = function(a) {
  return " " == a;
};
goog.string.isUnicodeChar = function(a) {
  return 1 == a.length && " " <= a && "~" >= a || "\u0080" <= a && "\ufffd" >= a;
};
goog.string.stripNewlines = function(a) {
  return a.replace(/(\r\n|\r|\n)+/g, " ");
};
goog.string.canonicalizeNewlines = function(a) {
  return a.replace(/(\r\n|\r|\n)/g, "\n");
};
goog.string.normalizeWhitespace = function(a) {
  return a.replace(/\xa0|\s/g, " ");
};
goog.string.normalizeSpaces = function(a) {
  return a.replace(/\xa0|[ \t]+/g, " ");
};
goog.string.collapseBreakingSpaces = function(a) {
  return a.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "");
};
goog.string.trim = function(a) {
  return a.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "");
};
goog.string.trimLeft = function(a) {
  return a.replace(/^[\s\xa0]+/, "");
};
goog.string.trimRight = function(a) {
  return a.replace(/[\s\xa0]+$/, "");
};
goog.string.caseInsensitiveCompare = function(a, b) {
  var c = String(a).toLowerCase(), d = String(b).toLowerCase();
  return c < d ? -1 : c == d ? 0 : 1;
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(a, b) {
  if (a == b) {
    return 0;
  }
  if (!a) {
    return-1;
  }
  if (!b) {
    return 1;
  }
  for (var c = a.toLowerCase().match(goog.string.numerateCompareRegExp_), d = b.toLowerCase().match(goog.string.numerateCompareRegExp_), e = Math.min(c.length, d.length), f = 0;f < e;f++) {
    var g = c[f], k = d[f];
    if (g != k) {
      return c = parseInt(g, 10), !isNaN(c) && (d = parseInt(k, 10), !isNaN(d) && c - d) ? c - d : g < k ? -1 : 1;
    }
  }
  return c.length != d.length ? c.length - d.length : a < b ? -1 : 1;
};
goog.string.urlEncode = function(a) {
  return encodeURIComponent(String(a));
};
goog.string.urlDecode = function(a) {
  return decodeURIComponent(a.replace(/\+/g, " "));
};
goog.string.newLineToBr = function(a, b) {
  return a.replace(/(\r\n|\r|\n)/g, b ? "<br />" : "<br>");
};
goog.string.htmlEscape = function(a, b) {
  if (b) {
    return a.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;");
  }
  if (!goog.string.allRe_.test(a)) {
    return a;
  }
  -1 != a.indexOf("&") && (a = a.replace(goog.string.amperRe_, "&amp;"));
  -1 != a.indexOf("<") && (a = a.replace(goog.string.ltRe_, "&lt;"));
  -1 != a.indexOf(">") && (a = a.replace(goog.string.gtRe_, "&gt;"));
  -1 != a.indexOf('"') && (a = a.replace(goog.string.quotRe_, "&quot;"));
  return a;
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(a) {
  return goog.string.contains(a, "&") ? "document" in goog.global ? goog.string.unescapeEntitiesUsingDom_(a) : goog.string.unescapePureXmlEntities_(a) : a;
};
goog.string.unescapeEntitiesUsingDom_ = function(a) {
  var b = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'}, c = document.createElement("div");
  return a.replace(goog.string.HTML_ENTITY_PATTERN_, function(a, e) {
    var f = b[a];
    if (f) {
      return f;
    }
    if ("#" == e.charAt(0)) {
      var g = Number("0" + e.substr(1));
      isNaN(g) || (f = String.fromCharCode(g));
    }
    f || (c.innerHTML = a + " ", f = c.firstChild.nodeValue.slice(0, -1));
    return b[a] = f;
  });
};
goog.string.unescapePureXmlEntities_ = function(a) {
  return a.replace(/&([^;]+);/g, function(a, c) {
    switch(c) {
      case "amp":
        return "&";
      case "lt":
        return "<";
      case "gt":
        return ">";
      case "quot":
        return'"';
      default:
        if ("#" == c.charAt(0)) {
          var d = Number("0" + c.substr(1));
          if (!isNaN(d)) {
            return String.fromCharCode(d);
          }
        }
        return a;
    }
  });
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(a, b) {
  return goog.string.newLineToBr(a.replace(/  /g, " &#160;"), b);
};
goog.string.stripQuotes = function(a, b) {
  for (var c = b.length, d = 0;d < c;d++) {
    var e = 1 == c ? b : b.charAt(d);
    if (a.charAt(0) == e && a.charAt(a.length - 1) == e) {
      return a.substring(1, a.length - 1);
    }
  }
  return a;
};
goog.string.truncate = function(a, b, c) {
  c && (a = goog.string.unescapeEntities(a));
  a.length > b && (a = a.substring(0, b - 3) + "...");
  c && (a = goog.string.htmlEscape(a));
  return a;
};
goog.string.truncateMiddle = function(a, b, c, d) {
  c && (a = goog.string.unescapeEntities(a));
  if (d && a.length > b) {
    d > b && (d = b);
    var e = a.length - d;
    a = a.substring(0, b - d) + "..." + a.substring(e);
  } else {
    a.length > b && (d = Math.floor(b / 2), e = a.length - d, a = a.substring(0, d + b % 2) + "..." + a.substring(e));
  }
  c && (a = goog.string.htmlEscape(a));
  return a;
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(a) {
  a = String(a);
  if (a.quote) {
    return a.quote();
  }
  for (var b = ['"'], c = 0;c < a.length;c++) {
    var d = a.charAt(c), e = d.charCodeAt(0);
    b[c + 1] = goog.string.specialEscapeChars_[d] || (31 < e && 127 > e ? d : goog.string.escapeChar(d));
  }
  b.push('"');
  return b.join("");
};
goog.string.escapeString = function(a) {
  for (var b = [], c = 0;c < a.length;c++) {
    b[c] = goog.string.escapeChar(a.charAt(c));
  }
  return b.join("");
};
goog.string.escapeChar = function(a) {
  if (a in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[a];
  }
  if (a in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[a] = goog.string.specialEscapeChars_[a];
  }
  var b = a, c = a.charCodeAt(0);
  if (31 < c && 127 > c) {
    b = a;
  } else {
    if (256 > c) {
      if (b = "\\x", 16 > c || 256 < c) {
        b += "0";
      }
    } else {
      b = "\\u", 4096 > c && (b += "0");
    }
    b += c.toString(16).toUpperCase();
  }
  return goog.string.jsEscapeCache_[a] = b;
};
goog.string.toMap = function(a) {
  for (var b = {}, c = 0;c < a.length;c++) {
    b[a.charAt(c)] = !0;
  }
  return b;
};
goog.string.contains = function(a, b) {
  return-1 != a.indexOf(b);
};
goog.string.countOf = function(a, b) {
  return a && b ? a.split(b).length - 1 : 0;
};
goog.string.removeAt = function(a, b, c) {
  var d = a;
  0 <= b && b < a.length && 0 < c && (d = a.substr(0, b) + a.substr(b + c, a.length - b - c));
  return d;
};
goog.string.remove = function(a, b) {
  var c = RegExp(goog.string.regExpEscape(b), "");
  return a.replace(c, "");
};
goog.string.removeAll = function(a, b) {
  var c = RegExp(goog.string.regExpEscape(b), "g");
  return a.replace(c, "");
};
goog.string.regExpEscape = function(a) {
  return String(a).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08");
};
goog.string.repeat = function(a, b) {
  return Array(b + 1).join(a);
};
goog.string.padNumber = function(a, b, c) {
  a = goog.isDef(c) ? a.toFixed(c) : String(a);
  c = a.indexOf(".");
  -1 == c && (c = a.length);
  return goog.string.repeat("0", Math.max(0, b - c)) + a;
};
goog.string.makeSafe = function(a) {
  return null == a ? "" : String(a);
};
goog.string.buildString = function(a) {
  return Array.prototype.join.call(arguments, "");
};
goog.string.getRandomString = function() {
  return Math.floor(2147483648 * Math.random()).toString(36) + Math.abs(Math.floor(2147483648 * Math.random()) ^ goog.now()).toString(36);
};
goog.string.compareVersions = function(a, b) {
  for (var c = 0, d = goog.string.trim(String(a)).split("."), e = goog.string.trim(String(b)).split("."), f = Math.max(d.length, e.length), g = 0;0 == c && g < f;g++) {
    var k = d[g] || "", m = e[g] || "", l = /(\d*)(\D*)/g, p = /(\d*)(\D*)/g;
    do {
      var s = l.exec(k) || ["", "", ""], t = p.exec(m) || ["", "", ""];
      if (0 == s[0].length && 0 == t[0].length) {
        break;
      }
      var c = 0 == s[1].length ? 0 : parseInt(s[1], 10), x = 0 == t[1].length ? 0 : parseInt(t[1], 10), c = goog.string.compareElements_(c, x) || goog.string.compareElements_(0 == s[2].length, 0 == t[2].length) || goog.string.compareElements_(s[2], t[2]);
    } while (0 == c);
  }
  return c;
};
goog.string.compareElements_ = function(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(a) {
  for (var b = 0, c = 0;c < a.length;++c) {
    b = 31 * b + a.charCodeAt(c), b %= goog.string.HASHCODE_MAX_;
  }
  return b;
};
goog.string.uniqueStringCounter_ = 2147483648 * Math.random() | 0;
goog.string.createUniqueString = function() {
  return "goog_" + goog.string.uniqueStringCounter_++;
};
goog.string.toNumber = function(a) {
  var b = Number(a);
  return 0 == b && goog.string.isEmpty(a) ? NaN : b;
};
goog.string.isLowerCamelCase = function(a) {
  return/^[a-z]+([A-Z][a-z]*)*$/.test(a);
};
goog.string.isUpperCamelCase = function(a) {
  return/^([A-Z][a-z]*)+$/.test(a);
};
goog.string.toCamelCase = function(a) {
  return String(a).replace(/\-([a-z])/g, function(a, c) {
    return c.toUpperCase();
  });
};
goog.string.toSelectorCase = function(a) {
  return String(a).replace(/([A-Z])/g, "-$1").toLowerCase();
};
goog.string.toTitleCase = function(a, b) {
  var c = goog.isString(b) ? goog.string.regExpEscape(b) : "\\s";
  return a.replace(RegExp("(^" + (c ? "|[" + c + "]+" : "") + ")([a-z])", "g"), function(a, b, c) {
    return b + c.toUpperCase();
  });
};
goog.string.parseInt = function(a) {
  isFinite(a) && (a = String(a));
  return goog.isString(a) ? /^\s*-?0x/i.test(a) ? parseInt(a, 16) : parseInt(a, 10) : NaN;
};
goog.string.splitLimit = function(a, b, c) {
  a = a.split(b);
  for (var d = [];0 < c && a.length;) {
    d.push(a.shift()), c--;
  }
  a.length && d.push(a.join(b));
  return d;
};
// Input 7
goog.asserts = {};
goog.asserts.ENABLE_ASSERTS = !1;
goog.asserts.AssertionError = function(a, b) {
  b.unshift(a);
  goog.debug.Error.call(this, goog.string.subs.apply(null, b));
  b.shift();
  this.messagePattern = a;
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(a, b, c, d) {
  var e = "Assertion failed";
  if (c) {
    var e = e + (": " + c), f = d
  } else {
    a && (e += ": " + a, f = b);
  }
  throw new goog.asserts.AssertionError("" + e, f || []);
};
goog.asserts.assert = function(a, b, c) {
  goog.asserts.ENABLE_ASSERTS && !a && goog.asserts.doAssertFailure_("", null, b, Array.prototype.slice.call(arguments, 2));
  return a;
};
goog.asserts.fail = function(a, b) {
  if (goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (a ? ": " + a : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(a, b, c) {
  goog.asserts.ENABLE_ASSERTS && !goog.isNumber(a) && goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(a), a], b, Array.prototype.slice.call(arguments, 2));
  return a;
};
goog.asserts.assertString = function(a, b, c) {
  goog.asserts.ENABLE_ASSERTS && !goog.isString(a) && goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(a), a], b, Array.prototype.slice.call(arguments, 2));
  return a;
};
goog.asserts.assertFunction = function(a, b, c) {
  goog.asserts.ENABLE_ASSERTS && !goog.isFunction(a) && goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(a), a], b, Array.prototype.slice.call(arguments, 2));
  return a;
};
goog.asserts.assertObject = function(a, b, c) {
  goog.asserts.ENABLE_ASSERTS && !goog.isObject(a) && goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(a), a], b, Array.prototype.slice.call(arguments, 2));
  return a;
};
goog.asserts.assertArray = function(a, b, c) {
  goog.asserts.ENABLE_ASSERTS && !goog.isArray(a) && goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(a), a], b, Array.prototype.slice.call(arguments, 2));
  return a;
};
goog.asserts.assertBoolean = function(a, b, c) {
  goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(a) && goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(a), a], b, Array.prototype.slice.call(arguments, 2));
  return a;
};
goog.asserts.assertElement = function(a, b, c) {
  !goog.asserts.ENABLE_ASSERTS || goog.isObject(a) && a.nodeType == goog.dom.NodeType.ELEMENT || goog.asserts.doAssertFailure_("Expected Element but got %s: %s.", [goog.typeOf(a), a], b, Array.prototype.slice.call(arguments, 2));
  return a;
};
goog.asserts.assertInstanceof = function(a, b, c, d) {
  !goog.asserts.ENABLE_ASSERTS || a instanceof b || goog.asserts.doAssertFailure_("instanceof check failed.", null, c, Array.prototype.slice.call(arguments, 3));
  return a;
};
goog.asserts.assertObjectPrototypeIsIntact = function() {
  for (var a in Object.prototype) {
    goog.asserts.fail(a + " should not be enumerable in Object.prototype.");
  }
};
// Input 8
goog.array = {};
goog.NATIVE_ARRAY_PROTOTYPES = goog.TRUSTED_SITE;
goog.array.peek = function(a) {
  return a[a.length - 1];
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(a, b, c) {
  goog.asserts.assert(null != a.length);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(a, b, c);
} : function(a, b, c) {
  c = null == c ? 0 : 0 > c ? Math.max(0, a.length + c) : c;
  if (goog.isString(a)) {
    return goog.isString(b) && 1 == b.length ? a.indexOf(b, c) : -1;
  }
  for (;c < a.length;c++) {
    if (c in a && a[c] === b) {
      return c;
    }
  }
  return-1;
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(a, b, c) {
  goog.asserts.assert(null != a.length);
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(a, b, null == c ? a.length - 1 : c);
} : function(a, b, c) {
  c = null == c ? a.length - 1 : c;
  0 > c && (c = Math.max(0, a.length + c));
  if (goog.isString(a)) {
    return goog.isString(b) && 1 == b.length ? a.lastIndexOf(b, c) : -1;
  }
  for (;0 <= c;c--) {
    if (c in a && a[c] === b) {
      return c;
    }
  }
  return-1;
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(a, b, c) {
  goog.asserts.assert(null != a.length);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(a, b, c);
} : function(a, b, c) {
  for (var d = a.length, e = goog.isString(a) ? a.split("") : a, f = 0;f < d;f++) {
    f in e && b.call(c, e[f], f, a);
  }
};
goog.array.forEachRight = function(a, b, c) {
  for (var d = a.length, e = goog.isString(a) ? a.split("") : a, d = d - 1;0 <= d;--d) {
    d in e && b.call(c, e[d], d, a);
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(a, b, c) {
  goog.asserts.assert(null != a.length);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(a, b, c);
} : function(a, b, c) {
  for (var d = a.length, e = [], f = 0, g = goog.isString(a) ? a.split("") : a, k = 0;k < d;k++) {
    if (k in g) {
      var m = g[k];
      b.call(c, m, k, a) && (e[f++] = m);
    }
  }
  return e;
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(a, b, c) {
  goog.asserts.assert(null != a.length);
  return goog.array.ARRAY_PROTOTYPE_.map.call(a, b, c);
} : function(a, b, c) {
  for (var d = a.length, e = Array(d), f = goog.isString(a) ? a.split("") : a, g = 0;g < d;g++) {
    g in f && (e[g] = b.call(c, f[g], g, a));
  }
  return e;
};
goog.array.reduce = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.reduce ? function(a, b, c, d) {
  goog.asserts.assert(null != a.length);
  d && (b = goog.bind(b, d));
  return goog.array.ARRAY_PROTOTYPE_.reduce.call(a, b, c);
} : function(a, b, c, d) {
  var e = c;
  goog.array.forEach(a, function(c, g) {
    e = b.call(d, e, c, g, a);
  });
  return e;
};
goog.array.reduceRight = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.reduceRight ? function(a, b, c, d) {
  goog.asserts.assert(null != a.length);
  d && (b = goog.bind(b, d));
  return goog.array.ARRAY_PROTOTYPE_.reduceRight.call(a, b, c);
} : function(a, b, c, d) {
  var e = c;
  goog.array.forEachRight(a, function(c, g) {
    e = b.call(d, e, c, g, a);
  });
  return e;
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(a, b, c) {
  goog.asserts.assert(null != a.length);
  return goog.array.ARRAY_PROTOTYPE_.some.call(a, b, c);
} : function(a, b, c) {
  for (var d = a.length, e = goog.isString(a) ? a.split("") : a, f = 0;f < d;f++) {
    if (f in e && b.call(c, e[f], f, a)) {
      return!0;
    }
  }
  return!1;
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(a, b, c) {
  goog.asserts.assert(null != a.length);
  return goog.array.ARRAY_PROTOTYPE_.every.call(a, b, c);
} : function(a, b, c) {
  for (var d = a.length, e = goog.isString(a) ? a.split("") : a, f = 0;f < d;f++) {
    if (f in e && !b.call(c, e[f], f, a)) {
      return!1;
    }
  }
  return!0;
};
goog.array.count = function(a, b, c) {
  var d = 0;
  goog.array.forEach(a, function(a, f, g) {
    b.call(c, a, f, g) && ++d;
  }, c);
  return d;
};
goog.array.find = function(a, b, c) {
  b = goog.array.findIndex(a, b, c);
  return 0 > b ? null : goog.isString(a) ? a.charAt(b) : a[b];
};
goog.array.findIndex = function(a, b, c) {
  for (var d = a.length, e = goog.isString(a) ? a.split("") : a, f = 0;f < d;f++) {
    if (f in e && b.call(c, e[f], f, a)) {
      return f;
    }
  }
  return-1;
};
goog.array.findRight = function(a, b, c) {
  b = goog.array.findIndexRight(a, b, c);
  return 0 > b ? null : goog.isString(a) ? a.charAt(b) : a[b];
};
goog.array.findIndexRight = function(a, b, c) {
  for (var d = a.length, e = goog.isString(a) ? a.split("") : a, d = d - 1;0 <= d;d--) {
    if (d in e && b.call(c, e[d], d, a)) {
      return d;
    }
  }
  return-1;
};
goog.array.contains = function(a, b) {
  return 0 <= goog.array.indexOf(a, b);
};
goog.array.isEmpty = function(a) {
  return 0 == a.length;
};
goog.array.clear = function(a) {
  if (!goog.isArray(a)) {
    for (var b = a.length - 1;0 <= b;b--) {
      delete a[b];
    }
  }
  a.length = 0;
};
goog.array.insert = function(a, b) {
  goog.array.contains(a, b) || a.push(b);
};
goog.array.insertAt = function(a, b, c) {
  goog.array.splice(a, c, 0, b);
};
goog.array.insertArrayAt = function(a, b, c) {
  goog.partial(goog.array.splice, a, c, 0).apply(null, b);
};
goog.array.insertBefore = function(a, b, c) {
  var d;
  2 == arguments.length || 0 > (d = goog.array.indexOf(a, c)) ? a.push(b) : goog.array.insertAt(a, b, d);
};
goog.array.remove = function(a, b) {
  var c = goog.array.indexOf(a, b), d;
  (d = 0 <= c) && goog.array.removeAt(a, c);
  return d;
};
goog.array.removeAt = function(a, b) {
  goog.asserts.assert(null != a.length);
  return 1 == goog.array.ARRAY_PROTOTYPE_.splice.call(a, b, 1).length;
};
goog.array.removeIf = function(a, b, c) {
  b = goog.array.findIndex(a, b, c);
  return 0 <= b ? (goog.array.removeAt(a, b), !0) : !1;
};
goog.array.concat = function(a) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments);
};
goog.array.toArray = function(a) {
  var b = a.length;
  if (0 < b) {
    for (var c = Array(b), d = 0;d < b;d++) {
      c[d] = a[d];
    }
    return c;
  }
  return[];
};
goog.array.clone = goog.array.toArray;
goog.array.extend = function(a, b) {
  for (var c = 1;c < arguments.length;c++) {
    var d = arguments[c], e;
    if (goog.isArray(d) || (e = goog.isArrayLike(d)) && Object.prototype.hasOwnProperty.call(d, "callee")) {
      a.push.apply(a, d);
    } else {
      if (e) {
        for (var f = a.length, g = d.length, k = 0;k < g;k++) {
          a[f + k] = d[k];
        }
      } else {
        a.push(d);
      }
    }
  }
};
goog.array.splice = function(a, b, c, d) {
  goog.asserts.assert(null != a.length);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(a, goog.array.slice(arguments, 1));
};
goog.array.slice = function(a, b, c) {
  goog.asserts.assert(null != a.length);
  return 2 >= arguments.length ? goog.array.ARRAY_PROTOTYPE_.slice.call(a, b) : goog.array.ARRAY_PROTOTYPE_.slice.call(a, b, c);
};
goog.array.removeDuplicates = function(a, b, c) {
  b = b || a;
  var d = function(a) {
    return goog.isObject(g) ? "o" + goog.getUid(g) : (typeof g).charAt(0) + g;
  };
  c = c || d;
  for (var d = {}, e = 0, f = 0;f < a.length;) {
    var g = a[f++], k = c(g);
    Object.prototype.hasOwnProperty.call(d, k) || (d[k] = !0, b[e++] = g);
  }
  b.length = e;
};
goog.array.binarySearch = function(a, b, c) {
  return goog.array.binarySearch_(a, c || goog.array.defaultCompare, !1, b);
};
goog.array.binarySelect = function(a, b, c) {
  return goog.array.binarySearch_(a, b, !0, void 0, c);
};
goog.array.binarySearch_ = function(a, b, c, d, e) {
  for (var f = 0, g = a.length, k;f < g;) {
    var m = f + g >> 1, l;
    l = c ? b.call(e, a[m], m, a) : b(d, a[m]);
    0 < l ? f = m + 1 : (g = m, k = !l);
  }
  return k ? f : ~f;
};
goog.array.sort = function(a, b) {
  goog.asserts.assert(null != a.length);
  goog.array.ARRAY_PROTOTYPE_.sort.call(a, b || goog.array.defaultCompare);
};
goog.array.stableSort = function(a, b) {
  for (var c = 0;c < a.length;c++) {
    a[c] = {index:c, value:a[c]};
  }
  var d = b || goog.array.defaultCompare;
  goog.array.sort(a, function(a, b) {
    return d(a.value, b.value) || a.index - b.index;
  });
  for (c = 0;c < a.length;c++) {
    a[c] = a[c].value;
  }
};
goog.array.sortObjectsByKey = function(a, b, c) {
  var d = c || goog.array.defaultCompare;
  goog.array.sort(a, function(a, c) {
    return d(a[b], c[b]);
  });
};
goog.array.isSorted = function(a, b, c) {
  b = b || goog.array.defaultCompare;
  for (var d = 1;d < a.length;d++) {
    var e = b(a[d - 1], a[d]);
    if (0 < e || 0 == e && c) {
      return!1;
    }
  }
  return!0;
};
goog.array.equals = function(a, b, c) {
  if (!goog.isArrayLike(a) || !goog.isArrayLike(b) || a.length != b.length) {
    return!1;
  }
  var d = a.length;
  c = c || goog.array.defaultCompareEquality;
  for (var e = 0;e < d;e++) {
    if (!c(a[e], b[e])) {
      return!1;
    }
  }
  return!0;
};
goog.array.compare = function(a, b, c) {
  return goog.array.equals(a, b, c);
};
goog.array.compare3 = function(a, b, c) {
  c = c || goog.array.defaultCompare;
  for (var d = Math.min(a.length, b.length), e = 0;e < d;e++) {
    var f = c(a[e], b[e]);
    if (0 != f) {
      return f;
    }
  }
  return goog.array.defaultCompare(a.length, b.length);
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b;
};
goog.array.binaryInsert = function(a, b, c) {
  c = goog.array.binarySearch(a, b, c);
  return 0 > c ? (goog.array.insertAt(a, b, -(c + 1)), !0) : !1;
};
goog.array.binaryRemove = function(a, b, c) {
  b = goog.array.binarySearch(a, b, c);
  return 0 <= b ? goog.array.removeAt(a, b) : !1;
};
goog.array.bucket = function(a, b, c) {
  for (var d = {}, e = 0;e < a.length;e++) {
    var f = a[e], g = b.call(c, f, e, a);
    goog.isDef(g) && (d[g] || (d[g] = [])).push(f);
  }
  return d;
};
goog.array.toObject = function(a, b, c) {
  var d = {};
  goog.array.forEach(a, function(e, f) {
    d[b.call(c, e, f, a)] = e;
  });
  return d;
};
goog.array.range = function(a, b, c) {
  var d = [], e = 0, f = a;
  c = c || 1;
  void 0 !== b && (e = a, f = b);
  if (0 > c * (f - e)) {
    return[];
  }
  if (0 < c) {
    for (a = e;a < f;a += c) {
      d.push(a);
    }
  } else {
    for (a = e;a > f;a += c) {
      d.push(a);
    }
  }
  return d;
};
goog.array.repeat = function(a, b) {
  for (var c = [], d = 0;d < b;d++) {
    c[d] = a;
  }
  return c;
};
goog.array.flatten = function(a) {
  for (var b = [], c = 0;c < arguments.length;c++) {
    var d = arguments[c];
    goog.isArray(d) ? b.push.apply(b, goog.array.flatten.apply(null, d)) : b.push(d);
  }
  return b;
};
goog.array.rotate = function(a, b) {
  goog.asserts.assert(null != a.length);
  a.length && (b %= a.length, 0 < b ? goog.array.ARRAY_PROTOTYPE_.unshift.apply(a, a.splice(-b, b)) : 0 > b && goog.array.ARRAY_PROTOTYPE_.push.apply(a, a.splice(0, -b)));
  return a;
};
goog.array.moveItem = function(a, b, c) {
  goog.asserts.assert(0 <= b && b < a.length);
  goog.asserts.assert(0 <= c && c < a.length);
  b = goog.array.ARRAY_PROTOTYPE_.splice.call(a, b, 1);
  goog.array.ARRAY_PROTOTYPE_.splice.call(a, c, 0, b[0]);
};
goog.array.zip = function(a) {
  if (!arguments.length) {
    return[];
  }
  for (var b = [], c = 0;;c++) {
    for (var d = [], e = 0;e < arguments.length;e++) {
      var f = arguments[e];
      if (c >= f.length) {
        return b;
      }
      d.push(f[c]);
    }
    b.push(d);
  }
};
goog.array.shuffle = function(a, b) {
  for (var c = b || Math.random, d = a.length - 1;0 < d;d--) {
    var e = Math.floor(c() * (d + 1)), f = a[d];
    a[d] = a[e];
    a[e] = f;
  }
};
// Input 9
goog.functions = {};
goog.functions.constant = function(a) {
  return function() {
    return a;
  };
};
goog.functions.FALSE = goog.functions.constant(!1);
goog.functions.TRUE = goog.functions.constant(!0);
goog.functions.NULL = goog.functions.constant(null);
goog.functions.identity = function(a, b) {
  return a;
};
goog.functions.error = function(a) {
  return function() {
    throw Error(a);
  };
};
goog.functions.fail = function(a) {
  return function() {
    throw a;
  };
};
goog.functions.lock = function(a, b) {
  b = b || 0;
  return function() {
    return a.apply(this, Array.prototype.slice.call(arguments, 0, b));
  };
};
goog.functions.nth = function(a) {
  return function() {
    return arguments[a];
  };
};
goog.functions.withReturnValue = function(a, b) {
  return goog.functions.sequence(a, goog.functions.constant(b));
};
goog.functions.compose = function(a, b) {
  var c = arguments, d = c.length;
  return function() {
    var a;
    d && (a = c[d - 1].apply(this, arguments));
    for (var b = d - 2;0 <= b;b--) {
      a = c[b].call(this, a);
    }
    return a;
  };
};
goog.functions.sequence = function(a) {
  var b = arguments, c = b.length;
  return function() {
    for (var a, e = 0;e < c;e++) {
      a = b[e].apply(this, arguments);
    }
    return a;
  };
};
goog.functions.and = function(a) {
  var b = arguments, c = b.length;
  return function() {
    for (var a = 0;a < c;a++) {
      if (!b[a].apply(this, arguments)) {
        return!1;
      }
    }
    return!0;
  };
};
goog.functions.or = function(a) {
  var b = arguments, c = b.length;
  return function() {
    for (var a = 0;a < c;a++) {
      if (b[a].apply(this, arguments)) {
        return!0;
      }
    }
    return!1;
  };
};
goog.functions.not = function(a) {
  return function() {
    return!a.apply(this, arguments);
  };
};
goog.functions.create = function(a, b) {
  var c = function() {
  };
  c.prototype = a.prototype;
  c = new c;
  a.apply(c, Array.prototype.slice.call(arguments, 1));
  return c;
};
goog.functions.CACHE_RETURN_VALUE = !0;
goog.functions.cacheReturnValue = function(a) {
  var b = !1, c;
  return function() {
    if (!goog.functions.CACHE_RETURN_VALUE) {
      return a();
    }
    b || (c = a(), b = !0);
    return c;
  };
};
// Input 10
/*
 Portions of this code are from MochiKit, received by
 The Closure Authors under the MIT license. All other code is Copyright
 2005-2009 The Closure Authors. All Rights Reserved.
*/
goog.async = {};
goog.async.Deferred = function(a, b) {
  this.sequence_ = [];
  this.onCancelFunction_ = a;
  this.defaultScope_ = b || null;
  this.hadError_ = this.fired_ = !1;
  this.result_ = void 0;
  this.silentlyCanceled_ = this.blocking_ = this.blocked_ = !1;
  this.unhandledExceptionTimeoutId_ = 0;
  this.parent_ = null;
  this.branches_ = 0;
  if (goog.async.Deferred.LONG_STACK_TRACES && (this.constructorStack_ = null, Error.captureStackTrace)) {
    var c = {stack:""};
    Error.captureStackTrace(c, goog.async.Deferred);
    "string" == typeof c.stack && (this.constructorStack_ = c.stack.replace(/^[^\n]*\n/, ""));
  }
};
goog.async.Deferred.STRICT_ERRORS = !1;
goog.async.Deferred.LONG_STACK_TRACES = goog.DEBUG;
goog.async.Deferred.prototype.cancel = function(a) {
  if (this.hasFired()) {
    this.result_ instanceof goog.async.Deferred && this.result_.cancel();
  } else {
    if (this.parent_) {
      var b = this.parent_;
      delete this.parent_;
      a ? b.cancel(a) : b.branchCancel_();
    }
    this.onCancelFunction_ ? this.onCancelFunction_.call(this.defaultScope_, this) : this.silentlyCanceled_ = !0;
    this.hasFired() || this.errback(new goog.async.Deferred.CanceledError(this));
  }
};
goog.async.Deferred.prototype.branchCancel_ = function() {
  this.branches_--;
  0 >= this.branches_ && this.cancel();
};
goog.async.Deferred.prototype.continue_ = function(a, b) {
  this.blocked_ = !1;
  this.updateResult_(a, b);
};
goog.async.Deferred.prototype.updateResult_ = function(a, b) {
  this.fired_ = !0;
  this.result_ = b;
  this.hadError_ = !a;
  this.fire_();
};
goog.async.Deferred.prototype.check_ = function() {
  if (this.hasFired()) {
    if (!this.silentlyCanceled_) {
      throw new goog.async.Deferred.AlreadyCalledError(this);
    }
    this.silentlyCanceled_ = !1;
  }
};
goog.async.Deferred.prototype.callback = function(a) {
  this.check_();
  this.assertNotDeferred_(a);
  this.updateResult_(!0, a);
};
goog.async.Deferred.prototype.errback = function(a) {
  this.check_();
  this.assertNotDeferred_(a);
  this.makeStackTraceLong_(a);
  this.updateResult_(!1, a);
};
goog.async.Deferred.prototype.makeStackTraceLong_ = function(a) {
  goog.async.Deferred.LONG_STACK_TRACES && this.constructorStack_ && goog.isObject(a) && a.stack && /^[^\n]+(\n   [^\n]+)+/.test(a.stack) && (a.stack = a.stack + "\nDEFERRED OPERATION:\n" + this.constructorStack_);
};
goog.async.Deferred.prototype.assertNotDeferred_ = function(a) {
  goog.asserts.assert(!(a instanceof goog.async.Deferred), "An execution sequence may not be initiated with a blocking Deferred.");
};
goog.async.Deferred.prototype.addCallback = function(a, b) {
  return this.addCallbacks(a, null, b);
};
goog.async.Deferred.prototype.addErrback = function(a, b) {
  return this.addCallbacks(null, a, b);
};
goog.async.Deferred.prototype.addBoth = function(a, b) {
  return this.addCallbacks(a, a, b);
};
goog.async.Deferred.prototype.addCallbacks = function(a, b, c) {
  goog.asserts.assert(!this.blocking_, "Blocking Deferreds can not be re-used");
  this.sequence_.push([a, b, c]);
  this.hasFired() && this.fire_();
  return this;
};
goog.async.Deferred.prototype.chainDeferred = function(a) {
  this.addCallbacks(a.callback, a.errback, a);
  return this;
};
goog.async.Deferred.prototype.awaitDeferred = function(a) {
  return this.addCallback(goog.bind(a.branch, a));
};
goog.async.Deferred.prototype.branch = function(a) {
  var b = new goog.async.Deferred;
  this.chainDeferred(b);
  a && (b.parent_ = this, this.branches_++);
  return b;
};
goog.async.Deferred.prototype.hasFired = function() {
  return this.fired_;
};
goog.async.Deferred.prototype.isError = function(a) {
  return a instanceof Error;
};
goog.async.Deferred.prototype.hasErrback_ = function() {
  return goog.array.some(this.sequence_, function(a) {
    return goog.isFunction(a[1]);
  });
};
goog.async.Deferred.prototype.fire_ = function() {
  this.unhandledExceptionTimeoutId_ && this.hasFired() && this.hasErrback_() && (goog.global.clearTimeout(this.unhandledExceptionTimeoutId_), delete this.unhandledExceptionTimeoutId_);
  this.parent_ && (this.parent_.branches_--, delete this.parent_);
  for (var a = this.result_, b = !1, c = !1;this.sequence_.length && !this.blocked_;) {
    var d = this.sequence_.shift(), e = d[0], f = d[1], d = d[2];
    if (e = this.hadError_ ? f : e) {
      try {
        var g = e.call(d || this.defaultScope_, a);
        goog.isDef(g) && (this.hadError_ = this.hadError_ && (g == a || this.isError(g)), this.result_ = a = g);
        a instanceof goog.async.Deferred && (this.blocked_ = c = !0);
      } catch (k) {
        a = k, this.hadError_ = !0, this.makeStackTraceLong_(a), this.hasErrback_() || (b = !0);
      }
    }
  }
  this.result_ = a;
  c ? (a.addCallbacks(goog.bind(this.continue_, this, !0), goog.bind(this.continue_, this, !1)), a.blocking_ = !0) : !goog.async.Deferred.STRICT_ERRORS || !this.isError(a) || a instanceof goog.async.Deferred.CanceledError || (b = this.hadError_ = !0);
  b && (this.unhandledExceptionTimeoutId_ = goog.global.setTimeout(goog.functions.fail(a), 0));
};
goog.async.Deferred.succeed = function(a) {
  var b = new goog.async.Deferred;
  b.callback(a);
  return b;
};
goog.async.Deferred.fail = function(a) {
  var b = new goog.async.Deferred;
  b.errback(a);
  return b;
};
goog.async.Deferred.canceled = function() {
  var a = new goog.async.Deferred;
  a.cancel();
  return a;
};
goog.async.Deferred.when = function(a, b, c) {
  return a instanceof goog.async.Deferred ? a.branch(!0).addCallback(b, c) : goog.async.Deferred.succeed(a).addCallback(b, c);
};
goog.async.Deferred.AlreadyCalledError = function(a) {
  goog.debug.Error.call(this);
  this.deferred = a;
};
goog.inherits(goog.async.Deferred.AlreadyCalledError, goog.debug.Error);
goog.async.Deferred.AlreadyCalledError.prototype.message = "Deferred has already fired";
goog.async.Deferred.AlreadyCalledError.prototype.name = "AlreadyCalledError";
goog.async.Deferred.CanceledError = function(a) {
  goog.debug.Error.call(this);
  this.deferred = a;
};
goog.inherits(goog.async.Deferred.CanceledError, goog.debug.Error);
goog.async.Deferred.CanceledError.prototype.message = "Deferred was canceled";
goog.async.Deferred.CanceledError.prototype.name = "CanceledError";
// Input 11
goog.userAgent = {};
goog.userAgent.ASSUME_IE = !1;
goog.userAgent.ASSUME_GECKO = !1;
goog.userAgent.ASSUME_WEBKIT = !1;
goog.userAgent.ASSUME_MOBILE_WEBKIT = !1;
goog.userAgent.ASSUME_OPERA = !1;
goog.userAgent.ASSUME_ANY_VERSION = !1;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global.navigator ? goog.global.navigator.userAgent : null;
};
goog.userAgent.getNavigator = function() {
  return goog.global.navigator;
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = !1;
  goog.userAgent.detectedIe_ = !1;
  goog.userAgent.detectedWebkit_ = !1;
  goog.userAgent.detectedMobile_ = !1;
  goog.userAgent.detectedGecko_ = !1;
  var a;
  if (!goog.userAgent.BROWSER_KNOWN_ && (a = goog.userAgent.getUserAgentString())) {
    var b = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = goog.string.startsWith(a, "Opera");
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && (goog.string.contains(a, "MSIE") || goog.string.contains(a, "Trident"));
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && goog.string.contains(a, "WebKit");
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && goog.string.contains(a, "Mobile");
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && !goog.userAgent.detectedIe_ && "Gecko" == b.product;
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
  return a && a.platform || "";
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = !1;
goog.userAgent.ASSUME_WINDOWS = !1;
goog.userAgent.ASSUME_LINUX = !1;
goog.userAgent.ASSUME_X11 = !1;
goog.userAgent.ASSUME_ANDROID = !1;
goog.userAgent.ASSUME_IPHONE = !1;
goog.userAgent.ASSUME_IPAD = !1;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11 || goog.userAgent.ASSUME_ANDROID || goog.userAgent.ASSUME_IPHONE || goog.userAgent.ASSUME_IPAD;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator().appVersion || "", "X11");
  var a = goog.userAgent.getUserAgentString();
  goog.userAgent.detectedAndroid_ = !!a && goog.string.contains(a, "Android");
  goog.userAgent.detectedIPhone_ = !!a && goog.string.contains(a, "iPhone");
  goog.userAgent.detectedIPad_ = !!a && goog.string.contains(a, "iPad");
};
goog.userAgent.PLATFORM_KNOWN_ || goog.userAgent.initPlatform_();
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.ANDROID = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_ANDROID : goog.userAgent.detectedAndroid_;
goog.userAgent.IPHONE = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_IPHONE : goog.userAgent.detectedIPhone_;
goog.userAgent.IPAD = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_IPAD : goog.userAgent.detectedIPad_;
goog.userAgent.determineVersion_ = function() {
  var a = "", b;
  goog.userAgent.OPERA && goog.global.opera ? (a = goog.global.opera.version, a = "function" == typeof a ? a() : a) : (goog.userAgent.GECKO ? b = /rv\:([^\);]+)(\)|;)/ : goog.userAgent.IE ? b = /\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/ : goog.userAgent.WEBKIT && (b = /WebKit\/(\S+)/), b && (a = (a = b.exec(goog.userAgent.getUserAgentString())) ? a[1] : ""));
  return goog.userAgent.IE && (b = goog.userAgent.getDocumentMode_(), b > parseFloat(a)) ? String(b) : a;
};
goog.userAgent.getDocumentMode_ = function() {
  var a = goog.global.document;
  return a ? a.documentMode : void 0;
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(a, b) {
  return goog.string.compareVersions(a, b);
};
goog.userAgent.isVersionOrHigherCache_ = {};
goog.userAgent.isVersionOrHigher = function(a) {
  return goog.userAgent.ASSUME_ANY_VERSION || goog.userAgent.isVersionOrHigherCache_[a] || (goog.userAgent.isVersionOrHigherCache_[a] = 0 <= goog.string.compareVersions(goog.userAgent.VERSION, a));
};
goog.userAgent.isVersion = goog.userAgent.isVersionOrHigher;
goog.userAgent.isDocumentModeOrHigher = function(a) {
  return goog.userAgent.IE && goog.userAgent.DOCUMENT_MODE >= a;
};
goog.userAgent.isDocumentMode = goog.userAgent.isDocumentModeOrHigher;
goog.userAgent.DOCUMENT_MODE = function() {
  var a = goog.global.document;
  return a && goog.userAgent.IE ? goog.userAgent.getDocumentMode_() || ("CSS1Compat" == a.compatMode ? parseInt(goog.userAgent.VERSION, 10) : 5) : void 0;
}();
// Input 12
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isDocumentModeOrHigher(9), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isDocumentModeOrHigher(9) || goog.userAgent.GECKO && goog.userAgent.isVersionOrHigher("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("9"), CAN_USE_PARENT_ELEMENT_PROPERTY:goog.userAgent.IE || goog.userAgent.OPERA || goog.userAgent.WEBKIT, 
INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
// Input 13
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", ARTICLE:"ARTICLE", ASIDE:"ASIDE", AUDIO:"AUDIO", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDI:"BDI", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", COMMAND:"COMMAND", DATA:"DATA", DATALIST:"DATALIST", DD:"DD", DEL:"DEL", DETAILS:"DETAILS", DFN:"DFN", 
DIALOG:"DIALOG", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", EMBED:"EMBED", FIELDSET:"FIELDSET", FIGCAPTION:"FIGCAPTION", FIGURE:"FIGURE", FONT:"FONT", FOOTER:"FOOTER", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HEADER:"HEADER", HGROUP:"HGROUP", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", KEYGEN:"KEYGEN", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", 
MAP:"MAP", MARK:"MARK", MATH:"MATH", MENU:"MENU", META:"META", METER:"METER", NAV:"NAV", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", OUTPUT:"OUTPUT", P:"P", PARAM:"PARAM", PRE:"PRE", PROGRESS:"PROGRESS", Q:"Q", RP:"RP", RT:"RT", RUBY:"RUBY", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SECTION:"SECTION", SELECT:"SELECT", SMALL:"SMALL", SOURCE:"SOURCE", SPAN:"SPAN", STRIKE:"STRIKE", STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUMMARY:"SUMMARY", 
SUP:"SUP", SVG:"SVG", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TIME:"TIME", TITLE:"TITLE", TR:"TR", TRACK:"TRACK", TT:"TT", U:"U", UL:"UL", VAR:"VAR", VIDEO:"VIDEO", WBR:"WBR"};
// Input 14
goog.dom.classes = {};
goog.dom.classes.set = function(a, b) {
  a.className = b;
};
goog.dom.classes.get = function(a) {
  a = a.className;
  return goog.isString(a) && a.match(/\S+/g) || [];
};
goog.dom.classes.add = function(a, b) {
  var c = goog.dom.classes.get(a), d = goog.array.slice(arguments, 1), e = c.length + d.length;
  goog.dom.classes.add_(c, d);
  goog.dom.classes.set(a, c.join(" "));
  return c.length == e;
};
goog.dom.classes.remove = function(a, b) {
  var c = goog.dom.classes.get(a), d = goog.array.slice(arguments, 1), e = goog.dom.classes.getDifference_(c, d);
  goog.dom.classes.set(a, e.join(" "));
  return e.length == c.length - d.length;
};
goog.dom.classes.add_ = function(a, b) {
  for (var c = 0;c < b.length;c++) {
    goog.array.contains(a, b[c]) || a.push(b[c]);
  }
};
goog.dom.classes.getDifference_ = function(a, b) {
  return goog.array.filter(a, function(a) {
    return!goog.array.contains(b, a);
  });
};
goog.dom.classes.swap = function(a, b, c) {
  for (var d = goog.dom.classes.get(a), e = !1, f = 0;f < d.length;f++) {
    d[f] == b && (goog.array.splice(d, f--, 1), e = !0);
  }
  e && (d.push(c), goog.dom.classes.set(a, d.join(" ")));
  return e;
};
goog.dom.classes.addRemove = function(a, b, c) {
  var d = goog.dom.classes.get(a);
  goog.isString(b) ? goog.array.remove(d, b) : goog.isArray(b) && (d = goog.dom.classes.getDifference_(d, b));
  goog.isString(c) && !goog.array.contains(d, c) ? d.push(c) : goog.isArray(c) && goog.dom.classes.add_(d, c);
  goog.dom.classes.set(a, d.join(" "));
};
goog.dom.classes.has = function(a, b) {
  return goog.array.contains(goog.dom.classes.get(a), b);
};
goog.dom.classes.enable = function(a, b, c) {
  c ? goog.dom.classes.add(a, b) : goog.dom.classes.remove(a, b);
};
goog.dom.classes.toggle = function(a, b) {
  var c = !goog.dom.classes.has(a, b);
  goog.dom.classes.enable(a, b, c);
  return c;
};
// Input 15
goog.math = {};
goog.math.randomInt = function(a) {
  return Math.floor(Math.random() * a);
};
goog.math.uniformRandom = function(a, b) {
  return a + Math.random() * (b - a);
};
goog.math.clamp = function(a, b, c) {
  return Math.min(Math.max(a, b), c);
};
goog.math.modulo = function(a, b) {
  var c = a % b;
  return 0 > c * b ? c + b : c;
};
goog.math.lerp = function(a, b, c) {
  return a + c * (b - a);
};
goog.math.nearlyEquals = function(a, b, c) {
  return Math.abs(a - b) <= (c || 1E-6);
};
goog.math.standardAngle = function(a) {
  return goog.math.modulo(a, 360);
};
goog.math.toRadians = function(a) {
  return a * Math.PI / 180;
};
goog.math.toDegrees = function(a) {
  return 180 * a / Math.PI;
};
goog.math.angleDx = function(a, b) {
  return b * Math.cos(goog.math.toRadians(a));
};
goog.math.angleDy = function(a, b) {
  return b * Math.sin(goog.math.toRadians(a));
};
goog.math.angle = function(a, b, c, d) {
  return goog.math.standardAngle(goog.math.toDegrees(Math.atan2(d - b, c - a)));
};
goog.math.angleDifference = function(a, b) {
  var c = goog.math.standardAngle(b) - goog.math.standardAngle(a);
  180 < c ? c -= 360 : -180 >= c && (c = 360 + c);
  return c;
};
goog.math.sign = function(a) {
  return 0 == a ? 0 : 0 > a ? -1 : 1;
};
goog.math.longestCommonSubsequence = function(a, b, c, d) {
  c = c || function(a, b) {
    return a == b;
  };
  d = d || function(b, c) {
    return a[b];
  };
  for (var e = a.length, f = b.length, g = [], k = 0;k < e + 1;k++) {
    g[k] = [], g[k][0] = 0;
  }
  for (var m = 0;m < f + 1;m++) {
    g[0][m] = 0;
  }
  for (k = 1;k <= e;k++) {
    for (m = 1;m <= f;m++) {
      c(a[k - 1], b[m - 1]) ? g[k][m] = g[k - 1][m - 1] + 1 : g[k][m] = Math.max(g[k - 1][m], g[k][m - 1]);
    }
  }
  for (var l = [], k = e, m = f;0 < k && 0 < m;) {
    c(a[k - 1], b[m - 1]) ? (l.unshift(d(k - 1, m - 1)), k--, m--) : g[k - 1][m] > g[k][m - 1] ? k-- : m--;
  }
  return l;
};
goog.math.sum = function(a) {
  return goog.array.reduce(arguments, function(a, c) {
    return a + c;
  }, 0);
};
goog.math.average = function(a) {
  return goog.math.sum.apply(null, arguments) / arguments.length;
};
goog.math.sampleVariance = function(a) {
  var b = arguments.length;
  if (2 > b) {
    return 0;
  }
  var c = goog.math.average.apply(null, arguments);
  return goog.math.sum.apply(null, goog.array.map(arguments, function(a) {
    return Math.pow(a - c, 2);
  })) / (b - 1);
};
goog.math.standardDeviation = function(a) {
  return Math.sqrt(goog.math.sampleVariance.apply(null, arguments));
};
goog.math.isInt = function(a) {
  return isFinite(a) && 0 == a % 1;
};
goog.math.isFiniteNumber = function(a) {
  return isFinite(a) && !isNaN(a);
};
goog.math.safeFloor = function(a, b) {
  goog.asserts.assert(!goog.isDef(b) || 0 < b);
  return Math.floor(a + (b || 2E-15));
};
goog.math.safeCeil = function(a, b) {
  goog.asserts.assert(!goog.isDef(b) || 0 < b);
  return Math.ceil(a - (b || 2E-15));
};
// Input 16
goog.math.Coordinate = function(a, b) {
  this.x = goog.isDef(a) ? a : 0;
  this.y = goog.isDef(b) ? b : 0;
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y);
};
goog.DEBUG && (goog.math.Coordinate.prototype.toString = function() {
  return "(" + this.x + ", " + this.y + ")";
});
goog.math.Coordinate.equals = function(a, b) {
  return a == b ? !0 : a && b ? a.x == b.x && a.y == b.y : !1;
};
goog.math.Coordinate.distance = function(a, b) {
  var c = a.x - b.x, d = a.y - b.y;
  return Math.sqrt(c * c + d * d);
};
goog.math.Coordinate.magnitude = function(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y);
};
goog.math.Coordinate.azimuth = function(a) {
  return goog.math.angle(0, 0, a.x, a.y);
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var c = a.x - b.x, d = a.y - b.y;
  return c * c + d * d;
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y);
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y);
};
goog.math.Coordinate.prototype.ceil = function() {
  this.x = Math.ceil(this.x);
  this.y = Math.ceil(this.y);
  return this;
};
goog.math.Coordinate.prototype.floor = function() {
  this.x = Math.floor(this.x);
  this.y = Math.floor(this.y);
  return this;
};
goog.math.Coordinate.prototype.round = function() {
  this.x = Math.round(this.x);
  this.y = Math.round(this.y);
  return this;
};
goog.math.Coordinate.prototype.translate = function(a, b) {
  a instanceof goog.math.Coordinate ? (this.x += a.x, this.y += a.y) : (this.x += a, goog.isNumber(b) && (this.y += b));
  return this;
};
goog.math.Coordinate.prototype.scale = function(a, b) {
  var c = goog.isNumber(b) ? b : a;
  this.x *= a;
  this.y *= c;
  return this;
};
// Input 17
goog.math.Size = function(a, b) {
  this.width = a;
  this.height = b;
};
goog.math.Size.equals = function(a, b) {
  return a == b ? !0 : a && b ? a.width == b.width && a.height == b.height : !1;
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height);
};
goog.DEBUG && (goog.math.Size.prototype.toString = function() {
  return "(" + this.width + " x " + this.height + ")";
});
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height);
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height);
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height;
};
goog.math.Size.prototype.perimeter = function() {
  return 2 * (this.width + this.height);
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height;
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area();
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this;
};
goog.math.Size.prototype.fitsInside = function(a) {
  return this.width <= a.width && this.height <= a.height;
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this;
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this;
};
goog.math.Size.prototype.scale = function(a, b) {
  var c = goog.isNumber(b) ? b : a;
  this.width *= a;
  this.height *= c;
  return this;
};
goog.math.Size.prototype.scaleToFit = function(a) {
  a = this.aspectRatio() > a.aspectRatio() ? a.width / this.width : a.height / this.height;
  return this.scale(a);
};
// Input 18
goog.object = {};
goog.object.forEach = function(a, b, c) {
  for (var d in a) {
    b.call(c, a[d], d, a);
  }
};
goog.object.filter = function(a, b, c) {
  var d = {}, e;
  for (e in a) {
    b.call(c, a[e], e, a) && (d[e] = a[e]);
  }
  return d;
};
goog.object.map = function(a, b, c) {
  var d = {}, e;
  for (e in a) {
    d[e] = b.call(c, a[e], e, a);
  }
  return d;
};
goog.object.some = function(a, b, c) {
  for (var d in a) {
    if (b.call(c, a[d], d, a)) {
      return!0;
    }
  }
  return!1;
};
goog.object.every = function(a, b, c) {
  for (var d in a) {
    if (!b.call(c, a[d], d, a)) {
      return!1;
    }
  }
  return!0;
};
goog.object.getCount = function(a) {
  var b = 0, c;
  for (c in a) {
    b++;
  }
  return b;
};
goog.object.getAnyKey = function(a) {
  for (var b in a) {
    return b;
  }
};
goog.object.getAnyValue = function(a) {
  for (var b in a) {
    return a[b];
  }
};
goog.object.contains = function(a, b) {
  return goog.object.containsValue(a, b);
};
goog.object.getValues = function(a) {
  var b = [], c = 0, d;
  for (d in a) {
    b[c++] = a[d];
  }
  return b;
};
goog.object.getKeys = function(a) {
  var b = [], c = 0, d;
  for (d in a) {
    b[c++] = d;
  }
  return b;
};
goog.object.getValueByKeys = function(a, b) {
  for (var c = goog.isArrayLike(b), d = c ? b : arguments, c = c ? 0 : 1;c < d.length && (a = a[d[c]], goog.isDef(a));c++) {
  }
  return a;
};
goog.object.containsKey = function(a, b) {
  return b in a;
};
goog.object.containsValue = function(a, b) {
  for (var c in a) {
    if (a[c] == b) {
      return!0;
    }
  }
  return!1;
};
goog.object.findKey = function(a, b, c) {
  for (var d in a) {
    if (b.call(c, a[d], d, a)) {
      return d;
    }
  }
};
goog.object.findValue = function(a, b, c) {
  return(b = goog.object.findKey(a, b, c)) && a[b];
};
goog.object.isEmpty = function(a) {
  for (var b in a) {
    return!1;
  }
  return!0;
};
goog.object.clear = function(a) {
  for (var b in a) {
    delete a[b];
  }
};
goog.object.remove = function(a, b) {
  var c;
  (c = b in a) && delete a[b];
  return c;
};
goog.object.add = function(a, b, c) {
  if (b in a) {
    throw Error('The object already contains the key "' + b + '"');
  }
  goog.object.set(a, b, c);
};
goog.object.get = function(a, b, c) {
  return b in a ? a[b] : c;
};
goog.object.set = function(a, b, c) {
  a[b] = c;
};
goog.object.setIfUndefined = function(a, b, c) {
  return b in a ? a[b] : a[b] = c;
};
goog.object.clone = function(a) {
  var b = {}, c;
  for (c in a) {
    b[c] = a[c];
  }
  return b;
};
goog.object.unsafeClone = function(a) {
  var b = goog.typeOf(a);
  if ("object" == b || "array" == b) {
    if (a.clone) {
      return a.clone();
    }
    var b = "array" == b ? [] : {}, c;
    for (c in a) {
      b[c] = goog.object.unsafeClone(a[c]);
    }
    return b;
  }
  return a;
};
goog.object.transpose = function(a) {
  var b = {}, c;
  for (c in a) {
    b[a[c]] = c;
  }
  return b;
};
goog.object.PROTOTYPE_FIELDS_ = "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");
goog.object.extend = function(a, b) {
  for (var c, d, e = 1;e < arguments.length;e++) {
    d = arguments[e];
    for (c in d) {
      a[c] = d[c];
    }
    for (var f = 0;f < goog.object.PROTOTYPE_FIELDS_.length;f++) {
      c = goog.object.PROTOTYPE_FIELDS_[f], Object.prototype.hasOwnProperty.call(d, c) && (a[c] = d[c]);
    }
  }
};
goog.object.create = function(a) {
  var b = arguments.length;
  if (1 == b && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0]);
  }
  if (b % 2) {
    throw Error("Uneven number of arguments");
  }
  for (var c = {}, d = 0;d < b;d += 2) {
    c[arguments[d]] = arguments[d + 1];
  }
  return c;
};
goog.object.createSet = function(a) {
  var b = arguments.length;
  if (1 == b && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0]);
  }
  for (var c = {}, d = 0;d < b;d++) {
    c[arguments[d]] = !0;
  }
  return c;
};
goog.object.createImmutableView = function(a) {
  var b = a;
  Object.isFrozen && !Object.isFrozen(a) && (b = Object.create(a), Object.freeze(b));
  return b;
};
goog.object.isImmutableView = function(a) {
  return!!Object.isFrozen && Object.isFrozen(a);
};
// Input 19
goog.dom.ASSUME_QUIRKS_MODE = !1;
goog.dom.ASSUME_STANDARDS_MODE = !1;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.getDomHelper = function(a) {
  return a ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(a)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper);
};
goog.dom.getDocument = function() {
  return document;
};
goog.dom.getElement = function(a) {
  return goog.dom.getElementHelper_(document, a);
};
goog.dom.getElementHelper_ = function(a, b) {
  return goog.isString(b) ? a.getElementById(b) : b;
};
goog.dom.getRequiredElement = function(a) {
  return goog.dom.getRequiredElementHelper_(document, a);
};
goog.dom.getRequiredElementHelper_ = function(a, b) {
  goog.asserts.assertString(b);
  var c = goog.dom.getElementHelper_(a, b);
  return c = goog.asserts.assertElement(c, "No element found with id: " + b);
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(a, b, c) {
  return goog.dom.getElementsByTagNameAndClass_(document, a, b, c);
};
goog.dom.getElementsByClass = function(a, b) {
  var c = b || document;
  return goog.dom.canUseQuerySelector_(c) ? c.querySelectorAll("." + a) : c.getElementsByClassName ? c.getElementsByClassName(a) : goog.dom.getElementsByTagNameAndClass_(document, "*", a, b);
};
goog.dom.getElementByClass = function(a, b) {
  var c = b || document, d = null;
  return(d = goog.dom.canUseQuerySelector_(c) ? c.querySelector("." + a) : goog.dom.getElementsByClass(a, b)[0]) || null;
};
goog.dom.canUseQuerySelector_ = function(a) {
  return!(!a.querySelectorAll || !a.querySelector);
};
goog.dom.getElementsByTagNameAndClass_ = function(a, b, c, d) {
  a = d || a;
  b = b && "*" != b ? b.toUpperCase() : "";
  if (goog.dom.canUseQuerySelector_(a) && (b || c)) {
    return a.querySelectorAll(b + (c ? "." + c : ""));
  }
  if (c && a.getElementsByClassName) {
    a = a.getElementsByClassName(c);
    if (b) {
      d = {};
      for (var e = 0, f = 0, g;g = a[f];f++) {
        b == g.nodeName && (d[e++] = g);
      }
      d.length = e;
      return d;
    }
    return a;
  }
  a = a.getElementsByTagName(b || "*");
  if (c) {
    d = {};
    for (f = e = 0;g = a[f];f++) {
      b = g.className, "function" == typeof b.split && goog.array.contains(b.split(/\s+/), c) && (d[e++] = g);
    }
    d.length = e;
    return d;
  }
  return a;
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(a, b) {
  goog.object.forEach(b, function(b, d) {
    "style" == d ? a.style.cssText = b : "class" == d ? a.className = b : "for" == d ? a.htmlFor = b : d in goog.dom.DIRECT_ATTRIBUTE_MAP_ ? a.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[d], b) : goog.string.startsWith(d, "aria-") || goog.string.startsWith(d, "data-") ? a.setAttribute(d, b) : a[d] = b;
  });
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {cellpadding:"cellPadding", cellspacing:"cellSpacing", colspan:"colSpan", frameborder:"frameBorder", height:"height", maxlength:"maxLength", role:"role", rowspan:"rowSpan", type:"type", usemap:"useMap", valign:"vAlign", width:"width"};
goog.dom.getViewportSize = function(a) {
  return goog.dom.getViewportSize_(a || window);
};
goog.dom.getViewportSize_ = function(a) {
  a = a.document;
  a = goog.dom.isCss1CompatMode_(a) ? a.documentElement : a.body;
  return new goog.math.Size(a.clientWidth, a.clientHeight);
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window);
};
goog.dom.getDocumentHeight_ = function(a) {
  var b = a.document, c = 0;
  if (b) {
    a = goog.dom.getViewportSize_(a).height;
    var c = b.body, d = b.documentElement;
    if (goog.dom.isCss1CompatMode_(b) && d.scrollHeight) {
      c = d.scrollHeight != a ? d.scrollHeight : d.offsetHeight;
    } else {
      var b = d.scrollHeight, e = d.offsetHeight;
      d.clientHeight != e && (b = c.scrollHeight, e = c.offsetHeight);
      c = b > a ? b > e ? b : e : b < e ? b : e;
    }
  }
  return c;
};
goog.dom.getPageScroll = function(a) {
  return goog.dom.getDomHelper((a || goog.global || window).document).getDocumentScroll();
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document);
};
goog.dom.getDocumentScroll_ = function(a) {
  var b = goog.dom.getDocumentScrollElement_(a);
  a = goog.dom.getWindow_(a);
  return goog.userAgent.IE && goog.userAgent.isVersionOrHigher("10") && a.pageYOffset != b.scrollTop ? new goog.math.Coordinate(b.scrollLeft, b.scrollTop) : new goog.math.Coordinate(a.pageXOffset || b.scrollLeft, a.pageYOffset || b.scrollTop);
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document);
};
goog.dom.getDocumentScrollElement_ = function(a) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(a) ? a.documentElement : a.body || a.documentElement;
};
goog.dom.getWindow = function(a) {
  return a ? goog.dom.getWindow_(a) : window;
};
goog.dom.getWindow_ = function(a) {
  return a.parentWindow || a.defaultView;
};
goog.dom.createDom = function(a, b, c) {
  return goog.dom.createDom_(document, arguments);
};
goog.dom.createDom_ = function(a, b) {
  var c = b[0], d = b[1];
  if (!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && d && (d.name || d.type)) {
    c = ["<", c];
    d.name && c.push(' name="', goog.string.htmlEscape(d.name), '"');
    if (d.type) {
      c.push(' type="', goog.string.htmlEscape(d.type), '"');
      var e = {};
      goog.object.extend(e, d);
      delete e.type;
      d = e;
    }
    c.push(">");
    c = c.join("");
  }
  c = a.createElement(c);
  d && (goog.isString(d) ? c.className = d : goog.isArray(d) ? goog.dom.classes.add.apply(null, [c].concat(d)) : goog.dom.setProperties(c, d));
  2 < b.length && goog.dom.append_(a, c, b, 2);
  return c;
};
goog.dom.append_ = function(a, b, c, d) {
  function e(c) {
    c && b.appendChild(goog.isString(c) ? a.createTextNode(c) : c);
  }
  for (;d < c.length;d++) {
    var f = c[d];
    goog.isArrayLike(f) && !goog.dom.isNodeLike(f) ? goog.array.forEach(goog.dom.isNodeList(f) ? goog.array.toArray(f) : f, e) : e(f);
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(a) {
  return document.createElement(a);
};
goog.dom.createTextNode = function(a) {
  return document.createTextNode(String(a));
};
goog.dom.createTable = function(a, b, c) {
  return goog.dom.createTable_(document, a, b, !!c);
};
goog.dom.createTable_ = function(a, b, c, d) {
  for (var e = ["<tr>"], f = 0;f < c;f++) {
    e.push(d ? "<td>&nbsp;</td>" : "<td></td>");
  }
  e.push("</tr>");
  e = e.join("");
  c = ["<table>"];
  for (f = 0;f < b;f++) {
    c.push(e);
  }
  c.push("</table>");
  a = a.createElement(goog.dom.TagName.DIV);
  a.innerHTML = c.join("");
  return a.removeChild(a.firstChild);
};
goog.dom.htmlToDocumentFragment = function(a) {
  return goog.dom.htmlToDocumentFragment_(document, a);
};
goog.dom.htmlToDocumentFragment_ = function(a, b) {
  var c = a.createElement("div");
  goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT ? (c.innerHTML = "<br>" + b, c.removeChild(c.firstChild)) : c.innerHTML = b;
  if (1 == c.childNodes.length) {
    return c.removeChild(c.firstChild);
  }
  for (var d = a.createDocumentFragment();c.firstChild;) {
    d.appendChild(c.firstChild);
  }
  return d;
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document);
};
goog.dom.isCss1CompatMode_ = function(a) {
  return goog.dom.COMPAT_MODE_KNOWN_ ? goog.dom.ASSUME_STANDARDS_MODE : "CSS1Compat" == a.compatMode;
};
goog.dom.canHaveChildren = function(a) {
  if (a.nodeType != goog.dom.NodeType.ELEMENT) {
    return!1;
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
      return!1;
  }
  return!0;
};
goog.dom.appendChild = function(a, b) {
  a.appendChild(b);
};
goog.dom.append = function(a, b) {
  goog.dom.append_(goog.dom.getOwnerDocument(a), a, arguments, 1);
};
goog.dom.removeChildren = function(a) {
  for (var b;b = a.firstChild;) {
    a.removeChild(b);
  }
};
goog.dom.insertSiblingBefore = function(a, b) {
  b.parentNode && b.parentNode.insertBefore(a, b);
};
goog.dom.insertSiblingAfter = function(a, b) {
  b.parentNode && b.parentNode.insertBefore(a, b.nextSibling);
};
goog.dom.insertChildAt = function(a, b, c) {
  a.insertBefore(b, a.childNodes[c] || null);
};
goog.dom.removeNode = function(a) {
  return a && a.parentNode ? a.parentNode.removeChild(a) : null;
};
goog.dom.replaceNode = function(a, b) {
  var c = b.parentNode;
  c && c.replaceChild(a, b);
};
goog.dom.flattenElement = function(a) {
  var b, c = a.parentNode;
  if (c && c.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if (a.removeNode) {
      return a.removeNode(!1);
    }
    for (;b = a.firstChild;) {
      c.insertBefore(b, a);
    }
    return goog.dom.removeNode(a);
  }
};
goog.dom.getChildren = function(a) {
  return goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && void 0 != a.children ? a.children : goog.array.filter(a.childNodes, function(a) {
    return a.nodeType == goog.dom.NodeType.ELEMENT;
  });
};
goog.dom.getFirstElementChild = function(a) {
  return void 0 != a.firstElementChild ? a.firstElementChild : goog.dom.getNextElementNode_(a.firstChild, !0);
};
goog.dom.getLastElementChild = function(a) {
  return void 0 != a.lastElementChild ? a.lastElementChild : goog.dom.getNextElementNode_(a.lastChild, !1);
};
goog.dom.getNextElementSibling = function(a) {
  return void 0 != a.nextElementSibling ? a.nextElementSibling : goog.dom.getNextElementNode_(a.nextSibling, !0);
};
goog.dom.getPreviousElementSibling = function(a) {
  return void 0 != a.previousElementSibling ? a.previousElementSibling : goog.dom.getNextElementNode_(a.previousSibling, !1);
};
goog.dom.getNextElementNode_ = function(a, b) {
  for (;a && a.nodeType != goog.dom.NodeType.ELEMENT;) {
    a = b ? a.nextSibling : a.previousSibling;
  }
  return a;
};
goog.dom.getNextNode = function(a) {
  if (!a) {
    return null;
  }
  if (a.firstChild) {
    return a.firstChild;
  }
  for (;a && !a.nextSibling;) {
    a = a.parentNode;
  }
  return a ? a.nextSibling : null;
};
goog.dom.getPreviousNode = function(a) {
  if (!a) {
    return null;
  }
  if (!a.previousSibling) {
    return a.parentNode;
  }
  for (a = a.previousSibling;a && a.lastChild;) {
    a = a.lastChild;
  }
  return a;
};
goog.dom.isNodeLike = function(a) {
  return goog.isObject(a) && 0 < a.nodeType;
};
goog.dom.isElement = function(a) {
  return goog.isObject(a) && a.nodeType == goog.dom.NodeType.ELEMENT;
};
goog.dom.isWindow = function(a) {
  return goog.isObject(a) && a.window == a;
};
goog.dom.getParentElement = function(a) {
  if (goog.dom.BrowserFeature.CAN_USE_PARENT_ELEMENT_PROPERTY && !(goog.userAgent.IE && goog.userAgent.isVersionOrHigher("9") && !goog.userAgent.isVersionOrHigher("10") && goog.global.SVGElement && a instanceof goog.global.SVGElement)) {
    return a.parentElement;
  }
  a = a.parentNode;
  return goog.dom.isElement(a) ? a : null;
};
goog.dom.contains = function(a, b) {
  if (a.contains && b.nodeType == goog.dom.NodeType.ELEMENT) {
    return a == b || a.contains(b);
  }
  if ("undefined" != typeof a.compareDocumentPosition) {
    return a == b || Boolean(a.compareDocumentPosition(b) & 16);
  }
  for (;b && a != b;) {
    b = b.parentNode;
  }
  return b == a;
};
goog.dom.compareNodeOrder = function(a, b) {
  if (a == b) {
    return 0;
  }
  if (a.compareDocumentPosition) {
    return a.compareDocumentPosition(b) & 2 ? 1 : -1;
  }
  if (goog.userAgent.IE && !goog.userAgent.isDocumentModeOrHigher(9)) {
    if (a.nodeType == goog.dom.NodeType.DOCUMENT) {
      return-1;
    }
    if (b.nodeType == goog.dom.NodeType.DOCUMENT) {
      return 1;
    }
  }
  if ("sourceIndex" in a || a.parentNode && "sourceIndex" in a.parentNode) {
    var c = a.nodeType == goog.dom.NodeType.ELEMENT, d = b.nodeType == goog.dom.NodeType.ELEMENT;
    if (c && d) {
      return a.sourceIndex - b.sourceIndex;
    }
    var e = a.parentNode, f = b.parentNode;
    return e == f ? goog.dom.compareSiblingOrder_(a, b) : !c && goog.dom.contains(e, b) ? -1 * goog.dom.compareParentsDescendantNodeIe_(a, b) : !d && goog.dom.contains(f, a) ? goog.dom.compareParentsDescendantNodeIe_(b, a) : (c ? a.sourceIndex : e.sourceIndex) - (d ? b.sourceIndex : f.sourceIndex);
  }
  d = goog.dom.getOwnerDocument(a);
  c = d.createRange();
  c.selectNode(a);
  c.collapse(!0);
  d = d.createRange();
  d.selectNode(b);
  d.collapse(!0);
  return c.compareBoundaryPoints(goog.global.Range.START_TO_END, d);
};
goog.dom.compareParentsDescendantNodeIe_ = function(a, b) {
  var c = a.parentNode;
  if (c == b) {
    return-1;
  }
  for (var d = b;d.parentNode != c;) {
    d = d.parentNode;
  }
  return goog.dom.compareSiblingOrder_(d, a);
};
goog.dom.compareSiblingOrder_ = function(a, b) {
  for (var c = b;c = c.previousSibling;) {
    if (c == a) {
      return-1;
    }
  }
  return 1;
};
goog.dom.findCommonAncestor = function(a) {
  var b, c = arguments.length;
  if (!c) {
    return null;
  }
  if (1 == c) {
    return arguments[0];
  }
  var d = [], e = Infinity;
  for (b = 0;b < c;b++) {
    for (var f = [], g = arguments[b];g;) {
      f.unshift(g), g = g.parentNode;
    }
    d.push(f);
    e = Math.min(e, f.length);
  }
  f = null;
  for (b = 0;b < e;b++) {
    for (var g = d[0][b], k = 1;k < c;k++) {
      if (g != d[k][b]) {
        return f;
      }
    }
    f = g;
  }
  return f;
};
goog.dom.getOwnerDocument = function(a) {
  return a.nodeType == goog.dom.NodeType.DOCUMENT ? a : a.ownerDocument || a.document;
};
goog.dom.getFrameContentDocument = function(a) {
  return a.contentDocument || a.contentWindow.document;
};
goog.dom.getFrameContentWindow = function(a) {
  return a.contentWindow || goog.dom.getWindow(goog.dom.getFrameContentDocument(a));
};
goog.dom.setTextContent = function(a, b) {
  goog.asserts.assert(null != a, "goog.dom.setTextContent expects a non-null value for node");
  if ("textContent" in a) {
    a.textContent = b;
  } else {
    if (a.nodeType == goog.dom.NodeType.TEXT) {
      a.data = b;
    } else {
      if (a.firstChild && a.firstChild.nodeType == goog.dom.NodeType.TEXT) {
        for (;a.lastChild != a.firstChild;) {
          a.removeChild(a.lastChild);
        }
        a.firstChild.data = b;
      } else {
        goog.dom.removeChildren(a);
        var c = goog.dom.getOwnerDocument(a);
        a.appendChild(c.createTextNode(String(b)));
      }
    }
  }
};
goog.dom.getOuterHtml = function(a) {
  if ("outerHTML" in a) {
    return a.outerHTML;
  }
  var b = goog.dom.getOwnerDocument(a).createElement("div");
  b.appendChild(a.cloneNode(!0));
  return b.innerHTML;
};
goog.dom.findNode = function(a, b) {
  var c = [];
  return goog.dom.findNodes_(a, b, c, !0) ? c[0] : void 0;
};
goog.dom.findNodes = function(a, b) {
  var c = [];
  goog.dom.findNodes_(a, b, c, !1);
  return c;
};
goog.dom.findNodes_ = function(a, b, c, d) {
  if (null != a) {
    for (a = a.firstChild;a;) {
      if (b(a) && (c.push(a), d) || goog.dom.findNodes_(a, b, c, d)) {
        return!0;
      }
      a = a.nextSibling;
    }
  }
  return!1;
};
goog.dom.TAGS_TO_IGNORE_ = {SCRIPT:1, STYLE:1, HEAD:1, IFRAME:1, OBJECT:1};
goog.dom.PREDEFINED_TAG_VALUES_ = {IMG:" ", BR:"\n"};
goog.dom.isFocusableTabIndex = function(a) {
  return goog.dom.hasSpecifiedTabIndex_(a) && goog.dom.isTabIndexFocusable_(a);
};
goog.dom.setFocusableTabIndex = function(a, b) {
  b ? a.tabIndex = 0 : (a.tabIndex = -1, a.removeAttribute("tabIndex"));
};
goog.dom.isFocusable = function(a) {
  var b;
  return(b = goog.dom.nativelySupportsFocus_(a) ? !a.disabled && (!goog.dom.hasSpecifiedTabIndex_(a) || goog.dom.isTabIndexFocusable_(a)) : goog.dom.isFocusableTabIndex(a)) && goog.userAgent.IE ? goog.dom.hasNonZeroBoundingRect_(a) : b;
};
goog.dom.hasSpecifiedTabIndex_ = function(a) {
  a = a.getAttributeNode("tabindex");
  return goog.isDefAndNotNull(a) && a.specified;
};
goog.dom.isTabIndexFocusable_ = function(a) {
  a = a.tabIndex;
  return goog.isNumber(a) && 0 <= a && 32768 > a;
};
goog.dom.nativelySupportsFocus_ = function(a) {
  return a.tagName == goog.dom.TagName.A || a.tagName == goog.dom.TagName.INPUT || a.tagName == goog.dom.TagName.TEXTAREA || a.tagName == goog.dom.TagName.SELECT || a.tagName == goog.dom.TagName.BUTTON;
};
goog.dom.hasNonZeroBoundingRect_ = function(a) {
  a = goog.isFunction(a.getBoundingClientRect) ? a.getBoundingClientRect() : {height:a.offsetHeight, width:a.offsetWidth};
  return goog.isDefAndNotNull(a) && 0 < a.height && 0 < a.width;
};
goog.dom.getTextContent = function(a) {
  if (goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in a) {
    a = goog.string.canonicalizeNewlines(a.innerText);
  } else {
    var b = [];
    goog.dom.getTextContent_(a, b, !0);
    a = b.join("");
  }
  a = a.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  a = a.replace(/\u200B/g, "");
  goog.dom.BrowserFeature.CAN_USE_INNER_TEXT || (a = a.replace(/ +/g, " "));
  " " != a && (a = a.replace(/^\s*/, ""));
  return a;
};
goog.dom.getRawTextContent = function(a) {
  var b = [];
  goog.dom.getTextContent_(a, b, !1);
  return b.join("");
};
goog.dom.getTextContent_ = function(a, b, c) {
  if (!(a.nodeName in goog.dom.TAGS_TO_IGNORE_)) {
    if (a.nodeType == goog.dom.NodeType.TEXT) {
      c ? b.push(String(a.nodeValue).replace(/(\r\n|\r|\n)/g, "")) : b.push(a.nodeValue);
    } else {
      if (a.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        b.push(goog.dom.PREDEFINED_TAG_VALUES_[a.nodeName]);
      } else {
        for (a = a.firstChild;a;) {
          goog.dom.getTextContent_(a, b, c), a = a.nextSibling;
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(a) {
  return goog.dom.getTextContent(a).length;
};
goog.dom.getNodeTextOffset = function(a, b) {
  for (var c = b || goog.dom.getOwnerDocument(a).body, d = [];a && a != c;) {
    for (var e = a;e = e.previousSibling;) {
      d.unshift(goog.dom.getTextContent(e));
    }
    a = a.parentNode;
  }
  return goog.string.trimLeft(d.join("")).replace(/ +/g, " ").length;
};
goog.dom.getNodeAtOffset = function(a, b, c) {
  a = [a];
  for (var d = 0, e = null;0 < a.length && d < b;) {
    if (e = a.pop(), !(e.nodeName in goog.dom.TAGS_TO_IGNORE_)) {
      if (e.nodeType == goog.dom.NodeType.TEXT) {
        var f = e.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " "), d = d + f.length
      } else {
        if (e.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          d += goog.dom.PREDEFINED_TAG_VALUES_[e.nodeName].length;
        } else {
          for (f = e.childNodes.length - 1;0 <= f;f--) {
            a.push(e.childNodes[f]);
          }
        }
      }
    }
  }
  goog.isObject(c) && (c.remainder = e ? e.nodeValue.length + b - d - 1 : 0, c.node = e);
  return e;
};
goog.dom.isNodeList = function(a) {
  if (a && "number" == typeof a.length) {
    if (goog.isObject(a)) {
      return "function" == typeof a.item || "string" == typeof a.item;
    }
    if (goog.isFunction(a)) {
      return "function" == typeof a.item;
    }
  }
  return!1;
};
goog.dom.getAncestorByTagNameAndClass = function(a, b, c) {
  if (!b && !c) {
    return null;
  }
  var d = b ? b.toUpperCase() : null;
  return goog.dom.getAncestor(a, function(a) {
    return(!d || a.nodeName == d) && (!c || goog.dom.classes.has(a, c));
  }, !0);
};
goog.dom.getAncestorByClass = function(a, b) {
  return goog.dom.getAncestorByTagNameAndClass(a, null, b);
};
goog.dom.getAncestor = function(a, b, c, d) {
  c || (a = a.parentNode);
  c = null == d;
  for (var e = 0;a && (c || e <= d);) {
    if (b(a)) {
      return a;
    }
    a = a.parentNode;
    e++;
  }
  return null;
};
goog.dom.getActiveElement = function(a) {
  try {
    return a && a.activeElement;
  } catch (b) {
  }
  return null;
};
goog.dom.getPixelRatio = goog.functions.cacheReturnValue(function() {
  var a = goog.dom.getWindow(), b = goog.userAgent.GECKO && goog.userAgent.MOBILE;
  return goog.isDef(a.devicePixelRatio) && !b ? a.devicePixelRatio : a.matchMedia ? goog.dom.matchesPixelRatio_(0.75) || goog.dom.matchesPixelRatio_(1.5) || goog.dom.matchesPixelRatio_(2) || goog.dom.matchesPixelRatio_(3) || 1 : 1;
});
goog.dom.matchesPixelRatio_ = function(a) {
  return goog.dom.getWindow().matchMedia("(-webkit-min-device-pixel-ratio: " + a + "),(min--moz-device-pixel-ratio: " + a + "),(min-resolution: " + a + "dppx)").matches ? a : 0;
};
goog.dom.DomHelper = function(a) {
  this.document_ = a || goog.global.document || document;
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(a) {
  this.document_ = a;
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_;
};
goog.dom.DomHelper.prototype.getElement = function(a) {
  return goog.dom.getElementHelper_(this.document_, a);
};
goog.dom.DomHelper.prototype.getRequiredElement = function(a) {
  return goog.dom.getRequiredElementHelper_(this.document_, a);
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(a, b, c) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, a, b, c);
};
goog.dom.DomHelper.prototype.getElementsByClass = function(a, b) {
  return goog.dom.getElementsByClass(a, b || this.document_);
};
goog.dom.DomHelper.prototype.getElementByClass = function(a, b) {
  return goog.dom.getElementByClass(a, b || this.document_);
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(a) {
  return goog.dom.getViewportSize(a || this.getWindow());
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow());
};
goog.dom.DomHelper.prototype.createDom = function(a, b, c) {
  return goog.dom.createDom_(this.document_, arguments);
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(a) {
  return this.document_.createElement(a);
};
goog.dom.DomHelper.prototype.createTextNode = function(a) {
  return this.document_.createTextNode(String(a));
};
goog.dom.DomHelper.prototype.createTable = function(a, b, c) {
  return goog.dom.createTable_(this.document_, a, b, !!c);
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(a) {
  return goog.dom.htmlToDocumentFragment_(this.document_, a);
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_);
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_);
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_);
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_);
};
goog.dom.DomHelper.prototype.getActiveElement = function(a) {
  return goog.dom.getActiveElement(a || this.document_);
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
goog.dom.DomHelper.prototype.isFocusable = goog.dom.isFocusable;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getNodeAtOffset = goog.dom.getNodeAtOffset;
goog.dom.DomHelper.prototype.isNodeList = goog.dom.isNodeList;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestorByClass = goog.dom.getAncestorByClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
// Input 20
goog.result = {};
goog.result.Result = function() {
};
goog.result.Result.prototype.wait = function(a, b) {
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
goog.result.Result.CancelError = function() {
};
goog.inherits(goog.result.Result.CancelError, Error);
// Input 21
goog.result.DependentResult = function() {
};
goog.result.DependentResult.prototype.getParentResults = function() {
};
// Input 22
goog.result.SimpleResult = function() {
  this.state_ = goog.result.Result.State.PENDING;
  this.handlers_ = [];
  this.error_ = this.value_ = void 0;
};
goog.result.SimpleResult.StateError = function() {
  goog.debug.Error.call(this, "Multiple attempts to set the state of this Result");
};
goog.inherits(goog.result.SimpleResult.StateError, goog.debug.Error);
goog.result.SimpleResult.prototype.getState = function() {
  return this.state_;
};
goog.result.SimpleResult.prototype.getValue = function() {
  return this.value_;
};
goog.result.SimpleResult.prototype.getError = function() {
  return this.error_;
};
goog.result.SimpleResult.prototype.wait = function(a, b) {
  this.isPending_() ? this.handlers_.push({callback:a, scope:b || null}) : a.call(b, this);
};
goog.result.SimpleResult.prototype.setValue = function(a) {
  if (this.isPending_()) {
    this.value_ = a, this.state_ = goog.result.Result.State.SUCCESS, this.callHandlers_();
  } else {
    if (!this.isCanceled()) {
      throw new goog.result.SimpleResult.StateError;
    }
  }
};
goog.result.SimpleResult.prototype.setError = function(a) {
  if (this.isPending_()) {
    this.error_ = a, this.state_ = goog.result.Result.State.ERROR, this.callHandlers_();
  } else {
    if (!this.isCanceled()) {
      throw new goog.result.SimpleResult.StateError;
    }
  }
};
goog.result.SimpleResult.prototype.callHandlers_ = function() {
  var a = this.handlers_;
  this.handlers_ = [];
  for (var b = 0;b < a.length;b++) {
    var c = a[b];
    c.callback.call(c.scope, this);
  }
};
goog.result.SimpleResult.prototype.isPending_ = function() {
  return this.state_ == goog.result.Result.State.PENDING;
};
goog.result.SimpleResult.prototype.cancel = function() {
  return this.isPending_() ? (this.setError(new goog.result.Result.CancelError), !0) : !1;
};
goog.result.SimpleResult.prototype.isCanceled = function() {
  return this.state_ == goog.result.Result.State.ERROR && this.error_ instanceof goog.result.Result.CancelError;
};
// Input 23
goog.result.successfulResult = function(a) {
  var b = new goog.result.SimpleResult;
  b.setValue(a);
  return b;
};
goog.result.failedResult = function(a) {
  var b = new goog.result.SimpleResult;
  b.setError(a);
  return b;
};
goog.result.canceledResult = function() {
  var a = new goog.result.SimpleResult;
  a.cancel();
  return a;
};
goog.result.wait = function(a, b, c) {
  a.wait(b, c);
};
goog.result.waitOnSuccess = function(a, b, c) {
  goog.result.wait(a, function(a) {
    a.getState() == goog.result.Result.State.SUCCESS && b.call(this, a.getValue(), a);
  }, c);
};
goog.result.waitOnError = function(a, b, c) {
  goog.result.wait(a, function(a) {
    a.getState() == goog.result.Result.State.ERROR && b.call(this, a.getError(), a);
  }, c);
};
goog.result.transform = function(a, b) {
  var c = new goog.result.DependentResultImpl_([a]);
  goog.result.wait(a, function(a) {
    a.getState() == goog.result.Result.State.SUCCESS ? c.setValue(b(a.getValue())) : c.setError(a.getError());
  });
  return c;
};
goog.result.chain = function(a, b, c) {
  var d = new goog.result.DependentResultImpl_([a]);
  goog.result.wait(a, function(a) {
    a.getState() == goog.result.Result.State.SUCCESS ? (a = b.call(c, a), d.addParentResult(a), goog.result.wait(a, function(a) {
      a.getState() == goog.result.Result.State.SUCCESS ? d.setValue(a.getValue()) : d.setError(a.getError());
    })) : d.setError(a.getError());
  });
  return d;
};
goog.result.combine = function(a) {
  var b = goog.array.clone(arguments), c = new goog.result.DependentResultImpl_(b), d = function(a) {
    return a.getState() != goog.result.Result.State.PENDING;
  }, e = function() {
    c.getState() == goog.result.Result.State.PENDING && goog.array.every(b, d) && c.setValue(b);
  };
  goog.array.forEach(b, function(a) {
    goog.result.wait(a, e);
  });
  return c;
};
goog.result.combineOnSuccess = function(a) {
  var b = goog.array.clone(arguments), c = new goog.result.DependentResultImpl_(b), d = function(a) {
    return a.getState() == goog.result.Result.State.SUCCESS;
  };
  goog.result.wait(goog.result.combine.apply(goog.result.combine, b), function(a) {
    a = a.getValue();
    goog.array.every(a, d) ? c.setValue(a) : c.setError(a);
  });
  return c;
};
goog.result.cancelParentResults = function(a) {
  var b = !1;
  a = a.getParentResults();
  for (var c = 0;c < a.length;c++) {
    b |= a[c].cancel();
  }
  return!!b;
};
goog.result.DependentResultImpl_ = function(a) {
  goog.result.SimpleResult.call(this);
  this.parentResults_ = a;
};
goog.inherits(goog.result.DependentResultImpl_, goog.result.SimpleResult);
goog.result.DependentResultImpl_.prototype.addParentResult = function(a) {
  this.parentResults_.push(a);
};
goog.result.DependentResultImpl_.prototype.getParentResults = function() {
  return this.parentResults_;
};
// Input 24
wtf.version = {};
wtf.version.getValue = function() {
  return 14369472E5;
};
wtf.version.getCommit = function() {
  return "b42eb485660d79fd6756d34835427a8b39170227";
};
wtf.version.toString = function() {
  return "2015.7.15-1";
};
goog.exportSymbol("wtf.version.getValue", wtf.version.getValue);
goog.exportSymbol("wtf.version.getCommit", wtf.version.getCommit);
goog.exportSymbol("wtf.version.toString", wtf.version.toString);
// Input 25
wtf.NODE = !0;
wtf.MIN_BUILD = !1;
wtf.PROD_BUILD = !1;
wtf.CHROME_EXTENSION = goog.global.chrome && chrome.runtime && chrome.runtime.id;
wtf.dummyStore_ = [];
wtf.preventInlining = function(a) {
  wtf.dummyStore_.push(a);
};
wtf.hasHighResolutionTimes = wtf.NODE || !(!goog.global.performance || !goog.global.performance.now && !goog.global.performance.webkitNow);
wtf.performanceNow_ = function() {
  var a = goog.global.performance;
  if (a && a.now) {
    return function() {
      return a.now();
    };
  }
  if (a && a.webkitNow) {
    return function() {
      return a.webkitNow();
    };
  }
}();
wtf.computeHighPrecisionTimebase_ = function() {
  for (var a = Date.now(), b, c, d = 0;25E4 > d;d++) {
    if (b = Date.now(), b != a) {
      c = wtf.performanceNow_();
      break;
    }
  }
  return b - c;
};
wtf.timebase = function() {
  var a;
  if (wtf.NODE) {
    try {
      a = 1E3 * require("microtime").nowDouble();
    } catch (b) {
      var c = goog.global.process.hrtime();
      a = 1E3 * c[0] + c[1] / 1E6;
    }
  } else {
    a = wtf.performanceNow_ ? wtf.computeHighPrecisionTimebase_() : Date.now();
  }
  return function() {
    return a;
  };
}();
wtf.now = function() {
  if (wtf.NODE) {
    var a = wtf.timebase();
    try {
      var b = require("microtime");
      return function() {
        return 1E3 * b.nowDouble() - a;
      };
    } catch (c) {
      var d = goog.global.process.hrtime;
      return function() {
        var b = d();
        return 1E3 * b[0] - a + b[1] / 1E6;
      };
    }
  }
  if (wtf.performanceNow_) {
    return wtf.performanceNow_;
  }
  var a = wtf.timebase(), e = Date.now;
  return function() {
    return e() - a;
  };
}();
wtf.computeNowOverhead = function() {
  for (var a = 0, b = 0;10 > b;b++) {
    for (var a = wtf.now(), c = 0, d = 0;1E5 > d;d++) {
      c += wtf.now();
    }
    a = wtf.now() - a;
  }
  return 1E6 * a / 1E5 | 0;
};
wtf.deprecated = goog.global.console ? goog.global.console.log.bind(goog.global.console) : goog.nullFunction;
goog.exportSymbol("wtf.hasHighResolutionTimes", wtf.hasHighResolutionTimes);
goog.exportSymbol("wtf.timebase", wtf.timebase);
goog.exportSymbol("wtf.now", wtf.now);
goog.exportSymbol("wtf.computeNowOverhead", wtf.computeNowOverhead);
// Input 26
wtf.timing = {};
wtf.timing.Handle = function(a) {
  this.func_ = a;
};
wtf.timing.Handle.prototype.callback = function(a) {
  if (this.func_) {
    try {
      this.func_.apply(goog.global, arguments);
    } catch (b) {
      goog.asserts.fail("Unhandled exception in callback: " + b);
    }
  }
};
wtf.timing.Handle.prototype.clear = function() {
  this.func_ = null;
};
// Input 27
wtf.timing.BrowserInterval = function(a, b) {
  wtf.timing.Handle.call(this, a);
  var c = this;
  this.intervalId_ = (goog.global.setInterval.raw || goog.global.setInterval).call(goog.global, function() {
    c.callback();
  }, b);
};
goog.inherits(wtf.timing.BrowserInterval, wtf.timing.Handle);
wtf.timing.BrowserInterval.prototype.clear = function() {
  (goog.global.clearInterval.raw || goog.global.clearInterval).call(goog.global, this.intervalId_);
  this.intervalId_ = null;
  wtf.timing.BrowserInterval.superClass_.clear.call(this);
};
// Input 28
wtf.timing.RenderInterval = function(a) {
  wtf.timing.Handle.call(this, a);
};
goog.inherits(wtf.timing.RenderInterval, wtf.timing.Handle);
// Input 29
wtf.timing.util = {};
wtf.timing.util.FRAMERATE = 60;
wtf.timing.util.getWindowFunction_ = function(a) {
  for (var b = a.replace(/^[a-z]/, function(a) {
    return a.toUpperCase();
  }), c = goog.array.map([null, "webkit", "moz", "o", "ms", "Webkit", "Moz", "O", "Ms"], function(c) {
    return c ? c + b : a;
  }), d = 0;d < c.length;d++) {
    var e = goog.global[c[d]];
    if (e) {
      return e.raw && (e = e.raw), function(a) {
        return function() {
          return a.apply(goog.global, arguments);
        };
      }(e);
    }
  }
  return null;
};
wtf.timing.util.getRequestAnimationFrame = function(a) {
  var b = wtf.timing.util.getWindowFunction_("requestAnimationFrame");
  if (b) {
    return b;
  }
  if (a) {
    var c = goog.global.setTimeout.raw || goog.global.setTimeout;
    return function(a) {
      return c.call(goog.global, a, 1E3 / wtf.timing.util.FRAMERATE);
    };
  }
  return null;
};
wtf.timing.util.getCancelAnimationFrame = function(a) {
  var b = wtf.timing.util.getWindowFunction_("cancelAnimationFrame") || wtf.timing.util.getWindowFunction_("cancelRequestAnimationFrame");
  if (b) {
    return b;
  }
  if (!wtf.timing.util.getWindowFunction_("requestAnimationFrame")) {
    return goog.nullFunction;
  }
  if (a) {
    var c = goog.global.clearTimeout.raw || goog.global.clearTimeout;
    return function(a) {
      c(a);
    };
  }
  return null;
};
// Input 30
wtf.timing.RenderTimer = function() {
  this.intervals_ = [];
  this.browserRequestAnimationFrame_ = wtf.timing.util.getRequestAnimationFrame();
  this.browserCancelAnimationFrame_ = wtf.timing.util.getCancelAnimationFrame() || goog.nullFunction;
  this.browserIntervalId_ = this.browserRequestAnimationId_ = null;
  this.boundRequestAnimationFrameTick_ = goog.bind(this.requestAnimationFrameTick_, this);
  this.boundIntervalTick_ = goog.bind(this.intervalTick_, this);
};
wtf.timing.RenderTimer.prototype.requestAnimationFrameTick_ = function(a) {
  for (var b = this.intervals_.slice(), c = 0;c < b.length;c++) {
    b[c].callback(a);
  }
  this.intervals_.length && (this.browserRequestAnimationId_ = this.browserRequestAnimationFrame_(this.boundRequestAnimationFrameTick_) || 1);
};
wtf.timing.RenderTimer.prototype.intervalTick_ = function() {
  for (var a = wtf.now(), b = this.intervals_.slice(), c = 0;c < b.length;c++) {
    b[c].callback(a);
  }
};
wtf.timing.RenderTimer.prototype.setInterval = function(a) {
  a = new wtf.timing.RenderInterval(a);
  this.intervals_.push(a);
  1 == this.intervals_.length && (this.browserRequestAnimationFrame_ ? (goog.asserts.assert(null === this.browserRequestAnimationId_), this.browserRequestAnimationId_ = this.browserRequestAnimationFrame_(this.boundRequestAnimationFrameTick_) || 1) : (goog.asserts.assert(null === this.browserIntervalId_), this.browserIntervalId_ = (goog.global.setInterval.raw || goog.global.setInterval)(this.boundIntervalTick_, 1E3 / wtf.timing.util.FRAMERATE)));
  return a;
};
wtf.timing.RenderTimer.prototype.clearInterval = function(a) {
  a.clear();
  goog.array.remove(this.intervals_, a);
  this.intervals_.length || (this.browserRequestAnimationFrame_ ? (goog.asserts.assert(null !== this.browserRequestAnimationId_), this.browserCancelAnimationFrame_(this.browserRequestAnimationId_), this.browserRequestAnimationId_ = null) : (goog.asserts.assert(null !== this.browserIntervalId_), (goog.global.clearInterval.raw || goog.global.clearInterval).call(goog.global, this.browserIntervalId_), this.browserIntervalId_ = null));
};
// Input 31
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
      return wtf.timing.renderTimer_ || (wtf.timing.renderTimer_ = new wtf.timing.RenderTimer), wtf.timing.renderTimer_.setInterval(c);
  }
};
wtf.timing.clearInterval = function(a) {
  a && (a instanceof wtf.timing.RenderInterval ? wtf.timing.renderTimer_ && wtf.timing.renderTimer_.clearInterval(a) : a.clear());
};
wtf.timing.setTimeout = function() {
  var a = goog.global.setTimeout.raw || goog.global.setTimeout;
  return function(b, c, d) {
    a.call(goog.global, function() {
      c.call(d);
    }, b);
  };
}();
wtf.timing.setImmediate = function() {
  var a = goog.global.setTimeout.raw || goog.global.setTimeout;
  return function(b, c) {
    a.call(goog.global, function() {
      b.call(c || goog.global);
    }, 0);
  };
}();
wtf.timing.waitingFrameCallbacks_ = [];
wtf.timing.deferToNextFrame = function(a, b) {
  wtf.timing.renderTimer_ || (wtf.timing.renderTimer_ = new wtf.timing.RenderTimer);
  var c = 0 == wtf.timing.waitingFrameCallbacks_.length;
  wtf.timing.waitingFrameCallbacks_.push({callback:a, scope:b || null});
  if (c) {
    var d = wtf.timing.renderTimer_.setInterval(function() {
      wtf.timing.renderTimer_.clearInterval(d);
      wtf.timing.runDeferredCallbacks_();
    })
  }
};
wtf.timing.runDeferredCallbacks_ = function() {
  for (var a = wtf.timing.waitingFrameCallbacks_, b = 0;b < a.length;b++) {
    var c = a[b];
    c.callback.call(c.scope);
  }
  wtf.timing.waitingFrameCallbacks_.length = 0;
};
// Input 32
wtf.io = {};
wtf.io.drive = {};
wtf.io.drive.APP_ID_ = "gmdhhnlkjmknaopofnadmoamhmnlicme";
wtf.io.drive.RELEASE_CLIENT_ID_ = "918719667958.apps.googleusercontent.com";
wtf.io.drive.DEBUG_CLIENT_ID_ = "918719667958-u64iesb8p6a7urc1mcnccv3ism7tuqns.apps.googleusercontent.com";
wtf.io.drive.OAUTH_SCOPES_ = ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/urlshortener"];
wtf.io.drive.isSupported = function() {
  return COMPILED && !wtf.CHROME_EXTENSION;
};
wtf.io.drive.getClientId_ = function() {
  var a = wtf.io.drive.DEBUG_CLIENT_ID_;
  wtf.CHROME_EXTENSION && (a = wtf.io.drive.RELEASE_CLIENT_ID_);
  return a;
};
wtf.io.drive.prepare = function() {
  if (wtf.io.drive.isSupported()) {
    var a = goog.dom.getDomHelper(), b = a.getDocument().body;
    goog.asserts.assert(b);
    var c;
    goog.global.wtf_io_drive_prepare_callback = function() {
      delete goog.global.wtf_io_drive_prepare_callback;
      wtf.timing.setImmediate(function() {
        var a = wtf.io.drive.getClientId_(), b = wtf.io.drive.OAUTH_SCOPES_.join(" ");
        gapi.auth.authorize({client_id:a, scope:b, immediate:!0}, function() {
        });
      });
    };
    c = a.createElement(goog.dom.TagName.SCRIPT);
    c.src = "https://apis.google.com/js/client.js?onload=wtf_io_drive_prepare_callback";
    b.appendChild(c);
    c = a.createElement(goog.dom.TagName.SCRIPT);
    c.src = "https://www.google.com/jsapi";
    b.appendChild(c);
  }
};
wtf.io.drive.authenticate = function() {
  var a = new goog.result.SimpleResult;
  if (gapi.auth.getToken()) {
    return a.setValue(!0), a;
  }
  var b = wtf.io.drive.getClientId_(), c = wtf.io.drive.OAUTH_SCOPES_.join(" ");
  gapi.auth.authorize({client_id:b, scope:c, immediate:!1}, function() {
    gapi.auth.getToken() ? a.setValue(!0) : a.setError();
  });
  return a;
};
wtf.io.drive.filePickerLoadResult_ = null;
wtf.io.drive.showFilePicker = function(a) {
  function b() {
    wtf.io.drive.filePickerLoadResult_ || (wtf.io.drive.filePickerLoadResult_ = new goog.result.SimpleResult, google.load("picker", "1", {callback:function() {
      wtf.io.drive.filePickerLoadResult_.setValue(!0);
    }}));
    goog.result.wait(wtf.io.drive.filePickerLoadResult_, c);
  }
  function c() {
    var b = [];
    b.push(new google.picker.View("recently-picked"));
    b.push(new google.picker.View("folders"));
    var c = new google.picker.PickerBuilder;
    c.setTitle(a.title || "Select a file");
    c.enableFeature("multiselectEnabled");
    c.setAppId(wtf.io.drive.APP_ID_);
    c.setSelectableMimeTypes("*.wtf-trace,application/x-extension-wtf-trace,*.wtf-json,application/x-extension-wtf-json,application/octet-stream");
    c.setCallback(function(a) {
      if ("picked" == a.action) {
        a = a.docs;
        for (var b = [], c = 0;c < a.length;c++) {
          b.push([a[c].name, a[c].id]);
        }
        d.setValue(b);
      } else {
        "cancel" == a.action && d.setError();
      }
    });
    for (var g = 0;g < b.length;g++) {
      b[g].setMimeTypes("*.wtf-trace,application/x-extension-wtf-trace,*.wtf-json,application/x-extension-wtf-json,application/octet-stream"), c.addView(b[g]);
    }
    c.build().setVisible(!0);
  }
  var d = new goog.result.SimpleResult;
  goog.result.wait(wtf.io.drive.authenticate(), function(a) {
    a.getState() == goog.result.Result.State.ERROR ? a.setError(a.getError()) : b();
  });
  return d;
};
wtf.io.drive.downloadFileLoadResult_ = null;
wtf.io.drive.queryFile = function(a) {
  function b() {
    wtf.io.drive.downloadFileLoadResult_ || (wtf.io.drive.downloadFileLoadResult_ = new goog.result.SimpleResult, gapi.client.load("drive", "v2", function() {
      wtf.io.drive.downloadFileLoadResult_.setValue(!0);
    }));
    goog.result.wait(wtf.io.drive.downloadFileLoadResult_, c);
  }
  function c() {
    var b = gapi.auth.getToken();
    goog.asserts.assert(b);
    var b = b.access_token, c = new XMLHttpRequest;
    c.open("GET", "https://www.googleapis.com/drive/v2/files/" + a + "?key=" + e, !0);
    c.setRequestHeader("Authorization", "Bearer " + b);
    c.onload = function() {
      if (200 != c.status) {
        d.setError();
      } else {
        var a = goog.global.JSON.parse(c.responseText);
        d.setValue({title:a.title, filename:a.originalFilename, fileExtension:a.fileExtension, mimeType:a.mimeType, downloadUrl:a.downloadUrl});
      }
    };
    c.onerror = function() {
      d.setError();
    };
    c.send(null);
  }
  var d = new goog.result.SimpleResult, e = wtf.io.drive.getClientId_();
  goog.result.wait(wtf.io.drive.authenticate(), function(a) {
    a.getState() == goog.result.Result.State.ERROR ? a.setError(a.getError()) : b();
  });
  return d;
};
wtf.io.drive.downloadFile = function(a) {
  function b() {
    wtf.io.drive.downloadFileLoadResult_ || (wtf.io.drive.downloadFileLoadResult_ = new goog.result.SimpleResult, gapi.client.load("drive", "v2", function() {
      wtf.io.drive.downloadFileLoadResult_.setValue(!0);
    }));
    goog.result.wait(wtf.io.drive.downloadFileLoadResult_, c);
  }
  function c() {
    var b = gapi.auth.getToken();
    goog.asserts.assert(b);
    var b = b.access_token, c = new XMLHttpRequest;
    switch(a.mimeType) {
      case "application/octet-stream":
        c.responseType = "arraybuffer";
    }
    c.open("GET", a.downloadUrl, !0);
    c.setRequestHeader("Authorization", "Bearer " + b);
    c.onerror = function() {
      d.setError();
    };
    d.setValue(c);
  }
  var d = new goog.result.SimpleResult;
  goog.result.wait(wtf.io.drive.authenticate(), function(a) {
    a.getState() == goog.result.Result.State.ERROR ? a.setError(a.getError()) : b();
  });
  return d;
};
// Input 33
wtf.db = {};
wtf.db.DataSourceInfo = function(a, b) {
  this.filename = a;
  this.contentType = b;
};
wtf.db.BlobDataSourceInfo = function(a, b, c) {
  wtf.db.DataSourceInfo.call(this, a, b);
  this.blob = c;
};
goog.inherits(wtf.db.BlobDataSourceInfo, wtf.db.DataSourceInfo);
wtf.db.DriveDataSourceInfo = function(a, b, c, d) {
  wtf.db.DataSourceInfo.call(this, a, b);
  this.fileId = c;
  this.driveFile = d || null;
};
goog.inherits(wtf.db.DriveDataSourceInfo, wtf.db.DataSourceInfo);
wtf.db.UrlDataSourceInfo = function(a, b, c) {
  wtf.db.DataSourceInfo.call(this, a, b);
  this.url = c;
};
goog.inherits(wtf.db.UrlDataSourceInfo, wtf.db.DataSourceInfo);
// Input 34
goog.debug.entryPointRegistry = {};
goog.debug.EntryPointMonitor = function() {
};
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.monitors_ = [];
goog.debug.entryPointRegistry.monitorsMayExist_ = !1;
goog.debug.entryPointRegistry.register = function(a) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = a;
  if (goog.debug.entryPointRegistry.monitorsMayExist_) {
    for (var b = goog.debug.entryPointRegistry.monitors_, c = 0;c < b.length;c++) {
      a(goog.bind(b[c].wrap, b[c]));
    }
  }
};
goog.debug.entryPointRegistry.monitorAll = function(a) {
  goog.debug.entryPointRegistry.monitorsMayExist_ = !0;
  for (var b = goog.bind(a.wrap, a), c = 0;c < goog.debug.entryPointRegistry.refList_.length;c++) {
    goog.debug.entryPointRegistry.refList_[c](b);
  }
  goog.debug.entryPointRegistry.monitors_.push(a);
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(a) {
  var b = goog.debug.entryPointRegistry.monitors_;
  goog.asserts.assert(a == b[b.length - 1], "Only the most recent monitor can be unwrapped.");
  a = goog.bind(a.unwrap, a);
  for (var c = 0;c < goog.debug.entryPointRegistry.refList_.length;c++) {
    goog.debug.entryPointRegistry.refList_[c](a);
  }
  b.length--;
};
// Input 35
goog.events = {};
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isDocumentModeOrHigher(9), HAS_W3C_EVENT_SUPPORT:!goog.userAgent.IE || goog.userAgent.isDocumentModeOrHigher(9), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("9"), HAS_NAVIGATOR_ONLINE_PROPERTY:!goog.userAgent.WEBKIT || goog.userAgent.isVersionOrHigher("528"), HAS_HTML5_NETWORK_EVENT_SUPPORT:goog.userAgent.GECKO && goog.userAgent.isVersionOrHigher("1.9b") || goog.userAgent.IE && 
goog.userAgent.isVersionOrHigher("8") || goog.userAgent.OPERA && goog.userAgent.isVersionOrHigher("9.5") || goog.userAgent.WEBKIT && goog.userAgent.isVersionOrHigher("528"), HTML5_NETWORK_EVENTS_FIRE_ON_BODY:goog.userAgent.GECKO && !goog.userAgent.isVersionOrHigher("8") || goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("9"), TOUCH_ENABLED:"ontouchstart" in goog.global || !!(goog.global.document && document.documentElement && "ontouchstart" in document.documentElement) || !(!goog.global.navigator || 
!goog.global.navigator.msMaxTouchPoints)};
// Input 36
goog.disposable = {};
goog.disposable.IDisposable = function() {
};
// Input 37
goog.Disposable = function() {
  goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF && (goog.Disposable.INCLUDE_STACK_ON_CREATION && (this.creationStack = Error().stack), goog.Disposable.instances_[goog.getUid(this)] = this);
};
goog.Disposable.MonitoringMode = {OFF:0, PERMANENT:1, INTERACTIVE:2};
goog.Disposable.MONITORING_MODE = 0;
goog.Disposable.INCLUDE_STACK_ON_CREATION = !0;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var a = [], b;
  for (b in goog.Disposable.instances_) {
    goog.Disposable.instances_.hasOwnProperty(b) && a.push(goog.Disposable.instances_[Number(b)]);
  }
  return a;
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {};
};
goog.Disposable.prototype.disposed_ = !1;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_;
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if (!this.disposed_ && (this.disposed_ = !0, this.disposeInternal(), goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF)) {
    var a = goog.getUid(this);
    if (goog.Disposable.MONITORING_MODE == goog.Disposable.MonitoringMode.PERMANENT && !goog.Disposable.instances_.hasOwnProperty(a)) {
      throw Error(this + " did not call the goog.Disposable base constructor or was disposed of after a clearUndisposedObjects call");
    }
    delete goog.Disposable.instances_[a];
  }
};
goog.Disposable.prototype.registerDisposable = function(a) {
  this.addOnDisposeCallback(goog.partial(goog.dispose, a));
};
goog.Disposable.prototype.addOnDisposeCallback = function(a, b) {
  this.onDisposeCallbacks_ || (this.onDisposeCallbacks_ = []);
  this.onDisposeCallbacks_.push(goog.bind(a, b));
};
goog.Disposable.prototype.disposeInternal = function() {
  if (this.onDisposeCallbacks_) {
    for (;this.onDisposeCallbacks_.length;) {
      this.onDisposeCallbacks_.shift()();
    }
  }
};
goog.Disposable.isDisposed = function(a) {
  return a && "function" == typeof a.isDisposed ? a.isDisposed() : !1;
};
goog.dispose = function(a) {
  a && "function" == typeof a.dispose && a.dispose();
};
goog.disposeAll = function(a) {
  for (var b = 0, c = arguments.length;b < c;++b) {
    var d = arguments[b];
    goog.isArrayLike(d) ? goog.disposeAll.apply(null, d) : goog.dispose(d);
  }
};
// Input 38
goog.events.Event = function(a, b) {
  this.type = a;
  this.currentTarget = this.target = b;
};
goog.events.Event.prototype.disposeInternal = function() {
};
goog.events.Event.prototype.dispose = function() {
};
goog.events.Event.prototype.propagationStopped_ = !1;
goog.events.Event.prototype.defaultPrevented = !1;
goog.events.Event.prototype.returnValue_ = !0;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = !0;
};
goog.events.Event.prototype.preventDefault = function() {
  this.defaultPrevented = !0;
  this.returnValue_ = !1;
};
goog.events.Event.stopPropagation = function(a) {
  a.stopPropagation();
};
goog.events.Event.preventDefault = function(a) {
  a.preventDefault();
};
// Input 39
goog.events.getVendorPrefixedName_ = function(a) {
  return goog.userAgent.WEBKIT ? "webkit" + a : goog.userAgent.OPERA ? "o" + a.toLowerCase() : a.toLowerCase();
};
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", MOUSEENTER:"mouseenter", MOUSELEAVE:"mouseleave", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", 
INPUT:"input", PROPERTYCHANGE:"propertychange", DRAGSTART:"dragstart", DRAG:"drag", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", DRAGEND:"dragend", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", BEFOREUNLOAD:"beforeunload", CONSOLEMESSAGE:"consolemessage", CONTEXTMENU:"contextmenu", DOMCONTENTLOADED:"DOMContentLoaded", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", ORIENTATIONCHANGE:"orientationchange", 
READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", BEFORECOPY:"beforecopy", BEFORECUT:"beforecut", BEFOREPASTE:"beforepaste", ONLINE:"online", OFFLINE:"offline", MESSAGE:"message", CONNECT:"connect", ANIMATIONSTART:goog.events.getVendorPrefixedName_("AnimationStart"), ANIMATIONEND:goog.events.getVendorPrefixedName_("AnimationEnd"), ANIMATIONITERATION:goog.events.getVendorPrefixedName_("AnimationIteration"), 
TRANSITIONEND:goog.events.getVendorPrefixedName_("TransitionEnd"), POINTERDOWN:"pointerdown", POINTERUP:"pointerup", POINTERCANCEL:"pointercancel", POINTERMOVE:"pointermove", POINTEROVER:"pointerover", POINTEROUT:"pointerout", POINTERENTER:"pointerenter", POINTERLEAVE:"pointerleave", GOTPOINTERCAPTURE:"gotpointercapture", LOSTPOINTERCAPTURE:"lostpointercapture", MSGESTURECHANGE:"MSGestureChange", MSGESTUREEND:"MSGestureEnd", MSGESTUREHOLD:"MSGestureHold", MSGESTURESTART:"MSGestureStart", MSGESTURETAP:"MSGestureTap", 
MSGOTPOINTERCAPTURE:"MSGotPointerCapture", MSINERTIASTART:"MSInertiaStart", MSLOSTPOINTERCAPTURE:"MSLostPointerCapture", MSPOINTERCANCEL:"MSPointerCancel", MSPOINTERDOWN:"MSPointerDown", MSPOINTERENTER:"MSPointerEnter", MSPOINTERHOVER:"MSPointerHover", MSPOINTERLEAVE:"MSPointerLeave", MSPOINTERMOVE:"MSPointerMove", MSPOINTEROUT:"MSPointerOut", MSPOINTEROVER:"MSPointerOver", MSPOINTERUP:"MSPointerUp", TEXTINPUT:"textinput", COMPOSITIONSTART:"compositionstart", COMPOSITIONUPDATE:"compositionupdate", 
COMPOSITIONEND:"compositionend", EXIT:"exit", LOADABORT:"loadabort", LOADCOMMIT:"loadcommit", LOADREDIRECT:"loadredirect", LOADSTART:"loadstart", LOADSTOP:"loadstop", RESPONSIVE:"responsive", SIZECHANGED:"sizechanged", UNRESPONSIVE:"unresponsive", VISIBILITYCHANGE:"visibilitychange"};
// Input 40
goog.reflect = {};
goog.reflect.object = function(a, b) {
  return b;
};
goog.reflect.sinkValue = function(a) {
  goog.reflect.sinkValue[" "](a);
  return a;
};
goog.reflect.sinkValue[" "] = goog.nullFunction;
goog.reflect.canAccessProperty = function(a, b) {
  try {
    return goog.reflect.sinkValue(a[b]), !0;
  } catch (c) {
  }
  return!1;
};
// Input 41
goog.events.BrowserEvent = function(a, b) {
  a && this.init(a, b);
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
  delete this.propagationStopped_;
};
goog.events.BrowserEvent.prototype.isButton = function(a) {
  return goog.events.BrowserFeature.HAS_W3C_BUTTON ? this.event_.button == a : "click" == this.type ? a == goog.events.BrowserEvent.MouseButton.LEFT : !!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[a]);
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey);
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  this.event_.stopPropagation ? this.event_.stopPropagation() : this.event_.cancelBubble = !0;
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var a = this.event_;
  if (a.preventDefault) {
    a.preventDefault();
  } else {
    if (a.returnValue = !1, goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        if (a.ctrlKey || 112 <= a.keyCode && 123 >= a.keyCode) {
          a.keyCode = -1;
        }
      } catch (b) {
      }
    }
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_;
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
};
// Input 42
goog.events.EventId = function(a) {
  this.id = a;
};
goog.events.EventId.prototype.toString = function() {
  return this.id;
};
// Input 43
goog.events.Listenable = function() {
};
goog.events.Listenable.IMPLEMENTED_BY_PROP = "closure_listenable_" + (1E6 * Math.random() | 0);
goog.events.Listenable.addImplementation = function(a) {
  a.prototype[goog.events.Listenable.IMPLEMENTED_BY_PROP] = !0;
};
goog.events.Listenable.isImplementedBy = function(a) {
  try {
    return!(!a || !a[goog.events.Listenable.IMPLEMENTED_BY_PROP]);
  } catch (b) {
    return!1;
  }
};
goog.events.ListenableKey = function() {
};
goog.events.ListenableKey.counter_ = 0;
goog.events.ListenableKey.reserveKey = function() {
  return++goog.events.ListenableKey.counter_;
};
// Input 44
goog.events.Listener = function(a, b, c, d, e, f) {
  goog.events.Listener.ENABLE_MONITORING && (this.creationStack = Error().stack);
  this.listener = a;
  this.proxy = b;
  this.src = c;
  this.type = d;
  this.capture = !!e;
  this.handler = f;
  this.key = goog.events.ListenableKey.reserveKey();
  this.removed = this.callOnce = !1;
};
goog.events.Listener.ENABLE_MONITORING = !1;
goog.events.Listener.prototype.markAsRemoved = function() {
  this.removed = !0;
  this.handler = this.src = this.proxy = this.listener = null;
};
// Input 45
goog.events.ListenerMap = function(a) {
  this.src = a;
  this.listeners = {};
  this.typeCount_ = 0;
};
goog.events.ListenerMap.prototype.getTypeCount = function() {
  return this.typeCount_;
};
goog.events.ListenerMap.prototype.getListenerCount = function() {
  var a = 0, b;
  for (b in this.listeners) {
    a += this.listeners[b].length;
  }
  return a;
};
goog.events.ListenerMap.prototype.add = function(a, b, c, d, e) {
  var f = this.listeners[a];
  f || (f = this.listeners[a] = [], this.typeCount_++);
  var g = goog.events.ListenerMap.findListenerIndex_(f, b, d, e);
  -1 < g ? (a = f[g], c || (a.callOnce = !1)) : (a = new goog.events.Listener(b, null, this.src, a, !!d, e), a.callOnce = c, f.push(a));
  return a;
};
goog.events.ListenerMap.prototype.remove = function(a, b, c, d) {
  if (!(a in this.listeners)) {
    return!1;
  }
  var e = this.listeners[a];
  b = goog.events.ListenerMap.findListenerIndex_(e, b, c, d);
  return-1 < b ? (e[b].markAsRemoved(), goog.array.removeAt(e, b), 0 == e.length && (delete this.listeners[a], this.typeCount_--), !0) : !1;
};
goog.events.ListenerMap.prototype.removeByKey = function(a) {
  var b = a.type;
  if (!(b in this.listeners)) {
    return!1;
  }
  var c = goog.array.remove(this.listeners[b], a);
  c && (a.markAsRemoved(), 0 == this.listeners[b].length && (delete this.listeners[b], this.typeCount_--));
  return c;
};
goog.events.ListenerMap.prototype.removeAll = function(a) {
  var b = 0, c;
  for (c in this.listeners) {
    if (!a || c == a) {
      for (var d = this.listeners[c], e = 0;e < d.length;e++) {
        ++b, d[e].markAsRemoved();
      }
      delete this.listeners[c];
      this.typeCount_--;
    }
  }
  return b;
};
goog.events.ListenerMap.prototype.getListeners = function(a, b) {
  var c = this.listeners[a], d = [];
  if (c) {
    for (var e = 0;e < c.length;++e) {
      var f = c[e];
      f.capture == b && d.push(f);
    }
  }
  return d;
};
goog.events.ListenerMap.prototype.getListener = function(a, b, c, d) {
  a = this.listeners[a];
  var e = -1;
  a && (e = goog.events.ListenerMap.findListenerIndex_(a, b, c, d));
  return-1 < e ? a[e] : null;
};
goog.events.ListenerMap.prototype.hasListener = function(a, b) {
  var c = goog.isDef(a), d = goog.isDef(b);
  return goog.object.some(this.listeners, function(e, f) {
    for (var g = 0;g < e.length;++g) {
      if (!(c && e[g].type != a || d && e[g].capture != b)) {
        return!0;
      }
    }
    return!1;
  });
};
goog.events.ListenerMap.findListenerIndex_ = function(a, b, c, d) {
  for (var e = 0;e < a.length;++e) {
    var f = a[e];
    if (!f.removed && f.listener == b && f.capture == !!c && f.handler == d) {
      return e;
    }
  }
  return-1;
};
// Input 46
goog.events.listeners_ = {};
goog.events.LISTENER_MAP_PROP_ = "closure_lm_" + (1E6 * Math.random() | 0);
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.CaptureSimulationMode = {OFF_AND_FAIL:0, OFF_AND_SILENT:1, ON:2};
goog.events.CAPTURE_SIMULATION_MODE = 2;
goog.events.listenerCountEstimate_ = 0;
goog.events.listen = function(a, b, c, d, e) {
  if (goog.isArray(b)) {
    for (var f = 0;f < b.length;f++) {
      goog.events.listen(a, b[f], c, d, e);
    }
    return null;
  }
  c = goog.events.wrapListener_(c);
  return goog.events.Listenable.isImplementedBy(a) ? a.listen(b, c, d, e) : goog.events.listen_(a, b, c, !1, d, e);
};
goog.events.listen_ = function(a, b, c, d, e, f) {
  if (!b) {
    throw Error("Invalid event type");
  }
  var g = !!e;
  if (g && !goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    if (goog.events.CAPTURE_SIMULATION_MODE == goog.events.CaptureSimulationMode.OFF_AND_FAIL) {
      return goog.asserts.fail("Can not register capture listener in IE8-."), null;
    }
    if (goog.events.CAPTURE_SIMULATION_MODE == goog.events.CaptureSimulationMode.OFF_AND_SILENT) {
      return null;
    }
  }
  var k = goog.events.getListenerMap_(a);
  k || (a[goog.events.LISTENER_MAP_PROP_] = k = new goog.events.ListenerMap(a));
  c = k.add(b, c, d, e, f);
  if (c.proxy) {
    return c;
  }
  d = goog.events.getProxy();
  c.proxy = d;
  d.src = a;
  d.listener = c;
  a.addEventListener ? a.addEventListener(b, d, g) : a.attachEvent(goog.events.getOnString_(b), d);
  goog.events.listenerCountEstimate_++;
  return c;
};
goog.events.getProxy = function() {
  var a = goog.events.handleBrowserEvent_, b = goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT ? function(c) {
    return a.call(b.src, b.listener, c);
  } : function(c) {
    c = a.call(b.src, b.listener, c);
    if (!c) {
      return c;
    }
  };
  return b;
};
goog.events.listenOnce = function(a, b, c, d, e) {
  if (goog.isArray(b)) {
    for (var f = 0;f < b.length;f++) {
      goog.events.listenOnce(a, b[f], c, d, e);
    }
    return null;
  }
  c = goog.events.wrapListener_(c);
  return goog.events.Listenable.isImplementedBy(a) ? a.listenOnce(b, c, d, e) : goog.events.listen_(a, b, c, !0, d, e);
};
goog.events.listenWithWrapper = function(a, b, c, d, e) {
  b.listen(a, c, d, e);
};
goog.events.unlisten = function(a, b, c, d, e) {
  if (goog.isArray(b)) {
    for (var f = 0;f < b.length;f++) {
      goog.events.unlisten(a, b[f], c, d, e);
    }
    return null;
  }
  c = goog.events.wrapListener_(c);
  if (goog.events.Listenable.isImplementedBy(a)) {
    return a.unlisten(b, c, d, e);
  }
  if (!a) {
    return!1;
  }
  d = !!d;
  if (a = goog.events.getListenerMap_(a)) {
    if (b = a.getListener(b, c, d, e)) {
      return goog.events.unlistenByKey(b);
    }
  }
  return!1;
};
goog.events.unlistenByKey = function(a) {
  if (goog.isNumber(a) || !a || a.removed) {
    return!1;
  }
  var b = a.src;
  if (goog.events.Listenable.isImplementedBy(b)) {
    return b.unlistenByKey(a);
  }
  var c = a.type, d = a.proxy;
  b.removeEventListener ? b.removeEventListener(c, d, a.capture) : b.detachEvent && b.detachEvent(goog.events.getOnString_(c), d);
  goog.events.listenerCountEstimate_--;
  (c = goog.events.getListenerMap_(b)) ? (c.removeByKey(a), 0 == c.getTypeCount() && (c.src = null, b[goog.events.LISTENER_MAP_PROP_] = null)) : a.markAsRemoved();
  return!0;
};
goog.events.unlistenWithWrapper = function(a, b, c, d, e) {
  b.unlisten(a, c, d, e);
};
goog.events.removeAll = function(a, b) {
  if (!a) {
    return 0;
  }
  if (goog.events.Listenable.isImplementedBy(a)) {
    return a.removeAllListeners(b);
  }
  var c = goog.events.getListenerMap_(a);
  if (!c) {
    return 0;
  }
  var d = 0, e;
  for (e in c.listeners) {
    if (!b || e == b) {
      for (var f = goog.array.clone(c.listeners[e]), g = 0;g < f.length;++g) {
        goog.events.unlistenByKey(f[g]) && ++d;
      }
    }
  }
  return d;
};
goog.events.removeAllNativeListeners = function() {
  return goog.events.listenerCountEstimate_ = 0;
};
goog.events.getListeners = function(a, b, c) {
  return goog.events.Listenable.isImplementedBy(a) ? a.getListeners(b, c) : a ? (a = goog.events.getListenerMap_(a)) ? a.getListeners(b, c) : [] : [];
};
goog.events.getListener = function(a, b, c, d, e) {
  c = goog.events.wrapListener_(c);
  d = !!d;
  return goog.events.Listenable.isImplementedBy(a) ? a.getListener(b, c, d, e) : a ? (a = goog.events.getListenerMap_(a)) ? a.getListener(b, c, d, e) : null : null;
};
goog.events.hasListener = function(a, b, c) {
  if (goog.events.Listenable.isImplementedBy(a)) {
    return a.hasListener(b, c);
  }
  a = goog.events.getListenerMap_(a);
  return!!a && a.hasListener(b, c);
};
goog.events.expose = function(a) {
  var b = [], c;
  for (c in a) {
    a[c] && a[c].id ? b.push(c + " = " + a[c] + " (" + a[c].id + ")") : b.push(c + " = " + a[c]);
  }
  return b.join("\n");
};
goog.events.getOnString_ = function(a) {
  return a in goog.events.onStringMap_ ? goog.events.onStringMap_[a] : goog.events.onStringMap_[a] = goog.events.onString_ + a;
};
goog.events.fireListeners = function(a, b, c, d) {
  return goog.events.Listenable.isImplementedBy(a) ? a.fireListeners(b, c, d) : goog.events.fireListeners_(a, b, c, d);
};
goog.events.fireListeners_ = function(a, b, c, d) {
  var e = 1;
  if (a = goog.events.getListenerMap_(a)) {
    if (b = a.listeners[b]) {
      for (b = goog.array.clone(b), a = 0;a < b.length;a++) {
        var f = b[a];
        f && f.capture == c && !f.removed && (e &= !1 !== goog.events.fireListener(f, d));
      }
    }
  }
  return Boolean(e);
};
goog.events.fireListener = function(a, b) {
  var c = a.listener, d = a.handler || a.src;
  a.callOnce && goog.events.unlistenByKey(a);
  return c.call(d, b);
};
goog.events.getTotalListenerCount = function() {
  return goog.events.listenerCountEstimate_;
};
goog.events.dispatchEvent = function(a, b) {
  goog.asserts.assert(goog.events.Listenable.isImplementedBy(a), "Can not use goog.events.dispatchEvent with non-goog.events.Listenable instance.");
  return a.dispatchEvent(b);
};
goog.events.protectBrowserEventEntryPoint = function(a) {
  goog.events.handleBrowserEvent_ = a.protectEntryPoint(goog.events.handleBrowserEvent_);
};
goog.events.handleBrowserEvent_ = function(a, b) {
  if (a.removed) {
    return!0;
  }
  if (!goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    var c = b || goog.getObjectByName("window.event"), d = new goog.events.BrowserEvent(c, this), e = !0;
    if (goog.events.CAPTURE_SIMULATION_MODE == goog.events.CaptureSimulationMode.ON) {
      if (!goog.events.isMarkedIeEvent_(c)) {
        goog.events.markIeEvent_(c);
        for (var c = [], f = d.currentTarget;f;f = f.parentNode) {
          c.push(f);
        }
        for (var f = a.type, g = c.length - 1;!d.propagationStopped_ && 0 <= g;g--) {
          d.currentTarget = c[g], e &= goog.events.fireListeners_(c[g], f, !0, d);
        }
        for (g = 0;!d.propagationStopped_ && g < c.length;g++) {
          d.currentTarget = c[g], e &= goog.events.fireListeners_(c[g], f, !1, d);
        }
      }
    } else {
      e = goog.events.fireListener(a, d);
    }
    return e;
  }
  return goog.events.fireListener(a, new goog.events.BrowserEvent(b, this));
};
goog.events.markIeEvent_ = function(a) {
  var b = !1;
  if (0 == a.keyCode) {
    try {
      a.keyCode = -1;
      return;
    } catch (c) {
      b = !0;
    }
  }
  if (b || void 0 == a.returnValue) {
    a.returnValue = !0;
  }
};
goog.events.isMarkedIeEvent_ = function(a) {
  return 0 > a.keyCode || void 0 != a.returnValue;
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(a) {
  return a + "_" + goog.events.uniqueIdCounter_++;
};
goog.events.getListenerMap_ = function(a) {
  a = a[goog.events.LISTENER_MAP_PROP_];
  return a instanceof goog.events.ListenerMap ? a : null;
};
goog.events.LISTENER_WRAPPER_PROP_ = "__closure_events_fn_" + (1E9 * Math.random() >>> 0);
goog.events.wrapListener_ = function(a) {
  goog.asserts.assert(a, "Listener can not be null.");
  if (goog.isFunction(a)) {
    return a;
  }
  goog.asserts.assert(a.handleEvent, "An object listener must have handleEvent method.");
  return a[goog.events.LISTENER_WRAPPER_PROP_] || (a[goog.events.LISTENER_WRAPPER_PROP_] = function(b) {
    return a.handleEvent(b);
  });
};
goog.debug.entryPointRegistry.register(function(a) {
  goog.events.handleBrowserEvent_ = a(goog.events.handleBrowserEvent_);
});
// Input 47
wtf.db.EventTypeTable = function() {
  this.nextTypeId_ = 1;
  this.list_ = [];
  this.eventsById_ = [];
  this.eventsByName_ = Object.create(null);
};
wtf.db.EventTypeTable.prototype.defineType = function(a) {
  var b = this.eventsByName_[a.name];
  return b ? b : (a.id = this.nextTypeId_++, this.eventsById_[a.id] = a, this.eventsByName_[a.name] = a, this.list_.push(a), a);
};
wtf.db.EventTypeTable.prototype.getAll = function() {
  return this.list_;
};
wtf.db.EventTypeTable.prototype.getAllMatching = function(a, b) {
  for (var c = [], d = 0;d < this.list_.length;d++) {
    var e = this.list_[d];
    (void 0 === b || e.eventClass === b) && a.test(e.name) && c.push(e);
  }
  return c;
};
wtf.db.EventTypeTable.prototype.getSetMatching = function(a) {
  for (var b = {}, c = 0;c < this.list_.length;c++) {
    var d = this.list_[c];
    a.test(d.name) && (b[d.id] = !0);
  }
  return b;
};
wtf.db.EventTypeTable.prototype.getById = function(a) {
  return this.eventsById_[a] || null;
};
wtf.db.EventTypeTable.prototype.getByName = function(a) {
  return this.eventsByName_[a] || null;
};
goog.exportSymbol("wtf.db.EventTypeTable", wtf.db.EventTypeTable);
goog.exportProperty(wtf.db.EventTypeTable.prototype, "getAll", wtf.db.EventTypeTable.prototype.getAll);
goog.exportProperty(wtf.db.EventTypeTable.prototype, "getAllMatching", wtf.db.EventTypeTable.prototype.getAllMatching);
goog.exportProperty(wtf.db.EventTypeTable.prototype, "getByName", wtf.db.EventTypeTable.prototype.getByName);
// Input 48
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
  a && (-1 != a.indexOf("Firefox") ? goog.userAgent.product.detectedFirefox_ = !0 : -1 != a.indexOf("Camino") ? goog.userAgent.product.detectedCamino_ = !0 : -1 != a.indexOf("iPhone") || -1 != a.indexOf("iPod") ? goog.userAgent.product.detectedIphone_ = !0 : -1 != a.indexOf("iPad") ? goog.userAgent.product.detectedIpad_ = !0 : -1 != a.indexOf("Chrome") ? goog.userAgent.product.detectedChrome_ = !0 : -1 != a.indexOf("Android") ? goog.userAgent.product.detectedAndroid_ = !0 : -1 != a.indexOf("Safari") && 
  (goog.userAgent.product.detectedSafari_ = !0));
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
// Input 49
wtf.util = {};
wtf.util.pad0 = function(a, b) {
  for (a = String(a);a.length < b;) {
    a = "0" + a;
  }
  return a;
};
wtf.util.formatTime = function(a) {
  return a.toFixed(3) + "ms";
};
wtf.util.formatSmallTime = function(a) {
  return 0 == a ? "0ms" : 1 > a ? a.toFixed(3) + "ms" : 10 > a ? a.toFixed(2) + "ms" : a.toFixed(0) + "ms";
};
wtf.util.formatWallTime = function(a) {
  var b = new Date(a);
  return "" + goog.string.padNumber(b.getHours(), 2) + ":" + goog.string.padNumber(b.getMinutes(), 2) + ":" + goog.string.padNumber(b.getSeconds(), 2) + "." + String((b.getMilliseconds() / 1E3).toFixed(3)).slice(2, 5) + "." + goog.string.padNumber(Math.floor(1E4 * (a - Math.floor(a))), 4);
};
wtf.util.addArgumentLines = function(a, b, c) {
  if (b) {
    var d = "";
    if (c) {
      for (var e = 0;e < c;e++) {
        d += "  ";
      }
    }
    for (var f in b) {
      if (c = b[f], void 0 !== c) {
        if (null === c) {
          c = "null";
        } else {
          if (goog.isArray(c)) {
            c = "[" + c + "]";
          } else {
            if (c.buffer && c.buffer instanceof ArrayBuffer) {
              for (var e = "[", g = 0;g < Math.min(c.length, 16);g++) {
                g && (e += ","), e += c[g];
              }
              16 < c.length && (e += " ...");
              c = e += "]";
            } else {
              goog.isObject(c) && (c = goog.global.JSON.stringify(c, void 0, 2));
            }
          }
        }
        a.push(d + f + ": " + c);
      }
    }
  }
};
wtf.util.getCompiledMemberName = function(a, b) {
  var c = null, d;
  for (d in a) {
    if (a[d] === b) {
      if (c) {
        return goog.asserts.fail("duplicate members found"), null;
      }
      c = d;
    }
  }
  return c;
};
wtf.util.callWhenDomReady = function(a, b, c) {
  var d = c || goog.global.document;
  if ("complete" == d.readyState) {
    a.call(b);
  } else {
    var e = !1;
    if (d.addEventListener) {
      var f = function() {
        e || (e = !0, d.removeEventListener("DOMContentLoaded", f, !1), d.removeEventListener("load", f, !1), a.call(b));
      };
      f.__wtf_ignore__ = !0;
      d.addEventListener("DOMContentLoaded", f, !1);
      goog.global.addEventListener("load", f, !1);
    } else {
      d.attachEvent && (f = function() {
        e || (e = !0, d.detachEvent("onload", f), goog.global.detachEvent("load", f), a.call(b));
      }, f.__wtf_ignore__ = !0, d.attachEvent("onload", f), goog.global.attachEvent("load", f));
    }
  }
};
wtf.util.convertAsciiStringToUint8Array = function(a) {
  for (var b = new Uint8Array(a.length), c = 0;c < b.length;c++) {
    b[c] = a.charCodeAt(c) & 255;
  }
  return b;
};
wtf.util.convertUint8ArrayToAsciiString = function(a) {
  for (var b = Array(a.length), c = 0;c < a.length;c++) {
    b[c] = String.fromCharCode(a[c]);
  }
  return b.join("");
};
wtf.util.getElementXPath = function(a) {
  if (a) {
    if (a == goog.global) {
      return "window";
    }
    if (a.id) {
      return'//*[@id="' + a.id + '"]';
    }
  } else {
    return null;
  }
  for (var b = [];a && a.nodeType == Node.ELEMENT_NODE;a = a.parentNode) {
    for (var c = 0, d = a.previousSibling;d;d = d.previousSibling) {
      d.nodeType != Node.DOCUMENT_TYPE_NODE && d.nodeName == a.nodeName && c++;
    }
    b.push(a.nodeName + "[" + (c + 1) + "]");
  }
  if (!b.length) {
    return null;
  }
  b.push("");
  wtf.util.reverse(b);
  return b.join("/");
};
wtf.util.findElementByXPath = function(a, b) {
  var c = b || goog.global.document;
  return a ? "window" == a ? c.defaultView : c.evaluate(a, c, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue : null;
};
wtf.util.reverse = goog.userAgent.product.CHROME ? function(a) {
  for (var b = a.length, c = b >> 1, d = 0;d < c;d++) {
    var e = b - d - 1, f = a[d];
    a[d] = a[e];
    a[e] = f;
  }
} : function(a) {
  a.reverse();
};
wtf.util.GLOBAL_CACHE_KEY_ = "wtf_util_global_cache";
wtf.util.getGlobalCacheObject = function(a, b) {
  var c = b || goog.global, d = c[wtf.util.GLOBAL_CACHE_KEY_];
  d || (d = c[wtf.util.GLOBAL_CACHE_KEY_] = {});
  (c = d[a]) || (c = d[a] = {});
  return c;
};
goog.exportSymbol("wtf.util.formatTime", wtf.util.formatTime);
goog.exportSymbol("wtf.util.formatSmallTime", wtf.util.formatSmallTime);
goog.exportSymbol("wtf.util.formatWallTime", wtf.util.formatWallTime);
// Input 50
wtf.db.Unit = {TIME_MILLISECONDS:0, SIZE_KILOBYTES:1, COUNT:2};
wtf.db.Unit.parse = function(a) {
  if (!a || !a.length) {
    return wtf.db.Unit.TIME_MILLISECONDS;
  }
  switch(a) {
    case "microseconds":
      return wtf.db.Unit.TIME_MILLISECONDS;
    case "bytes":
      return wtf.db.Unit.SIZE_KILOBYTES;
    case "count":
      return wtf.db.Unit.COUNT;
  }
  goog.asserts.fail("Unknown unit type: " + a);
  return wtf.db.Unit.TIME_MILLISECONDS;
};
wtf.db.Unit.format = function(a, b, c) {
  if (b == wtf.db.Unit.TIME_MILLISECONDS) {
    return c ? wtf.util.formatSmallTime(a) : wtf.util.formatTime(a);
  }
  if (b == wtf.db.Unit.SIZE_KILOBYTES) {
    return b = c ? 0 : 3, a = Math.round(1E3 * a), 0 == a ? "0b" : 1024 > a ? a + "b" : 1048576 > a ? (a / 1024).toFixed(b) + "kb" : (a / 1048576).toFixed(b) + "mb";
  }
  if (b == wtf.db.Unit.COUNT) {
    b = c ? 0 : 3;
    a = Math.round(1E3 * a);
    if (0 == a) {
      return "0";
    }
    if (!(1E3 > a)) {
      return 1E6 > a ? (a / 1E3).toFixed(b) + "k" : (a / 1E6).toFixed(b) + "m";
    }
  }
  return String(a);
};
// Input 51
wtf.db.EventStruct = {ID:0, TYPE:1, PARENT:2, DEPTH:3, TIME:4, END_TIME:5, NEXT_SIBLING:6, ARGUMENTS:7, TAG:8, SYSTEM_TIME:9, CHILD_TIME:10, STRUCT_SIZE:11};
// Input 52
wtf.db.EventIterator = function(a, b, c, d, e) {
  this.eventList_ = a;
  this.firstIndex_ = b;
  this.lastIndex_ = c;
  this.index_ = d;
  this.indirectionTable_ = e || null;
  this.eventData_ = a.eventData;
  this.offset_ = -1;
  this.cachedParentIt_ = null;
  this.seek(this.index_);
};
wtf.db.EventIterator.prototype.getCount = function() {
  return this.lastIndex_ - this.firstIndex_ + 1;
};
wtf.db.EventIterator.prototype.seek = function(a) {
  0 > a ? this.index_ = this.lastIndex_ + 1 : (this.index_ = a, this.index_ > this.lastIndex_ || (this.offset_ = (this.indirectionTable_ ? this.indirectionTable_[this.index_] : this.index_) * wtf.db.EventStruct.STRUCT_SIZE));
};
wtf.db.EventIterator.prototype.next = function() {
  ++this.index_;
  this.offset_ = (this.indirectionTable_ ? this.indirectionTable_[this.index_] : this.index_) * wtf.db.EventStruct.STRUCT_SIZE;
};
wtf.db.EventIterator.prototype.nextScope = function() {
  for (var a = this.eventData_, b = this.index_, c = this.offset_;b <= this.lastIndex_ && (b++, c += wtf.db.EventStruct.STRUCT_SIZE, !a[c + wtf.db.EventStruct.END_TIME]);) {
  }
  this.index_ = b;
  this.offset_ = c;
};
wtf.db.EventIterator.prototype.nextInstance = function() {
  for (var a = this.eventData_, b = this.index_, c = this.offset_;b <= this.lastIndex_ && (b++, c += wtf.db.EventStruct.STRUCT_SIZE, a[c + wtf.db.EventStruct.END_TIME]);) {
  }
  this.index_ = b;
  this.offset_ = c;
};
wtf.db.EventIterator.prototype.nextSibling = function() {
  var a = this.eventData_[this.offset_ + wtf.db.EventStruct.NEXT_SIBLING];
  a || (a = this.lastIndex_ + 1);
  this.seek(a);
};
wtf.db.EventIterator.prototype.nextSiblingScope = function() {
  var a = this.eventData_, b = a[this.offset_ + wtf.db.EventStruct.NEXT_SIBLING];
  b || (b = this.lastIndex_ + 1);
  this.seek(b);
  this.index_ <= this.lastIndex_ && !a[this.offset_ + wtf.db.EventStruct.END_TIME] && this.nextScope();
};
wtf.db.EventIterator.prototype.moveToFirstScope = function() {
  this.seek(this.firstIndex_);
  this.index_ <= this.lastIndex_ && (this.isScope() || this.nextScope());
};
wtf.db.EventIterator.prototype.moveToFirstInstance = function() {
  this.seek(this.firstIndex_);
  this.index_ <= this.lastIndex_ && (this.isInstance() || this.nextInstance());
};
wtf.db.EventIterator.prototype.moveToParent = function() {
  var a = this.eventData_[this.offset_ + wtf.db.EventStruct.PARENT];
  0 <= a ? this.seek(a) : this.seek(this.lastIndex_ + 1);
};
wtf.db.EventIterator.prototype.done = function() {
  return this.index_ > this.lastIndex_;
};
wtf.db.EventIterator.prototype.getId = function() {
  return this.eventData_[this.offset_ + wtf.db.EventStruct.ID];
};
wtf.db.EventIterator.prototype.getIndex = function() {
  return this.index_;
};
wtf.db.EventIterator.prototype.getTypeId = function() {
  return this.eventData_[this.offset_ + wtf.db.EventStruct.TYPE] & 65535;
};
wtf.db.EventIterator.prototype.getType = function() {
  return this.eventList_.eventTypeTable.getById(this.eventData_[this.offset_ + wtf.db.EventStruct.TYPE] & 65535);
};
wtf.db.EventIterator.prototype.getName = function() {
  return this.getType().getName();
};
wtf.db.EventIterator.prototype.getTypeFlags = function() {
  return this.eventData_[this.offset_ + wtf.db.EventStruct.TYPE] >>> 16;
};
wtf.db.EventIterator.prototype.isHidden = function() {
  return!!(this.getTypeFlags() & (wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.APPEND_SCOPE_DATA | wtf.data.EventFlag.APPEND_FLOW_DATA));
};
wtf.db.EventIterator.prototype.isScope = function() {
  return!!this.eventData_[this.offset_ + wtf.db.EventStruct.END_TIME];
};
wtf.db.EventIterator.prototype.isInstance = function() {
  return!this.eventData_[this.offset_ + wtf.db.EventStruct.END_TIME];
};
wtf.db.EventIterator.prototype.getParent = function(a) {
  var b = this.eventData_[this.offset_ + wtf.db.EventStruct.PARENT];
  return 0 <= b ? a ? ((a = this.cachedParentIt_) ? a.seek(b) : a = this.cachedParentIt_ = new wtf.db.EventIterator(this.eventList_, 0, this.eventList_.count, b), a) : new wtf.db.EventIterator(this.eventList_, 0, this.eventList_.count, b) : null;
};
wtf.db.EventIterator.prototype.getParentEndTime = function() {
  var a = this.eventData_[this.offset_ + wtf.db.EventStruct.PARENT];
  return 0 <= a ? this.eventData_[a * wtf.db.EventStruct.STRUCT_SIZE + wtf.db.EventStruct.END_TIME] : 0;
};
wtf.db.EventIterator.prototype.getDepth = function() {
  return this.eventData_[this.offset_ + wtf.db.EventStruct.DEPTH] & 65535;
};
wtf.db.EventIterator.prototype.getMaxDescendantDepth = function() {
  return this.eventData_[this.offset_ + wtf.db.EventStruct.DEPTH] >>> 16;
};
wtf.db.EventIterator.prototype.getTime = function() {
  return this.eventData_[this.offset_ + wtf.db.EventStruct.TIME] / 1E3;
};
wtf.db.EventIterator.prototype.getArguments = function() {
  var a = this.eventData_[this.offset_ + wtf.db.EventStruct.ARGUMENTS];
  return a ? this.eventList_.getArgumentData(a) : null;
};
wtf.db.EventIterator.prototype.setArguments = function(a) {
  var b = this.eventData_[this.offset_ + wtf.db.EventStruct.ARGUMENTS], b = this.eventList_.setArgumentData(b, a);
  this.eventData_[this.offset_ + wtf.db.EventStruct.ARGUMENTS] = b;
};
wtf.db.EventIterator.prototype.resetArguments = function() {
  var a = this.eventData_[this.offset_ + wtf.db.EventStruct.ARGUMENTS];
  a && this.eventList_.resetArgumentData(a);
};
wtf.db.EventIterator.prototype.getArgument = function(a) {
  var b = this.getArguments();
  return b ? b[a] : void 0;
};
wtf.db.EventIterator.prototype.getTag = function() {
  return this.eventData_[this.offset_ + wtf.db.EventStruct.TAG];
};
wtf.db.EventIterator.prototype.setTag = function(a) {
  this.eventData_[this.offset_ + wtf.db.EventStruct.TAG] = a;
};
wtf.db.EventIterator.prototype.getEndTime = function() {
  return this.eventData_[this.offset_ + wtf.db.EventStruct.END_TIME] / 1E3;
};
wtf.db.EventIterator.prototype.getTotalDuration = function() {
  var a = this.eventData_, b = this.offset_;
  return(a[b + wtf.db.EventStruct.END_TIME] - a[b + wtf.db.EventStruct.TIME]) / 1E3;
};
wtf.db.EventIterator.prototype.getUserDuration = function() {
  var a = this.eventData_, b = this.offset_;
  return(a[b + wtf.db.EventStruct.END_TIME] - a[b + wtf.db.EventStruct.TIME] - a[b + wtf.db.EventStruct.SYSTEM_TIME]) / 1E3;
};
wtf.db.EventIterator.prototype.getOwnDuration = function() {
  var a = this.eventData_, b = this.offset_;
  return(a[b + wtf.db.EventStruct.END_TIME] - a[b + wtf.db.EventStruct.TIME] - a[b + wtf.db.EventStruct.CHILD_TIME]) / 1E3;
};
wtf.db.EventIterator.prototype.buildArgumentString_ = function(a, b, c) {
  function d(b, d, e) {
    b || a.push(", ");
    c && (a.push(d), a.push("="));
    goog.isString(e) ? (a.push("'"), a.push(e), a.push("'")) : a.push(e);
  }
  var e = !0, f = b.getArguments(), g = this.getArguments();
  if (b.args.length && g) {
    for (var k = 0;k < f.length;k++) {
      var m = f[k];
      d(e, m.name, g[m.name]);
      e = !1;
    }
    if (b.mayHaveAppendedArgs) {
      b = {};
      for (k = 0;k < f.length;k++) {
        b[f[k].name] = !0;
      }
      for (var l in g) {
        b[l] || (d(e, l, g[l]), e = !1);
      }
    }
  }
};
wtf.db.EventIterator.prototype.getArgumentString = function(a) {
  var b = this.getType(), c = [];
  this.buildArgumentString_(c, b, a);
  return c.join("");
};
wtf.db.EventIterator.prototype.getLongString = function(a) {
  var b = this.getType(), c = [b.getName(), "("];
  this.buildArgumentString_(c, b, a);
  c.push(")");
  return c.join("");
};
wtf.db.EventIterator.prototype.getInfoString = function(a) {
  if (this.done()) {
    return null;
  }
  a = goog.isDef(a) ? a : wtf.db.Unit.TIME_MILLISECONDS;
  return this.isScope() ? this.getScopeInfoString_(a) : this.isInstance() ? this.getInstanceInfoString_(a) : null;
};
wtf.db.EventIterator.prototype.getScopeInfoString_ = function(a) {
  var b = wtf.db.Unit.format(this.getTotalDuration(), a);
  this.getTotalDuration() - this.getOwnDuration() && (a = wtf.db.Unit.format(this.getOwnDuration(), a), b += " (" + a + ")");
  a = this.getType();
  b = [b + ": " + a.name];
  (a = this.getArguments()) && wtf.util.addArgumentLines(b, a);
  if (a = this.getChildFlows_()) {
    for (var c = 0;c < a.length;c++) {
      b.push("  " + a[c].getType().name), wtf.util.addArgumentLines(b, a[c].getArguments(), 2);
    }
  }
  return b.join("\n");
};
wtf.db.EventIterator.prototype.getInstanceInfoString_ = function(a) {
  a = [];
  var b = this.getType();
  a.push(b.name);
  (b = this.getArguments()) && wtf.util.addArgumentLines(a, b);
  return a.join("\n");
};
wtf.db.EventIterator.prototype.getScopeStackString = function() {
  for (var a = [], b = this;!b.done();) {
    var c = b.getType();
    a.push(c.name);
    b = b.getParent(!0);
  }
  for (b = 0;b < a.length;b++) {
    a[b] = a.length - b - 1 + ": " + a[b];
  }
  return a.join("\n");
};
wtf.db.EventIterator.prototype.getChildFlows_ = function() {
  for (var a = this.eventList_.beginTimeRange(this.getTime(), this.getEndTime()), b = this.eventList_.eventTypeTable.getByName("wtf.flow#branch"), b = b ? b.id : -1, c = this.eventList_.eventTypeTable.getByName("wtf.flow#extend"), c = c ? c.id : -1, d = this.eventList_.eventTypeTable.getByName("wtf.flow#terminate"), d = d ? d.id : -1, e = null;!a.done();a.next()) {
    if (a.getParent().getId() == this.getId()) {
      var f = a.getTypeId() & 65535;
      if (f == b || f == c || f == d) {
        e = e || [], e.push(this.eventList_.getEvent(a.getId()));
      }
    }
  }
  return e;
};
wtf.db.EventIterator.prototype.getChildFlowId = function() {
  var a = this.getChildFlows_();
  return a ? a[0].getArgument("id") : -1;
};
goog.exportSymbol("wtf.db.EventIterator", wtf.db.EventIterator);
goog.exportProperty(wtf.db.EventIterator.prototype, "getCount", wtf.db.EventIterator.prototype.getCount);
goog.exportProperty(wtf.db.EventIterator.prototype, "seek", wtf.db.EventIterator.prototype.seek);
goog.exportProperty(wtf.db.EventIterator.prototype, "next", wtf.db.EventIterator.prototype.next);
goog.exportProperty(wtf.db.EventIterator.prototype, "nextScope", wtf.db.EventIterator.prototype.nextScope);
goog.exportProperty(wtf.db.EventIterator.prototype, "nextInstance", wtf.db.EventIterator.prototype.nextInstance);
goog.exportProperty(wtf.db.EventIterator.prototype, "nextSibling", wtf.db.EventIterator.prototype.nextSibling);
goog.exportProperty(wtf.db.EventIterator.prototype, "moveToParent", wtf.db.EventIterator.prototype.moveToParent);
goog.exportProperty(wtf.db.EventIterator.prototype, "done", wtf.db.EventIterator.prototype.done);
goog.exportProperty(wtf.db.EventIterator.prototype, "getId", wtf.db.EventIterator.prototype.getId);
goog.exportProperty(wtf.db.EventIterator.prototype, "getTypeId", wtf.db.EventIterator.prototype.getTypeId);
goog.exportProperty(wtf.db.EventIterator.prototype, "getType", wtf.db.EventIterator.prototype.getType);
goog.exportProperty(wtf.db.EventIterator.prototype, "getName", wtf.db.EventIterator.prototype.getName);
goog.exportProperty(wtf.db.EventIterator.prototype, "isHidden", wtf.db.EventIterator.prototype.isHidden);
goog.exportProperty(wtf.db.EventIterator.prototype, "getTypeFlags", wtf.db.EventIterator.prototype.getTypeFlags);
goog.exportProperty(wtf.db.EventIterator.prototype, "isScope", wtf.db.EventIterator.prototype.isScope);
goog.exportProperty(wtf.db.EventIterator.prototype, "isInstance", wtf.db.EventIterator.prototype.isInstance);
goog.exportProperty(wtf.db.EventIterator.prototype, "getParent", wtf.db.EventIterator.prototype.getParent);
goog.exportProperty(wtf.db.EventIterator.prototype, "getDepth", wtf.db.EventIterator.prototype.getDepth);
goog.exportProperty(wtf.db.EventIterator.prototype, "getTime", wtf.db.EventIterator.prototype.getTime);
goog.exportProperty(wtf.db.EventIterator.prototype, "getArguments", wtf.db.EventIterator.prototype.getArguments);
goog.exportProperty(wtf.db.EventIterator.prototype, "getArgument", wtf.db.EventIterator.prototype.getArgument);
goog.exportProperty(wtf.db.EventIterator.prototype, "getTag", wtf.db.EventIterator.prototype.getTag);
goog.exportProperty(wtf.db.EventIterator.prototype, "setTag", wtf.db.EventIterator.prototype.setTag);
goog.exportProperty(wtf.db.EventIterator.prototype, "getEndTime", wtf.db.EventIterator.prototype.getEndTime);
goog.exportProperty(wtf.db.EventIterator.prototype, "getTotalDuration", wtf.db.EventIterator.prototype.getTotalDuration);
goog.exportProperty(wtf.db.EventIterator.prototype, "getUserDuration", wtf.db.EventIterator.prototype.getUserDuration);
goog.exportProperty(wtf.db.EventIterator.prototype, "getOwnDuration", wtf.db.EventIterator.prototype.getOwnDuration);
goog.exportProperty(wtf.db.EventIterator.prototype, "getLongString", wtf.db.EventIterator.prototype.getLongString);
goog.exportProperty(wtf.db.EventIterator.prototype, "getInfoString", wtf.db.EventIterator.prototype.getInfoString);
goog.exportProperty(wtf.db.EventIterator.prototype, "getScopeStackString", wtf.db.EventIterator.prototype.getScopeStackString);
goog.exportProperty(wtf.db.EventIterator.prototype, "getChildFlowId", wtf.db.EventIterator.prototype.getChildFlowId);
// Input 53
wtf.data.VariableFlag = {};
wtf.data.Variable = function(a, b, c) {
  this.name = a;
  this.typeName = b;
  this.flags = c || 0;
};
wtf.data.Variable.TYPE_MAP_ = {bool:"bool", int8:"int8", "byte":"int8", uint8:"uint8", octet:"uint8", int16:"int16", "short":"int16", uint16:"uint16", "unsigned short":"uint16", int32:"int32", "long":"int32", uint32:"uint32", "unsigned long":"uint32", float32:"float32", "float":"float32", ascii:"ascii", utf8:"utf8", "char":"char", wchar:"wchar", DOMString:"utf8", any:"any", flowId:"flowId", time32:"time32"};
wtf.data.Variable.create = function(a, b) {
  var c = !1;
  goog.string.endsWith(b, "[]") && (c = !0, b = b.replace("[]", ""));
  goog.string.startsWith(b, "sequence<") && (c = !0, b = b.substr(9, b.length - 10));
  b = wtf.data.Variable.TYPE_MAP_[b];
  if (!b) {
    return null;
  }
  c && (b += "[]");
  return new wtf.data.Variable(a, b, 0);
};
wtf.data.Variable.SIGNATURE_REGEX_ = /[ ]*([a-zA-Z0-9 \[\]\<\>]+) ([a-zA-Z0-9_]+)/;
wtf.data.Variable.parseSignatureArguments = function(a) {
  a = a.split(",");
  for (var b = [], c = 0, d = wtf.data.Variable.SIGNATURE_REGEX_, e = 0;e < a.length;e++) {
    var f = d.exec(a[e]);
    if (!f) {
      throw Error("Invalid signature argument: " + a[e]);
    }
    var g = f[1], f = f[2], k = f.indexOf("@");
    -1 != k && (c = Number(f.substr(k + 1)), f = f.substr(0, k));
    f = wtf.data.Variable.create(f, g);
    if (!f) {
      throw Error("Invalid signature argument type: " + g);
    }
    b.push({ordinal:c, variable:f});
    c++;
  }
  return b;
};
wtf.data.Variable.invalidCount_ = 0;
wtf.data.Variable.parseSignature = function(a) {
  a = goog.string.trim(a);
  var b = a.indexOf("(");
  a = -1 != b ? a.substr(0, b).replace(/ /g, "") + a.substr(b) : a.replace(/ /g, "");
  var b = !1, c = /^([a-zA-Z0-9_\.#:\$\[\]\"\'\-]+)(\((.*)\)$)?/.exec(a);
  c && c.length || (goog.global.console.warn("Invalid event signature: " + a + " - unable to parse"), b = !0);
  b || c[0] == a || (goog.global.console.warn("Invalid event signature: " + a + " - not all characters used"), b = !0);
  b && (c = [null, "invalid_" + wtf.data.Variable.invalidCount_++, null, null]);
  b = c[1];
  c = c[3];
  if (!b || !b.length) {
    throw Error("Invalid event name: " + a);
  }
  a = [];
  var d = [];
  if (c) {
    for (a = wtf.data.Variable.parseSignatureArguments(c), c = 0;c < a.length;c++) {
      d.push(a[c].variable);
    }
  }
  return{name:b, args:d, argMap:a};
};
wtf.data.Variable.santizeName = function(a) {
  return a.replace(/ /g, "_");
};
// Input 54
wtf.util.FunctionBuilder = function() {
  this.isBuilding_ = !1;
  this.currentScopeVariableNames_ = [];
  this.currentScopeVariableValues_ = [];
  this.currentArgs_ = [];
  this.currentSource_ = [];
};
wtf.util.FunctionBuilder.isSupported_ = void 0;
wtf.util.FunctionBuilder.isSupported = function() {
  if (void 0 === wtf.util.FunctionBuilder.isSupported_) {
    wtf.util.FunctionBuilder.isSupported_ = !0;
    try {
      wtf.util.FunctionBuilder.isSupported_ = !!new Function("");
    } catch (a) {
      wtf.util.FunctionBuilder.isSupported_ = !1;
    }
  }
  return wtf.util.FunctionBuilder.isSupported_;
};
wtf.util.FunctionBuilder.prototype.begin = function() {
  goog.asserts.assert(!this.isBuilding_);
  goog.asserts.assert(!this.currentArgs_.length);
  goog.asserts.assert(!this.currentSource_.length);
  this.isBuilding_ = !0;
};
wtf.util.FunctionBuilder.prototype.addScopeVariable = function(a, b) {
  goog.asserts.assert(this.isBuilding_);
  this.currentScopeVariableNames_.push(a);
  this.currentScopeVariableValues_.push(b);
};
wtf.util.FunctionBuilder.prototype.addArgument = function(a) {
  goog.asserts.assert(this.isBuilding_);
  this.currentArgs_.push(a);
};
wtf.util.FunctionBuilder.prototype.append = function(a) {
  goog.asserts.assert(this.isBuilding_);
  for (var b = 0;b < arguments.length;b++) {
    this.currentSource_.push(arguments[b]);
  }
};
wtf.util.FunctionBuilder.prototype.end = function(a) {
  goog.asserts.assert(this.isBuilding_);
  var b = this.currentSource_.join("\n"), c = a.replace(/[^a-zA-Z_]/g, "_"), d = a.replace(/#/g, "/"), b = new Function(this.currentScopeVariableNames_, ['"use strict";', "return function " + c + "(" + this.currentArgs_.join(", ") + ") {", b, "};", "//# sourceURL=x://wtf/" + d].join("\n"));
  b.displayName = a;
  b = b.apply(null, this.currentScopeVariableValues_);
  b.displayName = a;
  this.currentScopeVariableNames_.length = 0;
  this.currentScopeVariableValues_.length = 0;
  this.currentArgs_.length = 0;
  this.currentSource_.length = 0;
  this.isBuilding_ = !1;
  return b;
};
// Input 55
wtf.db.EventTypeBuilder = function() {
  wtf.util.FunctionBuilder.call(this);
};
goog.inherits(wtf.db.EventTypeBuilder, wtf.util.FunctionBuilder);
wtf.db.EventTypeBuilder.prototype.generate = function(a) {
  var b = wtf.db.EventTypeBuilder.READERS_;
  if (!wtf.util.FunctionBuilder.isSupported()) {
    throw Error("Fallback path for event type builder is not yet implemented");
  }
  this.begin();
  this.addArgument("buffer");
  for (var c = {}, d = a.args, e = 0;e < d.length;e++) {
    var f = d[e], g = b[f.typeName];
    goog.asserts.assert(g);
    for (f = 0;f < g.uses.length;f++) {
      c[g.uses[f]] = !0;
    }
  }
  for (var k in c) {
    switch(k) {
      case "temp":
      ;
      case "len":
        this.append("var " + k + ";");
        break;
      default:
        this.append("var " + k + " = buffer." + k + ";");
    }
  }
  this.append("var o = buffer.offset >> 2;");
  for (e = c = 0;e < d.length;e++) {
    f = d[e], g = b[f.typeName], !g.size && c && (this.append("o += " + c + ";"), c = 0), this.append.apply(this, g.read(f.name, "o + " + c)), g.size && (c += g.size + 3 >> 2);
  }
  c ? this.append("buffer.offset = (o + " + c + ") << 2;") : this.append("buffer.offset = o << 2;");
  this.append("return {");
  for (e = 0;e < d.length;e++) {
    f = d[e], this.append('  "' + f.name + '": ' + f.name + "_" + (e < d.length - 1 ? "," : ""));
  }
  this.append("};");
  return this.end(a.toString());
};
wtf.db.EventTypeBuilder.READERS_ = {bool:{uses:["uint8Array"], size:1, read:function(a, b) {
  return["var " + a + "_ = !!uint8Array[(" + b + ") << 2];"];
}}, int8:{uses:["int8Array"], size:1, read:function(a, b) {
  return["var " + a + "_ = int8Array[(" + b + ") << 2];"];
}}, "int8[]":{uses:["uint32Array", "int8Array", "temp", "len"], size:0, read:function(a, b) {
  return["var " + a + "_ = null;", "len = uint32Array[o++];", "if (len != 0xFFFFFFFF) {", "  " + a + "_ = temp = new Int8Array(len);", "  for (var n = 0, oi = o << 2; n < len; n++) {", "    temp[n] = int8Array[oi + n];", "  }", "  o += (len + 3) >> 2;", "}"];
}}, uint8:{uses:["uint8Array"], size:1, read:function(a, b) {
  return["var " + a + "_ = uint8Array[(" + b + ") << 2];"];
}}, "uint8[]":{uses:["uint32Array", "uint8Array", "temp", "len"], size:0, read:function(a, b) {
  return["var " + a + "_ = null;", "len = uint32Array[o++];", "if (len != 0xFFFFFFFF) {", "  " + a + "_ = temp = new Uint8Array(len);", "  for (var n = 0, oi = o << 2; n < len; n++) {", "    temp[n] = uint8Array[oi + n];", "  }", "  o += (len + 3) >> 2;", "}"];
}}, int16:{uses:["int16Array"], size:2, read:function(a, b) {
  return["var " + a + "_ = int16Array[(" + b + ") << 1];"];
}}, "int16[]":{uses:["uint32Array", "int16Array", "temp", "len"], size:0, read:function(a, b) {
  return["var " + a + "_ = null;", "len = uint32Array[o++];", "if (len != 0xFFFFFFFF) {", "  " + a + "_ = temp = new Int16Array(len);", "  for (var n = 0, oi = o << 1; n < len; n++) {", "    temp[n] = int16Array[oi + n];", "  }", "  o += (len + 1) >> 1;", "}"];
}}, uint16:{uses:["uint16Array"], size:2, read:function(a, b) {
  return["var " + a + "_ = uint16Array[(" + b + ") << 1];"];
}}, "uint16[]":{uses:["uint32Array", "uint16Array", "temp", "len"], size:0, read:function(a, b) {
  return["var " + a + "_ = null;", "len = uint32Array[o++];", "if (len != 0xFFFFFFFF) {", "  " + a + "_ = temp = new Uint16Array(len);", "  for (var n = 0, oi = o << 1; n < len; n++) {", "    temp[n] = uint16Array[oi + n];", "  }", "  o += (len + 1) >> 1;", "}"];
}}, int32:{uses:["int32Array"], size:4, read:function(a, b) {
  return["var " + a + "_ = int32Array[" + b + "];"];
}}, "int32[]":{uses:["uint32Array", "int32Array", "temp", "len"], size:0, read:function(a, b) {
  return["var " + a + "_ = null;", "len = uint32Array[o++];", "if (len != 0xFFFFFFFF) {", "  " + a + "_ = temp = new Int32Array(len);", "  for (var n = 0; n < len; n++) {", "    temp[n] = int32Array[o + n];", "  }", "  o += len;", "}"];
}}, uint32:{uses:["uint32Array"], size:4, read:function(a, b) {
  return["var " + a + "_ = uint32Array[" + b + "];"];
}}, "uint32[]":{uses:["uint32Array", "temp", "len"], size:0, read:function(a, b) {
  return["var " + a + "_ = null;", "len = uint32Array[o++];", "if (len != 0xFFFFFFFF) {", "  " + a + "_ = temp = new Uint32Array(len);", "  for (var n = 0; n < len; n++) {", "    temp[n] = uint32Array[o + n];", "  }", "  o += len;", "}"];
}}, float32:{uses:["float32Array"], size:4, read:function(a, b) {
  return["var " + a + "_ = float32Array[" + b + "];"];
}}, "float32[]":{uses:["uint32Array", "float32Array", "temp", "len"], size:0, read:function(a, b) {
  return["var " + a + "_ = null;", "len = uint32Array[o++];", "if (len != 0xFFFFFFFF) {", "  " + a + "_ = temp = new Float32Array(len);", "  for (var n = 0; n < len; n++) {", "    temp[n] = float32Array[o + n];", "  }", "  o += len;", "}"];
}}, ascii:{uses:["uint32Array", "stringTable"], size:4, read:function(a, b) {
  return["var " + a + "_ = stringTable.getString(uint32Array[" + b + "]);"];
}}, utf8:{uses:["uint32Array", "stringTable"], size:4, read:function(a, b) {
  return["var " + a + "_ = stringTable.getString(uint32Array[" + b + "]);"];
}}, "char":{uses:["uint8Array"], size:1, read:function(a, b) {
  return["var " + a + "_ = String.fromCharCode(uint8Array[(" + b + ") << 2]);"];
}}, "char[]":{uses:["uint32Array", "uint8Array", "temp", "len"], size:0, read:function(a, b) {
  return["var " + a + "_ = null;", "len = uint32Array[o++];", "if (len == 0) {", "  " + a + "_ = ''", "} else if (len != 0xFFFFFFFF) {", "  temp = new Array(len);", "  for (var n = 0, oi = o << 2; n < len; n++) {", "    temp[n] = uint8Array[oi + n];", "  }", "  " + a + "_ = String.fromCharCode.apply(null, temp);", "  o += (len + 3) >> 2;", "}"];
}}, wchar:{uses:["uint16Array"], size:2, read:function(a, b) {
  return["var " + a + "_ = String.fromCharCode(uint16Array[(" + b + ") << 1]);"];
}}, "wchar[]":{uses:["uint32Array", "uint16Array", "temp", "len"], size:0, read:function(a, b) {
  return["var " + a + "_ = null;", "len = uint32Array[o++];", "if (len == 0) {", "  " + a + "_ = ''", "} else if (len != 0xFFFFFFFF) {", "  temp = new Array(len);", "  for (var n = 0, oi = o << 1; n < len; n++) {", "    temp[n] = uint16Array[oi + n];", "  }", "  " + a + "_ = String.fromCharCode.apply(null, temp);", "  o += (len + 1) >> 1;", "}"];
}}, any:{uses:["uint32Array", "stringTable"], size:4, read:function(a, b) {
  return["var " + a + "_ = JSON.parse(stringTable.getString(uint32Array[" + b + "]));"];
}}, flowId:{uses:["uint32Array"], size:4, read:function(a, b) {
  return["var " + a + "_ = uint32Array[" + b + "];"];
}}, time32:{uses:["uint32Array"], size:4, read:function(a, b) {
  return["var " + a + "_ = uint32Array[" + b + "] / 1000;"];
}}};
wtf.db.EventTypeBuilder.prototype.generateLegacy = function(a) {
  var b = wtf.db.EventTypeBuilder.LEGACY_READERS_, c = a.args;
  return function(a) {
    for (var e = {}, f = 0;f < c.length;f++) {
      var g = c[f];
      e[g.name] = b[g.typeName](a);
    }
    return e;
  };
};
wtf.db.EventTypeBuilder.LEGACY_READERS_ = {bool:function(a) {
  return!!a.readInt8();
}, int8:function(a) {
  return a.readInt8();
}, "int8[]":function(a) {
  for (var b = a.readUint32(), c = new Int8Array(b), d = 0;d < b;d++) {
    c[d] = a.readInt8();
  }
  return c;
}, uint8:function(a) {
  return a.readUint8();
}, "uint8[]":function(a) {
  for (var b = a.readUint32(), c = new Uint8Array(b), d = 0;d < b;d++) {
    c[d] = a.readUint8();
  }
  return c;
}, int16:function(a) {
  return a.readInt16();
}, "int16[]":function(a) {
  for (var b = a.readUint32(), c = new Uint16Array(b), d = 0;d < b;d++) {
    c[d] = a.readUint16();
  }
  return c;
}, uint16:function(a) {
  return a.readUint16();
}, "uint16[]":function(a) {
  for (var b = a.readUint32(), c = new Uint16Array(b), d = 0;d < b;d++) {
    c[d] = a.readUint16();
  }
  return c;
}, int32:function(a) {
  return a.readInt32();
}, "int32[]":function(a) {
  for (var b = a.readUint32(), c = new Int32Array(b), d = 0;d < b;d++) {
    c[d] = a.readInt32();
  }
  return c;
}, uint32:function(a) {
  return a.readUint32();
}, "uint32[]":function(a) {
  for (var b = a.readUint32(), c = new Uint32Array(b), d = 0;d < b;d++) {
    c[d] = a.readUint32();
  }
  return c;
}, float32:function(a) {
  return a.readFloat32();
}, "float32[]":function(a) {
  for (var b = a.readUint32(), c = new Float32Array(b), d = 0;d < b;d++) {
    c[d] = a.readFloat32();
  }
  return c;
}, ascii:function(a) {
  return a.readAsciiString();
}, utf8:function(a) {
  return a.readUtf8String();
}, any:function(a) {
  a = a.readUtf8String();
  return goog.global.JSON.parse(a);
}, flowId:function(a) {
  return a.readUint32();
}, time32:function(a) {
  return a.readUint32() / 1E3;
}};
// Input 56
wtf.db.EventType = function(a, b, c, d) {
  this.id = 0;
  this.name = a;
  this.eventClass = b;
  this.flags = c;
  this.mayHaveAppendedArgs = !1;
  this.args = d;
  a = wtf.db.EventType.getBuilder_();
  this.parseBinaryArguments = d.length ? a.generate(this) : null;
  this.parseLegacyArguments = d.length ? a.generateLegacy(this) : null;
};
wtf.db.EventType.prototype.toString = function() {
  return this.name;
};
wtf.db.EventType.prototype.getName = function() {
  return this.name;
};
wtf.db.EventType.prototype.getClass = function() {
  return this.eventClass;
};
wtf.db.EventType.prototype.getFlags = function() {
  return this.flags;
};
wtf.db.EventType.prototype.getArguments = function() {
  return this.args;
};
wtf.db.EventType.createInstance = function(a, b) {
  var c = wtf.data.Variable.parseSignature(a);
  return new wtf.db.EventType(c.name, wtf.data.EventClass.INSTANCE, b || 0, c.args);
};
wtf.db.EventType.createScope = function(a, b) {
  var c = wtf.data.Variable.parseSignature(a);
  return new wtf.db.EventType(c.name, wtf.data.EventClass.SCOPE, b || 0, c.args);
};
wtf.db.EventType.builder_ = null;
wtf.db.EventType.getBuilder_ = function() {
  wtf.db.EventType.builder_ || (wtf.db.EventType.builder_ = new wtf.db.EventTypeBuilder);
  return wtf.db.EventType.builder_;
};
goog.exportSymbol("wtf.db.EventType", wtf.db.EventType);
goog.exportProperty(wtf.db.EventType.prototype, "toString", wtf.db.EventType.prototype.toString);
goog.exportProperty(wtf.db.EventType.prototype, "getName", wtf.db.EventType.prototype.getName);
goog.exportProperty(wtf.db.EventType.prototype, "getClass", wtf.db.EventType.prototype.getClass);
goog.exportProperty(wtf.db.EventType.prototype, "getFlags", wtf.db.EventType.prototype.getFlags);
goog.exportProperty(wtf.db.EventType.prototype, "getArguments", wtf.db.EventType.prototype.getArguments);
// Input 57
wtf.db.IAncillaryList = function() {
};
wtf.db.IAncillaryList.prototype.beginRebuild = goog.nullFunction;
wtf.db.IAncillaryList.prototype.handleEvent = goog.nullFunction;
wtf.db.IAncillaryList.prototype.endRebuild = goog.nullFunction;
wtf.db.EventList = function(a) {
  this.eventTypeTable = a;
  this.ancillaryLists_ = [];
  this.statistics_ = {totalCount:0, genericEnterScope:0, genericTimeStamp:0, appendScopeData:0};
  this.capacity_ = this.count = 0;
  this.eventData = new Uint32Array(0);
  this.argumentData_ = [null];
  this.originalArgumentData_ = {};
  this.nextArgumentDataId_ = 1;
  this.lastInsertTime_ = this.maximumScopeDepth_ = this.hiddenCount_ = this.lastEventTime_ = this.firstEventTime_ = 0;
  this.resortNeeded_ = !1;
};
wtf.db.EventList.prototype.registerAncillaryList = function(a) {
  this.ancillaryLists_.push(a);
  this.count && this.rebuildAncillaryLists_([a]);
};
wtf.db.EventList.prototype.unregisterAncillaryList = function(a) {
  goog.array.remove(this.ancillaryLists_, a);
};
wtf.db.EventList.prototype.getStatistics = function() {
  return this.statistics_;
};
wtf.db.EventList.prototype.getCount = function() {
  return this.count;
};
wtf.db.EventList.prototype.getFirstEventTime = function() {
  return this.firstEventTime_;
};
wtf.db.EventList.prototype.getLastEventTime = function() {
  return this.lastEventTime_;
};
wtf.db.EventList.prototype.getTotalEventCount = function() {
  return this.count - this.hiddenCount_;
};
wtf.db.EventList.prototype.getMaximumScopeDepth = function() {
  return this.maximumScopeDepth_;
};
wtf.db.EventList.prototype.expandCapacity = function(a) {
  a = void 0 !== a ? a : Math.max(2 * this.capacity_, 1024);
  if (!(a <= this.capacity_)) {
    this.capacity_ = a;
    a = new Uint32Array(this.capacity_ * wtf.db.EventStruct.STRUCT_SIZE);
    for (var b = this.eventData, c = 0;c < this.count * wtf.db.EventStruct.STRUCT_SIZE;c++) {
      a[c] = b[c];
    }
    this.eventData = a;
  }
};
wtf.db.EventList.prototype.insert = function(a, b, c) {
  this.count + 1 > this.capacity_ && this.expandCapacity();
  var d = this.eventData, e = this.count * wtf.db.EventStruct.STRUCT_SIZE;
  d[e + wtf.db.EventStruct.ID] = this.count;
  d[e + wtf.db.EventStruct.TYPE] = a.id | a.flags << 16;
  d[e + wtf.db.EventStruct.PARENT] = -1;
  d[e + wtf.db.EventStruct.TIME] = b;
  c && (a = this.nextArgumentDataId_++, this.argumentData_[a] = c, d[e + wtf.db.EventStruct.ARGUMENTS] = a);
  this.count++;
  b < this.lastInsertTime_ && (this.resortNeeded_ = !0);
  this.lastInsertTime_ = b;
};
wtf.db.EventList.prototype.rebuild = function() {
  this.resortNeeded_ && (this.resortEvents_(), this.resortNeeded_ = !1);
  this.statistics_ = {totalCount:this.count, genericEnterScope:0, genericTimeStamp:0, appendScopeData:0};
  this.lastEventTime_ = this.firstEventTime_ = 0;
  if (this.count) {
    var a = new wtf.db.EventIterator(this, 0, this.count - 1, 0);
    this.firstEventTime_ = a.getTime();
    a.seek(this.count - 1);
    this.lastEventTime_ = a.isScope() ? a.getEndTime() : a.getTime();
  }
  this.rescopeEvents_();
  this.rebuildAncillaryLists_(this.ancillaryLists_);
};
wtf.db.EventList.prototype.resortEvents_ = function() {
  for (var a = this.eventData, b = Array(this.count), c = 0;c < b.length;c++) {
    b[c] = c;
  }
  b.sort(function(b, c) {
    var d = b * wtf.db.EventStruct.STRUCT_SIZE, e = c * wtf.db.EventStruct.STRUCT_SIZE, f = a[d + wtf.db.EventStruct.TIME], g = a[e + wtf.db.EventStruct.TIME];
    return f == g ? a[d + wtf.db.EventStruct.ID] - a[e + wtf.db.EventStruct.ID] : f - g;
  });
  for (var d = new Uint32Array(a.length), c = 0;c < b.length;c++) {
    for (var e = b[c] * wtf.db.EventStruct.STRUCT_SIZE, f = e, g = c * wtf.db.EventStruct.STRUCT_SIZE;f < e + wtf.db.EventStruct.STRUCT_SIZE;f++, g++) {
      d[g] = a[f];
    }
  }
  for (b = c = 0;c < this.count;c++) {
    d[b + wtf.db.EventStruct.ID] = c, b += wtf.db.EventStruct.STRUCT_SIZE;
  }
  this.eventData = d;
};
wtf.db.EventList.prototype.rescopeEvents_ = function() {
  var a = this.eventTypeTable.getByName("wtf.scope#enter"), a = a ? a.id : -1, b = this.eventTypeTable.getByName("wtf.scope#leave"), b = b ? b.id : -1, c = this.eventTypeTable.getByName("wtf.scope#appendData"), c = c ? c.id : -1, d = this.eventTypeTable.getByName("wtf.trace#timeStamp"), d = d ? d.id : -1, e = new Int32Array(1024), f = Array(1024), g = new Uint32Array(1024), k = new Uint32Array(1024), m = new Uint32Array(1024), l = 0, p = 0;
  e[0] = -1;
  f[0] = null;
  for (var s = 0, t = this.statistics_, x = this.eventData, v = 0, w = 0;v < this.count;v++, w += wtf.db.EventStruct.STRUCT_SIZE) {
    var u = e[l];
    x[w + wtf.db.EventStruct.PARENT] = u;
    x[w + wtf.db.EventStruct.DEPTH] = l | l << 16;
    var q = 0;
    v < this.count - 1 && (q = x[w + wtf.db.EventStruct.STRUCT_SIZE + wtf.db.EventStruct.ID]);
    x[w + wtf.db.EventStruct.NEXT_SIBLING] = q;
    var z = x[w + wtf.db.EventStruct.TYPE] & 65535, r = !1;
    z == a ? (r = this.argumentData_[x[w + wtf.db.EventStruct.ARGUMENTS]], r = r.name || "unnamed.scope", (u = this.eventTypeTable.getByName(r)) || (u = this.eventTypeTable.defineType(wtf.db.EventType.createScope(r))), x[w + wtf.db.EventStruct.TYPE] = u.id | u.flags << 16, e[++l] = x[w + wtf.db.EventStruct.ID], f[l] = u, g[l] = l - 1, p = Math.max(p, l), r = !0, t.genericEnterScope++) : z == b ? (x[w + wtf.db.EventStruct.NEXT_SIBLING] = 0, l && (l--, u *= wtf.db.EventStruct.STRUCT_SIZE, x[u + wtf.db.EventStruct.NEXT_SIBLING] = 
    q, z = x[w + wtf.db.EventStruct.TIME], q = z - x[u + wtf.db.EventStruct.TIME], x[u + wtf.db.EventStruct.END_TIME] = z, g[l] < g[l + 1] && (g[l] = g[l + 1]), x[u + wtf.db.EventStruct.DEPTH] = x[u + wtf.db.EventStruct.DEPTH] & 65535 | g[l + 1] << 16, z = m[l], x[u + wtf.db.EventStruct.CHILD_TIME] = k[l], x[u + wtf.db.EventStruct.SYSTEM_TIME] = z, k[l] = 0, m[l] = 0, l && (k[l - 1] += q, f[l].flags & wtf.data.EventFlag.SYSTEM_TIME && (m[l - 1] += q))), s++) : z == c ? (this.appendScopeData_(f[l], 
    e[l], x[w + wtf.db.EventStruct.ARGUMENTS], !0), s++, r = !0, t.appendScopeData++) : z == d ? (r = this.argumentData_[x[w + wtf.db.EventStruct.ARGUMENTS]], r = r.name || "unnamed.instance", (u = this.eventTypeTable.getByName(r)) || (u = this.eventTypeTable.defineType(wtf.db.EventType.createInstance(r))), x[w + wtf.db.EventStruct.TYPE] = u.id | u.flags << 16, r = !0, t.genericTimeStamp++) : (u = this.eventTypeTable.getById(z), u.eventClass == wtf.data.EventClass.SCOPE && (e[++l] = x[w + wtf.db.EventStruct.ID], 
    f[l] = u, g[l] = l - 1, l > p && (p = l)), u.flags & (wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.BUILTIN) && s++, u.flags & wtf.data.EventFlag.APPEND_SCOPE_DATA && (this.appendScopeData_(f[l], e[l], x[w + wtf.db.EventStruct.ARGUMENTS], !1), s++, r = !0, t.appendScopeData++));
    r && (this.argumentData_[x[w + wtf.db.EventStruct.ARGUMENTS]] = null, x[w + wtf.db.EventStruct.ARGUMENTS] = 0);
    if (1024 <= l) {
      goog.global.console.log("Max scope depth exceeded, aborting!");
      break;
    }
  }
  this.hiddenCount_ = s;
  this.maximumScopeDepth_ = p;
};
wtf.db.EventList.prototype.appendScopeData_ = function(a, b, c, d) {
  if (a) {
    var e = this.eventData, f = b * wtf.db.EventStruct.STRUCT_SIZE, g = e[f + wtf.db.EventStruct.ARGUMENTS];
    b = null;
    g ? b = this.argumentData_[g] : (b = {}, g = this.nextArgumentDataId_++, this.argumentData_[g] = b, e[f + wtf.db.EventStruct.ARGUMENTS] = g);
    if (c = this.argumentData_[c]) {
      d ? b[c.name] = c.value : goog.mixin(b, c), a.mayHaveAppendedArgs = !0;
    }
  } else {
    goog.global.console.log("appendScopeData on root?");
  }
};
wtf.db.EventList.prototype.rebuildAncillaryLists_ = function(a) {
  if (a.length) {
    for (var b = {}, c = 0;c < a.length;c++) {
      for (var d = a[c], e = d.beginRebuild(this.eventTypeTable), f = 0;f < e.length;f++) {
        var g = e[f];
        if (g) {
          var k = b[g.id];
          k || (b[g.id] = k = []);
          k.push({list:d, eventTypeIndex:f, eventType:g});
        }
      }
    }
    d = this.eventData;
    e = new wtf.db.EventIterator(this, 0, this.count - 1, 0);
    for (g = c = 0;c < this.count;c++) {
      if (k = b[d[g + wtf.db.EventStruct.TYPE] & 65535]) {
        for (f = 0;f < k.length;f++) {
          e.seek(c);
          var m = k[f];
          m.list.handleEvent(m.eventTypeIndex, m.eventType, e);
        }
      }
      g += wtf.db.EventStruct.STRUCT_SIZE;
    }
    for (c = 0;c < a.length;c++) {
      d = a[c], d.endRebuild();
    }
  }
};
wtf.db.EventList.prototype.getArgumentData = function(a) {
  return this.argumentData_[a] || null;
};
wtf.db.EventList.prototype.setArgumentData = function(a, b) {
  a || (a = this.nextArgumentDataId_++);
  void 0 === this.originalArgumentData_[a] && (this.originalArgumentData_[a] = this.argumentData_[a] || null);
  this.argumentData_[a] = b;
  return a;
};
wtf.db.EventList.prototype.resetArgumentData = function(a) {
  var b = this.originalArgumentData_[a];
  void 0 !== b && (this.argumentData_[a] = b, delete this.originalArgumentData_[a]);
};
wtf.db.EventList.prototype.dump = function() {
  for (var a = new wtf.db.EventIterator(this, 0, this.count - 1, 0);!a.done();a.next()) {
    for (var b = "", c = a.getDepth();c--;) {
      b += "  ";
    }
    b += wtf.util.formatTime(a.getTime() / 1E3);
    b += " ";
    b += a.getType().getName();
    goog.global.console.log(b);
  }
};
wtf.db.EventList.prototype.begin = function() {
  return new wtf.db.EventIterator(this, 0, this.count - 1, 0);
};
wtf.db.EventList.prototype.beginTimeRange = function(a, b, c) {
  if (!this.count) {
    return new wtf.db.EventIterator(this, 0, -1, 0);
  }
  a = c ? this.getIndexOfRootScopeIncludingTime(a) : this.getIndexOfEventNearTime(a);
  b = this.getIndexOfEventNearTime(b);
  b < a && (b = a);
  return this.beginEventRange(a, b);
};
wtf.db.EventList.prototype.beginEventRange = function(a, b) {
  return new wtf.db.EventIterator(this, a, b, a);
};
wtf.db.EventList.prototype.getIndexOfEventNearTime = function(a) {
  a *= 1E3;
  for (var b = this.eventData, c = 0, d = this.count - 1;c < d;) {
    var e = (c + d) / 2 | 0;
    b[e * wtf.db.EventStruct.STRUCT_SIZE + wtf.db.EventStruct.TIME] < a ? c = e + 1 : d = e;
  }
  return c ? c - 1 : 0;
};
wtf.db.EventList.prototype.getEventNearTime = function(a) {
  a = this.getIndexOfEventNearTime(a);
  return this.getEvent(a);
};
wtf.db.EventList.prototype.getIndexOfRootScopeIncludingTime = function(a) {
  var b = this.getIndexOfEventNearTime(a);
  if (!b) {
    return 0;
  }
  a *= 1E3;
  for (var c = this.eventData, d = b;0 <= d;) {
    for (var e = d * wtf.db.EventStruct.STRUCT_SIZE, f = c[e + wtf.db.EventStruct.DEPTH] & 65535;0 < f--;) {
      e = d * wtf.db.EventStruct.STRUCT_SIZE, d = c[e + wtf.db.EventStruct.PARENT];
    }
    e = d * wtf.db.EventStruct.STRUCT_SIZE;
    if (c[e + wtf.db.EventStruct.END_TIME]) {
      if (c[e + wtf.db.EventStruct.END_TIME] < a) {
        break;
      } else {
        return d;
      }
    }
    d--;
  }
  return b;
};
wtf.db.EventList.prototype.getEvent = function(a) {
  return new wtf.db.EventIterator(this, a, a, a);
};
wtf.db.EventList.prototype.getEventTypeId = function(a) {
  return(a = this.eventTypeTable.getByName(a)) ? a.id : -1;
};
goog.exportSymbol("wtf.db.EventList", wtf.db.EventList);
goog.exportProperty(wtf.db.EventList.prototype, "getCount", wtf.db.EventList.prototype.getCount);
goog.exportProperty(wtf.db.EventList.prototype, "getFirstEventTime", wtf.db.EventList.prototype.getFirstEventTime);
goog.exportProperty(wtf.db.EventList.prototype, "getLastEventTime", wtf.db.EventList.prototype.getLastEventTime);
goog.exportProperty(wtf.db.EventList.prototype, "getTotalEventCount", wtf.db.EventList.prototype.getTotalEventCount);
goog.exportProperty(wtf.db.EventList.prototype, "getMaximumScopeDepth", wtf.db.EventList.prototype.getMaximumScopeDepth);
goog.exportProperty(wtf.db.EventList.prototype, "dump", wtf.db.EventList.prototype.dump);
goog.exportProperty(wtf.db.EventList.prototype, "begin", wtf.db.EventList.prototype.begin);
goog.exportProperty(wtf.db.EventList.prototype, "beginTimeRange", wtf.db.EventList.prototype.beginTimeRange);
goog.exportProperty(wtf.db.EventList.prototype, "beginEventRange", wtf.db.EventList.prototype.beginEventRange);
goog.exportProperty(wtf.db.EventList.prototype, "getIndexOfEventNearTime", wtf.db.EventList.prototype.getIndexOfEventNearTime);
goog.exportProperty(wtf.db.EventList.prototype, "getEventNearTime", wtf.db.EventList.prototype.getEventNearTime);
goog.exportProperty(wtf.db.EventList.prototype, "getIndexOfRootScopeIncludingTime", wtf.db.EventList.prototype.getIndexOfRootScopeIncludingTime);
goog.exportProperty(wtf.db.EventList.prototype, "getEvent", wtf.db.EventList.prototype.getEvent);
// Input 58
wtf.events = {};
wtf.events.EventEmitter = function() {
  goog.Disposable.call(this);
  this.eventTypes_ = {};
};
goog.inherits(wtf.events.EventEmitter, goog.Disposable);
wtf.events.EventEmitter.prototype.disposeInternal = function() {
  this.eventTypes_ = {};
  wtf.events.EventEmitter.superClass_.disposeInternal.call(this);
};
wtf.events.EventEmitter.prototype.addListener = function(a, b, c) {
  var d = this.eventTypes_[a];
  d || (d = new wtf.events.EventListenerList_(a), this.eventTypes_[a] = d);
  d.addListener(b, c);
};
wtf.events.EventEmitter.prototype.addListeners = function(a, b) {
  for (var c in a) {
    this.addListener(c, a[c], b);
  }
};
wtf.events.EventEmitter.prototype.hasListeners = function(a) {
  return!!this.eventTypes_[a];
};
wtf.events.EventEmitter.prototype.removeListener = function(a, b, c) {
  (a = this.eventTypes_[a]) && a.removeListener(b, c);
};
wtf.events.EventEmitter.prototype.listenOnce = function(a, b, c) {
  var d = this, e = function(f) {
    try {
      b.apply(c, arguments);
    } finally {
      d.removeListener(a, e);
    }
  };
  this.addListener(a, e);
};
wtf.events.EventEmitter.prototype.removeAllListeners = function(a) {
  a ? delete this.eventTypes_[a] : this.eventTypes_ = {};
};
wtf.events.EventEmitter.prototype.emitEvent = function(a, b) {
  var c = this.eventTypes_[a];
  if (c) {
    var d = void 0;
    if (1 < arguments.length) {
      for (var d = [], e = 1;e < arguments.length;e++) {
        d.push(arguments[e]);
      }
    }
    c.emitEvent(d);
  }
};
wtf.events.EventListener_ = function(a, b, c) {
  this.eventType_ = a;
  this.callback_ = b;
  this.scope_ = c;
};
wtf.events.EventListenerList_ = function(a) {
  this.eventType_ = a;
  this.listeners_ = [];
};
wtf.events.EventListenerList_.prototype.addListener = function(a, b) {
  this.listeners_.push(new wtf.events.EventListener_(this.eventType_, a, b));
};
wtf.events.EventListenerList_.prototype.removeListener = function(a, b) {
  for (var c = 0;c < this.listeners_.length;c++) {
    var d = this.listeners_[c];
    if (d.callback_ == a && d.scope_ === b) {
      this.listeners_.splice(c, 1);
      break;
    }
  }
};
wtf.events.EventListenerList_.prototype.emitEvent = function(a) {
  for (var b = this.listeners_, c = b.length, d = 0;d < c;d++) {
    var e = b[d];
    e.callback_.apply(e.scope_, a);
  }
};
// Input 59
wtf.events.EventType = {INVALIDATED:goog.events.getUniqueId("invalidated")};
// Input 60
wtf.db.EventIndex = function(a, b) {
  wtf.events.EventEmitter.call(this);
  this.zone_ = a;
  this.eventNames_ = b.slice();
  this.events_ = [];
  this.zone_.getEventList().registerAncillaryList(this);
};
goog.inherits(wtf.db.EventIndex, wtf.events.EventEmitter);
wtf.db.EventIndex.prototype.disposeInternal = function() {
  this.zone_.getEventList().unregisterAncillaryList(this);
  wtf.db.EventIndex.superClass_.disposeInternal.call(this);
};
wtf.db.EventIndex.prototype.getZone = function() {
  return this.zone_;
};
wtf.db.EventIndex.prototype.getEventNames = function() {
  return this.eventNames_;
};
wtf.db.EventIndex.prototype.getCount = function() {
  return this.events_.length;
};
wtf.db.EventIndex.prototype.begin = function() {
  return new wtf.db.EventIterator(this.zone_.getEventList(), 0, this.getCount() - 1, 0, this.events_);
};
wtf.db.EventIndex.prototype.beginRebuild = function(a) {
  this.events_.length = 0;
  for (var b = [], c = 0;c < this.eventNames_.length;c++) {
    b.push(a.getByName(this.eventNames_[c]));
  }
  return b;
};
wtf.db.EventIndex.prototype.handleEvent = function(a, b, c) {
  this.events_.push(c.getId());
};
wtf.db.EventIndex.prototype.endRebuild = function() {
  this.emitEvent(wtf.events.EventType.INVALIDATED);
};
goog.exportProperty(wtf.db.EventIndex.prototype, "getZone", wtf.db.EventIndex.prototype.getZone);
goog.exportProperty(wtf.db.EventIndex.prototype, "getEventNames", wtf.db.EventIndex.prototype.getEventNames);
goog.exportProperty(wtf.db.EventIndex.prototype, "getCount", wtf.db.EventIndex.prototype.getCount);
goog.exportProperty(wtf.db.EventIndex.prototype, "begin", wtf.db.EventIndex.prototype.begin);
// Input 61
wtf.db.FilterParser = function() {
  function a(a) {
    return'"' + a.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\x08/g, "\\b").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\f/g, "\\f").replace(/\r/g, "\\r").replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g, escape) + '"';
  }
  var b = {parse:function(b, d) {
    function e(a) {
      h < I || (h > I && (I = h, S = []), S.push(a));
    }
    function f() {
      var a;
      n++;
      a = O();
      null === a && (a = g());
      n--;
      0 === n && null === a && e("event type expression");
      return a;
    }
    function g() {
      var a, d, f;
      f = h;
      /^[a-zA-Z0-9_.#:$[\]"'\-]/.test(b.charAt(h)) ? (d = b.charAt(h), h++) : (d = null, 0 === n && e("[a-zA-Z0-9_.#:$[\\]\"'\\-]"));
      if (null !== d) {
        for (a = [];null !== d;) {
          a.push(d), /^[a-zA-Z0-9_.#:$[\]"'\-]/.test(b.charAt(h)) ? (d = b.charAt(h), h++) : (d = null, 0 === n && e("[a-zA-Z0-9_.#:$[\\]\"'\\-]"));
        }
      } else {
        a = null;
      }
      null !== a && (a = {type:"substring", value:a.join("")});
      null === a && (h = f);
      return a;
    }
    function k() {
      var a, d, f, g, k, l, q;
      n++;
      q = l = h;
      40 === b.charCodeAt(h) ? (a = "(", h++) : (a = null, 0 === n && e('"("'));
      null !== a ? (d = y(), null !== d ? (f = m(), f = null !== f ? f : "", null !== f ? (g = y(), null !== g ? (41 === b.charCodeAt(h) ? (k = ")", h++) : (k = null, 0 === n && e('")"')), null !== k ? a = [a, d, f, g, k] : (a = null, h = q)) : (a = null, h = q)) : (a = null, h = q)) : (a = null, h = q)) : (a = null, h = q);
      null !== a && (a = "" !== a[2] ? a[2] : []);
      null === a && (h = l);
      n--;
      0 === n && null === a && e("a");
      return a;
    }
    function m() {
      var a, d, f, g, k, m, q, A, t;
      n++;
      A = q = h;
      a = l();
      if (null !== a) {
        d = [];
        t = h;
        f = y();
        null !== f ? (44 === b.charCodeAt(h) ? (g = ",", h++) : (g = null, 0 === n && e('","')), null !== g ? (k = y(), null !== k ? (m = l(), null !== m ? f = [f, g, k, m] : (f = null, h = t)) : (f = null, h = t)) : (f = null, h = t)) : (f = null, h = t);
        for (;null !== f;) {
          d.push(f), t = h, f = y(), null !== f ? (44 === b.charCodeAt(h) ? (g = ",", h++) : (g = null, 0 === n && e('","')), null !== g ? (k = y(), null !== k ? (m = l(), null !== m ? f = [f, g, k, m] : (f = null, h = t)) : (f = null, h = t)) : (f = null, h = t)) : (f = null, h = t);
        }
        null !== d ? a = [a, d] : (a = null, h = A);
      } else {
        a = null, h = A;
      }
      if (null !== a) {
        for (d = a[1], a = [a[0]], f = 0;f < d.length;f++) {
          a.push(d[f][3]);
        }
      }
      null === a && (h = q);
      n--;
      0 === n && null === a && e("arguments");
      return a;
    }
    function l() {
      var a, b;
      n++;
      a = p();
      null === a && (b = h, a = s(), null !== a && (a = {lhs:a.lhs, op:a.op, rhs:a.rhs}), null === a && (h = b));
      n--;
      0 === n && null === a && e("binary expression");
      return a;
    }
    function p() {
      var a, b, c, d, f, g, k;
      n++;
      k = g = h;
      a = v();
      null !== a ? (b = y(), null !== b ? (c = t(), null !== c ? (d = y(), null !== d ? (f = v(), null !== f ? a = [a, b, c, d, f] : (a = null, h = k)) : (a = null, h = k)) : (a = null, h = k)) : (a = null, h = k)) : (a = null, h = k);
      null !== a && (a = {lhs:a[0], op:a[2], rhs:a[4]});
      null === a && (h = g);
      n--;
      0 === n && null === a && e("comparison expression");
      return a;
    }
    function s() {
      var a, b, c, d, f, g, k;
      n++;
      k = g = h;
      a = v();
      null !== a ? (b = y(), null !== b ? (c = x(), null !== c ? (d = y(), null !== d ? (f = O(), null !== f ? a = [a, b, c, d, f] : (a = null, h = k)) : (a = null, h = k)) : (a = null, h = k)) : (a = null, h = k)) : (a = null, h = k);
      null !== a && (a = {lhs:a[0], op:a[2], rhs:a[4]});
      null === a && (h = g);
      n--;
      0 === n && null === a && e("regular expression");
      return a;
    }
    function t() {
      var a;
      n++;
      "==" === b.substr(h, 2) ? (a = "==", h += 2) : (a = null, 0 === n && e('"=="'));
      null === a && ("!=" === b.substr(h, 2) ? (a = "!=", h += 2) : (a = null, 0 === n && e('"!="')), null === a && ("<=" === b.substr(h, 2) ? (a = "<=", h += 2) : (a = null, 0 === n && e('"<="')), null === a && (">=" === b.substr(h, 2) ? (a = ">=", h += 2) : (a = null, 0 === n && e('">="')), null === a && (60 === b.charCodeAt(h) ? (a = "<", h++) : (a = null, 0 === n && e('"<"')), null === a && (62 === b.charCodeAt(h) ? (a = ">", h++) : (a = null, 0 === n && e('">"')), null === a && ("in" === b.substr(h, 
      2) ? (a = "in", h += 2) : (a = null, 0 === n && e('"in"'))))))));
      n--;
      0 === n && null === a && e("operator");
      return a;
    }
    function x() {
      var a;
      n++;
      "=~" === b.substr(h, 2) ? (a = "=~", h += 2) : (a = null, 0 === n && e('"=~"'));
      null === a && ("!~" === b.substr(h, 2) ? (a = "!~", h += 2) : (a = null, 0 === n && e('"!~"')));
      n--;
      0 === n && null === a && e("regex operator");
      return a;
    }
    function v() {
      var a, d, f, g;
      n++;
      f = h;
      a = E();
      null !== a && (a = {type:"string", value:a});
      null === a && (h = f);
      null === a && (f = h, a = A(), null !== a && (a = {type:"number", value:a}), null === a && (h = f), null === a && (f = h, a = u(), null !== a && (a = {type:"object", value:a}), null === a && (h = f), null === a && (f = h, a = r(), null !== a && (a = {type:"array", value:a}), null === a && (h = f), null === a && (g = f = h, "true" === b.substr(h, 4) ? (a = "true", h += 4) : (a = null, 0 === n && e('"true"')), null !== a ? (d = y(), null !== d ? a = [a, d] : (a = null, h = g)) : (a = null, h = 
      g), null !== a && (a = {type:"boolean", value:!0}), null === a && (h = f), null === a && (g = f = h, "false" === b.substr(h, 5) ? (a = "false", h += 5) : (a = null, 0 === n && e('"false"')), null !== a ? (d = y(), null !== d ? a = [a, d] : (a = null, h = g)) : (a = null, h = g), null !== a && (a = {type:"boolean", value:!1}), null === a && (h = f), null === a && (g = f = h, "null" === b.substr(h, 4) ? (a = "null", h += 4) : (a = null, 0 === n && e('"null"')), null !== a ? (d = y(), null !== 
      d ? a = [a, d] : (a = null, h = g)) : (a = null, h = g), null !== a && (a = {type:"null", value:null}), null === a && (h = f), null === a && (f = h, a = w(), null !== a && (a = {type:"reference", value:a}), null === a && (h = f), null === a && (f = h, a = O(), null !== a && (a = {type:"regex", value:a}), null === a && (h = f)))))))));
      n--;
      0 === n && null === a && e("value");
      return a;
    }
    function w() {
      var a, d, f, g, k, l, m, q, t, A, B, p;
      n++;
      A = t = h;
      a = P();
      if (null !== a) {
        d = [];
        p = B = h;
        f = y();
        null !== f ? (91 === b.charCodeAt(h) ? (g = "[", h++) : (g = null, 0 === n && e('"["')), null !== g ? (k = y(), null !== k ? (l = C(), null !== l ? (m = y(), null !== m ? (93 === b.charCodeAt(h) ? (q = "]", h++) : (q = null, 0 === n && e('"]"')), null !== q ? f = [f, g, k, l, m, q] : (f = null, h = p)) : (f = null, h = p)) : (f = null, h = p)) : (f = null, h = p)) : (f = null, h = p)) : (f = null, h = p);
        null !== f && (f = f[3]);
        null === f && (h = B);
        null === f && (p = B = h, f = y(), null !== f ? (46 === b.charCodeAt(h) ? (g = ".", h++) : (g = null, 0 === n && e('"."')), null !== g ? (k = y(), null !== k ? (l = P(), null !== l ? f = [f, g, k, l] : (f = null, h = p)) : (f = null, h = p)) : (f = null, h = p)) : (f = null, h = p), null !== f && (f = f[3]), null === f && (h = B));
        for (;null !== f;) {
          d.push(f), p = B = h, f = y(), null !== f ? (91 === b.charCodeAt(h) ? (g = "[", h++) : (g = null, 0 === n && e('"["')), null !== g ? (k = y(), null !== k ? (l = C(), null !== l ? (m = y(), null !== m ? (93 === b.charCodeAt(h) ? (q = "]", h++) : (q = null, 0 === n && e('"]"')), null !== q ? f = [f, g, k, l, m, q] : (f = null, h = p)) : (f = null, h = p)) : (f = null, h = p)) : (f = null, h = p)) : (f = null, h = p)) : (f = null, h = p), null !== f && (f = f[3]), null === f && (h = B), null === 
          f && (p = B = h, f = y(), null !== f ? (46 === b.charCodeAt(h) ? (g = ".", h++) : (g = null, 0 === n && e('"."')), null !== g ? (k = y(), null !== k ? (l = P(), null !== l ? f = [f, g, k, l] : (f = null, h = p)) : (f = null, h = p)) : (f = null, h = p)) : (f = null, h = p), null !== f && (f = f[3]), null === f && (h = B));
        }
        null !== d ? a = [a, d] : (a = null, h = A);
      } else {
        a = null, h = A;
      }
      if (null !== a) {
        for (d = a[1], a = a[0], f = 0;f < d.length;f++) {
          a = {type:"access", base:a, name:d[f]};
        }
      }
      null === a && (h = t);
      n--;
      0 === n && null === a && e("reference");
      return a;
    }
    function u() {
      var a, d, f, g, k, l, m;
      n++;
      m = l = h;
      123 === b.charCodeAt(h) ? (a = "{", h++) : (a = null, 0 === n && e('"{"'));
      null !== a ? (d = y(), null !== d ? (125 === b.charCodeAt(h) ? (f = "}", h++) : (f = null, 0 === n && e('"}"')), null !== f ? (g = y(), null !== g ? a = [a, d, f, g] : (a = null, h = m)) : (a = null, h = m)) : (a = null, h = m)) : (a = null, h = m);
      null !== a && (a = {});
      null === a && (h = l);
      null === a && (m = l = h, 123 === b.charCodeAt(h) ? (a = "{", h++) : (a = null, 0 === n && e('"{"')), null !== a ? (d = y(), null !== d ? (f = q(), null !== f ? (125 === b.charCodeAt(h) ? (g = "}", h++) : (g = null, 0 === n && e('"}"')), null !== g ? (k = y(), null !== k ? a = [a, d, f, g, k] : (a = null, h = m)) : (a = null, h = m)) : (a = null, h = m)) : (a = null, h = m)) : (a = null, h = m), null !== a && (a = a[2]), null === a && (h = l));
      n--;
      0 === n && null === a && e("object");
      return a;
    }
    function q() {
      var a, d, f, g, k, l, m, q;
      m = l = h;
      a = z();
      if (null !== a) {
        d = [];
        q = h;
        44 === b.charCodeAt(h) ? (f = ",", h++) : (f = null, 0 === n && e('","'));
        null !== f ? (g = y(), null !== g ? (k = z(), null !== k ? f = [f, g, k] : (f = null, h = q)) : (f = null, h = q)) : (f = null, h = q);
        for (;null !== f;) {
          d.push(f), q = h, 44 === b.charCodeAt(h) ? (f = ",", h++) : (f = null, 0 === n && e('","')), null !== f ? (g = y(), null !== g ? (k = z(), null !== k ? f = [f, g, k] : (f = null, h = q)) : (f = null, h = q)) : (f = null, h = q);
        }
        null !== d ? a = [a, d] : (a = null, h = m);
      } else {
        a = null, h = m;
      }
      if (null !== a) {
        d = a[0];
        a = a[1];
        f = {};
        f[d[0]] = d[1];
        for (d = 0;d < a.length;d++) {
          f[a[d][2][0]] = a[d][2][1];
        }
        a = f;
      }
      null === a && (h = l);
      return a;
    }
    function z() {
      var a, d, f, g, k, l;
      l = k = h;
      a = E();
      null !== a ? (58 === b.charCodeAt(h) ? (d = ":", h++) : (d = null, 0 === n && e('":"')), null !== d ? (f = y(), null !== f ? (g = C(), null !== g ? a = [a, d, f, g] : (a = null, h = l)) : (a = null, h = l)) : (a = null, h = l)) : (a = null, h = l);
      null !== a && (a = [a[0], a[3]]);
      null === a && (h = k);
      return a;
    }
    function r() {
      var a, d, f, g, k, l, m;
      n++;
      m = l = h;
      91 === b.charCodeAt(h) ? (a = "[", h++) : (a = null, 0 === n && e('"["'));
      null !== a ? (d = y(), null !== d ? (93 === b.charCodeAt(h) ? (f = "]", h++) : (f = null, 0 === n && e('"]"')), null !== f ? (g = y(), null !== g ? a = [a, d, f, g] : (a = null, h = m)) : (a = null, h = m)) : (a = null, h = m)) : (a = null, h = m);
      null !== a && (a = []);
      null === a && (h = l);
      null === a && (m = l = h, 91 === b.charCodeAt(h) ? (a = "[", h++) : (a = null, 0 === n && e('"["')), null !== a ? (d = y(), null !== d ? (f = J(), null !== f ? (93 === b.charCodeAt(h) ? (g = "]", h++) : (g = null, 0 === n && e('"]"')), null !== g ? (k = y(), null !== k ? a = [a, d, f, g, k] : (a = null, h = m)) : (a = null, h = m)) : (a = null, h = m)) : (a = null, h = m)) : (a = null, h = m), null !== a && (a = a[2]), null === a && (h = l));
      n--;
      0 === n && null === a && e("array");
      return a;
    }
    function J() {
      var a, d, f, g, k, l, m, q;
      m = l = h;
      a = C();
      if (null !== a) {
        d = [];
        q = h;
        44 === b.charCodeAt(h) ? (f = ",", h++) : (f = null, 0 === n && e('","'));
        null !== f ? (g = y(), null !== g ? (k = C(), null !== k ? f = [f, g, k] : (f = null, h = q)) : (f = null, h = q)) : (f = null, h = q);
        for (;null !== f;) {
          d.push(f), q = h, 44 === b.charCodeAt(h) ? (f = ",", h++) : (f = null, 0 === n && e('","')), null !== f ? (g = y(), null !== g ? (k = C(), null !== k ? f = [f, g, k] : (f = null, h = q)) : (f = null, h = q)) : (f = null, h = q);
        }
        null !== d ? a = [a, d] : (a = null, h = m);
      } else {
        a = null, h = m;
      }
      if (null !== a) {
        for (d = a[1], a = [a[0]], f = 0;f < d.length;f++) {
          a.push(d[f][2]);
        }
      }
      null === a && (h = l);
      return a;
    }
    function C() {
      var a, d, f, g;
      n++;
      a = E();
      null === a && (a = A(), null === a && (a = u(), null === a && (a = r(), null === a && (g = f = h, "true" === b.substr(h, 4) ? (a = "true", h += 4) : (a = null, 0 === n && e('"true"')), null !== a ? (d = y(), null !== d ? a = [a, d] : (a = null, h = g)) : (a = null, h = g), null !== a && (a = !0), null === a && (h = f), null === a && (g = f = h, "false" === b.substr(h, 5) ? (a = "false", h += 5) : (a = null, 0 === n && e('"false"')), null !== a ? (d = y(), null !== d ? a = [a, d] : (a = null, 
      h = g)) : (a = null, h = g), null !== a && (a = !1), null === a && (h = f), null === a && (g = f = h, "null" === b.substr(h, 4) ? (a = "null", h += 4) : (a = null, 0 === n && e('"null"')), null !== a ? (d = y(), null !== d ? a = [a, d] : (a = null, h = g)) : (a = null, h = g), null !== a && (a = "null"), null === a && (h = f)))))));
      n--;
      0 === n && null === a && e("value");
      return a;
    }
    function E() {
      var a, d, f, g, k, l;
      n++;
      l = k = h;
      34 === b.charCodeAt(h) ? (a = '"', h++) : (a = null, 0 === n && e('"\\""'));
      null !== a ? (34 === b.charCodeAt(h) ? (d = '"', h++) : (d = null, 0 === n && e('"\\""')), null !== d ? (f = y(), null !== f ? a = [a, d, f] : (a = null, h = l)) : (a = null, h = l)) : (a = null, h = l);
      null !== a && (a = "");
      null === a && (h = k);
      null === a && (l = k = h, 34 === b.charCodeAt(h) ? (a = '"', h++) : (a = null, 0 === n && e('"\\""')), null !== a ? (d = Q(), null !== d ? (34 === b.charCodeAt(h) ? (f = '"', h++) : (f = null, 0 === n && e('"\\""')), null !== f ? (g = y(), null !== g ? a = [a, d, f, g] : (a = null, h = l)) : (a = null, h = l)) : (a = null, h = l)) : (a = null, h = l), null !== a && (a = a[1]), null === a && (h = k));
      n--;
      0 === n && null === a && e("string");
      return a;
    }
    function Q() {
      var a, b, c;
      c = h;
      b = F();
      if (null !== b) {
        for (a = [];null !== b;) {
          a.push(b), b = F();
        }
      } else {
        a = null;
      }
      null !== a && (a = a.join(""));
      null === a && (h = c);
      return a;
    }
    function F() {
      var a, d, f, g, k, l, m, q;
      /^[^"\\\0-\x1F\u007f]/.test(b.charAt(h)) ? (a = b.charAt(h), h++) : (a = null, 0 === n && e('[^"\\\\\\0-\\x1F\u007f]'));
      null === a && (l = h, '\\"' === b.substr(h, 2) ? (a = '\\"', h += 2) : (a = null, 0 === n && e('"\\\\\\""')), null !== a && (a = '"'), null === a && (h = l), null === a && (l = h, "\\\\" === b.substr(h, 2) ? (a = "\\\\", h += 2) : (a = null, 0 === n && e('"\\\\\\\\"')), null !== a && (a = "\\"), null === a && (h = l), null === a && (l = h, "\\/" === b.substr(h, 2) ? (a = "\\/", h += 2) : (a = null, 0 === n && e('"\\\\/"')), null !== a && (a = "/"), null === a && (h = l), null === a && (l = 
      h, "\\b" === b.substr(h, 2) ? (a = "\\b", h += 2) : (a = null, 0 === n && e('"\\\\b"')), null !== a && (a = "\b"), null === a && (h = l), null === a && (l = h, "\\f" === b.substr(h, 2) ? (a = "\\f", h += 2) : (a = null, 0 === n && e('"\\\\f"')), null !== a && (a = "\f"), null === a && (h = l), null === a && (l = h, "\\n" === b.substr(h, 2) ? (a = "\\n", h += 2) : (a = null, 0 === n && e('"\\\\n"')), null !== a && (a = "\n"), null === a && (h = l), null === a && (l = h, "\\r" === b.substr(h, 
      2) ? (a = "\\r", h += 2) : (a = null, 0 === n && e('"\\\\r"')), null !== a && (a = "\r"), null === a && (h = l), null === a && (l = h, "\\t" === b.substr(h, 2) ? (a = "\\t", h += 2) : (a = null, 0 === n && e('"\\\\t"')), null !== a && (a = "\t"), null === a && (h = l), null === a && (m = l = h, "\\u" === b.substr(h, 2) ? (a = "\\u", h += 2) : (a = null, 0 === n && e('"\\\\u"')), null !== a ? (q = h, d = K(), null !== d ? (f = K(), null !== f ? (g = K(), null !== g ? (k = K(), null !== k ? d = 
      [d, f, g, k] : (d = null, h = q)) : (d = null, h = q)) : (d = null, h = q)) : (d = null, h = q), null !== d ? a = [a, d] : (a = null, h = m)) : (a = null, h = m), null !== a && (a = String.fromCharCode(parseInt("0x" + a[1], 16))), null === a && (h = l))))))))));
      return a;
    }
    function A() {
      var a, b, c, d;
      n++;
      d = c = h;
      a = T();
      null !== a ? (b = ba(), null !== b ? a = [a, b] : (a = null, h = d)) : (a = null, h = d);
      null !== a && (a = a[0] * a[1]);
      null === a && (h = c);
      null === a && (a = T());
      n--;
      0 === n && null === a && e("number");
      return a;
    }
    function T() {
      var a, b, c, d, f, g;
      n++;
      f = d = h;
      a = B();
      null !== a ? (b = y(), null !== b ? a = [a, b] : (a = null, h = f)) : (a = null, h = f);
      null !== a && (a = parseInt(a[0], 16));
      null === a && (h = d);
      null === a && (g = f = d = h, a = L(), null !== a ? (b = U(), null !== b ? (c = V(), null !== c ? a = [a, b, c] : (a = null, h = g)) : (a = null, h = g)) : (a = null, h = g), null !== a ? (b = y(), null !== b ? a = [a, b] : (a = null, h = f)) : (a = null, h = f), null !== a && (a = parseFloat(a[0].join(""))), null === a && (h = d), null === a && (g = f = d = h, a = L(), null !== a ? (b = U(), null !== b ? a = [a, b] : (a = null, h = g)) : (a = null, h = g), null !== a ? (b = y(), null !== b ? 
      a = [a, b] : (a = null, h = f)) : (a = null, h = f), null !== a && (a = parseFloat(a[0].join(""))), null === a && (h = d), null === a && (g = f = d = h, a = L(), null !== a ? (b = V(), null !== b ? a = [a, b] : (a = null, h = g)) : (a = null, h = g), null !== a ? (b = y(), null !== b ? a = [a, b] : (a = null, h = f)) : (a = null, h = f), null !== a && (a = parseFloat(a[0].join(""))), null === a && (h = d), null === a && (f = d = h, a = L(), null !== a ? (b = y(), null !== b ? a = [a, b] : (a = 
      null, h = f)) : (a = null, h = f), null !== a && (a = parseFloat(a[0])), null === a && (h = d)))));
      n--;
      0 === n && null === a && e("number");
      return a;
    }
    function L() {
      var a, d, f, g, k;
      k = g = h;
      a = W();
      null !== a ? (d = G(), null !== d ? a = [a, d] : (a = null, h = k)) : (a = null, h = k);
      null !== a && (a = a[0] + a[1]);
      null === a && (h = g);
      null === a && (g = h, a = H(), null === a && (h = g), null === a && (k = g = h, 45 === b.charCodeAt(h) ? (a = "-", h++) : (a = null, 0 === n && e('"-"')), null !== a ? (d = W(), null !== d ? (f = G(), null !== f ? a = [a, d, f] : (a = null, h = k)) : (a = null, h = k)) : (a = null, h = k), null !== a && (a = "-" + a[1] + a[2]), null === a && (h = g), null === a && (k = g = h, 45 === b.charCodeAt(h) ? (a = "-", h++) : (a = null, 0 === n && e('"-"')), null !== a ? (d = H(), null !== d ? a = [a, 
      d] : (a = null, h = k)) : (a = null, h = k), null !== a && (a = "-" + a[1]), null === a && (h = g))));
      return a;
    }
    function B() {
      var a, d, f, g;
      g = f = h;
      "0x" === b.substr(h, 2) ? (a = "0x", h += 2) : (a = null, 0 === n && e('"0x"'));
      null !== a ? (d = G(), null !== d ? a = [a, d] : (a = null, h = g)) : (a = null, h = g);
      null !== a && (a = "0x" + a[1]);
      null === a && (h = f);
      return a;
    }
    function U() {
      var a, d, f, g;
      g = f = h;
      46 === b.charCodeAt(h) ? (a = ".", h++) : (a = null, 0 === n && e('"."'));
      null !== a ? (d = G(), null !== d ? a = [a, d] : (a = null, h = g)) : (a = null, h = g);
      null !== a && (a = "." + a[1]);
      null === a && (h = f);
      return a;
    }
    function V() {
      var a, b, c, d;
      d = c = h;
      a = ca();
      null !== a ? (b = G(), null !== b ? a = [a, b] : (a = null, h = d)) : (a = null, h = d);
      null !== a && (a = "e" + a[1]);
      null === a && (h = c);
      return a;
    }
    function G() {
      var a, b, c;
      c = h;
      b = H();
      if (null !== b) {
        for (a = [];null !== b;) {
          a.push(b), b = H();
        }
      } else {
        a = null;
      }
      null !== a && (a = a.join(""));
      null === a && (h = c);
      return a;
    }
    function ca() {
      var a, d, f;
      f = h;
      /^[eE]/.test(b.charAt(h)) ? (a = b.charAt(h), h++) : (a = null, 0 === n && e("[eE]"));
      null !== a ? (/^[+\-]/.test(b.charAt(h)) ? (d = b.charAt(h), h++) : (d = null, 0 === n && e("[+\\-]")), d = null !== d ? d : "", null !== d ? a = [a, d] : (a = null, h = f)) : (a = null, h = f);
      return a;
    }
    function H() {
      var a;
      /^[0-9]/.test(b.charAt(h)) ? (a = b.charAt(h), h++) : (a = null, 0 === n && e("[0-9]"));
      return a;
    }
    function W() {
      var a;
      /^[1-9]/.test(b.charAt(h)) ? (a = b.charAt(h), h++) : (a = null, 0 === n && e("[1-9]"));
      return a;
    }
    function K() {
      var a;
      /^[0-9a-fA-F]/.test(b.charAt(h)) ? (a = b.charAt(h), h++) : (a = null, 0 === n && e("[0-9a-fA-F]"));
      return a;
    }
    function ba() {
      var a, d;
      d = h;
      "ms" === b.substr(h, 2) ? (a = "ms", h += 2) : (a = null, 0 === n && e('"ms"'));
      null !== a && (a = 1);
      null === a && (h = d);
      null === a && (d = h, 115 === b.charCodeAt(h) ? (a = "s", h++) : (a = null, 0 === n && e('"s"')), null !== a && (a = 1E3), null === a && (h = d), null === a && (d = h, "us" === b.substr(h, 2) ? (a = "us", h += 2) : (a = null, 0 === n && e('"us"')), null !== a && (a = 0.001), null === a && (h = d)));
      return a;
    }
    function X() {
      var a;
      n++;
      /^[ \t\n\r]/.test(b.charAt(h)) ? (a = b.charAt(h), h++) : (a = null, 0 === n && e("[ \\t\\n\\r]"));
      n--;
      0 === n && null === a && e("whitespace");
      return a;
    }
    function y() {
      var a, b;
      a = [];
      for (b = X();null !== b;) {
        a.push(b), b = X();
      }
      return a;
    }
    function P() {
      var a, b;
      n++;
      b = h;
      a = da();
      null === a && (h = b);
      n--;
      0 === n && null === a && e("identifier");
      return a;
    }
    function da() {
      var a, b, c, d, f;
      n++;
      f = d = h;
      a = Y();
      if (null !== a) {
        b = [];
        for (c = M();null !== c;) {
          b.push(c), c = M();
        }
        null !== b ? a = [a, b] : (a = null, h = f);
      } else {
        a = null, h = f;
      }
      null !== a && (a = a[0] + a[1].join(""));
      null === a && (h = d);
      n--;
      0 === n && null === a && e("identifier");
      return a;
    }
    function Y() {
      var a;
      /^[a-zA-Z]/.test(b.charAt(h)) ? (a = b.charAt(h), h++) : (a = null, 0 === n && e("[a-zA-Z]"));
      null === a && (36 === b.charCodeAt(h) ? (a = "$", h++) : (a = null, 0 === n && e('"$"')), null === a && (95 === b.charCodeAt(h) ? (a = "_", h++) : (a = null, 0 === n && e('"_"')), null === a && (64 === b.charCodeAt(h) ? (a = "@", h++) : (a = null, 0 === n && e('"@"')))));
      return a;
    }
    function M() {
      var a, d;
      a = Y();
      null === a && (a = H(), null === a && (a = ea(), null === a && (d = h, 8204 === b.charCodeAt(h) ? (a = "\u200c", h++) : (a = null, 0 === n && e('"\\u200C"')), null !== a && (a = "\u200c"), null === a && (h = d), null === a && (d = h, 8205 === b.charCodeAt(h) ? (a = "\u200d", h++) : (a = null, 0 === n && e('"\\u200D"')), null !== a && (a = "\u200d"), null === a && (h = d)))));
      return a;
    }
    function ea() {
      var a;
      /^[_\u203F\u2040\u2054\uFE33\uFE34\uFE4D\uFE4E\uFE4F\uFF3F]/.test(b.charAt(h)) ? (a = b.charAt(h), h++) : (a = null, 0 === n && e("[_\\u203F\\u2040\\u2054\\uFE33\\uFE34\\uFE4D\\uFE4E\\uFE4F\\uFF3F]"));
      return a;
    }
    function O() {
      var a, d, f, g, k, l;
      n++;
      l = k = h;
      47 === b.charCodeAt(h) ? (a = "/", h++) : (a = null, 0 === n && e('"/"'));
      null !== a ? (d = fa(), null !== d ? (47 === b.charCodeAt(h) ? (f = "/", h++) : (f = null, 0 === n && e('"/"')), null !== f ? (g = ga(), null !== g ? a = [a, d, f, g] : (a = null, h = l)) : (a = null, h = l)) : (a = null, h = l)) : (a = null, h = l);
      null !== a && (a = {type:"regex", value:a[1], flags:a[3]});
      null === a && (h = k);
      n--;
      0 === n && null === a && e("regular expression");
      return a;
    }
    function fa() {
      var a, b, c, d;
      d = c = h;
      a = ha();
      null !== a ? (b = ia(), null !== b ? a = [a, b] : (a = null, h = d)) : (a = null, h = d);
      null !== a && (a = a[0] + a[1]);
      null === a && (h = c);
      return a;
    }
    function ia() {
      var a, b, c;
      c = h;
      a = [];
      for (b = Z();null !== b;) {
        a.push(b), b = Z();
      }
      null !== a && (a = a.join(""));
      null === a && (h = c);
      return a;
    }
    function ha() {
      var a, d, f, g;
      d = g = f = h;
      n++;
      /^[*\\\/[]/.test(b.charAt(h)) ? (a = b.charAt(h), h++) : (a = null, 0 === n && e("[*\\\\\\/[]"));
      n--;
      null === a ? a = "" : (a = null, h = d);
      null !== a ? (d = N(), null !== d ? a = [a, d] : (a = null, h = g)) : (a = null, h = g);
      null !== a && (a = a[1]);
      null === a && (h = f);
      null === a && (a = R(), null === a && (a = $()));
      return a;
    }
    function Z() {
      var a, d, f, g;
      d = g = f = h;
      n++;
      /^[\\\/[]/.test(b.charAt(h)) ? (a = b.charAt(h), h++) : (a = null, 0 === n && e("[\\\\\\/[]"));
      n--;
      null === a ? a = "" : (a = null, h = d);
      null !== a ? (d = N(), null !== d ? a = [a, d] : (a = null, h = g)) : (a = null, h = g);
      null !== a && (a = a[1]);
      null === a && (h = f);
      null === a && (a = R(), null === a && (a = $()));
      return a;
    }
    function R() {
      var a, d, f, g;
      g = f = h;
      92 === b.charCodeAt(h) ? (a = "\\", h++) : (a = null, 0 === n && e('"\\\\"'));
      null !== a ? (d = N(), null !== d ? a = [a, d] : (a = null, h = g)) : (a = null, h = g);
      null !== a && (a = "\\" + a[1]);
      null === a && (h = f);
      return a;
    }
    function N() {
      var a, d;
      d = h;
      b.length > h ? (a = b.charAt(h), h++) : (a = null, 0 === n && e("any character"));
      null === a && (h = d);
      return a;
    }
    function $() {
      var a, d, f, g, k;
      k = g = h;
      91 === b.charCodeAt(h) ? (a = "[", h++) : (a = null, 0 === n && e('"["'));
      null !== a ? (d = ja(), null !== d ? (93 === b.charCodeAt(h) ? (f = "]", h++) : (f = null, 0 === n && e('"]"')), null !== f ? a = [a, d, f] : (a = null, h = k)) : (a = null, h = k)) : (a = null, h = k);
      null !== a && (a = "[" + a[1] + "]");
      null === a && (h = g);
      return a;
    }
    function ja() {
      var a, b, c;
      c = h;
      a = [];
      for (b = aa();null !== b;) {
        a.push(b), b = aa();
      }
      null !== a && (a = a.join(""));
      null === a && (h = c);
      return a;
    }
    function aa() {
      var a, d, f, g;
      d = g = f = h;
      n++;
      /^[\]\\]/.test(b.charAt(h)) ? (a = b.charAt(h), h++) : (a = null, 0 === n && e("[\\]\\\\]"));
      n--;
      null === a ? a = "" : (a = null, h = d);
      null !== a ? (d = N(), null !== d ? a = [a, d] : (a = null, h = g)) : (a = null, h = g);
      null !== a && (a = a[1]);
      null === a && (h = f);
      null === a && (a = R());
      return a;
    }
    function ga() {
      var a, b, c;
      c = h;
      a = [];
      for (b = M();null !== b;) {
        a.push(b), b = M();
      }
      null !== a && (a = a.join(""));
      null === a && (h = c);
      return a;
    }
    function la(a) {
      a.sort();
      for (var b = null, c = [], d = 0;d < a.length;d++) {
        a[d] !== b && (c.push(a[d]), b = a[d]);
      }
      return c;
    }
    function ma() {
      for (var a = 1, d = 1, e = !1, f = 0;f < Math.max(h, I);f++) {
        var g = b.charAt(f);
        "\n" === g ? (e || a++, d = 1, e = !1) : "\r" === g || "\u2028" === g || "\u2029" === g ? (a++, d = 1, e = !0) : (d++, e = !1);
      }
      return{line:a, column:d};
    }
    var D = {FilterStatement:function() {
      var a, b, c, d, g;
      n++;
      g = d = h;
      a = f();
      null !== a ? (b = y(), null !== b ? (c = k(), null !== c ? a = [a, b, c] : (a = null, h = g)) : (a = null, h = g)) : (a = null, h = g);
      null !== a && (a = {type_query:a[0], arg_query:a[2]});
      null === a && (h = d);
      null === a && (d = h, a = f(), null !== a && (a = {type_query:a, arg_query:null}), null === a && (h = d), null === a && (d = h, a = k(), null !== a && (a = {type_query:null, arg_query:a}), null === a && (h = d)));
      n--;
      0 === n && null === a && e("filter statement");
      return a;
    }, EventTypeExpression:f, SubstringEventTypeLiteral:g, Arguments:k, ArgumentList:m, BinaryExpression:l, ComparativeExpression:p, RegularExpression:s, Operator:t, RegexOperator:x, ExpressionValue:v, VariableReference:w, Object:u, ObjectMembers:q, Pair:z, Array:r, Elements:J, Value:C, String:E, Chars:Q, Char:F, AdjustedNumber:A, Number:T, Int:L, HexInt:B, Frac:U, Exp:V, Digits:G, E:ca, Digit:H, Digit19:W, HexDigit:K, TimeUnit:ba, WhiteSpace:X, _:y, Identifier:P, IdentifierName:da, IdentifierStart:Y, 
    IdentifierPart:M, UnicodeConnectorPunctuation:ea, RegularExpressionLiteral:O, RegularExpressionBody:fa, RegularExpressionChars:ia, RegularExpressionFirstChar:ha, RegularExpressionChar:Z, RegularExpressionBackslashSequence:R, RegularExpressionNonTerminator:N, RegularExpressionClass:$, RegularExpressionClassChars:ja, RegularExpressionClassChar:aa, RegularExpressionFlags:ga};
    if (void 0 !== d) {
      if (void 0 === D[d]) {
        throw Error("Invalid rule name: " + a(d) + ".");
      }
    } else {
      d = "FilterStatement";
    }
    var h = 0, n = 0, I = 0, S = [], D = D[d]();
    if (null === D || h !== b.length) {
      var D = Math.max(h, I), na = D < b.length ? b.charAt(D) : null, ka = ma();
      throw new this.SyntaxError(la(S), na, D, ka.line, ka.column);
    }
    return D;
  }, SyntaxError:function(b, d, e, f, g) {
    this.name = "SyntaxError";
    this.expected = b;
    this.found = d;
    switch(b.length) {
      case 0:
        b = "end of input";
        break;
      case 1:
        b = b[0];
        break;
      default:
        b = b.slice(0, b.length - 1).join(", ") + " or " + b[b.length - 1];
    }
    d = d ? a(d) : "end of input";
    this.message = "Expected " + b + " but " + d + " found.";
    this.offset = e;
    this.line = f;
    this.column = g;
  }};
  b.SyntaxError.prototype = Error.prototype;
  return b;
}();
// Input 62
wtf.db.FilterResult = {UPDATED:0, FAILED:1, NO_CHANGE:2};
wtf.db.Filter = function(a) {
  this.sourceString_ = "";
  this.argumentFilter_ = this.eventTypeFilter_ = this.parseError_ = this.expressionTree_ = null;
  a && this.setFromString(a);
};
wtf.db.Filter.prototype.getEventTypeFilter = function() {
  return this.eventTypeFilter_;
};
wtf.db.Filter.prototype.getArgumentFilter = function() {
  return this.argumentFilter_;
};
wtf.db.Filter.prototype.isActive = function() {
  return!(!this.eventTypeFilter_ && !this.argumentFilter_);
};
wtf.db.Filter.prototype.clear = function() {
  if (!this.eventTypeFilter_ && !this.argumentFilter_) {
    return wtf.db.FilterResult.NO_CHANGE;
  }
  this.sourceString_ = "";
  this.argumentFilter_ = this.eventTypeFilter_ = this.parseError_ = this.expressionTree_ = null;
  return wtf.db.FilterResult.UPDATED;
};
wtf.db.Filter.prototype.setFromString = function(a) {
  this.parseError_ = null;
  if (!wtf.util.FunctionBuilder.isSupported()) {
    return this.parseError_ = Error("Runtime function generation not supported."), wtf.db.FilterResult.FAILED;
  }
  a = goog.string.trim(a);
  if (this.sourceString_ == a) {
    return wtf.db.FilterResult.NO_CHANGE;
  }
  if (!a.length) {
    return this.clear(), wtf.db.FilterResult.UPDATED;
  }
  var b = null;
  try {
    b = wtf.db.FilterParser.parse(a, void 0);
  } catch (c) {
    this.parseError_ = c;
  }
  if (!b) {
    return wtf.db.FilterResult.FAILED;
  }
  this.sourceString_ = a;
  this.expressionTree_ = b;
  this.eventTypeFilter_ = this.generateEventTypeFilter_(b);
  this.argumentFilter_ = this.generateArgumentFilter_(b);
  return wtf.db.FilterResult.UPDATED;
};
wtf.db.Filter.prototype.toString = function() {
  return this.sourceString_;
};
wtf.db.Filter.prototype.getError = function() {
  return this.parseError_;
};
wtf.db.Filter.prototype.getDebugString = function() {
  return goog.global.JSON.stringify(this.expressionTree_, null, 2);
};
wtf.db.Filter.prototype.generateEventTypeFilter_ = function(a) {
  if (!a.type_query) {
    return null;
  }
  var b;
  switch(a.type_query.type) {
    case "substring":
      a = goog.string.regExpEscape(a.type_query.value);
      b = RegExp(".*" + a + ".*", "i");
      break;
    case "regex":
      b = RegExp(a.type_query.value, a.type_query.flags);
      break;
    default:
      throw Error("Invalid event type filter query.");;
  }
  return function(a) {
    return b.test(a.name);
  };
};
wtf.db.Filter.prototype.generateArgumentFilter_ = function(a) {
  function b(a) {
    function b(a) {
      if (goog.isString(a)) {
        if ("@" == a[0]) {
          var c = !1;
          switch(a.toLowerCase()) {
            case "@duration":
            ;
            case "@userduration":
            ;
            case "@ownduration":
            ;
            case "@flowid":
              c = !0;
          }
          return{name:null, requiresScope:c};
        }
        return{name:a, requiresScope:!1};
      }
      return b(a.base);
    }
    return "reference" != a.type ? null : b(a.value);
  }
  function c(a) {
    switch(a.type) {
      case "number":
        return String(a.value);
      case "string":
        return'"' + a.value + '"';
      case "boolean":
        return String(a.value);
      case "null":
        return "null";
      case "array":
        return "[" + String(a.value) + "]";
      case "object":
        return goog.global.JSON.stringify(a.value);
      case "regex":
        var b = '(new RegExp("' + String(a.value) + '"';
        a.value.flags && (b += ', "' + String(a.flags) + '"');
        return b + "))";
      case "reference":
        return d(a.value);
      default:
        throw Error("Unknown expression value type: " + a.type);;
    }
  }
  function d(a) {
    if (goog.isString(a)) {
      if ("@" == a[0]) {
        switch(a.toLowerCase()) {
          case "@time":
            return "it.getTime()";
          case "@duration":
            return "it.getTotalDuration()";
          case "@userduration":
            return "it.getUserDuration()";
          case "@ownduration":
            return "it.getOwnDuration()";
          case "@flowid":
            return "it.getChildFlowId()";
          default:
            throw Error("Unknown event attribute: " + a);;
        }
      } else {
        return'args["' + a + '"]';
      }
    } else {
      var b = goog.isString(a.name) ? '"' + a.name + '"' : a.name;
      return d(a.base) + "[" + b + "]";
    }
  }
  if (!a.arg_query) {
    return null;
  }
  var e = new wtf.util.FunctionBuilder;
  e.begin();
  e.addArgument("it");
  for (var f = [], g = !1, k = 0;k < a.arg_query.length;k++) {
    for (var m = a.arg_query[k], l = [b(m.lhs), b(m.rhs)], p = 0;p < l.length;p++) {
      var s = l[p];
      s && (s.name && (f.push('args["' + s.name + '"] !== undefined'), g = !0), s.requiresScope && f.push("it.isScope()"));
    }
    l = m.op;
    switch(l) {
      case "==":
        l = "===";
        break;
      case "!=":
        l = "!==";
    }
    p = c(m.lhs);
    s = c(m.rhs);
    "regex" == m.rhs.type ? f.push("( " + ("!~" == l ? "!" : "") + s + ".test(" + p + ") )") : f.push("(" + p + " " + l + " " + s + ")");
  }
  g && (e.append("var args = it.getArguments();"), e.append("if (!args) return false;"));
  f.length ? e.append("return " + f.join(" && ") + ";") : e.append("return true;");
  return e.end("argumentFilter");
};
wtf.db.Filter.prototype.getMatchedEventTypes = function(a) {
  var b = {}, c = this.eventTypeFilter_;
  a = a.getAll();
  for (var d = 0;d < a.length;d++) {
    var e = a[d];
    e.flags & wtf.data.EventFlag.INTERNAL || (b[e.id] = c ? c(e) : !0);
  }
  return b;
};
wtf.db.Filter.prototype.applyToEventList = function(a) {
  for (var b = this.getMatchedEventTypes(a.eventTypeTable), c = this.argumentFilter_, d = [], e = a.begin();!e.done();e.next()) {
    b[e.getTypeId()] && (c ? c(e) : 1) && d.push(e.getId());
  }
  return new wtf.db.EventIterator(a, 0, d.length - 1, 0, d);
};
goog.exportSymbol("wtf.db.Filter", wtf.db.Filter);
goog.exportProperty(wtf.db.Filter.prototype, "clear", wtf.db.Filter.prototype.clear);
goog.exportProperty(wtf.db.Filter.prototype, "toString", wtf.db.Filter.prototype.toString);
goog.exportProperty(wtf.db.Filter.prototype, "setFromString", wtf.db.Filter.prototype.setFromString);
// Input 63
wtf.db.Frame = function(a) {
  this.ordinal_ = 0;
  this.number_ = a;
  this.endTime_ = this.time_ = this.frameEndEventId_ = this.frameStartEventId_ = 0;
};
wtf.db.Frame.prototype.setStartEvent = function(a) {
  this.frameStartEventId_ = a.getId();
  this.time_ = a.getTime();
};
wtf.db.Frame.prototype.setEndEvent = function(a) {
  this.frameEndEventId_ = a.getId();
  this.endTime_ = a.getTime();
};
wtf.db.Frame.prototype.getOrdinal = function() {
  return this.ordinal_;
};
wtf.db.Frame.prototype.setOrdinal = function(a) {
  this.ordinal_ = a;
};
wtf.db.Frame.prototype.getNumber = function() {
  return this.number_;
};
wtf.db.Frame.prototype.getTime = function() {
  return this.time_;
};
wtf.db.Frame.prototype.getEndTime = function() {
  return this.endTime_;
};
wtf.db.Frame.prototype.getDuration = function() {
  return this.endTime_ - this.time_;
};
wtf.db.Frame.prototype.getStartEventId = function() {
  return this.frameStartEventId_;
};
wtf.db.Frame.prototype.getEndEventId = function() {
  return this.frameEndEventId_;
};
wtf.db.Frame.comparer = function(a, b) {
  return a.time_ - b.time_;
};
wtf.db.Frame.selector = function(a) {
  return this.time - a.time_;
};
goog.exportSymbol("wtf.db.Frame", wtf.db.Frame);
goog.exportProperty(wtf.db.Frame.prototype, "getNumber", wtf.db.Frame.prototype.getNumber);
goog.exportProperty(wtf.db.Frame.prototype, "getTime", wtf.db.Frame.prototype.getTime);
goog.exportProperty(wtf.db.Frame.prototype, "getEndTime", wtf.db.Frame.prototype.getEndTime);
goog.exportProperty(wtf.db.Frame.prototype, "getDuration", wtf.db.Frame.prototype.getDuration);
// Input 64
wtf.db.FrameList = function(a) {
  wtf.events.EventEmitter.call(this);
  this.eventList_ = a;
  this.frames_ = {};
  this.frameList_ = [];
  this.eventList_.registerAncillaryList(this);
};
goog.inherits(wtf.db.FrameList, wtf.events.EventEmitter);
wtf.db.FrameList.prototype.disposeInternal = function() {
  this.eventList_.unregisterAncillaryList(this);
  wtf.db.FrameList.superClass_.disposeInternal.call(this);
};
wtf.db.FrameList.prototype.getCount = function() {
  return this.frameList_.length;
};
wtf.db.FrameList.prototype.getAllFrames = function() {
  return this.frameList_;
};
wtf.db.FrameList.prototype.getFrame = function(a) {
  return this.frames_[a] || null;
};
wtf.db.FrameList.prototype.getPreviousFrame = function(a) {
  a = a.getOrdinal();
  return 0 < a ? this.frameList_[a - 1] : null;
};
wtf.db.FrameList.prototype.getNextFrame = function(a) {
  a = a.getOrdinal();
  return a < this.frameList_.length - 1 ? this.frameList_[a + 1] : null;
};
wtf.db.FrameList.prototype.getFrameAtTime = function(a) {
  if (!this.frameList_.length) {
    return null;
  }
  var b = goog.array.binarySelect(this.frameList_, wtf.db.Frame.selector, {time:a});
  0 > b && (b = -b - 2);
  b = goog.math.clamp(b, 0, this.frameList_.length - 1);
  return(b = this.frameList_[b]) && b.getTime() <= a && b.getEndTime() >= a ? b : null;
};
wtf.db.FrameList.prototype.getIntraFrameAtTime = function(a) {
  if (!this.frameList_.length) {
    return[null, null];
  }
  a = goog.array.binarySelect(this.frameList_, wtf.db.Frame.selector, {time:a});
  0 > a && (a = -a - 1, a--);
  if (0 > a) {
    return[null, this.frameList_[0]];
  }
  a = goog.math.clamp(a, 0, this.frameList_.length - 1);
  a = this.frameList_[a];
  var b = this.getNextFrame(a);
  return[a, b];
};
wtf.db.FrameList.prototype.forEachIntersecting = function(a, b, c, d) {
  if (this.frameList_.length) {
    var e = goog.array.binarySelect(this.frameList_, wtf.db.Frame.selector, {time:a});
    0 > e && (e = -e - 1, e--);
    for (e = goog.math.clamp(e, 0, this.frameList_.length - 1);e < this.frameList_.length;e++) {
      var f = this.frameList_[e];
      if (!(f.getEndTime() < a)) {
        if (f.getTime() > b) {
          break;
        }
        c.call(d, f);
      }
    }
  }
};
wtf.db.FrameList.prototype.beginRebuild = function(a) {
  return[a.getByName("wtf.timing#frameStart"), a.getByName("wtf.timing#frameEnd")];
};
wtf.db.FrameList.prototype.handleEvent = function(a, b, c) {
  b = c.getArgument("number");
  var d = this.frames_[b];
  d || (d = new wtf.db.Frame(b), this.frames_[b] = d, this.frameList_.push(d));
  switch(a) {
    case 0:
      d.setStartEvent(c);
      break;
    case 1:
      d.setEndEvent(c);
  }
};
wtf.db.FrameList.prototype.endRebuild = function() {
  for (var a = [], b = 0;b < this.frameList_.length;b++) {
    var c = this.frameList_[b];
    c.getTime() && c.getEndTime() ? (c.setOrdinal(a.length), a.push(c)) : delete this.frames_[c.getNumber()];
  }
  this.frameList_ = a;
  this.emitEvent(wtf.events.EventType.INVALIDATED);
};
goog.exportProperty(wtf.db.FrameList.prototype, "getCount", wtf.db.FrameList.prototype.getCount);
goog.exportProperty(wtf.db.FrameList.prototype, "getAllFrames", wtf.db.FrameList.prototype.getAllFrames);
goog.exportProperty(wtf.db.FrameList.prototype, "getFrame", wtf.db.FrameList.prototype.getFrame);
goog.exportProperty(wtf.db.FrameList.prototype, "getPreviousFrame", wtf.db.FrameList.prototype.getPreviousFrame);
goog.exportProperty(wtf.db.FrameList.prototype, "getNextFrame", wtf.db.FrameList.prototype.getNextFrame);
goog.exportProperty(wtf.db.FrameList.prototype, "getFrameAtTime", wtf.db.FrameList.prototype.getFrameAtTime);
goog.exportProperty(wtf.db.FrameList.prototype, "getIntraFrameAtTime", wtf.db.FrameList.prototype.getIntraFrameAtTime);
goog.exportProperty(wtf.db.FrameList.prototype, "forEachIntersecting", wtf.db.FrameList.prototype.forEachIntersecting);
// Input 65
wtf.db.Mark = function(a, b, c, d) {
  this.eventId_ = a;
  this.name_ = b;
  this.value_ = c;
  this.time_ = d;
  this.endTime_ = Number.MAX_VALUE;
  this.renderData_ = null;
};
wtf.db.Mark.prototype.getEventId = function() {
  return this.eventId_;
};
wtf.db.Mark.prototype.getName = function() {
  return this.name_;
};
wtf.db.Mark.prototype.getValue = function() {
  return this.value_;
};
wtf.db.Mark.prototype.getTime = function() {
  return this.time_;
};
wtf.db.Mark.prototype.getEndTime = function() {
  return this.endTime_;
};
wtf.db.Mark.prototype.setEndTime = function(a) {
  this.endTime_ = a;
};
wtf.db.Mark.prototype.getDuration = function() {
  return this.endTime_ - this.time_;
};
wtf.db.Mark.prototype.getRenderData = function() {
  return this.renderData_;
};
wtf.db.Mark.prototype.setRenderData = function(a) {
  this.renderData_ = a;
};
wtf.db.Mark.comparer = function(a, b) {
  return a.time_ - b.time_;
};
wtf.db.Mark.selector = function(a) {
  return this.time - a.time_;
};
goog.exportSymbol("wtf.db.Mark", wtf.db.Mark);
goog.exportProperty(wtf.db.Mark.prototype, "getEventId", wtf.db.Mark.prototype.getEventId);
goog.exportProperty(wtf.db.Mark.prototype, "getName", wtf.db.Mark.prototype.getName);
goog.exportProperty(wtf.db.Mark.prototype, "getValue", wtf.db.Mark.prototype.getValue);
goog.exportProperty(wtf.db.Mark.prototype, "getTime", wtf.db.Mark.prototype.getTime);
goog.exportProperty(wtf.db.Mark.prototype, "getEndTime", wtf.db.Mark.prototype.getEndTime);
goog.exportProperty(wtf.db.Mark.prototype, "getDuration", wtf.db.Mark.prototype.getDuration);
// Input 66
wtf.db.MarkList = function(a) {
  wtf.events.EventEmitter.call(this);
  this.eventList_ = a;
  this.markList_ = [];
  this.eventList_.registerAncillaryList(this);
};
goog.inherits(wtf.db.MarkList, wtf.events.EventEmitter);
wtf.db.MarkList.prototype.disposeInternal = function() {
  this.eventList_.unregisterAncillaryList(this);
  wtf.db.MarkList.superClass_.disposeInternal.call(this);
};
wtf.db.MarkList.prototype.getCount = function() {
  return this.markList_.length;
};
wtf.db.MarkList.prototype.getAllMarks = function() {
  return this.markList_;
};
wtf.db.MarkList.prototype.getMarkAtTime = function(a) {
  if (!this.markList_.length) {
    return null;
  }
  var b = goog.array.binarySelect(this.markList_, wtf.db.Mark.selector, {time:a});
  0 > b && (b = -b - 2);
  b = goog.math.clamp(b, 0, this.markList_.length - 1);
  return(b = this.markList_[b]) && b.getTime() <= a && b.getEndTime() >= a ? b : null;
};
wtf.db.MarkList.prototype.forEachIntersecting = function(a, b, c, d) {
  if (this.markList_.length) {
    var e = goog.array.binarySelect(this.markList_, wtf.db.Mark.selector, {time:a});
    0 > e && (e = -e - 1, e--);
    for (e = goog.math.clamp(e, 0, this.markList_.length - 1);e < this.markList_.length;e++) {
      var f = this.markList_[e];
      if (!(f.getEndTime() < a)) {
        if (f.getTime() > b) {
          break;
        }
        c.call(d, f);
      }
    }
  }
};
wtf.db.MarkList.prototype.beginRebuild = function(a) {
  this.markList_.length = 0;
  return[a.getByName("wtf.trace#mark")];
};
wtf.db.MarkList.prototype.handleEvent = function(a, b, c) {
  this.markList_.push(new wtf.db.Mark(c.getId(), c.getArgument("name"), c.getArgument("value"), c.getTime()));
};
wtf.db.MarkList.prototype.endRebuild = function() {
  for (var a = 1;a < this.markList_.length;a++) {
    var b = this.markList_[a];
    this.markList_[a - 1].setEndTime(b.getTime());
  }
  this.markList_.length && (b = this.markList_[this.markList_.length - 1], b.setEndTime(this.eventList_.getLastEventTime()));
  this.emitEvent(wtf.events.EventType.INVALIDATED);
};
goog.exportProperty(wtf.db.MarkList.prototype, "getCount", wtf.db.MarkList.prototype.getCount);
goog.exportProperty(wtf.db.MarkList.prototype, "getAllMarks", wtf.db.MarkList.prototype.getAllMarks);
goog.exportProperty(wtf.db.MarkList.prototype, "getMarkAtTime", wtf.db.MarkList.prototype.getMarkAtTime);
goog.exportProperty(wtf.db.MarkList.prototype, "forEachIntersecting", wtf.db.MarkList.prototype.forEachIntersecting);
// Input 67
wtf.db.QueryDumpFormat = {CSV:0};
goog.exportSymbol("wtf.db.QueryDumpFormat", wtf.db.QueryDumpFormat);
goog.exportProperty(wtf.db.QueryDumpFormat, "CSV", wtf.db.QueryDumpFormat.CSV);
wtf.db.QueryResult = function(a, b, c, d) {
  goog.Disposable.call(this);
  this.expr_ = a;
  this.compiledExpr_ = b;
  this.duration_ = c;
  this.value_ = d;
};
goog.inherits(wtf.db.QueryResult, goog.Disposable);
wtf.db.QueryResult.prototype.getExpression = function() {
  return this.expr_;
};
wtf.db.QueryResult.prototype.getCompiledExpression = function() {
  return this.compiledExpr_;
};
wtf.db.QueryResult.prototype.getDuration = function() {
  return this.duration_;
};
wtf.db.QueryResult.prototype.getValue = function() {
  return this.value_;
};
wtf.db.QueryResult.prototype.dump = function(a) {
  switch(a) {
    case wtf.db.QueryDumpFormat.CSV:
      return this.dumpCsv_();
    default:
      return goog.asserts.fail("Unknown format"), null;
  }
};
wtf.db.QueryResult.prototype.dumpCsv_ = function() {
  var a = [], b = this.value_;
  a.push('Time,Value,"Total Time","Own Time",Depth,Arguments');
  for (b.seek(0);!b.done();b.next()) {
    var c = [b.getTime(), b.getName(), b.isScope() ? b.getTotalDuration() : "", b.isScope() ? b.getOwnDuration() : "", b.getDepth(), b.getArgumentString(!0)];
    a.push(c.join(","));
  }
  b.seek(0);
  return a.join("\r\n");
};
goog.exportProperty(wtf.db.QueryResult.prototype, "getExpression", wtf.db.QueryResult.prototype.getExpression);
goog.exportProperty(wtf.db.QueryResult.prototype, "getCompiledExpression", wtf.db.QueryResult.prototype.getCompiledExpression);
goog.exportProperty(wtf.db.QueryResult.prototype, "getDuration", wtf.db.QueryResult.prototype.getDuration);
goog.exportProperty(wtf.db.QueryResult.prototype, "getValue", wtf.db.QueryResult.prototype.getValue);
goog.exportProperty(wtf.db.QueryResult.prototype, "dump", wtf.db.QueryResult.prototype.dump);
// Input 68
wtf.db.TimeRange = function() {
  this.endEventId_ = this.beginEventId_ = -1;
  this.name_ = "";
  this.value_ = null;
  this.overlap_ = this.level_ = this.endTime_ = this.time_ = 0;
  this.renderData_ = null;
};
wtf.db.TimeRange.prototype.getBeginEventId = function() {
  return this.beginEventId_;
};
wtf.db.TimeRange.prototype.setBeginEvent = function(a, b, c) {
  this.beginEventId_ = a.getId();
  this.name_ = a.getArgument("name");
  this.value_ = a.getArgument("value");
  this.time_ = a.getTime();
  this.level_ = b;
  this.overlap_ = c;
};
wtf.db.TimeRange.prototype.getEndEventId = function() {
  return this.endEventId_;
};
wtf.db.TimeRange.prototype.setEndEvent = function(a) {
  this.endEventId_ = a.getId();
  this.endTime_ = a.getTime();
};
wtf.db.TimeRange.prototype.getName = function() {
  return this.name_;
};
wtf.db.TimeRange.prototype.getValue = function() {
  return this.value_;
};
wtf.db.TimeRange.prototype.getTime = function() {
  return this.time_;
};
wtf.db.TimeRange.prototype.getEndTime = function() {
  return this.endTime_;
};
wtf.db.TimeRange.prototype.getDuration = function() {
  return this.endTime_ - this.time_;
};
wtf.db.TimeRange.prototype.getLevel = function() {
  return this.level_;
};
wtf.db.TimeRange.prototype.getOverlap = function() {
  return this.overlap_;
};
wtf.db.TimeRange.prototype.getRenderData = function() {
  return this.renderData_;
};
wtf.db.TimeRange.prototype.setRenderData = function(a) {
  this.renderData_ = a;
};
wtf.db.TimeRange.comparer = function(a, b) {
  return a.time_ - b.time_;
};
wtf.db.TimeRange.selector = function(a) {
  return this.time - a.time_;
};
wtf.db.TimeRange.nextGlobalId_ = 0;
wtf.db.TimeRange.allocateId = function() {
  return++wtf.db.TimeRange.nextGlobalId_;
};
goog.exportSymbol("wtf.db.TimeRange", wtf.db.TimeRange);
goog.exportProperty(wtf.db.TimeRange.prototype, "getBeginEventId", wtf.db.TimeRange.prototype.getBeginEventId);
goog.exportProperty(wtf.db.TimeRange.prototype, "getEndEventId", wtf.db.TimeRange.prototype.getEndEventId);
goog.exportProperty(wtf.db.TimeRange.prototype, "getName", wtf.db.TimeRange.prototype.getName);
goog.exportProperty(wtf.db.TimeRange.prototype, "getValue", wtf.db.TimeRange.prototype.getValue);
goog.exportProperty(wtf.db.TimeRange.prototype, "getTime", wtf.db.TimeRange.prototype.getTime);
goog.exportProperty(wtf.db.TimeRange.prototype, "getEndTime", wtf.db.TimeRange.prototype.getEndTime);
goog.exportProperty(wtf.db.TimeRange.prototype, "getDuration", wtf.db.TimeRange.prototype.getDuration);
// Input 69
wtf.db.TimeRangeList = function(a) {
  wtf.events.EventEmitter.call(this);
  this.eventList_ = a;
  this.timeRanges_ = {};
  this.timeRangeList_ = [];
  this.maximumLevel_ = 0;
  this.rebuildState_ = {levels:[], overlap:0};
  this.eventList_.registerAncillaryList(this);
};
goog.inherits(wtf.db.TimeRangeList, wtf.events.EventEmitter);
wtf.db.TimeRangeList.prototype.disposeInternal = function() {
  this.eventList_.unregisterAncillaryList(this);
  wtf.db.TimeRangeList.superClass_.disposeInternal.call(this);
};
wtf.db.TimeRangeList.prototype.getMaximumLevel = function() {
  return this.maximumLevel_;
};
wtf.db.TimeRangeList.prototype.getCount = function() {
  return this.timeRangeList_.length;
};
wtf.db.TimeRangeList.prototype.getAllTimeRanges = function() {
  return this.timeRangeList_;
};
wtf.db.TimeRangeList.prototype.getTimeRange = function(a) {
  return this.timeRanges_[a] || null;
};
wtf.db.TimeRangeList.prototype.getTimeRangesAtTime = function(a) {
  if (!this.timeRangeList_.length) {
    return[];
  }
  var b = [];
  this.forEachIntersecting(a, a, function(a) {
    b.push(a);
  });
  return b;
};
wtf.db.TimeRangeList.prototype.forEachIntersecting = function(a, b, c, d) {
  if (this.timeRangeList_.length) {
    var e = goog.array.binarySelect(this.timeRangeList_, wtf.db.TimeRange.selector, {time:a});
    0 > e && (e = -e - 1, e--);
    for (e = goog.math.clamp(e, 0, this.timeRangeList_.length - 1);0 <= e;e--) {
      var f = this.timeRangeList_[e];
      if (!f.getOverlap()) {
        break;
      }
    }
    for (;e < this.timeRangeList_.length;e++) {
      f = this.timeRangeList_[e];
      if (f.getTime() > b) {
        break;
      }
      f.getTime() <= b && f.getEndTime() >= a && c.call(d, f);
    }
  }
};
wtf.db.TimeRangeList.prototype.beginRebuild = function(a) {
  this.rebuildState_.levels.length = 0;
  this.rebuildState_.overlap = 0;
  this.rebuildState_.maximumLevel = 0;
  return[a.getByName("wtf.timeRange#begin"), a.getByName("wtf.timeRange#end")];
};
wtf.db.TimeRangeList.prototype.handleEvent = function(a, b, c) {
  var d = c.getArgument("id");
  b = this.timeRanges_[d];
  b || (b = new wtf.db.TimeRange, this.timeRanges_[d] = b, this.timeRangeList_.push(b));
  d = this.rebuildState_;
  switch(a) {
    case 0:
      for (a = 0;d.levels[a];a++) {
      }
      d.levels[a] = b;
      b.setBeginEvent(c, a, d.overlap++);
      break;
    case 1:
      a = b.getLevel(), d.levels[a] == b && (d.levels[a] = null, d.overlap--), b.setEndEvent(c);
  }
};
wtf.db.TimeRangeList.prototype.endRebuild = function() {
  this.maximumLevel_ = this.rebuildState_.levels.length;
  this.emitEvent(wtf.events.EventType.INVALIDATED);
};
goog.exportProperty(wtf.db.TimeRangeList.prototype, "getMaximumLevel", wtf.db.TimeRangeList.prototype.getMaximumLevel);
goog.exportProperty(wtf.db.TimeRangeList.prototype, "getCount", wtf.db.TimeRangeList.prototype.getCount);
goog.exportProperty(wtf.db.TimeRangeList.prototype, "getAllTimeRanges", wtf.db.TimeRangeList.prototype.getAllTimeRanges);
goog.exportProperty(wtf.db.TimeRangeList.prototype, "getTimeRangesAtTime", wtf.db.TimeRangeList.prototype.getTimeRangesAtTime);
goog.exportProperty(wtf.db.TimeRangeList.prototype, "forEachIntersecting", wtf.db.TimeRangeList.prototype.forEachIntersecting);
// Input 70
wtf.db.Zone = function(a, b, c, d) {
  goog.Disposable.call(this);
  this.db_ = a;
  this.name_ = b;
  this.type_ = c;
  this.location_ = d;
  this.eventList_ = new wtf.db.EventList(a.getEventTypeTable());
  this.frameList_ = new wtf.db.FrameList(this.eventList_);
  this.registerDisposable(this.frameList_);
  this.markList_ = new wtf.db.MarkList(this.eventList_);
  this.registerDisposable(this.markList_);
  this.timeRangeList_ = new wtf.db.TimeRangeList(this.eventList_);
  this.registerDisposable(this.timeRangeList_);
  this.indices_ = [];
};
goog.inherits(wtf.db.Zone, goog.Disposable);
wtf.db.Zone.prototype.disposeInternal = function() {
  goog.disposeAll(this.indices_);
  wtf.db.Zone.superClass_.disposeInternal.call(this);
};
wtf.db.Zone.prototype.resetInfo = function(a, b, c) {
  this.name_ = a;
  this.type_ = b;
  this.location_ = c;
};
wtf.db.Zone.prototype.toString = function() {
  return this.name_;
};
wtf.db.Zone.getInfoString = function(a) {
  var b = [a.name_ + " (" + a.type_ + ")"];
  a.location_ && a.location_.length && b.push(a.location_);
  return b.join("\n");
};
wtf.db.Zone.prototype.getDatabase = function() {
  return this.db_;
};
wtf.db.Zone.prototype.getName = function() {
  return this.name_;
};
wtf.db.Zone.prototype.getType = function() {
  return this.type_;
};
wtf.db.Zone.prototype.getLocation = function() {
  return this.location_;
};
wtf.db.Zone.prototype.getEventList = function() {
  return this.eventList_;
};
wtf.db.Zone.prototype.getFrameList = function() {
  return this.frameList_;
};
wtf.db.Zone.prototype.getMarkList = function() {
  return this.markList_;
};
wtf.db.Zone.prototype.getTimeRangeList = function() {
  return this.timeRangeList_;
};
wtf.db.Zone.prototype.getSharedIndex = function(a) {
  for (var b = 0;b < this.indices_.length;b++) {
    if (goog.array.equals(this.indices_[b].getEventNames(), a)) {
      return this.indices_[b];
    }
  }
  a = new wtf.db.EventIndex(this, a);
  this.indices_.push(a);
  return a;
};
wtf.db.Zone.prototype.query = function(a) {
  var b = wtf.now(), c = new wtf.db.Filter;
  if (c.setFromString(a) == wtf.db.FilterResult.FAILED) {
    throw c.getError();
  }
  var d = c.applyToEventList(this.eventList_), b = wtf.now() - b;
  return new wtf.db.QueryResult(a, c.getDebugString(), b, d);
};
goog.exportSymbol("wtf.db.Zone", wtf.db.Zone);
goog.exportProperty(wtf.db.Zone.prototype, "toString", wtf.db.Zone.prototype.toString);
goog.exportProperty(wtf.db.Zone.prototype, "getName", wtf.db.Zone.prototype.getName);
goog.exportProperty(wtf.db.Zone.prototype, "getType", wtf.db.Zone.prototype.getType);
goog.exportProperty(wtf.db.Zone.prototype, "getLocation", wtf.db.Zone.prototype.getLocation);
goog.exportProperty(wtf.db.Zone.prototype, "getEventList", wtf.db.Zone.prototype.getEventList);
goog.exportProperty(wtf.db.Zone.prototype, "getFrameList", wtf.db.Zone.prototype.getFrameList);
goog.exportProperty(wtf.db.Zone.prototype, "getMarkList", wtf.db.Zone.prototype.getMarkList);
goog.exportProperty(wtf.db.Zone.prototype, "getTimeRangeList", wtf.db.Zone.prototype.getTimeRangeList);
goog.exportProperty(wtf.db.Zone.prototype, "getSharedIndex", wtf.db.Zone.prototype.getSharedIndex);
goog.exportProperty(wtf.db.Zone.prototype, "query", wtf.db.Zone.prototype.query);
// Input 71
wtf.db.Database = function() {
  wtf.events.EventEmitter.call(this);
  this.sources_ = [];
  this.units_ = wtf.db.Unit.TIME_MILLISECONDS;
  this.commonTimebase_ = -1;
  this.lastEventTime_ = this.firstEventTime_ = 0;
  this.zoneList_ = [];
  this.zoneMap_ = {};
  this.defaultZone_ = null;
  this.eventTypeTable_ = new wtf.db.EventTypeTable;
  this.insertingEvents_ = !1;
  this.beginningZoneCount_ = 0;
};
goog.inherits(wtf.db.Database, wtf.events.EventEmitter);
wtf.db.Database.prototype.disposeInternal = function() {
  wtf.db.Database.superClass_.disposeInternal.call(this);
};
wtf.db.Database.EventType = {SOURCES_CHANGED:goog.events.getUniqueId("sources_changed"), SOURCE_ERROR:goog.events.getUniqueId("source_error"), SOURCE_ENDED:goog.events.getUniqueId("source_ended"), ZONES_ADDED:goog.events.getUniqueId("zones_added")};
wtf.db.Database.prototype.invalidate_ = function() {
  this.emitEvent(wtf.events.EventType.INVALIDATED);
};
wtf.db.Database.prototype.addSource = function(a) {
  this.sources_.push(a);
  this.registerDisposable(a);
  this.emitEvent(wtf.db.Database.EventType.SOURCES_CHANGED);
  this.invalidate_();
};
wtf.db.Database.prototype.getSources = function() {
  return this.sources_;
};
wtf.db.Database.prototype.getUnits = function() {
  return this.units_;
};
wtf.db.Database.prototype.getTimebase = function() {
  return this.commonTimebase_;
};
wtf.db.Database.prototype.computeTimeDelay = function(a) {
  return-1 == this.commonTimebase_ ? (this.commonTimebase_ = a, 0) : this.commonTimebase_ - a;
};
wtf.db.Database.prototype.createOrGetZone = function(a, b, c) {
  var d = a + ":" + b + ":" + c;
  if (this.defaultZone_ && "" == this.defaultZone_.getName()) {
    return this.defaultZone_.resetInfo(a, b, c), this.zoneMap_[d] = this.defaultZone_;
  }
  var e = this.zoneMap_[d];
  e || (e = new wtf.db.Zone(this, a, b, c), this.zoneMap_[d] = e, this.zoneList_.push(e), this.defaultZone_ || (this.defaultZone_ = e));
  return e;
};
wtf.db.Database.prototype.getDefaultZone = function() {
  this.defaultZone_ || (this.defaultZone_ = new wtf.db.Zone(this, "", "", ""), this.zoneList_.push(this.defaultZone_));
  return this.defaultZone_;
};
wtf.db.Database.prototype.getZones = function() {
  return this.zoneList_;
};
wtf.db.Database.prototype.getEventTypeTable = function() {
  return this.eventTypeTable_;
};
wtf.db.Database.prototype.getEventType = function(a) {
  return this.eventTypeTable_.getByName(a);
};
wtf.db.Database.prototype.getFirstFrameList = function() {
  for (var a = 0;a < this.zoneList_.length;a++) {
    var b = this.zoneList_[a].getFrameList();
    if (b.getCount()) {
      return b;
    }
  }
  return null;
};
wtf.db.Database.prototype.getFirstEventTime = function() {
  return this.firstEventTime_;
};
wtf.db.Database.prototype.getLastEventTime = function() {
  return this.lastEventTime_;
};
wtf.db.Database.prototype.sourceInitialized = function(a) {
  var b = a.getUnits();
  if (1 == this.sources_.length) {
    this.units_ = b;
  } else {
    if (this.units_ != b) {
      return this.sourceError(a, "Mixing measurement units is not supported.", "All sources loaded must be of the same type (time/size)."), !1;
    }
  }
  return!0;
};
wtf.db.Database.prototype.sourceError = function(a, b, c) {
  this.emitEvent(wtf.db.Database.EventType.SOURCE_ERROR, a, b, c);
};
wtf.db.Database.prototype.sourceEnded = function(a) {
  this.emitEvent(wtf.db.Database.EventType.SOURCE_ENDED, a);
};
wtf.db.Database.prototype.beginInsertingEvents = function(a) {
  goog.asserts.assert(!this.insertingEvents_);
  this.insertingEvents_ = !0;
  this.beginningZoneCount_ = this.zoneList_.length;
  1 == this.zoneList_.length && "" == this.zoneList_[0].getName() && (this.beginningZoneCount_ = 0);
};
wtf.db.Database.prototype.endInsertingEvents = function() {
  goog.asserts.assert(this.insertingEvents_);
  this.insertingEvents_ = !1;
  this.firstEventTime_ = Number.MAX_VALUE;
  this.lastEventTime_ = -Number.MAX_VALUE;
  for (var a = 0;a < this.zoneList_.length;a++) {
    var b = this.zoneList_[a].getEventList();
    b.rebuild();
    this.firstEventTime_ = Math.min(b.getFirstEventTime(), this.firstEventTime_);
    this.lastEventTime_ = Math.max(b.getLastEventTime(), this.lastEventTime_);
  }
  this.firstEventTime_ == Number.MAX_VALUE && (this.lastEventTime_ = this.firstEventTime_ = 0);
  this.beginningZoneCount_ != this.zoneList_.length && (a = this.zoneList_.slice(this.beginningZoneCount_), this.emitEvent(wtf.db.Database.EventType.ZONES_ADDED, a));
  this.invalidate_();
};
goog.exportSymbol("wtf.db.Database", wtf.db.Database);
goog.exportProperty(wtf.db.Database.prototype, "addSource", wtf.db.Database.prototype.addSource);
goog.exportProperty(wtf.db.Database.prototype, "getSources", wtf.db.Database.prototype.getSources);
goog.exportProperty(wtf.db.Database.prototype, "getTimebase", wtf.db.Database.prototype.getTimebase);
goog.exportProperty(wtf.db.Database.prototype, "getZones", wtf.db.Database.prototype.getZones);
goog.exportProperty(wtf.db.Database.prototype, "getEventTypeTable", wtf.db.Database.prototype.getEventTypeTable);
goog.exportProperty(wtf.db.Database.prototype, "getEventType", wtf.db.Database.prototype.getEventType);
goog.exportProperty(wtf.db.Database.prototype, "getFirstFrameList", wtf.db.Database.prototype.getFirstFrameList);
goog.exportProperty(wtf.db.Database.prototype, "getFirstEventTime", wtf.db.Database.prototype.getFirstEventTime);
goog.exportProperty(wtf.db.Database.prototype, "getLastEventTime", wtf.db.Database.prototype.getLastEventTime);
// Input 72
wtf.data.formats = {};
wtf.data.formats.BinaryCalls = {};
wtf.data.formats.BinaryTrace = {};
wtf.data.formats.ChunkedFileFormat = {};
wtf.data.formats.JsonTrace = {};
wtf.data.formats.BinaryTrace.VERSION = 3;
wtf.data.formats.JsonTrace.VERSION = 2;
wtf.data.formats.ChunkedFileFormat.VERSION = 10;
wtf.data.formats.BinaryCalls.VERSION = 1;
wtf.data.formats.FileFlags = {HAS_HIGH_RESOLUTION_TIMES:1, TIMES_AS_COUNT:2};
wtf.data.formats.FileFlags.toStrings = function(a) {
  var b = [];
  a & wtf.data.formats.FileFlags.HAS_HIGH_RESOLUTION_TIMES && b.push("has_high_resolution_times");
  a & wtf.data.formats.FileFlags.TIMES_AS_COUNT && b.push("times_as_count");
  return b;
};
wtf.data.formats.FileFlags.fromStrings = function(a) {
  for (var b = 0, c = 0;c < a.length;c++) {
    switch(a[c]) {
      case "has_high_resolution_times":
        b |= wtf.data.formats.FileFlags.HAS_HIGH_RESOLUTION_TIMES;
        break;
      case "times_as_count":
        b |= wtf.data.formats.FileFlags.TIMES_AS_COUNT;
    }
  }
  return b;
};
// Input 73
wtf.db.PresentationHint = {BARE:1, NO_RENDER_DATA:2};
wtf.db.DataSource = function(a, b) {
  goog.Disposable.call(this);
  this.db_ = a;
  this.sourceInfo_ = b;
  this.deferred_ = null;
  this.isInitialized_ = !1;
  this.contextInfo_ = null;
  this.presentationHints_ = this.flags_ = 0;
  this.units_ = wtf.db.Unit.TIME_MILLISECONDS;
  this.metadata_ = {};
  this.timeDelay_ = this.timebase_ = 0;
  this.hasErrored = !1;
};
goog.inherits(wtf.db.DataSource, goog.Disposable);
wtf.db.DataSource.prototype.getDatabase = function() {
  return this.db_;
};
wtf.db.DataSource.prototype.getInfo = function() {
  return this.sourceInfo_;
};
wtf.db.DataSource.prototype.isInitialized = function() {
  return this.isInitialized_;
};
wtf.db.DataSource.prototype.getContextInfo = function() {
  goog.asserts.assert(this.isInitialized_);
  goog.asserts.assert(this.contextInfo_);
  return this.contextInfo_;
};
wtf.db.DataSource.prototype.getFlags = function() {
  return this.flags_;
};
wtf.db.DataSource.prototype.hasHighResolutionTimes = function() {
  goog.asserts.assert(this.isInitialized_);
  return!!(this.flags_ & wtf.data.formats.FileFlags.HAS_HIGH_RESOLUTION_TIMES);
};
wtf.db.DataSource.prototype.getPresentationHints = function() {
  return this.presentationHints_;
};
wtf.db.DataSource.prototype.getUnits = function() {
  return this.units_;
};
wtf.db.DataSource.prototype.getMetadata = function() {
  return this.metadata_;
};
wtf.db.DataSource.prototype.getTimebase = function() {
  goog.asserts.assert(this.isInitialized_);
  return this.timebase_;
};
wtf.db.DataSource.prototype.getTimeDelay = function() {
  return this.timeDelay_;
};
wtf.db.DataSource.prototype.start = function() {
  goog.asserts.assert(!this.deferred_);
  return this.deferred_ = new goog.async.Deferred;
};
wtf.db.DataSource.prototype.initialize = function(a, b, c, d, e, f, g) {
  goog.asserts.assert(!this.isInitialized_);
  this.isInitialized_ = !0;
  this.contextInfo_ = a;
  this.flags_ = b;
  this.presentationHints_ = c;
  this.units_ = d;
  this.metadata_ = e;
  this.timebase_ = f;
  this.timeDelay_ = g;
  return this.db_.sourceInitialized(this);
};
wtf.db.DataSource.prototype.error = function(a, b) {
  this.hasErrored = !0;
  this.db_.sourceError(this, a, b);
  this.deferred_ && (this.deferred_.errback(Error(a)), this.deferred_ = null);
};
wtf.db.DataSource.prototype.end = function() {
  this.db_.sourceEnded(this);
  this.deferred_ && (this.deferred_.callback(), this.deferred_ = null);
};
goog.exportProperty(wtf.db.DataSource.prototype, "getContextInfo", wtf.db.DataSource.prototype.getContextInfo);
goog.exportProperty(wtf.db.DataSource.prototype, "getFlags", wtf.db.DataSource.prototype.getFlags);
goog.exportProperty(wtf.db.DataSource.prototype, "hasHighResolutionTimes", wtf.db.DataSource.prototype.hasHighResolutionTimes);
goog.exportProperty(wtf.db.DataSource.prototype, "getPresentationHints", wtf.db.DataSource.prototype.getPresentationHints);
goog.exportProperty(wtf.db.DataSource.prototype, "getUnits", wtf.db.DataSource.prototype.getUnits);
goog.exportProperty(wtf.db.DataSource.prototype, "getMetadata", wtf.db.DataSource.prototype.getMetadata);
goog.exportProperty(wtf.db.DataSource.prototype, "getTimebase", wtf.db.DataSource.prototype.getTimebase);
goog.exportProperty(wtf.db.DataSource.prototype, "getTimeDelay", wtf.db.DataSource.prototype.getTimeDelay);
// Input 74
goog.crypt = {};
goog.crypt.stringToByteArray = function(a) {
  for (var b = [], c = 0, d = 0;d < a.length;d++) {
    for (var e = a.charCodeAt(d);255 < e;) {
      b[c++] = e & 255, e >>= 8;
    }
    b[c++] = e;
  }
  return b;
};
goog.crypt.byteArrayToString = function(a) {
  return String.fromCharCode.apply(null, a);
};
goog.crypt.byteArrayToHex = function(a) {
  return goog.array.map(a, function(a) {
    a = a.toString(16);
    return 1 < a.length ? a : "0" + a;
  }).join("");
};
goog.crypt.hexToByteArray = function(a) {
  goog.asserts.assert(0 == a.length % 2, "Key string length must be multiple of 2");
  for (var b = [], c = 0;c < a.length;c += 2) {
    b.push(parseInt(a.substring(c, c + 2), 16));
  }
  return b;
};
goog.crypt.stringToUtf8ByteArray = function(a) {
  a = a.replace(/\r\n/g, "\n");
  for (var b = [], c = 0, d = 0;d < a.length;d++) {
    var e = a.charCodeAt(d);
    128 > e ? b[c++] = e : (2048 > e ? b[c++] = e >> 6 | 192 : (b[c++] = e >> 12 | 224, b[c++] = e >> 6 & 63 | 128), b[c++] = e & 63 | 128);
  }
  return b;
};
goog.crypt.utf8ByteArrayToString = function(a) {
  for (var b = [], c = 0, d = 0;c < a.length;) {
    var e = a[c++];
    if (128 > e) {
      b[d++] = String.fromCharCode(e);
    } else {
      if (191 < e && 224 > e) {
        var f = a[c++];
        b[d++] = String.fromCharCode((e & 31) << 6 | f & 63);
      } else {
        var f = a[c++], g = a[c++];
        b[d++] = String.fromCharCode((e & 15) << 12 | (f & 63) << 6 | g & 63);
      }
    }
  }
  return b.join("");
};
goog.crypt.xorByteArray = function(a, b) {
  goog.asserts.assert(a.length == b.length, "XOR array lengths must match");
  for (var c = [], d = 0;d < a.length;d++) {
    c.push(a[d] ^ b[d]);
  }
  return c;
};
// Input 75
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
  if (!goog.isArrayLike(a)) {
    throw Error("encodeByteArray takes an array as a parameter");
  }
  goog.crypt.base64.init_();
  for (var c = b ? goog.crypt.base64.byteToCharMapWebSafe_ : goog.crypt.base64.byteToCharMap_, d = [], e = 0;e < a.length;e += 3) {
    var f = a[e], g = e + 1 < a.length, k = g ? a[e + 1] : 0, m = e + 2 < a.length, l = m ? a[e + 2] : 0, p = f >> 2, f = (f & 3) << 4 | k >> 4, k = (k & 15) << 2 | l >> 6, l = l & 63;
    m || (l = 64, g || (k = 64));
    d.push(c[p], c[f], c[k], c[l]);
  }
  return d.join("");
};
goog.crypt.base64.encodeString = function(a, b) {
  return goog.crypt.base64.HAS_NATIVE_SUPPORT && !b ? goog.global.btoa(a) : goog.crypt.base64.encodeByteArray(goog.crypt.stringToByteArray(a), b);
};
goog.crypt.base64.decodeString = function(a, b) {
  return goog.crypt.base64.HAS_NATIVE_SUPPORT && !b ? goog.global.atob(a) : goog.crypt.byteArrayToString(goog.crypt.base64.decodeStringToByteArray(a, b));
};
goog.crypt.base64.decodeStringToByteArray = function(a, b) {
  goog.crypt.base64.init_();
  for (var c = b ? goog.crypt.base64.charToByteMapWebSafe_ : goog.crypt.base64.charToByteMap_, d = [], e = 0;e < a.length;) {
    var f = c[a.charAt(e++)], g = e < a.length ? c[a.charAt(e)] : 0;
    ++e;
    var k = e < a.length ? c[a.charAt(e)] : 0;
    ++e;
    var m = e < a.length ? c[a.charAt(e)] : 0;
    ++e;
    if (null == f || null == g || null == k || null == m) {
      throw Error();
    }
    d.push(f << 2 | g >> 4);
    64 != k && (d.push(g << 4 & 240 | k >> 2), 64 != m && d.push(k << 6 & 192 | m));
  }
  return d;
};
goog.crypt.base64.init_ = function() {
  if (!goog.crypt.base64.byteToCharMap_) {
    goog.crypt.base64.byteToCharMap_ = {};
    goog.crypt.base64.charToByteMap_ = {};
    goog.crypt.base64.byteToCharMapWebSafe_ = {};
    goog.crypt.base64.charToByteMapWebSafe_ = {};
    for (var a = 0;a < goog.crypt.base64.ENCODED_VALS.length;a++) {
      goog.crypt.base64.byteToCharMap_[a] = goog.crypt.base64.ENCODED_VALS.charAt(a), goog.crypt.base64.charToByteMap_[goog.crypt.base64.byteToCharMap_[a]] = a, goog.crypt.base64.byteToCharMapWebSafe_[a] = goog.crypt.base64.ENCODED_VALS_WEBSAFE.charAt(a), goog.crypt.base64.charToByteMapWebSafe_[goog.crypt.base64.byteToCharMapWebSafe_[a]] = a;
    }
  }
};
// Input 76
wtf.io.FILE_EXTENSION = ".wtf-trace";
wtf.io.getTimedFilename = function(a, b, c) {
  var d = new Date, d = "-" + d.getFullYear() + goog.string.padNumber(d.getMonth() + 1, 2) + goog.string.padNumber(d.getDate(), 2) + "T" + goog.string.padNumber(d.getHours(), 2) + goog.string.padNumber(d.getMinutes(), 2) + goog.string.padNumber(d.getSeconds(), 2), e = wtf.io.FILE_EXTENSION;
  switch(c) {
    default:
    ;
    case "application/x-extension-wtf-trace":
      e = ".wtf-trace";
      break;
    case "application/x-extension-wtf-json":
      e = ".wtf-json";
  }
  return a + b + d + e;
};
wtf.io.DataFormat = {STRING:0, BLOB:1, ARRAY_BUFFER:2};
wtf.io.HAS_TYPED_ARRAYS = !!goog.global.Uint8Array;
goog.asserts.assert(wtf.io.HAS_TYPED_ARRAYS);
wtf.io.createByteArray = function(a) {
  return new Uint8Array(a);
};
wtf.io.isByteArray = function(a) {
  return a ? a instanceof Uint8Array : !1;
};
wtf.io.createByteArrayFromArray = function(a) {
  for (var b = wtf.io.createByteArray(a.length), c = 0;c < a.length;c++) {
    b[c] = a[c] & 255;
  }
  return b;
};
wtf.io.byteArraysEqual = function(a, b) {
  if (a.length != b.length) {
    return!1;
  }
  for (var c = 0;c < a.length;c++) {
    if (a[c] != b[c]) {
      return!1;
    }
  }
  return!0;
};
wtf.io.copyByteArray = function(a, b, c) {
  b.set(a, c || 0);
};
wtf.io.combineByteArrays = function(a) {
  for (var b = 0, c = 0;c < a.length;c++) {
    b += a[c].length;
  }
  for (var b = wtf.io.createByteArray(b), d = c = 0;c < a.length;c++) {
    wtf.io.copyByteArray(a[c], b, d), d += a[c].length;
  }
  return b;
};
wtf.io.sliceByteArray = function(a, b, c) {
  if (a.buffer.slice) {
    return a = a.buffer.slice(b, b + c), new Uint8Array(a);
  }
  a = a.subarray(b, b + c);
  b = new Uint8Array(a.length);
  b.set(a);
  return b;
};
wtf.io.byteArrayToString = function(a) {
  return goog.crypt.base64.encodeByteArray(a);
};
wtf.io.stringToByteArray = function(a, b) {
  var c = goog.crypt.base64.decodeStringToByteArray(a);
  if (!c) {
    return 0;
  }
  if (c.length > b.length) {
    return-1;
  }
  for (var d = 0;d < c.length;d++) {
    b[d] = c[d];
  }
  return c.length;
};
wtf.io.stringToNewByteArray = function(a) {
  return(a = goog.crypt.base64.decodeStringToByteArray(a)) ? wtf.io.createByteArrayFromArray(a) : null;
};
wtf.io.floatConverter_ = null;
wtf.io.getFloatConverter = function() {
  if (wtf.io.floatConverter_) {
    return wtf.io.floatConverter_;
  }
  var a = new Float32Array(16), b = new Uint8Array(a.buffer), c = new Float64Array(16), d = new Uint8Array(c.buffer);
  wtf.io.floatConverter_ = {float32ToUint8Array:function(c, d, g) {
    a[0] = c;
    d[g++] = b[0];
    d[g++] = b[1];
    d[g++] = b[2];
    d[g++] = b[3];
  }, uint8ArrayToFloat32:function(c, d) {
    b[0] = c[d++];
    b[1] = c[d++];
    b[2] = c[d++];
    b[3] = c[d++];
    return a[0];
  }, float64ToUint8Array:function(a, b, g) {
    c[0] = a;
    b[g++] = d[0];
    b[g++] = d[1];
    b[g++] = d[2];
    b[g++] = d[3];
    b[g++] = d[4];
    b[g++] = d[5];
    b[g++] = d[6];
    b[g++] = d[7];
  }, uint8ArrayToFloat64:function(a, b) {
    d[0] = a[b++];
    d[1] = a[b++];
    d[2] = a[b++];
    d[3] = a[b++];
    d[4] = a[b++];
    d[5] = a[b++];
    d[6] = a[b++];
    d[7] = a[b++];
    return c[0];
  }};
  return wtf.io.floatConverter_;
};
// Input 77
wtf.io.Blob = function() {
};
wtf.io.Blob.prototype.getSize = goog.nullFunction;
wtf.io.Blob.prototype.getType = goog.nullFunction;
wtf.io.Blob.prototype.slice = goog.nullFunction;
wtf.io.Blob.prototype.close = goog.nullFunction;
wtf.io.Blob.prototype.readAsArrayBuffer = goog.nullFunction;
wtf.io.Blob.prototype.readAsText = goog.nullFunction;
wtf.io.Blob.prototype.toNative = goog.nullFunction;
wtf.io.Blob.create = function(a, b) {
  var c = wtf.NODE ? new wtf.io.NodeBlob_ : new wtf.io.BrowserBlob_;
  c.init(a, b);
  return c;
};
wtf.io.Blob.isBlob = function(a) {
  return wtf.NODE ? a instanceof wtf.io.NodeBlob_ : a instanceof wtf.io.BrowserBlob_;
};
wtf.io.Blob.fromNative = function(a) {
  return wtf.NODE ? new wtf.io.NodeBlob_(a) : new wtf.io.BrowserBlob_(a);
};
wtf.io.Blob.toNative = function(a) {
  return wtf.NODE ? a.buffer_ : a.blob_;
};
wtf.io.Blob.toNativeParts = function(a) {
  for (var b = Array(a.length), c = 0;c < a.length;c++) {
    var d = a[c];
    if (wtf.io.Blob.isBlob(d)) {
      d = wtf.io.Blob.toNative(d);
    } else {
      if (goog.userAgent.product.SAFARI && d && d.buffer instanceof ArrayBuffer) {
        for (var e = new Uint8Array(d.buffer, d.byteOffset, d.byteLength), d = new Uint8Array(d.byteLength), f = 0;f < d.byteLength;f++) {
          d[f] = e[f];
        }
        d = d.buffer;
      }
    }
    b[c] = d;
  }
  return b;
};
wtf.io.BrowserBlob_ = function(a) {
  this.blob_ = a || null;
};
wtf.io.BrowserBlob_.prototype.init = function(a, b) {
  goog.asserts.assert(!this.blob_);
  a = wtf.io.Blob.toNativeParts(a);
  this.blob_ = new Blob(a, b || {});
};
wtf.io.BrowserBlob_.prototype.getSize = function() {
  return this.blob_.size;
};
wtf.io.BrowserBlob_.prototype.getType = function() {
  return this.blob_.type;
};
wtf.io.BrowserBlob_.prototype.slice = function(a, b, c) {
  if (this.blob_.slice) {
    a = this.blob_.slice(a, b, c);
  } else {
    if (this.blob_.webkitSlice) {
      a = this.blob_.webkitSlice(a, b, c);
    } else {
      throw Error("No Blob slice method available on this browser.");
    }
  }
  return new wtf.io.BrowserBlob_(a);
};
wtf.io.BrowserBlob_.prototype.close = function() {
  this.blob_.close && this.blob_.close();
};
wtf.io.BrowserBlob_.prototype.readAsArrayBuffer = function(a, b) {
  goog.asserts.assert(this.blob_);
  if (this.blob_.size) {
    var c = new FileReader;
    c.onload = function() {
      a.call(b, c.result);
    };
    c.readAsArrayBuffer(this.blob_);
  } else {
    a.call(b, (new Uint8Array(0)).buffer);
  }
};
wtf.io.BrowserBlob_.prototype.readAsText = function(a, b) {
  goog.asserts.assert(this.blob_);
  if (this.blob_.size) {
    var c = new FileReader;
    c.onload = function() {
      a.call(b, c.result);
    };
    c.readAsText(this.blob_);
  } else {
    a.call(b, "");
  }
};
wtf.io.BrowserBlob_.prototype.toNative = function() {
  return this.blob_;
};
goog.exportProperty(wtf.io.BrowserBlob_.prototype, "toNative", wtf.io.BrowserBlob_.prototype.toNative);
wtf.io.NodeBlob_ = function(a) {
  this.buffer_ = null;
  this.contentType_ = "";
};
wtf.io.NodeBlob_.prototype.init = function(a, b) {
  goog.asserts.assert(!this.buffer_);
  if (a.length) {
    for (var c = 0, d = 0;d < a.length;d++) {
      var e = a[d];
      e instanceof ArrayBuffer ? c += e.byteLength : e.buffer && e.buffer instanceof ArrayBuffer ? c += e.byteLength : e instanceof wtf.io.NodeBlob_ ? c += e.getSize() : "string" == typeof e ? c += Buffer.byteLength(e) : goog.asserts.fail("Unknown part type in Blob constructor.");
    }
    this.buffer_ = new Buffer(c);
    for (d = c = 0;d < a.length;d++) {
      if (e = a[d], e instanceof ArrayBuffer) {
        for (var f = new Uint8Array(e), g = 0;g < f.length;g++) {
          this.buffer_[c + g] = f[g];
        }
        c += e.byteLength;
      } else {
        if (e.buffer && e.buffer instanceof ArrayBuffer) {
          for (g = 0;g < e.length;g++) {
            this.buffer_[c + g] = e[g];
          }
          c += e.byteLength;
        } else {
          e instanceof wtf.io.NodeBlob_ ? (e.buffer_.copy(this.buffer_, c), c += e.getSize()) : "string" == typeof e ? c += this.buffer_.write(e, c) : goog.asserts.fail("Unknown part type in Blob constructor.");
        }
      }
    }
  } else {
    this.buffer_ = new Buffer(0);
  }
  this.contentType_ = (b ? b.type : "") || "";
};
wtf.io.NodeBlob_.prototype.getSize = function() {
  return this.buffer_.length;
};
wtf.io.NodeBlob_.prototype.getType = function() {
  return this.contentType_;
};
wtf.io.NodeBlob_.prototype.slice = function(a, b, c) {
  var d = this.buffer_.length;
  a = goog.isDef(a) ? a : 0;
  a = 0 > a ? Math.max(d + a, 0) : Math.min(a, d);
  b = goog.isDef(b) ? b : d;
  b = 0 > b ? Math.max(d + b, 0) : Math.min(b, d);
  var d = Math.max(b - a, 0), e = new wtf.io.NodeBlob_;
  e.buffer_ = new Buffer(d);
  this.buffer_.copy(e.buffer_, 0, a, b);
  e.contentType_ = c || "";
  return e;
};
wtf.io.NodeBlob_.prototype.close = function() {
};
wtf.io.NodeBlob_.prototype.readAsArrayBuffer = function(a, b) {
  for (var c = new Uint8Array(this.buffer_.length), d = 0;d < this.buffer_.length;d++) {
    c[d] = this.buffer_[d];
  }
  a.call(b, c.buffer);
};
wtf.io.NodeBlob_.prototype.readAsText = function(a, b) {
  a.call(b, this.buffer_.toString());
};
wtf.io.NodeBlob_.prototype.toNative = function() {
  return this.buffer_;
};
goog.exportProperty(wtf.io.NodeBlob_.prototype, "toNative", wtf.io.NodeBlob_.prototype.toNative);
// Input 78
wtf.io.StringTable = function() {
  this.values_ = [];
  this.hasNullTerminators_ = !0;
};
wtf.io.StringTable.prototype.reset = function() {
  this.values_.length && (this.values_ = []);
};
wtf.io.StringTable.prototype.clone = function() {
  var a = new wtf.io.StringTable;
  a.values_ = this.values_.slice();
  a.hasNullTerminators_ = this.hasNullTerminators_;
  return a;
};
wtf.io.StringTable.prototype.addString = function(a) {
  var b = this.values_.length / 2;
  this.values_.push(a);
  this.values_.push("\x00");
  return b;
};
wtf.io.StringTable.prototype.getString = function(a) {
  if (4294967295 == a) {
    return null;
  }
  if (4294967294 == a) {
    return "";
  }
  this.hasNullTerminators_ && (a *= 2);
  return this.values_[a] || null;
};
wtf.io.StringTable.prototype.initFromJsonObject = function(a) {
  this.values_ = a ? a : [];
  this.hasNullTerminators_ = !1;
};
wtf.io.StringTable.prototype.toJsonObject = function() {
  if (this.hasNullTerminators_) {
    for (var a = Array(this.values_.length / 2), b = 0;b < a.length;b++) {
      a[b] = this.values_[2 * b];
    }
    return a;
  }
  return this.values_;
};
wtf.io.StringTable.prototype.deserialize = function(a) {
  this.values_ = a.split("\x00");
  this.hasNullTerminators_ = !1;
};
wtf.io.StringTable.prototype.serialize = function() {
  var a = this.values_;
  if (!this.hasNullTerminators_) {
    for (var a = Array(2 * this.values_.length), b = 0;b < this.values_.length;b += 2) {
      a[b] = this.values_[b], a[b + 1] = "\x00";
    }
  }
  return wtf.io.Blob.create(a);
};
goog.exportProperty(wtf.io.StringTable.prototype, "addString", wtf.io.StringTable.prototype.addString);
goog.exportProperty(wtf.io.StringTable.prototype, "getString", wtf.io.StringTable.prototype.getString);
// Input 79
wtf.io.BufferView = {};
wtf.io.BufferView.createEmpty = function(a) {
  return wtf.io.BufferView.createWithBuffer(new ArrayBuffer(a));
};
wtf.io.BufferView.createCopy = function(a) {
  var b = new Uint8Array(a.byteLength);
  b.set(a);
  return wtf.io.BufferView.createWithBuffer(b.buffer);
};
wtf.io.BufferView.createWithBuffer = function(a, b) {
  return{capacity:a.byteLength, offset:0, stringTable:b || new wtf.io.StringTable, arrayBuffer:a, int8Array:new Int8Array(a), uint8Array:new Uint8Array(a), int16Array:new Int16Array(a), uint16Array:new Uint16Array(a), int32Array:new Int32Array(a), uint32Array:new Uint32Array(a), float32Array:new Float32Array(a)};
};
wtf.io.BufferView.getUsedBytes = function(a, b) {
  return b ? a.offset == a.capacity ? a.uint8Array : new Uint8Array(a.arrayBuffer, 0, a.offset) : wtf.io.sliceByteArray(a.uint8Array, 0, a.offset);
};
wtf.io.BufferView.getCapacity = function(a) {
  return a.capacity;
};
wtf.io.BufferView.getOffset = function(a) {
  return a.offset;
};
wtf.io.BufferView.setOffset = function(a, b) {
  goog.asserts.assert(b <= a.capacity);
  a.offset = b;
};
wtf.io.BufferView.getStringTable = function(a) {
  return a.stringTable;
};
wtf.io.BufferView.setStringTable = function(a, b) {
  a.stringTable = b;
};
wtf.io.BufferView.reset = function(a) {
  a.offset = 0;
  a.stringTable.reset();
};
// Input 80
wtf.io.cff = {};
wtf.io.cff.ChunkType = {FILE_HEADER:"file_header", EVENT_DATA:"event_data", UNKNOWN:"unknown_type"};
wtf.io.cff.ChunkType.isValid = function(a) {
  switch(a) {
    case wtf.io.cff.ChunkType.FILE_HEADER:
    ;
    case wtf.io.cff.ChunkType.EVENT_DATA:
      return!0;
  }
  return!1;
};
wtf.io.cff.IntegerChunkType_ = {FILE_HEADER:1, EVENT_DATA:2, UNKNOWN:-1};
wtf.io.cff.ChunkType.toInteger = function(a) {
  switch(a) {
    case wtf.io.cff.ChunkType.FILE_HEADER:
      return wtf.io.cff.IntegerChunkType_.FILE_HEADER;
    case wtf.io.cff.ChunkType.EVENT_DATA:
      return wtf.io.cff.IntegerChunkType_.EVENT_DATA;
    default:
      return goog.asserts.fail("Unknown chunk type: " + a), wtf.io.cff.IntegerChunkType_.UNKNOWN;
  }
};
wtf.io.cff.ChunkType.fromInteger = function(a) {
  switch(a) {
    case wtf.io.cff.IntegerChunkType_.FILE_HEADER:
      return wtf.io.cff.ChunkType.FILE_HEADER;
    case wtf.io.cff.IntegerChunkType_.EVENT_DATA:
      return wtf.io.cff.ChunkType.EVENT_DATA;
    default:
      return goog.asserts.fail("Unknown chunk type: " + a), wtf.io.cff.ChunkType.UNKNOWN;
  }
};
// Input 81
wtf.io.cff.PartType = {FILE_HEADER:"file_header", JSON_EVENT_BUFFER:"json_event_buffer", LEGACY_EVENT_BUFFER:"legacy_event_buffer", BINARY_EVENT_BUFFER:"binary_event_buffer", STRING_TABLE:"string_table", BINARY_RESOURCE:"binary_resource", STRING_RESOURCE:"string_resource", UNKNOWN:"unknown_type"};
wtf.io.cff.PartType.isValid = function(a) {
  switch(a) {
    case wtf.io.cff.PartType.FILE_HEADER:
    ;
    case wtf.io.cff.PartType.JSON_EVENT_BUFFER:
    ;
    case wtf.io.cff.PartType.LEGACY_EVENT_BUFFER:
    ;
    case wtf.io.cff.PartType.BINARY_EVENT_BUFFER:
    ;
    case wtf.io.cff.PartType.STRING_TABLE:
    ;
    case wtf.io.cff.PartType.BINARY_RESOURCE:
    ;
    case wtf.io.cff.PartType.STRING_RESOURCE:
      return!0;
  }
  return!1;
};
wtf.io.cff.IntegerPartType_ = {FILE_HEADER:65536, JSON_EVENT_BUFFER:131072, LEGACY_EVENT_BUFFER:131073, BINARY_EVENT_BUFFER:131074, STRING_TABLE:196608, BINARY_RESOURCE:262144, STRING_RESOURCE:262145, UNKNOWN:-1};
wtf.io.cff.PartType.toInteger = function(a) {
  switch(a) {
    case wtf.io.cff.PartType.FILE_HEADER:
      return wtf.io.cff.IntegerPartType_.FILE_HEADER;
    case wtf.io.cff.PartType.JSON_EVENT_BUFFER:
      return wtf.io.cff.IntegerPartType_.JSON_EVENT_BUFFER;
    case wtf.io.cff.PartType.LEGACY_EVENT_BUFFER:
      return wtf.io.cff.IntegerPartType_.LEGACY_EVENT_BUFFER;
    case wtf.io.cff.PartType.BINARY_EVENT_BUFFER:
      return wtf.io.cff.IntegerPartType_.BINARY_EVENT_BUFFER;
    case wtf.io.cff.PartType.STRING_TABLE:
      return wtf.io.cff.IntegerPartType_.STRING_TABLE;
    case wtf.io.cff.PartType.BINARY_RESOURCE:
      return wtf.io.cff.IntegerPartType_.BINARY_RESOURCE;
    case wtf.io.cff.PartType.STRING_RESOURCE:
      return wtf.io.cff.IntegerPartType_.STRING_RESOURCE;
    default:
      return goog.asserts.fail("Unknown part type: " + a), wtf.io.cff.IntegerPartType_.UNKNOWN;
  }
};
wtf.io.cff.PartType.fromInteger = function(a) {
  switch(a) {
    case wtf.io.cff.IntegerPartType_.FILE_HEADER:
      return wtf.io.cff.PartType.FILE_HEADER;
    case wtf.io.cff.IntegerPartType_.JSON_EVENT_BUFFER:
      return wtf.io.cff.PartType.JSON_EVENT_BUFFER;
    case wtf.io.cff.IntegerPartType_.LEGACY_EVENT_BUFFER:
      return wtf.io.cff.PartType.LEGACY_EVENT_BUFFER;
    case wtf.io.cff.IntegerPartType_.BINARY_EVENT_BUFFER:
      return wtf.io.cff.PartType.BINARY_EVENT_BUFFER;
    case wtf.io.cff.IntegerPartType_.STRING_TABLE:
      return wtf.io.cff.PartType.STRING_TABLE;
    case wtf.io.cff.IntegerPartType_.BINARY_RESOURCE:
      return wtf.io.cff.PartType.BINARY_RESOURCE;
    case wtf.io.cff.IntegerPartType_.STRING_RESOURCE:
      return wtf.io.cff.PartType.STRING_RESOURCE;
    default:
      return goog.asserts.fail("Unknown part type: " + a), wtf.io.cff.PartType.UNKNOWN;
  }
};
// Input 82
wtf.io.ReadTransport = function() {
  wtf.events.EventEmitter.call(this);
  this.format = wtf.io.DataFormat.STRING;
  this.paused = !0;
};
goog.inherits(wtf.io.ReadTransport, wtf.events.EventEmitter);
wtf.io.ReadTransport.prototype.disposeInternal = function() {
  this.emitEndEvent();
  wtf.io.ReadTransport.superClass_.disposeInternal.call(this);
};
wtf.io.ReadTransport.prototype.getPreferredFormat = function() {
  return this.format;
};
wtf.io.ReadTransport.prototype.setPreferredFormat = function(a) {
  this.format = a;
};
wtf.io.ReadTransport.prototype.resume = function() {
  this.paused = !1;
};
wtf.io.ReadTransport.prototype.end = function() {
  goog.dispose(this);
};
wtf.io.ReadTransport.prototype.emitProgressEvent = function(a, b) {
  this.emitEvent(wtf.io.ReadTransport.EventType.PROGRESS, a, b);
};
wtf.io.ReadTransport.prototype.emitReceiveData = function(a) {
  this.emitEvent(wtf.io.ReadTransport.EventType.RECEIVE_DATA, a);
};
wtf.io.ReadTransport.prototype.emitErrorEvent = function(a) {
  this.emitEvent(wtf.io.ReadTransport.EventType.ERROR, a);
};
wtf.io.ReadTransport.prototype.emitEndEvent = function() {
  this.emitEvent(wtf.io.ReadTransport.EventType.END);
};
wtf.io.ReadTransport.EventType = {PROGRESS:goog.events.getUniqueId("progress"), RECEIVE_DATA:goog.events.getUniqueId("receive_data"), ERROR:goog.events.getUniqueId("error"), END:goog.events.getUniqueId("end")};
// Input 83
wtf.io.cff.Chunk = function(a, b) {
  this.chunkId_ = goog.isDef(a) ? a : wtf.io.cff.Chunk.nextId_++;
  this.chunkType_ = b;
  this.endTime_ = this.startTime_ = wtf.io.cff.Chunk.INVALID_TIME;
  this.parts_ = [];
};
wtf.io.cff.Chunk.INVALID_TIME = 4294967295;
wtf.io.cff.Chunk.nextId_ = 1;
wtf.io.cff.Chunk.prototype.getId = function() {
  return this.chunkId_;
};
wtf.io.cff.Chunk.prototype.getType = function() {
  return this.chunkType_;
};
wtf.io.cff.Chunk.prototype.getStartTime = function() {
  return this.startTime_;
};
wtf.io.cff.Chunk.prototype.getEndTime = function() {
  return this.endTime_;
};
wtf.io.cff.Chunk.prototype.setTimeRange = function(a, b) {
  goog.asserts.assert(a <= b);
  this.startTime_ = a;
  this.endTime_ = b;
};
wtf.io.cff.Chunk.prototype.getParts = function() {
  return this.parts_;
};
wtf.io.cff.Chunk.prototype.addPart = function(a) {
  this.parts_.push(a);
};
wtf.io.cff.Chunk.prototype.removeAllParts = function() {
  this.parts_.length = 0;
};
// Input 84
wtf.io.cff.Part = function(a) {
  this.partType_ = a;
};
wtf.io.cff.Part.prototype.getType = function() {
  return this.partType_;
};
// Input 85
wtf.io.cff.parts = {};
wtf.io.cff.parts.BinaryEventBufferPart = function(a) {
  wtf.io.cff.Part.call(this, wtf.io.cff.PartType.BINARY_EVENT_BUFFER);
  this.value_ = a || null;
};
goog.inherits(wtf.io.cff.parts.BinaryEventBufferPart, wtf.io.cff.Part);
wtf.io.cff.parts.BinaryEventBufferPart.prototype.getValue = function() {
  return this.value_;
};
wtf.io.cff.parts.BinaryEventBufferPart.prototype.setValue = function(a) {
  this.value_ = a;
};
wtf.io.cff.parts.BinaryEventBufferPart.prototype.initFromBlobData = function(a) {
  this.value_ = wtf.io.BufferView.createCopy(a);
};
wtf.io.cff.parts.BinaryEventBufferPart.prototype.toBlobData = function() {
  goog.asserts.assert(this.value_);
  return wtf.io.BufferView.getUsedBytes(this.value_, !0);
};
wtf.io.cff.parts.BinaryEventBufferPart.prototype.initFromJsonObject = function(a) {
  switch(a.mode) {
    case "base64":
      var b = wtf.io.createByteArray(a.byteLength || 0);
      wtf.io.stringToByteArray(a.value, b);
      this.value_ = wtf.io.BufferView.createWithBuffer(b.buffer);
      break;
    default:
      throw "JSON mode event data is not supported yet.";;
  }
};
wtf.io.cff.parts.BinaryEventBufferPart.prototype.toJsonObject = function() {
  goog.asserts.assert(this.value_);
  var a = wtf.io.BufferView.getUsedBytes(this.value_, !0), b = wtf.io.byteArrayToString(a);
  return{type:this.getType(), mode:"base64", byteLength:a.length, value:b};
};
// Input 86
wtf.io.cff.parts.ResourcePart = function(a) {
  wtf.io.cff.Part.call(this, a);
};
goog.inherits(wtf.io.cff.parts.ResourcePart, wtf.io.cff.Part);
wtf.io.cff.parts.StringResourcePart = function(a) {
  wtf.io.cff.parts.ResourcePart.call(this, wtf.io.cff.PartType.STRING_RESOURCE);
  this.value_ = a || null;
};
goog.inherits(wtf.io.cff.parts.StringResourcePart, wtf.io.cff.parts.ResourcePart);
wtf.io.cff.parts.StringResourcePart.prototype.getValue = function() {
  goog.asserts.assert(this.value_);
  return this.value_;
};
wtf.io.cff.parts.StringResourcePart.prototype.setValue = function(a) {
  this.value_ = a;
};
wtf.io.cff.parts.StringResourcePart.prototype.initFromBlobData = function(a) {
  var b = new goog.async.Deferred;
  wtf.io.Blob.create([a]).readAsText(function(a) {
    this.value_ = a;
    b.callback(this);
  }, this);
  return b;
};
wtf.io.cff.parts.StringResourcePart.prototype.toBlobData = function() {
  return this.value_ || "";
};
wtf.io.cff.parts.StringResourcePart.prototype.initFromJsonObject = function(a) {
  this.value_ = a.value;
};
wtf.io.cff.parts.StringResourcePart.prototype.toJsonObject = function() {
  return{type:this.getType(), value:this.value_};
};
wtf.io.cff.parts.BinaryResourcePart = function(a) {
  wtf.io.cff.parts.ResourcePart.call(this, wtf.io.cff.PartType.BINARY_RESOURCE);
  this.value_ = a || null;
};
goog.inherits(wtf.io.cff.parts.BinaryResourcePart, wtf.io.cff.parts.ResourcePart);
wtf.io.cff.parts.BinaryResourcePart.prototype.getValue = function() {
  goog.asserts.assert(this.value_);
  return this.value_;
};
wtf.io.cff.parts.BinaryResourcePart.prototype.setValue = function(a) {
  this.value_ = a;
};
wtf.io.cff.parts.BinaryResourcePart.prototype.initFromBlobData = function(a) {
  a instanceof Blob || wtf.io.Blob.isBlob(a) ? this.value_ = a : (this.value_ = new Uint8Array(a.byteLength), this.value_.set(a));
};
wtf.io.cff.parts.BinaryResourcePart.prototype.toBlobData = function() {
  goog.asserts.assert(this.value_);
  return this.value_;
};
wtf.io.cff.parts.BinaryResourcePart.prototype.initFromJsonObject = function(a) {
  switch(a.mode) {
    case "base64":
      var b = wtf.io.createByteArray(a.byteLength || 0);
      wtf.io.stringToByteArray(a.value, b);
      this.value_ = b;
      break;
    default:
      throw "JSON mode event data is not supported yet.";;
  }
};
wtf.io.cff.parts.BinaryResourcePart.prototype.toJsonObject = function() {
  goog.asserts.assert(this.value_);
  if (this.value_ instanceof Blob) {
    throw "JSON encoding of blobs not yet done.";
  }
  var a = this.value_;
  a instanceof Uint8Array || (a = new Uint8Array(a.buffer));
  var b = wtf.io.byteArrayToString(a);
  return{type:this.getType(), mode:"base64", byteLength:a.byteLength, value:b};
};
// Input 87
wtf.io.cff.parts.JsonEventBufferPart = function(a) {
  wtf.io.cff.Part.call(this, wtf.io.cff.PartType.JSON_EVENT_BUFFER);
  this.value_ = a || null;
};
goog.inherits(wtf.io.cff.parts.JsonEventBufferPart, wtf.io.cff.Part);
wtf.io.cff.parts.JsonEventBufferPart.prototype.getValue = function() {
  return this.value_;
};
wtf.io.cff.parts.JsonEventBufferPart.prototype.setValue = function(a) {
  this.value_ = a;
};
wtf.io.cff.parts.JsonEventBufferPart.prototype.initFromBlobData = function(a) {
  var b = new goog.async.Deferred;
  wtf.io.Blob.create([a]).readAsText(function(a) {
    a = a ? goog.global.JSON.parse(a) : null;
    !a || goog.isArray(a) ? (this.value_ = a, b.callback(this)) : b.errback(Error("Unable to parse event buffer JSON."));
  }, this);
  return b;
};
wtf.io.cff.parts.JsonEventBufferPart.prototype.toBlobData = function() {
  var a = goog.global.JSON.stringify(this.value_);
  return wtf.io.Blob.create([a]);
};
wtf.io.cff.parts.JsonEventBufferPart.prototype.initFromJsonObject = function(a) {
  this.value_ = a.events || null;
};
wtf.io.cff.parts.JsonEventBufferPart.prototype.toJsonObject = function() {
  goog.asserts.assert(this.value_);
  return{type:this.getType(), events:this.value_};
};
// Input 88
wtf.io.Buffer = function(a, b, c) {
  this.capacity = a;
  this.offset = 0;
  this.data = c || wtf.io.createByteArray(a);
  this.stringTable = b || null;
};
wtf.io.Buffer.ENABLE_ASSERTS = !1;
wtf.io.Buffer.prototype.clone = function(a) {
  a = goog.isDef(a) ? a : this.offset;
  a = Math.min(a, this.capacity);
  var b = this.stringTable ? this.stringTable.clone() : null;
  return new wtf.io.Buffer(a, b, wtf.io.sliceByteArray(this.data, 0, a));
};
wtf.io.Buffer.prototype.truncate = function() {
  this.data = wtf.io.sliceByteArray(this.data, 0, this.offset);
  this.capacity = this.offset;
};
wtf.io.Buffer.prototype.reset = function() {
  this.offset = 0;
  this.stringTable && this.stringTable.reset();
};
wtf.io.Buffer.prototype.ensureAvailable_ = wtf.io.Buffer.ENABLE_ASSERTS ? function(a) {
  goog.asserts.assert(this.offset + a <= this.data.length);
} : goog.nullFunction;
wtf.io.Buffer.prototype.ensureCapacity_ = wtf.io.Buffer.ENABLE_ASSERTS ? function(a) {
  goog.asserts.assert(this.offset + a <= this.capacity);
} : goog.nullFunction;
wtf.io.Buffer.prototype.readInt8 = function() {
  this.ensureAvailable_(1);
  var a = this.data[this.offset++];
  return 127 < a ? a - 256 : a;
};
wtf.io.Buffer.prototype.writeInt8 = function(a) {
  this.ensureCapacity_(1);
  this.data[this.offset++] = a & 255;
};
wtf.io.Buffer.prototype.readInt16 = function() {
  this.ensureAvailable_(2);
  var a = this.data, b = this.offset, c = a[b++], a = a[b++];
  this.offset = b;
  b = c << 8 | a;
  return 32767 < b ? b - 65536 : b;
};
wtf.io.Buffer.prototype.writeInt16 = function(a) {
  this.ensureCapacity_(2);
  var b = this.data, c = this.offset;
  b[c++] = a >>> 8 & 255;
  b[c++] = a & 255;
  this.offset = c;
};
wtf.io.Buffer.prototype.readInt32 = function() {
  this.ensureAvailable_(4);
  var a = this.data, b = this.offset, c = a[b++], d = a[b++], e = a[b++], a = a[b++];
  this.offset = b;
  b = c << 24 >>> 0 | d << 16 | e << 8 | a;
  return 2147483647 < b ? b - 4294967296 : b;
};
wtf.io.Buffer.prototype.writeInt32 = function(a) {
  this.ensureCapacity_(4);
  var b = this.data, c = this.offset;
  b[c++] = a >>> 24 & 255;
  b[c++] = a >>> 16 & 255;
  b[c++] = a >>> 8 & 255;
  b[c++] = a & 255;
  this.offset = c;
};
wtf.io.Buffer.prototype.readUint8 = function() {
  this.ensureAvailable_(1);
  return this.data[this.offset++];
};
wtf.io.Buffer.prototype.writeUint8 = function(a) {
  this.ensureCapacity_(1);
  this.data[this.offset++] = a & 255;
};
wtf.io.Buffer.prototype.readUint16 = function() {
  this.ensureAvailable_(2);
  var a = this.data, b = this.offset, c = a[b++], a = a[b++];
  this.offset = b;
  return c << 8 | a;
};
wtf.io.Buffer.prototype.writeUint16 = function(a) {
  this.ensureCapacity_(2);
  var b = this.data, c = this.offset;
  b[c++] = a >>> 8 & 255;
  b[c++] = a & 255;
  this.offset = c;
};
wtf.io.Buffer.prototype.readUint32 = function() {
  this.ensureAvailable_(4);
  var a = this.data, b = this.offset, c = a[b++], d = a[b++], e = a[b++], a = a[b++];
  this.offset = b;
  return(c << 24 >>> 0 | d << 16 | e << 8 | a) >>> 0;
};
wtf.io.Buffer.prototype.writeUint32 = function(a) {
  this.ensureCapacity_(4);
  var b = this.data, c = this.offset;
  b[c++] = a >>> 24 & 255;
  b[c++] = a >>> 16 & 255;
  b[c++] = a >>> 8 & 255;
  b[c++] = a & 255;
  this.offset = c;
};
wtf.io.Buffer.prototype.readVarUint = function() {
  this.ensureAvailable_(1);
  for (var a = 0, b = 0, c, d = this.data, e = this.offset;(c = d[e++] & 255) & 128;) {
    a |= (c & 127) << b, b += 7;
  }
  this.offset = e;
  return a | c << b;
};
wtf.io.Buffer.prototype.writeVarUint = function(a) {
  this.ensureCapacity_(5);
  a &= 4294967295;
  for (var b = this.data, c = this.offset;a & 4294967168;) {
    b[c++] = a & 127 | 128, a >>>= 7;
  }
  b[c++] = a & 127;
  this.offset = c;
};
wtf.io.Buffer.prototype.readVarInt = function() {
  var a = this.readVarUint();
  return(a << 31 >> 31 ^ a) >> 1 ^ a & -2147483648;
};
wtf.io.Buffer.prototype.writeVarInt = function(a) {
  this.writeVarUint(a << 1 ^ a >> 31);
};
wtf.io.Buffer.prototype.readUint8Array = function(a) {
  this.ensureAvailable_(4);
  var b = this.readVarUint();
  this.ensureAvailable_(b);
  a = a && a.length == b ? a : wtf.io.createByteArray(b);
  for (var c = 0;c < b;c++) {
    a[c] = this.data[this.offset++];
  }
  return a;
};
wtf.io.Buffer.prototype.writeUint8Array = function(a) {
  this.writeVarUint(a.length);
  this.ensureCapacity_(a.length);
  for (var b = 0;b < a.length;b++) {
    this.data[this.offset++] = a[b];
  }
};
wtf.io.Buffer.prototype.readFixedUint8Array = function(a) {
  this.ensureAvailable_(a.length);
  for (var b = 0;b < a.length;b++) {
    a[b] = this.data[this.offset++];
  }
  return a;
};
wtf.io.Buffer.prototype.writeFixedUint8Array = function(a) {
  this.ensureCapacity_(a.length);
  for (var b = 0;b < a.length;b++) {
    this.data[this.offset++] = a[b];
  }
};
wtf.io.Buffer.prototype.readFloat32 = function() {
  this.ensureAvailable_(4);
  var a = wtf.io.getFloatConverter().uint8ArrayToFloat32(this.data, this.offset);
  this.offset += 4;
  return a;
};
wtf.io.Buffer.prototype.writeFloat32 = function(a) {
  this.ensureCapacity_(4);
  wtf.io.getFloatConverter().float32ToUint8Array(a, this.data, this.offset);
  this.offset += 4;
};
wtf.io.Buffer.prototype.readFloat64 = function() {
  this.ensureAvailable_(8);
  var a = wtf.io.getFloatConverter().uint8ArrayToFloat64(this.data, this.offset);
  this.offset += 8;
  return a;
};
wtf.io.Buffer.prototype.writeFloat64 = function(a) {
  this.ensureCapacity_(8);
  wtf.io.getFloatConverter().float64ToUint8Array(a, this.data, this.offset);
  this.offset += 8;
};
wtf.io.Buffer.prototype.readAsciiString = function() {
  this.ensureAvailable_(2);
  var a = this.data[this.offset++], b = this.data[this.offset++], a = a << 8 | b;
  if (!a) {
    return null;
  }
  if (65535 == a) {
    return goog.asserts.assert(this.stringTable), this.stringTable.getString(this.readUint32());
  }
  for (var b = this.data, c = this.offset, d = Array(a), e = 0;e < a;e++) {
    d[e] = b[c++];
  }
  this.offset = c;
  return String.fromCharCode.apply(null, d);
};
wtf.io.Buffer.prototype.writeAsciiString = function(a) {
  if (a && a.length) {
    if (this.stringTable) {
      this.ensureCapacity_(2), this.data[this.offset++] = 255, this.data[this.offset++] = 255, this.writeUint32(this.stringTable.addString(a));
    } else {
      this.ensureCapacity_(2 + a.length);
      var b = this.data, c = this.offset;
      b[c++] = a.length >> 8 & 255;
      b[c++] = a.length & 255;
      for (var d = 0;d < a.length;d++) {
        b[c++] = a.charCodeAt(d) & 255;
      }
      this.offset = c;
    }
  } else {
    this.ensureCapacity_(2), this.data[this.offset++] = 0, this.data[this.offset++] = 0;
  }
};
wtf.io.Buffer.MAX_UTF8_STRING_BYTE_LENGTH_ = 65535;
wtf.io.Buffer.MAX_UTF8_STRING_LENGTH_ = wtf.io.Buffer.MAX_UTF8_STRING_BYTE_LENGTH_ / 3;
wtf.io.Buffer.prototype.readUtf8String = function() {
  this.ensureAvailable_(2);
  var a = this.data[this.offset++], b = this.data[this.offset++], c = a << 8 | b;
  if (!c) {
    return null;
  }
  if (65535 == c) {
    return goog.asserts.assert(this.stringTable), this.stringTable.getString(this.readUint32());
  }
  var d = this.data, e = this.offset;
  this.ensureAvailable_(2);
  a = d[e++];
  b = d[e++];
  this.ensureAvailable_(a << 8 | b);
  a = Array(c);
  for (b = 0;b < c;) {
    var f = d[e++];
    if (128 > f) {
      a[b++] = f;
    } else {
      if (191 < f && 224 > f) {
        var g = d[e++];
        a[b++] = (f & 31) << 6 | g & 63;
      } else {
        var g = d[e++], k = d[e++];
        a[b++] = (f & 15) << 12 | (g & 63) << 6 | k & 63;
      }
    }
  }
  this.offset = e;
  return String.fromCharCode.apply(null, a);
};
wtf.io.Buffer.prototype.writeUtf8String = function(a) {
  if (a && a.length) {
    if (this.stringTable) {
      this.ensureCapacity_(2), this.data[this.offset++] = 255, this.data[this.offset++] = 255, this.writeUint32(this.stringTable.addString(a));
    } else {
      goog.asserts.assert(a.length <= wtf.io.Buffer.MAX_UTF8_STRING_LENGTH_);
      a.length > wtf.io.Buffer.MAX_UTF8_STRING_LENGTH_ && (a = a.substr(0, wtf.io.Buffer.MAX_UTF8_STRING_LENGTH_));
      this.ensureCapacity_(4 + 3 * a.length);
      var b = this.data, c = this.offset;
      b[c++] = a.length >> 8 & 255;
      b[c++] = a.length & 255;
      for (var d = c, c = c + 2, e = 0, f = 0;f < a.length;f++) {
        var g = a.charCodeAt(f);
        128 > g ? (b[c++] = g, e++) : 2048 > g ? (b[c++] = g >> 6 | 192, b[c++] = g & 63 | 128, e += 2) : (b[c++] = g >> 12 | 224, b[c++] = g >> 6 & 63 | 128, b[c++] = g & 63 | 128, e += 3);
      }
      b[d] = e >> 8 & 255;
      b[d + 1] = e & 255;
      this.offset = c;
    }
  } else {
    this.ensureCapacity_(2), this.data[this.offset++] = 0, this.data[this.offset++] = 0;
  }
};
wtf.io.Buffer.getNameMap = function() {
  var a = goog.reflect.object(wtf.io.Buffer, {capacity:0, offset:1, data:2, readInt8:3, writeInt8:4, readInt16:5, writeInt16:6, readInt32:7, writeInt32:8, readUint8:9, writeUint8:10, readUint16:11, writeUint16:12, readUint32:13, writeUint32:14, readVarUint:15, writeVarUint:16, readVarInt:17, writeVarInt:18, readUint8Array:19, writeUint8Array:20, readFixedUint8Array:21, writeFixedUint8Array:22, readFloat32:23, writeFloat32:24, readFloat64:25, writeFloat64:26, readAsciiString:27, writeAsciiString:28, 
  readUtf8String:29, writeUtf8String:30}), a = goog.object.transpose(a);
  return{capacity:a[0], offset:a[1], data:a[2], readInt8:a[3], writeInt8:a[4], readInt16:a[5], writeInt16:a[6], readInt32:a[7], writeInt32:a[8], readUint8:a[9], writeUint8:a[10], readUint16:a[11], writeUint16:a[12], readUint32:a[13], writeUint32:a[14], readVarUint:a[15], writeVarUint:a[16], readVarInt:a[17], writeVarInt:a[18], readUint8Array:a[19], writeUint8Array:a[20], readFixedUint8Array:a[21], writeFixedUint8Array:a[22], readFloat32:a[23], writeFloat32:a[24], readFloat64:a[25], writeFloat64:a[26], 
  readAsciiString:a[27], writeAsciiString:a[28], readUtf8String:a[29], writeUtf8String:a[30]};
};
// Input 89
wtf.io.cff.parts.LegacyEventBufferPart = function(a) {
  wtf.io.cff.Part.call(this, wtf.io.cff.PartType.LEGACY_EVENT_BUFFER);
  this.value_ = a || null;
};
goog.inherits(wtf.io.cff.parts.LegacyEventBufferPart, wtf.io.cff.Part);
wtf.io.cff.parts.LegacyEventBufferPart.prototype.getValue = function() {
  return this.value_;
};
wtf.io.cff.parts.LegacyEventBufferPart.prototype.setValue = function(a) {
  this.value_ = a;
};
wtf.io.cff.parts.LegacyEventBufferPart.prototype.initFromBlobData = function(a) {
  this.value_ = new wtf.io.Buffer(a.byteLength);
  this.value_.data.set(a);
};
wtf.io.cff.parts.LegacyEventBufferPart.prototype.toBlobData = function() {
  return this.value_.offset != this.value_.capacity ? wtf.io.sliceByteArray(this.value_.data, 0, this.value_.offset) : this.value_.data;
};
wtf.io.cff.parts.LegacyEventBufferPart.prototype.initFromJsonObject = function(a) {
  switch(a.mode) {
    case "base64":
      var b = a.byteLength || 0, c = wtf.io.createByteArray(b);
      wtf.io.stringToByteArray(a.value, c);
      this.value_ = new wtf.io.Buffer(b, void 0, c);
      break;
    default:
      throw "JSON mode event data is not supported yet.";;
  }
};
wtf.io.cff.parts.LegacyEventBufferPart.prototype.toJsonObject = function() {
  goog.asserts.assert(this.value_);
  var a = wtf.io.sliceByteArray(this.value_.data, 0, this.value_.offset), b = wtf.io.byteArrayToString(a);
  return{type:this.getType(), mode:"base64", byteLength:a.length, value:b};
};
// Input 90
wtf.io.cff.parts.StringTablePart = function(a) {
  wtf.io.cff.Part.call(this, wtf.io.cff.PartType.STRING_TABLE);
  this.value_ = a || null;
};
goog.inherits(wtf.io.cff.parts.StringTablePart, wtf.io.cff.Part);
wtf.io.cff.parts.StringTablePart.prototype.getValue = function() {
  return this.value_;
};
wtf.io.cff.parts.StringTablePart.prototype.setValue = function(a) {
  this.value_ = a;
};
wtf.io.cff.parts.StringTablePart.prototype.initFromBlobData = function(a) {
  var b = new goog.async.Deferred;
  wtf.io.Blob.create([a]).readAsText(function(a) {
    this.value_ = new wtf.io.StringTable;
    a && this.value_.deserialize(a);
    b.callback(this);
  }, this);
  return b;
};
wtf.io.cff.parts.StringTablePart.prototype.toBlobData = function() {
  return this.value_.serialize();
};
wtf.io.cff.parts.StringTablePart.prototype.initFromJsonObject = function(a) {
  this.value_ = new wtf.io.StringTable;
  this.value_.initFromJsonObject(a.value);
};
wtf.io.cff.parts.StringTablePart.prototype.toJsonObject = function() {
  goog.asserts.assert(this.value_);
  return{type:this.getType(), value:this.value_.toJsonObject()};
};
// Input 91
wtf.io.cff.chunks = {};
wtf.io.cff.chunks.EventDataChunk = function(a) {
  wtf.io.cff.Chunk.call(this, a, wtf.io.cff.ChunkType.EVENT_DATA);
  this.stringTablePart_ = this.eventBufferPart_ = null;
  this.resourceParts_ = [];
};
goog.inherits(wtf.io.cff.chunks.EventDataChunk, wtf.io.cff.Chunk);
wtf.io.cff.chunks.EventDataChunk.prototype.load = function(a) {
  goog.asserts.assert(!this.eventBufferPart_);
  for (var b = 0;b < a.length;b++) {
    var c = a[b];
    this.addPart(c);
    switch(c.getType()) {
      case wtf.io.cff.PartType.STRING_TABLE:
        this.stringTablePart_ = c;
        break;
      case wtf.io.cff.PartType.JSON_EVENT_BUFFER:
        this.eventBufferPart_ = c;
        break;
      case wtf.io.cff.PartType.LEGACY_EVENT_BUFFER:
        this.eventBufferPart_ = c;
        break;
      case wtf.io.cff.PartType.BINARY_EVENT_BUFFER:
        this.eventBufferPart_ = c;
        break;
      case wtf.io.cff.PartType.STRING_RESOURCE:
        this.resourceParts_.push(c);
        break;
      case wtf.io.cff.PartType.BINARY_RESOURCE:
        this.resourceParts_.push(c);
        break;
      default:
        throw goog.asserts.fail("Unknown part type: " + c.getType()), Error("Unknown part type " + c.getType() + " in chunk.");;
    }
  }
  goog.asserts.assert(this.eventBufferPart_);
  if (!this.eventBufferPart_) {
    throw Error("No event buffer data found in event data chunk.");
  }
  this.stringTablePart_ && this.eventBufferPart_ instanceof wtf.io.cff.parts.BinaryEventBufferPart && (a = this.eventBufferPart_.getValue(), goog.asserts.assert(a), b = this.stringTablePart_.getValue(), goog.asserts.assert(b), wtf.io.BufferView.setStringTable(a, b));
};
wtf.io.cff.chunks.EventDataChunk.prototype.init = function(a) {
  var b = !0;
  if (this.eventBufferPart_) {
    goog.asserts.assert(this.eventBufferPart_ instanceof wtf.io.cff.parts.BinaryEventBufferPart);
    var c = this.eventBufferPart_.getValue();
    goog.asserts.assert(c);
    wtf.io.BufferView.getCapacity(c) == a && (wtf.io.BufferView.reset(c), b = !1);
  }
  b && (c = wtf.io.BufferView.createEmpty(a), this.eventBufferPart_ = new wtf.io.cff.parts.BinaryEventBufferPart(c), a = wtf.io.BufferView.getStringTable(c), this.stringTablePart_ = new wtf.io.cff.parts.StringTablePart(a));
  this.removeAllParts();
  goog.asserts.assert(this.stringTablePart_);
  this.addPart(this.stringTablePart_);
  goog.asserts.assert(this.eventBufferPart_);
  this.addPart(this.eventBufferPart_);
};
wtf.io.cff.chunks.EventDataChunk.prototype.getEventData = function() {
  goog.asserts.assert(this.eventBufferPart_);
  return this.eventBufferPart_;
};
wtf.io.cff.chunks.EventDataChunk.prototype.getBinaryBuffer = function() {
  goog.asserts.assert(this.eventBufferPart_);
  goog.asserts.assert(this.eventBufferPart_ instanceof wtf.io.cff.parts.BinaryEventBufferPart);
  var a = this.eventBufferPart_.getValue();
  goog.asserts.assert(a);
  return a;
};
wtf.io.cff.chunks.EventDataChunk.prototype.addResource = function(a) {
  a = "string" == typeof a ? new wtf.io.cff.parts.StringResourcePart(a) : new wtf.io.cff.parts.BinaryResourcePart(a);
  this.addPart(a);
  this.resourceParts_.push(a);
  return this.resourceParts_.length;
};
wtf.io.cff.chunks.EventDataChunk.prototype.getResource = function(a) {
  return(a = this.resourceParts_[a]) ? a.getValue() : null;
};
wtf.io.cff.chunks.EventDataChunk.prototype.reset = function() {
  this.removeAllParts();
  this.resourceParts_ = [];
  this.stringTablePart_ && this.addPart(this.stringTablePart_);
  if (this.eventBufferPart_) {
    var a = this.eventBufferPart_;
    this.addPart(a);
    a instanceof wtf.io.cff.parts.BinaryEventBufferPart ? (a = a.getValue(), goog.asserts.assert(a), wtf.io.BufferView.reset(a)) : a instanceof wtf.io.cff.parts.JsonEventBufferPart ? a.setValue([]) : a instanceof wtf.io.cff.parts.LegacyEventBufferPart && a.getValue().reset();
  }
};
// Input 92
goog.structs = {};
goog.structs.getCount = function(a) {
  return "function" == typeof a.getCount ? a.getCount() : goog.isArrayLike(a) || goog.isString(a) ? a.length : goog.object.getCount(a);
};
goog.structs.getValues = function(a) {
  if ("function" == typeof a.getValues) {
    return a.getValues();
  }
  if (goog.isString(a)) {
    return a.split("");
  }
  if (goog.isArrayLike(a)) {
    for (var b = [], c = a.length, d = 0;d < c;d++) {
      b.push(a[d]);
    }
    return b;
  }
  return goog.object.getValues(a);
};
goog.structs.getKeys = function(a) {
  if ("function" == typeof a.getKeys) {
    return a.getKeys();
  }
  if ("function" != typeof a.getValues) {
    if (goog.isArrayLike(a) || goog.isString(a)) {
      var b = [];
      a = a.length;
      for (var c = 0;c < a;c++) {
        b.push(c);
      }
      return b;
    }
    return goog.object.getKeys(a);
  }
};
goog.structs.contains = function(a, b) {
  return "function" == typeof a.contains ? a.contains(b) : "function" == typeof a.containsValue ? a.containsValue(b) : goog.isArrayLike(a) || goog.isString(a) ? goog.array.contains(a, b) : goog.object.containsValue(a, b);
};
goog.structs.isEmpty = function(a) {
  return "function" == typeof a.isEmpty ? a.isEmpty() : goog.isArrayLike(a) || goog.isString(a) ? goog.array.isEmpty(a) : goog.object.isEmpty(a);
};
goog.structs.clear = function(a) {
  "function" == typeof a.clear ? a.clear() : goog.isArrayLike(a) ? goog.array.clear(a) : goog.object.clear(a);
};
goog.structs.forEach = function(a, b, c) {
  if ("function" == typeof a.forEach) {
    a.forEach(b, c);
  } else {
    if (goog.isArrayLike(a) || goog.isString(a)) {
      goog.array.forEach(a, b, c);
    } else {
      for (var d = goog.structs.getKeys(a), e = goog.structs.getValues(a), f = e.length, g = 0;g < f;g++) {
        b.call(c, e[g], d && d[g], a);
      }
    }
  }
};
goog.structs.filter = function(a, b, c) {
  if ("function" == typeof a.filter) {
    return a.filter(b, c);
  }
  if (goog.isArrayLike(a) || goog.isString(a)) {
    return goog.array.filter(a, b, c);
  }
  var d, e = goog.structs.getKeys(a), f = goog.structs.getValues(a), g = f.length;
  if (e) {
    d = {};
    for (var k = 0;k < g;k++) {
      b.call(c, f[k], e[k], a) && (d[e[k]] = f[k]);
    }
  } else {
    for (d = [], k = 0;k < g;k++) {
      b.call(c, f[k], void 0, a) && d.push(f[k]);
    }
  }
  return d;
};
goog.structs.map = function(a, b, c) {
  if ("function" == typeof a.map) {
    return a.map(b, c);
  }
  if (goog.isArrayLike(a) || goog.isString(a)) {
    return goog.array.map(a, b, c);
  }
  var d, e = goog.structs.getKeys(a), f = goog.structs.getValues(a), g = f.length;
  if (e) {
    d = {};
    for (var k = 0;k < g;k++) {
      d[e[k]] = b.call(c, f[k], e[k], a);
    }
  } else {
    for (d = [], k = 0;k < g;k++) {
      d[k] = b.call(c, f[k], void 0, a);
    }
  }
  return d;
};
goog.structs.some = function(a, b, c) {
  if ("function" == typeof a.some) {
    return a.some(b, c);
  }
  if (goog.isArrayLike(a) || goog.isString(a)) {
    return goog.array.some(a, b, c);
  }
  for (var d = goog.structs.getKeys(a), e = goog.structs.getValues(a), f = e.length, g = 0;g < f;g++) {
    if (b.call(c, e[g], d && d[g], a)) {
      return!0;
    }
  }
  return!1;
};
goog.structs.every = function(a, b, c) {
  if ("function" == typeof a.every) {
    return a.every(b, c);
  }
  if (goog.isArrayLike(a) || goog.isString(a)) {
    return goog.array.every(a, b, c);
  }
  for (var d = goog.structs.getKeys(a), e = goog.structs.getValues(a), f = e.length, g = 0;g < f;g++) {
    if (!b.call(c, e[g], d && d[g], a)) {
      return!1;
    }
  }
  return!0;
};
// Input 93
goog.iter = {};
goog.iter.StopIteration = "StopIteration" in goog.global ? goog.global.StopIteration : Error("StopIteration");
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function(a) {
  return this;
};
goog.iter.toIterator = function(a) {
  if (a instanceof goog.iter.Iterator) {
    return a;
  }
  if ("function" == typeof a.__iterator__) {
    return a.__iterator__(!1);
  }
  if (goog.isArrayLike(a)) {
    var b = 0, c = new goog.iter.Iterator;
    c.next = function() {
      for (;;) {
        if (b >= a.length) {
          throw goog.iter.StopIteration;
        }
        if (b in a) {
          return a[b++];
        }
        b++;
      }
    };
    return c;
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(a, b, c) {
  if (goog.isArrayLike(a)) {
    try {
      goog.array.forEach(a, b, c);
    } catch (d) {
      if (d !== goog.iter.StopIteration) {
        throw d;
      }
    }
  } else {
    a = goog.iter.toIterator(a);
    try {
      for (;;) {
        b.call(c, a.next(), void 0, a);
      }
    } catch (e) {
      if (e !== goog.iter.StopIteration) {
        throw e;
      }
    }
  }
};
goog.iter.filter = function(a, b, c) {
  var d = goog.iter.toIterator(a);
  a = new goog.iter.Iterator;
  a.next = function() {
    for (;;) {
      var a = d.next();
      if (b.call(c, a, void 0, d)) {
        return a;
      }
    }
  };
  return a;
};
goog.iter.range = function(a, b, c) {
  var d = 0, e = a, f = c || 1;
  1 < arguments.length && (d = a, e = b);
  if (0 == f) {
    throw Error("Range step argument must not be zero");
  }
  var g = new goog.iter.Iterator;
  g.next = function() {
    if (0 < f && d >= e || 0 > f && d <= e) {
      throw goog.iter.StopIteration;
    }
    var a = d;
    d += f;
    return a;
  };
  return g;
};
goog.iter.join = function(a, b) {
  return goog.iter.toArray(a).join(b);
};
goog.iter.map = function(a, b, c) {
  var d = goog.iter.toIterator(a);
  a = new goog.iter.Iterator;
  a.next = function() {
    for (;;) {
      var a = d.next();
      return b.call(c, a, void 0, d);
    }
  };
  return a;
};
goog.iter.reduce = function(a, b, c, d) {
  var e = c;
  goog.iter.forEach(a, function(a) {
    e = b.call(d, e, a);
  });
  return e;
};
goog.iter.some = function(a, b, c) {
  a = goog.iter.toIterator(a);
  try {
    for (;;) {
      if (b.call(c, a.next(), void 0, a)) {
        return!0;
      }
    }
  } catch (d) {
    if (d !== goog.iter.StopIteration) {
      throw d;
    }
  }
  return!1;
};
goog.iter.every = function(a, b, c) {
  a = goog.iter.toIterator(a);
  try {
    for (;;) {
      if (!b.call(c, a.next(), void 0, a)) {
        return!1;
      }
    }
  } catch (d) {
    if (d !== goog.iter.StopIteration) {
      throw d;
    }
  }
  return!0;
};
goog.iter.chain = function(a) {
  var b = goog.iter.toIterator(arguments), c = new goog.iter.Iterator, d = null;
  c.next = function() {
    for (;;) {
      if (null == d) {
        var a = b.next();
        d = goog.iter.toIterator(a);
      }
      try {
        return d.next();
      } catch (c) {
        if (c !== goog.iter.StopIteration) {
          throw c;
        }
        d = null;
      }
    }
  };
  return c;
};
goog.iter.chainFromIterable = function(a) {
  return goog.iter.chain.apply(void 0, a);
};
goog.iter.dropWhile = function(a, b, c) {
  var d = goog.iter.toIterator(a);
  a = new goog.iter.Iterator;
  var e = !0;
  a.next = function() {
    for (;;) {
      var a = d.next();
      if (!e || !b.call(c, a, void 0, d)) {
        return e = !1, a;
      }
    }
  };
  return a;
};
goog.iter.takeWhile = function(a, b, c) {
  var d = goog.iter.toIterator(a);
  a = new goog.iter.Iterator;
  var e = !0;
  a.next = function() {
    for (;;) {
      if (e) {
        var a = d.next();
        if (b.call(c, a, void 0, d)) {
          return a;
        }
        e = !1;
      } else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return a;
};
goog.iter.toArray = function(a) {
  if (goog.isArrayLike(a)) {
    return goog.array.toArray(a);
  }
  a = goog.iter.toIterator(a);
  var b = [];
  goog.iter.forEach(a, function(a) {
    b.push(a);
  });
  return b;
};
goog.iter.equals = function(a, b) {
  var c = goog.iter.zipLongest({}, a, b);
  return goog.iter.every(c, function(a) {
    return a[0] == a[1];
  });
};
goog.iter.nextOrValue = function(a, b) {
  try {
    return goog.iter.toIterator(a).next();
  } catch (c) {
    if (c != goog.iter.StopIteration) {
      throw c;
    }
    return b;
  }
};
goog.iter.product = function(a) {
  if (goog.array.some(arguments, function(a) {
    return!a.length;
  }) || !arguments.length) {
    return new goog.iter.Iterator;
  }
  var b = new goog.iter.Iterator, c = arguments, d = goog.array.repeat(0, c.length);
  b.next = function() {
    if (d) {
      for (var a = goog.array.map(d, function(a, b) {
        return c[b][a];
      }), b = d.length - 1;0 <= b;b--) {
        goog.asserts.assert(d);
        if (d[b] < c[b].length - 1) {
          d[b]++;
          break;
        }
        if (0 == b) {
          d = null;
          break;
        }
        d[b] = 0;
      }
      return a;
    }
    throw goog.iter.StopIteration;
  };
  return b;
};
goog.iter.cycle = function(a) {
  var b = goog.iter.toIterator(a), c = [], d = 0;
  a = new goog.iter.Iterator;
  var e = !1;
  a.next = function() {
    var a = null;
    if (!e) {
      try {
        return a = b.next(), c.push(a), a;
      } catch (g) {
        if (g != goog.iter.StopIteration || goog.array.isEmpty(c)) {
          throw g;
        }
        e = !0;
      }
    }
    a = c[d];
    d = (d + 1) % c.length;
    return a;
  };
  return a;
};
goog.iter.count = function(a, b) {
  var c = a || 0, d = goog.isDef(b) ? b : 1, e = new goog.iter.Iterator;
  e.next = function() {
    var a = c;
    c += d;
    return a;
  };
  return e;
};
goog.iter.repeat = function(a) {
  var b = new goog.iter.Iterator;
  b.next = goog.functions.constant(a);
  return b;
};
goog.iter.accumulate = function(a) {
  var b = goog.iter.toIterator(a), c = 0;
  a = new goog.iter.Iterator;
  a.next = function() {
    return c += b.next();
  };
  return a;
};
goog.iter.zip = function(a) {
  var b = arguments, c = new goog.iter.Iterator;
  if (0 < b.length) {
    var d = goog.array.map(b, goog.iter.toIterator);
    c.next = function() {
      return goog.array.map(d, function(a) {
        return a.next();
      });
    };
  }
  return c;
};
goog.iter.zipLongest = function(a, b) {
  var c = goog.array.slice(arguments, 1), d = new goog.iter.Iterator;
  if (0 < c.length) {
    var e = goog.array.map(c, goog.iter.toIterator);
    d.next = function() {
      var b = !1, c = goog.array.map(e, function(c) {
        var d;
        try {
          d = c.next(), b = !0;
        } catch (e) {
          if (e !== goog.iter.StopIteration) {
            throw e;
          }
          d = a;
        }
        return d;
      });
      if (!b) {
        throw goog.iter.StopIteration;
      }
      return c;
    };
  }
  return d;
};
goog.iter.compress = function(a, b) {
  var c = goog.iter.toIterator(b);
  return goog.iter.filter(a, function() {
    return!!c.next();
  });
};
goog.iter.GroupByIterator_ = function(a, b) {
  this.iterator = goog.iter.toIterator(a);
  this.keyFunc = b || goog.functions.identity;
};
goog.inherits(goog.iter.GroupByIterator_, goog.iter.Iterator);
goog.iter.GroupByIterator_.prototype.next = function() {
  for (;this.currentKey == this.targetKey;) {
    this.currentValue = this.iterator.next(), this.currentKey = this.keyFunc(this.currentValue);
  }
  this.targetKey = this.currentKey;
  return[this.currentKey, this.groupItems_(this.targetKey)];
};
goog.iter.GroupByIterator_.prototype.groupItems_ = function(a) {
  for (var b = [];this.currentKey == a;) {
    b.push(this.currentValue);
    try {
      this.currentValue = this.iterator.next();
    } catch (c) {
      if (c !== goog.iter.StopIteration) {
        throw c;
      }
      break;
    }
    this.currentKey = this.keyFunc(this.currentValue);
  }
  return b;
};
goog.iter.groupBy = function(a, b) {
  return new goog.iter.GroupByIterator_(a, b);
};
goog.iter.tee = function(a, b) {
  var c = goog.iter.toIterator(a), d = goog.isNumber(b) ? b : 2, e = goog.array.map(goog.array.range(d), function() {
    return[];
  }), f = function() {
    var a = c.next();
    goog.array.forEach(e, function(b) {
      b.push(a);
    });
  };
  return goog.array.map(e, function(a) {
    var b = new goog.iter.Iterator;
    b.next = function() {
      goog.array.isEmpty(a) && f();
      goog.asserts.assert(!goog.array.isEmpty(a));
      return a.shift();
    };
    return b;
  });
};
goog.iter.enumerate = function(a, b) {
  return goog.iter.zip(goog.iter.count(b), a);
};
goog.iter.limit = function(a, b) {
  goog.asserts.assert(goog.math.isInt(b) && 0 <= b);
  var c = goog.iter.toIterator(a), d = new goog.iter.Iterator, e = b;
  d.next = function() {
    if (0 < e--) {
      return c.next();
    }
    throw goog.iter.StopIteration;
  };
  return d;
};
goog.iter.consume = function(a, b) {
  goog.asserts.assert(goog.math.isInt(b) && 0 <= b);
  for (var c = goog.iter.toIterator(a);0 < b--;) {
    goog.iter.nextOrValue(c, null);
  }
  return c;
};
goog.iter.slice = function(a, b, c) {
  goog.asserts.assert(goog.math.isInt(b) && 0 <= b);
  a = goog.iter.consume(a, b);
  goog.isNumber(c) && (goog.asserts.assert(goog.math.isInt(c) && c >= b), a = goog.iter.limit(a, c - b));
  return a;
};
goog.iter.hasDuplicates_ = function(a) {
  var b = [];
  goog.array.removeDuplicates(a, b);
  return a.length != b.length;
};
goog.iter.permutations = function(a, b) {
  var c = goog.iter.toArray(a), d = goog.isNumber(b) ? b : c.length, c = goog.array.repeat(c, d), c = goog.iter.product.apply(void 0, c);
  return goog.iter.filter(c, function(a) {
    return!goog.iter.hasDuplicates_(a);
  });
};
goog.iter.combinations = function(a, b) {
  function c(a) {
    return d[a];
  }
  var d = goog.iter.toArray(a), e = goog.iter.range(d.length), e = goog.iter.permutations(e, b), f = goog.iter.filter(e, function(a) {
    return goog.array.isSorted(a);
  }), e = new goog.iter.Iterator;
  e.next = function() {
    return goog.array.map(f.next(), c);
  };
  return e;
};
goog.iter.combinationsWithReplacement = function(a, b) {
  function c(a) {
    return d[a];
  }
  var d = goog.iter.toArray(a), e = goog.array.range(d.length), e = goog.array.repeat(e, b), e = goog.iter.product.apply(void 0, e), f = goog.iter.filter(e, function(a) {
    return goog.array.isSorted(a);
  }), e = new goog.iter.Iterator;
  e.next = function() {
    return goog.array.map(f.next(), c);
  };
  return e;
};
// Input 94
goog.structs.Map = function(a, b) {
  this.map_ = {};
  this.keys_ = [];
  this.version_ = this.count_ = 0;
  var c = arguments.length;
  if (1 < c) {
    if (c % 2) {
      throw Error("Uneven number of arguments");
    }
    for (var d = 0;d < c;d += 2) {
      this.set(arguments[d], arguments[d + 1]);
    }
  } else {
    a && this.addAll(a);
  }
};
goog.structs.Map.prototype.getCount = function() {
  return this.count_;
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  for (var a = [], b = 0;b < this.keys_.length;b++) {
    a.push(this.map_[this.keys_[b]]);
  }
  return a;
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat();
};
goog.structs.Map.prototype.containsKey = function(a) {
  return goog.structs.Map.hasKey_(this.map_, a);
};
goog.structs.Map.prototype.containsValue = function(a) {
  for (var b = 0;b < this.keys_.length;b++) {
    var c = this.keys_[b];
    if (goog.structs.Map.hasKey_(this.map_, c) && this.map_[c] == a) {
      return!0;
    }
  }
  return!1;
};
goog.structs.Map.prototype.equals = function(a, b) {
  if (this === a) {
    return!0;
  }
  if (this.count_ != a.getCount()) {
    return!1;
  }
  var c = b || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for (var d, e = 0;d = this.keys_[e];e++) {
    if (!c(this.get(d), a.get(d))) {
      return!1;
    }
  }
  return!0;
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b;
};
goog.structs.Map.prototype.isEmpty = function() {
  return 0 == this.count_;
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.version_ = this.count_ = this.keys_.length = 0;
};
goog.structs.Map.prototype.remove = function(a) {
  return goog.structs.Map.hasKey_(this.map_, a) ? (delete this.map_[a], this.count_--, this.version_++, this.keys_.length > 2 * this.count_ && this.cleanupKeysArray_(), !0) : !1;
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if (this.count_ != this.keys_.length) {
    for (var a = 0, b = 0;a < this.keys_.length;) {
      var c = this.keys_[a];
      goog.structs.Map.hasKey_(this.map_, c) && (this.keys_[b++] = c);
      a++;
    }
    this.keys_.length = b;
  }
  if (this.count_ != this.keys_.length) {
    for (var d = {}, b = a = 0;a < this.keys_.length;) {
      c = this.keys_[a], goog.structs.Map.hasKey_(d, c) || (this.keys_[b++] = c, d[c] = 1), a++;
    }
    this.keys_.length = b;
  }
};
goog.structs.Map.prototype.get = function(a, b) {
  return goog.structs.Map.hasKey_(this.map_, a) ? this.map_[a] : b;
};
goog.structs.Map.prototype.set = function(a, b) {
  goog.structs.Map.hasKey_(this.map_, a) || (this.count_++, this.keys_.push(a), this.version_++);
  this.map_[a] = b;
};
goog.structs.Map.prototype.addAll = function(a) {
  var b;
  a instanceof goog.structs.Map ? (b = a.getKeys(), a = a.getValues()) : (b = goog.object.getKeys(a), a = goog.object.getValues(a));
  for (var c = 0;c < b.length;c++) {
    this.set(b[c], a[c]);
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this);
};
goog.structs.Map.prototype.transpose = function() {
  for (var a = new goog.structs.Map, b = 0;b < this.keys_.length;b++) {
    var c = this.keys_[b];
    a.set(this.map_[c], c);
  }
  return a;
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  for (var a = {}, b = 0;b < this.keys_.length;b++) {
    var c = this.keys_[b];
    a[c] = this.map_[c];
  }
  return a;
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(!0);
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(!1);
};
goog.structs.Map.prototype.__iterator__ = function(a) {
  this.cleanupKeysArray_();
  var b = 0, c = this.keys_, d = this.map_, e = this.version_, f = this, g = new goog.iter.Iterator;
  g.next = function() {
    for (;;) {
      if (e != f.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if (b >= c.length) {
        throw goog.iter.StopIteration;
      }
      var g = c[b++];
      return a ? g : d[g];
    }
  };
  return g;
};
goog.structs.Map.hasKey_ = function(a, b) {
  return Object.prototype.hasOwnProperty.call(a, b);
};
// Input 95
goog.uri = {};
goog.uri.utils = {};
goog.uri.utils.CharCode_ = {AMPERSAND:38, EQUAL:61, HASH:35, QUESTION:63};
goog.uri.utils.buildFromEncodedParts = function(a, b, c, d, e, f, g) {
  var k = "";
  a && (k += a + ":");
  c && (k += "//", b && (k += b + "@"), k += c, d && (k += ":" + d));
  e && (k += e);
  f && (k += "?" + f);
  g && (k += "#" + g);
  return k;
};
goog.uri.utils.splitRe_ = RegExp("^(?:([^:/?#.]+):)?(?://(?:([^/?#]*)@)?([^/#?]*?)(?::([0-9]+))?(?=[/#?]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#(.*))?$");
goog.uri.utils.ComponentIndex = {SCHEME:1, USER_INFO:2, DOMAIN:3, PORT:4, PATH:5, QUERY_DATA:6, FRAGMENT:7};
goog.uri.utils.split = function(a) {
  goog.uri.utils.phishingProtection_();
  return a.match(goog.uri.utils.splitRe_);
};
goog.uri.utils.needsPhishingProtection_ = goog.userAgent.WEBKIT;
goog.uri.utils.phishingProtection_ = function() {
  if (goog.uri.utils.needsPhishingProtection_) {
    goog.uri.utils.needsPhishingProtection_ = !1;
    var a = goog.global.location;
    if (a) {
      var b = a.href;
      if (b && (b = goog.uri.utils.getDomain(b)) && b != a.hostname) {
        throw goog.uri.utils.needsPhishingProtection_ = !0, Error();
      }
    }
  }
};
goog.uri.utils.decodeIfPossible_ = function(a) {
  return a && decodeURIComponent(a);
};
goog.uri.utils.getComponentByIndex_ = function(a, b) {
  return goog.uri.utils.split(b)[a] || null;
};
goog.uri.utils.getScheme = function(a) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.SCHEME, a);
};
goog.uri.utils.getEffectiveScheme = function(a) {
  a = goog.uri.utils.getScheme(a);
  !a && self.location && (a = self.location.protocol, a = a.substr(0, a.length - 1));
  return a ? a.toLowerCase() : "";
};
goog.uri.utils.getUserInfoEncoded = function(a) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.USER_INFO, a);
};
goog.uri.utils.getUserInfo = function(a) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getUserInfoEncoded(a));
};
goog.uri.utils.getDomainEncoded = function(a) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.DOMAIN, a);
};
goog.uri.utils.getDomain = function(a) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getDomainEncoded(a));
};
goog.uri.utils.getPort = function(a) {
  return Number(goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PORT, a)) || null;
};
goog.uri.utils.getPathEncoded = function(a) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PATH, a);
};
goog.uri.utils.getPath = function(a) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getPathEncoded(a));
};
goog.uri.utils.getQueryData = function(a) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.QUERY_DATA, a);
};
goog.uri.utils.getFragmentEncoded = function(a) {
  var b = a.indexOf("#");
  return 0 > b ? null : a.substr(b + 1);
};
goog.uri.utils.setFragmentEncoded = function(a, b) {
  return goog.uri.utils.removeFragment(a) + (b ? "#" + b : "");
};
goog.uri.utils.getFragment = function(a) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getFragmentEncoded(a));
};
goog.uri.utils.getHost = function(a) {
  a = goog.uri.utils.split(a);
  return goog.uri.utils.buildFromEncodedParts(a[goog.uri.utils.ComponentIndex.SCHEME], a[goog.uri.utils.ComponentIndex.USER_INFO], a[goog.uri.utils.ComponentIndex.DOMAIN], a[goog.uri.utils.ComponentIndex.PORT]);
};
goog.uri.utils.getPathAndAfter = function(a) {
  a = goog.uri.utils.split(a);
  return goog.uri.utils.buildFromEncodedParts(null, null, null, null, a[goog.uri.utils.ComponentIndex.PATH], a[goog.uri.utils.ComponentIndex.QUERY_DATA], a[goog.uri.utils.ComponentIndex.FRAGMENT]);
};
goog.uri.utils.removeFragment = function(a) {
  var b = a.indexOf("#");
  return 0 > b ? a : a.substr(0, b);
};
goog.uri.utils.haveSameDomain = function(a, b) {
  var c = goog.uri.utils.split(a), d = goog.uri.utils.split(b);
  return c[goog.uri.utils.ComponentIndex.DOMAIN] == d[goog.uri.utils.ComponentIndex.DOMAIN] && c[goog.uri.utils.ComponentIndex.SCHEME] == d[goog.uri.utils.ComponentIndex.SCHEME] && c[goog.uri.utils.ComponentIndex.PORT] == d[goog.uri.utils.ComponentIndex.PORT];
};
goog.uri.utils.assertNoFragmentsOrQueries_ = function(a) {
  if (goog.DEBUG && (0 <= a.indexOf("#") || 0 <= a.indexOf("?"))) {
    throw Error("goog.uri.utils: Fragment or query identifiers are not supported: [" + a + "]");
  }
};
goog.uri.utils.appendQueryData_ = function(a) {
  if (a[1]) {
    var b = a[0], c = b.indexOf("#");
    0 <= c && (a.push(b.substr(c)), a[0] = b = b.substr(0, c));
    c = b.indexOf("?");
    0 > c ? a[1] = "?" : c == b.length - 1 && (a[1] = void 0);
  }
  return a.join("");
};
goog.uri.utils.appendKeyValuePairs_ = function(a, b, c) {
  if (goog.isArray(b)) {
    goog.asserts.assertArray(b);
    for (var d = 0;d < b.length;d++) {
      goog.uri.utils.appendKeyValuePairs_(a, String(b[d]), c);
    }
  } else {
    null != b && c.push("&", a, "" === b ? "" : "=", goog.string.urlEncode(b));
  }
};
goog.uri.utils.buildQueryDataBuffer_ = function(a, b, c) {
  goog.asserts.assert(0 == Math.max(b.length - (c || 0), 0) % 2, "goog.uri.utils: Key/value lists must be even in length.");
  for (c = c || 0;c < b.length;c += 2) {
    goog.uri.utils.appendKeyValuePairs_(b[c], b[c + 1], a);
  }
  return a;
};
goog.uri.utils.buildQueryData = function(a, b) {
  var c = goog.uri.utils.buildQueryDataBuffer_([], a, b);
  c[0] = "";
  return c.join("");
};
goog.uri.utils.buildQueryDataBufferFromMap_ = function(a, b) {
  for (var c in b) {
    goog.uri.utils.appendKeyValuePairs_(c, b[c], a);
  }
  return a;
};
goog.uri.utils.buildQueryDataFromMap = function(a) {
  a = goog.uri.utils.buildQueryDataBufferFromMap_([], a);
  a[0] = "";
  return a.join("");
};
goog.uri.utils.appendParams = function(a, b) {
  return goog.uri.utils.appendQueryData_(2 == arguments.length ? goog.uri.utils.buildQueryDataBuffer_([a], arguments[1], 0) : goog.uri.utils.buildQueryDataBuffer_([a], arguments, 1));
};
goog.uri.utils.appendParamsFromMap = function(a, b) {
  return goog.uri.utils.appendQueryData_(goog.uri.utils.buildQueryDataBufferFromMap_([a], b));
};
goog.uri.utils.appendParam = function(a, b, c) {
  a = [a, "&", b];
  goog.isDefAndNotNull(c) && a.push("=", goog.string.urlEncode(c));
  return goog.uri.utils.appendQueryData_(a);
};
goog.uri.utils.findParam_ = function(a, b, c, d) {
  for (var e = c.length;0 <= (b = a.indexOf(c, b)) && b < d;) {
    var f = a.charCodeAt(b - 1);
    if (f == goog.uri.utils.CharCode_.AMPERSAND || f == goog.uri.utils.CharCode_.QUESTION) {
      if (f = a.charCodeAt(b + e), !f || f == goog.uri.utils.CharCode_.EQUAL || f == goog.uri.utils.CharCode_.AMPERSAND || f == goog.uri.utils.CharCode_.HASH) {
        return b;
      }
    }
    b += e + 1;
  }
  return-1;
};
goog.uri.utils.hashOrEndRe_ = /#|$/;
goog.uri.utils.hasParam = function(a, b) {
  return 0 <= goog.uri.utils.findParam_(a, 0, b, a.search(goog.uri.utils.hashOrEndRe_));
};
goog.uri.utils.getParamValue = function(a, b) {
  var c = a.search(goog.uri.utils.hashOrEndRe_), d = goog.uri.utils.findParam_(a, 0, b, c);
  if (0 > d) {
    return null;
  }
  var e = a.indexOf("&", d);
  if (0 > e || e > c) {
    e = c;
  }
  d += b.length + 1;
  return goog.string.urlDecode(a.substr(d, e - d));
};
goog.uri.utils.getParamValues = function(a, b) {
  for (var c = a.search(goog.uri.utils.hashOrEndRe_), d = 0, e, f = [];0 <= (e = goog.uri.utils.findParam_(a, d, b, c));) {
    d = a.indexOf("&", e);
    if (0 > d || d > c) {
      d = c;
    }
    e += b.length + 1;
    f.push(goog.string.urlDecode(a.substr(e, d - e)));
  }
  return f;
};
goog.uri.utils.trailingQueryPunctuationRe_ = /[?&]($|#)/;
goog.uri.utils.removeParam = function(a, b) {
  for (var c = a.search(goog.uri.utils.hashOrEndRe_), d = 0, e, f = [];0 <= (e = goog.uri.utils.findParam_(a, d, b, c));) {
    f.push(a.substring(d, e)), d = Math.min(a.indexOf("&", e) + 1 || c, c);
  }
  f.push(a.substr(d));
  return f.join("").replace(goog.uri.utils.trailingQueryPunctuationRe_, "$1");
};
goog.uri.utils.setParam = function(a, b, c) {
  return goog.uri.utils.appendParam(goog.uri.utils.removeParam(a, b), b, c);
};
goog.uri.utils.appendPath = function(a, b) {
  goog.uri.utils.assertNoFragmentsOrQueries_(a);
  goog.string.endsWith(a, "/") && (a = a.substr(0, a.length - 1));
  goog.string.startsWith(b, "/") && (b = b.substr(1));
  return goog.string.buildString(a, "/", b);
};
goog.uri.utils.StandardQueryParam = {RANDOM:"zx"};
goog.uri.utils.makeUnique = function(a) {
  return goog.uri.utils.setParam(a, goog.uri.utils.StandardQueryParam.RANDOM, goog.string.getRandomString());
};
// Input 96
goog.Uri = function(a, b) {
  var c;
  a instanceof goog.Uri ? (this.ignoreCase_ = goog.isDef(b) ? b : a.getIgnoreCase(), this.setScheme(a.getScheme()), this.setUserInfo(a.getUserInfo()), this.setDomain(a.getDomain()), this.setPort(a.getPort()), this.setPath(a.getPath()), this.setQueryData(a.getQueryData().clone()), this.setFragment(a.getFragment())) : a && (c = goog.uri.utils.split(String(a))) ? (this.ignoreCase_ = !!b, this.setScheme(c[goog.uri.utils.ComponentIndex.SCHEME] || "", !0), this.setUserInfo(c[goog.uri.utils.ComponentIndex.USER_INFO] || 
  "", !0), this.setDomain(c[goog.uri.utils.ComponentIndex.DOMAIN] || "", !0), this.setPort(c[goog.uri.utils.ComponentIndex.PORT]), this.setPath(c[goog.uri.utils.ComponentIndex.PATH] || "", !0), this.setQueryData(c[goog.uri.utils.ComponentIndex.QUERY_DATA] || "", !0), this.setFragment(c[goog.uri.utils.ComponentIndex.FRAGMENT] || "", !0)) : (this.ignoreCase_ = !!b, this.queryData_ = new goog.Uri.QueryData(null, null, this.ignoreCase_));
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
  if (b = this.getDomain()) {
    a.push("//");
    var c = this.getUserInfo();
    c && a.push(goog.Uri.encodeSpecialChars_(c, goog.Uri.reDisallowedInSchemeOrUserInfo_), "@");
    a.push(goog.string.urlEncode(b));
    b = this.getPort();
    null != b && a.push(":", String(b));
  }
  if (b = this.getPath()) {
    this.hasDomain() && "/" != b.charAt(0) && a.push("/"), a.push(goog.Uri.encodeSpecialChars_(b, "/" == b.charAt(0) ? goog.Uri.reDisallowedInAbsolutePath_ : goog.Uri.reDisallowedInRelativePath_));
  }
  (b = this.getEncodedQuery()) && a.push("?", b);
  (b = this.getFragment()) && a.push("#", goog.Uri.encodeSpecialChars_(b, goog.Uri.reDisallowedInFragment_));
  return a.join("");
};
goog.Uri.prototype.resolve = function(a) {
  var b = this.clone(), c = a.hasScheme();
  c ? b.setScheme(a.getScheme()) : c = a.hasUserInfo();
  c ? b.setUserInfo(a.getUserInfo()) : c = a.hasDomain();
  c ? b.setDomain(a.getDomain()) : c = a.hasPort();
  var d = a.getPath();
  if (c) {
    b.setPort(a.getPort());
  } else {
    if (c = a.hasPath()) {
      if ("/" != d.charAt(0)) {
        if (this.hasDomain() && !this.hasPath()) {
          d = "/" + d;
        } else {
          var e = b.getPath().lastIndexOf("/");
          -1 != e && (d = b.getPath().substr(0, e + 1) + d);
        }
      }
      d = goog.Uri.removeDotSegments(d);
    }
  }
  c ? b.setPath(d) : c = a.hasQuery();
  c ? b.setQueryData(a.getDecodedQuery()) : c = a.hasFragment();
  c && b.setFragment(a.getFragment());
  return b;
};
goog.Uri.prototype.clone = function() {
  return new goog.Uri(this);
};
goog.Uri.prototype.getScheme = function() {
  return this.scheme_;
};
goog.Uri.prototype.setScheme = function(a, b) {
  this.enforceReadOnly();
  if (this.scheme_ = b ? goog.Uri.decodeOrEmpty_(a) : a) {
    this.scheme_ = this.scheme_.replace(/:$/, "");
  }
  return this;
};
goog.Uri.prototype.hasScheme = function() {
  return!!this.scheme_;
};
goog.Uri.prototype.getUserInfo = function() {
  return this.userInfo_;
};
goog.Uri.prototype.setUserInfo = function(a, b) {
  this.enforceReadOnly();
  this.userInfo_ = b ? goog.Uri.decodeOrEmpty_(a) : a;
  return this;
};
goog.Uri.prototype.hasUserInfo = function() {
  return!!this.userInfo_;
};
goog.Uri.prototype.getDomain = function() {
  return this.domain_;
};
goog.Uri.prototype.setDomain = function(a, b) {
  this.enforceReadOnly();
  this.domain_ = b ? goog.Uri.decodeOrEmpty_(a) : a;
  return this;
};
goog.Uri.prototype.hasDomain = function() {
  return!!this.domain_;
};
goog.Uri.prototype.getPort = function() {
  return this.port_;
};
goog.Uri.prototype.setPort = function(a) {
  this.enforceReadOnly();
  if (a) {
    a = Number(a);
    if (isNaN(a) || 0 > a) {
      throw Error("Bad port number " + a);
    }
    this.port_ = a;
  } else {
    this.port_ = null;
  }
  return this;
};
goog.Uri.prototype.hasPort = function() {
  return null != this.port_;
};
goog.Uri.prototype.getPath = function() {
  return this.path_;
};
goog.Uri.prototype.setPath = function(a, b) {
  this.enforceReadOnly();
  this.path_ = b ? goog.Uri.decodeOrEmpty_(a) : a;
  return this;
};
goog.Uri.prototype.hasPath = function() {
  return!!this.path_;
};
goog.Uri.prototype.hasQuery = function() {
  return "" !== this.queryData_.toString();
};
goog.Uri.prototype.setQueryData = function(a, b) {
  this.enforceReadOnly();
  a instanceof goog.Uri.QueryData ? (this.queryData_ = a, this.queryData_.setIgnoreCase(this.ignoreCase_)) : (b || (a = goog.Uri.encodeSpecialChars_(a, goog.Uri.reDisallowedInQuery_)), this.queryData_ = new goog.Uri.QueryData(a, null, this.ignoreCase_));
  return this;
};
goog.Uri.prototype.setQuery = function(a, b) {
  return this.setQueryData(a, b);
};
goog.Uri.prototype.getEncodedQuery = function() {
  return this.queryData_.toString();
};
goog.Uri.prototype.getDecodedQuery = function() {
  return this.queryData_.toDecodedString();
};
goog.Uri.prototype.getQueryData = function() {
  return this.queryData_;
};
goog.Uri.prototype.getQuery = function() {
  return this.getEncodedQuery();
};
goog.Uri.prototype.setParameterValue = function(a, b) {
  this.enforceReadOnly();
  this.queryData_.set(a, b);
  return this;
};
goog.Uri.prototype.setParameterValues = function(a, b) {
  this.enforceReadOnly();
  goog.isArray(b) || (b = [String(b)]);
  this.queryData_.setValues(a, b);
  return this;
};
goog.Uri.prototype.getParameterValues = function(a) {
  return this.queryData_.getValues(a);
};
goog.Uri.prototype.getParameterValue = function(a) {
  return this.queryData_.get(a);
};
goog.Uri.prototype.getFragment = function() {
  return this.fragment_;
};
goog.Uri.prototype.setFragment = function(a, b) {
  this.enforceReadOnly();
  this.fragment_ = b ? goog.Uri.decodeOrEmpty_(a) : a;
  return this;
};
goog.Uri.prototype.hasFragment = function() {
  return!!this.fragment_;
};
goog.Uri.prototype.hasSameDomainAs = function(a) {
  return(!this.hasDomain() && !a.hasDomain() || this.getDomain() == a.getDomain()) && (!this.hasPort() && !a.hasPort() || this.getPort() == a.getPort());
};
goog.Uri.prototype.makeUnique = function() {
  this.enforceReadOnly();
  this.setParameterValue(goog.Uri.RANDOM_PARAM, goog.string.getRandomString());
  return this;
};
goog.Uri.prototype.removeParameter = function(a) {
  this.enforceReadOnly();
  this.queryData_.remove(a);
  return this;
};
goog.Uri.prototype.setReadOnly = function(a) {
  this.isReadOnly_ = a;
  return this;
};
goog.Uri.prototype.isReadOnly = function() {
  return this.isReadOnly_;
};
goog.Uri.prototype.enforceReadOnly = function() {
  if (this.isReadOnly_) {
    throw Error("Tried to modify a read-only Uri");
  }
};
goog.Uri.prototype.setIgnoreCase = function(a) {
  this.ignoreCase_ = a;
  this.queryData_ && this.queryData_.setIgnoreCase(a);
  return this;
};
goog.Uri.prototype.getIgnoreCase = function() {
  return this.ignoreCase_;
};
goog.Uri.parse = function(a, b) {
  return a instanceof goog.Uri ? a.clone() : new goog.Uri(a, b);
};
goog.Uri.create = function(a, b, c, d, e, f, g, k) {
  k = new goog.Uri(null, k);
  a && k.setScheme(a);
  b && k.setUserInfo(b);
  c && k.setDomain(c);
  d && k.setPort(d);
  e && k.setPath(e);
  f && k.setQueryData(f);
  g && k.setFragment(g);
  return k;
};
goog.Uri.resolve = function(a, b) {
  a instanceof goog.Uri || (a = goog.Uri.parse(a));
  b instanceof goog.Uri || (b = goog.Uri.parse(b));
  return a.resolve(b);
};
goog.Uri.removeDotSegments = function(a) {
  if (".." == a || "." == a) {
    return "";
  }
  if (goog.string.contains(a, "./") || goog.string.contains(a, "/.")) {
    var b = goog.string.startsWith(a, "/");
    a = a.split("/");
    for (var c = [], d = 0;d < a.length;) {
      var e = a[d++];
      "." == e ? b && d == a.length && c.push("") : ".." == e ? ((1 < c.length || 1 == c.length && "" != c[0]) && c.pop(), b && d == a.length && c.push("")) : (c.push(e), b = !0);
    }
    return c.join("/");
  }
  return a;
};
goog.Uri.decodeOrEmpty_ = function(a) {
  return a ? decodeURIComponent(a) : "";
};
goog.Uri.encodeSpecialChars_ = function(a, b) {
  return goog.isString(a) ? encodeURI(a).replace(b, goog.Uri.encodeChar_) : null;
};
goog.Uri.encodeChar_ = function(a) {
  a = a.charCodeAt(0);
  return "%" + (a >> 4 & 15).toString(16) + (a & 15).toString(16);
};
goog.Uri.reDisallowedInSchemeOrUserInfo_ = /[#\/\?@]/g;
goog.Uri.reDisallowedInRelativePath_ = /[\#\?:]/g;
goog.Uri.reDisallowedInAbsolutePath_ = /[\#\?]/g;
goog.Uri.reDisallowedInQuery_ = /[\#\?@]/g;
goog.Uri.reDisallowedInFragment_ = /#/g;
goog.Uri.haveSameDomain = function(a, b) {
  var c = goog.uri.utils.split(a), d = goog.uri.utils.split(b);
  return c[goog.uri.utils.ComponentIndex.DOMAIN] == d[goog.uri.utils.ComponentIndex.DOMAIN] && c[goog.uri.utils.ComponentIndex.PORT] == d[goog.uri.utils.ComponentIndex.PORT];
};
goog.Uri.QueryData = function(a, b, c) {
  this.encodedQuery_ = a || null;
  this.ignoreCase_ = !!c;
};
goog.Uri.QueryData.prototype.ensureKeyMapInitialized_ = function() {
  if (!this.keyMap_ && (this.keyMap_ = new goog.structs.Map, this.count_ = 0, this.encodedQuery_)) {
    for (var a = this.encodedQuery_.split("&"), b = 0;b < a.length;b++) {
      var c = a[b].indexOf("="), d = null, e = null;
      0 <= c ? (d = a[b].substring(0, c), e = a[b].substring(c + 1)) : d = a[b];
      d = goog.string.urlDecode(d);
      d = this.getKeyName_(d);
      this.add(d, e ? goog.string.urlDecode(e) : "");
    }
  }
};
goog.Uri.QueryData.createFromMap = function(a, b, c) {
  b = goog.structs.getKeys(a);
  if ("undefined" == typeof b) {
    throw Error("Keys are undefined");
  }
  c = new goog.Uri.QueryData(null, null, c);
  a = goog.structs.getValues(a);
  for (var d = 0;d < b.length;d++) {
    var e = b[d], f = a[d];
    goog.isArray(f) ? c.setValues(e, f) : c.add(e, f);
  }
  return c;
};
goog.Uri.QueryData.createFromKeysValues = function(a, b, c, d) {
  if (a.length != b.length) {
    throw Error("Mismatched lengths for keys/values");
  }
  c = new goog.Uri.QueryData(null, null, d);
  for (d = 0;d < a.length;d++) {
    c.add(a[d], b[d]);
  }
  return c;
};
goog.Uri.QueryData.prototype.keyMap_ = null;
goog.Uri.QueryData.prototype.count_ = null;
goog.Uri.QueryData.prototype.getCount = function() {
  this.ensureKeyMapInitialized_();
  return this.count_;
};
goog.Uri.QueryData.prototype.add = function(a, b) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  a = this.getKeyName_(a);
  var c = this.keyMap_.get(a);
  c || this.keyMap_.set(a, c = []);
  c.push(b);
  this.count_++;
  return this;
};
goog.Uri.QueryData.prototype.remove = function(a) {
  this.ensureKeyMapInitialized_();
  a = this.getKeyName_(a);
  return this.keyMap_.containsKey(a) ? (this.invalidateCache_(), this.count_ -= this.keyMap_.get(a).length, this.keyMap_.remove(a)) : !1;
};
goog.Uri.QueryData.prototype.clear = function() {
  this.invalidateCache_();
  this.keyMap_ = null;
  this.count_ = 0;
};
goog.Uri.QueryData.prototype.isEmpty = function() {
  this.ensureKeyMapInitialized_();
  return 0 == this.count_;
};
goog.Uri.QueryData.prototype.containsKey = function(a) {
  this.ensureKeyMapInitialized_();
  a = this.getKeyName_(a);
  return this.keyMap_.containsKey(a);
};
goog.Uri.QueryData.prototype.containsValue = function(a) {
  var b = this.getValues();
  return goog.array.contains(b, a);
};
goog.Uri.QueryData.prototype.getKeys = function() {
  this.ensureKeyMapInitialized_();
  for (var a = this.keyMap_.getValues(), b = this.keyMap_.getKeys(), c = [], d = 0;d < b.length;d++) {
    for (var e = a[d], f = 0;f < e.length;f++) {
      c.push(b[d]);
    }
  }
  return c;
};
goog.Uri.QueryData.prototype.getValues = function(a) {
  this.ensureKeyMapInitialized_();
  var b = [];
  if (goog.isString(a)) {
    this.containsKey(a) && (b = goog.array.concat(b, this.keyMap_.get(this.getKeyName_(a))));
  } else {
    a = this.keyMap_.getValues();
    for (var c = 0;c < a.length;c++) {
      b = goog.array.concat(b, a[c]);
    }
  }
  return b;
};
goog.Uri.QueryData.prototype.set = function(a, b) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  a = this.getKeyName_(a);
  this.containsKey(a) && (this.count_ -= this.keyMap_.get(a).length);
  this.keyMap_.set(a, [b]);
  this.count_++;
  return this;
};
goog.Uri.QueryData.prototype.get = function(a, b) {
  var c = a ? this.getValues(a) : [];
  return goog.Uri.preserveParameterTypesCompatibilityFlag ? 0 < c.length ? c[0] : b : 0 < c.length ? String(c[0]) : b;
};
goog.Uri.QueryData.prototype.setValues = function(a, b) {
  this.remove(a);
  0 < b.length && (this.invalidateCache_(), this.keyMap_.set(this.getKeyName_(a), goog.array.clone(b)), this.count_ += b.length);
};
goog.Uri.QueryData.prototype.toString = function() {
  if (this.encodedQuery_) {
    return this.encodedQuery_;
  }
  if (!this.keyMap_) {
    return "";
  }
  for (var a = [], b = this.keyMap_.getKeys(), c = 0;c < b.length;c++) {
    for (var d = b[c], e = goog.string.urlEncode(d), d = this.getValues(d), f = 0;f < d.length;f++) {
      var g = e;
      "" !== d[f] && (g += "=" + goog.string.urlEncode(d[f]));
      a.push(g);
    }
  }
  return this.encodedQuery_ = a.join("&");
};
goog.Uri.QueryData.prototype.toDecodedString = function() {
  return goog.Uri.decodeOrEmpty_(this.toString());
};
goog.Uri.QueryData.prototype.invalidateCache_ = function() {
  this.encodedQuery_ = null;
};
goog.Uri.QueryData.prototype.filterKeys = function(a) {
  this.ensureKeyMapInitialized_();
  goog.structs.forEach(this.keyMap_, function(b, c, d) {
    goog.array.contains(a, c) || this.remove(c);
  }, this);
  return this;
};
goog.Uri.QueryData.prototype.clone = function() {
  var a = new goog.Uri.QueryData;
  a.encodedQuery_ = this.encodedQuery_;
  this.keyMap_ && (a.keyMap_ = this.keyMap_.clone(), a.count_ = this.count_);
  return a;
};
goog.Uri.QueryData.prototype.getKeyName_ = function(a) {
  a = String(a);
  this.ignoreCase_ && (a = a.toLowerCase());
  return a;
};
goog.Uri.QueryData.prototype.setIgnoreCase = function(a) {
  a && !this.ignoreCase_ && (this.ensureKeyMapInitialized_(), this.invalidateCache_(), goog.structs.forEach(this.keyMap_, function(a, c) {
    var d = c.toLowerCase();
    c != d && (this.remove(c), this.setValues(d, a));
  }, this));
  this.ignoreCase_ = a;
};
goog.Uri.QueryData.prototype.extend = function(a) {
  for (var b = 0;b < arguments.length;b++) {
    goog.structs.forEach(arguments[b], function(a, b) {
      this.add(b, a);
    }, this);
  }
};
// Input 97
goog.userAgent.platform = {};
goog.userAgent.platform.determineVersion_ = function() {
  var a;
  return goog.userAgent.WINDOWS ? (a = /Windows NT ([0-9.]+)/, (a = a.exec(goog.userAgent.getUserAgentString())) ? a[1] : "0") : goog.userAgent.MAC ? (a = /10[_.][0-9_.]+/, (a = a.exec(goog.userAgent.getUserAgentString())) ? a[0].replace(/_/g, ".") : "10") : goog.userAgent.ANDROID ? (a = /Android\s+([^\);]+)(\)|;)/, (a = a.exec(goog.userAgent.getUserAgentString())) ? a[1] : "") : goog.userAgent.IPHONE || goog.userAgent.IPAD ? (a = /(?:iPhone|CPU)\s+OS\s+(\S+)/, (a = a.exec(goog.userAgent.getUserAgentString())) ? 
  a[1].replace(/_/g, ".") : "") : "";
};
goog.userAgent.platform.VERSION = goog.userAgent.platform.determineVersion_();
goog.userAgent.platform.isVersion = function(a) {
  return 0 <= goog.string.compareVersions(goog.userAgent.platform.VERSION, a);
};
// Input 98
wtf.data.UserAgent = {};
wtf.data.ContextType = {SCRIPT:"script"};
wtf.data.ContextInfo = function() {
};
wtf.data.ContextInfo.parse = function(a) {
  var b;
  switch(a.contextType) {
    case wtf.data.ContextType.SCRIPT:
      b = new wtf.data.ScriptContextInfo;
  }
  return b && b.parse(a) ? b : null;
};
wtf.data.ContextInfo.detect = function() {
  var a;
  a = new wtf.data.ScriptContextInfo;
  goog.asserts.assert(a);
  a.detect();
  return a;
};
wtf.data.UserAgent.Type = {UNKNOWN:"unknown", NODEJS:"nodejs", OPERA:"opera", IE:"ie", GECKO:"gecko", WEBKIT:"webkit"};
wtf.data.UserAgent.Platform = {MAC:"mac", WINDOWS:"windows", LINUX:"linux", OTHER:"other"};
wtf.data.UserAgent.Device = {DESKTOP:"desktop", SERVER:"server", CHROME:"chrome", IPHONE:"iphone", IPAD:"ipad", ANDROID:"android", OTHER_MOBILE:"mobile"};
wtf.data.ScriptContextInfo = function() {
  wtf.data.ContextInfo.call(this);
  this.uri = "";
  this.taskId = this.icon = this.title = null;
  this.args = [];
  this.userAgent = {value:"", type:wtf.data.UserAgent.Type.UNKNOWN, platform:wtf.data.UserAgent.Platform.OTHER, platformVersion:"", device:wtf.data.UserAgent.Device.DESKTOP};
};
goog.inherits(wtf.data.ScriptContextInfo, wtf.data.ContextInfo);
wtf.data.ScriptContextInfo.prototype.getFilename = function() {
  if (this.title) {
    var a = goog.string.stripQuotes(this.title, "\"`'"), a = goog.string.collapseWhitespace(a), a = a.replace(/[\/ \n\r]/g, "-"), a = a.replace(/[-]+/g, "-");
    return a = a.toLowerCase();
  }
  if (this.uri) {
    var b = goog.Uri.parse(this.uri), a = b.getDomain();
    b.hasPort() && (a += "-" + b.getPort());
    b.hasPath() && (b = b.getPath(), b = b.replace(/\//g, "-"), b = b.replace(/\./g, "-"), goog.string.endsWith(a, "-") && (b = b.substr(0, b.length - 1)), a += b);
    return a;
  }
  return "script";
};
wtf.data.ScriptContextInfo.prototype.detect = function() {
  if (wtf.NODE) {
    this.uri = process.argv[1] || process.argv[0], "node" == process.title ? (this.title = this.uri.substr(this.uri.lastIndexOf("/") + 1), this.title = this.title.replace(/\.js$/, "")) : this.title = process.title, this.icon = null, this.taskId = String(process.pid), this.args = process.argv.slice();
  } else {
    this.uri = goog.global.location.href;
    if (goog.global.document) {
      this.title = goog.global.document.title;
      var a = goog.global.document.querySelector('link[rel~="icon"]');
      a && a.href && (this.icon = {uri:a.href});
    }
    this.taskId = "";
    this.args = [];
  }
  this.userAgent.value = goog.userAgent.getUserAgentString() || "";
  this.userAgent.type = wtf.NODE ? wtf.data.UserAgent.Type.NODEJS : goog.userAgent.OPERA ? wtf.data.UserAgent.Type.OPERA : goog.userAgent.IE ? wtf.data.UserAgent.Type.IE : goog.userAgent.GECKO ? wtf.data.UserAgent.Type.GECKO : goog.userAgent.WEBKIT ? wtf.data.UserAgent.Type.WEBKIT : wtf.data.UserAgent.Type.UNKNOWN;
  this.userAgent.platform = wtf.NODE ? process.platform : goog.userAgent.MAC ? wtf.data.UserAgent.Platform.MAC : goog.userAgent.WINDOWS ? wtf.data.UserAgent.Platform.WINDOWS : goog.userAgent.LINUX ? wtf.data.UserAgent.Platform.LINUX : wtf.data.UserAgent.Platform.OTHER;
  this.userAgent.platformVersion = wtf.NODE ? process.version : goog.userAgent.platform.VERSION;
  this.userAgent.device = wtf.NODE ? wtf.data.UserAgent.Device.SERVER : goog.userAgent.product.CHROME ? wtf.data.UserAgent.Device.CHROME : goog.userAgent.product.IPHONE ? wtf.data.UserAgent.Device.IPHONE : goog.userAgent.product.IPAD ? wtf.data.UserAgent.Device.IPAD : goog.userAgent.product.ANDROID ? wtf.data.UserAgent.Device.ANDROID : goog.userAgent.MOBILE ? wtf.data.UserAgent.Device.OTHER_MOBILE : wtf.data.UserAgent.Device.DESKTOP;
};
wtf.data.ScriptContextInfo.prototype.parse = function(a) {
  this.uri = a.uri;
  this.title = a.title || null;
  this.icon = a.icon ? {uri:a.icon.uri} : null;
  this.taskId = a.taskId || null;
  this.args = a.args;
  a.userAgent && (this.userAgent.value = a.userAgent.value, this.userAgent.type = a.userAgent.type, this.userAgent.platform = a.userAgent.platform, this.userAgent.platformVersion = a.userAgent.platformVersion, this.userAgent.device = a.userAgent.device);
  return!0;
};
wtf.data.ScriptContextInfo.prototype.serialize = function() {
  return{contextType:wtf.data.ContextType.SCRIPT, uri:this.uri, title:this.title, icon:this.icon ? {uri:this.icon.uri} : null, taskId:this.taskId, args:this.args, userAgent:{value:this.userAgent.value, type:this.userAgent.type, platform:this.userAgent.platform, platformVersion:this.userAgent.platformVersion, device:this.userAgent.device}};
};
wtf.data.ScriptContextInfo.prototype.toString = function() {
  return this.title || this.uri;
};
// Input 99
wtf.io.cff.parts.FileHeaderPart = function(a, b) {
  wtf.io.cff.Part.call(this, wtf.io.cff.PartType.FILE_HEADER);
  this.timebase_ = this.flags_ = 0;
  this.contextInfo_ = a || null;
  this.metadata_ = b || {};
};
goog.inherits(wtf.io.cff.parts.FileHeaderPart, wtf.io.cff.Part);
wtf.io.cff.parts.FileHeaderPart.prototype.getFlags = function() {
  return this.flags_;
};
wtf.io.cff.parts.FileHeaderPart.prototype.setFlags = function(a) {
  this.flags_ = a;
};
wtf.io.cff.parts.FileHeaderPart.prototype.getTimebase = function() {
  return this.timebase_;
};
wtf.io.cff.parts.FileHeaderPart.prototype.setTimebase = function(a) {
  this.timebase_ = a;
};
wtf.io.cff.parts.FileHeaderPart.prototype.getContextInfo = function() {
  goog.asserts.assert(this.contextInfo_);
  return this.contextInfo_;
};
wtf.io.cff.parts.FileHeaderPart.prototype.setContextInfo = function(a) {
  this.contextInfo_ = a;
};
wtf.io.cff.parts.FileHeaderPart.prototype.getMetadata = function() {
  return this.metadata_;
};
wtf.io.cff.parts.FileHeaderPart.prototype.setMetadata = function(a) {
  this.metadata_ = a || {};
};
wtf.io.cff.parts.FileHeaderPart.prototype.initFromBlobData = function(a) {
  var b = new goog.async.Deferred;
  wtf.io.Blob.create([a]).readAsText(function(a) {
    try {
      var d = a ? goog.global.JSON.parse(a) : {};
      if (!d || "object" != typeof d) {
        throw Error("File header expected to be a JSON object.");
      }
      this.initFromJsonObject(d);
      b.callback(this);
    } catch (e) {
      b.errback(e);
    }
  }, this);
  return b;
};
wtf.io.cff.parts.FileHeaderPart.prototype.toBlobData = function() {
  return goog.global.JSON.stringify(this.toJsonObject());
};
wtf.io.cff.parts.FileHeaderPart.prototype.initFromJsonObject = function(a) {
  var b = a.flags, c = a.timebase, d = a.contextInfo;
  a = a.metadata;
  if (b) {
    if (!goog.isArray(b)) {
      throw Error("File header flags must be an array of strings.");
    }
    this.flags_ = wtf.data.formats.FileFlags.fromStrings(b);
  } else {
    this.flags_ = 0;
  }
  if (!goog.isDef(c)) {
    throw Error('File header missing required field "timebase".');
  }
  this.timebase_ = c;
  if (d) {
    if ("object" != typeof d) {
      throw Error("File header context info must be an object.");
    }
    this.contextInfo_ = wtf.data.ContextInfo.parse(d);
    if (!this.contextInfo_) {
      throw Error("Unable to parse file header context info.");
    }
  } else {
    this.contextInfo_ = new wtf.data.ScriptContextInfo;
  }
  if (a) {
    if ("object" != typeof a) {
      throw Error("File header metadata must be an object.");
    }
    this.metadata_ = a;
  } else {
    this.metadata_ = {};
  }
};
wtf.io.cff.parts.FileHeaderPart.prototype.toJsonObject = function() {
  var a = 0;
  wtf.hasHighResolutionTimes && (a |= wtf.data.formats.FileFlags.HAS_HIGH_RESOLUTION_TIMES);
  var b = this.contextInfo_;
  b || (b = wtf.data.ContextInfo.detect());
  var c = {nowTimeNs:wtf.computeNowOverhead()}, d;
  for (d in this.metadata_) {
    c[d] = this.metadata_[d];
  }
  return{type:this.getType(), flags:wtf.data.formats.FileFlags.toStrings(a), timebase:wtf.timebase(), contextInfo:b.serialize(), metadata:c};
};
// Input 100
wtf.io.cff.chunks.FileHeaderChunk = function(a) {
  wtf.io.cff.Chunk.call(this, a, wtf.io.cff.ChunkType.FILE_HEADER);
  this.fileHeaderPart_ = null;
};
goog.inherits(wtf.io.cff.chunks.FileHeaderChunk, wtf.io.cff.Chunk);
wtf.io.cff.chunks.FileHeaderChunk.prototype.load = function(a) {
  goog.asserts.assert(!this.fileHeaderPart_);
  for (var b = 0;b < a.length;b++) {
    var c = a[b];
    this.addPart(c);
    switch(c.getType()) {
      case wtf.io.cff.PartType.FILE_HEADER:
        this.fileHeaderPart_ = c;
        break;
      default:
        throw goog.asserts.fail("Unknown part type: " + c.getType()), Error("Unknown part type " + c.getType() + " in chunk.");;
    }
  }
  goog.asserts.assert(this.fileHeaderPart_);
  if (!this.fileHeaderPart_) {
    throw Error("No file header part found in header chunk.");
  }
};
wtf.io.cff.chunks.FileHeaderChunk.prototype.init = function(a, b) {
  this.fileHeader_ = new wtf.io.cff.parts.FileHeaderPart(a, b);
  this.removeAllParts();
  this.addPart(this.fileHeader_);
};
wtf.io.cff.chunks.FileHeaderChunk.prototype.getFileHeader = function() {
  goog.asserts.assert(this.fileHeaderPart_);
  return this.fileHeaderPart_;
};
// Input 101
wtf.io.cff.StreamBase = function() {
  wtf.events.EventEmitter.call(this);
};
goog.inherits(wtf.io.cff.StreamBase, wtf.events.EventEmitter);
wtf.io.cff.StreamBase.prototype.createChunkType = function(a, b) {
  switch(b) {
    case wtf.io.cff.ChunkType.FILE_HEADER:
      return new wtf.io.cff.chunks.FileHeaderChunk(a);
    case wtf.io.cff.ChunkType.EVENT_DATA:
      return new wtf.io.cff.chunks.EventDataChunk(a);
    default:
      return goog.asserts.fail("Unhandled chunk type: " + b), null;
  }
};
wtf.io.cff.StreamBase.prototype.createPartType = function(a) {
  switch(a) {
    case wtf.io.cff.PartType.FILE_HEADER:
      return new wtf.io.cff.parts.FileHeaderPart;
    case wtf.io.cff.PartType.JSON_EVENT_BUFFER:
      return new wtf.io.cff.parts.JsonEventBufferPart;
    case wtf.io.cff.PartType.LEGACY_EVENT_BUFFER:
      return new wtf.io.cff.parts.LegacyEventBufferPart;
    case wtf.io.cff.PartType.BINARY_EVENT_BUFFER:
      return new wtf.io.cff.parts.BinaryEventBufferPart;
    case wtf.io.cff.PartType.STRING_TABLE:
      return new wtf.io.cff.parts.StringTablePart;
    case wtf.io.cff.PartType.BINARY_RESOURCE:
      return new wtf.io.cff.parts.BinaryResourcePart;
    case wtf.io.cff.PartType.STRING_RESOURCE:
      return new wtf.io.cff.parts.StringResourcePart;
    default:
      return goog.asserts.fail("Unhandled part type: " + a), null;
  }
};
// Input 102
wtf.io.cff.StreamSource = function(a) {
  wtf.io.cff.StreamBase.call(this);
  this.transport_ = a;
  this.transport_.addListener(wtf.io.ReadTransport.EventType.RECEIVE_DATA, function(a) {
    try {
      this.dataReceived(a);
    } catch (c) {
      this.emitErrorEvent(c);
    }
  }, this);
  this.transport_.addListener(wtf.io.ReadTransport.EventType.END, this.ended, this);
  this.transport_.addListener(wtf.io.ReadTransport.EventType.ERROR, this.emitErrorEvent, this);
};
goog.inherits(wtf.io.cff.StreamSource, wtf.io.cff.StreamBase);
wtf.io.cff.StreamSource.prototype.disposeInternal = function() {
  goog.dispose(this.transport_);
  wtf.io.cff.StreamSource.superClass_.disposeInternal.call(this);
};
wtf.io.cff.StreamSource.prototype.getTransport = function() {
  return this.transport_;
};
wtf.io.cff.StreamSource.prototype.resume = function() {
  this.transport_.resume();
};
wtf.io.cff.StreamSource.prototype.ended = goog.nullFunction;
wtf.io.cff.StreamSource.prototype.emitChunkReceivedEvent = function(a) {
  this.emitEvent(wtf.io.cff.StreamSource.EventType.CHUNK_RECEIVED, a);
};
wtf.io.cff.StreamSource.prototype.emitErrorEvent = function(a) {
  this.emitEvent(wtf.io.cff.StreamSource.EventType.ERROR, a);
};
wtf.io.cff.StreamSource.prototype.emitEndEvent = function() {
  this.emitEvent(wtf.io.cff.StreamSource.EventType.END);
};
wtf.io.cff.StreamSource.EventType = {CHUNK_RECEIVED:goog.events.getUniqueId("chunk_received"), ERROR:goog.events.getUniqueId("error"), END:goog.events.getUniqueId("end")};
// Input 103
wtf.db.sources = {};
wtf.db.sources.ChunkedDataSource = function(a, b, c) {
  wtf.db.DataSource.call(this, a, b);
  this.streamSource_ = c;
  this.registerDisposable(this.streamSource_);
  this.eventWireTable_ = [];
  this.zoneTable_ = {};
  this.currentZone_ = a.getDefaultZone();
  this.timeRangeRenames_ = {};
  this.binaryDispatch_ = {};
  this.setupBinaryDispatchTable_();
  this.streamSource_.addListener(wtf.io.cff.StreamSource.EventType.CHUNK_RECEIVED, this.chunkReceived_, this);
  this.streamSource_.addListener(wtf.io.cff.StreamSource.EventType.ERROR, this.streamErrored_, this);
  this.streamSource_.addListener(wtf.io.cff.StreamSource.EventType.END, this.streamEnded_, this);
};
goog.inherits(wtf.db.sources.ChunkedDataSource, wtf.db.DataSource);
wtf.db.sources.ChunkedDataSource.prototype.start = function() {
  var a = wtf.db.sources.ChunkedDataSource.superClass_.start.call(this);
  this.getDatabase().beginInsertingEvents(this);
  this.streamSource_.resume();
  return a;
};
wtf.db.sources.ChunkedDataSource.prototype.streamErrored_ = function(a) {
  this.error("Error loading trace data", a.toString());
};
wtf.db.sources.ChunkedDataSource.prototype.streamEnded_ = function() {
  this.getDatabase().endInsertingEvents();
  this.end();
};
wtf.db.sources.ChunkedDataSource.prototype.chunkReceived_ = function(a) {
  if (!this.hasErrored) {
    switch(a.getType()) {
      case wtf.io.cff.ChunkType.FILE_HEADER:
        this.processFileHeaderChunk_(a);
        break;
      case wtf.io.cff.ChunkType.EVENT_DATA:
        switch(a = a.getEventData(), goog.asserts.assert(a), a.getType()) {
          case wtf.io.cff.PartType.LEGACY_EVENT_BUFFER:
            this.processLegacyEventBuffer_(a);
            break;
          case wtf.io.cff.PartType.BINARY_EVENT_BUFFER:
            this.processBinaryEventBuffer_(a);
            break;
          case wtf.io.cff.PartType.JSON_EVENT_BUFFER:
            this.processJsonEventBuffer_(a);
            break;
          default:
            this.error("Unrecognized event data buffer", "An event data part not recognized and could not be parsed.");
        }
      ;
    }
  }
};
wtf.db.sources.ChunkedDataSource.prototype.processFileHeaderChunk_ = function(a) {
  a = a.getFileHeader();
  var b = this.getDatabase().computeTimeDelay(a.getTimebase());
  this.initialize(a.getContextInfo(), a.getFlags(), 0, wtf.db.Unit.TIME_MILLISECONDS, a.getMetadata(), a.getTimebase(), b) || this.error("Unable to initialize data source", "File corrupt or invalid.");
};
wtf.db.sources.ChunkedDataSource.prototype.setupBinaryDispatchTable_ = function() {
  var a = this.getDatabase(), b = a.getEventTypeTable();
  b.defineType(wtf.db.EventType.createInstance("wtf.event#define(uint16 wireId, uint16 eventClass, uint32 flags, ascii name, ascii args)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL));
  this.eventWireTable_[1] = b.getByName("wtf.event#define");
  this.binaryDispatch_["wtf.event#define"] = function(a, d) {
    for (var e = d.args, e = e ? wtf.data.Variable.parseSignatureArguments(e) : [], f = [], g = 0;g < e.length;g++) {
      f.push(e[g].variable);
    }
    e = b.defineType(new wtf.db.EventType(d.name, d.eventClass, d.flags, f));
    this.eventWireTable_[d.wireId] = e;
    return!1;
  };
  this.binaryDispatch_["wtf.zone#create"] = function(b, d) {
    var e = a.createOrGetZone(d.name, d.type, d.location);
    this.zoneTable_[d.zoneId] = e;
    return!1;
  };
  this.binaryDispatch_["wtf.zone#delete"] = function(a, b) {
    return!1;
  };
  this.binaryDispatch_["wtf.zone#set"] = function(a, b) {
    this.currentZone_ = this.zoneTable_[b.zoneId] || null;
    return!1;
  };
  this.binaryDispatch_["wtf.timeRange#begin"] = this.binaryDispatch_["wtf.timeRange#end"] = function(a, b) {
    var e = b.id, f = this.timeRangeRenames_[e];
    void 0 === f && (f = wtf.db.TimeRange.allocateId(), this.timeRangeRenames_[e] = f);
    b.id = f;
    return!0;
  };
};
wtf.db.sources.ChunkedDataSource.prototype.processBinaryEventBuffer_ = function(a) {
  a = a.getValue();
  goog.asserts.assert(a);
  var b = a.uint32Array, c = this.eventWireTable_, d = 0, e = wtf.io.BufferView.getCapacity(a) >> 2;
  for (wtf.io.BufferView.setOffset(a, 0);d < e;) {
    var f = b[d + 0], g = b[d + 1], d = d + 2, f = c[f];
    if (!f) {
      this.error("Undefined event type", "The file tried to reference an event it didn't define. Perhaps it's corrupted?");
      break;
    }
    var k = null;
    f.parseBinaryArguments && (wtf.io.BufferView.setOffset(a, d << 2), k = f.parseBinaryArguments(a), d = wtf.io.BufferView.getOffset(a) >> 2);
    var m = !0;
    if (f.flags & wtf.data.EventFlag.BUILTIN) {
      var l = this.binaryDispatch_[f.name];
      l && (m = l.call(this, f, k));
    }
    m && this.currentZone_.getEventList().insert(f, Math.max(0, g + this.getTimeDelay()), k);
  }
};
wtf.db.sources.ChunkedDataSource.prototype.processLegacyEventBuffer_ = function(a) {
  a = a.getValue();
  goog.asserts.assert(a);
  a.offset = 0;
  for (var b = a.data, c = this.eventWireTable_;a.offset < a.capacity;) {
    var d = a.offset, e = b[d++] << 8 | b[d++], f = (b[d++] << 24 >>> 0 | b[d++] << 16 | b[d++] << 8 | b[d++]) >>> 0;
    a.offset = d;
    d = c[e];
    if (!d) {
      this.error("Undefined event type", "The file tried to reference an event it didn't define. Perhaps it's corrupted?");
      break;
    }
    e = null;
    d.parseLegacyArguments && (e = d.parseLegacyArguments(a));
    var g = !0;
    if (d.flags & wtf.data.EventFlag.BUILTIN) {
      var k = this.binaryDispatch_[d.name];
      k && (g = k.call(this, d, e));
    }
    g && this.currentZone_.getEventList().insert(d, Math.max(0, f + this.getTimeDelay()), e);
  }
};
wtf.db.sources.ChunkedDataSource.prototype.processJsonEventBuffer_ = function(a) {
  a = a.getValue();
  goog.asserts.assert(a);
};
// Input 104
goog.async.DeferredList = function(a, b, c, d, e, f) {
  goog.async.Deferred.call(this, e, f);
  this.list_ = a;
  this.deferredResults_ = [];
  this.fireOnOneCallback_ = !!b;
  this.fireOnOneErrback_ = !!c;
  this.consumeErrors_ = !!d;
  for (b = this.numFinished_ = 0;b < a.length;b++) {
    a[b].addCallbacks(goog.bind(this.handleCallback_, this, b, !0), goog.bind(this.handleCallback_, this, b, !1));
  }
  0 != a.length || this.fireOnOneCallback_ || this.callback(this.deferredResults_);
};
goog.inherits(goog.async.DeferredList, goog.async.Deferred);
goog.async.DeferredList.prototype.handleCallback_ = function(a, b, c) {
  this.numFinished_++;
  this.deferredResults_[a] = [b, c];
  this.hasFired() || (this.fireOnOneCallback_ && b ? this.callback([a, c]) : this.fireOnOneErrback_ && !b ? this.errback(c) : this.numFinished_ == this.list_.length && this.callback(this.deferredResults_));
  this.consumeErrors_ && !b && (c = null);
  return c;
};
goog.async.DeferredList.prototype.errback = function(a) {
  goog.async.DeferredList.superClass_.errback.call(this, a);
  for (a = 0;a < this.list_.length;a++) {
    this.list_[a].cancel();
  }
};
goog.async.DeferredList.gatherResults = function(a) {
  return(new goog.async.DeferredList(a, !1, !0)).addCallback(function(a) {
    for (var c = [], d = 0;d < a.length;d++) {
      c[d] = a[d][1];
    }
    return c;
  });
};
// Input 105
goog.math.Long = function(a, b) {
  this.low_ = a | 0;
  this.high_ = b | 0;
};
goog.math.Long.IntCache_ = {};
goog.math.Long.fromInt = function(a) {
  if (-128 <= a && 128 > a) {
    var b = goog.math.Long.IntCache_[a];
    if (b) {
      return b;
    }
  }
  b = new goog.math.Long(a | 0, 0 > a ? -1 : 0);
  -128 <= a && 128 > a && (goog.math.Long.IntCache_[a] = b);
  return b;
};
goog.math.Long.fromNumber = function(a) {
  return isNaN(a) || !isFinite(a) ? goog.math.Long.ZERO : a <= -goog.math.Long.TWO_PWR_63_DBL_ ? goog.math.Long.MIN_VALUE : a + 1 >= goog.math.Long.TWO_PWR_63_DBL_ ? goog.math.Long.MAX_VALUE : 0 > a ? goog.math.Long.fromNumber(-a).negate() : new goog.math.Long(a % goog.math.Long.TWO_PWR_32_DBL_ | 0, a / goog.math.Long.TWO_PWR_32_DBL_ | 0);
};
goog.math.Long.fromBits = function(a, b) {
  return new goog.math.Long(a, b);
};
goog.math.Long.fromString = function(a, b) {
  if (0 == a.length) {
    throw Error("number format error: empty string");
  }
  var c = b || 10;
  if (2 > c || 36 < c) {
    throw Error("radix out of range: " + c);
  }
  if ("-" == a.charAt(0)) {
    return goog.math.Long.fromString(a.substring(1), c).negate();
  }
  if (0 <= a.indexOf("-")) {
    throw Error('number format error: interior "-" character: ' + a);
  }
  for (var d = goog.math.Long.fromNumber(Math.pow(c, 8)), e = goog.math.Long.ZERO, f = 0;f < a.length;f += 8) {
    var g = Math.min(8, a.length - f), k = parseInt(a.substring(f, f + g), c);
    8 > g ? (g = goog.math.Long.fromNumber(Math.pow(c, g)), e = e.multiply(g).add(goog.math.Long.fromNumber(k))) : (e = e.multiply(d), e = e.add(goog.math.Long.fromNumber(k)));
  }
  return e;
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
  return this.low_;
};
goog.math.Long.prototype.toNumber = function() {
  return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ + this.getLowBitsUnsigned();
};
goog.math.Long.prototype.toString = function(a) {
  a = a || 10;
  if (2 > a || 36 < a) {
    throw Error("radix out of range: " + a);
  }
  if (this.isZero()) {
    return "0";
  }
  if (this.isNegative()) {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      var b = goog.math.Long.fromNumber(a), c = this.div(b), b = c.multiply(b).subtract(this);
      return c.toString(a) + b.toInt().toString(a);
    }
    return "-" + this.negate().toString(a);
  }
  for (var c = goog.math.Long.fromNumber(Math.pow(a, 6)), b = this, d = "";;) {
    var e = b.div(c), f = b.subtract(e.multiply(c)).toInt().toString(a), b = e;
    if (b.isZero()) {
      return f + d;
    }
    for (;6 > f.length;) {
      f = "0" + f;
    }
    d = "" + f + d;
  }
};
goog.math.Long.prototype.getHighBits = function() {
  return this.high_;
};
goog.math.Long.prototype.getLowBits = function() {
  return this.low_;
};
goog.math.Long.prototype.getLowBitsUnsigned = function() {
  return 0 <= this.low_ ? this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
};
goog.math.Long.prototype.getNumBitsAbs = function() {
  if (this.isNegative()) {
    return this.equals(goog.math.Long.MIN_VALUE) ? 64 : this.negate().getNumBitsAbs();
  }
  for (var a = 0 != this.high_ ? this.high_ : this.low_, b = 31;0 < b && 0 == (a & 1 << b);b--) {
  }
  return 0 != this.high_ ? b + 33 : b + 1;
};
goog.math.Long.prototype.isZero = function() {
  return 0 == this.high_ && 0 == this.low_;
};
goog.math.Long.prototype.isNegative = function() {
  return 0 > this.high_;
};
goog.math.Long.prototype.isOdd = function() {
  return 1 == (this.low_ & 1);
};
goog.math.Long.prototype.equals = function(a) {
  return this.high_ == a.high_ && this.low_ == a.low_;
};
goog.math.Long.prototype.notEquals = function(a) {
  return this.high_ != a.high_ || this.low_ != a.low_;
};
goog.math.Long.prototype.lessThan = function(a) {
  return 0 > this.compare(a);
};
goog.math.Long.prototype.lessThanOrEqual = function(a) {
  return 0 >= this.compare(a);
};
goog.math.Long.prototype.greaterThan = function(a) {
  return 0 < this.compare(a);
};
goog.math.Long.prototype.greaterThanOrEqual = function(a) {
  return 0 <= this.compare(a);
};
goog.math.Long.prototype.compare = function(a) {
  if (this.equals(a)) {
    return 0;
  }
  var b = this.isNegative(), c = a.isNegative();
  return b && !c ? -1 : !b && c ? 1 : this.subtract(a).isNegative() ? -1 : 1;
};
goog.math.Long.prototype.negate = function() {
  return this.equals(goog.math.Long.MIN_VALUE) ? goog.math.Long.MIN_VALUE : this.not().add(goog.math.Long.ONE);
};
goog.math.Long.prototype.add = function(a) {
  var b = this.high_ >>> 16, c = this.high_ & 65535, d = this.low_ >>> 16, e = a.high_ >>> 16, f = a.high_ & 65535, g = a.low_ >>> 16, k;
  k = 0 + ((this.low_ & 65535) + (a.low_ & 65535));
  a = 0 + (k >>> 16);
  a += d + g;
  d = 0 + (a >>> 16);
  d += c + f;
  c = 0 + (d >>> 16);
  c = c + (b + e) & 65535;
  return goog.math.Long.fromBits((a & 65535) << 16 | k & 65535, c << 16 | d & 65535);
};
goog.math.Long.prototype.subtract = function(a) {
  return this.add(a.negate());
};
goog.math.Long.prototype.multiply = function(a) {
  if (this.isZero() || a.isZero()) {
    return goog.math.Long.ZERO;
  }
  if (this.equals(goog.math.Long.MIN_VALUE)) {
    return a.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
  }
  if (a.equals(goog.math.Long.MIN_VALUE)) {
    return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
  }
  if (this.isNegative()) {
    return a.isNegative() ? this.negate().multiply(a.negate()) : this.negate().multiply(a).negate();
  }
  if (a.isNegative()) {
    return this.multiply(a.negate()).negate();
  }
  if (this.lessThan(goog.math.Long.TWO_PWR_24_) && a.lessThan(goog.math.Long.TWO_PWR_24_)) {
    return goog.math.Long.fromNumber(this.toNumber() * a.toNumber());
  }
  var b = this.high_ >>> 16, c = this.high_ & 65535, d = this.low_ >>> 16, e = this.low_ & 65535, f = a.high_ >>> 16, g = a.high_ & 65535, k = a.low_ >>> 16;
  a = a.low_ & 65535;
  var m, l, p, s;
  s = 0 + e * a;
  p = 0 + (s >>> 16);
  p += d * a;
  l = 0 + (p >>> 16);
  p = (p & 65535) + e * k;
  l += p >>> 16;
  p &= 65535;
  l += c * a;
  m = 0 + (l >>> 16);
  l = (l & 65535) + d * k;
  m += l >>> 16;
  l &= 65535;
  l += e * g;
  m += l >>> 16;
  l &= 65535;
  m = m + (b * a + c * k + d * g + e * f) & 65535;
  return goog.math.Long.fromBits(p << 16 | s & 65535, m << 16 | l);
};
goog.math.Long.prototype.div = function(a) {
  if (a.isZero()) {
    throw Error("division by zero");
  }
  if (this.isZero()) {
    return goog.math.Long.ZERO;
  }
  if (this.equals(goog.math.Long.MIN_VALUE)) {
    if (a.equals(goog.math.Long.ONE) || a.equals(goog.math.Long.NEG_ONE)) {
      return goog.math.Long.MIN_VALUE;
    }
    if (a.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ONE;
    }
    var b = this.shiftRight(1).div(a).shiftLeft(1);
    if (b.equals(goog.math.Long.ZERO)) {
      return a.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
    }
    var c = this.subtract(a.multiply(b));
    return b.add(c.div(a));
  }
  if (a.equals(goog.math.Long.MIN_VALUE)) {
    return goog.math.Long.ZERO;
  }
  if (this.isNegative()) {
    return a.isNegative() ? this.negate().div(a.negate()) : this.negate().div(a).negate();
  }
  if (a.isNegative()) {
    return this.div(a.negate()).negate();
  }
  for (var d = goog.math.Long.ZERO, c = this;c.greaterThanOrEqual(a);) {
    for (var b = Math.max(1, Math.floor(c.toNumber() / a.toNumber())), e = Math.ceil(Math.log(b) / Math.LN2), e = 48 >= e ? 1 : Math.pow(2, e - 48), f = goog.math.Long.fromNumber(b), g = f.multiply(a);g.isNegative() || g.greaterThan(c);) {
      b -= e, f = goog.math.Long.fromNumber(b), g = f.multiply(a);
    }
    f.isZero() && (f = goog.math.Long.ONE);
    d = d.add(f);
    c = c.subtract(g);
  }
  return d;
};
goog.math.Long.prototype.modulo = function(a) {
  return this.subtract(this.div(a).multiply(a));
};
goog.math.Long.prototype.not = function() {
  return goog.math.Long.fromBits(~this.low_, ~this.high_);
};
goog.math.Long.prototype.and = function(a) {
  return goog.math.Long.fromBits(this.low_ & a.low_, this.high_ & a.high_);
};
goog.math.Long.prototype.or = function(a) {
  return goog.math.Long.fromBits(this.low_ | a.low_, this.high_ | a.high_);
};
goog.math.Long.prototype.xor = function(a) {
  return goog.math.Long.fromBits(this.low_ ^ a.low_, this.high_ ^ a.high_);
};
goog.math.Long.prototype.shiftLeft = function(a) {
  a &= 63;
  if (0 == a) {
    return this;
  }
  var b = this.low_;
  return 32 > a ? goog.math.Long.fromBits(b << a, this.high_ << a | b >>> 32 - a) : goog.math.Long.fromBits(0, b << a - 32);
};
goog.math.Long.prototype.shiftRight = function(a) {
  a &= 63;
  if (0 == a) {
    return this;
  }
  var b = this.high_;
  return 32 > a ? goog.math.Long.fromBits(this.low_ >>> a | b << 32 - a, b >> a) : goog.math.Long.fromBits(b >> a - 32, 0 <= b ? 0 : -1);
};
goog.math.Long.prototype.shiftRightUnsigned = function(a) {
  a &= 63;
  if (0 == a) {
    return this;
  }
  var b = this.high_;
  return 32 > a ? goog.math.Long.fromBits(this.low_ >>> a | b << 32 - a, b >>> a) : 32 == a ? goog.math.Long.fromBits(b, 0) : goog.math.Long.fromBits(b >>> a - 32, 0);
};
// Input 106
wtf.io.cff.BinaryStreamSource = function(a) {
  wtf.io.cff.StreamSource.call(this, a);
  this.legacyFormat_ = this.hasReadHeader_ = !1;
  this.legacyDatas_ = [];
  this.pendingChunks_ = [];
  this.pendingEnd_ = !1;
  a.setPreferredFormat(wtf.io.DataFormat.ARRAY_BUFFER);
};
goog.inherits(wtf.io.cff.BinaryStreamSource, wtf.io.cff.StreamSource);
wtf.io.cff.BinaryStreamSource.prototype.dataReceived = function(a) {
  a instanceof ArrayBuffer || (goog.asserts.assert(a && a.buffer instanceof ArrayBuffer), a = a.buffer);
  var b = 0;
  this.hasReadHeader_ || (b = this.parseHeader_(a));
  if (this.legacyFormat_) {
    this.legacyDatas_.push(new Uint8Array(a, b));
  } else {
    for (;b < a.byteLength;) {
      b = this.parseChunk_(a, b);
    }
  }
};
wtf.io.cff.BinaryStreamSource.prototype.ended = function() {
  if (this.legacyFormat_) {
    var a = wtf.io.combineByteArrays(this.legacyDatas_);
    this.legacyDatas_ = [];
    this.parseLegacyChunk_(a);
  }
  this.pendingEnd_ = !0;
  this.pumpPendingChunks_();
};
wtf.io.cff.BinaryStreamSource.prototype.parseHeader_ = function(a) {
  if (12 > a.byteLength) {
    throw Error("Invalid file magic header/header too small.");
  }
  var b = new Uint32Array(a, 0, 12), c = b[0];
  if (4022250974 == c) {
    return this.parseLegacyHeader_(a);
  }
  if (3735928559 == c) {
    if (b[1] > wtf.version.getValue()) {
      throw Error("Data is from a newer version of WTF. Unable to parse.");
    }
    a = b[2];
    if (a != wtf.data.formats.ChunkedFileFormat.VERSION) {
      throw Error("Data version " + a + " not supported.");
    }
    this.hasReadHeader_ = !0;
    return 12;
  }
  throw Error("File magic bytes mismatch.");
};
wtf.io.cff.BinaryStreamSource.prototype.parseLegacyHeader_ = function(a) {
  this.legacyFormat_ = !0;
  a = new wtf.io.Buffer(a.byteLength, void 0, new Uint8Array(a));
  if (3735928559 != a.readUint32()) {
    throw Error("File magic bytes mismatch.");
  }
  if (a.readUint32() > wtf.version.getValue()) {
    throw Error("Data is from a newer version of WTF. Unable to parse.");
  }
  var b = a.readUint32();
  if (b != wtf.data.formats.BinaryTrace.VERSION) {
    throw Error("Legacy data version " + b + " not supported.");
  }
  this.hasReadHeader_ = !0;
  b = this.parseLegacyContextInfo_(a);
  if (!b) {
    throw Error("Invalid context information.");
  }
  var c = a.readUint32(), d = goog.math.Long.fromBits(a.readUint32(), a.readUint32()).toNumber(), e = a.readUtf8String(), f = e ? goog.global.JSON.parse(e) : {};
  goog.isObject(f) || (f = {});
  e = new wtf.io.cff.parts.FileHeaderPart;
  e.setFlags(c);
  e.setTimebase(d);
  e.setContextInfo(b);
  e.setMetadata(f);
  b = new wtf.io.cff.chunks.FileHeaderChunk(0);
  this.pendingChunks_.push({chunk:b, parts:[e], deferred:null});
  this.pumpPendingChunks_();
  return a.offset;
};
wtf.io.cff.BinaryStreamSource.prototype.parseLegacyContextInfo_ = function(a) {
  a = a.readUtf8String();
  return a ? (a = goog.global.JSON.parse(a)) ? wtf.data.ContextInfo.parse(a) : null : null;
};
wtf.io.cff.BinaryStreamSource.prototype.parseLegacyChunk_ = function(a) {
  a = new wtf.io.Buffer(a.byteLength, void 0, a);
  a = new wtf.io.cff.parts.LegacyEventBufferPart(a);
  var b = new wtf.io.cff.chunks.EventDataChunk(1);
  this.pendingChunks_.push({chunk:b, parts:[a], deferred:null});
  this.pumpPendingChunks_();
};
wtf.io.cff.BinaryStreamSource.prototype.parseChunk_ = function(a, b) {
  if (24 > a.byteLength - b) {
    throw Error("Chunk header too small.");
  }
  var c = new Uint32Array(a, b), d = c[0], e = wtf.io.cff.ChunkType.fromInteger(c[1]), f = c[2], g = c[3], k = c[4], m = c[5], l = 24 + 12 * m;
  if (f < l) {
    throw Error("Chunk header missing part lengths.");
  }
  if (a.byteLength - b < f) {
    throw Error("Data does not contain the entire chunk.");
  }
  if (e == wtf.io.cff.ChunkType.UNKNOWN) {
    return goog.global.console && goog.global.console.log("WARNING: chunk type " + e + " ignored."), b + f;
  }
  d = this.createChunkType(d, e);
  goog.asserts.assert(d);
  if (!d) {
    throw Error("Chunk type unrecognized: " + e);
  }
  d.setTimeRange(g, k);
  for (var e = [], g = [], k = 6, p = 0;p < m;p++, k += 3) {
    var s = c[k + 0], t = new Uint8Array(a, b + l + c[k + 1], c[k + 2]);
    (s = this.parsePart_(s, t, e)) && g.push(s);
  }
  c = null;
  e.length && (c = new goog.async.DeferredList(e, !1, !0), c.addCallback(this.pumpPendingChunks_, this), c.addErrback(function(a) {
    this.emitErrorEvent(a);
  }, this));
  this.pendingChunks_.push({chunk:d, parts:g, deferred:c});
  this.pumpPendingChunks_();
  return b + f;
};
wtf.io.cff.BinaryStreamSource.prototype.parsePart_ = function(a, b, c) {
  var d = wtf.io.cff.PartType.fromInteger(a);
  if (!wtf.io.cff.PartType.isValid(d)) {
    return goog.global.console && goog.global.console.log("WARNING: part type " + a + " ignored."), null;
  }
  a = this.createPartType(d);
  goog.asserts.assert(a);
  if (!a) {
    throw Error("Part type unrecognized: " + d);
  }
  (b = a.initFromBlobData(b)) && c.push(b);
  return a;
};
wtf.io.cff.BinaryStreamSource.prototype.pumpPendingChunks_ = function() {
  for (;this.pendingChunks_.length;) {
    var a = this.pendingChunks_[0];
    if (!a.deferred || a.deferred.hasFired()) {
      a.chunk.load(a.parts), this.emitChunkReceivedEvent(a.chunk), this.pendingChunks_.shift();
    } else {
      break;
    }
  }
  !this.pendingChunks_.length && this.pendingEnd_ && this.emitEndEvent();
};
// Input 107
wtf.io.cff.JsonStreamSource = function(a) {
  wtf.io.cff.StreamSource.call(this, a);
  this.hasReadHeader_ = !1;
  a.setPreferredFormat(wtf.io.DataFormat.STRING);
  a.addListener(wtf.io.ReadTransport.EventType.END, this.emitEndEvent, this);
};
goog.inherits(wtf.io.cff.JsonStreamSource, wtf.io.cff.StreamSource);
wtf.io.cff.JsonStreamSource.prototype.dataReceived = function(a) {
  goog.asserts.assert("string" == typeof a);
  var b;
  try {
    b = goog.global.JSON.parse(a);
  } catch (c) {
    throw a = Error("Unable to parse JSON stream data: " + c), a.innerException = c, a;
  }
  if (!b || "object" != typeof b) {
    throw Error("Expected object at the root of the JSON object.");
  }
  if (b.wtfVersion) {
    if (this.hasReadHeader_) {
      throw Error("Received multiple headers when expecting partial data.");
    }
    this.parseHeader_(b);
  }
  if ((a = b.chunks) && goog.isArray(a) && a.length) {
    for (b = 0;b < a.length;b++) {
      var d = a[b];
      if (!d || "object" != typeof d) {
        throw Error("Expected chunk to be an object.");
      }
      this.parseChunk_(d);
    }
  }
};
wtf.io.cff.JsonStreamSource.prototype.parseHeader_ = function(a) {
  var b = a.formatVersion;
  if (a.wtfVersion > wtf.version.getValue()) {
    throw Error("Data is from a newer version of WTF. Unable to parse.");
  }
  if (b != wtf.data.formats.ChunkedFileFormat.VERSION) {
    throw Error("Data version " + b + " not supported.");
  }
  this.hasReadHeader_ = !0;
};
wtf.io.cff.JsonStreamSource.prototype.parseChunk_ = function(a) {
  var b = Number(a.id), c = a.type, d = a.startTime, e = a.endTime;
  a = a.parts;
  if (!goog.isDef(b)) {
    throw Error('Chunk missing required "id" field.');
  }
  if (!c) {
    throw Error('Chunk missing required "type" field.');
  }
  if (!a) {
    throw Error('Chunk missing required "parts" field.');
  }
  if (wtf.io.cff.ChunkType.isValid(c)) {
    b = this.createChunkType(b, c);
    goog.asserts.assert(b);
    if (!b) {
      throw Error("Chunk type unrecognized: " + c);
    }
    goog.isDef(d) && goog.isDef(e) && b.setTimeRange(d, e);
    c = [];
    for (d = 0;d < a.length;d++) {
      e = a[d];
      if (!e || "object" != typeof e) {
        throw Error("Expected part to be an object.");
      }
      (e = this.parsePart_(e)) && c.push(e);
    }
    b.load(c);
    this.emitChunkReceivedEvent(b);
  } else {
    goog.global.console && goog.global.console.log("WARNING: chunk type " + c + " ignored.");
  }
};
wtf.io.cff.JsonStreamSource.prototype.parsePart_ = function(a) {
  var b = a.type;
  if (!b) {
    throw Error('Part missing required "type" field.');
  }
  if (!wtf.io.cff.PartType.isValid(b)) {
    return goog.global.console && goog.global.console.log("WARNING: part type " + b + " ignored."), null;
  }
  var c = this.createPartType(b);
  goog.asserts.assert(c);
  if (!c) {
    throw Error("Part type unrecognized: " + b);
  }
  c.initFromJsonObject(a);
  return c;
};
// Input 108
goog.events.EventTarget = function() {
  goog.Disposable.call(this);
  this.eventTargetListeners_ = new goog.events.ListenerMap(this);
  this.actualEventTarget_ = this;
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.Listenable.addImplementation(goog.events.EventTarget);
goog.events.EventTarget.MAX_ANCESTORS_ = 1E3;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_;
};
goog.events.EventTarget.prototype.setParentEventTarget = function(a) {
  this.parentEventTarget_ = a;
};
goog.events.EventTarget.prototype.addEventListener = function(a, b, c, d) {
  goog.events.listen(this, a, b, c, d);
};
goog.events.EventTarget.prototype.removeEventListener = function(a, b, c, d) {
  goog.events.unlisten(this, a, b, c, d);
};
goog.events.EventTarget.prototype.dispatchEvent = function(a) {
  this.assertInitialized_();
  var b, c = this.getParentEventTarget();
  if (c) {
    b = [];
    for (var d = 1;c;c = c.getParentEventTarget()) {
      b.push(c), goog.asserts.assert(++d < goog.events.EventTarget.MAX_ANCESTORS_, "infinite loop");
    }
  }
  return goog.events.EventTarget.dispatchEventInternal_(this.actualEventTarget_, a, b);
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  this.removeAllListeners();
  this.parentEventTarget_ = null;
};
goog.events.EventTarget.prototype.listen = function(a, b, c, d) {
  this.assertInitialized_();
  return this.eventTargetListeners_.add(String(a), b, !1, c, d);
};
goog.events.EventTarget.prototype.listenOnce = function(a, b, c, d) {
  return this.eventTargetListeners_.add(String(a), b, !0, c, d);
};
goog.events.EventTarget.prototype.unlisten = function(a, b, c, d) {
  return this.eventTargetListeners_.remove(String(a), b, c, d);
};
goog.events.EventTarget.prototype.unlistenByKey = function(a) {
  return this.eventTargetListeners_.removeByKey(a);
};
goog.events.EventTarget.prototype.removeAllListeners = function(a) {
  return this.eventTargetListeners_ ? this.eventTargetListeners_.removeAll(a) : 0;
};
goog.events.EventTarget.prototype.fireListeners = function(a, b, c) {
  a = this.eventTargetListeners_.listeners[String(a)];
  if (!a) {
    return!0;
  }
  a = goog.array.clone(a);
  for (var d = !0, e = 0;e < a.length;++e) {
    var f = a[e];
    if (f && !f.removed && f.capture == b) {
      var g = f.listener, k = f.handler || f.src;
      f.callOnce && this.unlistenByKey(f);
      d = !1 !== g.call(k, c) && d;
    }
  }
  return d && !1 != c.returnValue_;
};
goog.events.EventTarget.prototype.getListeners = function(a, b) {
  return this.eventTargetListeners_.getListeners(String(a), b);
};
goog.events.EventTarget.prototype.getListener = function(a, b, c, d) {
  return this.eventTargetListeners_.getListener(String(a), b, c, d);
};
goog.events.EventTarget.prototype.hasListener = function(a, b) {
  var c = goog.isDef(a) ? String(a) : void 0;
  return this.eventTargetListeners_.hasListener(c, b);
};
goog.events.EventTarget.prototype.setTargetForTesting = function(a) {
  this.actualEventTarget_ = a;
};
goog.events.EventTarget.prototype.assertInitialized_ = function() {
  goog.asserts.assert(this.eventTargetListeners_, "Event target is not initialized. Did you call the superclass (goog.events.EventTarget) constructor?");
};
goog.events.EventTarget.dispatchEventInternal_ = function(a, b, c) {
  var d = b.type || b;
  if (goog.isString(b)) {
    b = new goog.events.Event(b, a);
  } else {
    if (b instanceof goog.events.Event) {
      b.target = b.target || a;
    } else {
      var e = b;
      b = new goog.events.Event(d, a);
      goog.object.extend(b, e);
    }
  }
  var e = !0, f;
  if (c) {
    for (var g = c.length - 1;!b.propagationStopped_ && 0 <= g;g--) {
      f = b.currentTarget = c[g], e = f.fireListeners(d, !0, b) && e;
    }
  }
  b.propagationStopped_ || (f = b.currentTarget = a, e = f.fireListeners(d, !0, b) && e, b.propagationStopped_ || (e = f.fireListeners(d, !1, b) && e));
  if (c) {
    for (g = 0;!b.propagationStopped_ && g < c.length;g++) {
      f = b.currentTarget = c[g], e = f.fireListeners(d, !1, b) && e;
    }
  }
  return e;
};
// Input 109
goog.fs = {};
goog.fs.Error = function(a, b) {
  goog.debug.Error.call(this, goog.string.subs("Error %s: %s", b, goog.fs.Error.getDebugMessage(a)));
  this.code = a;
};
goog.inherits(goog.fs.Error, goog.debug.Error);
goog.fs.Error.ErrorCode = {NOT_FOUND:1, SECURITY:2, ABORT:3, NOT_READABLE:4, ENCODING:5, NO_MODIFICATION_ALLOWED:6, INVALID_STATE:7, SYNTAX:8, INVALID_MODIFICATION:9, QUOTA_EXCEEDED:10, TYPE_MISMATCH:11, PATH_EXISTS:12};
goog.fs.Error.getDebugMessage = function(a) {
  switch(a) {
    case goog.fs.Error.ErrorCode.NOT_FOUND:
      return "File or directory not found";
    case goog.fs.Error.ErrorCode.SECURITY:
      return "Insecure or disallowed operation";
    case goog.fs.Error.ErrorCode.ABORT:
      return "Operation aborted";
    case goog.fs.Error.ErrorCode.NOT_READABLE:
      return "File or directory not readable";
    case goog.fs.Error.ErrorCode.ENCODING:
      return "Invalid encoding";
    case goog.fs.Error.ErrorCode.NO_MODIFICATION_ALLOWED:
      return "Cannot modify file or directory";
    case goog.fs.Error.ErrorCode.INVALID_STATE:
      return "Invalid state";
    case goog.fs.Error.ErrorCode.SYNTAX:
      return "Invalid line-ending specifier";
    case goog.fs.Error.ErrorCode.INVALID_MODIFICATION:
      return "Invalid modification";
    case goog.fs.Error.ErrorCode.QUOTA_EXCEEDED:
      return "Quota exceeded";
    case goog.fs.Error.ErrorCode.TYPE_MISMATCH:
      return "Invalid filetype";
    case goog.fs.Error.ErrorCode.PATH_EXISTS:
      return "File or directory already exists at specified path";
    default:
      return "Unrecognized error";
  }
};
// Input 110
goog.fs.ProgressEvent = function(a, b) {
  goog.events.Event.call(this, a.type, b);
  this.event_ = a;
};
goog.inherits(goog.fs.ProgressEvent, goog.events.Event);
goog.fs.ProgressEvent.prototype.isLengthComputable = function() {
  return this.event_.lengthComputable;
};
goog.fs.ProgressEvent.prototype.getLoaded = function() {
  return this.event_.loaded;
};
goog.fs.ProgressEvent.prototype.getTotal = function() {
  return this.event_.total;
};
// Input 111
goog.fs.FileReader = function() {
  goog.events.EventTarget.call(this);
  this.reader_ = new FileReader;
  this.reader_.onloadstart = goog.bind(this.dispatchProgressEvent_, this);
  this.reader_.onprogress = goog.bind(this.dispatchProgressEvent_, this);
  this.reader_.onload = goog.bind(this.dispatchProgressEvent_, this);
  this.reader_.onabort = goog.bind(this.dispatchProgressEvent_, this);
  this.reader_.onerror = goog.bind(this.dispatchProgressEvent_, this);
  this.reader_.onloadend = goog.bind(this.dispatchProgressEvent_, this);
};
goog.inherits(goog.fs.FileReader, goog.events.EventTarget);
goog.fs.FileReader.ReadyState = {INIT:0, LOADING:1, DONE:2};
goog.fs.FileReader.EventType = {LOAD_START:"loadstart", PROGRESS:"progress", LOAD:"load", ABORT:"abort", ERROR:"error", LOAD_END:"loadend"};
goog.fs.FileReader.prototype.abort = function() {
  try {
    this.reader_.abort();
  } catch (a) {
    throw new goog.fs.Error(a.code, "aborting read");
  }
};
goog.fs.FileReader.prototype.getReadyState = function() {
  return this.reader_.readyState;
};
goog.fs.FileReader.prototype.getResult = function() {
  return this.reader_.result;
};
goog.fs.FileReader.prototype.getError = function() {
  return this.reader_.error && new goog.fs.Error(this.reader_.error.code, "reading file");
};
goog.fs.FileReader.prototype.dispatchProgressEvent_ = function(a) {
  this.dispatchEvent(new goog.fs.ProgressEvent(a, this));
};
goog.fs.FileReader.prototype.disposeInternal = function() {
  goog.fs.FileReader.superClass_.disposeInternal.call(this);
  delete this.reader_;
};
goog.fs.FileReader.prototype.readAsBinaryString = function(a) {
  this.reader_.readAsBinaryString(a);
};
goog.fs.FileReader.readAsBinaryString = function(a) {
  var b = new goog.fs.FileReader, c = goog.fs.FileReader.createDeferred_(b);
  b.readAsBinaryString(a);
  return c;
};
goog.fs.FileReader.prototype.readAsArrayBuffer = function(a) {
  this.reader_.readAsArrayBuffer(a);
};
goog.fs.FileReader.readAsArrayBuffer = function(a) {
  var b = new goog.fs.FileReader, c = goog.fs.FileReader.createDeferred_(b);
  b.readAsArrayBuffer(a);
  return c;
};
goog.fs.FileReader.prototype.readAsText = function(a, b) {
  this.reader_.readAsText(a, b);
};
goog.fs.FileReader.readAsText = function(a, b) {
  var c = new goog.fs.FileReader, d = goog.fs.FileReader.createDeferred_(c);
  c.readAsText(a, b);
  return d;
};
goog.fs.FileReader.prototype.readAsDataUrl = function(a) {
  this.reader_.readAsDataURL(a);
};
goog.fs.FileReader.readAsDataUrl = function(a) {
  var b = new goog.fs.FileReader, c = goog.fs.FileReader.createDeferred_(b);
  b.readAsDataUrl(a);
  return c;
};
goog.fs.FileReader.createDeferred_ = function(a) {
  var b = new goog.async.Deferred;
  a.listen(goog.fs.FileReader.EventType.LOAD_END, goog.partial(function(a, b, e) {
    e = b.getResult();
    var f = b.getError();
    null == e || f ? a.errback(f) : a.callback(e);
    b.dispose();
  }, b, a));
  return b;
};
// Input 112
wtf.io.transports = {};
wtf.io.transports.MemoryReadTransport = function() {
  wtf.io.ReadTransport.call(this);
  this.dispatchPending_ = !1;
  this.pendingData_ = [];
  this.pendingAdds_ = 0;
  this.pendingEnd_ = !1;
};
goog.inherits(wtf.io.transports.MemoryReadTransport, wtf.io.ReadTransport);
wtf.io.transports.MemoryReadTransport.PRETEND_ASYNC_ = !0;
wtf.io.transports.MemoryReadTransport.prototype.resume = function() {
  wtf.io.transports.MemoryReadTransport.superClass_.resume.call(this);
  this.scheduleDispatch_();
};
wtf.io.transports.MemoryReadTransport.prototype.end = function() {
  this.pendingEnd_ = !0;
  this.scheduleDispatch_();
};
wtf.io.transports.MemoryReadTransport.prototype.addData = function(a) {
  wtf.io.Blob.isBlob(a) && (a = wtf.io.Blob.toNative(a));
  if (goog.global.Blob && a instanceof Blob) {
    switch(this.format) {
      case wtf.io.DataFormat.STRING:
        this.pendingAdds_++;
        goog.fs.FileReader.readAsText(a).addCallback(function(a) {
          this.pendingAdds_--;
          this.pendingData_.push(a);
          this.scheduleDispatch_();
        }, this);
        break;
      case wtf.io.DataFormat.ARRAY_BUFFER:
        this.pendingAdds_++;
        goog.fs.FileReader.readAsArrayBuffer(a).addCallback(function(a) {
          this.pendingAdds_--;
          this.pendingData_.push(a);
          this.scheduleDispatch_();
        }, this);
        break;
      case wtf.io.DataFormat.BLOB:
        this.pendingData_.push(a);
        this.scheduleDispatch_();
        break;
      default:
        goog.asserts.fail("Unknown data format.");
    }
  } else {
    switch(this.format) {
      case wtf.io.DataFormat.STRING:
        goog.asserts.assert("string" == typeof a);
        break;
      case wtf.io.DataFormat.ARRAY_BUFFER:
        goog.asserts.assert(a instanceof ArrayBuffer || a.buffer && a.buffer instanceof ArrayBuffer);
        break;
      case wtf.io.DataFormat.BLOB:
        goog.asserts.assert(a instanceof Blob);
        break;
      default:
        goog.asserts.fail("Unknown data format.");
    }
    this.pendingData_.push(a);
    this.scheduleDispatch_();
  }
};
wtf.io.transports.MemoryReadTransport.prototype.scheduleDispatch_ = function() {
  this.paused || this.dispatchPending_ || (this.dispatchPending_ = !0, wtf.io.transports.MemoryReadTransport.PRETEND_ASYNC_ ? wtf.timing.setImmediate(this.dispatch_, this) : this.dispatch_());
};
wtf.io.transports.MemoryReadTransport.prototype.dispatch_ = function() {
  this.dispatchPending_ = !1;
  if (!this.paused) {
    for (;this.pendingData_.length;) {
      var a = this.pendingData_.pop();
      this.emitReceiveData(a);
    }
    this.pendingAdds_ || this.pendingData_.length || !this.pendingEnd_ || goog.dispose(this);
  }
};
// Input 113
goog.fs.Entry = function() {
};
goog.fs.Entry.prototype.isFile = function() {
};
goog.fs.Entry.prototype.isDirectory = function() {
};
goog.fs.Entry.prototype.getName = function() {
};
goog.fs.Entry.prototype.getFullPath = function() {
};
goog.fs.Entry.prototype.getFileSystem = function() {
};
goog.fs.Entry.prototype.getLastModified = function() {
};
goog.fs.Entry.prototype.getMetadata = function() {
};
goog.fs.Entry.prototype.moveTo = function(a, b) {
};
goog.fs.Entry.prototype.copyTo = function(a, b) {
};
goog.fs.Entry.prototype.wrapEntry = function(a) {
};
goog.fs.Entry.prototype.toUrl = function(a) {
};
goog.fs.Entry.prototype.toUri = function(a) {
};
goog.fs.Entry.prototype.remove = function() {
};
goog.fs.Entry.prototype.getParent = function() {
};
goog.fs.DirectoryEntry = function() {
};
goog.fs.DirectoryEntry.Behavior = {DEFAULT:1, CREATE:2, CREATE_EXCLUSIVE:3};
goog.fs.DirectoryEntry.prototype.getFile = function(a, b) {
};
goog.fs.DirectoryEntry.prototype.getDirectory = function(a, b) {
};
goog.fs.DirectoryEntry.prototype.createPath = function(a) {
};
goog.fs.DirectoryEntry.prototype.listDirectory = function() {
};
goog.fs.DirectoryEntry.prototype.removeRecursively = function() {
};
goog.fs.FileEntry = function() {
};
goog.fs.FileEntry.prototype.createWriter = function() {
};
goog.fs.FileEntry.prototype.file = function() {
};
// Input 114
goog.fs.FileSaver = function(a) {
  goog.events.EventTarget.call(this);
  this.saver_ = a;
  this.saver_.onwritestart = goog.bind(this.dispatchProgressEvent_, this);
  this.saver_.onprogress = goog.bind(this.dispatchProgressEvent_, this);
  this.saver_.onwrite = goog.bind(this.dispatchProgressEvent_, this);
  this.saver_.onabort = goog.bind(this.dispatchProgressEvent_, this);
  this.saver_.onerror = goog.bind(this.dispatchProgressEvent_, this);
  this.saver_.onwriteend = goog.bind(this.dispatchProgressEvent_, this);
};
goog.inherits(goog.fs.FileSaver, goog.events.EventTarget);
goog.fs.FileSaver.ReadyState = {INIT:0, WRITING:1, DONE:2};
goog.fs.FileSaver.EventType = {WRITE_START:"writestart", PROGRESS:"progress", WRITE:"write", ABORT:"abort", ERROR:"error", WRITE_END:"writeend"};
goog.fs.FileSaver.prototype.abort = function() {
  try {
    this.saver_.abort();
  } catch (a) {
    throw new goog.fs.Error(a.code, "aborting save");
  }
};
goog.fs.FileSaver.prototype.getReadyState = function() {
  return this.saver_.readyState;
};
goog.fs.FileSaver.prototype.getError = function() {
  return this.saver_.error && new goog.fs.Error(this.saver_.error.code, "saving file");
};
goog.fs.FileSaver.prototype.dispatchProgressEvent_ = function(a) {
  this.dispatchEvent(new goog.fs.ProgressEvent(a, this));
};
goog.fs.FileSaver.prototype.disposeInternal = function() {
  delete this.saver_;
  goog.fs.FileSaver.superClass_.disposeInternal.call(this);
};
goog.fs.FileSaver.ProgressEvent = goog.fs.ProgressEvent;
// Input 115
goog.fs.FileWriter = function(a) {
  goog.fs.FileSaver.call(this, a);
  this.writer_ = a;
};
goog.inherits(goog.fs.FileWriter, goog.fs.FileSaver);
goog.fs.FileWriter.prototype.getPosition = function() {
  return this.writer_.position;
};
goog.fs.FileWriter.prototype.getLength = function() {
  return this.writer_.length;
};
goog.fs.FileWriter.prototype.write = function(a) {
  try {
    this.writer_.write(a);
  } catch (b) {
    throw new goog.fs.Error(b.code, "writing file");
  }
};
goog.fs.FileWriter.prototype.seek = function(a) {
  try {
    this.writer_.seek(a);
  } catch (b) {
    throw new goog.fs.Error(b.code, "seeking in file");
  }
};
goog.fs.FileWriter.prototype.truncate = function(a) {
  try {
    this.writer_.truncate(a);
  } catch (b) {
    throw new goog.fs.Error(b.code, "truncating file");
  }
};
// Input 116
goog.fs.EntryImpl = function(a, b) {
  this.fs_ = a;
  this.entry_ = b;
};
goog.fs.EntryImpl.prototype.isFile = function() {
  return this.entry_.isFile;
};
goog.fs.EntryImpl.prototype.isDirectory = function() {
  return this.entry_.isDirectory;
};
goog.fs.EntryImpl.prototype.getName = function() {
  return this.entry_.name;
};
goog.fs.EntryImpl.prototype.getFullPath = function() {
  return this.entry_.fullPath;
};
goog.fs.EntryImpl.prototype.getFileSystem = function() {
  return this.fs_;
};
goog.fs.EntryImpl.prototype.getLastModified = function() {
  return this.getMetadata().addCallback(function(a) {
    return a.modificationTime;
  });
};
goog.fs.EntryImpl.prototype.getMetadata = function() {
  var a = new goog.async.Deferred;
  this.entry_.getMetadata(function(b) {
    a.callback(b);
  }, goog.bind(function(b) {
    var c = "retrieving metadata for " + this.getFullPath();
    a.errback(new goog.fs.Error(b.code, c));
  }, this));
  return a;
};
goog.fs.EntryImpl.prototype.moveTo = function(a, b) {
  var c = new goog.async.Deferred;
  this.entry_.moveTo(a.dir_, b, goog.bind(function(a) {
    c.callback(this.wrapEntry(a));
  }, this), goog.bind(function(d) {
    var e = "moving " + this.getFullPath() + " into " + a.getFullPath() + (b ? ", renaming to " + b : "");
    c.errback(new goog.fs.Error(d.code, e));
  }, this));
  return c;
};
goog.fs.EntryImpl.prototype.copyTo = function(a, b) {
  var c = new goog.async.Deferred;
  this.entry_.copyTo(a.dir_, b, goog.bind(function(a) {
    c.callback(this.wrapEntry(a));
  }, this), goog.bind(function(d) {
    var e = "copying " + this.getFullPath() + " into " + a.getFullPath() + (b ? ", renaming to " + b : "");
    c.errback(new goog.fs.Error(d.code, e));
  }, this));
  return c;
};
goog.fs.EntryImpl.prototype.wrapEntry = function(a) {
  return a.isFile ? new goog.fs.FileEntryImpl(this.fs_, a) : new goog.fs.DirectoryEntryImpl(this.fs_, a);
};
goog.fs.EntryImpl.prototype.toUrl = function(a) {
  return this.entry_.toURL(a);
};
goog.fs.EntryImpl.prototype.toUri = goog.fs.EntryImpl.prototype.toUrl;
goog.fs.EntryImpl.prototype.remove = function() {
  var a = new goog.async.Deferred;
  this.entry_.remove(goog.bind(a.callback, a, !0), goog.bind(function(b) {
    var c = "removing " + this.getFullPath();
    a.errback(new goog.fs.Error(b.code, c));
  }, this));
  return a;
};
goog.fs.EntryImpl.prototype.getParent = function() {
  var a = new goog.async.Deferred;
  this.entry_.getParent(goog.bind(function(b) {
    a.callback(new goog.fs.DirectoryEntryImpl(this.fs_, b));
  }, this), goog.bind(function(b) {
    var c = "getting parent of " + this.getFullPath();
    a.errback(new goog.fs.Error(b.code, c));
  }, this));
  return a;
};
goog.fs.DirectoryEntryImpl = function(a, b) {
  goog.fs.EntryImpl.call(this, a, b);
  this.dir_ = b;
};
goog.inherits(goog.fs.DirectoryEntryImpl, goog.fs.EntryImpl);
goog.fs.DirectoryEntryImpl.prototype.getFile = function(a, b) {
  var c = new goog.async.Deferred;
  this.dir_.getFile(a, this.getOptions_(b), goog.bind(function(a) {
    c.callback(new goog.fs.FileEntryImpl(this.fs_, a));
  }, this), goog.bind(function(b) {
    var e = "loading file " + a + " from " + this.getFullPath();
    c.errback(new goog.fs.Error(b.code, e));
  }, this));
  return c;
};
goog.fs.DirectoryEntryImpl.prototype.getDirectory = function(a, b) {
  var c = new goog.async.Deferred;
  this.dir_.getDirectory(a, this.getOptions_(b), goog.bind(function(a) {
    c.callback(new goog.fs.DirectoryEntryImpl(this.fs_, a));
  }, this), goog.bind(function(b) {
    var e = "loading directory " + a + " from " + this.getFullPath();
    c.errback(new goog.fs.Error(b.code, e));
  }, this));
  return c;
};
goog.fs.DirectoryEntryImpl.prototype.createPath = function(a) {
  function b(a) {
    if (!d.length) {
      return goog.async.Deferred.succeed(a);
    }
    var c = d.shift();
    return(".." == c ? a.getParent() : "." == c ? goog.async.Deferred.succeed(a) : a.getDirectory(c, goog.fs.DirectoryEntry.Behavior.CREATE)).addCallback(b);
  }
  if (goog.string.startsWith(a, "/")) {
    var c = this.getFileSystem().getRoot();
    if (this.getFullPath() != c.getFullPath()) {
      return c.createPath(a);
    }
  }
  var d = goog.array.filter(a.split("/"), goog.functions.identity);
  return b(this);
};
goog.fs.DirectoryEntryImpl.prototype.listDirectory = function() {
  var a = new goog.async.Deferred, b = this.dir_.createReader(), c = [], d = goog.bind(function(b) {
    var c = "listing directory " + this.getFullPath();
    a.errback(new goog.fs.Error(b.code, c));
  }, this), e = goog.bind(function(f) {
    if (f.length) {
      for (var g = 0, k;k = f[g];g++) {
        c.push(this.wrapEntry(k));
      }
      b.readEntries(e, d);
    } else {
      a.callback(c);
    }
  }, this);
  b.readEntries(e, d);
  return a;
};
goog.fs.DirectoryEntryImpl.prototype.removeRecursively = function() {
  var a = new goog.async.Deferred;
  this.dir_.removeRecursively(goog.bind(a.callback, a, !0), goog.bind(function(b) {
    var c = "removing " + this.getFullPath() + " recursively";
    a.errback(new goog.fs.Error(b.code, c));
  }, this));
  return a;
};
goog.fs.DirectoryEntryImpl.prototype.getOptions_ = function(a) {
  return a == goog.fs.DirectoryEntry.Behavior.CREATE ? {create:!0} : a == goog.fs.DirectoryEntry.Behavior.CREATE_EXCLUSIVE ? {create:!0, exclusive:!0} : {};
};
goog.fs.FileEntryImpl = function(a, b) {
  goog.fs.EntryImpl.call(this, a, b);
  this.file_ = b;
};
goog.inherits(goog.fs.FileEntryImpl, goog.fs.EntryImpl);
goog.fs.FileEntryImpl.prototype.createWriter = function() {
  var a = new goog.async.Deferred;
  this.file_.createWriter(function(b) {
    a.callback(new goog.fs.FileWriter(b));
  }, goog.bind(function(b) {
    var c = "creating writer for " + this.getFullPath();
    a.errback(new goog.fs.Error(b.code, c));
  }, this));
  return a;
};
goog.fs.FileEntryImpl.prototype.file = function() {
  var a = new goog.async.Deferred;
  this.file_.file(function(b) {
    a.callback(b);
  }, goog.bind(function(b) {
    var c = "getting file for " + this.getFullPath();
    a.errback(new goog.fs.Error(b.code, c));
  }, this));
  return a;
};
// Input 117
goog.fs.FileSystem = function() {
};
goog.fs.FileSystem.prototype.getName = function() {
};
goog.fs.FileSystem.prototype.getRoot = function() {
};
// Input 118
goog.fs.FileSystemImpl = function(a) {
  this.fs_ = a;
};
goog.fs.FileSystemImpl.prototype.getName = function() {
  return this.fs_.name;
};
goog.fs.FileSystemImpl.prototype.getRoot = function() {
  return new goog.fs.DirectoryEntryImpl(this, this.fs_.root);
};
goog.fs.FileSystemImpl.prototype.getBrowserFileSystem = function() {
  return this.fs_;
};
// Input 119
goog.fs.get_ = function(a, b) {
  var c = goog.global.requestFileSystem || goog.global.webkitRequestFileSystem;
  if (!goog.isFunction(c)) {
    return goog.async.Deferred.fail(Error("File API unsupported"));
  }
  var d = new goog.async.Deferred;
  c(a, b, function(a) {
    d.callback(new goog.fs.FileSystemImpl(a));
  }, function(a) {
    d.errback(new goog.fs.Error(a.code, "requesting filesystem"));
  });
  return d;
};
goog.fs.FileSystemType_ = {TEMPORARY:0, PERSISTENT:1};
goog.fs.getTemporary = function(a) {
  return goog.fs.get_(goog.fs.FileSystemType_.TEMPORARY, a);
};
goog.fs.getPersistent = function(a) {
  return goog.fs.get_(goog.fs.FileSystemType_.PERSISTENT, a);
};
goog.fs.createObjectUrl = function(a) {
  return goog.fs.getUrlObject_().createObjectURL(a);
};
goog.fs.revokeObjectUrl = function(a) {
  goog.fs.getUrlObject_().revokeObjectURL(a);
};
goog.fs.getUrlObject_ = function() {
  if (goog.isDef(goog.global.URL) && goog.isDef(goog.global.URL.createObjectURL)) {
    return goog.global.URL;
  }
  if (goog.isDef(goog.global.webkitURL) && goog.isDef(goog.global.webkitURL.createObjectURL)) {
    return goog.global.webkitURL;
  }
  if (goog.isDef(goog.global.createObjectURL)) {
    return goog.global;
  }
  throw Error("This browser doesn't seem to support blob URLs");
};
goog.fs.getBlob = function(a) {
  var b = goog.global.BlobBuilder || goog.global.WebKitBlobBuilder;
  if (goog.isDef(b)) {
    for (var b = new b, c = 0;c < arguments.length;c++) {
      b.append(arguments[c]);
    }
    return b.getBlob();
  }
  return new Blob(goog.array.toArray(arguments));
};
goog.fs.blobToString = function(a, b) {
  return goog.fs.FileReader.readAsText(a, b);
};
goog.fs.sliceBlob = function(a, b, c) {
  goog.isDef(c) || (c = a.size);
  return a.webkitSlice ? a.webkitSlice(b, c) : a.mozSlice ? a.mozSlice(b, c) : a.slice ? goog.userAgent.GECKO && !goog.userAgent.isVersionOrHigher("13.0") || goog.userAgent.WEBKIT && !goog.userAgent.isVersionOrHigher("537.1") ? (0 > b && (b += a.size), 0 > b && (b = 0), 0 > c && (c += a.size), c < b && (c = b), a.slice(b, c - b)) : a.slice(b, c) : null;
};
// Input 120
wtf.pal = {};
wtf.pal.IPlatform = function() {
};
wtf.pal.IPlatform.prototype.getWorkingDirectory = goog.nullFunction;
wtf.pal.IPlatform.prototype.readTextFile = goog.nullFunction;
wtf.pal.IPlatform.prototype.readBinaryFile = goog.nullFunction;
wtf.pal.IPlatform.prototype.writeTextFile = goog.nullFunction;
wtf.pal.IPlatform.prototype.writeBinaryFile = goog.nullFunction;
// Input 121
wtf.pal.BrowserPlatform = function() {
};
wtf.pal.BrowserPlatform.prototype.getWorkingDirectory = function() {
  throw Error();
};
wtf.pal.BrowserPlatform.prototype.readTextFile = function(a) {
  throw Error();
};
wtf.pal.BrowserPlatform.prototype.readBinaryFile = function(a) {
  throw Error();
};
wtf.pal.BrowserPlatform.prototype.writeTextFile = function(a, b, c) {
  b = new Blob([b], {type:c || "text/plain"});
  this.downloadBlob_(a, b);
};
wtf.pal.BrowserPlatform.prototype.writeBinaryFile = function(a, b, c) {
  b = new Blob([b], {type:c || "application/octet-stream"});
  this.downloadBlob_(a, b);
};
wtf.pal.BrowserPlatform.prototype.downloadBlob_ = function(a, b) {
  if (goog.global.navigator.msSaveBlob) {
    goog.global.navigator.msSaveBlob(b, a);
  } else {
    var c = goog.dom.getDocument(), d = c.createElement(goog.dom.TagName.A);
    d.download = a;
    d.href = goog.fs.createObjectUrl(b);
    c = c.createEvent("MouseEvents");
    c.initMouseEvent(goog.events.EventType.CLICK, !0, !1, goog.global, 0, 0, 0, 0, 0, !1, !1, !1, !1, 0, null);
    d.dispatchEvent(c);
  }
};
// Input 122
wtf.pal.ChromePlatform = function() {
  wtf.pal.BrowserPlatform.call(this);
};
goog.inherits(wtf.pal.ChromePlatform, wtf.pal.BrowserPlatform);
// Input 123
wtf.pal.NodePlatform = function() {
  this.workingDirectory_ = process.cwd();
  this.fs_ = require("fs");
};
wtf.pal.NodePlatform.prototype.getWorkingDirectory = function() {
  return this.workingDirectory_;
};
wtf.pal.NodePlatform.prototype.readTextFile = function(a) {
  try {
    return this.fs_.readFileSync(a, "utf8");
  } catch (b) {
    return null;
  }
};
wtf.pal.NodePlatform.prototype.readBinaryFile = function(a) {
  var b = null;
  try {
    b = this.fs_.readFileSync(a);
  } catch (c) {
    return null;
  }
  a = new Uint8Array(b.length);
  for (var d = 0;d < a.length;d++) {
    a[d] = b[d];
  }
  return a;
};
wtf.pal.NodePlatform.prototype.writeTextFile = function(a, b, c) {
  this.fs_.writeFileSync(a, b, "utf8");
};
wtf.pal.NodePlatform.prototype.writeBinaryFile = function(a, b, c) {
  c = new Buffer(b.length);
  for (var d = 0;d < c.length;d++) {
    c[d] = b[d];
  }
  this.fs_.writeFileSync(a, c);
};
// Input 124
wtf.pal.sharedPlatform_ = null;
wtf.pal.getPlatform = function() {
  wtf.pal.sharedPlatform_ || (wtf.pal.sharedPlatform_ = wtf.NODE ? new wtf.pal.NodePlatform : goog.global.chrome && goog.global.chrome.runtime ? new wtf.pal.ChromePlatform : new wtf.pal.BrowserPlatform);
  return wtf.pal.sharedPlatform_;
};
goog.exportSymbol("wtf.pal.getPlatform", wtf.pal.getPlatform);
// Input 125
wtf.db.load = function(a, b, c) {
  if (!b) {
    throw Error("wtf.db.load now requires a callback.");
  }
  var d = wtf.pal.getPlatform(), e = new wtf.db.Database, f = new goog.async.Deferred;
  if (goog.isString(a)) {
    if (f = new wtf.db.DataSourceInfo(a, ""), goog.string.endsWith(a, ".wtf-trace")) {
      a = d.readBinaryFile(a);
      if (!a) {
        goog.dispose(e);
        b.call(c, null);
        return;
      }
      goog.asserts.assert(a);
      f = wtf.db.loadBinarySource_(e, f, a);
    } else {
      if (goog.string.endsWith(a, ".wtf-json") && (a = d.readTextFile(a), !a)) {
        goog.dispose(e);
        b.call(c, null);
        return;
      }
      f = wtf.db.loadJsonSource_(e, f, a);
    }
  } else {
    wtf.io.isByteArray(a) ? (f = new wtf.db.DataSourceInfo("", ""), f = wtf.db.loadBinarySource_(e, f, a)) : goog.isObject(a) && (f = new wtf.db.DataSourceInfo("", ""), f = wtf.db.loadJsonSource_(e, f, a));
  }
  f || b.call(c, Error("Unrecognized input data."));
  f.addCallbacks(function() {
    b.call(c, e);
  }, function(a) {
    b.call(c, a);
  });
};
wtf.db.loadBinarySource_ = function(a, b, c) {
  var d = new wtf.io.transports.MemoryReadTransport, e = new wtf.io.cff.BinaryStreamSource(d);
  a = (new wtf.db.sources.ChunkedDataSource(a, b, e)).start();
  d.addData(c);
  d.end();
  return a;
};
wtf.db.loadJsonSource_ = function(a, b, c) {
  "string" != typeof c && (c = goog.global.JSON.stringify(c));
  var d = new wtf.io.transports.MemoryReadTransport, e = new wtf.io.cff.JsonStreamSource(d);
  a = (new wtf.db.sources.ChunkedDataSource(a, b, e)).start();
  d.addData(c);
  d.end();
  return a;
};
goog.exportSymbol("wtf.db.load", wtf.db.load);
// Input 126
wtf.db.SortMode = {ANY:0, COUNT:1, TOTAL_TIME:2, MEAN_TIME:3, OWN_TIME:4};
goog.exportSymbol("wtf.db.SortMode", wtf.db.SortMode);
goog.exportProperty(wtf.db.SortMode, "ANY", wtf.db.SortMode.ANY);
goog.exportProperty(wtf.db.SortMode, "COUNT", wtf.db.SortMode.COUNT);
goog.exportProperty(wtf.db.SortMode, "TOTAL_TIME", wtf.db.SortMode.TOTAL_TIME);
goog.exportProperty(wtf.db.SortMode, "MEAN_TIME", wtf.db.SortMode.MEAN_TIME);
goog.exportProperty(wtf.db.SortMode, "OWN_TIME", wtf.db.SortMode.OWN_TIME);
wtf.db.EventStatistics = function(a) {
  goog.Disposable.call(this);
  this.db_ = a;
  this.selectedTable_ = this.fullTable_ = null;
  a.addListener(wtf.events.EventType.INVALIDATED, function() {
    this.selectedTable_ = this.fullTable_ = null;
  }, this);
};
goog.inherits(wtf.db.EventStatistics, goog.Disposable);
wtf.db.EventStatistics.prototype.getTable = function(a, b) {
  var c = goog.isDef(a) ? a : -Number.MAX_VALUE, d = goog.isDef(b) ? b : Number.MAX_VALUE;
  if (c == -Number.MAX_VALUE && d == Number.MAX_VALUE) {
    return this.fullTable_ || (this.fullTable_ = new wtf.db.EventStatistics.Table(this.db_, -Number.MAX_VALUE, Number.MAX_VALUE), this.fullTable_.rebuild()), this.fullTable_;
  }
  if (this.selectedTable_ && this.selectedTable_.getStartTime() == c && this.selectedTable_.getEndTime() == d) {
    return this.selectedTable_;
  }
  this.selectedTable_ = new wtf.db.EventStatistics.Table(this.db_, c, d);
  this.selectedTable_.rebuild();
  return this.selectedTable_;
};
wtf.db.EventStatistics.getAllEventTypeNames = function(a, b) {
  for (var c = {}, d = 0;d < a.length;d++) {
    for (var e = a[d], f = 0;f < e.list_.length;f++) {
      var g = e.list_[f].eventType;
      if (void 0 === b || g.eventClass == b) {
        c[g.name] = !0;
      }
    }
  }
  return goog.object.getKeys(c);
};
goog.exportSymbol("wtf.db.EventStatistics", wtf.db.EventStatistics);
goog.exportProperty(wtf.db.EventStatistics.prototype, "getTable", wtf.db.EventStatistics.prototype.getTable);
goog.exportSymbol("wtf.db.EventStatistics.getAllEventTypeNames", wtf.db.EventStatistics.getAllEventTypeNames);
wtf.db.EventStatistics.Table = function(a, b, c) {
  this.db_ = a;
  this.startTime_ = b;
  this.endTime_ = c;
  this.eventCount_ = 0;
  this.table_ = {};
  this.list_ = [];
  this.listSortMode_ = wtf.db.SortMode.ANY;
};
wtf.db.EventStatistics.Table.prototype.rebuild = function(a) {
  this.eventCount_ = 0;
  var b = {}, c = [], d = a ? a.getEventTypeFilter() : null, e = a ? a.getArgumentFilter() : null, f = this.db_.getEventTypeTable().getAll();
  for (a = 0;a < f.length;a++) {
    var g = f[a];
    if (!(g.flags & wtf.data.EventFlag.INTERNAL || g.flags & wtf.data.EventFlag.BUILTIN || d && !d(g))) {
      var k;
      k = g.eventClass == wtf.data.EventClass.SCOPE ? new wtf.db.ScopeEventDataEntry(g) : new wtf.db.InstanceEventDataEntry(g);
      b[g.id] = k;
      c.push(k);
    }
  }
  d = this.db_.getZones();
  for (a = 0;a < d.length;a++) {
    for (f = d[a].getEventList().beginTimeRange(this.startTime_, this.endTime_);!f.done();f.next()) {
      k = f.getTypeId(), !(k = b[k]) || e && !e(f) || (k.appendEvent(f), this.eventCount_++);
    }
  }
  b = {};
  e = [];
  for (a = 0;a < c.length;a++) {
    k = c[a], k.count && (b[k.eventType.name] = k, e.push(k));
  }
  this.table_ = b;
  this.list_ = e;
  this.listSortMode_ = wtf.db.SortMode.ANY;
};
wtf.db.EventStatistics.Table.prototype.getStartTime = function() {
  return this.startTime_;
};
wtf.db.EventStatistics.Table.prototype.getEndTime = function() {
  return this.endTime_;
};
wtf.db.EventStatistics.Table.prototype.getEventCount = function() {
  return this.eventCount_;
};
wtf.db.EventStatistics.Table.prototype.getEntries = function() {
  return this.list_;
};
wtf.db.EventStatistics.Table.prototype.getEventTypeEntry = function(a) {
  return this.table_[a] || null;
};
wtf.db.EventStatistics.Table.prototype.getEntriesByClass = function(a) {
  for (var b = {}, c = 0;c < this.list_.length;c++) {
    var d = this.list_[c];
    d.eventType.eventClass == a && (b[d.eventType.name] = d);
  }
  return b;
};
wtf.db.EventStatistics.Table.prototype.forEach = function(a, b, c) {
  if (c && this.listSortMode_ != c) {
    switch(this.listSortMode_ = c, this.listSortMode_) {
      case wtf.db.SortMode.COUNT:
        this.list_.sort(function(a, b) {
          return b.count - a.count;
        });
        break;
      case wtf.db.SortMode.TOTAL_TIME:
        this.list_.sort(function(a, b) {
          return a instanceof wtf.db.ScopeEventDataEntry && b instanceof wtf.db.ScopeEventDataEntry ? b.totalTime_ - a.totalTime_ : a instanceof wtf.db.ScopeEventDataEntry ? -1 : b instanceof wtf.db.ScopeEventDataEntry ? 1 : b.count - a.count;
        });
        break;
      case wtf.db.SortMode.MEAN_TIME:
        this.list_.sort(function(a, b) {
          return a instanceof wtf.db.ScopeEventDataEntry && b instanceof wtf.db.ScopeEventDataEntry ? b.getMeanTime() - a.getMeanTime() : a instanceof wtf.db.ScopeEventDataEntry ? -1 : b instanceof wtf.db.ScopeEventDataEntry ? 1 : b.count - a.count;
        });
        break;
      case wtf.db.SortMode.OWN_TIME:
        this.list_.sort(function(a, b) {
          return a instanceof wtf.db.ScopeEventDataEntry && b instanceof wtf.db.ScopeEventDataEntry ? b.ownTime_ - a.ownTime_ : a instanceof wtf.db.ScopeEventDataEntry ? -1 : b instanceof wtf.db.ScopeEventDataEntry ? 1 : b.count - a.count;
        });
    }
  }
  for (c = 0;c < this.list_.length;c++) {
    a.call(b, this.list_[c]);
  }
};
wtf.db.EventStatistics.Table.prototype.filter = function(a) {
  if (!a.isActive()) {
    return this;
  }
  var b = new wtf.db.EventStatistics.Table(this.db_, this.startTime_, this.endTime_);
  if (a.getArgumentFilter()) {
    b.rebuild(a);
  } else {
    a = a.getEventTypeFilter();
    for (var c = 0;c < this.list_.length;c++) {
      var d = this.list_[c];
      a(d.eventType) && (b.eventCount_ += d.count, b.table_[d.eventType.name] = d, b.list_.push(d));
    }
  }
  return b;
};
goog.exportProperty(wtf.db.EventStatistics.Table.prototype, "getEventCount", wtf.db.EventStatistics.Table.prototype.getEventCount);
goog.exportProperty(wtf.db.EventStatistics.Table.prototype, "getEntries", wtf.db.EventStatistics.Table.prototype.getEntries);
goog.exportProperty(wtf.db.EventStatistics.Table.prototype, "getEventTypeEntry", wtf.db.EventStatistics.Table.prototype.getEventTypeEntry);
goog.exportProperty(wtf.db.EventStatistics.Table.prototype, "getEntriesByClass", wtf.db.EventStatistics.Table.prototype.getEntriesByClass);
goog.exportProperty(wtf.db.EventStatistics.Table.prototype, "forEach", wtf.db.EventStatistics.Table.prototype.forEach);
goog.exportProperty(wtf.db.EventStatistics.Table.prototype, "filter", wtf.db.EventStatistics.Table.prototype.filter);
wtf.db.EventDataEntry = function(a) {
  this.eventType = a;
  this.count = 0;
};
wtf.db.EventDataEntry.prototype.getEventType = function() {
  return this.eventType;
};
wtf.db.EventDataEntry.prototype.getCount = function() {
  return this.count;
};
wtf.db.EventDataEntry.prototype.getFrequency = function() {
  return 0;
};
goog.exportSymbol("wtf.db.EventDataEntry", wtf.db.EventDataEntry);
goog.exportProperty(wtf.db.EventDataEntry.prototype, "getEventType", wtf.db.EventDataEntry.prototype.getEventType);
goog.exportProperty(wtf.db.EventDataEntry.prototype, "getCount", wtf.db.EventDataEntry.prototype.getCount);
goog.exportProperty(wtf.db.EventDataEntry.prototype, "getFrequency", wtf.db.EventDataEntry.prototype.getFrequency);
wtf.db.ScopeEventDataEntry = function(a) {
  wtf.db.EventDataEntry.call(this, a);
  this.userTime_ = this.ownTime_ = this.totalTime_ = 0;
  this.buckets_ = new Uint32Array(1E3);
};
goog.inherits(wtf.db.ScopeEventDataEntry, wtf.db.EventDataEntry);
wtf.db.ScopeEventDataEntry.prototype.appendEvent = function(a) {
  if (a.getEndTime()) {
    this.count++;
    var b = a.getUserDuration();
    this.totalTime_ += a.getTotalDuration();
    this.ownTime_ += a.getOwnDuration();
    this.userTime_ += b;
    a = Math.round(b) | 0;
    1E3 <= a && (a = 999);
    this.buckets_[a]++;
  }
};
wtf.db.ScopeEventDataEntry.prototype.getTotalTime = function() {
  return this.totalTime_;
};
wtf.db.ScopeEventDataEntry.prototype.getOwnTime = function() {
  return this.ownTime_;
};
wtf.db.ScopeEventDataEntry.prototype.getUserTime = function() {
  return this.userTime_;
};
wtf.db.ScopeEventDataEntry.prototype.getMeanTime = function() {
  return this.count ? this.eventType.flags & wtf.data.EventFlag.SYSTEM_TIME ? this.totalTime_ / this.count : this.userTime_ / this.count : 0;
};
wtf.db.ScopeEventDataEntry.prototype.getDistribution = function() {
  return this.buckets_;
};
goog.exportSymbol("wtf.db.ScopeEventDataEntry", wtf.db.ScopeEventDataEntry);
goog.exportProperty(wtf.db.ScopeEventDataEntry.prototype, "getTotalTime", wtf.db.ScopeEventDataEntry.prototype.getTotalTime);
goog.exportProperty(wtf.db.ScopeEventDataEntry.prototype, "getOwnTime", wtf.db.ScopeEventDataEntry.prototype.getOwnTime);
goog.exportProperty(wtf.db.ScopeEventDataEntry.prototype, "getUserTime", wtf.db.ScopeEventDataEntry.prototype.getUserTime);
goog.exportProperty(wtf.db.ScopeEventDataEntry.prototype, "getMeanTime", wtf.db.ScopeEventDataEntry.prototype.getMeanTime);
goog.exportProperty(wtf.db.ScopeEventDataEntry.prototype, "getDistribution", wtf.db.ScopeEventDataEntry.prototype.getDistribution);
wtf.db.InstanceEventDataEntry = function(a) {
  wtf.db.EventDataEntry.call(this, a);
};
goog.inherits(wtf.db.InstanceEventDataEntry, wtf.db.EventDataEntry);
wtf.db.InstanceEventDataEntry.prototype.appendEvent = function(a) {
  this.count++;
};
goog.exportSymbol("wtf.db.InstanceEventDataEntry", wtf.db.InstanceEventDataEntry);
// Input 127
wtf.db.HealthInfo = function(a, b) {
  this.isBad_ = !1;
  this.totalOverheadPercent_ = this.totalOverheadMs_ = this.overheadPerScopeNs_ = 0;
  this.warnings_ = [];
  b && this.analyzeStatistics_(a, b);
};
wtf.db.HealthInfo.prototype.isBad = function() {
  return this.isBad_;
};
wtf.db.HealthInfo.prototype.getOverheadPerScopeNs = function() {
  return this.overheadPerScopeNs_;
};
wtf.db.HealthInfo.prototype.getTotalOverheadMs = function() {
  return this.totalOverheadMs_;
};
wtf.db.HealthInfo.prototype.getTotalOverheadPercent = function() {
  return this.totalOverheadPercent_;
};
wtf.db.HealthInfo.prototype.getWarnings = function() {
  return this.warnings_;
};
wtf.db.HealthInfo.prototype.analyzeStatistics_ = function(a, b) {
  for (var c = 0, d = 0, e = 0, f = 0, g = 0, k = 0, m = 0, l = 0, p = 0, s = 0, t = 0, x = 0, v = a.getZones(), w = 0;w < v.length;w++) {
    var u = v[w], q = u.getEventList().getStatistics(), c = c + q.totalCount, g = g + q.genericEnterScope, k = k + q.genericTimeStamp, m = m + q.appendScopeData, u = u.getFrameList(), d = d + u.getCount()
  }
  v = b.getEntries();
  for (w = 0;w < v.length;w++) {
    u = v[w];
    q = u.getEventType();
    switch(q.getClass()) {
      case wtf.data.EventClass.SCOPE:
        e += u.getCount();
        break;
      case wtf.data.EventClass.INSTANCE:
        f += u.getCount();
    }
    for (var q = q.getArguments(), z = 0;z < q.length;z++) {
      var r = q[z].typeName;
      if ("any" == r) {
        l += u.getCount();
      } else {
        if ("ascii" == r || "utf8" == r) {
          p += u.getCount();
        }
      }
    }
    u instanceof wtf.db.ScopeEventDataEntry && (q = u.getMeanTime(), 2 >= q ? s += u.getCount() : 5 >= q ? t += u.getCount() : 10 >= q && (x += u.getCount()));
  }
  this.totalOverheadPercent_ = this.totalOverheadMs_ = this.overheadPerScopeNs_ = 0;
  w = a.getSources();
  v = 0;
  w.length && (v = w[0].getMetadata().nowTimeNs || 0);
  v && (this.overheadPerScopeNs_ = 2 * v + v, this.totalOverheadMs_ = e * this.overheadPerScopeNs_ + f * (v + v), this.totalOverheadMs_ /= 1E6, e = a.getLastEventTime() - a.getFirstEventTime(), this.totalOverheadPercent_ = this.totalOverheadMs_ / e);
  1E3 > c || (e = [], d && (d = c / d, 1E4 <= d && e.push(new wtf.db.HealthWarning("Too many events per frame.", "Keep the count under 10000 to avoid too much skew.", "~" + Math.round(d) + " events/frame", "warn_too_many_events_per_frame"))), 0.3 < f / c && e.push(new wtf.db.HealthWarning("A lot of instance events (>30%).", "Instance events are easy to miss. Try not to use so many.", Math.floor(f / c * 100) + "% of all events")), 0.1 < g / c && e.push(new wtf.db.HealthWarning("Using enterScope too much (>10%).", 
  "enterScope writes strings. Using a custom event type will result in less overhead per event.", Math.floor(g / c * 100) + "% of all events")), 0.1 < k / c && e.push(new wtf.db.HealthWarning("Using timeStamp too much (>10%).", "timeStamp writes strings. Using a custom event type will result in less overhead per event.", Math.floor(k / c * 100) + "% of all events")), 0.1 < m / c && e.push(new wtf.db.HealthWarning("Using appendScopeData too much (>10%).", "appendScopeData writes strings and JSON. Use a custom event type with simple argument types instead.", 
  Math.floor(m / c * 100) + "% of all events")), 0.1 < l / c && e.push(new wtf.db.HealthWarning('Using a lot of "any" arguments (>10%).', "Use either simple numeric types (fastest) or strings instead.", Math.floor(l / c * 100) + "% of all events")), 0.1 < p / c && e.push(new wtf.db.HealthWarning('Using a lot of "ascii"/"utf8" arguments (>10%).', "Use simple numeric types instead. Prefer ascii to utf8.", Math.floor(p / c * 100) + "% of all events")), 0.05 < s / c && e.push(new wtf.db.HealthWarning("Too many \u22642\u00b5s scopes.", 
  "Very short scopes are not representative of their actual time and just add overhead. Remove them or change them to instance events.", Math.floor(s / c * 100) + "% of all events")), 0.1 < t / c && e.push(new wtf.db.HealthWarning("Too many \u22645\u00b5s scopes.", "Very short scopes are not representative of their actual time and just add overhead. Remove them or change them to instance events.", Math.floor(t / c * 100) + "% of all events")), 0.15 < x / c && e.push(new wtf.db.HealthWarning("Too many \u226410\u00b5s scopes.", 
  "Very short scopes are not representative of their actual time and just add overhead. Remove them or change them to instance events.", Math.floor(x / c * 100) + "% of all events")), this.warnings_ = e, e.length && (this.isBad_ = !0));
};
goog.exportSymbol("wtf.db.HealthInfo", wtf.db.HealthInfo);
goog.exportProperty(wtf.db.HealthInfo.prototype, "isBad", wtf.db.HealthInfo.prototype.isBad);
goog.exportProperty(wtf.db.HealthInfo.prototype, "getOverheadPerScopeNs", wtf.db.HealthInfo.prototype.getOverheadPerScopeNs);
goog.exportProperty(wtf.db.HealthInfo.prototype, "getTotalOverheadMs", wtf.db.HealthInfo.prototype.getTotalOverheadMs);
goog.exportProperty(wtf.db.HealthInfo.prototype, "getTotalOverheadPercent", wtf.db.HealthInfo.prototype.getTotalOverheadPercent);
goog.exportProperty(wtf.db.HealthInfo.prototype, "getWarnings", wtf.db.HealthInfo.prototype.getWarnings);
wtf.db.HealthWarning = function(a, b, c, d) {
  this.title_ = a;
  this.suggestion_ = b;
  this.details_ = c;
  this.linkAnchor_ = d || null;
};
wtf.db.HealthWarning.prototype.getTitle = function() {
  return this.title_;
};
wtf.db.HealthWarning.prototype.getSuggestion = function() {
  return this.suggestion_;
};
wtf.db.HealthWarning.prototype.getDetails = function() {
  return this.details_;
};
wtf.db.HealthWarning.prototype.getLink = function() {
  return this.linkAnchor_ ? "https://github.com/google/tracing-framework/blob/master/docs/overhead.md" + this.linkAnchor_ : null;
};
wtf.db.HealthWarning.prototype.toString = function() {
  return this.title_ + " (" + this.suggestion_ + ")";
};
goog.exportProperty(wtf.db.HealthWarning.prototype, "getTitle", wtf.db.HealthWarning.prototype.getTitle);
goog.exportProperty(wtf.db.HealthWarning.prototype, "getSuggestion", wtf.db.HealthWarning.prototype.getSuggestion);
goog.exportProperty(wtf.db.HealthWarning.prototype, "getDetails", wtf.db.HealthWarning.prototype.getDetails);
goog.exportProperty(wtf.db.HealthWarning.prototype, "getLink", wtf.db.HealthWarning.prototype.getLink);
// Input 128
wtf.db.exports = {};
wtf.db.exports.ENABLE_EXPORTS = !0;
// Input 129
goog.structs.Collection = function() {
};
// Input 130
goog.structs.Set = function(a) {
  this.map_ = new goog.structs.Map;
  a && this.addAll(a);
};
goog.structs.Set.getKey_ = function(a) {
  var b = typeof a;
  return "object" == b && a || "function" == b ? "o" + goog.getUid(a) : b.substr(0, 1) + a;
};
goog.structs.Set.prototype.getCount = function() {
  return this.map_.getCount();
};
goog.structs.Set.prototype.add = function(a) {
  this.map_.set(goog.structs.Set.getKey_(a), a);
};
goog.structs.Set.prototype.addAll = function(a) {
  a = goog.structs.getValues(a);
  for (var b = a.length, c = 0;c < b;c++) {
    this.add(a[c]);
  }
};
goog.structs.Set.prototype.removeAll = function(a) {
  a = goog.structs.getValues(a);
  for (var b = a.length, c = 0;c < b;c++) {
    this.remove(a[c]);
  }
};
goog.structs.Set.prototype.remove = function(a) {
  return this.map_.remove(goog.structs.Set.getKey_(a));
};
goog.structs.Set.prototype.clear = function() {
  this.map_.clear();
};
goog.structs.Set.prototype.isEmpty = function() {
  return this.map_.isEmpty();
};
goog.structs.Set.prototype.contains = function(a) {
  return this.map_.containsKey(goog.structs.Set.getKey_(a));
};
goog.structs.Set.prototype.containsAll = function(a) {
  return goog.structs.every(a, this.contains, this);
};
goog.structs.Set.prototype.intersection = function(a) {
  var b = new goog.structs.Set;
  a = goog.structs.getValues(a);
  for (var c = 0;c < a.length;c++) {
    var d = a[c];
    this.contains(d) && b.add(d);
  }
  return b;
};
goog.structs.Set.prototype.difference = function(a) {
  var b = this.clone();
  b.removeAll(a);
  return b;
};
goog.structs.Set.prototype.getValues = function() {
  return this.map_.getValues();
};
goog.structs.Set.prototype.clone = function() {
  return new goog.structs.Set(this);
};
goog.structs.Set.prototype.equals = function(a) {
  return this.getCount() == goog.structs.getCount(a) && this.isSubsetOf(a);
};
goog.structs.Set.prototype.isSubsetOf = function(a) {
  var b = goog.structs.getCount(a);
  if (this.getCount() > b) {
    return!1;
  }
  !(a instanceof goog.structs.Set) && 5 < b && (a = new goog.structs.Set(a));
  return goog.structs.every(this, function(b) {
    return goog.structs.contains(a, b);
  });
};
goog.structs.Set.prototype.__iterator__ = function(a) {
  return this.map_.__iterator__(!1);
};
// Input 131
goog.debug.LOGGING_ENABLED = goog.DEBUG;
goog.debug.catchErrors = function(a, b, c) {
  c = c || goog.global;
  var d = c.onerror, e = !!b;
  goog.userAgent.WEBKIT && !goog.userAgent.isVersionOrHigher("535.3") && (e = !e);
  c.onerror = function(b, c, k, m, l) {
    d && d(b, c, k, m, l);
    a({message:b, fileName:c, line:k, col:m, error:l});
    return e;
  };
};
goog.debug.expose = function(a, b) {
  if ("undefined" == typeof a) {
    return "undefined";
  }
  if (null == a) {
    return "NULL";
  }
  var c = [], d;
  for (d in a) {
    if (b || !goog.isFunction(a[d])) {
      var e = d + " = ";
      try {
        e += a[d];
      } catch (f) {
        e += "*** " + f + " ***";
      }
      c.push(e);
    }
  }
  return c.join("\n");
};
goog.debug.deepExpose = function(a, b) {
  var c = new goog.structs.Set, d = [], e = function(a, g) {
    var k = g + "  ";
    try {
      if (goog.isDef(a)) {
        if (goog.isNull(a)) {
          d.push("NULL");
        } else {
          if (goog.isString(a)) {
            d.push('"' + a.replace(/\n/g, "\n" + g) + '"');
          } else {
            if (goog.isFunction(a)) {
              d.push(String(a).replace(/\n/g, "\n" + g));
            } else {
              if (goog.isObject(a)) {
                if (c.contains(a)) {
                  d.push("*** reference loop detected ***");
                } else {
                  c.add(a);
                  d.push("{");
                  for (var m in a) {
                    if (b || !goog.isFunction(a[m])) {
                      d.push("\n"), d.push(k), d.push(m + " = "), e(a[m], k);
                    }
                  }
                  d.push("\n" + g + "}");
                }
              } else {
                d.push(a);
              }
            }
          }
        }
      } else {
        d.push("undefined");
      }
    } catch (l) {
      d.push("*** " + l + " ***");
    }
  };
  e(a, "");
  return d.join("");
};
goog.debug.exposeArray = function(a) {
  for (var b = [], c = 0;c < a.length;c++) {
    goog.isArray(a[c]) ? b.push(goog.debug.exposeArray(a[c])) : b.push(a[c]);
  }
  return "[ " + b.join(", ") + " ]";
};
goog.debug.exposeException = function(a, b) {
  try {
    var c = goog.debug.normalizeErrorObject(a);
    return "Message: " + goog.string.htmlEscape(c.message) + '\nUrl: <a href="view-source:' + c.fileName + '" target="_new">' + c.fileName + "</a>\nLine: " + c.lineNumber + "\n\nBrowser stack:\n" + goog.string.htmlEscape(c.stack + "-> ") + "[end]\n\nJS stack traversal:\n" + goog.string.htmlEscape(goog.debug.getStacktrace(b) + "-> ");
  } catch (d) {
    return "Exception trying to expose exception! You win, we lose. " + d;
  }
};
goog.debug.normalizeErrorObject = function(a) {
  var b = goog.getObjectByName("window.location.href");
  if (goog.isString(a)) {
    return{message:a, name:"Unknown error", lineNumber:"Not available", fileName:b, stack:"Not available"};
  }
  var c, d, e = !1;
  try {
    c = a.lineNumber || a.line || "Not available";
  } catch (f) {
    c = "Not available", e = !0;
  }
  try {
    d = a.fileName || a.filename || a.sourceURL || goog.global.$googDebugFname || b;
  } catch (g) {
    d = "Not available", e = !0;
  }
  return!e && a.lineNumber && a.fileName && a.stack && a.message && a.name ? a : {message:a.message || "Not available", name:a.name || "UnknownError", lineNumber:c, fileName:d, stack:a.stack || "Not available"};
};
goog.debug.enhanceError = function(a, b) {
  var c = "string" == typeof a ? Error(a) : a;
  c.stack || (c.stack = goog.debug.getStacktrace(arguments.callee.caller));
  if (b) {
    for (var d = 0;c["message" + d];) {
      ++d;
    }
    c["message" + d] = String(b);
  }
  return c;
};
goog.debug.getStacktraceSimple = function(a) {
  for (var b = [], c = arguments.callee.caller, d = 0;c && (!a || d < a);) {
    b.push(goog.debug.getFunctionName(c));
    b.push("()\n");
    try {
      c = c.caller;
    } catch (e) {
      b.push("[exception trying to get caller]\n");
      break;
    }
    d++;
    if (d >= goog.debug.MAX_STACK_DEPTH) {
      b.push("[...long stack...]");
      break;
    }
  }
  a && d >= a ? b.push("[...reached max depth limit...]") : b.push("[end]");
  return b.join("");
};
goog.debug.MAX_STACK_DEPTH = 50;
goog.debug.getStacktrace = function(a) {
  return goog.debug.getStacktraceHelper_(a || arguments.callee.caller, []);
};
goog.debug.getStacktraceHelper_ = function(a, b) {
  var c = [];
  if (goog.array.contains(b, a)) {
    c.push("[...circular reference...]");
  } else {
    if (a && b.length < goog.debug.MAX_STACK_DEPTH) {
      c.push(goog.debug.getFunctionName(a) + "(");
      for (var d = a.arguments, e = 0;e < d.length;e++) {
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
            f = typeof f;
        }
        40 < f.length && (f = f.substr(0, 40) + "...");
        c.push(f);
      }
      b.push(a);
      c.push(")\n");
      try {
        c.push(goog.debug.getStacktraceHelper_(a.caller, b));
      } catch (g) {
        c.push("[exception trying to get caller]\n");
      }
    } else {
      a ? c.push("[...long stack...]") : c.push("[end]");
    }
  }
  return c.join("");
};
goog.debug.setFunctionResolver = function(a) {
  goog.debug.fnNameResolver_ = a;
};
goog.debug.getFunctionName = function(a) {
  if (goog.debug.fnNameCache_[a]) {
    return goog.debug.fnNameCache_[a];
  }
  if (goog.debug.fnNameResolver_) {
    var b = goog.debug.fnNameResolver_(a);
    if (b) {
      return goog.debug.fnNameCache_[a] = b;
    }
  }
  a = String(a);
  goog.debug.fnNameCache_[a] || (b = /function ([^\(]+)/.exec(a), goog.debug.fnNameCache_[a] = b ? b[1] : "[Anonymous]");
  return goog.debug.fnNameCache_[a];
};
goog.debug.makeWhitespaceVisible = function(a) {
  return a.replace(/ /g, "[_]").replace(/\f/g, "[f]").replace(/\n/g, "[n]\n").replace(/\r/g, "[r]").replace(/\t/g, "[t]");
};
goog.debug.fnNameCache_ = {};
// Input 132
goog.debug.LogRecord = function(a, b, c, d, e) {
  this.reset(a, b, c, d, e);
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
  delete this.exceptionText_;
};
goog.debug.LogRecord.prototype.getLoggerName = function() {
  return this.loggerName_;
};
goog.debug.LogRecord.prototype.getException = function() {
  return this.exception_;
};
goog.debug.LogRecord.prototype.setException = function(a) {
  this.exception_ = a;
};
goog.debug.LogRecord.prototype.getExceptionText = function() {
  return this.exceptionText_;
};
goog.debug.LogRecord.prototype.setExceptionText = function(a) {
  this.exceptionText_ = a;
};
goog.debug.LogRecord.prototype.setLoggerName = function(a) {
  this.loggerName_ = a;
};
goog.debug.LogRecord.prototype.getLevel = function() {
  return this.level_;
};
goog.debug.LogRecord.prototype.setLevel = function(a) {
  this.level_ = a;
};
goog.debug.LogRecord.prototype.getMessage = function() {
  return this.msg_;
};
goog.debug.LogRecord.prototype.setMessage = function(a) {
  this.msg_ = a;
};
goog.debug.LogRecord.prototype.getMillis = function() {
  return this.time_;
};
goog.debug.LogRecord.prototype.setMillis = function(a) {
  this.time_ = a;
};
goog.debug.LogRecord.prototype.getSequenceNumber = function() {
  return this.sequenceNumber_;
};
// Input 133
goog.debug.LogBuffer = function() {
  goog.asserts.assert(goog.debug.LogBuffer.isBufferingEnabled(), "Cannot use goog.debug.LogBuffer without defining goog.debug.LogBuffer.CAPACITY.");
  this.clear();
};
goog.debug.LogBuffer.getInstance = function() {
  goog.debug.LogBuffer.instance_ || (goog.debug.LogBuffer.instance_ = new goog.debug.LogBuffer);
  return goog.debug.LogBuffer.instance_;
};
goog.debug.LogBuffer.CAPACITY = 0;
goog.debug.LogBuffer.prototype.addRecord = function(a, b, c) {
  var d = (this.curIndex_ + 1) % goog.debug.LogBuffer.CAPACITY;
  this.curIndex_ = d;
  if (this.isFull_) {
    return d = this.buffer_[d], d.reset(a, b, c), d;
  }
  this.isFull_ = d == goog.debug.LogBuffer.CAPACITY - 1;
  return this.buffer_[d] = new goog.debug.LogRecord(a, b, c);
};
goog.debug.LogBuffer.isBufferingEnabled = function() {
  return 0 < goog.debug.LogBuffer.CAPACITY;
};
goog.debug.LogBuffer.prototype.clear = function() {
  this.buffer_ = Array(goog.debug.LogBuffer.CAPACITY);
  this.curIndex_ = -1;
  this.isFull_ = !1;
};
goog.debug.LogBuffer.prototype.forEachRecord = function(a) {
  var b = this.buffer_;
  if (b[0]) {
    var c = this.curIndex_, d = this.isFull_ ? c : -1;
    do {
      d = (d + 1) % goog.debug.LogBuffer.CAPACITY, a(b[d]);
    } while (d != c);
  }
};
// Input 134
goog.debug.Logger = function(a) {
  this.name_ = a;
};
goog.debug.Logger.prototype.parent_ = null;
goog.debug.Logger.prototype.level_ = null;
goog.debug.Logger.prototype.children_ = null;
goog.debug.Logger.prototype.handlers_ = null;
goog.debug.Logger.ENABLE_HIERARCHY = !0;
goog.debug.Logger.ENABLE_HIERARCHY || (goog.debug.Logger.rootHandlers_ = []);
goog.debug.Logger.Level = function(a, b) {
  this.name = a;
  this.value = b;
};
goog.debug.Logger.Level.prototype.toString = function() {
  return this.name;
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
  for (var a = 0, b;b = goog.debug.Logger.Level.PREDEFINED_LEVELS[a];a++) {
    goog.debug.Logger.Level.predefinedLevelsCache_[b.value] = b, goog.debug.Logger.Level.predefinedLevelsCache_[b.name] = b;
  }
};
goog.debug.Logger.Level.getPredefinedLevel = function(a) {
  goog.debug.Logger.Level.predefinedLevelsCache_ || goog.debug.Logger.Level.createPredefinedLevelsCache_();
  return goog.debug.Logger.Level.predefinedLevelsCache_[a] || null;
};
goog.debug.Logger.Level.getPredefinedLevelByValue = function(a) {
  goog.debug.Logger.Level.predefinedLevelsCache_ || goog.debug.Logger.Level.createPredefinedLevelsCache_();
  if (a in goog.debug.Logger.Level.predefinedLevelsCache_) {
    return goog.debug.Logger.Level.predefinedLevelsCache_[a];
  }
  for (var b = 0;b < goog.debug.Logger.Level.PREDEFINED_LEVELS.length;++b) {
    var c = goog.debug.Logger.Level.PREDEFINED_LEVELS[b];
    if (c.value <= a) {
      return c;
    }
  }
  return null;
};
goog.debug.Logger.getLogger = function(a) {
  return goog.debug.LogManager.getLogger(a);
};
goog.debug.Logger.logToProfilers = function(a) {
  goog.global.console && (goog.global.console.timeStamp ? goog.global.console.timeStamp(a) : goog.global.console.markTimeline && goog.global.console.markTimeline(a));
  goog.global.msWriteProfilerMark && goog.global.msWriteProfilerMark(a);
};
goog.debug.Logger.prototype.getName = function() {
  return this.name_;
};
goog.debug.Logger.prototype.addHandler = function(a) {
  goog.debug.LOGGING_ENABLED && (goog.debug.Logger.ENABLE_HIERARCHY ? (this.handlers_ || (this.handlers_ = []), this.handlers_.push(a)) : (goog.asserts.assert(!this.name_, "Cannot call addHandler on a non-root logger when goog.debug.Logger.ENABLE_HIERARCHY is false."), goog.debug.Logger.rootHandlers_.push(a)));
};
goog.debug.Logger.prototype.removeHandler = function(a) {
  if (goog.debug.LOGGING_ENABLED) {
    var b = goog.debug.Logger.ENABLE_HIERARCHY ? this.handlers_ : goog.debug.Logger.rootHandlers_;
    return!!b && goog.array.remove(b, a);
  }
  return!1;
};
goog.debug.Logger.prototype.getParent = function() {
  return this.parent_;
};
goog.debug.Logger.prototype.getChildren = function() {
  this.children_ || (this.children_ = {});
  return this.children_;
};
goog.debug.Logger.prototype.setLevel = function(a) {
  goog.debug.LOGGING_ENABLED && (goog.debug.Logger.ENABLE_HIERARCHY ? this.level_ = a : (goog.asserts.assert(!this.name_, "Cannot call setLevel() on a non-root logger when goog.debug.Logger.ENABLE_HIERARCHY is false."), goog.debug.Logger.rootLevel_ = a));
};
goog.debug.Logger.prototype.getLevel = function() {
  return goog.debug.LOGGING_ENABLED ? this.level_ : goog.debug.Logger.Level.OFF;
};
goog.debug.Logger.prototype.getEffectiveLevel = function() {
  if (!goog.debug.LOGGING_ENABLED) {
    return goog.debug.Logger.Level.OFF;
  }
  if (!goog.debug.Logger.ENABLE_HIERARCHY) {
    return goog.debug.Logger.rootLevel_;
  }
  if (this.level_) {
    return this.level_;
  }
  if (this.parent_) {
    return this.parent_.getEffectiveLevel();
  }
  goog.asserts.fail("Root logger has no level set.");
  return null;
};
goog.debug.Logger.prototype.isLoggable = function(a) {
  return goog.debug.LOGGING_ENABLED && a.value >= this.getEffectiveLevel().value;
};
goog.debug.Logger.prototype.log = function(a, b, c) {
  goog.debug.LOGGING_ENABLED && this.isLoggable(a) && this.doLogRecord_(this.getLogRecord(a, b, c));
};
goog.debug.Logger.prototype.getLogRecord = function(a, b, c) {
  var d = goog.debug.LogBuffer.isBufferingEnabled() ? goog.debug.LogBuffer.getInstance().addRecord(a, b, this.name_) : new goog.debug.LogRecord(a, String(b), this.name_);
  c && (d.setException(c), d.setExceptionText(goog.debug.exposeException(c, arguments.callee.caller)));
  return d;
};
goog.debug.Logger.prototype.shout = function(a, b) {
  goog.debug.LOGGING_ENABLED && this.log(goog.debug.Logger.Level.SHOUT, a, b);
};
goog.debug.Logger.prototype.severe = function(a, b) {
  goog.debug.LOGGING_ENABLED && this.log(goog.debug.Logger.Level.SEVERE, a, b);
};
goog.debug.Logger.prototype.warning = function(a, b) {
  goog.debug.LOGGING_ENABLED && this.log(goog.debug.Logger.Level.WARNING, a, b);
};
goog.debug.Logger.prototype.info = function(a, b) {
  goog.debug.LOGGING_ENABLED && this.log(goog.debug.Logger.Level.INFO, a, b);
};
goog.debug.Logger.prototype.config = function(a, b) {
  goog.debug.LOGGING_ENABLED && this.log(goog.debug.Logger.Level.CONFIG, a, b);
};
goog.debug.Logger.prototype.fine = function(a, b) {
  goog.debug.LOGGING_ENABLED && this.log(goog.debug.Logger.Level.FINE, a, b);
};
goog.debug.Logger.prototype.finer = function(a, b) {
  goog.debug.LOGGING_ENABLED && this.log(goog.debug.Logger.Level.FINER, a, b);
};
goog.debug.Logger.prototype.finest = function(a, b) {
  goog.debug.LOGGING_ENABLED && this.log(goog.debug.Logger.Level.FINEST, a, b);
};
goog.debug.Logger.prototype.logRecord = function(a) {
  goog.debug.LOGGING_ENABLED && this.isLoggable(a.getLevel()) && this.doLogRecord_(a);
};
goog.debug.Logger.prototype.doLogRecord_ = function(a) {
  goog.debug.Logger.logToProfilers("log:" + a.getMessage());
  if (goog.debug.Logger.ENABLE_HIERARCHY) {
    for (var b = this;b;) {
      b.callPublish_(a), b = b.getParent();
    }
  } else {
    for (var b = 0, c;c = goog.debug.Logger.rootHandlers_[b++];) {
      c(a);
    }
  }
};
goog.debug.Logger.prototype.callPublish_ = function(a) {
  if (this.handlers_) {
    for (var b = 0, c;c = this.handlers_[b];b++) {
      c(a);
    }
  }
};
goog.debug.Logger.prototype.setParent_ = function(a) {
  this.parent_ = a;
};
goog.debug.Logger.prototype.addChild_ = function(a, b) {
  this.getChildren()[a] = b;
};
goog.debug.LogManager = {};
goog.debug.LogManager.loggers_ = {};
goog.debug.LogManager.rootLogger_ = null;
goog.debug.LogManager.initialize = function() {
  goog.debug.LogManager.rootLogger_ || (goog.debug.LogManager.rootLogger_ = new goog.debug.Logger(""), goog.debug.LogManager.loggers_[""] = goog.debug.LogManager.rootLogger_, goog.debug.LogManager.rootLogger_.setLevel(goog.debug.Logger.Level.CONFIG));
};
goog.debug.LogManager.getLoggers = function() {
  return goog.debug.LogManager.loggers_;
};
goog.debug.LogManager.getRoot = function() {
  goog.debug.LogManager.initialize();
  return goog.debug.LogManager.rootLogger_;
};
goog.debug.LogManager.getLogger = function(a) {
  goog.debug.LogManager.initialize();
  return goog.debug.LogManager.loggers_[a] || goog.debug.LogManager.createLogger_(a);
};
goog.debug.LogManager.createFunctionForCatchErrors = function(a) {
  return function(b) {
    (a || goog.debug.LogManager.getRoot()).severe("Error: " + b.message + " (" + b.fileName + " @ Line: " + b.line + ")");
  };
};
goog.debug.LogManager.createLogger_ = function(a) {
  var b = new goog.debug.Logger(a);
  if (goog.debug.Logger.ENABLE_HIERARCHY) {
    var c = a.lastIndexOf("."), d = a.substr(0, c), c = a.substr(c + 1), d = goog.debug.LogManager.getLogger(d);
    d.addChild_(c, b);
    b.setParent_(d);
  }
  return goog.debug.LogManager.loggers_[a] = b;
};
// Input 135
goog.log = {};
goog.log.ENABLED = goog.debug.LOGGING_ENABLED;
goog.log.Logger = goog.debug.Logger;
goog.log.Level = goog.debug.Logger.Level;
goog.log.LogRecord = goog.debug.LogRecord;
goog.log.getLogger = function(a, b) {
  if (goog.log.ENABLED) {
    var c = goog.debug.Logger.getLogger(a);
    b && c && c.setLevel(b);
    return c;
  }
  return null;
};
goog.log.addHandler = function(a, b) {
  goog.log.ENABLED && a && a.addHandler(b);
};
goog.log.removeHandler = function(a, b) {
  return goog.log.ENABLED && a ? a.removeHandler(b) : !1;
};
goog.log.log = function(a, b, c, d) {
  goog.log.ENABLED && a && a.log(b, c, d);
};
goog.log.error = function(a, b, c) {
  goog.log.ENABLED && a && a.severe(b, c);
};
goog.log.warning = function(a, b, c) {
  goog.log.ENABLED && a && a.warning(b, c);
};
goog.log.info = function(a, b, c) {
  goog.log.ENABLED && a && a.info(b, c);
};
goog.log.fine = function(a, b, c) {
  goog.log.ENABLED && a && a.fine(b, c);
};
// Input 136
goog.structs.SimplePool = function(a, b) {
  goog.Disposable.call(this);
  this.disposeObjectFn_ = this.createObjectFn_ = null;
  this.maxCount_ = b;
  this.freeQueue_ = [];
  this.createInitial_(a);
};
goog.inherits(goog.structs.SimplePool, goog.Disposable);
goog.structs.SimplePool.prototype.setCreateObjectFn = function(a) {
  this.createObjectFn_ = a;
};
goog.structs.SimplePool.prototype.setDisposeObjectFn = function(a) {
  this.disposeObjectFn_ = a;
};
goog.structs.SimplePool.prototype.getObject = function() {
  return this.freeQueue_.length ? this.freeQueue_.pop() : this.createObject();
};
goog.structs.SimplePool.prototype.releaseObject = function(a) {
  this.freeQueue_.length < this.maxCount_ ? this.freeQueue_.push(a) : this.disposeObject(a);
};
goog.structs.SimplePool.prototype.createInitial_ = function(a) {
  if (a > this.maxCount_) {
    throw Error("[goog.structs.SimplePool] Initial cannot be greater than max");
  }
  for (var b = 0;b < a;b++) {
    this.freeQueue_.push(this.createObject());
  }
};
goog.structs.SimplePool.prototype.createObject = function() {
  return this.createObjectFn_ ? this.createObjectFn_() : {};
};
goog.structs.SimplePool.prototype.disposeObject = function(a) {
  if (this.disposeObjectFn_) {
    this.disposeObjectFn_(a);
  } else {
    if (goog.isObject(a)) {
      if (goog.isFunction(a.dispose)) {
        a.dispose();
      } else {
        for (var b in a) {
          delete a[b];
        }
      }
    }
  }
};
goog.structs.SimplePool.prototype.disposeInternal = function() {
  goog.structs.SimplePool.superClass_.disposeInternal.call(this);
  for (var a = this.freeQueue_;a.length;) {
    this.disposeObject(a.pop());
  }
  delete this.freeQueue_;
};
// Input 137
goog.debug.Trace_ = function() {
  this.events_ = [];
  this.outstandingEvents_ = new goog.structs.Map;
  this.tracerOverheadComment_ = this.tracerOverheadEnd_ = this.tracerOverheadStart_ = this.startTime_ = 0;
  this.stats_ = new goog.structs.Map;
  this.commentCount_ = this.tracerCount_ = 0;
  this.nextId_ = 1;
  this.eventPool_ = new goog.structs.SimplePool(0, 4E3);
  this.eventPool_.createObject = function() {
    return new goog.debug.Trace_.Event_;
  };
  this.statPool_ = new goog.structs.SimplePool(0, 50);
  this.statPool_.createObject = function() {
    return new goog.debug.Trace_.Stat_;
  };
  var a = this;
  this.idPool_ = new goog.structs.SimplePool(0, 2E3);
  this.idPool_.createObject = function() {
    return String(a.nextId_++);
  };
  this.idPool_.disposeObject = function(a) {
  };
  this.defaultThreshold_ = 3;
};
goog.debug.Trace_.prototype.logger_ = goog.log.getLogger("goog.debug.Trace");
goog.debug.Trace_.prototype.MAX_TRACE_SIZE = 1E3;
goog.debug.Trace_.EventType = {START:0, STOP:1, COMMENT:2};
goog.debug.Trace_.Stat_ = function() {
  this.varAlloc = this.time = this.count = 0;
};
goog.debug.Trace_.Stat_.prototype.toString = function() {
  var a = [];
  a.push(this.type, " ", this.count, " (", Math.round(10 * this.time) / 10, " ms)");
  this.varAlloc && a.push(" [VarAlloc = ", this.varAlloc, "]");
  return a.join("");
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
  return d.join("");
};
goog.debug.Trace_.Event_.prototype.toString = function() {
  return null == this.type ? this.comment : "[" + this.type + "] " + this.comment;
};
goog.debug.Trace_.prototype.setStartTime = function(a) {
  this.startTime_ = a;
};
goog.debug.Trace_.prototype.initCurrentTrace = function(a) {
  this.reset(a);
};
goog.debug.Trace_.prototype.clearCurrentTrace = function() {
  this.reset(0);
};
goog.debug.Trace_.prototype.reset = function(a) {
  this.defaultThreshold_ = a;
  for (a = 0;a < this.events_.length;a++) {
    var b = this.eventPool_.id;
    b && this.idPool_.releaseObject(b);
    this.eventPool_.releaseObject(this.events_[a]);
  }
  this.events_.length = 0;
  this.outstandingEvents_.clear();
  this.startTime_ = goog.debug.Trace_.now();
  this.commentCount_ = this.tracerCount_ = this.tracerOverheadComment_ = this.tracerOverheadEnd_ = this.tracerOverheadStart_ = 0;
  b = this.stats_.getKeys();
  for (a = 0;a < b.length;a++) {
    var c = this.stats_.get(b[a]);
    c.count = 0;
    c.time = 0;
    c.varAlloc = 0;
    this.statPool_.releaseObject(c);
  }
  this.stats_.clear();
};
goog.debug.Trace_.prototype.startTracer = function(a, b) {
  var c = goog.debug.Trace_.now(), d = this.getTotalVarAlloc(), e = this.outstandingEvents_.getCount();
  if (this.events_.length + e > this.MAX_TRACE_SIZE) {
    goog.log.warning(this.logger_, "Giant thread trace. Clearing to avoid memory leak.");
    if (this.events_.length > this.MAX_TRACE_SIZE / 2) {
      for (var f = 0;f < this.events_.length;f++) {
        var g = this.events_[f];
        g.id && this.idPool_.releaseObject(g.id);
        this.eventPool_.releaseObject(g);
      }
      this.events_.length = 0;
    }
    e > this.MAX_TRACE_SIZE / 2 && this.outstandingEvents_.clear();
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
  return g.id;
};
goog.debug.Trace_.prototype.stopTracer = function(a, b) {
  var c = goog.debug.Trace_.now(), d;
  d = 0 === b ? 0 : b ? b : this.defaultThreshold_;
  var e = this.outstandingEvents_.get(String(a));
  if (null == e) {
    return null;
  }
  this.outstandingEvents_.remove(String(a));
  var f, g = c - e.startTime;
  if (g < d) {
    for (d = this.events_.length - 1;0 <= d;d--) {
      if (this.events_[d] == e) {
        this.events_.splice(d, 1);
        this.idPool_.releaseObject(e.id);
        this.eventPool_.releaseObject(e);
        break;
      }
    }
  } else {
    f = this.eventPool_.getObject(), f.eventType = goog.debug.Trace_.EventType.STOP, f.startTime = e.startTime, f.comment = e.comment, f.type = e.type, f.stopTime = f.eventTime = c, this.events_.push(f);
  }
  d = e.type;
  var k = null;
  d && (k = this.getStat_(d), k.count++, k.time += g);
  f && (goog.debug.Logger.logToProfilers("Stop : " + f.comment), f.totalVarAlloc = this.getTotalVarAlloc(), k && (k.varAlloc += f.totalVarAlloc - e.totalVarAlloc));
  e = goog.debug.Trace_.now();
  this.tracerOverheadEnd_ += e - c;
  return g;
};
goog.debug.Trace_.prototype.setGcTracer = function(a) {
  this.gcTracer_ = a;
};
goog.debug.Trace_.prototype.getTotalVarAlloc = function() {
  var a = this.gcTracer_;
  return a && a.isTracing() ? a.totalVarAlloc : -1;
};
goog.debug.Trace_.prototype.addComment = function(a, b, c) {
  var d = goog.debug.Trace_.now(), e = c ? c : d, f = this.eventPool_.getObject();
  f.eventType = goog.debug.Trace_.EventType.COMMENT;
  f.eventTime = e;
  f.type = b;
  f.comment = a;
  f.totalVarAlloc = this.getTotalVarAlloc();
  this.commentCount_++;
  if (c) {
    a = this.events_.length;
    for (b = 0;b < a;b++) {
      if (this.events_[b].eventTime > e) {
        goog.array.insertAt(this.events_, f, b);
        break;
      }
    }
    b == a && this.events_.push(f);
  } else {
    this.events_.push(f);
  }
  (e = f.type) && this.getStat_(e).count++;
  this.tracerOverheadComment_ += goog.debug.Trace_.now() - d;
};
goog.debug.Trace_.prototype.getStat_ = function(a) {
  var b = this.stats_.get(a);
  b || (b = this.statPool_.getObject(), b.type = a, this.stats_.set(a, b));
  return b;
};
goog.debug.Trace_.prototype.getFormattedTrace = function() {
  return this.toString();
};
goog.debug.Trace_.prototype.toString = function() {
  for (var a = [], b = -1, c = [], d = 0;d < this.events_.length;d++) {
    var e = this.events_[d];
    e.eventType == goog.debug.Trace_.EventType.STOP && c.pop();
    a.push(" ", e.toTraceString(this.startTime_, b, c.join("")));
    b = e.eventTime;
    a.push("\n");
    e.eventType == goog.debug.Trace_.EventType.START && c.push("|  ");
  }
  if (0 != this.outstandingEvents_.getCount()) {
    var f = goog.debug.Trace_.now();
    a.push(" Unstopped timers:\n");
    goog.iter.forEach(this.outstandingEvents_, function(b) {
      a.push("  ", b, " (", f - b.startTime, " ms, started at ", goog.debug.Trace_.formatTime_(b.startTime), ")\n");
    });
  }
  b = this.stats_.getKeys();
  for (d = 0;d < b.length;d++) {
    c = this.stats_.get(b[d]), 1 < c.count && a.push(" TOTAL ", c, "\n");
  }
  a.push("Total tracers created ", this.tracerCount_, "\n", "Total comments created ", this.commentCount_, "\n", "Overhead start: ", this.tracerOverheadStart_, " ms\n", "Overhead end: ", this.tracerOverheadEnd_, " ms\n", "Overhead comment: ", this.tracerOverheadComment_, " ms\n");
  return a.join("");
};
goog.debug.Trace_.longToPaddedString_ = function(a) {
  a = Math.round(a);
  var b = "";
  1E3 > a && (b = " ");
  100 > a && (b = "  ");
  10 > a && (b = "   ");
  return b + a;
};
goog.debug.Trace_.formatTime_ = function(a) {
  a = Math.round(a);
  var b = a % 1E3;
  return String(100 + a / 1E3 % 60).substring(1, 3) + "." + String(1E3 + b).substring(1, 4);
};
goog.debug.Trace_.now = function() {
  return goog.now();
};
goog.debug.Trace = new goog.debug.Trace_;
// Input 138
goog.debug.ErrorHandler = function(a) {
  goog.Disposable.call(this);
  this.errorHandlerFn_ = a;
  this.wrapErrors_ = !0;
  this.prefixErrorMessages_ = !1;
};
goog.inherits(goog.debug.ErrorHandler, goog.Disposable);
goog.debug.ErrorHandler.prototype.addTracersToProtectedFunctions_ = !1;
goog.debug.ErrorHandler.prototype.setAddTracersToProtectedFunctions = function(a) {
  this.addTracersToProtectedFunctions_ = a;
};
goog.debug.ErrorHandler.prototype.wrap = function(a) {
  return this.protectEntryPoint(goog.asserts.assertFunction(a));
};
goog.debug.ErrorHandler.prototype.unwrap = function(a) {
  goog.asserts.assertFunction(a);
  return a[this.getFunctionIndex_(!1)] || a;
};
goog.debug.ErrorHandler.prototype.getStackTraceHolder_ = function(a) {
  var b = [];
  b.push("##PE_STACK_START##");
  b.push(a.replace(/(\r\n|\r|\n)/g, "##STACK_BR##"));
  b.push("##PE_STACK_END##");
  return b.join("");
};
goog.debug.ErrorHandler.prototype.getFunctionIndex_ = function(a) {
  return(a ? "__wrapper_" : "__protected_") + goog.getUid(this) + "__";
};
goog.debug.ErrorHandler.prototype.protectEntryPoint = function(a) {
  var b = this.getFunctionIndex_(!0);
  a[b] || ((a[b] = this.getProtectedFunction(a))[this.getFunctionIndex_(!1)] = a);
  return a[b];
};
goog.debug.ErrorHandler.prototype.getProtectedFunction = function(a) {
  var b = this, c = this.addTracersToProtectedFunctions_;
  if (c) {
    var d = goog.debug.getStacktraceSimple(15)
  }
  var e = function() {
    if (b.isDisposed()) {
      return a.apply(this, arguments);
    }
    if (c) {
      var e = goog.debug.Trace.startTracer("protectedEntryPoint: " + b.getStackTraceHolder_(d))
    }
    try {
      return a.apply(this, arguments);
    } catch (g) {
      b.errorHandlerFn_(g);
      if (!b.wrapErrors_) {
        throw b.prefixErrorMessages_ && ("object" === typeof g ? g.message = goog.debug.ErrorHandler.ProtectedFunctionError.MESSAGE_PREFIX + g.message : g = goog.debug.ErrorHandler.ProtectedFunctionError.MESSAGE_PREFIX + g), goog.DEBUG && g && g.stack && Error.captureStackTrace && goog.global.console && goog.global.console.error(g.message, g.stack), g;
      }
      throw new goog.debug.ErrorHandler.ProtectedFunctionError(g);
    } finally {
      c && goog.debug.Trace.stopTracer(e);
    }
  };
  e[this.getFunctionIndex_(!1)] = a;
  return e;
};
goog.debug.ErrorHandler.prototype.protectWindowSetTimeout = function() {
  this.protectWindowFunctionsHelper_("setTimeout");
};
goog.debug.ErrorHandler.prototype.protectWindowSetInterval = function() {
  this.protectWindowFunctionsHelper_("setInterval");
};
goog.debug.ErrorHandler.prototype.protectWindowRequestAnimationFrame = function() {
  for (var a = goog.getObjectByName("window"), b = ["requestAnimationFrame", "mozRequestAnimationFrame", "webkitAnimationFrame", "msRequestAnimationFrame"], c = 0;c < b.length;c++) {
    var d = b[c];
    b[c] in a && (a[d] = this.protectEntryPoint(a[d]));
  }
};
goog.debug.ErrorHandler.prototype.protectWindowFunctionsHelper_ = function(a) {
  var b = goog.getObjectByName("window"), c = b[a], d = this;
  b[a] = function(a, b) {
    goog.isString(a) && (a = goog.partial(goog.globalEval, a));
    a = d.protectEntryPoint(a);
    return c.call ? c.call(this, a, b) : c(a, b);
  };
  b[a][this.getFunctionIndex_(!1)] = c;
};
goog.debug.ErrorHandler.prototype.setWrapErrors = function(a) {
  this.wrapErrors_ = a;
};
goog.debug.ErrorHandler.prototype.setPrefixErrorMessages = function(a) {
  this.prefixErrorMessages_ = a;
};
goog.debug.ErrorHandler.prototype.disposeInternal = function() {
  var a = goog.getObjectByName("window");
  a.setTimeout = this.unwrap(a.setTimeout);
  a.setInterval = this.unwrap(a.setInterval);
  goog.debug.ErrorHandler.superClass_.disposeInternal.call(this);
};
goog.debug.ErrorHandler.ProtectedFunctionError = function(a) {
  goog.debug.Error.call(this, goog.debug.ErrorHandler.ProtectedFunctionError.MESSAGE_PREFIX + (a && a.message ? String(a.message) : String(a)));
  (a = (this.cause = a) && a.stack) && goog.isString(a) && (this.stack = a);
};
goog.inherits(goog.debug.ErrorHandler.ProtectedFunctionError, goog.debug.Error);
goog.debug.ErrorHandler.ProtectedFunctionError.MESSAGE_PREFIX = "Error in protected function: ";
// Input 139
goog.events.EventHandler = function(a) {
  goog.Disposable.call(this);
  this.handler_ = a;
  this.keys_ = {};
};
goog.inherits(goog.events.EventHandler, goog.Disposable);
goog.events.EventHandler.typeArray_ = [];
goog.events.EventHandler.prototype.listen = function(a, b, c, d, e) {
  goog.isArray(b) || (goog.events.EventHandler.typeArray_[0] = b, b = goog.events.EventHandler.typeArray_);
  for (var f = 0;f < b.length;f++) {
    var g = goog.events.listen(a, b[f], c || this.handleEvent, d || !1, e || this.handler_ || this);
    if (!g) {
      break;
    }
    this.keys_[g.key] = g;
  }
  return this;
};
goog.events.EventHandler.prototype.listenOnce = function(a, b, c, d, e) {
  if (goog.isArray(b)) {
    for (var f = 0;f < b.length;f++) {
      this.listenOnce(a, b[f], c, d, e);
    }
  } else {
    a = goog.events.listenOnce(a, b, c || this.handleEvent, d, e || this.handler_ || this);
    if (!a) {
      return this;
    }
    this.keys_[a.key] = a;
  }
  return this;
};
goog.events.EventHandler.prototype.listenWithWrapper = function(a, b, c, d, e) {
  b.listen(a, c, d, e || this.handler_ || this, this);
  return this;
};
goog.events.EventHandler.prototype.getListenerCount = function() {
  var a = 0, b;
  for (b in this.keys_) {
    Object.prototype.hasOwnProperty.call(this.keys_, b) && a++;
  }
  return a;
};
goog.events.EventHandler.prototype.unlisten = function(a, b, c, d, e) {
  if (goog.isArray(b)) {
    for (var f = 0;f < b.length;f++) {
      this.unlisten(a, b[f], c, d, e);
    }
  } else {
    if (a = goog.events.getListener(a, b, c || this.handleEvent, d, e || this.handler_ || this)) {
      goog.events.unlistenByKey(a), delete this.keys_[a.key];
    }
  }
  return this;
};
goog.events.EventHandler.prototype.unlistenWithWrapper = function(a, b, c, d, e) {
  b.unlisten(a, c, d, e || this.handler_ || this, this);
  return this;
};
goog.events.EventHandler.prototype.removeAll = function() {
  goog.object.forEach(this.keys_, goog.events.unlistenByKey);
  this.keys_ = {};
};
goog.events.EventHandler.prototype.disposeInternal = function() {
  goog.events.EventHandler.superClass_.disposeInternal.call(this);
  this.removeAll();
};
goog.events.EventHandler.prototype.handleEvent = function(a) {
  throw Error("EventHandler.handleEvent not implemented");
};
// Input 140
wtf.db.node = function() {
};
// Input 141
wtf.replay = {};
wtf.replay.graphics = {};
wtf.replay.graphics.Step = function(a, b, c, d, e, f, g) {
  this.eventList_ = a;
  this.startEventId_ = b;
  this.endEventId_ = c;
  this.visibleEventTypeIds_ = f || {};
  this.frame_ = d || null;
  this.initialContexts_ = e || {};
  this.stepBeginContextHandle_ = g || -1;
};
wtf.replay.graphics.Step.prototype.getEventIterator = function(a) {
  return a ? (a = this.createVisibleEventsList_(), new wtf.db.EventIterator(this.eventList_, 0, a.length - 1, 0, a)) : this.eventList_.beginEventRange(this.startEventId_, this.endEventId_);
};
wtf.replay.graphics.Step.prototype.getInitialCurrentContext = function() {
  return this.stepBeginContextHandle_;
};
wtf.replay.graphics.Step.prototype.getContextChangingEvents = function() {
  for (var a = this.eventList_.getEventTypeId("wtf.webgl#createContext"), b = this.eventList_.getEventTypeId("wtf.webgl#setContext"), c = [], d = this.getEventIterator(!0);!d.done();d.next()) {
    var e = d.getTypeId();
    e != a && e != b || c.push([d.getIndex(), d.getArgument("handle")]);
  }
  return c;
};
wtf.replay.graphics.Step.prototype.getFrame = function() {
  return this.frame_;
};
wtf.replay.graphics.Step.prototype.getStartEventId = function() {
  return this.startEventId_;
};
wtf.replay.graphics.Step.prototype.getEndEventId = function() {
  return this.endEventId_;
};
wtf.replay.graphics.Step.prototype.createVisibleEventsList_ = function() {
  for (var a = [], b = this.getEventIterator();!b.done();b.next()) {
    this.visibleEventTypeIds_[b.getTypeId()] && a.push(b.getIndex());
  }
  return a;
};
wtf.replay.graphics.Step.prototype.getInitialContexts = function() {
  return this.initialContexts_;
};
wtf.replay.graphics.Step.constructStepsList = function(a, b) {
  var c = [];
  if (!a.getCount()) {
    return c;
  }
  for (var d = a.eventTypeTable.getSetMatching(/^((WebGLRenderingContext#)|(wtf.webgl#)|(ANGLEInstancedArrays#))/), e = a.getEventTypeId("wtf.timing#frameStart"), f = a.getEventTypeId("wtf.timing#frameEnd"), g = a.getEventTypeId("wtf.webgl#createContext"), k = a.getEventTypeId("wtf.webgl#setContext"), m = a.begin(), l = m.getId(), p = l, s = b.getCount() ? b.getAllFrames()[0] : null, t = !0, x = -1, v = x, w = !1, u = !1, q = {}, z = {};!m.done();) {
    var r = m.getTypeId();
    r == e ? (t || (w && (u && (q = goog.object.clone(z)), v = new wtf.replay.graphics.Step(a, l, p, null, q, d, v), c.push(v), u = !1), w = !1, v = x), l = m.getId(), m.next()) : r == f ? (w && (u && (q = goog.object.clone(z)), v = new wtf.replay.graphics.Step(a, l, m.getId(), s, q, d, v), c.push(v), u = !1), w = !1, v = x, t = !0, s && (s = b.getNextFrame(s)), m.next(), m.done() || (l = m.getId())) : (r == g ? (x = m.getArgument("handle"), u = w = z[x] = !0) : r == k ? (x = m.getArgument("handle"), 
    w = !0) : (p = m.getId(), t = !1, d[r] && (w = !0)), m.next());
  }
  !t && w && (v = new wtf.replay.graphics.Step(a, l, p, null, q, d, v), c.push(v));
  return c;
};
goog.exportSymbol("wtf.replay.graphics.Step", wtf.replay.graphics.Step);
goog.exportSymbol("wtf.replay.graphics.Step.constructStepsList", wtf.replay.graphics.Step.constructStepsList);
// Input 142
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(a, b, c, d, e) {
};
goog.events.EventWrapper.prototype.unlisten = function(a, b, c, d, e) {
};
// Input 143
wtf.io.WriteTransport = function() {
  wtf.events.EventEmitter.call(this);
  this.needsLibraryDispose = !1;
};
goog.inherits(wtf.io.WriteTransport, wtf.events.EventEmitter);
wtf.io.WriteTransport.prototype.disposeInternal = function() {
  wtf.io.WriteTransport.superClass_.disposeInternal.call(this);
};
// Input 144
wtf.io.cff.StreamTarget = function(a) {
  wtf.io.cff.StreamBase.call(this);
  this.transport_ = a;
};
goog.inherits(wtf.io.cff.StreamTarget, wtf.io.cff.StreamBase);
wtf.io.cff.StreamTarget.prototype.disposeInternal = function() {
  goog.dispose(this.transport_);
  wtf.io.cff.StreamTarget.superClass_.disposeInternal.call(this);
};
wtf.io.cff.StreamTarget.prototype.getTransport = function() {
  return this.transport_;
};
wtf.io.cff.StreamTarget.EventType = {};
// Input 145
wtf.io.cff.BinaryStreamTarget = function(a) {
  wtf.io.cff.StreamTarget.call(this, a);
  var b = new Uint32Array(3);
  b[0] = 3735928559;
  b[1] = wtf.version.getValue();
  b[2] = wtf.data.formats.ChunkedFileFormat.VERSION;
  a.write(b);
};
goog.inherits(wtf.io.cff.BinaryStreamTarget, wtf.io.cff.StreamTarget);
wtf.io.cff.BinaryStreamTarget.prototype.writeChunk = function(a) {
  for (var b = this.getTransport(), c = [], d = 0, e = a.getParts(), f = Array(e.length), g = Array(e.length), k = 0;k < e.length;k++) {
    var m = e[k].toBlobData(), l;
    if (m instanceof ArrayBuffer || m.buffer instanceof ArrayBuffer) {
      l = m.byteLength;
    } else {
      if (wtf.io.Blob.isBlob(m)) {
        l = m.getSize();
      } else {
        if (goog.global.Blob && m instanceof Blob) {
          l = m.size;
        } else {
          if ("string" == typeof m) {
            m = wtf.io.Blob.create([m]), l = m.getSize();
          } else {
            throw Error("Invalid blob data type: " + typeof m);
          }
        }
      }
    }
    c.push(m);
    f[k] = d;
    g[k] = l;
    d += l;
    l % 4 && (m = 4 - l % 4, c.push(new Uint8Array(m)), d += m);
  }
  m = 4 * (6 + 3 * e.length);
  l = new Uint32Array(m / 4);
  var p = 0;
  l[p++] = a.getId();
  l[p++] = wtf.io.cff.ChunkType.toInteger(a.getType());
  l[p++] = m + d;
  l[p++] = a.getStartTime();
  l[p++] = a.getEndTime();
  l[p++] = e.length;
  for (k = 0;k < e.length;k++) {
    a = e[k], l[p++] = wtf.io.cff.PartType.toInteger(a.getType()), l[p++] = f[k], l[p++] = g[k];
  }
  c.unshift(l.buffer);
  d += m;
  d % 4 && c.push(new Uint8Array(4 - d % 4));
  c = wtf.io.Blob.create(c);
  b.write(c);
};
wtf.io.cff.BinaryStreamTarget.prototype.end = function() {
};
// Input 146
wtf.io.cff.JsonStreamTarget = function(a, b) {
  wtf.io.cff.StreamTarget.call(this, a);
  this.mode_ = goog.isDef(b) ? b : wtf.io.cff.JsonStreamTarget.Mode.COMPLETE;
  this.hasWrittenAny_ = !1;
  var c = ['"wtfVersion": ' + wtf.version.getValue(), '"formatVersion": ' + wtf.data.formats.ChunkedFileFormat.VERSION].join(",\n  "), d;
  switch(this.mode_) {
    case wtf.io.cff.JsonStreamTarget.Mode.COMPLETE:
      d = "{\n  " + c + ',\n  "chunks": [';
      break;
    case wtf.io.cff.JsonStreamTarget.Mode.PARTIAL:
      d = "{\n  " + c + "\n}\n";
  }
  goog.asserts.assert(d);
  a.write(d);
};
goog.inherits(wtf.io.cff.JsonStreamTarget, wtf.io.cff.StreamTarget);
wtf.io.cff.JsonStreamTarget.Mode = {COMPLETE:"complete", PARTIAL:"partial"};
wtf.io.cff.JsonStreamTarget.prototype.writeChunk = function(a) {
  var b = this.getTransport(), c = {id:a.getId(), type:a.getType()};
  a.getStartTime() != wtf.io.cff.Chunk.INVALID_TIME && (c.startTime = a.getStartTime() | 0);
  a.getEndTime() != wtf.io.cff.Chunk.INVALID_TIME && (c.endTime = a.getEndTime() | 0);
  a = a.getParts();
  for (var d = Array(a.length), e = 0;e < a.length;e++) {
    d[e] = a[e].toJsonObject();
  }
  c.parts = d;
  c = goog.global.JSON.stringify(c);
  switch(this.mode_) {
    case wtf.io.cff.JsonStreamTarget.Mode.COMPLETE:
      b.write((this.hasWrittenAny_ ? ",\n    " : "\n    ") + c);
      break;
    case wtf.io.cff.JsonStreamTarget.Mode.PARTIAL:
      b.write('{"chunks": [' + c + "]}\n");
  }
  this.hasWrittenAny_ = !0;
};
wtf.io.cff.JsonStreamTarget.prototype.end = function() {
  var a = this.getTransport();
  switch(this.mode_) {
    case wtf.io.cff.JsonStreamTarget.Mode.COMPLETE:
      a.write("\n  ]\n}");
  }
};
// Input 147
wtf.io.transports.BlobWriteTransport = function(a) {
  wtf.io.WriteTransport.call(this);
  this.filename_ = a;
  this.blobParts_ = [];
};
goog.inherits(wtf.io.transports.BlobWriteTransport, wtf.io.WriteTransport);
wtf.io.transports.BlobWriteTransport.prototype.disposeInternal = function() {
  var a = wtf.io.Blob.create(this.blobParts_);
  wtf.pal.getPlatform().writeBinaryFile(this.filename_, wtf.io.Blob.toNative(a));
  this.blobParts_ = [];
  wtf.io.transports.BlobWriteTransport.superClass_.disposeInternal.call(this);
};
wtf.io.transports.BlobWriteTransport.prototype.write = function(a) {
  wtf.io.Blob.isBlob(a) ? this.blobParts_.push(a) : this.blobParts_.push(wtf.io.Blob.create([a]));
};
wtf.io.transports.BlobWriteTransport.prototype.flush = function() {
};
wtf.io.transports.BlobWriteTransport.prototype.getBlob = function() {
  return wtf.io.Blob.create(this.blobParts_);
};
// Input 148
wtf.io.transports.FileWriteTransport = function(a) {
  wtf.io.WriteTransport.call(this);
  this.fs_ = require("fs");
  this.filename_ = a;
  this.fd_ = this.fs_.openSync(this.filename_, "w");
};
goog.inherits(wtf.io.transports.FileWriteTransport, wtf.io.WriteTransport);
wtf.io.transports.FileWriteTransport.prototype.disposeInternal = function() {
  this.fs_.fsyncSync(this.fd_);
  this.fs_.closeSync(this.fd_);
  wtf.io.transports.FileWriteTransport.superClass_.disposeInternal.call(this);
};
wtf.io.transports.FileWriteTransport.prototype.write = function(a) {
  if (a instanceof ArrayBuffer || a.buffer && a.buffer instanceof ArrayBuffer) {
    var b;
    b = a instanceof ArrayBuffer ? new Uint8Array(a) : new Uint8Array(a.buffer);
    a = new Buffer(b.length);
    for (var c = 0;c < a.length;c++) {
      a[c] = b[c];
    }
  } else {
    if (wtf.io.Blob.isBlob(a)) {
      a = wtf.io.Blob.toNative(a);
    } else {
      throw Error("Unsupported write data type.");
    }
  }
  this.fs_.writeSync(this.fd_, a, 0, a.length, null);
};
wtf.io.transports.FileWriteTransport.prototype.flush = function() {
  this.fs_.fsyncSync(this.fd_);
};
// Input 149
wtf.io.transports.MemoryWriteTransport = function() {
  wtf.io.WriteTransport.call(this);
  this.data_ = [];
  this.targetArray_ = null;
};
goog.inherits(wtf.io.transports.MemoryWriteTransport, wtf.io.WriteTransport);
wtf.io.transports.MemoryWriteTransport.prototype.disposeInternal = function() {
  this.targetArray_ && this.targetArray_.push(this.getBlob());
  wtf.io.transports.MemoryWriteTransport.superClass_.disposeInternal.call(this);
};
wtf.io.transports.MemoryWriteTransport.prototype.setTargetArray = function(a) {
  this.targetArray_ = a;
};
wtf.io.transports.MemoryWriteTransport.prototype.write = function(a) {
  this.data_.push(a);
};
wtf.io.transports.MemoryWriteTransport.prototype.flush = function() {
};
wtf.io.transports.MemoryWriteTransport.prototype.getBlob = function() {
  return wtf.io.Blob.create(this.data_);
};
// Input 150
wtf.io.transports.NullWriteTransport = function() {
  wtf.io.WriteTransport.call(this);
};
goog.inherits(wtf.io.transports.NullWriteTransport, wtf.io.WriteTransport);
wtf.io.transports.NullWriteTransport.prototype.write = function(a) {
};
wtf.io.transports.NullWriteTransport.prototype.flush = function() {
};
// Input 151
wtf.io.transports.XhrWriteTransport = function(a, b, c) {
  wtf.io.WriteTransport.call(this);
  this.url_ = a;
  this.mimeType_ = b || null;
  this.filename_ = c || null;
  this.xhr_ = null;
  this.data_ = [];
};
goog.inherits(wtf.io.transports.XhrWriteTransport, wtf.io.WriteTransport);
wtf.io.transports.XhrWriteTransport.TIMEOUT_MS_ = 12E4;
wtf.io.transports.XhrWriteTransport.prototype.disposeInternal = function() {
  this.flush();
  this.xhr_ && (this.xhr_.onprogress = null, this.xhr_.onload = null, this.xhr_ = this.xhr_.onerror = null);
  wtf.io.transports.XhrWriteTransport.superClass_.disposeInternal.call(this);
};
wtf.io.transports.XhrWriteTransport.prototype.write = function(a) {
  this.data_.push(a);
};
wtf.io.transports.XhrWriteTransport.prototype.flush = function() {
  goog.asserts.assert(!this.xhr_);
  var a = this.mimeType_ || "application/octet-stream";
  this.xhr_ = new (XMLHttpRequest.raw || XMLHttpRequest);
  this.xhr_.onload = function(a) {
  };
  this.xhr_.onerror = function(a) {
  };
  var b = wtf.io.Blob.toNativeParts(this.data_), b = new Blob(b, {type:a});
  this.xhr_.open("POST", this.url_, !0);
  this.xhr_.timeout = wtf.io.transports.XhrWriteTransport.TIMEOUT_MS_;
  this.xhr_.setRequestHeader("Content-Type", a);
  this.filename_ && this.xhr_.setRequestHeader("X-Filename", this.filename_);
  this.xhr_.send(b);
};
// Input 152
wtf.trace = {};
wtf.trace.EventSessionContext = function() {
};
wtf.trace.EventSessionContext.create = function() {
  return Array(2);
};
wtf.trace.EventSessionContext.init = function(a, b) {
  a[0] = b;
};
wtf.trace.EventSessionContext.setBuffer = function(a, b) {
  a[1] = b;
};
// Input 153
wtf.trace.EventType = function(a, b, c, d) {
  this.name = a;
  this.eventClass = b;
  this.flags = c;
  this.args = d || [];
  this.wireId = wtf.trace.EventType.nextEventWireId_++;
  goog.asserts.assert(this.wireId <= wtf.trace.EventType.MAX_EVENT_WIRE_ID_);
  this.append = null;
  this.count = 0;
};
wtf.trace.EventType.MAX_EVENT_WIRE_ID_ = 65535;
wtf.trace.EventType.nextEventWireId_ = 1;
wtf.trace.EventType.prototype.toString = function() {
  return this.name;
};
wtf.trace.EventType.prototype.getArgString = function() {
  if (!this.args.length) {
    return null;
  }
  for (var a = [], b = 0;b < this.args.length;b++) {
    var c = this.args[b];
    a.push(c.typeName + " " + c.name);
  }
  return a.join(", ");
};
wtf.trace.EventType.prototype.generateCode = function(a, b) {
  this.append = a.generate(b, this);
};
wtf.trace.EventType.getNameMap = function() {
  var a = goog.reflect.object(wtf.trace.EventType, {count:0}), a = goog.object.transpose(a);
  return{count:a[0]};
};
// Input 154
wtf.trace.EventTypeBuilder = function() {
  wtf.util.FunctionBuilder.call(this);
  this.eventTypeNames_ = wtf.trace.EventType.getNameMap();
};
goog.inherits(wtf.trace.EventTypeBuilder, wtf.util.FunctionBuilder);
wtf.trace.EventTypeBuilder.prototype.generate = function(a, b) {
  var c = wtf.trace.EventTypeBuilder.WRITERS_;
  this.begin();
  this.addScopeVariable("context", a);
  this.addScopeVariable("eventType", b);
  this.addScopeVariable("now", wtf.now);
  this.addScopeVariable("stringify", function(a) {
    var b = null;
    return b = "number" == typeof a ? "" + a : "boolean" == typeof a ? "" + a : a ? goog.global.JSON.stringify(a) : null;
  });
  this.append("var time = (opt_time === undefined) ? now() : opt_time;");
  this.append("eventType." + this.eventTypeNames_.count + "++;");
  for (var d = {int32Array:!0}, e = 8, f = [], g = b.args, k = 0;k < g.length;k++) {
    var m = g[k];
    this.addArgument(m.name + "_");
    var l = c[m.typeName];
    goog.asserts.assert(l);
    for (var p = 0;p < l.uses.length;p++) {
      d[l.uses[p]] = !0;
    }
    l.size && (e += 4 > l.size ? l.size + (4 - l.size % 4) : 4);
    l.computeSize && f.push("(" + l.computeSize(m.name + "_") + ")");
    l.setup && this.append.apply(this, l.setup(m.name + "_"));
  }
  f.length ? this.append("var size = " + e + " + " + f.join(" + ") + ";") : this.append("var size = " + e + ";");
  this.addArgument("opt_time");
  this.addArgument("opt_buffer");
  this.append("var buffer = opt_buffer || context[1];", "var session = context[0];", "if (!buffer || buffer.capacity - buffer.offset < size) {", "  buffer = session ? session.acquireBuffer(time, size) : null;", "  context[1] = buffer;", "}", "if (!buffer || !session) return undefined;");
  for (var s in d) {
    this.append("var " + s + " = buffer." + s + ";");
  }
  this.append("var o = buffer.offset >> 2;", "int32Array[o + 0] = " + b.wireId + ";", "int32Array[o + 1] = time * 1000;");
  d = 2;
  if (g.length) {
    for (k = 0;k < g.length;k++) {
      m = g[k], l = c[m.typeName], !l.size && d && (this.append("o += " + d + ";"), d = 0), this.append.apply(this, l.write(m.name + "_", "o + " + d)), l.size && (d += l.size + 3 >> 2);
    }
  }
  d ? this.append("buffer.offset = (o + " + d + ") << 2;") : this.append("buffer.offset = o << 2;");
  b.eventClass == wtf.data.EventClass.SCOPE && this.append("return session.enterTypedScope(time);");
  c = this.end(b.toString());
  c.eventType = b;
  return c;
};
wtf.trace.EventTypeBuilder.WRITE_BOOL_ = {uses:["int8Array"], size:1, setup:null, computeSize:null, write:function(a, b) {
  return["int8Array[(" + b + ") << 2] = " + a + " ? 1 : 0;"];
}};
wtf.trace.EventTypeBuilder.WRITE_INT8_ = {uses:["int8Array"], size:1, setup:null, computeSize:null, write:function(a, b) {
  return["int8Array[(" + b + ") << 2] = " + a + ";"];
}};
wtf.trace.EventTypeBuilder.WRITE_INT8ARRAY_ = {uses:["int32Array", "int8Array"], size:0, setup:function(a) {
  return["var " + a + "Length = " + a + " ? " + a + ".length : 0;"];
}, computeSize:function(a) {
  return "4 + ((" + a + "Length + 3) & ~0x3)";
}, write:function(a, b) {
  return["if (!" + a + ") {", "  int32Array[o++] = -1;", "} else {", "  int32Array[o++] = " + a + "Length;", "  for (var n = 0, oi = o << 2; n < " + a + "Length; n++) {", "    int8Array[oi + n] = " + a + "[n];", "  }", "  o += (" + a + "Length + 3) >> 2;", "}"];
}};
wtf.trace.EventTypeBuilder.WRITE_INT16_ = {uses:["int16Array"], size:2, setup:null, computeSize:null, write:function(a, b) {
  return["int16Array[(" + b + ") << 1] = " + a + ";"];
}};
wtf.trace.EventTypeBuilder.WRITE_INT16ARRAY_ = {uses:["int32Array", "int16Array"], size:0, setup:function(a) {
  return["var " + a + "Length = " + a + " ? " + a + ".length : 0;"];
}, computeSize:function(a) {
  return "4 + (((" + a + "Length + 1) << 1) & 0x3)";
}, write:function(a, b) {
  return["if (!" + a + ") {", "  int32Array[o++] = -1;", "} else {", "  int32Array[o++] = " + a + "Length;", "  for (var n = 0, oi = o << 1; n < " + a + "Length; n++) {", "    int16Array[oi + n] = " + a + "[n];", "  }", "  o += (" + a + "Length + 1) >> 1;", "}"];
}};
wtf.trace.EventTypeBuilder.WRITE_INT32_ = {uses:["int32Array"], size:4, setup:null, computeSize:null, write:function(a, b) {
  return["int32Array[" + b + "] = " + a + ";"];
}};
wtf.trace.EventTypeBuilder.WRITE_INT32ARRAY_ = {uses:["int32Array"], size:0, setup:function(a) {
  return["var " + a + "Length = " + a + " ? " + a + ".length : 0;"];
}, computeSize:function(a) {
  return "4 + " + a + "Length << 2";
}, write:function(a, b) {
  return["if (!" + a + ") {", "  int32Array[o++] = -1;", "} else {", "  int32Array[o++] = " + a + "Length;", "  for (var n = 0; n < " + a + "Length; n++) {", "    int32Array[o + n] = " + a + "[n];", "  }", "  o += " + a + "Length;", "}"];
}};
wtf.trace.EventTypeBuilder.WRITE_FLOAT32_ = {uses:["float32Array"], size:4, setup:null, computeSize:null, write:function(a, b) {
  return["float32Array[" + b + "] = " + a + ";"];
}};
wtf.trace.EventTypeBuilder.WRITE_FLOAT32ARRAY_ = {uses:["int32Array", "float32Array"], size:0, setup:function(a) {
  return["var " + a + "Length = " + a + " ? " + a + ".length : 0;"];
}, computeSize:function(a) {
  return "4 + " + a + "Length << 2";
}, write:function(a, b) {
  return["if (!" + a + ") {", "  int32Array[o++] = -1;", "} else {", "  int32Array[o++] = " + a + "Length;", "  for (var n = 0; n < " + a + "Length; n++) {", "    float32Array[o + n] = " + a + "[n];", "  }", "  o += " + a + "Length;", "}"];
}};
wtf.trace.EventTypeBuilder.WRITE_STRING_ = {uses:["int32Array", "stringTable"], size:4, setup:null, computeSize:null, write:function(a, b) {
  return["if (typeof " + a + ' == "string") {', "  int32Array[" + b + "] = " + a + ".length ? stringTable.addString(" + a + ") : -2;", "} else {", "  int32Array[" + b + "] = -1;", "}"];
}};
wtf.trace.EventTypeBuilder.WRITE_CHAR_ = {uses:["int8Array"], size:1, setup:null, computeSize:null, write:function(a, b) {
  return["int8Array[(" + b + ") << 2] = " + a + ".charCodeAt(0);"];
}};
wtf.trace.EventTypeBuilder.WRITE_CHARARRAY_ = {uses:["int32Array", "int8Array"], size:0, setup:function(a) {
  return["var " + a + "Length = " + a + " ? " + a + ".length : 0;"];
}, computeSize:function(a) {
  return "4 + ((" + a + "Length + 3) & ~0x3)";
}, write:function(a, b) {
  return["if (" + a + " === null || " + a + " === undefined) {", "  int32Array[o++] = -1;", "} else {", "  int32Array[o++] = " + a + "Length;", "  for (var n = 0, oi = o << 2; n < " + a + "Length; n++) {", "    int8Array[oi + n] = " + a + ".charCodeAt(n);", "  }", "  o += (" + a + "Length + 3) >> 2;", "}"];
}};
wtf.trace.EventTypeBuilder.WRITE_WCHAR_ = {uses:["int16Array"], size:2, setup:null, computeSize:null, write:function(a, b) {
  return["int16Array[(" + b + ") << 1] = " + a + ".charCodeAt(0);"];
}};
wtf.trace.EventTypeBuilder.WRITE_WCHARARRAY_ = {uses:["int32Array", "int16Array"], size:0, setup:function(a) {
  return["var " + a + "Length = " + a + " ? " + a + ".length : 0;"];
}, computeSize:function(a) {
  return "4 + (((" + a + "Length + 1) << 1) & 0x3)";
}, write:function(a, b) {
  return["if (" + a + " === null || " + a + " === undefined) {", "  int32Array[o++] = -1;", "} else {", "  int32Array[o++] = " + a + "Length;", "  for (var n = 0, oi = o << 1; n < " + a + "Length; n++) {", "    int16Array[oi + n] = " + a + ".charCodeAt(n);", "  }", "  o += (" + a + "Length + 1) >> 1;", "}"];
}};
wtf.trace.EventTypeBuilder.WRITE_ANY_ = {uses:["int32Array", "stringTable"], size:4, setup:null, computeSize:null, write:function(a, b) {
  return["int32Array[" + b + "] = " + a + " !== undefined && " + a + " !== null ? stringTable.addString(stringify(" + a + ")) : -1;"];
}};
wtf.trace.EventTypeBuilder.WRITE_FLOWID_ = {uses:["int32Array"], size:4, setup:null, computeSize:null, write:function(a, b) {
  return["int32Array[" + b + "] = " + a + " ? " + a + ".getId() : 0;"];
}};
wtf.trace.EventTypeBuilder.WRITE_TIME32_ = {uses:["int32Array"], size:4, setup:null, computeSize:null, write:function(a, b) {
  return["int32Array[" + b + "] = " + a + " * 1000;"];
}};
wtf.trace.EventTypeBuilder.WRITERS_ = {bool:wtf.trace.EventTypeBuilder.WRITE_BOOL_, int8:wtf.trace.EventTypeBuilder.WRITE_INT8_, "int8[]":wtf.trace.EventTypeBuilder.WRITE_INT8ARRAY_, uint8:wtf.trace.EventTypeBuilder.WRITE_INT8_, "uint8[]":wtf.trace.EventTypeBuilder.WRITE_INT8ARRAY_, int16:wtf.trace.EventTypeBuilder.WRITE_INT16_, "int16[]":wtf.trace.EventTypeBuilder.WRITE_INT16ARRAY_, uint16:wtf.trace.EventTypeBuilder.WRITE_INT16_, "uint16[]":wtf.trace.EventTypeBuilder.WRITE_INT16ARRAY_, int32:wtf.trace.EventTypeBuilder.WRITE_INT32_, 
"int32[]":wtf.trace.EventTypeBuilder.WRITE_INT32ARRAY_, uint32:wtf.trace.EventTypeBuilder.WRITE_INT32_, "uint32[]":wtf.trace.EventTypeBuilder.WRITE_INT32ARRAY_, float32:wtf.trace.EventTypeBuilder.WRITE_FLOAT32_, "float32[]":wtf.trace.EventTypeBuilder.WRITE_FLOAT32ARRAY_, ascii:wtf.trace.EventTypeBuilder.WRITE_STRING_, utf8:wtf.trace.EventTypeBuilder.WRITE_STRING_, "char":wtf.trace.EventTypeBuilder.WRITE_CHAR_, "char[]":wtf.trace.EventTypeBuilder.WRITE_CHARARRAY_, wchar:wtf.trace.EventTypeBuilder.WRITE_WCHAR_, 
"wchar[]":wtf.trace.EventTypeBuilder.WRITE_WCHARARRAY_, any:wtf.trace.EventTypeBuilder.WRITE_ANY_, flowId:wtf.trace.EventTypeBuilder.WRITE_FLOWID_, time32:wtf.trace.EventTypeBuilder.WRITE_TIME32_};
// Input 155
wtf.trace.EventRegistry = function() {
  wtf.events.EventEmitter.call(this);
  this.eventSessionContext_ = wtf.trace.EventSessionContext.create();
  this.eventTypesList_ = [];
  this.eventTypesByName_ = {};
};
goog.inherits(wtf.trace.EventRegistry, wtf.events.EventEmitter);
wtf.trace.EventRegistry.prototype.getEventSessionContext = function() {
  return this.eventSessionContext_;
};
wtf.trace.EventRegistry.prototype.registerEventType = function(a) {
  goog.asserts.assert(!this.eventTypesByName_[a.name]);
  this.eventTypesByName_[a.name] || (this.eventTypesList_.push(a), this.eventTypesByName_[a.name] = a, this.eventTypeBuilder_ = new wtf.trace.EventTypeBuilder, a.generateCode(this.eventTypeBuilder_, this.eventSessionContext_), this.emitEvent(wtf.trace.EventRegistry.EventType.EVENT_TYPE_REGISTERED, a));
};
wtf.trace.EventRegistry.EventType = {EVENT_TYPE_REGISTERED:goog.events.getUniqueId("etr")};
wtf.trace.EventRegistry.prototype.getEventTypes = function() {
  return this.eventTypesList_;
};
wtf.trace.EventRegistry.prototype.getEventType = function(a) {
  return this.eventTypesByName_[a] || null;
};
wtf.trace.EventRegistry.sharedInstance_ = null;
wtf.trace.EventRegistry.getShared = function() {
  wtf.trace.EventRegistry.sharedInstance_ || (wtf.trace.EventRegistry.sharedInstance_ = new wtf.trace.EventRegistry);
  return wtf.trace.EventRegistry.sharedInstance_;
};
// Input 156
wtf.trace.events = {};
wtf.trace.events.create_ = function(a, b, c) {
  var d = wtf.trace.EventRegistry.getShared(), e = wtf.data.Variable.parseSignature(a);
  a = e.name;
  var e = e.args, f = d.getEventType(a);
  if (f) {
    return goog.global.console.log("Attempting to redefine " + a + ", using first definition"), f;
  }
  b = new wtf.trace.EventType(a, b, c, e);
  d.registerEventType(b);
  return b;
};
wtf.trace.events.createInstance = function(a, b) {
  return wtf.trace.events.create_(a, wtf.data.EventClass.INSTANCE, b || 0).append;
};
wtf.trace.events.createScope = function(a, b) {
  return wtf.trace.events.create_(a, wtf.data.EventClass.SCOPE, b || 0).append;
};
// Input 157
wtf.trace.BuiltinEvents = {defineEvent:wtf.trace.events.createInstance("wtf.event#define(uint16 wireId, uint16 eventClass, uint32 flags, ascii name, ascii args)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), discontinuity:wtf.trace.events.createInstance("wtf.trace#discontinuity()", wtf.data.EventFlag.BUILTIN), createZone:wtf.trace.events.createInstance("wtf.zone#create(uint16 zoneId, ascii name, ascii type, ascii location)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), 
deleteZone:wtf.trace.events.createInstance("wtf.zone#delete(uint16 zoneId)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), setZone:wtf.trace.events.createInstance("wtf.zone#set(uint16 zoneId)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), enterScope:wtf.trace.events.createScope("wtf.scope#enter(ascii name)", wtf.data.EventFlag.BUILTIN), enterTracingScope:wtf.trace.events.createScope("wtf.scope#enterTracing()", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.SYSTEM_TIME), 
leaveScope:wtf.trace.events.createInstance("wtf.scope#leave()", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), appendScopeData:wtf.trace.events.createInstance("wtf.scope#appendData(ascii name, any value)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.APPEND_SCOPE_DATA), branchFlow:wtf.trace.events.createInstance("wtf.flow#branch(flowId id, flowId parentId, ascii name, any value)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), extendFlow:wtf.trace.events.createInstance("wtf.flow#extend(flowId id, ascii name, any value)", 
wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), terminateFlow:wtf.trace.events.createInstance("wtf.flow#terminate(flowId id, any value)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), appendFlowData:wtf.trace.events.createInstance("wtf.flow#appendData(flowId id, ascii name, any value)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.APPEND_FLOW_DATA), mark:wtf.trace.events.createInstance("wtf.trace#mark(ascii name, any value)", wtf.data.EventFlag.BUILTIN | 
wtf.data.EventFlag.INTERNAL), timeStamp:wtf.trace.events.createInstance("wtf.trace#timeStamp(ascii name, any value)", wtf.data.EventFlag.BUILTIN), beginTimeRange:wtf.trace.events.createInstance("wtf.timeRange#begin(uint32 id, ascii name, any value)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL), endTimeRange:wtf.trace.events.createInstance("wtf.timeRange#end(uint32 id)", wtf.data.EventFlag.BUILTIN | wtf.data.EventFlag.INTERNAL)};
// Input 158
wtf.trace.Scope = function() {
  this.flow_ = null;
  this.stackDepth_ = 0;
};
wtf.trace.Scope.pool_ = {unusedScopes:[], unusedIndex:0, currentDepth:-1, stack:[]};
wtf.trace.Scope.enterTyped = function(a) {
  a = wtf.trace.Scope.pool_;
  var b;
  b = a.unusedIndex ? a.unusedScopes[--a.unusedIndex] : new wtf.trace.Scope;
  b.stackDepth_ = ++a.currentDepth;
  return a.stack[b.stackDepth_] = b;
};
wtf.trace.Scope.leave = function(a, b, c) {
  if (!a) {
    return b;
  }
  c = c || wtf.now();
  for (var d = wtf.trace.Scope.pool_;d.currentDepth > a.stackDepth_;) {
    wtf.trace.Scope.leave(d.stack[d.currentDepth], void 0, c);
  }
  d.currentDepth--;
  d.stack[a.stackDepth_] = null;
  wtf.trace.BuiltinEvents.leaveScope(c);
  d.unusedScopes[d.unusedIndex++] = a;
  a.flow_ = null;
  return b;
};
wtf.trace.Scope.getCurrentFlow = function() {
  for (var a = wtf.trace.Scope.pool_, b = a.currentDepth;0 < b;) {
    var c = a.stack[b--];
    if (c && c.flow_) {
      return c.flow_;
    }
  }
  return null;
};
wtf.trace.Scope.setCurrentFlow = function(a) {
  var b = wtf.trace.Scope.pool_;
  if (b = b.stack[b.currentDepth]) {
    b.flow_ = a;
  }
};
// Input 159
wtf.trace.Flow = function(a) {
  this.terminated_ = !1;
  this.flowId_ = a ? a : wtf.trace.Flow.generateId_();
};
wtf.trace.Flow.INVALID_ID = 0;
wtf.trace.Flow.nextId_ = 1;
(function() {
  goog.isDef(goog.global.WTF_WORKER_ID) && (wtf.trace.Flow.nextId_ = ((goog.global.WTF_WORKER_ID + 1 & 15) << 27) + 1);
})();
wtf.trace.Flow.generateId_ = function() {
  return wtf.trace.Flow.nextId_++;
};
wtf.trace.Flow.prototype.getId = function() {
  return this.flowId_;
};
wtf.trace.Flow.branch = function(a, b, c, d) {
  (c = c || wtf.trace.Scope.getCurrentFlow()) && c.terminated_ && (c = null);
  var e = new wtf.trace.Flow;
  wtf.trace.BuiltinEvents.branchFlow(e, c, a, b, d);
  return e;
};
wtf.trace.Flow.extend = function(a, b, c, d) {
  a && !a.terminated_ && (wtf.trace.Scope.setCurrentFlow(a), wtf.trace.BuiltinEvents.extendFlow(a, b, c, d));
};
wtf.trace.Flow.terminate = function(a, b, c) {
  a && !a.terminated_ && (a.terminated_ = !0, wtf.trace.BuiltinEvents.terminateFlow(a, b, c));
};
wtf.trace.Flow.clear = function() {
  wtf.trace.Scope.setCurrentFlow(null);
};
wtf.trace.Flow.span = function(a) {
  return new wtf.trace.Flow(a);
};
goog.exportProperty(wtf.trace.Flow.prototype, "getId", wtf.trace.Flow.prototype.getId);
// Input 160
wtf.trace.Zone = function(a, b, c, d, e) {
  this.id = a;
  this.timestamp = b;
  this.name = c;
  this.type = d;
  this.location = e;
};
// Input 161
wtf.trace.Session = function(a, b, c) {
  goog.Disposable.call(this);
  this.traceManager_ = a;
  this.options_ = b;
  this.metadata_ = {};
  this.maximumMemoryUsage = this.options_.getNumber("wtf.trace.session.maximumMemoryUsage", wtf.trace.Session.DEFAULT_MAX_MEMORY_USAGE_);
  this.bufferSize = this.options_.getNumber("wtf.trace.session.bufferSize", c);
  this.currentBufferView_ = this.currentChunk = null;
  this.hasDiscontinuity_ = !1;
};
goog.inherits(wtf.trace.Session, goog.Disposable);
wtf.trace.Session.DEFAULT_MAX_MEMORY_USAGE_ = goog.userAgent.MOBILE ? 16777216 : 536870912;
wtf.trace.Session.prototype.disposeInternal = function() {
  this.currentChunk && (this.retireChunk(this.currentChunk), this.currentBufferView_ = this.currentChunk = null);
  wtf.trace.Session.superClass_.disposeInternal.call(this);
};
wtf.trace.Session.prototype.getTraceManager = function() {
  return this.traceManager_;
};
wtf.trace.Session.prototype.getOptions = function() {
  return this.options_;
};
wtf.trace.Session.prototype.getMetadata = function() {
  return this.metadata_;
};
wtf.trace.Session.prototype.startInternal = function() {
  goog.asserts.assert(!this.currentChunk);
  this.currentChunk = this.nextChunk();
  this.currentBufferView_ = this.currentChunk.getBinaryBuffer();
};
wtf.trace.Session.prototype.acquireBuffer = function(a, b) {
  var c = this.currentBufferView_;
  if (c && c.capacity - c.offset >= b) {
    return c;
  }
  if (b > this.bufferSize) {
    return null;
  }
  this.currentChunk && (this.retireChunk(this.currentChunk), this.currentBufferView_ = this.currentChunk = null);
  c = this.currentBufferView_ = (this.currentChunk = this.nextChunk()) ? this.currentChunk.getBinaryBuffer() : null;
  c ? this.hasDiscontinuity_ && (this.hasDiscontinuity_ = !1, wtf.trace.BuiltinEvents.discontinuity(a, c)) : this.hasDiscontinuity_ = !0;
  if (c) {
    var d = this.traceManager_.getCurrentZone();
    d && wtf.trace.BuiltinEvents.setZone(d.id, a, c);
    if (b > c.capacity - c.offset) {
      return null;
    }
  }
  return c;
};
wtf.trace.Session.prototype.enterTypedScope = wtf.trace.Scope.enterTyped;
goog.exportProperty(wtf.trace.Session.prototype, "acquireBuffer", wtf.trace.Session.prototype.acquireBuffer);
goog.exportProperty(wtf.trace.Session.prototype, "enterTypedScope", wtf.trace.Session.prototype.enterTypedScope);
// Input 162
wtf.trace.sessions = {};
wtf.trace.sessions.SnapshottingSession = function(a, b) {
  wtf.trace.Session.call(this, a, b, wtf.trace.sessions.SnapshottingSession.DEFAULT_BUFFER_SIZE_);
  var c = Math.max(1, Math.floor(this.maximumMemoryUsage / this.bufferSize));
  this.resetOnSnapshot_ = b.getBoolean("wtf.trace.snapshotting.resetOnSnapshot", !1);
  this.chunks_ = Array(c);
  this.dirtyChunks_ = Array(c);
  for (var d = 0;d < c;d++) {
    this.chunks_[d] = null, this.dirtyChunks_[d] = !1;
  }
  this.nextChunkIndex_ = 0;
  this.startInternal();
};
goog.inherits(wtf.trace.sessions.SnapshottingSession, wtf.trace.Session);
wtf.trace.sessions.SnapshottingSession.prototype.disposeInternal = function() {
  this.chunks_ = [];
  wtf.trace.sessions.SnapshottingSession.superClass_.disposeInternal.call(this);
};
wtf.trace.sessions.SnapshottingSession.DEFAULT_BUFFER_SIZE_ = 1048576;
wtf.trace.sessions.SnapshottingSession.SNAPSHOT_INIT_BUFFER_SIZE_ = 524288;
wtf.trace.sessions.SnapshottingSession.prototype.reset = function() {
  for (var a = 0;a < this.chunks_.length;a++) {
    this.chunks_[a] && this.chunks_[a].reset(), this.dirtyChunks_[a] = !1;
  }
};
wtf.trace.sessions.SnapshottingSession.prototype.snapshot = function(a) {
  var b = this.currentChunk;
  this.currentChunk && (this.retireChunk(this.currentChunk), this.currentChunk = null);
  this.beginWriteSnapshot_(a);
  this.writeEventData_(a);
  this.endWriteSnapshot_(a);
  this.currentChunk = b;
  return!0;
};
wtf.trace.sessions.SnapshottingSession.prototype.beginWriteSnapshot_ = function(a) {
  var b = new wtf.io.cff.chunks.FileHeaderChunk;
  b.init();
  a.writeChunk(b);
  b = new wtf.io.cff.chunks.EventDataChunk;
  b.init(wtf.trace.sessions.SnapshottingSession.SNAPSHOT_INIT_BUFFER_SIZE_);
  var c = this.getTraceManager();
  c.writeEventHeader(b.getBinaryBuffer(), !1);
  c.appendAllZones(b.getBinaryBuffer());
  a.writeChunk(b);
};
wtf.trace.sessions.SnapshottingSession.prototype.writeEventData_ = function(a) {
  for (var b = 0;b < this.chunks_.length;b++) {
    var c = (this.nextChunkIndex_ + b) % this.chunks_.length, d = this.chunks_[c];
    if (d) {
      var e = d.getBinaryBuffer(), f = this.dirtyChunks_[c];
      this.resetOnSnapshot_ && (this.dirtyChunks_[c] = !1);
      f && e.offset && a.writeChunk(d);
    }
  }
};
wtf.trace.sessions.SnapshottingSession.prototype.endWriteSnapshot_ = function(a) {
  a.end();
};
wtf.trace.sessions.SnapshottingSession.prototype.nextChunk = function() {
  var a = this.chunks_[this.nextChunkIndex_];
  a || (a = new wtf.io.cff.chunks.EventDataChunk, a.init(this.bufferSize), this.chunks_[this.nextChunkIndex_] = a);
  var b = a.getBinaryBuffer();
  this.dirtyChunks_[this.nextChunkIndex_] = !1;
  wtf.io.BufferView.reset(b);
  this.nextChunkIndex_ = (this.nextChunkIndex_ + 1) % this.chunks_.length;
  return a;
};
wtf.trace.sessions.SnapshottingSession.prototype.retireChunk = function(a) {
  a = this.nextChunkIndex_ - 1;
  0 > a && (a = this.chunks_.length + a);
  this.dirtyChunks_[a] = !0;
};
// Input 163
wtf.util.Options = function() {
  wtf.events.EventEmitter.call(this);
  this.obj_ = {};
  this.changingDepth_ = 0;
  this.changedKeys_ = {};
};
goog.inherits(wtf.util.Options, wtf.events.EventEmitter);
wtf.util.Options.EventType = {CHANGED:goog.events.getUniqueId("changed")};
wtf.util.Options.prototype.load = function(a) {
  var b;
  try {
    b = goog.global.JSON.parse(a);
  } catch (c) {
    return!1;
  }
  goog.isObject(b) && this.mixin(b);
  return!0;
};
wtf.util.Options.prototype.save = function() {
  return goog.global.JSON.stringify(this.obj_);
};
wtf.util.Options.prototype.clear = function() {
  this.beginChanging();
  for (var a in this.obj_) {
    this.changedKeys_[a] = !0;
  }
  this.obj_ = {};
  this.endChanging();
};
wtf.util.Options.prototype.clone = function() {
  var a = new wtf.util.Options;
  a.mixin(this.obj_);
  return a;
};
wtf.util.Options.prototype.getValues = function() {
  return goog.object.unsafeClone(this.obj_);
};
wtf.util.Options.prototype.beginChanging = function() {
  this.changingDepth_++;
};
wtf.util.Options.prototype.endChanging = function() {
  this.changingDepth_--;
  if (!this.changingDepth_) {
    var a = [], b;
    for (b in this.changedKeys_) {
      a.push(b);
    }
    this.changedKeys_ = {};
    a.length && this.emitEvent(wtf.util.Options.EventType.CHANGED, a);
  }
};
wtf.util.Options.prototype.mixin = function(a) {
  if (a) {
    this.beginChanging();
    for (var b in a) {
      if (a.hasOwnProperty(b) && this.obj_[b] !== a[b]) {
        if (goog.isArray(a[b])) {
          for (var c = this.obj_[b] || [], d = a[b], e = 0;e < d.length;e++) {
            goog.array.insert(c, d[e]);
          }
          this.obj_[b] = c;
        } else {
          this.obj_[b] = a[b];
        }
        this.changedKeys_[b] = !0;
      }
    }
    this.endChanging();
  }
};
wtf.util.Options.prototype.setValue = function(a, b) {
  this.obj_[a] !== b && (this.beginChanging(), void 0 !== b ? this.obj_[a] = b : delete this.obj_[a], this.changedKeys_[a] = !0, this.endChanging());
};
wtf.util.Options.prototype.getBoolean = function(a, b) {
  var c = this.obj_[a];
  void 0 === c ? c = b : goog.asserts.assert(goog.isBoolean(c));
  return c;
};
wtf.util.Options.prototype.getOptionalBoolean = function(a, b) {
  var c = this.obj_[a];
  void 0 === c ? c = b : goog.asserts.assert(goog.isBoolean(c));
  return c;
};
wtf.util.Options.prototype.setBoolean = function(a, b) {
  this.setValue(a, b);
};
wtf.util.Options.prototype.getNumber = function(a, b) {
  var c = this.obj_[a];
  void 0 === c ? c = b : (!0 === c ? c = 1 : !1 === c && (c = 0), goog.asserts.assert(goog.isNumber(c)));
  return c;
};
wtf.util.Options.prototype.getOptionalNumber = function(a, b) {
  var c = this.obj_[a];
  void 0 === c ? c = b : goog.asserts.assert(goog.isNumber(c));
  return c;
};
wtf.util.Options.prototype.setNumber = function(a, b) {
  this.setValue(a, b);
};
wtf.util.Options.prototype.getString = function(a, b) {
  var c = this.obj_[a];
  void 0 === c ? c = b : goog.asserts.assert(goog.isString(c));
  return c;
};
wtf.util.Options.prototype.getOptionalString = function(a, b) {
  var c = this.obj_[a];
  void 0 === c ? c = b : goog.asserts.assert(goog.isString(c));
  return c;
};
wtf.util.Options.prototype.setString = function(a, b) {
  this.setValue(a, b);
};
wtf.util.Options.prototype.getArray = function(a, b) {
  var c = this.obj_[a];
  void 0 === c ? c = b : goog.asserts.assert(goog.isArray(c));
  return c.slice();
};
wtf.util.Options.prototype.getOptionalArray = function(a, b) {
  var c = this.obj_[a];
  void 0 === c ? c = b : goog.asserts.assert(goog.isArray(c));
  return c ? c.slice() : c;
};
wtf.util.Options.prototype.addArrayValue = function(a, b) {
  var c = this.getArray(a, []);
  goog.array.contains(c, b) || (c.push(b), this.setValue(a, c));
};
wtf.util.Options.prototype.removeArrayValue = function(a, b) {
  var c = this.getArray(a, []);
  goog.array.remove(c, b) && this.setValue(a, c.length ? c : void 0);
};
// Input 164
wtf.trace.ISessionListener = function() {
};
wtf.trace.ISessionListener.prototype.sessionStarted = goog.nullFunction;
wtf.trace.ISessionListener.prototype.sessionStopped = goog.nullFunction;
wtf.trace.ISessionListener.prototype.requestSnapshots = goog.nullFunction;
wtf.trace.ISessionListener.prototype.reset = goog.nullFunction;
wtf.trace.TraceManager = function(a) {
  goog.Disposable.call(this);
  var b = new wtf.util.Options;
  b.mixin(a);
  if (goog.global.localStorage) {
    if (b.getOptionalBoolean("wtf.injector", !1)) {
      goog.global.localStorage.removeItem("__wtf_options__");
    } else {
      var c = goog.global.localStorage.getItem("__wtf_options__");
      c && b.load(c);
    }
  }
  for (var c = "wtf.injector wtf.hud.app.mode wtf.hud.app.endpoint wtf.addons wtf.trace.provider.chromeDebug.present wtf.trace.provider.chromeDebug.tracing wtf.trace.provider.firefoxDebug.present".split(" "), d = 0;d < c.length;d++) {
    var e = c[d];
    b.setValue(e, a ? a[e] : void 0);
  }
  b.mixin(goog.global.wtf_trace_options);
  b.mixin(goog.global.wtf_hud_options);
  this.options_ = b;
  this.listeners_ = [];
  this.providers_ = [];
  this.nextZoneId_ = 1;
  this.zoneStack_ = [];
  this.allZones_ = {};
  this.currentSession_ = null;
  wtf.trace.EventRegistry.getShared().addListener(wtf.trace.EventRegistry.EventType.EVENT_TYPE_REGISTERED, this.eventTypeRegistered_, this);
  a = this.createZone("Script", wtf.data.ZoneType.SCRIPT, wtf.NODE ? goog.global.process.argv[1] : goog.global.location.href);
  this.pushZone(a);
};
goog.inherits(wtf.trace.TraceManager, goog.Disposable);
wtf.trace.TraceManager.prototype.disposeInternal = function() {
  this.stopSession();
  goog.disposeAll(this.providers_);
  this.providers_.length = 0;
  wtf.trace.TraceManager.superClass_.disposeInternal.call(this);
};
wtf.trace.TraceManager.prototype.getOptions = function(a) {
  var b = this.options_.clone();
  b.mixin(a);
  return b;
};
wtf.trace.TraceManager.prototype.detectContextInfo = function() {
  return wtf.data.ContextInfo.detect();
};
wtf.trace.TraceManager.prototype.addListener = function(a) {
  this.listeners_.push(a);
  this.currentSession_ && a.sessionStarted(this.currentSession_);
};
wtf.trace.TraceManager.prototype.addProvider = function(a) {
  this.providers_.push(a);
};
wtf.trace.TraceManager.prototype.getProviders = function() {
  return this.providers_;
};
wtf.trace.TraceManager.prototype.createZone = function(a, b, c) {
  a = new wtf.trace.Zone(this.nextZoneId_++, wtf.now(), a, b, c);
  this.allZones_[a.id] = a;
  wtf.trace.BuiltinEvents.createZone(a.id, a.name, a.type, a.location, a.timestamp);
  return a;
};
wtf.trace.TraceManager.prototype.deleteZone = function(a) {
  goog.asserts.assert(!goog.array.contains(this.zoneStack_, a));
  wtf.trace.BuiltinEvents.deleteZone(a.id);
};
wtf.trace.TraceManager.prototype.appendAllZones = function(a) {
  for (var b in this.allZones_) {
    var c = this.allZones_[b];
    wtf.trace.BuiltinEvents.createZone(c.id, c.name, c.type, c.location, 0, a);
  }
  (b = this.getCurrentZone()) && wtf.trace.BuiltinEvents.setZone(b.id, 0, a);
};
wtf.trace.TraceManager.prototype.pushZone = function(a) {
  this.zoneStack_.push(a);
  wtf.trace.BuiltinEvents.setZone(a.id);
};
wtf.trace.TraceManager.prototype.popZone = function() {
  goog.asserts.assert(this.zoneStack_.length);
  this.zoneStack_.pop();
  var a = this.getCurrentZone();
  wtf.trace.BuiltinEvents.setZone(a.id);
};
wtf.trace.TraceManager.prototype.getCurrentZone = function() {
  return this.zoneStack_.length ? this.zoneStack_[this.zoneStack_.length - 1] : null;
};
wtf.trace.TraceManager.prototype.getCurrentSession = function() {
  return this.currentSession_;
};
wtf.trace.TraceManager.prototype.startSession = function(a) {
  goog.asserts.assert(!this.currentSession_);
  this.currentSession_ = a;
  var b = wtf.trace.EventRegistry.getShared(), c = b.getEventSessionContext();
  wtf.trace.EventSessionContext.init(c, a);
  a = b.getEventTypes();
  for (b = 0;b < a.length;b++) {
    a[b].count = 0;
  }
  if (this.currentSession_) {
    for (b = 0;b < this.listeners_.length;b++) {
      this.listeners_[b].sessionStarted(this.currentSession_);
    }
  }
};
wtf.trace.TraceManager.prototype.stopSession = function() {
  if (this.currentSession_) {
    for (var a = 0;a < this.listeners_.length;a++) {
      this.listeners_[a].sessionStopped(this.currentSession_);
    }
  }
  goog.dispose(this.currentSession_);
  this.currentSession_ = null;
  a = wtf.trace.EventRegistry.getShared().getEventSessionContext();
  wtf.trace.EventSessionContext.init(a, null);
};
wtf.trace.TraceManager.prototype.requestSnapshots = function(a, b) {
  function c() {
    goog.dispose(k);
    goog.dispose(g);
    a.call(b, f.length ? f : null);
  }
  function d(a) {
    m && (a && f.push(a), m--, m || c());
  }
  var e = this.currentSession_;
  if (e && e instanceof wtf.trace.sessions.SnapshottingSession) {
    var f = [], g = new wtf.io.transports.MemoryWriteTransport;
    g.setTargetArray(f);
    var k = new wtf.io.cff.BinaryStreamTarget(g);
    e.snapshot(k);
    for (var m = 0, l = 0;l < this.listeners_.length;l++) {
      var p = this.listeners_[l].requestSnapshots(e, d);
      void 0 !== p && (m += p);
    }
    m || wtf.timing.setImmediate(function() {
      c();
    });
  } else {
    wtf.timing.setImmediate(function() {
      a.call(b, null);
    });
  }
};
wtf.trace.TraceManager.prototype.reset = function() {
  var a = this.getCurrentSession();
  a instanceof wtf.trace.sessions.SnapshottingSession && a.reset();
  for (a = 0;a < this.listeners_.length;a++) {
    this.listeners_[a].reset();
  }
};
wtf.trace.TraceManager.prototype.eventTypeRegistered_ = function(a) {
  this.currentSession_ && wtf.trace.BuiltinEvents.defineEvent(a.wireId, a.eventClass, a.flags, a.name, a.getArgString());
};
wtf.trace.TraceManager.prototype.writeEventHeader = function(a, b) {
  for (var c = wtf.trace.EventRegistry.getShared().getEventTypes(), d = 0;d < c.length;d++) {
    var e = c[d];
    (b || e.flags & wtf.data.EventFlag.BUILTIN || e.count) && wtf.trace.BuiltinEvents.defineEvent(e.wireId, e.eventClass, e.flags, e.name, e.getArgString(), void 0, a);
  }
  return!0;
};
wtf.trace.TraceManager.sharedInstance_ = null;
wtf.trace.TraceManager.getSharedInstance = function() {
  return wtf.trace.TraceManager.sharedInstance_;
};
wtf.trace.TraceManager.setSharedInstance = function(a) {
  wtf.trace.TraceManager.sharedInstance_ = a;
};
// Input 165
wtf.data.webidl = {};
wtf.data.webidl.EVENT_TYPES = {Event:{attributes:{target:"dompath", timeStamp:"uint32"}}, CloseEvent:{inherits:"Event", attributes:{wasClean:"bool", code:"int16", reason:"utf8"}}, ErrorEvent:{inherits:"Event", attributes:{message:"utf8", filename:"utf8", lineno:"uint32"}}, ProgressEvent:{inherits:"Event", attributes:{lengthComputable:"bool", loaded:"uint32", total:"uint32"}}, UIEvent:{inherits:"Event", attributes:{detail:"any", keyCode:"int32", charCode:"int32", layerX:"int32", layerY:"int32", pageX:"int32", 
pageY:"int32", which:"int32"}}, FocusEvent:{inherits:"UIEvent", attributes:{relatedTarget:"dompath"}}, KeyboardEvent:{inherits:"UIEvent", attributes:{keyIdentifier:"utf8", keyLocation:"uint32", ctrlKey:"bool", shiftKey:"bool", altKey:"bool", metaKey:"bool", altGraphKey:"bool"}}, MouseEvent:{inherits:"UIEvent", attributes:{screenX:"int32", screenY:"int32", clientX:"int32", clientY:"int32", ctrlKey:"bool", shiftKey:"bool", altKey:"bool", metaKey:"bool", button:"uint16", relatedTarget:"dompath", webkitMovementX:"int32", 
webkitMovementY:"int32", offsetX:"int32", offsetY:"int32", x:"int32", y:"int32"}}, WheelEvent:{inherits:"MouseEvent", attributes:{deltaX:"float32", deltaY:"float32", deltaZ:"float32", deltaMode:"uint32", wheelDelta:"int32", webkitDirectionInvertedFromDevice:"bool"}}, XMLHttpRequestProgressEvent:{inherits:"ProgressEvent", attributes:{position:"uint32", totalSize:"uint32"}}, MessageEvent:{inherits:"Event", attributes:{}}};
wtf.data.webidl.OBJECTS = {Element:{events:{abort:null, blur:"FocusEvent", change:null, click:"MouseEvent", contextmenu:null, dblclick:"MouseEvent", drag:null, dragend:null, dragenter:null, dragleave:null, dragover:null, dragstart:null, drop:null, error:"ErrorEvent", focus:"FocusEvent", input:null, invalid:null, keydown:"KeyboardEvent", keypress:"KeyboardEvent", keyup:"KeyboardEvent", load:null, mousedown:"MouseEvent", mousemove:"MouseEvent", mouseout:"MouseEvent", mouseover:"MouseEvent", mouseup:"MouseEvent", 
mousewheel:"WheelEvent", wheel:"WheelEvent", readystatechange:null, scroll:null, select:null, submit:null, animationstart:null, animationend:null, animationiteration:null, transitionend:null, selectstart:null, touchstart:null, touchmove:null, touchend:null, touchcancel:null, webkitfullscreenchange:null, webkitfullscreenerror:null, DOMMouseScroll:"UIEvent"}}, Window:{inherits:"Element", events:{beforeunload:null, change:null, hashchange:null, message:null, offline:null, online:null, pagehide:null, 
pageshow:null, popstate:null, resize:null, unload:null}}, Document:{inherits:"Element", events:{DOMContentLoaded:null, webkitpointerlockchange:null, webkitpointerlockerror:null}}, HTMLElement:{inherits:"Element"}, HTMLAnchorElement:{tagName:"a", inherits:"HTMLElement"}, HTMLCanvasElement:{tagName:"canvas", inherits:"HTMLElement"}, HTMLDivElement:{tagName:"div", inherits:"HTMLElement"}, XMLHttpRequest:{events:{abort:"XMLHttpRequestProgressEvent", error:"XMLHttpRequestProgressEvent", load:"XMLHttpRequestProgressEvent", 
loadend:"XMLHttpRequestProgressEvent", loadstart:"XMLHttpRequestProgressEvent", progress:"XMLHttpRequestProgressEvent", timeout:"XMLHttpRequestProgressEvent", readystatechange:"XMLHttpRequestProgressEvent"}}, MessagePort:{events:{message:"MessageEvent"}}, WebSocket:{events:{open:"Event", error:"Event", close:"CloseEvent", message:"Event"}}};
wtf.data.webidl.DOM_OBJECTS = "HTMLAnchorElement HTMLAppletElement HTMLAreaElement HTMLAudioElement HTMLBRElement HTMLBaseElement HTMLBaseFontElement HTMLBodyElement HTMLButtonElement HTMLCanvasElement HTMLContentElement HTMLDListElement HTMLDirectoryElement HTMLDivElement HTMLDocument HTMLElement HTMLEmbedElement HTMLFieldSetElement HTMLFontElement HTMLFormElement HTMLFrameElement HTMLFrameSetElement HTMLHRElement HTMLHeadElement HTMLHeadingElement HTMLHtmlElement HTMLIFrameElement HTMLImageElement HTMLInputElement HTMLKeygenElement HTMLLIElement HTMLLabelElement HTMLLegendElement HTMLLinkElement HTMLMapElement HTMLMarqueeElement HTMLMediaElement HTMLMenuElement HTMLMetaElement HTMLMeterElement HTMLModElement HTMLOListElement HTMLObjectElement HTMLOptGroupElement HTMLOptionElement HTMLOutputElement HTMLParagraphElement HTMLPreElement HTMLProgressElement HTMLQuoteElement HTMLScriptElement HTMLSelectElement HTMLSourceElement HTMLSpanElement HTMLStyleElement HTMLTableCaptionElement HTMLTableCellElement HTMLTableColElement HTMLTableElement HTMLTableRowElement HTMLTableSectionElement HTMLTextAreaElement HTMLTitleElement HTMLTrackElement HTMLUListElement HTMLUnknownElement HTMLVideoElement".split(" ");
wtf.data.webidl.getAllEventTypes = function(a) {
  for (var b = {}, c = 0;c < a.length;c++) {
    var d = wtf.data.webidl.getAllEvents(a[c]), e;
    for (e in d) {
      var f = b[e];
      f && f != d[e] ? goog.asserts.fail("Redefined event type/duplicate keys") : b[e] = d[e];
    }
  }
  return b;
};
wtf.data.webidl.getAllEvents = function(a, b) {
  for (var c = wtf.data.webidl.EVENT_TYPES.Event, d = {}, e = a;;) {
    var f = wtf.data.webidl.OBJECTS[e];
    if (!f) {
      break;
    }
    var e = f.inherits, g;
    for (g in f.events) {
      d[g] = wtf.data.webidl.EVENT_TYPES[f.events[g]] || c;
    }
  }
  if (b) {
    for (e = 0;e < b.length;e++) {
      f = b[e], d[f] || (d[f] = c);
    }
  }
  return d;
};
wtf.data.webidl.getEventAttributes = function(a) {
  for (var b = [a];a.inherits;) {
    a = wtf.data.webidl.EVENT_TYPES[a.inherits], goog.asserts.assert(a), b.push(a);
  }
  a = {};
  for (var c = [], d = b.length - 1;0 <= d;d--) {
    var e = b[d].attributes, f;
    for (f in e) {
      var g = e[f];
      a[f] || (a[f] = !0, c.push({name:f, type:g}));
    }
  }
  return c;
};
wtf.data.webidl.getEventSignature = function(a, b, c, d) {
  a = a + "#" + b + (d ? d : "") + "(";
  if (c) {
    for (c = wtf.data.webidl.getEventAttributes(c), b = 0;b < c.length;b++) {
      d = c[b];
      var e = d.type;
      switch(e) {
        case "dompath":
          e = "ascii";
      }
      b && (a += ", ");
      a += e + " " + d.name;
    }
  }
  return a + ")";
};
// Input 166
wtf.trace.eventtarget = {};
wtf.trace.eventtarget.DEFINE_SUPPORT = function() {
  if (!goog.global.document) {
    return{available:!1, needsDelete:!1};
  }
  var a = !1, b = !1;
  try {
    var c = goog.global.HTMLHeadElement.prototype, d = 123;
    Object.defineProperty(c, "onmousemove", {configurable:!0, enumerable:!0, get:function() {
      return d;
    }, set:function(a) {
      d = a;
    }});
    var e = document.createElement("head");
    e.onmousemove = 456;
    456 == e.onmousemove && 456 == d && (a = !0);
    a || (delete e.onmousemove, e.onmousemove = 456, 456 == e.onmousemove && 456 == d && (b = a = !0));
    delete c.onmousemove;
  } catch (f) {
  }
  return{available:a, needsDelete:b};
}();
wtf.trace.eventtarget.getEventNames = function(a) {
  if (!Object.getOwnPropertyNames) {
    return[];
  }
  for (var b = [], c = !1;;) {
    for (var d = Object.getOwnPropertyNames(a), e = 0;e < d.length;e++) {
      var f = d[e];
      "onmousedown" == f && (c = !0);
      0 == f.indexOf("on") && f.toLowerCase() == f && (f = f.substr(2), b.push(f));
    }
    a = Object.getPrototypeOf(a);
    if (!a || a == Object.prototype) {
      break;
    }
  }
  goog.userAgent.GECKO && c && b.push("DOMMouseScroll");
  return b;
};
wtf.trace.eventtarget.createDescriptor = function(a, b) {
  var c = {}, d = [], e = [], f;
  for (f in b) {
    var g = b[f];
    d.push(f);
    g = wtf.data.webidl.getEventSignature(a, f, g);
    g = wtf.trace.events.createScope(g);
    c[f] = g;
    var k = "__wtf_event_value_" + f;
    e.push({name:f, scopeEvent:g, getter:function(a) {
      return function() {
        return this[a];
      };
    }(k), setter:function(a, b) {
      return function(c) {
        var d = this[a];
        d && this.removeEventListener(b, d, !1);
        c && this.addEventListener(b, c, !1);
        this[a] = c;
      };
    }(k, f)});
  }
  return{prefix:a, eventTypes:b, eventNames:d, eventMap:c, eventInfos:e};
};
wtf.trace.eventtarget.getDescriptor = function(a) {
  return a.__wtf_eventtarget_descriptor__ || null;
};
wtf.trace.eventtarget.setDescriptor = function(a, b) {
  a.__wtf_eventtarget_descriptor__ = b;
};
wtf.trace.eventtarget.mixin = function(a, b) {
  var c = b.addEventListener;
  b.addEventListener = function(b, d, g) {
    var k = this || goog.global, m = a.eventMap[b];
    if (!m || k.__wtf_ignore__ || d.__wtf_ignore__) {
      c.call(k, b, d, g);
    } else {
      var l = function(a) {
        if (!a.__wtf_ignore__) {
          var b = k.__wtf_ignore__ ? null : m();
          try {
            if (d.handleEvent) {
              d.handleEvent(a);
            } else {
              return d.apply(k, arguments);
            }
          } finally {
            wtf.trace.Scope.leave(b);
          }
        }
      };
      d.__wrapped__ = l;
      c.call(k, b, l, g);
    }
  };
  var d = b.removeEventListener;
  b.removeEventListener = function(a, b, c) {
    var k = this || goog.global;
    b && b.__wrapped__ && (b = b.__wrapped__);
    d.call(k, a, b, c);
  };
};
wtf.trace.eventtarget.setEventProperties = function(a, b) {
  if (wtf.trace.eventtarget.DEFINE_SUPPORT.available) {
    for (var c = a.eventInfos, d = 0;d < c.length;d++) {
      var e = c[d];
      try {
        Object.defineProperty(b, "on" + e.name, {configurable:!0, enumerable:!0, get:e.getter, set:e.setter});
      } catch (f) {
        goog.DEBUG && goog.global.console.log("Unable to define property " + e.name + " on " + a.prefix);
      }
    }
  }
};
wtf.trace.eventtarget.initializeEventProperties = function(a) {
  if (!wtf.trace.eventtarget.DEFINE_SUPPORT.available || !wtf.trace.eventtarget.DEFINE_SUPPORT.needsDelete) {
    return!1;
  }
  var b = wtf.trace.eventtarget.getDescriptor(a);
  if (b) {
    for (var b = b.eventNames, c = 0;c < b.length;c++) {
      var d = "on" + b[c], e = a[d];
      a[d] = null;
      delete a[d];
      e && (a[d] = e);
    }
    return!0;
  }
  return!1;
};
wtf.trace.eventtarget.initializeDomEventProperties = function(a, b) {
  if (!a.__wtf_ignore__ && wtf.trace.eventtarget.initializeEventProperties(a) && b) {
    for (var c = a.getElementsByTagName("*"), d = 0;d < c.length;d++) {
      var e = c[d];
      if (!e.__wtf_ignore__) {
        var f = wtf.trace.eventtarget.getDescriptor(e);
        if (f) {
          for (var f = f.eventNames, g = 0;g < f.length;g++) {
            var k = "on" + f[g], m = e[k];
            e[k] = null;
            delete e[k];
            m && (e[k] = m);
          }
        }
      }
    }
  }
};
wtf.trace.eventtarget.BaseEventTarget = function(a) {
  this.descriptor_ = a;
  this.registrations_ = {};
};
wtf.trace.eventtarget.BaseEventTarget.prototype.addEventListener = function(a, b, c) {
  var d = this.registrations_[a];
  d || (d = this.registrations_[a] = new wtf.trace.eventtarget.EventRegistration);
  var e = d.dom2 || [];
  d.dom2 = e;
  e.push({listener:b, capture:c || !1});
  d.handlerCount || this.beginTrackingEvent(a);
  d.handlerCount++;
};
wtf.trace.eventtarget.BaseEventTarget.prototype.removeEventListener = function(a, b, c) {
  var d = this.registrations_[a];
  if (d) {
    var e = d.dom2;
    if (e && e.length) {
      for (var f = 0;f < e.length;f++) {
        if (e[f].listener == b && e[f].capture == c) {
          e.splice(f, 1);
          break;
        }
      }
      d.handlerCount--;
      d.handlerCount || this.endTrackingEvent(a);
    }
  }
};
wtf.trace.eventtarget.BaseEventTarget.prototype.setEventHook = function(a, b, c) {
  var d = this.registrations_[a];
  d || (d = this.registrations_[a] = new wtf.trace.eventtarget.EventRegistration);
  a = d.hooks || [];
  d.hooks = a;
  a.push({callback:b, scope:c || this});
};
wtf.trace.eventtarget.BaseEventTarget.prototype.dispatchEvent = function(a) {
  if (!a.__wtf_ignore__) {
    var b = this.registrations_[a.type];
    if (b) {
      b.dom0 && this.dispatchToListener(a, b.dom0, b.hooks);
      var c = b.dom2;
      if (c) {
        for (var d = 0;d < c.length;d++) {
          this.dispatchToListener(a, c[d].listener, b.hooks);
        }
      }
    }
  }
};
wtf.trace.eventtarget.BaseEventTarget.prototype.dispatchToListener = function(a, b, c) {
  if (!a.__wtf_ignore__) {
    var d = this.descriptor_.eventMap[a.type], d = this.__wtf_ignore__ ? null : d ? d() : null;
    if (c && c.length) {
      for (var e = 0;e < c.length;e++) {
        c[e].callback.call(c[e].scope, a);
      }
    }
    try {
      b.handleEvent ? b.handleEvent(a) : b.call(this, a);
    } finally {
      wtf.trace.Scope.leave(d);
    }
  }
};
wtf.trace.eventtarget.EventRegistration = function() {
  this.handlerCount = 0;
  this.hooks = this.dom2 = this.dom0 = null;
};
// Input 167
wtf.trace.sessions.NullSession = function(a, b) {
  wtf.trace.Session.call(this, a, b, 0);
};
goog.inherits(wtf.trace.sessions.NullSession, wtf.trace.Session);
wtf.trace.sessions.NullSession.prototype.nextChunk = function() {
  return null;
};
wtf.trace.sessions.NullSession.prototype.retireChunk = goog.nullFunction;
// Input 168
wtf.trace.util = {};
wtf.trace.util.dateNow = function() {
  return Date.now.raw || Date.now;
}();
wtf.trace.util.getScriptUrl = function() {
  if (goog.global.WTF_TRACE_SCRIPT_URL) {
    return goog.global.WTF_TRACE_SCRIPT_URL;
  }
  if (!wtf.NODE) {
    if (!goog.global.document) {
      return null;
    }
    for (var a = goog.dom.getElementsByTagNameAndClass(goog.dom.TagName.SCRIPT), b = 0;b < a.length;b++) {
      var c = a[b];
      if (goog.string.contains(c.src, "wtf_trace_web_js_compiled.js")) {
        return c.src;
      }
    }
  }
  return null;
};
wtf.trace.util.ignoreListener = function(a) {
  a.__wtf_ignore__ = !0;
  return a;
};
wtf.trace.util.ignoreDomTree = function(a) {
  a.__wtf_ignore__ = !0;
  a = a.getElementsByTagName("*");
  for (var b = 0;b < a.length;b++) {
    a[b].__wtf_ignore__ = !0;
  }
};
wtf.trace.util.ignoreEvent = function(a) {
  a.__wtf_ignore__ = !0;
};
// Input 169
wtf.trace.API_VERSION = 2;
wtf.trace.getTraceManager = function() {
  var a = wtf.trace.TraceManager.getSharedInstance();
  goog.asserts.assert(a);
  if (!a) {
    throw "wtf.trace.prepare not called";
  }
  return a;
};
wtf.trace.shutdown = function() {
  var a = wtf.trace.TraceManager.getSharedInstance();
  a && (wtf.trace.stop(), goog.dispose(a), wtf.trace.TraceManager.setSharedInstance(null));
};
wtf.trace.addSessionListener = function(a) {
  wtf.trace.getTraceManager().addListener(a);
};
wtf.trace.getTraceFilename = function(a) {
  var b = a || "";
  if (goog.string.startsWith(b, "file://") && -1 != b.indexOf(".")) {
    return b.replace("file://", "");
  }
  a = wtf.trace.getTraceManager().detectContextInfo();
  b.length ? "file://" != b && (b += "-") : b = "file://";
  return wtf.io.getTimedFilename(b, a.getFilename()).replace("file://", "");
};
wtf.trace.createTransport_ = function(a, b, c) {
  a = c || a.getOptionalString("wtf.trace.target");
  if (!a || goog.isString(a) && !a.length) {
    return b = new wtf.io.transports.MemoryWriteTransport, b.needsLibraryDispose = !0, b;
  }
  if (a instanceof wtf.io.WriteTransport) {
    return b = a, b.needsLibraryDispose = !1, b;
  }
  if (goog.isObject(a) && a.write) {
    throw "Custom transport not yet supported.";
  }
  if (goog.isArray(a)) {
    return b = new wtf.io.transports.MemoryWriteTransport, b.needsLibraryDispose = !0, b.setTargetArray(a), b;
  }
  if (!goog.isString(a)) {
    throw "Invalid transport specified.";
  }
  if ("null" == a) {
    return new wtf.io.transports.NullWriteTransport;
  }
  if (goog.string.startsWith(a, "ws://")) {
    throw "WebSocket transport not yet supported.";
  }
  if (goog.string.startsWith(a, "http://") || goog.string.startsWith(a, "https://") || goog.string.startsWith(a, "//") || goog.string.startsWith(a, "http-rel:")) {
    goog.string.startsWith(a, "http-rel:") && (a = a.substring(9));
    if (b) {
      throw "Streaming XHR transport not yet supported.";
    }
    b = new wtf.io.transports.XhrWriteTransport(a, void 0, wtf.trace.getTraceFilename());
    b.needsLibraryDispose = !0;
    return b;
  }
  if (goog.string.startsWith(a, "file://")) {
    return b = wtf.trace.getTraceFilename(a), b = wtf.NODE ? new wtf.io.transports.FileWriteTransport(b) : new wtf.io.transports.BlobWriteTransport(b), b.needsLibraryDispose = !0, b;
  }
  throw "Invalid transport specified.";
};
wtf.trace.createStreamTarget_ = function(a, b) {
  if (wtf.PROD_BUILD) {
    return new wtf.io.cff.JsonStreamTarget(b, wtf.io.cff.JsonStreamTarget.Mode.COMPLETE);
  }
  if (wtf.MIN_BUILD) {
    return new wtf.io.cff.BinaryStreamTarget(b);
  }
  switch(a.getString("wtf.trace.format", "binary")) {
    default:
    ;
    case "binary":
      return new wtf.io.cff.BinaryStreamTarget(b);
    case "json":
      return new wtf.io.cff.JsonStreamTarget(b, wtf.io.cff.JsonStreamTarget.Mode.COMPLETE);
    case "partial_json":
      return new wtf.io.cff.JsonStreamTarget(b, wtf.io.cff.JsonStreamTarget.Mode.PARTIAL);
  }
};
wtf.trace.start = function(a) {
  var b = wtf.trace.getTraceManager();
  a = b.getOptions(a);
  b.stopSession();
  var c = null;
  switch(a.getOptionalString("wtf.trace.mode")) {
    case "null":
      c = new wtf.trace.sessions.NullSession(b, a);
      break;
    default:
    ;
    case "snapshot":
    ;
    case "snapshotting":
      c = new wtf.trace.sessions.SnapshottingSession(b, a);
      break;
    case "stream":
    ;
    case "streaming":
      throw Error("Streaming not yet implemented");;
  }
  goog.asserts.assert(c);
  b.startSession(c);
};
wtf.trace.snapshot = function(a) {
  var b = wtf.trace.getTraceManager().getCurrentSession();
  if (b && b instanceof wtf.trace.sessions.SnapshottingSession) {
    if (goog.isFunction(a)) {
      throw "Snapshots with custom allocator functions are no longer supported. Pass in a wtf.io.Transport instead.";
    }
    var c = b.getOptions();
    a = wtf.trace.createTransport_(c, !1, a);
    goog.asserts.assert(a);
    c = wtf.trace.createStreamTarget_(c, a);
    goog.asserts.assert(c);
    b.snapshot(c);
    goog.dispose(c);
    a.needsLibraryDispose && goog.dispose(a);
  }
};
wtf.trace.snapshotAll = function(a, b) {
  wtf.trace.getTraceManager().requestSnapshots(a, b);
};
wtf.trace.reset = function() {
  wtf.trace.getTraceManager().reset();
};
wtf.trace.stop = function() {
  wtf.trace.getTraceManager().stopSession();
};
wtf.trace.createZone = function(a, b, c) {
  return wtf.trace.getTraceManager().createZone(a, b, c);
};
wtf.trace.deleteZone = function(a) {
  wtf.trace.getTraceManager().deleteZone(a);
};
wtf.trace.pushZone = function(a) {
  wtf.trace.getTraceManager().pushZone(a);
};
wtf.trace.popZone = function() {
  wtf.trace.getTraceManager().popZone();
};
wtf.trace.enterScope = wtf.trace.BuiltinEvents.enterScope;
wtf.trace.enterTracingScope = wtf.trace.BuiltinEvents.enterTracingScope;
wtf.trace.leaveScope = wtf.trace.Scope.leave;
wtf.trace.appendScopeData = function(a, b, c) {
  var d = "any";
  "boolean" == typeof b ? d = "bool" : "number" == typeof b ? (b |= 0, d = "int32") : "string" == typeof b && (d = "utf8");
  var e = a + "_" + d, f = wtf.trace.appendScopeDataCache_[e];
  f || (f = wtf.trace.appendScopeDataCache_[e] = {count:0, emit:null});
  ++f.count == wtf.trace.APPEND_OPTIMIZATION_THRESHOLD_ && (goog.asserts.assert(!f.emit), f.emit = wtf.trace.events.createInstance("wtf.scope#appendData_" + e + "(" + d + " " + a + ")", wtf.data.EventFlag.INTERNAL | wtf.data.EventFlag.APPEND_SCOPE_DATA));
  f.emit ? f.emit(b, c) : wtf.trace.BuiltinEvents.appendScopeData(a, b, c);
};
wtf.trace.APPEND_OPTIMIZATION_THRESHOLD_ = 100;
wtf.trace.appendScopeDataCache_ = {};
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
  return d;
};
wtf.trace.endTimeRange = wtf.trace.BuiltinEvents.endTimeRange;
wtf.trace.ignoreListener = wtf.trace.util.ignoreListener;
wtf.trace.ignoreDomTree = wtf.trace.util.ignoreDomTree;
wtf.trace.initializeDomEventProperties = wtf.trace.eventtarget.initializeDomEventProperties;
// Input 170
wtf.trace.instrument = function(a, b, c, d, e) {
  c && (b = c + b);
  var f = wtf.data.Variable.parseSignature(b).argMap, g = wtf.trace.events.createScope(b);
  goog.asserts.assert(g);
  var k = wtf.trace.leaveScope;
  if (d) {
    b = d(a, g);
  } else {
    if (f && f.length) {
      var m = Array(f.length);
      b = function() {
        e && e.call(this);
        for (var b = 0;b < f.length;b++) {
          m[b] = arguments[f[b].ordinal];
        }
        var b = g.apply(g, m), c = a.apply(this, arguments);
        k(b);
        return c;
      };
    } else {
      b = e ? function() {
        e.call(this);
        var b = g(), c = a.apply(this, arguments);
        k(b);
        return c;
      } : function() {
        var b = g(), c = a.apply(this, arguments);
        k(b);
        return c;
      };
    }
  }
  b.uninstrumented = a;
  return b;
};
wtf.trace.instrumentType = function(a, b, c) {
  function d() {
  }
  var e = wtf.trace.instrument(a, b);
  d.prototype = a.prototype;
  e.superClass_ = a.prototype;
  e.prototype = new d;
  e.prototype.constructor = e;
  for (var f in a) {
    a.hasOwnProperty(f) && (e[f] = a[f]);
  }
  e.uninstrumented = a;
  a = wtf.data.Variable.parseSignature(b).name;
  if (c) {
    b = e.prototype;
    for (var g in c) {
      f = c[g];
      var k = b[g];
      k && (b[g] = wtf.trace.instrument(k, f, a + "#"));
    }
  }
  return e;
};
wtf.trace.instrumentTypeSimple = function(a, b, c) {
  for (var d in c) {
    var e = wtf.util.getCompiledMemberName(b, c[d]);
    e && (b[e] = wtf.trace.instrument(b[e], d, a + "#"));
  }
};
// Input 171
goog.dom.vendor = {};
goog.dom.vendor.getVendorJsPrefix = function() {
  return goog.userAgent.WEBKIT ? "Webkit" : goog.userAgent.GECKO ? "Moz" : goog.userAgent.IE ? "ms" : goog.userAgent.OPERA ? "O" : null;
};
goog.dom.vendor.getVendorPrefix = function() {
  return goog.userAgent.WEBKIT ? "-webkit" : goog.userAgent.GECKO ? "-moz" : goog.userAgent.IE ? "-ms" : goog.userAgent.OPERA ? "-o" : null;
};
goog.dom.vendor.getPrefixedPropertyName = function(a, b) {
  if (b && a in b) {
    return a;
  }
  var c = goog.dom.vendor.getVendorJsPrefix();
  return c ? (c = c.toLowerCase(), c += goog.string.toTitleCase(a), !goog.isDef(b) || c in b ? c : null) : null;
};
goog.dom.vendor.getPrefixedEventType = function(a) {
  return((goog.dom.vendor.getVendorJsPrefix() || "") + a).toLowerCase();
};
// Input 172
goog.math.Box = function(a, b, c, d) {
  this.top = a;
  this.right = b;
  this.bottom = c;
  this.left = d;
};
goog.math.Box.boundingBox = function(a) {
  for (var b = new goog.math.Box(arguments[0].y, arguments[0].x, arguments[0].y, arguments[0].x), c = 1;c < arguments.length;c++) {
    var d = arguments[c];
    b.top = Math.min(b.top, d.y);
    b.right = Math.max(b.right, d.x);
    b.bottom = Math.max(b.bottom, d.y);
    b.left = Math.min(b.left, d.x);
  }
  return b;
};
goog.math.Box.prototype.clone = function() {
  return new goog.math.Box(this.top, this.right, this.bottom, this.left);
};
goog.DEBUG && (goog.math.Box.prototype.toString = function() {
  return "(" + this.top + "t, " + this.right + "r, " + this.bottom + "b, " + this.left + "l)";
});
goog.math.Box.prototype.contains = function(a) {
  return goog.math.Box.contains(this, a);
};
goog.math.Box.prototype.expand = function(a, b, c, d) {
  goog.isObject(a) ? (this.top -= a.top, this.right += a.right, this.bottom += a.bottom, this.left -= a.left) : (this.top -= a, this.right += b, this.bottom += c, this.left -= d);
  return this;
};
goog.math.Box.prototype.expandToInclude = function(a) {
  this.left = Math.min(this.left, a.left);
  this.top = Math.min(this.top, a.top);
  this.right = Math.max(this.right, a.right);
  this.bottom = Math.max(this.bottom, a.bottom);
};
goog.math.Box.equals = function(a, b) {
  return a == b ? !0 : a && b ? a.top == b.top && a.right == b.right && a.bottom == b.bottom && a.left == b.left : !1;
};
goog.math.Box.contains = function(a, b) {
  return a && b ? b instanceof goog.math.Box ? b.left >= a.left && b.right <= a.right && b.top >= a.top && b.bottom <= a.bottom : b.x >= a.left && b.x <= a.right && b.y >= a.top && b.y <= a.bottom : !1;
};
goog.math.Box.relativePositionX = function(a, b) {
  return b.x < a.left ? b.x - a.left : b.x > a.right ? b.x - a.right : 0;
};
goog.math.Box.relativePositionY = function(a, b) {
  return b.y < a.top ? b.y - a.top : b.y > a.bottom ? b.y - a.bottom : 0;
};
goog.math.Box.distance = function(a, b) {
  var c = goog.math.Box.relativePositionX(a, b), d = goog.math.Box.relativePositionY(a, b);
  return Math.sqrt(c * c + d * d);
};
goog.math.Box.intersects = function(a, b) {
  return a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom;
};
goog.math.Box.intersectsWithPadding = function(a, b, c) {
  return a.left <= b.right + c && b.left <= a.right + c && a.top <= b.bottom + c && b.top <= a.bottom + c;
};
goog.math.Box.prototype.ceil = function() {
  this.top = Math.ceil(this.top);
  this.right = Math.ceil(this.right);
  this.bottom = Math.ceil(this.bottom);
  this.left = Math.ceil(this.left);
  return this;
};
goog.math.Box.prototype.floor = function() {
  this.top = Math.floor(this.top);
  this.right = Math.floor(this.right);
  this.bottom = Math.floor(this.bottom);
  this.left = Math.floor(this.left);
  return this;
};
goog.math.Box.prototype.round = function() {
  this.top = Math.round(this.top);
  this.right = Math.round(this.right);
  this.bottom = Math.round(this.bottom);
  this.left = Math.round(this.left);
  return this;
};
goog.math.Box.prototype.translate = function(a, b) {
  a instanceof goog.math.Coordinate ? (this.left += a.x, this.right += a.x, this.top += a.y, this.bottom += a.y) : (this.left += a, this.right += a, goog.isNumber(b) && (this.top += b, this.bottom += b));
  return this;
};
goog.math.Box.prototype.scale = function(a, b) {
  var c = goog.isNumber(b) ? b : a;
  this.left *= a;
  this.right *= a;
  this.top *= c;
  this.bottom *= c;
  return this;
};
// Input 173
goog.math.Rect = function(a, b, c, d) {
  this.left = a;
  this.top = b;
  this.width = c;
  this.height = d;
};
goog.math.Rect.prototype.clone = function() {
  return new goog.math.Rect(this.left, this.top, this.width, this.height);
};
goog.math.Rect.prototype.toBox = function() {
  return new goog.math.Box(this.top, this.left + this.width, this.top + this.height, this.left);
};
goog.math.Rect.createFromBox = function(a) {
  return new goog.math.Rect(a.left, a.top, a.right - a.left, a.bottom - a.top);
};
goog.DEBUG && (goog.math.Rect.prototype.toString = function() {
  return "(" + this.left + ", " + this.top + " - " + this.width + "w x " + this.height + "h)";
});
goog.math.Rect.equals = function(a, b) {
  return a == b ? !0 : a && b ? a.left == b.left && a.width == b.width && a.top == b.top && a.height == b.height : !1;
};
goog.math.Rect.prototype.intersection = function(a) {
  var b = Math.max(this.left, a.left), c = Math.min(this.left + this.width, a.left + a.width);
  if (b <= c) {
    var d = Math.max(this.top, a.top);
    a = Math.min(this.top + this.height, a.top + a.height);
    if (d <= a) {
      return this.left = b, this.top = d, this.width = c - b, this.height = a - d, !0;
    }
  }
  return!1;
};
goog.math.Rect.intersection = function(a, b) {
  var c = Math.max(a.left, b.left), d = Math.min(a.left + a.width, b.left + b.width);
  if (c <= d) {
    var e = Math.max(a.top, b.top), f = Math.min(a.top + a.height, b.top + b.height);
    if (e <= f) {
      return new goog.math.Rect(c, e, d - c, f - e);
    }
  }
  return null;
};
goog.math.Rect.intersects = function(a, b) {
  return a.left <= b.left + b.width && b.left <= a.left + a.width && a.top <= b.top + b.height && b.top <= a.top + a.height;
};
goog.math.Rect.prototype.intersects = function(a) {
  return goog.math.Rect.intersects(this, a);
};
goog.math.Rect.difference = function(a, b) {
  var c = goog.math.Rect.intersection(a, b);
  if (!c || !c.height || !c.width) {
    return[a.clone()];
  }
  var c = [], d = a.top, e = a.height, f = a.left + a.width, g = a.top + a.height, k = b.left + b.width, m = b.top + b.height;
  b.top > a.top && (c.push(new goog.math.Rect(a.left, a.top, a.width, b.top - a.top)), d = b.top, e -= b.top - a.top);
  m < g && (c.push(new goog.math.Rect(a.left, m, a.width, g - m)), e = m - d);
  b.left > a.left && c.push(new goog.math.Rect(a.left, d, b.left - a.left, e));
  k < f && c.push(new goog.math.Rect(k, d, f - k, e));
  return c;
};
goog.math.Rect.prototype.difference = function(a) {
  return goog.math.Rect.difference(this, a);
};
goog.math.Rect.prototype.boundingRect = function(a) {
  var b = Math.max(this.left + this.width, a.left + a.width), c = Math.max(this.top + this.height, a.top + a.height);
  this.left = Math.min(this.left, a.left);
  this.top = Math.min(this.top, a.top);
  this.width = b - this.left;
  this.height = c - this.top;
};
goog.math.Rect.boundingRect = function(a, b) {
  if (!a || !b) {
    return null;
  }
  var c = a.clone();
  c.boundingRect(b);
  return c;
};
goog.math.Rect.prototype.contains = function(a) {
  return a instanceof goog.math.Rect ? this.left <= a.left && this.left + this.width >= a.left + a.width && this.top <= a.top && this.top + this.height >= a.top + a.height : a.x >= this.left && a.x <= this.left + this.width && a.y >= this.top && a.y <= this.top + this.height;
};
goog.math.Rect.prototype.squaredDistance = function(a) {
  var b = a.x < this.left ? this.left - a.x : Math.max(a.x - (this.left + this.width), 0);
  a = a.y < this.top ? this.top - a.y : Math.max(a.y - (this.top + this.height), 0);
  return b * b + a * a;
};
goog.math.Rect.prototype.distance = function(a) {
  return Math.sqrt(this.squaredDistance(a));
};
goog.math.Rect.prototype.getSize = function() {
  return new goog.math.Size(this.width, this.height);
};
goog.math.Rect.prototype.getTopLeft = function() {
  return new goog.math.Coordinate(this.left, this.top);
};
goog.math.Rect.prototype.getCenter = function() {
  return new goog.math.Coordinate(this.left + this.width / 2, this.top + this.height / 2);
};
goog.math.Rect.prototype.getBottomRight = function() {
  return new goog.math.Coordinate(this.left + this.width, this.top + this.height);
};
goog.math.Rect.prototype.ceil = function() {
  this.left = Math.ceil(this.left);
  this.top = Math.ceil(this.top);
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this;
};
goog.math.Rect.prototype.floor = function() {
  this.left = Math.floor(this.left);
  this.top = Math.floor(this.top);
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this;
};
goog.math.Rect.prototype.round = function() {
  this.left = Math.round(this.left);
  this.top = Math.round(this.top);
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this;
};
goog.math.Rect.prototype.translate = function(a, b) {
  a instanceof goog.math.Coordinate ? (this.left += a.x, this.top += a.y) : (this.left += a, goog.isNumber(b) && (this.top += b));
  return this;
};
goog.math.Rect.prototype.scale = function(a, b) {
  var c = goog.isNumber(b) ? b : a;
  this.left *= a;
  this.width *= a;
  this.top *= c;
  this.height *= c;
  return this;
};
// Input 174
goog.style = {};
goog.style.GET_BOUNDING_CLIENT_RECT_ALWAYS_EXISTS = !1;
goog.style.setStyle = function(a, b, c) {
  goog.isString(b) ? goog.style.setStyle_(a, c, b) : goog.object.forEach(b, goog.partial(goog.style.setStyle_, a));
};
goog.style.setStyle_ = function(a, b, c) {
  (c = goog.style.getVendorJsStyleName_(a, c)) && (a.style[c] = b);
};
goog.style.getVendorJsStyleName_ = function(a, b) {
  var c = goog.string.toCamelCase(b);
  if (void 0 === a.style[c]) {
    var d = goog.dom.vendor.getVendorJsPrefix() + goog.string.toTitleCase(b);
    if (void 0 !== a.style[d]) {
      return d;
    }
  }
  return c;
};
goog.style.getVendorStyleName_ = function(a, b) {
  var c = goog.string.toCamelCase(b);
  return void 0 === a.style[c] && (c = goog.dom.vendor.getVendorJsPrefix() + goog.string.toTitleCase(b), void 0 !== a.style[c]) ? goog.dom.vendor.getVendorPrefix() + "-" + b : b;
};
goog.style.getStyle = function(a, b) {
  var c = a.style[goog.string.toCamelCase(b)];
  return "undefined" !== typeof c ? c : a.style[goog.style.getVendorJsStyleName_(a, b)] || "";
};
goog.style.getComputedStyle = function(a, b) {
  var c = goog.dom.getOwnerDocument(a);
  return c.defaultView && c.defaultView.getComputedStyle && (c = c.defaultView.getComputedStyle(a, null)) ? c[b] || c.getPropertyValue(b) || "" : "";
};
goog.style.getCascadedStyle = function(a, b) {
  return a.currentStyle ? a.currentStyle[b] : null;
};
goog.style.getStyle_ = function(a, b) {
  return goog.style.getComputedStyle(a, b) || goog.style.getCascadedStyle(a, b) || a.style && a.style[b];
};
goog.style.getComputedBoxSizing = function(a) {
  return goog.style.getStyle_(a, "boxSizing") || goog.style.getStyle_(a, "MozBoxSizing") || goog.style.getStyle_(a, "WebkitBoxSizing") || null;
};
goog.style.getComputedPosition = function(a) {
  return goog.style.getStyle_(a, "position");
};
goog.style.getBackgroundColor = function(a) {
  return goog.style.getStyle_(a, "backgroundColor");
};
goog.style.getComputedOverflowX = function(a) {
  return goog.style.getStyle_(a, "overflowX");
};
goog.style.getComputedOverflowY = function(a) {
  return goog.style.getStyle_(a, "overflowY");
};
goog.style.getComputedZIndex = function(a) {
  return goog.style.getStyle_(a, "zIndex");
};
goog.style.getComputedTextAlign = function(a) {
  return goog.style.getStyle_(a, "textAlign");
};
goog.style.getComputedCursor = function(a) {
  return goog.style.getStyle_(a, "cursor");
};
goog.style.setPosition = function(a, b, c) {
  var d, e = goog.userAgent.GECKO && (goog.userAgent.MAC || goog.userAgent.X11) && goog.userAgent.isVersionOrHigher("1.9");
  b instanceof goog.math.Coordinate ? (d = b.x, b = b.y) : (d = b, b = c);
  a.style.left = goog.style.getPixelStyleValue_(d, e);
  a.style.top = goog.style.getPixelStyleValue_(b, e);
};
goog.style.getPosition = function(a) {
  return new goog.math.Coordinate(a.offsetLeft, a.offsetTop);
};
goog.style.getClientViewportElement = function(a) {
  a = a ? goog.dom.getOwnerDocument(a) : goog.dom.getDocument();
  return!goog.userAgent.IE || goog.userAgent.isDocumentModeOrHigher(9) || goog.dom.getDomHelper(a).isCss1CompatMode() ? a.documentElement : a.body;
};
goog.style.getViewportPageOffset = function(a) {
  var b = a.body;
  a = a.documentElement;
  return new goog.math.Coordinate(b.scrollLeft || a.scrollLeft, b.scrollTop || a.scrollTop);
};
goog.style.getBoundingClientRect_ = function(a) {
  var b;
  try {
    b = a.getBoundingClientRect();
  } catch (c) {
    return{left:0, top:0, right:0, bottom:0};
  }
  goog.userAgent.IE && a.ownerDocument.body && (a = a.ownerDocument, b.left -= a.documentElement.clientLeft + a.body.clientLeft, b.top -= a.documentElement.clientTop + a.body.clientTop);
  return b;
};
goog.style.getOffsetParent = function(a) {
  if (goog.userAgent.IE && !goog.userAgent.isDocumentModeOrHigher(8)) {
    return a.offsetParent;
  }
  var b = goog.dom.getOwnerDocument(a), c = goog.style.getStyle_(a, "position"), d = "fixed" == c || "absolute" == c;
  for (a = a.parentNode;a && a != b;a = a.parentNode) {
    if (c = goog.style.getStyle_(a, "position"), d = d && "static" == c && a != b.documentElement && a != b.body, !d && (a.scrollWidth > a.clientWidth || a.scrollHeight > a.clientHeight || "fixed" == c || "absolute" == c || "relative" == c)) {
      return a;
    }
  }
  return null;
};
goog.style.getVisibleRectForElement = function(a) {
  for (var b = new goog.math.Box(0, Infinity, Infinity, 0), c = goog.dom.getDomHelper(a), d = c.getDocument().body, e = c.getDocument().documentElement, f = c.getDocumentScrollElement();a = goog.style.getOffsetParent(a);) {
    if (!(goog.userAgent.IE && 0 == a.clientWidth || goog.userAgent.WEBKIT && 0 == a.clientHeight && a == d || a == d || a == e || "visible" == goog.style.getStyle_(a, "overflow"))) {
      var g = goog.style.getPageOffset(a), k = goog.style.getClientLeftTop(a);
      g.x += k.x;
      g.y += k.y;
      b.top = Math.max(b.top, g.y);
      b.right = Math.min(b.right, g.x + a.clientWidth);
      b.bottom = Math.min(b.bottom, g.y + a.clientHeight);
      b.left = Math.max(b.left, g.x);
    }
  }
  d = f.scrollLeft;
  f = f.scrollTop;
  b.left = Math.max(b.left, d);
  b.top = Math.max(b.top, f);
  c = c.getViewportSize();
  b.right = Math.min(b.right, d + c.width);
  b.bottom = Math.min(b.bottom, f + c.height);
  return 0 <= b.top && 0 <= b.left && b.bottom > b.top && b.right > b.left ? b : null;
};
goog.style.getContainerOffsetToScrollInto = function(a, b, c) {
  var d = goog.style.getPageOffset(a), e = goog.style.getPageOffset(b), f = goog.style.getBorderBox(b), g = d.x - e.x - f.left, d = d.y - e.y - f.top, e = b.clientWidth - a.offsetWidth;
  a = b.clientHeight - a.offsetHeight;
  f = b.scrollLeft;
  b = b.scrollTop;
  c ? (f += g - e / 2, b += d - a / 2) : (f += Math.min(g, Math.max(g - e, 0)), b += Math.min(d, Math.max(d - a, 0)));
  return new goog.math.Coordinate(f, b);
};
goog.style.scrollIntoContainerView = function(a, b, c) {
  a = goog.style.getContainerOffsetToScrollInto(a, b, c);
  b.scrollLeft = a.x;
  b.scrollTop = a.y;
};
goog.style.getClientLeftTop = function(a) {
  if (goog.userAgent.GECKO && !goog.userAgent.isVersionOrHigher("1.9")) {
    var b = parseFloat(goog.style.getComputedStyle(a, "borderLeftWidth"));
    if (goog.style.isRightToLeft(a)) {
      var c = a.offsetWidth - a.clientWidth - b - parseFloat(goog.style.getComputedStyle(a, "borderRightWidth")), b = b + c
    }
    return new goog.math.Coordinate(b, parseFloat(goog.style.getComputedStyle(a, "borderTopWidth")));
  }
  return new goog.math.Coordinate(a.clientLeft, a.clientTop);
};
goog.style.getPageOffset = function(a) {
  var b, c = goog.dom.getOwnerDocument(a), d = goog.style.getStyle_(a, "position");
  goog.asserts.assertObject(a, "Parameter is required");
  var e = !goog.style.GET_BOUNDING_CLIENT_RECT_ALWAYS_EXISTS && goog.userAgent.GECKO && c.getBoxObjectFor && !a.getBoundingClientRect && "absolute" == d && (b = c.getBoxObjectFor(a)) && (0 > b.screenX || 0 > b.screenY), f = new goog.math.Coordinate(0, 0), g = goog.style.getClientViewportElement(c);
  if (a == g) {
    return f;
  }
  if (goog.style.GET_BOUNDING_CLIENT_RECT_ALWAYS_EXISTS || a.getBoundingClientRect) {
    b = goog.style.getBoundingClientRect_(a), a = goog.dom.getDomHelper(c).getDocumentScroll(), f.x = b.left + a.x, f.y = b.top + a.y;
  } else {
    if (c.getBoxObjectFor && !e) {
      b = c.getBoxObjectFor(a), a = c.getBoxObjectFor(g), f.x = b.screenX - a.screenX, f.y = b.screenY - a.screenY;
    } else {
      b = a;
      do {
        f.x += b.offsetLeft;
        f.y += b.offsetTop;
        b != a && (f.x += b.clientLeft || 0, f.y += b.clientTop || 0);
        if (goog.userAgent.WEBKIT && "fixed" == goog.style.getComputedPosition(b)) {
          f.x += c.body.scrollLeft;
          f.y += c.body.scrollTop;
          break;
        }
        b = b.offsetParent;
      } while (b && b != a);
      if (goog.userAgent.OPERA || goog.userAgent.WEBKIT && "absolute" == d) {
        f.y -= c.body.offsetTop;
      }
      for (b = a;(b = goog.style.getOffsetParent(b)) && b != c.body && b != g;) {
        f.x -= b.scrollLeft, goog.userAgent.OPERA && "TR" == b.tagName || (f.y -= b.scrollTop);
      }
    }
  }
  return f;
};
goog.style.getPageOffsetLeft = function(a) {
  return goog.style.getPageOffset(a).x;
};
goog.style.getPageOffsetTop = function(a) {
  return goog.style.getPageOffset(a).y;
};
goog.style.getFramedPageOffset = function(a, b) {
  var c = new goog.math.Coordinate(0, 0), d = goog.dom.getWindow(goog.dom.getOwnerDocument(a)), e = a;
  do {
    var f = d == b ? goog.style.getPageOffset(e) : goog.style.getClientPositionForElement_(goog.asserts.assert(e));
    c.x += f.x;
    c.y += f.y;
  } while (d && d != b && (e = d.frameElement) && (d = d.parent));
  return c;
};
goog.style.translateRectForAnotherFrame = function(a, b, c) {
  if (b.getDocument() != c.getDocument()) {
    var d = b.getDocument().body;
    c = goog.style.getFramedPageOffset(d, c.getWindow());
    c = goog.math.Coordinate.difference(c, goog.style.getPageOffset(d));
    goog.userAgent.IE && !b.isCss1CompatMode() && (c = goog.math.Coordinate.difference(c, b.getDocumentScroll()));
    a.left += c.x;
    a.top += c.y;
  }
};
goog.style.getRelativePosition = function(a, b) {
  var c = goog.style.getClientPosition(a), d = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(c.x - d.x, c.y - d.y);
};
goog.style.getClientPositionForElement_ = function(a) {
  var b;
  if (goog.style.GET_BOUNDING_CLIENT_RECT_ALWAYS_EXISTS || a.getBoundingClientRect) {
    b = goog.style.getBoundingClientRect_(a), b = new goog.math.Coordinate(b.left, b.top);
  } else {
    b = goog.dom.getDomHelper(a).getDocumentScroll();
    var c = goog.style.getPageOffset(a);
    b = new goog.math.Coordinate(c.x - b.x, c.y - b.y);
  }
  return goog.userAgent.GECKO && !goog.userAgent.isVersionOrHigher(12) ? goog.math.Coordinate.sum(b, goog.style.getCssTranslation(a)) : b;
};
goog.style.getClientPosition = function(a) {
  goog.asserts.assert(a);
  if (a.nodeType == goog.dom.NodeType.ELEMENT) {
    return goog.style.getClientPositionForElement_(a);
  }
  var b = goog.isFunction(a.getBrowserEvent), c = a;
  a.targetTouches ? c = a.targetTouches[0] : b && a.getBrowserEvent().targetTouches && (c = a.getBrowserEvent().targetTouches[0]);
  return new goog.math.Coordinate(c.clientX, c.clientY);
};
goog.style.setPageOffset = function(a, b, c) {
  var d = goog.style.getPageOffset(a);
  b instanceof goog.math.Coordinate && (c = b.y, b = b.x);
  goog.style.setPosition(a, a.offsetLeft + (b - d.x), a.offsetTop + (c - d.y));
};
goog.style.setSize = function(a, b, c) {
  if (b instanceof goog.math.Size) {
    c = b.height, b = b.width;
  } else {
    if (void 0 == c) {
      throw Error("missing height argument");
    }
  }
  goog.style.setWidth(a, b);
  goog.style.setHeight(a, c);
};
goog.style.getPixelStyleValue_ = function(a, b) {
  "number" == typeof a && (a = (b ? Math.round(a) : a) + "px");
  return a;
};
goog.style.setHeight = function(a, b) {
  a.style.height = goog.style.getPixelStyleValue_(b, !0);
};
goog.style.setWidth = function(a, b) {
  a.style.width = goog.style.getPixelStyleValue_(b, !0);
};
goog.style.getSize = function(a) {
  return goog.style.evaluateWithTemporaryDisplay_(goog.style.getSizeWithDisplay_, a);
};
goog.style.evaluateWithTemporaryDisplay_ = function(a, b) {
  if ("none" != goog.style.getStyle_(b, "display")) {
    return a(b);
  }
  var c = b.style, d = c.display, e = c.visibility, f = c.position;
  c.visibility = "hidden";
  c.position = "absolute";
  c.display = "inline";
  var g = a(b);
  c.display = d;
  c.position = f;
  c.visibility = e;
  return g;
};
goog.style.getSizeWithDisplay_ = function(a) {
  var b = a.offsetWidth, c = a.offsetHeight, d = goog.userAgent.WEBKIT && !b && !c;
  return goog.isDef(b) && !d || !a.getBoundingClientRect ? new goog.math.Size(b, c) : (a = goog.style.getBoundingClientRect_(a), new goog.math.Size(a.right - a.left, a.bottom - a.top));
};
goog.style.getTransformedSize = function(a) {
  if (!a.getBoundingClientRect) {
    return null;
  }
  a = goog.style.evaluateWithTemporaryDisplay_(goog.style.getBoundingClientRect_, a);
  return new goog.math.Size(a.right - a.left, a.bottom - a.top);
};
goog.style.getBounds = function(a) {
  var b = goog.style.getPageOffset(a);
  a = goog.style.getSize(a);
  return new goog.math.Rect(b.x, b.y, a.width, a.height);
};
goog.style.toCamelCase = function(a) {
  return goog.string.toCamelCase(String(a));
};
goog.style.toSelectorCase = function(a) {
  return goog.string.toSelectorCase(a);
};
goog.style.getOpacity = function(a) {
  var b = a.style;
  a = "";
  "opacity" in b ? a = b.opacity : "MozOpacity" in b ? a = b.MozOpacity : "filter" in b && (b = b.filter.match(/alpha\(opacity=([\d.]+)\)/)) && (a = String(b[1] / 100));
  return "" == a ? a : Number(a);
};
goog.style.setOpacity = function(a, b) {
  var c = a.style;
  "opacity" in c ? c.opacity = b : "MozOpacity" in c ? c.MozOpacity = b : "filter" in c && (c.filter = "" === b ? "" : "alpha(opacity=" + 100 * b + ")");
};
goog.style.setTransparentBackgroundImage = function(a, b) {
  var c = a.style;
  goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("8") ? c.filter = 'progid:DXImageTransform.Microsoft.AlphaImageLoader(src="' + b + '", sizingMethod="crop")' : (c.backgroundImage = "url(" + b + ")", c.backgroundPosition = "top left", c.backgroundRepeat = "no-repeat");
};
goog.style.clearTransparentBackgroundImage = function(a) {
  a = a.style;
  "filter" in a ? a.filter = "" : a.backgroundImage = "none";
};
goog.style.showElement = function(a, b) {
  goog.style.setElementShown(a, b);
};
goog.style.setElementShown = function(a, b) {
  a.style.display = b ? "" : "none";
};
goog.style.isElementShown = function(a) {
  return "none" != a.style.display;
};
goog.style.installStyles = function(a, b) {
  var c = goog.dom.getDomHelper(b), d = null, e = c.getDocument();
  goog.userAgent.IE && e.createStyleSheet ? (d = e.createStyleSheet(), goog.style.setStyles(d, a)) : (e = c.getElementsByTagNameAndClass("head")[0], e || (d = c.getElementsByTagNameAndClass("body")[0], e = c.createDom("head"), d.parentNode.insertBefore(e, d)), d = c.createDom("style"), goog.style.setStyles(d, a), c.appendChild(e, d));
  return d;
};
goog.style.uninstallStyles = function(a) {
  goog.dom.removeNode(a.ownerNode || a.owningElement || a);
};
goog.style.setStyles = function(a, b) {
  goog.userAgent.IE && goog.isDef(a.cssText) ? a.cssText = b : a.innerHTML = b;
};
goog.style.setPreWrap = function(a) {
  a = a.style;
  goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("8") ? (a.whiteSpace = "pre", a.wordWrap = "break-word") : a.whiteSpace = goog.userAgent.GECKO ? "-moz-pre-wrap" : "pre-wrap";
};
goog.style.setInlineBlock = function(a) {
  a = a.style;
  a.position = "relative";
  goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("8") ? (a.zoom = "1", a.display = "inline") : a.display = goog.userAgent.GECKO ? goog.userAgent.isVersionOrHigher("1.9a") ? "inline-block" : "-moz-inline-box" : "inline-block";
};
goog.style.isRightToLeft = function(a) {
  return "rtl" == goog.style.getStyle_(a, "direction");
};
goog.style.unselectableStyle_ = goog.userAgent.GECKO ? "MozUserSelect" : goog.userAgent.WEBKIT ? "WebkitUserSelect" : null;
goog.style.isUnselectable = function(a) {
  return goog.style.unselectableStyle_ ? "none" == a.style[goog.style.unselectableStyle_].toLowerCase() : goog.userAgent.IE || goog.userAgent.OPERA ? "on" == a.getAttribute("unselectable") : !1;
};
goog.style.setUnselectable = function(a, b, c) {
  c = c ? null : a.getElementsByTagName("*");
  var d = goog.style.unselectableStyle_;
  if (d) {
    if (b = b ? "none" : "", a.style[d] = b, c) {
      a = 0;
      for (var e;e = c[a];a++) {
        e.style[d] = b;
      }
    }
  } else {
    if (goog.userAgent.IE || goog.userAgent.OPERA) {
      if (b = b ? "on" : "", a.setAttribute("unselectable", b), c) {
        for (a = 0;e = c[a];a++) {
          e.setAttribute("unselectable", b);
        }
      }
    }
  }
};
goog.style.getBorderBoxSize = function(a) {
  return new goog.math.Size(a.offsetWidth, a.offsetHeight);
};
goog.style.setBorderBoxSize = function(a, b) {
  var c = goog.dom.getOwnerDocument(a), d = goog.dom.getDomHelper(c).isCss1CompatMode();
  if (!goog.userAgent.IE || d && goog.userAgent.isVersionOrHigher("8")) {
    goog.style.setBoxSizingSize_(a, b, "border-box");
  } else {
    if (c = a.style, d) {
      var d = goog.style.getPaddingBox(a), e = goog.style.getBorderBox(a);
      c.pixelWidth = b.width - e.left - d.left - d.right - e.right;
      c.pixelHeight = b.height - e.top - d.top - d.bottom - e.bottom;
    } else {
      c.pixelWidth = b.width, c.pixelHeight = b.height;
    }
  }
};
goog.style.getContentBoxSize = function(a) {
  var b = goog.dom.getOwnerDocument(a), c = goog.userAgent.IE && a.currentStyle;
  if (c && goog.dom.getDomHelper(b).isCss1CompatMode() && "auto" != c.width && "auto" != c.height && !c.boxSizing) {
    return b = goog.style.getIePixelValue_(a, c.width, "width", "pixelWidth"), a = goog.style.getIePixelValue_(a, c.height, "height", "pixelHeight"), new goog.math.Size(b, a);
  }
  c = goog.style.getBorderBoxSize(a);
  b = goog.style.getPaddingBox(a);
  a = goog.style.getBorderBox(a);
  return new goog.math.Size(c.width - a.left - b.left - b.right - a.right, c.height - a.top - b.top - b.bottom - a.bottom);
};
goog.style.setContentBoxSize = function(a, b) {
  var c = goog.dom.getOwnerDocument(a), d = goog.dom.getDomHelper(c).isCss1CompatMode();
  if (!goog.userAgent.IE || d && goog.userAgent.isVersionOrHigher("8")) {
    goog.style.setBoxSizingSize_(a, b, "content-box");
  } else {
    if (c = a.style, d) {
      c.pixelWidth = b.width, c.pixelHeight = b.height;
    } else {
      var d = goog.style.getPaddingBox(a), e = goog.style.getBorderBox(a);
      c.pixelWidth = b.width + e.left + d.left + d.right + e.right;
      c.pixelHeight = b.height + e.top + d.top + d.bottom + e.bottom;
    }
  }
};
goog.style.setBoxSizingSize_ = function(a, b, c) {
  a = a.style;
  goog.userAgent.GECKO ? a.MozBoxSizing = c : goog.userAgent.WEBKIT ? a.WebkitBoxSizing = c : a.boxSizing = c;
  a.width = Math.max(b.width, 0) + "px";
  a.height = Math.max(b.height, 0) + "px";
};
goog.style.getIePixelValue_ = function(a, b, c, d) {
  if (/^\d+px?$/.test(b)) {
    return parseInt(b, 10);
  }
  var e = a.style[c], f = a.runtimeStyle[c];
  a.runtimeStyle[c] = a.currentStyle[c];
  a.style[c] = b;
  b = a.style[d];
  a.style[c] = e;
  a.runtimeStyle[c] = f;
  return b;
};
goog.style.getIePixelDistance_ = function(a, b) {
  var c = goog.style.getCascadedStyle(a, b);
  return c ? goog.style.getIePixelValue_(a, c, "left", "pixelLeft") : 0;
};
goog.style.getBox_ = function(a, b) {
  if (goog.userAgent.IE) {
    var c = goog.style.getIePixelDistance_(a, b + "Left"), d = goog.style.getIePixelDistance_(a, b + "Right"), e = goog.style.getIePixelDistance_(a, b + "Top"), f = goog.style.getIePixelDistance_(a, b + "Bottom");
    return new goog.math.Box(e, d, f, c);
  }
  c = goog.style.getComputedStyle(a, b + "Left");
  d = goog.style.getComputedStyle(a, b + "Right");
  e = goog.style.getComputedStyle(a, b + "Top");
  f = goog.style.getComputedStyle(a, b + "Bottom");
  return new goog.math.Box(parseFloat(e), parseFloat(d), parseFloat(f), parseFloat(c));
};
goog.style.getPaddingBox = function(a) {
  return goog.style.getBox_(a, "padding");
};
goog.style.getMarginBox = function(a) {
  return goog.style.getBox_(a, "margin");
};
goog.style.ieBorderWidthKeywords_ = {thin:2, medium:4, thick:6};
goog.style.getIePixelBorder_ = function(a, b) {
  if ("none" == goog.style.getCascadedStyle(a, b + "Style")) {
    return 0;
  }
  var c = goog.style.getCascadedStyle(a, b + "Width");
  return c in goog.style.ieBorderWidthKeywords_ ? goog.style.ieBorderWidthKeywords_[c] : goog.style.getIePixelValue_(a, c, "left", "pixelLeft");
};
goog.style.getBorderBox = function(a) {
  if (goog.userAgent.IE && !goog.userAgent.isDocumentModeOrHigher(9)) {
    var b = goog.style.getIePixelBorder_(a, "borderLeft"), c = goog.style.getIePixelBorder_(a, "borderRight"), d = goog.style.getIePixelBorder_(a, "borderTop");
    a = goog.style.getIePixelBorder_(a, "borderBottom");
    return new goog.math.Box(d, c, a, b);
  }
  b = goog.style.getComputedStyle(a, "borderLeftWidth");
  c = goog.style.getComputedStyle(a, "borderRightWidth");
  d = goog.style.getComputedStyle(a, "borderTopWidth");
  a = goog.style.getComputedStyle(a, "borderBottomWidth");
  return new goog.math.Box(parseFloat(d), parseFloat(c), parseFloat(a), parseFloat(b));
};
goog.style.getFontFamily = function(a) {
  var b = goog.dom.getOwnerDocument(a), c = "";
  if (b.body.createTextRange) {
    b = b.body.createTextRange();
    b.moveToElementText(a);
    try {
      c = b.queryCommandValue("FontName");
    } catch (d) {
      c = "";
    }
  }
  c || (c = goog.style.getStyle_(a, "fontFamily"));
  a = c.split(",");
  1 < a.length && (c = a[0]);
  return goog.string.stripQuotes(c, "\"'");
};
goog.style.lengthUnitRegex_ = /[^\d]+$/;
goog.style.getLengthUnits = function(a) {
  return(a = a.match(goog.style.lengthUnitRegex_)) && a[0] || null;
};
goog.style.ABSOLUTE_CSS_LENGTH_UNITS_ = {cm:1, "in":1, mm:1, pc:1, pt:1};
goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_ = {em:1, ex:1};
goog.style.getFontSize = function(a) {
  var b = goog.style.getStyle_(a, "fontSize"), c = goog.style.getLengthUnits(b);
  if (b && "px" == c) {
    return parseInt(b, 10);
  }
  if (goog.userAgent.IE) {
    if (c in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(a, b, "left", "pixelLeft");
    }
    if (a.parentNode && a.parentNode.nodeType == goog.dom.NodeType.ELEMENT && c in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_) {
      return a = a.parentNode, c = goog.style.getStyle_(a, "fontSize"), goog.style.getIePixelValue_(a, b == c ? "1em" : b, "left", "pixelLeft");
    }
  }
  c = goog.dom.createDom("span", {style:"visibility:hidden;position:absolute;line-height:0;padding:0;margin:0;border:0;height:1em;"});
  goog.dom.appendChild(a, c);
  b = c.offsetHeight;
  goog.dom.removeNode(c);
  return b;
};
goog.style.parseStyleAttribute = function(a) {
  var b = {};
  goog.array.forEach(a.split(/\s*;\s*/), function(a) {
    a = a.split(/\s*:\s*/);
    2 == a.length && (b[goog.string.toCamelCase(a[0].toLowerCase())] = a[1]);
  });
  return b;
};
goog.style.toStyleAttribute = function(a) {
  var b = [];
  goog.object.forEach(a, function(a, d) {
    b.push(goog.string.toSelectorCase(d), ":", a, ";");
  });
  return b.join("");
};
goog.style.setFloat = function(a, b) {
  a.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] = b;
};
goog.style.getFloat = function(a) {
  return a.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] || "";
};
goog.style.getScrollbarWidth = function(a) {
  var b = goog.dom.createElement("div");
  a && (b.className = a);
  b.style.cssText = "overflow:auto;position:absolute;top:0;width:100px;height:100px";
  a = goog.dom.createElement("div");
  goog.style.setSize(a, "200px", "200px");
  b.appendChild(a);
  goog.dom.appendChild(goog.dom.getDocument().body, b);
  a = b.offsetWidth - b.clientWidth;
  goog.dom.removeNode(b);
  return a;
};
goog.style.MATRIX_TRANSLATION_REGEX_ = /matrix\([0-9\.\-]+, [0-9\.\-]+, [0-9\.\-]+, [0-9\.\-]+, ([0-9\.\-]+)p?x?, ([0-9\.\-]+)p?x?\)/;
goog.style.getCssTranslation = function(a) {
  var b;
  goog.userAgent.IE ? b = "-ms-transform" : goog.userAgent.WEBKIT ? b = "-webkit-transform" : goog.userAgent.OPERA ? b = "-o-transform" : goog.userAgent.GECKO && (b = "-moz-transform");
  var c;
  b && (c = goog.style.getStyle_(a, b));
  c || (c = goog.style.getStyle_(a, "transform"));
  return c ? (a = c.match(goog.style.MATRIX_TRANSLATION_REGEX_)) ? new goog.math.Coordinate(parseFloat(a[1]), parseFloat(a[2])) : new goog.math.Coordinate(0, 0) : new goog.math.Coordinate(0, 0);
};
// Input 175
wtf.ipc = {};
wtf.ipc.Channel = function() {
  wtf.events.EventEmitter.call(this);
};
goog.inherits(wtf.ipc.Channel, wtf.events.EventEmitter);
wtf.ipc.Channel.EventType = {MESSAGE:goog.events.getUniqueId("message")};
// Input 176
wtf.ipc.MessageChannel = function(a, b) {
  wtf.ipc.Channel.call(this);
  var c = this;
  this.recvPort_ = a;
  this.sendPort_ = b;
  this.hasTransferablePostMessage_ = void 0;
  this.boundHandleMessage_ = wtf.trace.util.ignoreListener(function(a) {
    c.handleMessage_(a);
  });
  this.recvPort_.addEventListener(goog.events.EventType.MESSAGE, this.boundHandleMessage_, !0);
};
goog.inherits(wtf.ipc.MessageChannel, wtf.ipc.Channel);
wtf.ipc.MessageChannel.prototype.disposeInternal = function() {
  this.recvPort_.removeEventListener(goog.events.EventType.MESSAGE, this.boundHandleMessage_, !0);
  this.sendPort_ = this.recvPort_ = null;
  wtf.ipc.MessageChannel.superClass_.disposeInternal.call(this);
};
wtf.ipc.MessageChannel.PACKET_TOKEN = "wtf_ipc_connect_token";
wtf.ipc.MessageChannel.SENDER_TOKEN_ = "wtf_ipc_sender_token";
wtf.ipc.MessageChannel.LOCAL_ID_ = String(Number(wtf.trace.util.dateNow() + 1E4));
wtf.ipc.MessageChannel.prototype.isConnected = function() {
  return!!this.sendPort_ && !this.sendPort_.closed;
};
wtf.ipc.MessageChannel.prototype.focus = function() {
  this.sendPort_ && this.sendPort_.focus();
};
wtf.ipc.MessageChannel.prototype.handleMessage_ = function(a) {
  var b = a.data;
  b && b[wtf.ipc.MessageChannel.PACKET_TOKEN] && (a.stopPropagation(), wtf.trace.util.ignoreEvent(a), b[wtf.ipc.MessageChannel.SENDER_TOKEN_] != wtf.ipc.MessageChannel.LOCAL_ID_ && this.emitEvent(wtf.ipc.Channel.EventType.MESSAGE, b.data));
};
wtf.ipc.MessageChannel.prototype.postMessage = function(a, b) {
  if (this.sendPort_) {
    var c = {data:a};
    c[wtf.ipc.MessageChannel.PACKET_TOKEN] = !0;
    c[wtf.ipc.MessageChannel.SENDER_TOKEN_] = wtf.ipc.MessageChannel.LOCAL_ID_;
    var d = this.sendPort_.postMessage.raw || this.sendPort_.postMessage;
    if (void 0 === this.hasTransferablePostMessage_ && b) {
      try {
        d.call(this.sendPort_, c, "*", b), this.hasTransferablePostMessage_ = !0;
      } catch (e) {
        this.hasTransferablePostMessage_ = !1, d.call(this.sendPort_, c, "*");
      }
    } else {
      this.hasTransferablePostMessage_ ? d.call(this.sendPort_, c, "*", b) : d.call(this.sendPort_, c, "*");
    }
  }
};
// Input 177
wtf.ipc.connectToParentWindow = function(a, b) {
  function c(c) {
    var d = null;
    c && (d = new wtf.ipc.MessageChannel(window, c), d.postMessage({hello:!0}));
    a.call(b, d);
  }
  var d = goog.global.chrome;
  d && d.runtime && d.runtime.getBackgroundPage ? d.runtime.getBackgroundPage(function(a) {
    c(a);
  }) : wtf.timing.setImmediate(function() {
    c(window.opener);
  });
};
wtf.ipc.waitForChildWindow = function(a, b) {
  var c = wtf.trace.util.ignoreListener(function(d) {
    d.data && d.data[wtf.ipc.MessageChannel.PACKET_TOKEN] && d.data.data && !0 == d.data.data.hello && (d.stopPropagation(), window.removeEventListener(goog.events.EventType.MESSAGE, c, !0), goog.asserts.assert(d.source), d = new wtf.ipc.MessageChannel(window, d.source), a.call(b, d));
  });
  window.addEventListener(goog.events.EventType.MESSAGE, c, !0);
};
wtf.ipc.listenForChildWindows = function(a, b) {
  var c = wtf.trace.util.ignoreListener(function(d) {
    d.data && d.data[wtf.ipc.MessageChannel.PACKET_TOKEN] && d.data.data && !0 == d.data.data.hello && (d.stopPropagation(), window.removeEventListener(goog.events.EventType.MESSAGE, c, !0), goog.asserts.assert(d.source), d = new wtf.ipc.MessageChannel(window, d.source), a.call(b, d));
  });
  window.addEventListener(goog.events.EventType.MESSAGE, c, !0);
};
wtf.ipc.getWindowMessageChannel = function(a) {
  var b = a || window;
  a = wtf.util.getGlobalCacheObject("ipc", b);
  if (a.messageChannel) {
    return a.messageChannel;
  }
  b = new wtf.ipc.MessageChannel(b, b);
  return a.messageChannel = b;
};
// Input 178
wtf.trace.Provider = function(a) {
  goog.Disposable.call(this);
  this.options = a;
  this.injections_ = [];
};
goog.inherits(wtf.trace.Provider, goog.Disposable);
wtf.trace.Provider.prototype.disposeInternal = function() {
  for (var a = 0;a < this.injections_.length;a++) {
    var b = this.injections_[a];
    b.target[b.name] = b.original;
  }
  wtf.trace.Provider.superClass_.disposeInternal.call(this);
};
wtf.trace.Provider.prototype.injectFunction = function(a, b, c) {
  var d = a[b];
  this.injections_.push({target:a, name:b, original:d});
  a[b] = c;
  c.raw = d;
};
wtf.trace.Provider.prototype.getHudButtons = function() {
  return[];
};
wtf.trace.Provider.prototype.getSettingsSectionConfigs = function() {
  return[];
};
// Input 179
wtf.trace.providers = {};
wtf.trace.providers.ChromeDebugProvider = function(a, b) {
  wtf.trace.Provider.call(this, b);
  this.hudButtons_ = [];
  this.available_ = !1;
  b.getNumber("wtf.trace.provider.chromeDebug", 1) && b.getBoolean("wtf.trace.provider.chromeDebug.present", !1) && (this.timelineDispatch_ = {}, this.setupTimelineDispatch_(), this.nextRequestId_ = 0, this.pendingRequests_ = {}, this.awaitingTracingData_ = this.isCapturingTracing_ = !1, this.tracingTrackerId_ = String(goog.now()), this.tracingTrackerIntervalId_ = -1, this.tracingProgressEl_ = this.createTracingProgressElement_(), (this.extensionChannel_ = wtf.ipc.getWindowMessageChannel(window)) && 
  this.extensionChannel_.addListener(wtf.ipc.Channel.EventType.MESSAGE, this.extensionMessage_, this), (this.available_ = !!this.extensionChannel_) && b.getBoolean("wtf.trace.provider.chromeDebug.tracing", !1) && this.hudButtons_.push({title:"Toggle chrome:tracing Capture", icon:"/assets/icons/chrometracing.png", shortcut:"f3", callback:function() {
    this.toggleCapture_();
  }, scope:this}));
};
goog.inherits(wtf.trace.providers.ChromeDebugProvider, wtf.trace.Provider);
wtf.trace.providers.ChromeDebugProvider.prototype.isAvailable = function() {
  return this.available_;
};
wtf.trace.providers.ChromeDebugProvider.prototype.getHudButtons = function() {
  return this.hudButtons_;
};
wtf.trace.providers.ChromeDebugProvider.prototype.getSettingsSectionConfigs = function() {
  return[{title:"Chrome Debugging", widgets:[{type:"checkbox", key:"wtf.trace.provider.chromeDebug", title:"Enabled", "default":!0}, {type:"checkbox", key:"wtf.trace.provider.chromeDebug.timeline", title:"GCs/paints/layouts/etc", "default":!0}, {type:"checkbox", key:"wtf.trace.provider.chromeDebug.tracing", title:"chrome:tracing", "default":!1}, {type:"label", title:"", value:"Launch Chrome with --remote-debugging-port=9222 to use chrome:tracing."}]}];
};
wtf.trace.providers.ChromeDebugProvider.prototype.sendMessage_ = function(a) {
  this.extensionChannel_ && this.extensionChannel_.postMessage(a);
};
wtf.trace.providers.ChromeDebugProvider.prototype.extensionMessage_ = function(a) {
  var b = wtf.trace.enterTracingScope();
  a = goog.isString(a) ? goog.global.JSON.parse(a) : a;
  switch(a.command) {
    case "debugger_data":
      this.processDebuggerRecords_(a.records);
      var c = this.pendingRequests_[a.request_id];
      c && (delete this.pendingRequests_[a.request_id], c.callback(null));
      break;
    case "chrome_tracing_data":
      this.processChromeTracingData_(a.zone_list, a.event_list), this.awaitingTracingData_ = !1, wtf.trace.mark(""), this.updateTracingProgress_(null);
  }
  wtf.trace.leaveScope(b);
};
wtf.trace.providers.ChromeDebugProvider.prototype.processDebuggerRecords_ = function(a) {
  for (var b = 0;b < a.length;b++) {
    var c = a[b];
    c && c[0] || goog.global.console.log("record bad");
    var d = this.timelineDispatch_[c[0]];
    d && d(c);
  }
};
wtf.trace.providers.ChromeDebugProvider.prototype.setupTimelineDispatch_ = function() {
  var a = this, b = {value:0, intervalId:-1, translate:function(a) {
    return a - this.value;
  }}, c = [];
  this.timelineDispatch_.WTFTimeSync = function(d) {
    b.value || (goog.global.clearInterval.raw.call(goog.global, b.intervalId), b.value = d[1] - d[2], c.length && (a.processDebuggerRecords_(c), c = []));
  };
  var d = goog.global.console.timeStamp.raw.raw || goog.global.console.timeStamp.raw || goog.global.console.timeStamp;
  d.call(goog.global.console, "WTFTimeSync:" + wtf.now());
  b.intervalId = goog.global.setInterval.raw.call(goog.global, function() {
    d.call(goog.global.console, "WTFTimeSync:" + wtf.now());
  }, 10);
  var e = wtf.trace.events.createScope("javascript#gc(uint32 usedHeapSize, uint32 usedHeapSizeDelta)", wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_.GCEvent = function(a) {
    if (b.value) {
      var d = b.translate(a[1]), f = b.translate(a[2]);
      a = e(a[3], a[4], d);
      wtf.trace.leaveScope(a, void 0, f);
    } else {
      c.push(a);
    }
  };
  var f = wtf.trace.events.createScope("javascript#evalscript(uint32 usedHeapSize, uint32 usedHeapSizeDelta, ascii url, uint32 lineNumber)", wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_.EvaluateScript = function(a) {
    if (b.value) {
      var d = b.translate(a[1]), e = b.translate(a[2]);
      a = f(a[3], a[4], a[5], a[6], d);
      wtf.trace.leaveScope(a, void 0, e);
    } else {
      c.push(a);
    }
  };
  var g = wtf.trace.events.createScope("browser#parseHtml()", wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_.ParseHTML = function(a) {
    if (b.value) {
      var d = b.translate(a[1]);
      a = b.translate(a[2]);
      d = g(d);
      wtf.trace.leaveScope(d, void 0, a);
    } else {
      c.push(a);
    }
  };
  var k = wtf.trace.events.createInstance("browser#domContentReady(bool isMainFrame)", wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_.MarkDOMContent = function(a) {
    if (b.value) {
      var d = b.translate(a[1]);
      k(a[2], d);
    } else {
      c.push(a);
    }
  };
  var m = wtf.trace.events.createInstance("browser#invalidateStyles()");
  this.timelineDispatch_.ScheduleStyleRecalculation = function(a) {
    b.value ? (a = b.translate(a[1]), m(a)) : c.push(a);
  };
  var l = wtf.trace.events.createScope("browser#recalculateStyles(uint32 elementCount)", wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_.RecalculateStyles = function(a) {
    if (b.value) {
      var d = a[2] - b.value;
      a = l(a[3], a[1] - b.value);
      wtf.trace.leaveScope(a, void 0, d);
    } else {
      c.push(a);
    }
  };
  var p = wtf.trace.events.createInstance("browser#invalidateLayout()");
  this.timelineDispatch_.InvalidateLayout = function(a) {
    b.value ? (a = b.translate(a[1]), p(a)) : c.push(a);
  };
  var s = wtf.trace.events.createScope("browser#layout(uint32 totalObjects, uint32 dirtyObjects, bool partialLayout, int32 x, int32 y, int32 width, int32 height)", wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_.Layout = function(a) {
    if (b.value) {
      var d = b.translate(a[1]), e = b.translate(a[2]);
      a = s(a[3], a[4], a[5], a[6], a[7], a[8], a[9], d);
      wtf.trace.leaveScope(a, void 0, e);
    } else {
      c.push(a);
    }
  };
  var t = wtf.trace.events.createScope("browser#paintSetup()", wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_.PaintSetup = function(a) {
    if (b.value) {
      var d = b.translate(a[1]);
      a = b.translate(a[2]);
      d = t(d);
      wtf.trace.leaveScope(d, void 0, a);
    } else {
      c.push(a);
    }
  };
  var x = wtf.trace.events.createScope("browser#paint(int32 x, int32 y, int32 width, int32 height)", wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_.Paint = function(a) {
    if (b.value) {
      var d = b.translate(a[1]), e = b.translate(a[2]);
      a = x(a[3], a[4], a[5], a[6], d);
      wtf.trace.leaveScope(a, void 0, e);
    } else {
      c.push(a);
    }
  };
  var v = wtf.trace.events.createScope("browser#compositeLayers()", wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_.CompositeLayers = function(a) {
    if (b.value) {
      var d = b.translate(a[1]);
      a = b.translate(a[2]);
      d = v(d);
      wtf.trace.leaveScope(d, void 0, a);
    } else {
      c.push(a);
    }
  };
  var w = wtf.trace.events.createScope("browser#decodeImage(ascii imageType)", wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_.DecodeImage = function(a) {
    if (b.value) {
      var d = b.translate(a[1]), e = b.translate(a[2]);
      a = w(a[3], d);
      wtf.trace.leaveScope(a, void 0, e);
    } else {
      c.push(a);
    }
  };
  var u = wtf.trace.events.createScope("browser#resizeImage(bool cached)", wtf.data.EventFlag.SYSTEM_TIME);
  this.timelineDispatch_.ResizeImage = function(a) {
    if (b.value) {
      var d = b.translate(a[1]), e = b.translate(a[2]);
      a = u(a[3], d);
      wtf.trace.leaveScope(a, void 0, e);
    } else {
      c.push(a);
    }
  };
};
wtf.trace.providers.ChromeDebugProvider.prototype.gatherData = function() {
  var a = new goog.async.Deferred, b = this.nextRequestId_++;
  this.pendingRequests_[b] = a;
  this.sendMessage_({command:"get_debugger_data", request_id:b});
  return a;
};
wtf.trace.providers.ChromeDebugProvider.prototype.resetData = function() {
  this.sendMessage_({command:"clear_debugger_data"});
};
wtf.trace.providers.ChromeDebugProvider.prototype.createTracingProgressElement_ = function() {
  var a = goog.dom.getDomHelper().createElement(goog.dom.TagName.DIV);
  goog.style.setStyle(a, {position:"fixed", top:"5px", right:"5px", "background-color":"white", border:"1px solid black", color:"black", "z-index":9999999});
  return a;
};
wtf.trace.providers.ChromeDebugProvider.prototype.updateTracingProgress_ = function(a) {
  var b = goog.dom.getDocument();
  a ? (goog.dom.setTextContent(this.tracingProgressEl_, a), this.tracingProgressEl_.parentNode || b.body.appendChild(this.tracingProgressEl_)) : this.tracingProgressEl_.parentNode && b.body.removeChild(this.tracingProgressEl_);
};
wtf.trace.providers.ChromeDebugProvider.prototype.toggleCapture_ = function() {
  function a() {
    var a = wtf.now(), b = wtf.trace.enterTracingScope(a), a = "$WTFTRACE:" + Math.floor(1E3 * a);
    d.call(goog.global.console, a);
    e.call(goog.global.console, a);
    wtf.trace.leaveScope(b);
  }
  if (this.awaitingTracingData_) {
    goog.global.console.log("Ignoring chrome:tracing request while data is pending...");
  } else {
    var b = goog.global.setInterval.raw || goog.global.setInterval, c = goog.global.clearInterval.raw || goog.global.clearInterval, d = goog.global.console.time.raw || goog.global.console.time, e = goog.global.console.timeEnd.raw || goog.global.console.timeEnd;
    this.isCapturingTracing_ ? (c.call(goog.global, this.tracingTrackerIntervalId_), this.tracingTrackerIntervalId_ = -1, this.updateTracingProgress_("waiting for chrome:tracing data..."), this.isCapturingTracing_ = !1, this.awaitingTracingData_ = !0, this.sendMessage_({command:"stop_chrome_tracing", tracker_id:this.tracingTrackerId_, include_threads:["CrBrowserMain", "CrGpuMain"]})) : (this.isCapturingTracing_ = !0, this.sendMessage_({command:"start_chrome_tracing"}), this.tracingTrackerIntervalId_ = 
    b.call(goog.global, a, 100), a(), this.updateTracingProgress_("tracing..."));
  }
};
wtf.trace.providers.ChromeDebugProvider.prototype.processChromeTracingData_ = function(a, b) {
  for (var c = {}, d = 0;d < a.length;d++) {
    var e = a[d], f = e.name, g = "";
    switch(f) {
      case "CrBrowserMain":
        g = wtf.data.ZoneType.NATIVE_BROWSER;
        break;
      case "CrGpuMain":
        g = wtf.data.ZoneType.NATIVE_GPU;
        break;
      default:
        g = wtf.data.ZoneType.NATIVE_SCRIPT;
    }
    c[e.id] = {zone:wtf.trace.createZone(f, g, ""), openScopes:[]};
  }
  b.length && wtf.trace.mark("tracing", void 0, b[0][2] / 1E3 - 0);
  for (d = 0;d < b.length;d++) {
    e = b[d];
    g = e[2] / 1E3 - 0;
    f = c[e[1]];
    wtf.trace.pushZone(f.zone);
    switch(e[0]) {
      case 0:
        var k = wtf.trace.enterScope(e[3], g);
        f.openScopes.push(k);
        for (k = 4;k < e.length;k += 2) {
          g = e[2] / 1E3 - 0, f = wtf.data.Variable.santizeName(e[k]), wtf.trace.appendScopeData(f, e[k + 1], g);
        }
        break;
      case 1:
        k = f.openScopes.pop();
        wtf.trace.leaveScope(k, void 0, g);
        break;
      case 2:
        wtf.trace.timeStamp(e[3], g);
    }
    wtf.trace.popZone();
  }
  for (var m in c) {
    for (f = c[m];f.openScopes.length;) {
      wtf.trace.leaveScope(f.openScopes.pop());
    }
  }
  b.length && wtf.trace.mark("", void 0, b[b.length - 1][2] / 1E3 - 0);
};
// Input 180
wtf.trace.providers.ConsoleProvider = function(a) {
  wtf.trace.Provider.call(this, a);
  this.injectConsoleProfiling_();
};
goog.inherits(wtf.trace.providers.ConsoleProvider, wtf.trace.Provider);
wtf.trace.providers.ConsoleProvider.prototype.injectConsoleProfiling_ = function() {
  var a = goog.global.console;
  if (a) {
    var b = {};
    this.injectFunction(a, "time", function(a) {
      b[a] = wtf.trace.beginTimeRange(a);
    });
    this.injectFunction(a, "timeEnd", function(a) {
      var d = b[a];
      delete b[a];
      wtf.trace.endTimeRange(d);
    });
    a.timeStamp && this.injectFunction(a, "timeStamp", function(a) {
      wtf.trace.timeStamp(a);
    });
  }
};
// Input 181
wtf.trace.providers.DomProvider = function(a) {
  wtf.trace.Provider.call(this, a);
  if (goog.global.document && a.getNumber("wtf.trace.provider.dom", 1)) {
    this.includeEventArgs_ = a.getBoolean("wtf.trace.provider.dom.eventArgs", !1);
    try {
      this.injectWindow_();
    } catch (b) {
    }
    try {
      this.injectDocument_();
    } catch (c) {
    }
    try {
      this.injectElements_();
    } catch (d) {
    }
  }
};
goog.inherits(wtf.trace.providers.DomProvider, wtf.trace.Provider);
wtf.trace.providers.DomProvider.prototype.getSettingsSectionConfigs = function() {
  return[{title:"DOM", widgets:[{type:"checkbox", key:"wtf.trace.provider.dom", title:"Enabled", "default":!0}, {type:"checkbox", key:"wtf.trace.provider.dom.eventArgs", title:"Include event arguments", "default":!1}]}];
};
wtf.trace.providers.DomProvider.prototype.injectWindow_ = function() {
  this.injectElement_("Window", goog.global.Window, Window.prototype);
};
wtf.trace.providers.DomProvider.prototype.injectDocument_ = function() {
  this.injectElement_("Document", goog.global.Document, document);
};
wtf.trace.providers.DomProvider.prototype.injectElements_ = function() {
  var a = {HTMLAnchorElement:"a", HTMLAreaElement:"area", HTMLAudioElement:"audio", HTMLBRElement:"br", HTMLBaseElement:"base", HTMLBaseFontElement:"basefont", HTMLBodyElement:"body", HTMLButtonElement:"button", HTMLCanvasElement:"canvas", HTMLContentElement:"content", HTMLDListElement:"dl", HTMLDirectoryElement:"dir", HTMLDivElement:"div", HTMLEmbedElement:"embed", HTMLFieldSetElement:"fieldset", HTMLFontElement:"font", HTMLFormElement:"form", HTMLFrameElement:"frame", HTMLFrameSetElement:"frameset", 
  HTMLHRElement:"hr", HTMLHeadElement:"head", HTMLHeadingElement:"h1", HTMLHtmlElement:"html", HTMLIFrameElement:"iframe", HTMLImageElement:"img", HTMLInputElement:"input", HTMLKeygenElement:"keygen", HTMLLIElement:"li", HTMLLabelElement:"label", HTMLLegendElement:"legend", HTMLLinkElement:"link", HTMLMapElement:"map", HTMLMarqueeElement:"marquee", HTMLMediaElement:"media", HTMLMenuElement:"menu", HTMLMetaElement:"meta", HTMLMeterElement:"meter", HTMLModElement:"ins", HTMLOListElement:"ol", HTMLObjectElement:"object", 
  HTMLOptGroupElement:"optgroup", HTMLOptionElement:"option", HTMLOutputElement:"output", HTMLParagraphElement:"p", HTMLPreElement:"pre", HTMLProgressElement:"progress", HTMLQuoteElement:"quote", HTMLScriptElement:"script", HTMLSelectElement:"select", HTMLSourceElement:"source", HTMLSpanElement:"span", HTMLStyleElement:"style", HTMLTableCaptionElement:"caption", HTMLTableCellElement:"td", HTMLTableColElement:"col", HTMLTableElement:"table", HTMLTableRowElement:"tr", HTMLTableSectionElement:"thead", 
  HTMLTextAreaElement:"textarea", HTMLTitleElement:"title", HTMLTrackElement:"track", HTMLUListElement:"ul", HTMLUnknownElement:"UNKNOWN", HTMLVideoElement:"video"}, b;
  for (b in a) {
    var c = a[b], d = goog.global[b];
    if (d) {
      c = document.createElement(c);
      try {
        this.injectElement_(b, d, c);
      } catch (e) {
      }
    }
  }
};
wtf.trace.providers.DomProvider.prototype.injectElement_ = function(a, b, c) {
  b = b.prototype;
  c = wtf.trace.eventtarget.getEventNames(c);
  c.length || (c = wtf.trace.eventtarget.getEventNames(b));
  var d;
  if (this.includeEventArgs_) {
    d = wtf.data.webidl.getAllEvents(a, c);
  } else {
    d = {};
    for (var e = 0;e < c.length;e++) {
      d[c[e]] = null;
    }
  }
  a = wtf.trace.eventtarget.createDescriptor(a, d);
  wtf.trace.eventtarget.setDescriptor(b, a);
  wtf.trace.eventtarget.mixin(a, b);
  wtf.trace.eventtarget.setEventProperties(a, b);
};
// Input 182
wtf.trace.providers.FirefoxDebugProvider = function(a, b) {
  wtf.trace.Provider.call(this, b);
  this.available_ = !1;
  b.getNumber("wtf.trace.provider.firefoxDebug", 1) && b.getBoolean("wtf.trace.provider.firefoxDebug.present", !1) && (this.eventDispatch_ = {}, this.setupEventDispatch_(), this.nextRequestId_ = 0, this.pendingRequests_ = {}, (this.extensionChannel_ = wtf.ipc.getWindowMessageChannel(window)) && this.extensionChannel_.addListener(wtf.ipc.Channel.EventType.MESSAGE, this.extensionMessage_, this), this.available_ = !!this.extensionChannel_);
};
goog.inherits(wtf.trace.providers.FirefoxDebugProvider, wtf.trace.Provider);
wtf.trace.providers.FirefoxDebugProvider.prototype.isAvailable = function() {
  return this.available_;
};
wtf.trace.providers.FirefoxDebugProvider.prototype.getSettingsSectionConfigs = function() {
  return[{title:"Firefox Debugging", widgets:[{type:"checkbox", key:"wtf.trace.provider.firefoxDebug", title:"Enabled", "default":!0}]}];
};
wtf.trace.providers.FirefoxDebugProvider.prototype.sendMessage_ = function(a) {
  this.extensionChannel_ && this.extensionChannel_.postMessage(a);
};
wtf.trace.providers.FirefoxDebugProvider.prototype.extensionMessage_ = function(a) {
  var b = wtf.trace.enterTracingScope();
  a = goog.global.JSON.parse(a);
  if (a.command) {
    switch(a.command) {
      case "debugger_data":
        this.processDebuggerRecords_(a.records);
        var c = this.pendingRequests_[a.request_id];
        c && (delete this.pendingRequests_[a.request_id], c.callback(null));
    }
    wtf.trace.leaveScope(b);
  }
};
wtf.trace.providers.FirefoxDebugProvider.prototype.processDebuggerRecords_ = function(a) {
  for (var b = 0;b < a.length;b++) {
    var c = a[b], d = this.eventDispatch_[c[0]];
    d && d(c);
  }
};
wtf.trace.providers.FirefoxDebugProvider.prototype.setupEventDispatch_ = function() {
  var a = wtf.timebase(), b = 0, c = wtf.trace.events.createScope("javascript#gc(uint32 run, ascii reason)", wtf.data.EventFlag.SYSTEM_TIME);
  this.eventDispatch_.gc = function(d) {
    var e = goog.global.JSON.parse(d[1]);
    d = b++;
    for (var e = e.slices, f = 0;f < e.length;f++) {
      var g = e[f], k = g.end_timestamp / 1E3 - a, g = c(d, g.reason, g.start_timestamp / 1E3 - a);
      wtf.trace.leaveScope(g, void 0, k);
    }
  };
};
wtf.trace.providers.FirefoxDebugProvider.prototype.gatherData = function() {
  var a = new goog.async.Deferred, b = this.nextRequestId_++;
  this.pendingRequests_[b] = a;
  this.sendMessage_({command:"get_debugger_data", request_id:b});
  return a;
};
wtf.trace.providers.FirefoxDebugProvider.prototype.resetData = function() {
  this.sendMessage_({command:"clear_debugger_data"});
};
// Input 183
wtf.trace.providers.ImageProvider = function(a) {
  wtf.trace.Provider.call(this, a);
  goog.global.Image && a.getNumber("wtf.trace.provider.image", 1) && this.injectImage_();
};
goog.inherits(wtf.trace.providers.ImageProvider, wtf.trace.Provider);
wtf.trace.providers.ImageProvider.prototype.getSettingsSectionConfigs = function() {
  return[{title:"Images", widgets:[{type:"checkbox", key:"wtf.trace.provider.image", title:"Enabled", "default":!0}]}];
};
wtf.trace.providers.ImageProvider.prototype.injectImage_ = function() {
  var a = Image.prototype, b = new Image, b = wtf.trace.eventtarget.getEventNames(b);
  b.length || (b = wtf.trace.eventtarget.getEventNames(a));
  for (var c = {}, d = 0;d < b.length;d++) {
    c[b[d]] = null;
  }
  b = wtf.trace.eventtarget.createDescriptor("Image", c);
  wtf.trace.eventtarget.setDescriptor(a, b);
  wtf.trace.eventtarget.mixin(b, a);
  wtf.trace.eventtarget.setEventProperties(b, a);
};
// Input 184
wtf.math = {};
wtf.math.MersenneTwister = function(a) {
  this.mt_ = new Int32Array(wtf.math.MersenneTwister.N_);
  this.mti_ = wtf.math.MersenneTwister.N_ + 1;
  this.initialize_(a);
};
wtf.math.MersenneTwister.N_ = 624;
wtf.math.MersenneTwister.M_ = 397;
wtf.math.MersenneTwister.MAG01_ = new Int32Array([0, 2567483615]);
wtf.math.MersenneTwister.UPPER_MASK_ = 2147483648;
wtf.math.MersenneTwister.LOWER_MASK_ = 2147483647;
wtf.math.MersenneTwister.prototype.initialize_ = function(a) {
  var b = this.mt_;
  b[0] = a >>> 0;
  for (this.mti_ = 1;this.mti_ < wtf.math.MersenneTwister.N_;this.mti_++) {
    a = b[this.mti_ - 1] ^ b[this.mti_ - 1] >>> 30, b[this.mti_] = (1812433253 * ((a & 4294901760) >>> 16) << 16) + 1812433253 * (a & 65535) + this.mti_, b[this.mti_] >>>= 0;
  }
};
wtf.math.MersenneTwister.prototype.randomInt32 = function() {
  var a = this.mt_, b = wtf.math.MersenneTwister.N_, c = wtf.math.MersenneTwister.M_, d = wtf.math.MersenneTwister.MAG01_;
  if (this.mti_ >= b) {
    this.mti_ == b + 1 && this.initialize_(5489);
    for (var e = 0;e < b - c;e++) {
      var f = a[e] & wtf.math.MersenneTwister.UPPER_MASK_ | a[e + 1] & wtf.math.MersenneTwister.LOWER_MASK_;
      a[e] = a[e + c] ^ f >>> 1 ^ d[f & 1];
    }
    for (;e < b - 1;e++) {
      f = a[e] & wtf.math.MersenneTwister.UPPER_MASK_ | a[e + 1] & wtf.math.MersenneTwister.LOWER_MASK_, a[e] = a[e + (c - b)] ^ f >>> 1 ^ d[f & 1];
    }
    f = a[b - 1] & wtf.math.MersenneTwister.UPPER_MASK_ | a[0] & wtf.math.MersenneTwister.LOWER_MASK_;
    a[b - 1] = a[c - 1] ^ f >>> 1 ^ d[f & 1];
    this.mti_ = 0;
  }
  f = a[this.mti_++];
  f ^= f >>> 11;
  f ^= f << 7 & 2636928640;
  f ^= f << 15 & 4022730752;
  return(f ^ f >>> 18) >>> 0;
};
wtf.math.MersenneTwister.prototype.random = function() {
  return this.randomInt32() * (1 / 4294967296);
};
// Input 185
wtf.trace.providers.ReplayProvider = function(a, b) {
  wtf.trace.Provider.call(this, b);
  goog.asserts.assert(b.getBoolean("wtf.trace.replayable", !1));
  goog.asserts.assert(wtf.util.FunctionBuilder.isSupported());
  if (!wtf.util.FunctionBuilder.isSupported()) {
    throw Error('Replay not supported; no "new Function()" support available.');
  }
  this.functionBuilder_ = new wtf.util.FunctionBuilder;
  this.randomSeedEvent_ = wtf.trace.events.createInstance("wtf.replay#randomSeed(uint32 value)", wtf.trace.providers.ReplayProvider.DEFAULT_FLAGS_);
  this.injectDate_();
  this.injectEvents_();
  a.addListener(this);
};
goog.inherits(wtf.trace.providers.ReplayProvider, wtf.trace.Provider);
wtf.trace.providers.ReplayProvider.HIDE_EVENTS_ = !1;
wtf.trace.providers.ReplayProvider.DEFAULT_FLAGS_ = wtf.trace.providers.ReplayProvider.HIDE_EVENTS_ ? wtf.data.EventFlag.INTERNAL : 0;
wtf.trace.providers.ReplayProvider.prototype.sessionStarted = function(a) {
  this.initializeRandom_();
};
wtf.trace.providers.ReplayProvider.prototype.sessionStopped = function(a) {
};
wtf.trace.providers.ReplayProvider.prototype.requestSnapshots = goog.nullFunction;
wtf.trace.providers.ReplayProvider.prototype.reset = goog.nullFunction;
wtf.trace.providers.ReplayProvider.prototype.initializeRandom_ = function() {
  var a = Date.now();
  this.randomSeedEvent_(a);
  var b = new wtf.math.MersenneTwister(a);
  goog.global.Math.random = function() {
    return b.random();
  };
};
wtf.trace.providers.ReplayProvider.prototype.injectDate_ = function() {
  var a = wtf.trace.events.createInstance("wtf.replay#advanceTime(uint32 value)", wtf.trace.providers.ReplayProvider.DEFAULT_FLAGS_), b = goog.global.Date, c = function() {
    return arguments.length ? 1 == arguments.length ? new b(arguments[0]) : new b(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6]) : new b(c.now());
  };
  c.prototype = b;
  this.injectFunction(goog.global, "Date", c);
  c.parse = b.parse;
  c.UTC = b.UTC;
  c.now = function() {
    var c = b.now();
    a(c);
    return c;
  };
  c.now.raw = function() {
    return b.now();
  };
};
wtf.trace.providers.ReplayProvider.prototype.injectEvents_ = function() {
  var a = ["Document", "Window"];
  goog.array.extend(a, wtf.data.webidl.DOM_OBJECTS);
  a = wtf.data.webidl.getAllEventTypes(a);
  this.injectCaptureEvents_(goog.global, a);
};
wtf.trace.providers.ReplayProvider.prototype.injectCaptureEvents_ = function(a, b) {
  for (var c in b) {
    var d = this.buildListener_(c, b[c]);
    a.addEventListener(c, wtf.trace.util.ignoreListener(d), !0);
  }
};
wtf.trace.providers.ReplayProvider.prototype.buildListener_ = function(a, b) {
  var c = wtf.data.webidl.getEventSignature("wtf.replay.dispatch", a, b), d = wtf.trace.events.createInstance(c, wtf.trace.providers.ReplayProvider.DEFAULT_FLAGS_), c = this.functionBuilder_;
  c.begin();
  c.addScopeVariable("getElementPath", wtf.util.getElementXPath);
  c.addScopeVariable("recordEvent", d);
  c.addArgument("e");
  c.append("  recordEvent(");
  for (var d = wtf.data.webidl.getEventAttributes(b), e = 0;e < d.length;e++) {
    var f = d[e].name, g = "    ";
    switch(d[e].type) {
      case "dompath":
        g += "getElementPath(e." + f + ")";
        break;
      default:
        g += "e." + f;
    }
    e < d.length - 1 && (g += ", ");
    c.append(g);
  }
  c.append("    );");
  return c.end("wtf.replay.dispatch#" + a + ":capture");
};
// Input 186
wtf.trace.providers.TimingProvider = function(a) {
  wtf.trace.Provider.call(this, a);
  this.injectTimeouts_();
  this.injectSetImmediate_();
  this.injectRequestAnimationFrame_();
};
goog.inherits(wtf.trace.providers.TimingProvider, wtf.trace.Provider);
wtf.trace.providers.TimingProvider.prototype.injectTimeouts_ = function() {
  var a = wtf.trace.events.createInstance("window#setTimeout(uint32 delay, uint32 timeoutId)"), b = wtf.trace.events.createScope("window#setTimeout:callback(uint32 timeoutId)"), c = goog.global.setTimeout, d = {};
  this.injectFunction(goog.global, "setTimeout", function(e, f) {
    var g = Array.prototype.slice.call(arguments, 2), k = [-1], l, m = c.call(goog.global, function() {
      var a = b(k[0]);
      wtf.trace.extendFlow(l, "callback");
      try {
        e && (goog.isString(e) ? eval(e) : e.apply(goog.global, g));
      } finally {
        delete d[k[0]], wtf.trace.terminateFlow(l), wtf.trace.leaveScope(a);
      }
    }, f);
    k[0] = m;
    a(f, m);
    l = wtf.trace.branchFlow("window#setTimeout");
    d[m] = l;
    return m;
  });
  var e = wtf.trace.events.createInstance("window#clearTimeout(uint32 timeoutId)"), f = goog.global.clearTimeout;
  this.injectFunction(goog.global, "clearTimeout", function(a) {
    f.call(goog.global, a);
    var b = d[a];
    b && (wtf.trace.terminateFlow(b), delete d[a]);
    e(a);
  });
  var g = wtf.trace.events.createInstance("window#setInterval(uint32 delay, uint32 intervalId)"), k = wtf.trace.events.createScope("window#setInterval:callback(uint32 intervalId)"), m = goog.global.setInterval, l = {};
  this.injectFunction(goog.global, "setInterval", function(a, b) {
    var c = Array.prototype.slice.call(arguments, 2), d = [-1], e, f = m.call(goog.global, function() {
      var b = k(d[0]);
      wtf.trace.extendFlow(e, "callback");
      try {
        a && (goog.isString(a) ? eval(a) : a.apply(goog.global, c));
      } finally {
        wtf.trace.leaveScope(b);
      }
    }, b);
    d[0] = f;
    g(b, f);
    e = wtf.trace.branchFlow("window#setInterval");
    l[f] = e;
    return f;
  });
  var p = wtf.trace.events.createInstance("window#clearInterval(uint32 intervalId)"), s = goog.global.clearInterval;
  this.injectFunction(goog.global, "clearInterval", function(a) {
    s.call(goog.global, a);
    var b = l[a];
    b && (wtf.trace.terminateFlow(b), delete l[a]);
    p(a);
  });
};
wtf.trace.providers.TimingProvider.prototype.injectSetImmediate_ = function() {
  var a = goog.global.msSetImmediate;
  if (a) {
    var b = wtf.trace.events.createInstance("window#setImmediate(uint32 immediateId)"), c = wtf.trace.events.createScope("window#setImmediate:callback(uint32 immediateId)"), d = {};
    this.injectFunction(goog.global, "msSetImmediate", function(e) {
      var f = Array.prototype.slice.call(arguments, 2), m = [-1], l, p = a.call(goog.global, function() {
        var a = c(m[0]);
        wtf.trace.extendFlow(l, "callback");
        try {
          e && (goog.isString(e) ? eval(e) : e.apply(goog.global, f));
        } finally {
          delete d[m[0]], wtf.trace.terminateFlow(l), wtf.trace.leaveScope(a);
        }
      });
      m[0] = p;
      b(p);
      l = wtf.trace.branchFlow("window#setImmediate");
      d[p] = l;
      return p;
    });
    var e = wtf.trace.events.createInstance("window#clearImmediate(uint32 immediateId)"), f = goog.global.msClearInterval;
    this.injectFunction(goog.global, "msClearImmediate", function(a) {
      f.call(goog.global, a);
      var b = d[a];
      b && (wtf.trace.terminateFlow(b), delete d[a]);
      e(a);
    });
  }
};
wtf.trace.providers.TimingProvider.RAF_NAMES_ = "requestAnimationFrame cancelAnimationFrame mozRequestAnimationFrame mozCancelAnimationFrame msRequestAnimationFrame msCancelAnimationFrame oRequestAnimationFrame oCancelAnimationFrame webkitRequestAnimationFrame webkitCancelAnimationFrame".split(" ");
wtf.trace.providers.TimingProvider.prototype.injectRequestAnimationFrame_ = function() {
  for (var a = {frameStart:wtf.trace.events.createInstance("wtf.timing#frameStart(uint32 number)", wtf.data.EventFlag.INTERNAL), frameEnd:wtf.trace.events.createInstance("wtf.timing#frameEnd(uint32 number)", wtf.data.EventFlag.INTERNAL), requestAnimationFrame:wtf.trace.events.createInstance("window#requestAnimationFrame(uint32 handle)"), requestAnimationFrameCallback:wtf.trace.events.createScope("window#requestAnimationFrame:callback(uint32 handle)"), cancelAnimationFrame:wtf.trace.events.createInstance("window#cancelAnimationFrame(uint32 handle)")}, 
  b = wtf.trace.providers.TimingProvider.RAF_NAMES_, c = 0;c < b.length;c += 2) {
    var d = b[c], e = b[c + 1];
    goog.global[d] && this.injectRequestAnimationFrameFn_(d, e, a);
  }
};
wtf.trace.providers.TimingProvider.prototype.injectRequestAnimationFrameFn_ = function(a, b, c) {
  var d = 0, e = [], f = [], g = {}, k = goog.global[a];
  this.injectFunction(goog.global, a, function(a) {
    var b = [-1], m, t = k.call(goog.global, function() {
      var k = wtf.now();
      f.length || (d++, f.push.apply(f, e), e.length = 0, c.frameStart(d, k));
      k = c.requestAnimationFrameCallback(b[0], k);
      wtf.trace.extendFlow(m, "callback");
      try {
        a.apply(this, arguments);
      } finally {
        delete g[b[0]], wtf.trace.terminateFlow(m), wtf.trace.leaveScope(k), f[f.length - 1] == b[0] && (k = wtf.now(), c.frameEnd(d, k), f.length = 0);
      }
    });
    b[0] = t;
    e.push(t);
    c.requestAnimationFrame(t);
    m = wtf.trace.branchFlow("window#requestAnimationFrame");
    g[t] = m;
    return t;
  });
  var m = goog.global[b];
  a = function(a) {
    goog.array.remove(e, a);
    m.call(goog.global, a);
    var b = g[a];
    b && (wtf.trace.terminateFlow(b), delete g[a]);
    c.cancelAnimationFrame(a);
  };
  m && this.injectFunction(goog.global, b, a);
};
// Input 187
goog.webgl = {};
goog.webgl.DEPTH_BUFFER_BIT = 256;
goog.webgl.STENCIL_BUFFER_BIT = 1024;
goog.webgl.COLOR_BUFFER_BIT = 16384;
goog.webgl.POINTS = 0;
goog.webgl.LINES = 1;
goog.webgl.LINE_LOOP = 2;
goog.webgl.LINE_STRIP = 3;
goog.webgl.TRIANGLES = 4;
goog.webgl.TRIANGLE_STRIP = 5;
goog.webgl.TRIANGLE_FAN = 6;
goog.webgl.ZERO = 0;
goog.webgl.ONE = 1;
goog.webgl.SRC_COLOR = 768;
goog.webgl.ONE_MINUS_SRC_COLOR = 769;
goog.webgl.SRC_ALPHA = 770;
goog.webgl.ONE_MINUS_SRC_ALPHA = 771;
goog.webgl.DST_ALPHA = 772;
goog.webgl.ONE_MINUS_DST_ALPHA = 773;
goog.webgl.DST_COLOR = 774;
goog.webgl.ONE_MINUS_DST_COLOR = 775;
goog.webgl.SRC_ALPHA_SATURATE = 776;
goog.webgl.FUNC_ADD = 32774;
goog.webgl.BLEND_EQUATION = 32777;
goog.webgl.BLEND_EQUATION_RGB = 32777;
goog.webgl.BLEND_EQUATION_ALPHA = 34877;
goog.webgl.FUNC_SUBTRACT = 32778;
goog.webgl.FUNC_REVERSE_SUBTRACT = 32779;
goog.webgl.BLEND_DST_RGB = 32968;
goog.webgl.BLEND_SRC_RGB = 32969;
goog.webgl.BLEND_DST_ALPHA = 32970;
goog.webgl.BLEND_SRC_ALPHA = 32971;
goog.webgl.CONSTANT_COLOR = 32769;
goog.webgl.ONE_MINUS_CONSTANT_COLOR = 32770;
goog.webgl.CONSTANT_ALPHA = 32771;
goog.webgl.ONE_MINUS_CONSTANT_ALPHA = 32772;
goog.webgl.BLEND_COLOR = 32773;
goog.webgl.ARRAY_BUFFER = 34962;
goog.webgl.ELEMENT_ARRAY_BUFFER = 34963;
goog.webgl.ARRAY_BUFFER_BINDING = 34964;
goog.webgl.ELEMENT_ARRAY_BUFFER_BINDING = 34965;
goog.webgl.STREAM_DRAW = 35040;
goog.webgl.STATIC_DRAW = 35044;
goog.webgl.DYNAMIC_DRAW = 35048;
goog.webgl.BUFFER_SIZE = 34660;
goog.webgl.BUFFER_USAGE = 34661;
goog.webgl.CURRENT_VERTEX_ATTRIB = 34342;
goog.webgl.FRONT = 1028;
goog.webgl.BACK = 1029;
goog.webgl.FRONT_AND_BACK = 1032;
goog.webgl.CULL_FACE = 2884;
goog.webgl.BLEND = 3042;
goog.webgl.DITHER = 3024;
goog.webgl.STENCIL_TEST = 2960;
goog.webgl.DEPTH_TEST = 2929;
goog.webgl.SCISSOR_TEST = 3089;
goog.webgl.POLYGON_OFFSET_FILL = 32823;
goog.webgl.SAMPLE_ALPHA_TO_COVERAGE = 32926;
goog.webgl.SAMPLE_COVERAGE = 32928;
goog.webgl.NO_ERROR = 0;
goog.webgl.INVALID_ENUM = 1280;
goog.webgl.INVALID_VALUE = 1281;
goog.webgl.INVALID_OPERATION = 1282;
goog.webgl.OUT_OF_MEMORY = 1285;
goog.webgl.CW = 2304;
goog.webgl.CCW = 2305;
goog.webgl.LINE_WIDTH = 2849;
goog.webgl.ALIASED_POINT_SIZE_RANGE = 33901;
goog.webgl.ALIASED_LINE_WIDTH_RANGE = 33902;
goog.webgl.CULL_FACE_MODE = 2885;
goog.webgl.FRONT_FACE = 2886;
goog.webgl.DEPTH_RANGE = 2928;
goog.webgl.DEPTH_WRITEMASK = 2930;
goog.webgl.DEPTH_CLEAR_VALUE = 2931;
goog.webgl.DEPTH_FUNC = 2932;
goog.webgl.STENCIL_CLEAR_VALUE = 2961;
goog.webgl.STENCIL_FUNC = 2962;
goog.webgl.STENCIL_FAIL = 2964;
goog.webgl.STENCIL_PASS_DEPTH_FAIL = 2965;
goog.webgl.STENCIL_PASS_DEPTH_PASS = 2966;
goog.webgl.STENCIL_REF = 2967;
goog.webgl.STENCIL_VALUE_MASK = 2963;
goog.webgl.STENCIL_WRITEMASK = 2968;
goog.webgl.STENCIL_BACK_FUNC = 34816;
goog.webgl.STENCIL_BACK_FAIL = 34817;
goog.webgl.STENCIL_BACK_PASS_DEPTH_FAIL = 34818;
goog.webgl.STENCIL_BACK_PASS_DEPTH_PASS = 34819;
goog.webgl.STENCIL_BACK_REF = 36003;
goog.webgl.STENCIL_BACK_VALUE_MASK = 36004;
goog.webgl.STENCIL_BACK_WRITEMASK = 36005;
goog.webgl.VIEWPORT = 2978;
goog.webgl.SCISSOR_BOX = 3088;
goog.webgl.COLOR_CLEAR_VALUE = 3106;
goog.webgl.COLOR_WRITEMASK = 3107;
goog.webgl.UNPACK_ALIGNMENT = 3317;
goog.webgl.PACK_ALIGNMENT = 3333;
goog.webgl.MAX_TEXTURE_SIZE = 3379;
goog.webgl.MAX_VIEWPORT_DIMS = 3386;
goog.webgl.SUBPIXEL_BITS = 3408;
goog.webgl.RED_BITS = 3410;
goog.webgl.GREEN_BITS = 3411;
goog.webgl.BLUE_BITS = 3412;
goog.webgl.ALPHA_BITS = 3413;
goog.webgl.DEPTH_BITS = 3414;
goog.webgl.STENCIL_BITS = 3415;
goog.webgl.POLYGON_OFFSET_UNITS = 10752;
goog.webgl.POLYGON_OFFSET_FACTOR = 32824;
goog.webgl.TEXTURE_BINDING_2D = 32873;
goog.webgl.SAMPLE_BUFFERS = 32936;
goog.webgl.SAMPLES = 32937;
goog.webgl.SAMPLE_COVERAGE_VALUE = 32938;
goog.webgl.SAMPLE_COVERAGE_INVERT = 32939;
goog.webgl.COMPRESSED_TEXTURE_FORMATS = 34467;
goog.webgl.DONT_CARE = 4352;
goog.webgl.FASTEST = 4353;
goog.webgl.NICEST = 4354;
goog.webgl.GENERATE_MIPMAP_HINT = 33170;
goog.webgl.BYTE = 5120;
goog.webgl.UNSIGNED_BYTE = 5121;
goog.webgl.SHORT = 5122;
goog.webgl.UNSIGNED_SHORT = 5123;
goog.webgl.INT = 5124;
goog.webgl.UNSIGNED_INT = 5125;
goog.webgl.FLOAT = 5126;
goog.webgl.DEPTH_COMPONENT = 6402;
goog.webgl.ALPHA = 6406;
goog.webgl.RGB = 6407;
goog.webgl.RGBA = 6408;
goog.webgl.LUMINANCE = 6409;
goog.webgl.LUMINANCE_ALPHA = 6410;
goog.webgl.UNSIGNED_SHORT_4_4_4_4 = 32819;
goog.webgl.UNSIGNED_SHORT_5_5_5_1 = 32820;
goog.webgl.UNSIGNED_SHORT_5_6_5 = 33635;
goog.webgl.FRAGMENT_SHADER = 35632;
goog.webgl.VERTEX_SHADER = 35633;
goog.webgl.MAX_VERTEX_ATTRIBS = 34921;
goog.webgl.MAX_VERTEX_UNIFORM_VECTORS = 36347;
goog.webgl.MAX_VARYING_VECTORS = 36348;
goog.webgl.MAX_COMBINED_TEXTURE_IMAGE_UNITS = 35661;
goog.webgl.MAX_VERTEX_TEXTURE_IMAGE_UNITS = 35660;
goog.webgl.MAX_TEXTURE_IMAGE_UNITS = 34930;
goog.webgl.MAX_FRAGMENT_UNIFORM_VECTORS = 36349;
goog.webgl.SHADER_TYPE = 35663;
goog.webgl.DELETE_STATUS = 35712;
goog.webgl.LINK_STATUS = 35714;
goog.webgl.VALIDATE_STATUS = 35715;
goog.webgl.ATTACHED_SHADERS = 35717;
goog.webgl.ACTIVE_UNIFORMS = 35718;
goog.webgl.ACTIVE_ATTRIBUTES = 35721;
goog.webgl.SHADING_LANGUAGE_VERSION = 35724;
goog.webgl.CURRENT_PROGRAM = 35725;
goog.webgl.NEVER = 512;
goog.webgl.LESS = 513;
goog.webgl.EQUAL = 514;
goog.webgl.LEQUAL = 515;
goog.webgl.GREATER = 516;
goog.webgl.NOTEQUAL = 517;
goog.webgl.GEQUAL = 518;
goog.webgl.ALWAYS = 519;
goog.webgl.KEEP = 7680;
goog.webgl.REPLACE = 7681;
goog.webgl.INCR = 7682;
goog.webgl.DECR = 7683;
goog.webgl.INVERT = 5386;
goog.webgl.INCR_WRAP = 34055;
goog.webgl.DECR_WRAP = 34056;
goog.webgl.VENDOR = 7936;
goog.webgl.RENDERER = 7937;
goog.webgl.VERSION = 7938;
goog.webgl.NEAREST = 9728;
goog.webgl.LINEAR = 9729;
goog.webgl.NEAREST_MIPMAP_NEAREST = 9984;
goog.webgl.LINEAR_MIPMAP_NEAREST = 9985;
goog.webgl.NEAREST_MIPMAP_LINEAR = 9986;
goog.webgl.LINEAR_MIPMAP_LINEAR = 9987;
goog.webgl.TEXTURE_MAG_FILTER = 10240;
goog.webgl.TEXTURE_MIN_FILTER = 10241;
goog.webgl.TEXTURE_WRAP_S = 10242;
goog.webgl.TEXTURE_WRAP_T = 10243;
goog.webgl.TEXTURE_2D = 3553;
goog.webgl.TEXTURE = 5890;
goog.webgl.TEXTURE_CUBE_MAP = 34067;
goog.webgl.TEXTURE_BINDING_CUBE_MAP = 34068;
goog.webgl.TEXTURE_CUBE_MAP_POSITIVE_X = 34069;
goog.webgl.TEXTURE_CUBE_MAP_NEGATIVE_X = 34070;
goog.webgl.TEXTURE_CUBE_MAP_POSITIVE_Y = 34071;
goog.webgl.TEXTURE_CUBE_MAP_NEGATIVE_Y = 34072;
goog.webgl.TEXTURE_CUBE_MAP_POSITIVE_Z = 34073;
goog.webgl.TEXTURE_CUBE_MAP_NEGATIVE_Z = 34074;
goog.webgl.MAX_CUBE_MAP_TEXTURE_SIZE = 34076;
goog.webgl.TEXTURE0 = 33984;
goog.webgl.TEXTURE1 = 33985;
goog.webgl.TEXTURE2 = 33986;
goog.webgl.TEXTURE3 = 33987;
goog.webgl.TEXTURE4 = 33988;
goog.webgl.TEXTURE5 = 33989;
goog.webgl.TEXTURE6 = 33990;
goog.webgl.TEXTURE7 = 33991;
goog.webgl.TEXTURE8 = 33992;
goog.webgl.TEXTURE9 = 33993;
goog.webgl.TEXTURE10 = 33994;
goog.webgl.TEXTURE11 = 33995;
goog.webgl.TEXTURE12 = 33996;
goog.webgl.TEXTURE13 = 33997;
goog.webgl.TEXTURE14 = 33998;
goog.webgl.TEXTURE15 = 33999;
goog.webgl.TEXTURE16 = 34E3;
goog.webgl.TEXTURE17 = 34001;
goog.webgl.TEXTURE18 = 34002;
goog.webgl.TEXTURE19 = 34003;
goog.webgl.TEXTURE20 = 34004;
goog.webgl.TEXTURE21 = 34005;
goog.webgl.TEXTURE22 = 34006;
goog.webgl.TEXTURE23 = 34007;
goog.webgl.TEXTURE24 = 34008;
goog.webgl.TEXTURE25 = 34009;
goog.webgl.TEXTURE26 = 34010;
goog.webgl.TEXTURE27 = 34011;
goog.webgl.TEXTURE28 = 34012;
goog.webgl.TEXTURE29 = 34013;
goog.webgl.TEXTURE30 = 34014;
goog.webgl.TEXTURE31 = 34015;
goog.webgl.ACTIVE_TEXTURE = 34016;
goog.webgl.REPEAT = 10497;
goog.webgl.CLAMP_TO_EDGE = 33071;
goog.webgl.MIRRORED_REPEAT = 33648;
goog.webgl.FLOAT_VEC2 = 35664;
goog.webgl.FLOAT_VEC3 = 35665;
goog.webgl.FLOAT_VEC4 = 35666;
goog.webgl.INT_VEC2 = 35667;
goog.webgl.INT_VEC3 = 35668;
goog.webgl.INT_VEC4 = 35669;
goog.webgl.BOOL = 35670;
goog.webgl.BOOL_VEC2 = 35671;
goog.webgl.BOOL_VEC3 = 35672;
goog.webgl.BOOL_VEC4 = 35673;
goog.webgl.FLOAT_MAT2 = 35674;
goog.webgl.FLOAT_MAT3 = 35675;
goog.webgl.FLOAT_MAT4 = 35676;
goog.webgl.SAMPLER_2D = 35678;
goog.webgl.SAMPLER_CUBE = 35680;
goog.webgl.VERTEX_ATTRIB_ARRAY_ENABLED = 34338;
goog.webgl.VERTEX_ATTRIB_ARRAY_SIZE = 34339;
goog.webgl.VERTEX_ATTRIB_ARRAY_STRIDE = 34340;
goog.webgl.VERTEX_ATTRIB_ARRAY_TYPE = 34341;
goog.webgl.VERTEX_ATTRIB_ARRAY_NORMALIZED = 34922;
goog.webgl.VERTEX_ATTRIB_ARRAY_POINTER = 34373;
goog.webgl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING = 34975;
goog.webgl.COMPILE_STATUS = 35713;
goog.webgl.LOW_FLOAT = 36336;
goog.webgl.MEDIUM_FLOAT = 36337;
goog.webgl.HIGH_FLOAT = 36338;
goog.webgl.LOW_INT = 36339;
goog.webgl.MEDIUM_INT = 36340;
goog.webgl.HIGH_INT = 36341;
goog.webgl.FRAMEBUFFER = 36160;
goog.webgl.RENDERBUFFER = 36161;
goog.webgl.RGBA4 = 32854;
goog.webgl.RGB5_A1 = 32855;
goog.webgl.RGB565 = 36194;
goog.webgl.DEPTH_COMPONENT16 = 33189;
goog.webgl.STENCIL_INDEX = 6401;
goog.webgl.STENCIL_INDEX8 = 36168;
goog.webgl.DEPTH_STENCIL = 34041;
goog.webgl.RENDERBUFFER_WIDTH = 36162;
goog.webgl.RENDERBUFFER_HEIGHT = 36163;
goog.webgl.RENDERBUFFER_INTERNAL_FORMAT = 36164;
goog.webgl.RENDERBUFFER_RED_SIZE = 36176;
goog.webgl.RENDERBUFFER_GREEN_SIZE = 36177;
goog.webgl.RENDERBUFFER_BLUE_SIZE = 36178;
goog.webgl.RENDERBUFFER_ALPHA_SIZE = 36179;
goog.webgl.RENDERBUFFER_DEPTH_SIZE = 36180;
goog.webgl.RENDERBUFFER_STENCIL_SIZE = 36181;
goog.webgl.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE = 36048;
goog.webgl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME = 36049;
goog.webgl.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL = 36050;
goog.webgl.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE = 36051;
goog.webgl.COLOR_ATTACHMENT0 = 36064;
goog.webgl.DEPTH_ATTACHMENT = 36096;
goog.webgl.STENCIL_ATTACHMENT = 36128;
goog.webgl.DEPTH_STENCIL_ATTACHMENT = 33306;
goog.webgl.NONE = 0;
goog.webgl.FRAMEBUFFER_COMPLETE = 36053;
goog.webgl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT = 36054;
goog.webgl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT = 36055;
goog.webgl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS = 36057;
goog.webgl.FRAMEBUFFER_UNSUPPORTED = 36061;
goog.webgl.FRAMEBUFFER_BINDING = 36006;
goog.webgl.RENDERBUFFER_BINDING = 36007;
goog.webgl.MAX_RENDERBUFFER_SIZE = 34024;
goog.webgl.INVALID_FRAMEBUFFER_OPERATION = 1286;
goog.webgl.UNPACK_FLIP_Y_WEBGL = 37440;
goog.webgl.UNPACK_PREMULTIPLY_ALPHA_WEBGL = 37441;
goog.webgl.CONTEXT_LOST_WEBGL = 37442;
goog.webgl.UNPACK_COLORSPACE_CONVERSION_WEBGL = 37443;
goog.webgl.BROWSER_DEFAULT_WEBGL = 37444;
goog.webgl.HALF_FLOAT_OES = 36193;
goog.webgl.FRAGMENT_SHADER_DERIVATIVE_HINT_OES = 35723;
goog.webgl.VERTEX_ARRAY_BINDING_OES = 34229;
goog.webgl.UNMASKED_VENDOR_WEBGL = 37445;
goog.webgl.UNMASKED_RENDERER_WEBGL = 37446;
goog.webgl.COMPRESSED_RGB_S3TC_DXT1_EXT = 33776;
goog.webgl.COMPRESSED_RGBA_S3TC_DXT1_EXT = 33777;
goog.webgl.COMPRESSED_RGBA_S3TC_DXT3_EXT = 33778;
goog.webgl.COMPRESSED_RGBA_S3TC_DXT5_EXT = 33779;
goog.webgl.TEXTURE_MAX_ANISOTROPY_EXT = 34046;
goog.webgl.MAX_TEXTURE_MAX_ANISOTROPY_EXT = 34047;
// Input 188
wtf.trace.providers.WebGLProvider = function(a, b) {
  wtf.trace.Provider.call(this, b);
  this.nextObjectId_ = this.nextContextId_ = 1;
  this.createdContexts_ = [];
  this.hudButtons_ = [];
  this.locked_ = this.isCapturing_ = !1;
  this.contextRestoreFns_ = [];
  if (goog.global.HTMLCanvasElement && goog.global.WebGLRenderingContext && b.getNumber("wtf.trace.provider.webgl", 0)) {
    this.injectCanvas_();
    var c = b.getBoolean("wtf.trace.provider.webgl.recordAtStartup", !1);
    goog.global.WebGLContextEvent || (goog.global.console.log("Browser does not expose WebGLContextEvent, forcing to record at startup."), c = !0);
    c ? (this.isCapturing_ = !0, this.injectContextType_()) : this.hudButtons_.push({title:"Toggle WebGL Capture", icon:"/assets/icons/gl.png", shortcut:"f4", callback:function() {
      this.toggleCapture_();
    }, scope:this});
  }
};
goog.inherits(wtf.trace.providers.WebGLProvider, wtf.trace.Provider);
wtf.trace.providers.WebGLProvider.prototype.getHudButtons = function() {
  return this.hudButtons_;
};
wtf.trace.providers.WebGLProvider.prototype.getSettingsSectionConfigs = function() {
  return[{title:"WebGL", widgets:[{type:"checkbox", key:"wtf.trace.provider.webgl", title:"Enabled", "default":!1}, {type:"checkbox", key:"wtf.trace.provider.webgl.recordAtStartup", title:"Start recording at page load", "default":!0}, {type:"checkbox", key:"wtf.trace.provider.webgl.replayable", title:"Capture textures/buffers for replay (slow)", "default":!0}, {type:"checkbox", key:"wtf.trace.provider.webgl.embedRemoteImages", title:"Embed remote textures in trace (slow)", "default":!1}]}];
};
wtf.trace.providers.WebGLProvider.prototype.injectCanvas_ = function() {
  for (var a = wtf.trace.events.createScope("HTMLCanvasElement#getContext(ascii contextId, any attributes)"), b = wtf.trace.events.createInstance("wtf.webgl#createContext(uint32 handle, any attributes)", wtf.data.EventFlag.INTERNAL), c = HTMLCanvasElement.prototype.getContext, d = c;d.raw;) {
    d = d.raw;
  }
  var e = this;
  this.injectFunction(HTMLCanvasElement.prototype, "getContext", function(f, g) {
    if (goog.string.startsWith(f, "raw-")) {
      return f = f.substr(4), d.call(this, f, g);
    }
    if ("webgl" == f || "experimental-webgl" == f) {
      var l = a(f, g), p = d.apply(this, arguments);
      if (p && !wtf.trace.providers.WebGLProvider.getHandle(p)) {
        var s = e.nextContextId_++;
        wtf.trace.providers.WebGLProvider.setHandle(p, s);
        e.createdContexts_.push(p);
        b(s, g);
      }
      return wtf.trace.leaveScope(l, p);
    }
    return c.apply(this, arguments);
  });
  var f = WebGLRenderingContext.prototype.getError;
  this.injectFunction(WebGLRenderingContext.prototype, "getError", function() {
    return this.__wtf_forcedLost__ ? goog.webgl.CONTEXT_LOST_WEBGL : f.apply(this, arguments);
  });
  var g = WebGLRenderingContext.prototype.isContextLost;
  this.injectFunction(WebGLRenderingContext.prototype, "isContextLost", function() {
    return this.__wtf_forcedLost__ || g.apply(this, arguments);
  });
};
wtf.trace.providers.WebGLProvider.prototype.toggleCapture_ = function() {
  if (!this.locked_) {
    var a = this.isCapturing_;
    this.isCapturing_ = !a;
    this.locked_ = !0;
    for (var b = 0;b < this.createdContexts_.length;b++) {
      wtf.trace.providers.WebGLProvider.loseContext(this.createdContexts_[b]);
    }
    wtf.timing.setTimeout(500, function() {
      a ? this.restoreContextType_() : this.injectContextType_();
      for (var b = 0;b < this.createdContexts_.length;b++) {
        wtf.trace.providers.WebGLProvider.restoreContext(this.createdContexts_[b]);
      }
      this.locked_ = !1;
    }, this);
  }
};
wtf.trace.providers.WebGLProvider.prototype.injectContextType_ = function() {
  function a(a) {
    if (a != J || a.drawingBufferWidth != C || a.drawingBufferHeight != E) {
      J = a, C = a.drawingBufferWidth, E = a.drawingBufferHeight, Q(q(a), a.drawingBufferWidth, a.drawingBufferHeight);
    }
  }
  function b(b, c, d, e) {
    var f = wtf.data.Variable.parseSignature(d).name, g = wtf.trace.events.createScope(c + "#" + d);
    goog.asserts.assert(g);
    var k = b[f];
    k ? (c = e ? e(k, g) : function() {
      a(this);
      var b = g.apply(null, arguments), c = k.apply(this, arguments);
      return r(b, c);
    }, c.raw = k, b[f] = c, F.push(function() {
      b[f] = k;
    })) : goog.global.console.log(c + " is missing " + f);
  }
  function c(a, c) {
    b(WebGLRenderingContext.prototype, "WebGLRenderingContext", a, c);
  }
  function d(a) {
    return a instanceof Uint8Array ? a : a.buffer.byteLength == a.byteLength ? new Uint8Array(a.buffer) : new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
  }
  function e(c, d) {
    function e(a, c) {
      b(d, "ANGLEInstancedArrays", a, c);
    }
    e("drawArraysInstancedANGLE(uint32 mode, uint32 first, int32 count, int32 primcount)", function(b, d) {
      return function() {
        a(c);
        var e = d.apply(this, arguments);
        return r(e, b.apply(this, arguments));
      };
    });
    e("drawElementsInstancedANGLE(uint32 mode, int32 count, uint32 type, uint32 offset, int32 primcount)", function(b, d) {
      return function() {
        a(c);
        var e = d.apply(this, arguments);
        return r(e, b.apply(this, arguments));
      };
    });
    e("vertexAttribDivisorANGLE(uint32 index, uint32 divisor)", function(b, d) {
      return function() {
        a(c);
        var e = d.apply(this, arguments);
        return r(e, b.apply(this, arguments));
      };
    });
  }
  function f(c, d) {
    function e(a, c) {
      b(d, "OESVertexArrayObject", a, c);
    }
    e("createVertexArrayOES(uint32 arrayObject)", function(b, d) {
      return function() {
        a(c);
        var e = u.nextObjectId_++;
        r(d(e));
        var f = b.apply(this, arguments);
        f && z(f, e);
        return f;
      };
    });
    e("deleteVertexArrayOES(uint32 arrayObject)", function(b, d) {
      return function(e) {
        a(c);
        var f = d(q(e));
        return r(f, b.apply(this, arguments));
      };
    });
    e("isVertexArrayOES(uint32 arrayObject)", function(b, d) {
      return function(e) {
        a(c);
        var f = d(q(e));
        return r(f, b.apply(this, arguments));
      };
    });
    e("bindVertexArrayOES(uint32 arrayObject)", function(b, d) {
      return function(e) {
        a(c);
        var f = d(q(e));
        return r(f, b.apply(this, arguments));
      };
    });
  }
  function g(c, d) {
    function e(a, c) {
      b(d, "WebGLLoseContext", a, c);
    }
    e("loseContext()", function(b, d) {
      return function() {
        a(c);
        var e = d.apply(this, arguments);
        return r(e, b.apply(this, arguments));
      };
    });
    e("restoreContext()", function(b, d) {
      return function() {
        a(c);
        var e = d.apply(this, arguments);
        return r(e, b.apply(this, arguments));
      };
    });
  }
  function k(a, b, c) {
    function d() {
      if (k.__gl_wrapped__) {
        return!1;
      }
      Object.defineProperty(k, "__gl_wrapped__", {configurable:!0, enumerable:!1, value:!0});
      F.push(function() {
        delete k.__gl_wrapped__;
      });
      return!0;
    }
    var k = c.constructor.prototype;
    switch(b) {
      case "ANGLE_instanced_arrays":
        return d() && e(a, k), !0;
      case "OES_vertex_array_object":
        return d() && f(a, k), !0;
      case "WEBGL_lose_context":
        return d() && g(a, k), !0;
      case "WEBGL_draw_buffers":
      ;
      case "WEBGL_security_sensitive_resources":
      ;
      case "WEBGL_shared_resources":
        return!1;
      default:
        return!0;
    }
  }
  function m(b, d, e) {
    c(b + "(" + (e ? e + ", " : "") + "uint32 " + d + ")", function(b, c) {
      return function(d) {
        a(this);
        var f = u.nextObjectId_++;
        e ? r(c(d, f)) : r(c(f));
        var g = b.apply(this, arguments);
        g && z(g, f);
        return g;
      };
    });
  }
  function l(b, d) {
    c(b + "(uint32 " + d + ")", function(b, c) {
      return function(d) {
        a(this);
        var e = c(q(d));
        return r(e, b.apply(this, arguments));
      };
    });
  }
  function p(b) {
    c(b + "(uint32 type)", function(b, c) {
      return function(d) {
        a(this);
        var e = c(q(d));
        return r(e, b.apply(this, arguments));
      };
    });
  }
  function s(b, d, e) {
    b += "(uint32 location";
    for (var f = ["x", "y", "z", "w"], g = 0;g < e;g++) {
      b += ", " + d + " " + f[g];
    }
    b += ")";
    switch(e) {
      case 1:
        c(b, function(b, c) {
          return function(d, e) {
            a(this);
            var f = c(q(d), e);
            return r(f, b.apply(this, arguments));
          };
        });
        break;
      case 2:
        c(b, function(b, c) {
          return function(d, e, f) {
            a(this);
            var g = c(q(d), e, f);
            return r(g, b.apply(this, arguments));
          };
        });
        break;
      case 3:
        c(b, function(b, c) {
          return function(d, e, f, g) {
            a(this);
            var k = c(q(d), e, f, g);
            return r(k, b.apply(this, arguments));
          };
        });
        break;
      case 4:
        c(b, function(b, c) {
          return function(d, e, f, g, k) {
            a(this);
            var l = c(q(d), e, f, g, k);
            return r(l, b.apply(this, arguments));
          };
        });
    }
  }
  function t(b, d, e) {
    c(b + "(uint32 location, " + d + "[] v)", function(b, c) {
      return function(d, e) {
        a(this);
        var f = c(q(d), e);
        return r(f, b.apply(this, arguments));
      };
    });
  }
  function x(b, d, e) {
    c(b + "(uint32 location, uint8 transpose, " + d + "[] value)", function(b, c) {
      return function(d, e, f) {
        a(this);
        var g = c(q(d), e, f);
        return r(g, b.apply(this, arguments));
      };
    });
  }
  if (!this.contextRestoreFns_.length) {
    var v = this.options.getBoolean("wtf.trace.provider.webgl.replayable", !0), w = this.options.getBoolean("wtf.trace.provider.webgl.embedRemoteImages", !0);
    wtf.trace.events.createInstance("wtf.webgl#init(any options)")({replayable:v, embedRemoteImages:w});
    var u = this, q = wtf.trace.providers.WebGLProvider.getHandle, z = wtf.trace.providers.WebGLProvider.setHandle, r = wtf.trace.leaveScope, J = null, C = 0, E = 0, Q = wtf.trace.events.createInstance("wtf.webgl#setContext(uint32 handle, uint32 width, uint32 height)", wtf.data.EventFlag.INTERNAL), F = this.contextRestoreFns_;
    goog.asserts.assert(!F.length);
    c("getContextAttributes()");
    c("isContextLost()");
    c("getSupportedExtensions()", function(b, c) {
      return function(d) {
        a(this);
        var e = c(), f = b.apply(this, arguments);
        wtf.trace.appendScopeData("result", f);
        return r(e, f);
      };
    });
    c("getExtension(ascii name, bool result)", function(b, c) {
      return function(d) {
        a(this);
        var e = c(d, !0), f = b.apply(this, arguments);
        if (!f) {
          wtf.trace.appendScopeData("result", !1);
        } else {
          if (!k(this, d, f)) {
            return null;
          }
        }
        return r(e, f);
      };
    });
    c("activeTexture(uint32 texture)");
    c("attachShader(uint32 program, uint32 shader)", function(b, c) {
      return function(d, e) {
        a(this);
        var f = c(q(d), q(e));
        return r(f, b.apply(this, arguments));
      };
    });
    c("bindAttribLocation(uint32 program, uint32 index, utf8 name)", function(b, c) {
      return function(d, e, f) {
        a(this);
        var g = c(q(d), e, f);
        return r(g, b.apply(this, arguments));
      };
    });
    c("bindBuffer(uint32 target, uint32 buffer)", function(b, c) {
      return function(d, e) {
        a(this);
        var f = c(d, q(e));
        return r(f, b.apply(this, arguments));
      };
    });
    c("bindFramebuffer(uint32 target, uint32 framebuffer)", function(b, c) {
      return function(d, e) {
        a(this);
        var f = c(d, q(e));
        return r(f, b.apply(this, arguments));
      };
    });
    c("bindRenderbuffer(uint32 target, uint32 renderbuffer)", function(b, c) {
      return function(d, e) {
        a(this);
        var f = c(d, q(e));
        return r(f, b.apply(this, arguments));
      };
    });
    c("bindTexture(uint32 target, uint32 texture)", function(b, c) {
      return function(d, e) {
        a(this);
        var f = c(d, q(e));
        return r(f, b.apply(this, arguments));
      };
    });
    c("blendColor(float red, float green, float blue, float alpha)");
    c("blendEquation(uint32 mode)");
    c("blendEquationSeparate(uint32 modeRGB, uint32 modeAlpha)");
    c("blendFunc(uint32 sfactor, uint32 dfactor)");
    c("blendFuncSeparate(uint32 srcRGB, uint32 dstRGB, uint32 srcAlpha, uint32 dstAlpha)");
    c("bufferData(uint32 target, uint32 size, uint32 usage, uint8[] data)", function(b, c) {
      return function(d, e, f) {
        a(this);
        if ("number" == typeof e) {
          var g = c(d, e, f, [])
        } else {
          g = e.byteLength, v ? e instanceof ArrayBuffer ? e = new Uint8Array(e) : e instanceof Uint8Array || (e = new Uint8Array(e.buffer)) : e = [], g = c(d, g, f, e);
        }
        return r(g, b.apply(this, arguments));
      };
    });
    c("bufferSubData(uint32 target, uint32 offset, uint8[] data)", function(b, c) {
      return function(d, e, f) {
        a(this);
        v ? f instanceof ArrayBuffer ? f = new Uint8Array(f) : f instanceof Uint8Array || (f = new Uint8Array(f.buffer)) : f = [];
        var g = c(d, e, f);
        return r(g, b.apply(this, arguments));
      };
    });
    c("checkFramebufferStatus(uint32 target)");
    c("clear(uint32 mask)");
    c("clearColor(float red, float green, float blue, float alpha)");
    c("clearDepth(float depth)");
    c("clearStencil(int32 s)");
    c("colorMask(uint8 red, uint8 green, uint8 blue, uint8 alpha)");
    c("compileShader(uint32 shader)", function(b, c) {
      return function(d) {
        a(this);
        var e = c(q(d));
        return r(e, b.apply(this, arguments));
      };
    });
    c("compressedTexImage2D(uint32 target, int32 level, uint32 internalformat, int32 width, int32 height, int32 border, uint8[] data)", function(b, c) {
      return function() {
        a(this);
        var e = c(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], v ? d(arguments[6]) : null);
        return r(e, b.apply(this, arguments));
      };
    });
    c("compressedTexSubImage2D(uint32 target, int32 level, int32 xoffset, int32 yoffset, int32 width, int32 height, uint32 format, uint8[] data)", function(b, c) {
      return function() {
        a(this);
        var e = c(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], v ? d(arguments[7]) : null);
        return r(e, b.apply(this, arguments));
      };
    });
    c("copyTexImage2D(uint32 target, int32 level, uint32 internalformat, int32 x, int32 y, int32 width, int32 height, int32 border)");
    c("copyTexSubImage2D(uint32 target, int32 level, int32 xoffset, int32 yoffset, int32 x, int32 y, int32 width, int32 height)");
    m("createBuffer", "buffer");
    m("createFramebuffer", "framebuffer");
    m("createProgram", "program");
    m("createRenderbuffer", "renderbuffer");
    m("createShader", "shader", "uint32 type");
    m("createTexture", "texture");
    c("cullFace(uint32 mode)");
    l("deleteBuffer", "buffer");
    l("deleteFramebuffer", "framebuffer");
    l("deleteProgram", "program");
    l("deleteRenderbuffer", "renderbuffer");
    l("deleteShader", "shader");
    l("deleteTexture", "texture");
    c("depthFunc(uint32 func)");
    c("depthMask(uint8 flag)");
    c("depthRange(float zNear, float zFar)");
    c("detachShader(uint32 program, uint32 shader)", function(b, c) {
      return function(d, e) {
        a(this);
        var f = c(q(d), q(e));
        return r(f, b.apply(this, arguments));
      };
    });
    c("disable(uint32 cap)");
    c("disableVertexAttribArray(uint8 index)");
    c("drawArrays(uint32 mode, uint32 first, int32 count)");
    c("drawElements(uint32 mode, int32 count, uint32 type, uint32 offset)");
    c("enable(uint32 cap)");
    c("enableVertexAttribArray(uint8 index)");
    c("finish()");
    c("flush()");
    c("framebufferRenderbuffer(uint32 target, uint32 attachment, uint32 renderbuffertarget, uint32 renderbuffer)", function(b, c) {
      return function(d, e, f, g) {
        a(this);
        var k = c(d, e, f, q(g));
        return r(k, b.apply(this, arguments));
      };
    });
    c("framebufferTexture2D(uint32 target, uint32 attachment, uint32 textarget, uint32 texture, int32 level)", function(b, c) {
      return function(d, e, f, g, k) {
        a(this);
        var l = c(d, e, f, q(g), k);
        return r(l, b.apply(this, arguments));
      };
    });
    c("frontFace(uint32 mode)");
    c("generateMipmap(uint32 target)");
    c("getActiveAttrib(uint32 program, uint32 index)", function(b, c) {
      return function(d, e) {
        a(this);
        var f = c(q(d), e);
        return r(f, b.apply(this, arguments));
      };
    });
    c("getActiveUniform(uint32 program, uint32 index)", function(b, c) {
      return function(d, e) {
        a(this);
        var f = c(q(d), e);
        return r(f, b.apply(this, arguments));
      };
    });
    c("getAttachedShaders(uint32 program)", function(b, c) {
      return function(d) {
        a(this);
        var e = c(q(d));
        return r(e, b.apply(this, arguments));
      };
    });
    c("getAttribLocation(uint32 program, utf8 name)", function(b, c) {
      return function(d, e) {
        a(this);
        var f = c(q(d), e);
        return r(f, b.apply(this, arguments));
      };
    });
    c("getBufferParameter(uint32 target, uint32 pname)");
    c("getParameter(uint32 pname)");
    c("getError()");
    c("getFramebufferAttachmentParameter(uint32 target, uint32 attachment, uint32 pname)");
    c("getProgramParameter(uint32 program, uint32 pname)", function(b, c) {
      return function(d, e) {
        a(this);
        var f = c(q(d), e);
        return r(f, b.apply(this, arguments));
      };
    });
    c("getProgramInfoLog(uint32 program)", function(b, c) {
      return function(d) {
        a(this);
        var e = c(q(d));
        return r(e, b.apply(this, arguments));
      };
    });
    c("getRenderbufferParameter(uint32 target, uint32 pname)");
    c("getShaderParameter(uint32 shader, uint32 pname)", function(b, c) {
      return function(d, e) {
        a(this);
        var f = c(q(d), e);
        return r(f, b.apply(this, arguments));
      };
    });
    c("getShaderPrecisionFormat(uint32 shadertype, uint32 precisiontype)");
    c("getShaderInfoLog(uint32 shader)", function(b, c) {
      return function(d) {
        a(this);
        var e = c(q(d));
        return r(e, b.apply(this, arguments));
      };
    });
    c("getShaderSource(uint32 shader)", function(b, c) {
      return function(d) {
        a(this);
        var e = c(q(d));
        return r(e, b.apply(this, arguments));
      };
    });
    c("getTexParameter(uint32 target, uint32 pname)");
    c("getUniform(uint32 program, uint32 location)", function(b, c) {
      return function(d, e) {
        a(this);
        var f = c(q(d), q(e));
        return r(f, b.apply(this, arguments));
      };
    });
    c("getUniformLocation(uint32 program, utf8 name, uint32 value)", function(b, c) {
      return function(d, e) {
        a(this);
        var f = u.nextObjectId_++, g = c(q(d), e, f), k = b.apply(this, arguments);
        k && z(k, f);
        return r(g, k);
      };
    });
    c("getVertexAttrib(uint32 index, uint32 pname)");
    c("getVertexAttribOffset(uint32 index, uint32 pname)");
    c("hint(uint32 target, uint32 mode)");
    c("isEnabled(uint32 cap)");
    p("isBuffer");
    p("isFramebuffer");
    p("isProgram");
    p("isRenderbuffer");
    p("isShader");
    p("isTexture");
    c("lineWidth(float width)");
    c("linkProgram(uint32 program)", function(b, c) {
      return function(d) {
        a(this);
        var e = c(q(d)), f = b.apply(this, arguments);
        if (v) {
          for (var g = wtf.trace.enterTracingScope(), k = {}, l = this.getProgramParameter.raw.call(this, d, goog.webgl.ACTIVE_ATTRIBUTES), m = 0, p = 0;p < l;++m) {
            var s = this.getActiveAttrib.raw.call(this, d, m);
            if (s) {
              var s = s.name, t = this.getAttribLocation.raw.call(this, d, s);
              k[s] = t;
              ++p;
            }
          }
          r(g);
          wtf.trace.appendScopeData("attributes", k);
        }
        return r(e, f);
      };
    });
    c("pixelStorei(uint32 pname, int32 param)");
    c("polygonOffset(float factor, float units)");
    c("readPixels(int32 x, int32 y, int32 width, int32 height, uint32 format, uint32 type, uint32 size)", function(b, c) {
      return function(d, e, f, g, k, l, m) {
        a(this);
        var p = c(d, e, f, g, k, l, m.byteLength);
        return r(p, b.apply(this, arguments));
      };
    });
    c("renderbufferStorage(uint32 target, uint32 internalformat, int32 width, int32 height)");
    c("sampleCoverage(float value, uint8 invert)");
    c("scissor(int32 x, int32 y, int32 width, int32 height)");
    c("shaderSource(uint32 shader, utf8 source)", function(b, c) {
      return function(d, e) {
        a(this);
        var f = c(q(d), e);
        return r(f, b.apply(this, arguments));
      };
    });
    c("stencilFunc(uint32 func, int32 ref, uint32 mask)");
    c("stencilFuncSeparate(uint32 face, uint32 func, int32 ref, uint32 mask)");
    c("stencilMask(uint32 mask)");
    c("stencilMaskSeparate(uint32 face, uint32 mask)");
    c("stencilOp(uint32 fail, uint32 zfail, uint32 zpass)");
    c("stencilOpSeparate(uint32 face, uint32 fail, uint32 zfail, uint32 zpass)");
    c("texImage2D(uint32 target, int32 level, uint32 internalformat, int32 width, int32 height, int32 border, uint32 format, uint32 type, uint8[] pixels, ascii dataType)", function(b, c) {
      return function(e, f, g) {
        a(this);
        var k;
        if (9 == arguments.length) {
          k = arguments[8] ? c(e, f, g, arguments[3], arguments[4], arguments[5], arguments[6], arguments[7], v ? d(arguments[8]) : null, v ? "pixels" : "ignored") : c(e, f, g, arguments[3], arguments[4], arguments[5], arguments[6], arguments[7], null, "null");
        } else {
          k = null;
          if (v) {
            var l = wtf.trace.enterTracingScope();
            k = wtf.trace.providers.WebGLProvider.extractImageData(arguments[5], g, w);
            r(l);
          }
          k = c(e, f, g, arguments[5].width, arguments[5].height, 0, arguments[3], arguments[4], k ? k.pixels : null, k ? k.dataType : "ignored");
        }
        try {
          b.apply(this, arguments);
        } finally {
          r(k);
        }
      };
    });
    c("texParameterf(uint32 target, uint32 pname, float param)");
    c("texParameteri(uint32 target, uint32 pname, int32 param)");
    c("texSubImage2D(uint32 target, int32 level, int32 xoffset, int32 yoffset, int32 width, int32 height, uint32 format, uint32 type, uint8[] pixels, ascii dataType)", function(b, c) {
      return function(e, f, g, k) {
        a(this);
        var l;
        if (9 == arguments.length) {
          l = arguments[8] ? c(e, f, g, k, arguments[4], arguments[5], arguments[6], arguments[7], v ? d(arguments[8]) : null, v ? "pixels" : "ignored") : c(e, f, g, k, arguments[4], arguments[5], arguments[6], arguments[7], null, "null");
        } else {
          l = null;
          if (v) {
            var m = wtf.trace.enterTracingScope();
            l = wtf.trace.providers.WebGLProvider.extractImageData(arguments[6], arguments[4], w);
            r(m);
          }
          l = c(e, f, g, k, arguments[6].width, arguments[6].height, arguments[4], arguments[5], l ? l.pixels : [], l ? l.dataType : "ignored");
        }
        try {
          b.apply(this, arguments);
        } finally {
          r(l);
        }
      };
    });
    s("uniform1f", "float", 1);
    s("uniform1i", "int32", 1);
    s("uniform2f", "float", 2);
    s("uniform2i", "int32", 2);
    s("uniform3f", "float", 3);
    s("uniform3i", "int32", 3);
    s("uniform4f", "float", 4);
    s("uniform4i", "int32", 4);
    t("uniform1fv", "float", 1);
    t("uniform1iv", "int32", 1);
    t("uniform2fv", "float", 2);
    t("uniform2iv", "int32", 2);
    t("uniform3fv", "float", 3);
    t("uniform3iv", "int32", 3);
    t("uniform4fv", "float", 4);
    t("uniform4iv", "int32", 4);
    x("uniformMatrix2fv", "float", 4);
    x("uniformMatrix3fv", "float", 9);
    x("uniformMatrix4fv", "float", 16);
    c("useProgram(uint32 program)", function(b, c) {
      return function(d) {
        a(this);
        var e = c(q(d));
        return r(e, b.apply(this, arguments));
      };
    });
    c("validateProgram(uint32 program)", function(b, c) {
      return function(d) {
        a(this);
        var e = c(q(d));
        return r(e, b.apply(this, arguments));
      };
    });
    c("vertexAttrib1f(uint8 indx, float x)");
    c("vertexAttrib1fv(uint8 indx, float x)", function(b, c) {
      return function(d, e) {
        a(this);
        var f = c(d, e[0]);
        return r(f, b.apply(this, arguments));
      };
    });
    c("vertexAttrib2f(uint8 indx, float x, float y)");
    c("vertexAttrib2fv(uint8 indx, float x, float y)", function(b, c) {
      return function(d, e) {
        a(this);
        var f = c(d, e[0], e[1]);
        return r(f, b.apply(this, arguments));
      };
    });
    c("vertexAttrib3f(uint8 indx, float x, float y, float z)");
    c("vertexAttrib3fv(uint8 indx, float x, float y, float z)", function(b, c) {
      return function(d, e) {
        a(this);
        var f = c(d, e[0], e[1], e[2]);
        return r(f, b.apply(this, arguments));
      };
    });
    c("vertexAttrib4f(uint8 indx, float x, float y, float z, float w)");
    c("vertexAttrib4fv(uint8 indx, float x, float y, float z, float w)", function(b, c) {
      return function(d, e) {
        a(this);
        var f = c(d, e[0], e[1], e[2], e[3]);
        return r(f, b.apply(this, arguments));
      };
    });
    c("vertexAttribPointer(uint8 indx, int32 size, uint32 type, uint8 normalized, int32 stride, uint32 offset)");
    c("viewport(int32 x, int32 y, int32 width, int32 height)");
  }
};
wtf.trace.providers.WebGLProvider.prototype.restoreContextType_ = function() {
  for (var a = 0;a < this.contextRestoreFns_.length;a++) {
    this.contextRestoreFns_[a]();
  }
  this.contextRestoreFns_.length = 0;
};
wtf.trace.providers.WebGLProvider.getHandle = function(a) {
  return a ? a.__wtf_glhandle__ || 0 : 0;
};
wtf.trace.providers.WebGLProvider.setHandle = function(a, b) {
  a.__wtf_glhandle__ = b;
};
wtf.trace.providers.WebGLProvider.loseContext = function(a) {
  if (!a.__wtf_forcedLost__) {
    a.__wtf_forcedLost__ = !0;
    var b = new goog.global.WebGLContextEvent("webglcontextlost", {statusMessage:"Forced via WTF"});
    a.canvas.dispatchEvent(b);
  }
};
wtf.trace.providers.WebGLProvider.restoreContext = function(a) {
  if (a.__wtf_forcedLost__) {
    delete a.__wtf_forcedLost__;
    var b = new goog.global.WebGLContextEvent("webglcontextrestored", {statusMessage:"Forced via WTF"});
    a.canvas.dispatchEvent(b);
  }
};
wtf.trace.providers.WebGLProvider.getPixelsFromImageData = function(a, b, c, d) {
  return new Uint8Array(d.data.buffer);
};
wtf.trace.providers.WebGLProvider.canvasCache_ = {};
wtf.trace.providers.WebGLProvider.extractImageData = function(a, b, c) {
  var d = wtf.trace.providers.WebGLProvider.canvasCache_, e = a.width, f = a.height;
  if ((a instanceof HTMLImageElement || a instanceof Image) && 0 != a.src.indexOf("blob:")) {
    if (0 == a.src.indexOf("data:")) {
      return{pixels:[], dataType:a.src};
    }
    if (c) {
      b = goog.global.XMLHttpRequest;
      b.raw && (b = b.raw);
      d = new b;
      d.open("HEAD", a.src, !1);
      d.send(null);
      if (200 != d.status) {
        return{width:e, height:f, pixels:[], dataType:"null"};
      }
      e = d.getResponseHeader("content-type");
      d = new b;
      d.overrideMimeType("text/plain; charset=x-user-defined");
      d.open("GET", a.src, !1);
      d.send(null);
      a = d.responseText;
      f = new Uint8Array(a.length);
      for (b = 0;b < f.length;b++) {
        f[b] = a.charCodeAt(b) & 255;
      }
      return{pixels:f, dataType:e};
    }
    return{pixels:[], dataType:a.src};
  }
  if (a instanceof HTMLCanvasElement) {
    d = a.getContext("raw-2d") || a.getContext("2d"), a = d.getImageData(0, 0, e, f);
  } else {
    if (!(a instanceof ImageData)) {
      var g = e + "x" + f, k = d[g];
      c = !!k;
      k || (k = goog.dom.createElement(goog.dom.TagName.CANVAS), k.width = e, k.height = f, d[g] = k);
      d = k.getContext("raw-2d");
      c && d.clearRect(0, 0, e, f);
      d.drawImage(a, 0, 0);
      a = d.getImageData(0, 0, e, f);
    }
  }
  a = wtf.trace.providers.WebGLProvider.getPixelsFromImageData(e, f, b, a);
  return{pixels:a, dataType:"canvas"};
};
// Input 189
wtf.trace.providers.WebSocketProvider = function(a) {
  wtf.trace.Provider.call(this, a);
  goog.global.WebSocket && a.getNumber("wtf.trace.provider.websocket", 1) && this.injectWs_();
};
goog.inherits(wtf.trace.providers.WebSocketProvider, wtf.trace.Provider);
wtf.trace.providers.WebSocketProvider.prototype.getSettingsSectionConfigs = function() {
  return[{title:"WebSockets", widgets:[{type:"checkbox", key:"wtf.trace.provider.websocket", title:"Enabled", "default":!0}]}];
};
wtf.trace.providers.WebSocketProvider.prototype.injectWs_ = function() {
  function a(a, b) {
    Object.defineProperty(e.prototype, a, {configurable:!0, enumerable:!0, get:function() {
      return this.handle_[a];
    }, set:b ? function(b) {
      this.props_[a] = b;
      this.handle_[a] = b;
    } : function(b) {
      this.handle_[a] = b;
    }});
  }
  var b = goog.global.WebSocket, c = wtf.trace.eventtarget.createDescriptor("WebSocket", {open:null, error:null, close:null, message:null}), d = wtf.trace.events.createScope("WebSocket()"), e = function(a, e) {
    var f = d();
    wtf.trace.eventtarget.BaseEventTarget.call(this, c);
    this.handle_ = 1 == arguments.length ? new b(a) : new b(a, e);
    this.trackers_ = {};
    this.props_ = {url:a, protocol:e};
    wtf.trace.Scope.leave(f);
  };
  goog.inherits(e, wtf.trace.eventtarget.BaseEventTarget);
  e.CONNECTING = 0;
  e.OPEN = 1;
  e.CLOSING = 2;
  e.CLOSED = 3;
  e.prototype.CONNECTING = 0;
  e.prototype.OPEN = 1;
  e.prototype.CLOSING = 2;
  e.prototype.CLOSED = 3;
  e.prototype.beginTrackingEvent = function(a) {
    var b = this, c = function(a) {
      b.dispatchEvent(a);
    };
    this.trackers_[a] = c;
    this.handle_.addEventListener(a, c, !1);
  };
  e.prototype.endTrackingEvent = function(a) {
    this.handle_.removeEventListener(a, this.trackers_[a], !1);
    delete this.trackers_[a];
  };
  for (var f = c.eventInfos, g = 0;g < f.length;g++) {
    var k = f[g];
    Object.defineProperty(e.prototype, "on" + k.name, {configurable:!0, enumerable:!0, get:k.getter, set:k.setter});
  }
  a("url", !0);
  a("readyState");
  a("bufferedAmount");
  a("protocol", !0);
  a("extensions");
  a("binaryType");
  var m = wtf.trace.events.createScope("WebSocket#send(ascii url)");
  e.prototype.send = function(a) {
    var b = m(this.props_.url);
    try {
      return this.handle_.send.apply(this.handle_, arguments);
    } finally {
      wtf.trace.Scope.leave(b);
    }
  };
  var l = wtf.trace.events.createScope("WebSocket#close()");
  e.prototype.close = function() {
    var a = l();
    try {
      return this.handle_.close.apply(this.handle_, arguments);
    } finally {
      wtf.trace.Scope.leave(a);
    }
  };
  e.raw = b;
  this.injectFunction(goog.global, "WebSocket", e);
};
// Input 190
wtf.trace.providers.WebWorkerProvider = function(a, b) {
  wtf.trace.Provider.call(this, b);
  b.getNumber("wtf.trace.provider.webworker", 1) && (this.injecting_ = b.getBoolean("wtf.trace.provider.webworker.inject", !1), this.childWorkers_ = [], "function" == typeof goog.global.MessagePort && this.injectMessagePort_(), "function" == typeof goog.global.Worker && this.injectBrowserShim_(), goog.global.HTMLDivElement || this.injectProxyWorker_(), a.addListener(this));
};
goog.inherits(wtf.trace.providers.WebWorkerProvider, wtf.trace.Provider);
wtf.trace.providers.WebWorkerProvider.prototype.getSettingsSectionConfigs = function() {
  return[{title:"Web Workers", widgets:[{type:"checkbox", key:"wtf.trace.provider.webworker", title:"Enabled", "default":!0}, {type:"checkbox", key:"wtf.trace.provider.webworker.inject", title:"Inject WTF into Workers", "default":!1}]}];
};
wtf.trace.providers.WebWorkerProvider.prototype.sessionStarted = goog.nullFunction;
wtf.trace.providers.WebWorkerProvider.prototype.sessionStopped = goog.nullFunction;
wtf.trace.providers.WebWorkerProvider.prototype.requestSnapshots = function(a, b, c) {
  if (this.injecting_) {
    return this.childWorkers_.forEach(function(a) {
      goog.result.wait(a.requestSnapshot(), function(a) {
        var d = a.getValue();
        d && d.length && a.getState() != goog.result.Result.State.ERROR ? b.call(c, d[0]) : b.call(c, null);
      });
    }), this.childWorkers_.length;
  }
};
wtf.trace.providers.WebWorkerProvider.prototype.reset = function() {
  this.childWorkers_.forEach(function(a) {
    a.reset();
  });
};
wtf.trace.providers.WebWorkerProvider.prototype.injectMessagePort_ = function() {
  var a = goog.global.MessagePort.prototype, b = wtf.trace.events.createScope("MessagePort#postMessage()"), c = a.postMessage;
  this.injectFunction(a, "postMessage", function(a, d) {
    var e;
    try {
      var f = b();
      e = c.apply(this, arguments);
    } finally {
      return wtf.trace.leaveScope(f, e);
    }
  });
  var d = wtf.trace.events.createScope("MessagePort#start()"), e = a.start;
  this.injectFunction(a, "start", function() {
    var a;
    try {
      var b = d();
      a = e.apply(this, arguments);
    } finally {
      return wtf.trace.leaveScope(b, a);
    }
  });
  var f = wtf.trace.events.createScope("MessagePort#close()"), g = a.close;
  this.injectFunction(a, "close", function() {
    var a;
    try {
      var b = f();
      a = g.apply(this, arguments);
    } finally {
      return wtf.trace.leaveScope(b, a);
    }
  });
  var k = wtf.trace.eventtarget.createDescriptor("MessagePort", wtf.data.webidl.getAllEvents("MessagePort"));
  wtf.trace.eventtarget.mixin(k, a);
  wtf.trace.eventtarget.setDescriptor(a, k);
  wtf.trace.eventtarget.setEventProperties(k, a);
  var m = goog.global.MessageChannel;
  m && (goog.global.MessageChannel = function() {
    var a = new m;
    wtf.trace.eventtarget.initializeEventProperties(a.port1);
    wtf.trace.eventtarget.initializeEventProperties(a.port2);
    a.port1.start();
    a.port2.start();
    return a;
  });
};
wtf.trace.providers.WebWorkerProvider.prototype.injectBrowserShim_ = function() {
  function a(a, b) {
    var c = null, d = null;
    goog.string.startsWith(a, "blob:") ? (d = new (goog.global.XMLHttpRequest.raw || XMLHttpRequest), d.open("GET", a, !1), d.send(), d = d.response) : c = goog.Uri.resolve(k, a).toString();
    var e = ["this.WTF_WORKER_ID = " + b + ";", 'this.WTF_WORKER_BASE_URI = "' + goog.global.location.href + '";', 'importScripts("' + g + '");', "wtf.trace.prepare({", "});", "wtf.trace.start();"];
    c ? e.push('importScripts("' + c + '");') : d && (e.push("// Embedded: " + a), e.push(d));
    c = new Blob([e.join("\n")], {type:"text/javascript"});
    return goog.fs.createObjectUrl(c);
  }
  var b = this, c = this.injecting_, d = goog.global.Worker, e = wtf.data.webidl.getAllEvents("Worker", ["error", "message"]), f = wtf.trace.eventtarget.createDescriptor("Worker", e), g = wtf.trace.util.getScriptUrl(), k = new goog.Uri(goog.global.location.href), m = 0, l = wtf.trace.events.createScope("Worker(ascii scriptUrl, uint32 id)"), e = function(e) {
    wtf.trace.eventtarget.BaseEventTarget.call(this, f);
    this.workerId_ = m++;
    var g = e;
    c && (g = a(e, this.workerId_));
    e = l(e, this.workerId_);
    goog.global.Worker = d;
    var k = goog.global.Worker, q;
    try {
      q = new d(g);
    } finally {
      goog.global.Worker = k, wtf.trace.leaveScope(e);
    }
    this.handle_ = q;
    this.trackers_ = {};
    this.setEventHook("error", function(a) {
      wtf.trace.appendScopeData("id", this.workerId_);
    }, this);
    this.setEventHook("message", function(a) {
      wtf.trace.appendScopeData("id", this.workerId_);
    }, this);
    var p = this;
    this.handle_.addEventListener("message", function(a) {
      if (a.data.__wtf_worker_msg__) {
        a.__wtf_ignore__ = !0;
        var c = a.data.value;
        switch(a.data.command) {
          case "snapshot":
            a = u[c.id];
            delete u[c.id];
            a.getError() || a.setValue(c.data);
            break;
          case "close":
            goog.array.remove(b.childWorkers_, p);
        }
      }
    }, !1);
    b.childWorkers_.push(this);
  };
  goog.inherits(e, wtf.trace.eventtarget.BaseEventTarget);
  e.prototype.beginTrackingEvent = function(a) {
    var b = this, c = function(a) {
      b.dispatchEvent(a);
    };
    this.trackers_[a] = c;
    this.handle_.addEventListener(a, c, !1);
  };
  e.prototype.endTrackingEvent = function(a) {
    this.handle_.removeEventListener(a, this.trackers_[a], !1);
    delete this.trackers_[a];
  };
  for (var p = f.eventInfos, s = 0;s < p.length;s++) {
    var t = p[s];
    Object.defineProperty(e.prototype, "on" + t.name, {configurable:!1, enumerable:!1, get:t.getter, set:t.setter});
  }
  e.prototype.sendMessage = function(a, b) {
    this.handle_.postMessage({__wtf_worker_msg__:!0, command:a, value:b || null});
  };
  var x = wtf.trace.events.createScope("Worker#postMessage(uint32 id)");
  e.prototype.postMessage = function(a, b) {
    var c = x(this.workerId_);
    try {
      return this.handle_.postMessage.apply(this.handle_, arguments);
    } finally {
      wtf.trace.leaveScope(c);
    }
  };
  if (d.webkitPostMessage) {
    var v = wtf.trace.events.createScope("Worker#webkitPostMessage(uint32 id)");
    e.prototype.webkitPostMessage = function(a, b) {
      var c = v(this.workerId_);
      try {
        return this.handle_.webkitPostMessage.apply(this.handle_, arguments);
      } finally {
        wtf.trace.leaveScope(c);
      }
    };
  }
  var w = wtf.trace.events.createInstance("Worker#terminate(uint32 id)");
  e.prototype.terminate = function() {
    goog.array.remove(b.childWorkers_, this);
    w(this.workerId_);
    return this.handle_.terminate.apply(this.handle_, arguments);
  };
  var u = {}, q = 0;
  e.prototype.requestSnapshot = function() {
    var a = new goog.result.SimpleResult, b = q++;
    u[b] = a;
    this.sendMessage("snapshot", {id:b});
    return a;
  };
  e.prototype.reset = function() {
    this.sendMessage("reset");
  };
  this.injectFunction(goog.global, "Worker", e);
};
wtf.trace.providers.WebWorkerProvider.prototype.injectProxyWorker_ = function() {
  function a(a, b, c) {
    k.call(goog.global, {__wtf_worker_msg__:!0, command:a, value:b || null}, []);
  }
  var b = new goog.Uri(goog.global.WTF_WORKER_BASE_URI), c = wtf.data.webidl.getAllEvents("WorkerGlobalScope", ["error", "online", "offline", "message"]), c = wtf.trace.eventtarget.createDescriptor("WorkerGlobalScope", c);
  wtf.trace.eventtarget.mixin(c, goog.global);
  wtf.trace.eventtarget.setEventProperties(c, goog.global);
  var d = goog.global.importScripts, e = wtf.trace.events.createScope("WorkerUtils#importScripts(any urls)");
  this.injectFunction(goog.global, "importScripts", function(a) {
    for (var c = Array(arguments.length), f = 0;f < arguments.length;f++) {
      c[f] = goog.Uri.resolve(b, arguments[f]).toString();
    }
    f = e(c);
    try {
      return d.apply(goog.global, c);
    } finally {
      wtf.trace.leaveScope(f);
    }
  });
  var f = goog.global.close, g = wtf.trace.events.createInstance("WorkerGlobalScope#close()");
  this.injectFunction(goog.global, "close", function() {
    g();
    a("close");
    return f.apply(goog.global, arguments);
  });
  var k = goog.global.postMessage, m = wtf.trace.events.createScope("DedicatedWorkerGlobalScope#postMessage()");
  this.injectFunction(goog.global, "postMessage", function(a, b) {
    var c = m();
    try {
      return k.apply(goog.global, arguments);
    } finally {
      wtf.trace.leaveScope(c);
    }
  });
  var l = goog.global.webkitPostMessage;
  if (l) {
    var p = wtf.trace.events.createScope("DedicatedWorkerGlobalScope#webkitPostMessage()");
    this.injectFunction(goog.global, "webkitPostMessage", function(a, b) {
      var c = p();
      try {
        return l.apply(goog.global, arguments);
      } finally {
        wtf.trace.leaveScope(c);
      }
    });
  }
  goog.global.addEventListener("message", function(b) {
    if (b.data.__wtf_worker_msg__) {
      var c = b.data.value;
      switch(b.data.command) {
        case "snapshot":
          var d = [];
          wtf.trace.snapshot(d);
          a("snapshot", {id:c.id, data:d}, d[0]);
          break;
        case "reset":
          wtf.trace.reset();
      }
      b.__wtf_ignore__ = !0;
      goog.object.clear(b.data);
      return b.returnValue = !1;
    }
  }, !1);
};
// Input 191
wtf.trace.providers.XhrProvider = function(a) {
  wtf.trace.Provider.call(this, a);
  goog.global.XMLHttpRequest && a.getNumber("wtf.trace.provider.xhr", 1) && this.injectXhr_();
};
goog.inherits(wtf.trace.providers.XhrProvider, wtf.trace.Provider);
wtf.trace.providers.XhrProvider.prototype.getSettingsSectionConfigs = function() {
  return[{title:"XMLHttpRequest", widgets:[{type:"checkbox", key:"wtf.trace.provider.xhr", title:"Enabled", "default":!0}]}];
};
wtf.trace.providers.XhrProvider.prototype.injectXhr_ = function() {
  function a(a, b) {
    Object.defineProperty(e.prototype, a, {configurable:!0, enumerable:!0, get:function() {
      return this.handle_[a];
    }, set:b ? function(b) {
      this.props_[a] = b;
      this.handle_[a] = b;
    } : function(b) {
      this.handle_[a] = b;
    }});
  }
  var b = goog.global.XMLHttpRequest, c = wtf.trace.eventtarget.createDescriptor("XMLHttpRequest", {loadstart:null, progress:null, abort:null, error:null, load:null, timeout:null, loadend:null, readystatechange:null}), d = wtf.trace.events.createScope("XMLHttpRequest()"), e = function() {
    var a = d();
    wtf.trace.eventtarget.BaseEventTarget.call(this, c);
    this.handle_ = new b;
    this.trackers_ = {};
    this.props_ = {method:null, url:null, async:!0, user:null, headers:{}, timeout:0, withCredentials:!1, overrideMimeType:null, responseType:""};
    this.flow_ = null;
    var e = this, f = this.handle_, g = this.props_;
    this.handle_.addEventListener("readystatechange", function(a) {
      if (a = e.flow_) {
        var b = void 0;
        if (2 == f.readyState) {
          for (var b = {}, c = f.getAllResponseHeaders().split("\r\n"), d = 0;d < c.length;d++) {
            if (c[d].length) {
              var g = c[d].split(":");
              b[g[0]] = g[1].substr(1);
            }
          }
          b = {status:this.status, statusText:this.statusText, headers:b};
        }
        4 > f.readyState ? wtf.trace.Flow.extend(a, "readyState: " + f.readyState, b) : wtf.trace.Flow.terminate(a, "readyState: " + f.readyState);
      }
    }, !1);
    this.setEventHook("readystatechange", function(a) {
      wtf.trace.appendScopeData("url", g.url);
      wtf.trace.appendScopeData("readyState", f.readyState);
    });
    this.setEventHook("load", function(a) {
      wtf.trace.appendScopeData("url", g.url);
    });
    wtf.trace.Scope.leave(a);
  };
  goog.inherits(e, wtf.trace.eventtarget.BaseEventTarget);
  e.UNSENT = 0;
  e.OPENED = 1;
  e.HEADERS_RECEIVED = 2;
  e.LOADING = 3;
  e.DONE = 4;
  e.prototype.UNSENT = 0;
  e.prototype.OPENED = 1;
  e.prototype.HEADERS_RECEIVED = 2;
  e.prototype.LOADING = 3;
  e.prototype.DONE = 4;
  e.prototype.beginTrackingEvent = function(a) {
    var b = this, c = function(a) {
      a = Object.create(a, {target:{value:b, writable:!1}, type:{value:a.type, writable:!1}});
      b.dispatchEvent(a);
    };
    this.trackers_[a] = c;
    this.handle_.addEventListener(a, c, !1);
  };
  e.prototype.endTrackingEvent = function(a) {
    this.handle_.removeEventListener(a, this.trackers_[a], !1);
    delete this.trackers_[a];
  };
  for (var f = c.eventInfos, g = 0;g < f.length;g++) {
    var k = f[g];
    Object.defineProperty(e.prototype, "on" + k.name, {configurable:!0, enumerable:!0, get:k.getter, set:k.setter});
  }
  a("readyState");
  a("timeout", !0);
  a("withCredentials", !0);
  a("upload");
  e.prototype.setRequestHeader = function(a, b) {
    this.props_.headers[a] = b;
    return this.handle_.setRequestHeader.apply(this.handle_, arguments);
  };
  e.prototype.overrideMimeType = function(a) {
    this.props_.overrideMimeType = a;
    return this.handle_.overrideMimeType.apply(this.handle_, arguments);
  };
  var m = wtf.trace.events.createScope("XMLHttpRequest#open(ascii method, ascii url, any props)");
  e.prototype.open = function(a, b, c, d, e) {
    var f = this.props_;
    f.method = a;
    f.url = b;
    f.async = void 0 === c ? !0 : c;
    f.user = d || null;
    this.flow_ = wtf.trace.Flow.branch("open");
    f = m(f.method, f.url, f);
    try {
      return this.handle_.open.apply(this.handle_, arguments);
    } finally {
      wtf.trace.Scope.leave(f);
    }
  };
  var l = wtf.trace.events.createScope("XMLHttpRequest#send(ascii method, ascii url)");
  e.prototype.send = function(a) {
    var b = this.flow_, c = this.props_;
    b && wtf.trace.Flow.extend(b, "send");
    b = l(c.method, c.url);
    try {
      return this.handle_.send.apply(this.handle_, arguments);
    } finally {
      wtf.trace.Scope.leave(b);
    }
  };
  var p = wtf.trace.events.createScope("XMLHttpRequest#abort()");
  e.prototype.abort = function() {
    var a = p(), b = this.flow_;
    this.flow_ = null;
    b && wtf.trace.Flow.terminate(b, "aborted");
    try {
      return this.handle_.abort.apply(this.handle_, arguments);
    } finally {
      wtf.trace.Scope.leave(a);
    }
  };
  a("status");
  a("statusText");
  a("responseType", !0);
  a("response");
  a("responseText");
  a("responseXML");
  e.prototype.getResponseHeader = function(a) {
    return this.handle_.getResponseHeader.apply(this.handle_, arguments);
  };
  e.prototype.getAllResponseHeaders = function() {
    return this.handle_.getAllResponseHeaders.apply(this.handle_, arguments);
  };
  e.raw = b;
  this.injectFunction(goog.global, "XMLHttpRequest", e);
};
// Input 192
wtf.trace.providers.setup = function(a) {
  var b = a.getOptions();
  wtf.MIN_BUILD || wtf.NODE || !b.getBoolean("wtf.trace.replayable", !1) || a.addProvider(new wtf.trace.providers.ReplayProvider(a, b));
  a.addProvider(new wtf.trace.providers.ConsoleProvider(b));
  a.addProvider(new wtf.trace.providers.TimingProvider(b));
  wtf.NODE || (!wtf.MIN_BUILD && goog.userAgent.product.CHROME && a.addProvider(new wtf.trace.providers.ChromeDebugProvider(a, b)), !wtf.MIN_BUILD && goog.userAgent.product.FIREFOX && a.addProvider(new wtf.trace.providers.FirefoxDebugProvider(a, b)), a.addProvider(new wtf.trace.providers.DomProvider(b)), a.addProvider(new wtf.trace.providers.ImageProvider(b)), wtf.MIN_BUILD || a.addProvider(new wtf.trace.providers.WebGLProvider(a, b)), wtf.MIN_BUILD || a.addProvider(new wtf.trace.providers.WebSocketProvider(b)), 
  wtf.MIN_BUILD || a.addProvider(new wtf.trace.providers.WebWorkerProvider(a, b)), a.addProvider(new wtf.trace.providers.XhrProvider(b)));
};
// Input 193
wtf.trace.prepare = function(a) {
  var b = wtf.trace.TraceManager.getSharedInstance();
  if (b) {
    return b;
  }
  a = new wtf.trace.TraceManager(a);
  a.getOptions().getBoolean("wtf.trace.disableProviders", !1) || wtf.trace.providers.setup(a);
  wtf.trace.TraceManager.setSharedInstance(a);
  return a;
};
// Input 194
wtf.trace.exports = {};
wtf.trace.exports.ENABLE_EXPORTS = !0;
wtf.trace.exports.ENABLE_EXPORTS && (goog.exportSymbol("wtf.trace.API_VERSION", wtf.trace.API_VERSION), goog.exportSymbol("wtf.trace.prepare", wtf.trace.prepare), goog.exportSymbol("wtf.trace.shutdown", wtf.trace.shutdown), goog.exportSymbol("wtf.trace.start", wtf.trace.start), goog.exportSymbol("wtf.trace.snapshot", wtf.trace.snapshot), goog.exportSymbol("wtf.trace.snapshotAll", wtf.trace.snapshotAll), goog.exportSymbol("wtf.trace.reset", wtf.trace.reset), goog.exportSymbol("wtf.trace.stop", wtf.trace.stop), 
goog.exportSymbol("wtf.trace.events.createInstance", wtf.trace.events.createInstance), goog.exportSymbol("wtf.trace.events.createScope", wtf.trace.events.createScope), goog.exportSymbol("wtf.trace.createZone", wtf.trace.createZone), goog.exportSymbol("wtf.trace.deleteZone", wtf.trace.deleteZone), goog.exportSymbol("wtf.trace.pushZone", wtf.trace.pushZone), goog.exportSymbol("wtf.trace.popZone", wtf.trace.popZone), goog.exportSymbol("wtf.trace.enterScope", wtf.trace.enterScope), goog.exportSymbol("wtf.trace.enterTracingScope", 
wtf.trace.enterTracingScope), goog.exportSymbol("wtf.trace.leaveScope", wtf.trace.leaveScope), goog.exportSymbol("wtf.trace.appendScopeData", wtf.trace.appendScopeData), goog.exportSymbol("wtf.trace.branchFlow", wtf.trace.branchFlow), goog.exportSymbol("wtf.trace.extendFlow", wtf.trace.extendFlow), goog.exportSymbol("wtf.trace.terminateFlow", wtf.trace.terminateFlow), goog.exportSymbol("wtf.trace.appendFlowData", wtf.trace.appendFlowData), goog.exportSymbol("wtf.trace.clearFlow", wtf.trace.clearFlow), 
goog.exportSymbol("wtf.trace.spanFlow", wtf.trace.spanFlow), goog.exportSymbol("wtf.trace.mark", wtf.trace.mark), goog.exportSymbol("wtf.trace.timeStamp", wtf.trace.timeStamp), goog.exportSymbol("wtf.trace.beginTimeRange", wtf.trace.beginTimeRange), goog.exportSymbol("wtf.trace.endTimeRange", wtf.trace.endTimeRange), goog.exportSymbol("wtf.trace.ignoreListener", wtf.trace.ignoreListener), goog.exportSymbol("wtf.trace.ignoreDomTree", wtf.trace.ignoreDomTree), goog.exportSymbol("wtf.trace.initializeDomEventProperties", 
wtf.trace.initializeDomEventProperties), goog.exportSymbol("wtf.trace.instrument", wtf.trace.instrument), goog.exportSymbol("wtf.trace.instrumentType", wtf.trace.instrumentType), goog.exportSymbol("wtf.trace.instrumentTypeSimple", wtf.trace.instrumentTypeSimple));
// Input 195
wtf.trace.node = {};
wtf.NODE && (wtf.trace.node.start = function(a) {
  wtf.trace.prepare(a);
  wtf.trace.start(a);
  process.on("exit", function() {
    wtf.trace.snapshot("file://");
    wtf.trace.stop();
  });
  process.on("SIGINT", function() {
    process.exit();
  });
}, goog.exportSymbol("wtf.trace.node.start", wtf.trace.node.start));
;return this.wtf;}).call(global); delete global.wtf;
