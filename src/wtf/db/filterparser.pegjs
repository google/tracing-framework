/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Filter expression PEG.
 * There's no automated tool to generate this yet - instead, I've just been
 * pasting it into http://pegjs.majda.cz/online and downloading the result.
 *
 * This should parse filters like:
 *   foo(foo.fsd[5] < "tac", bar<=0x15, taco=={"a": "b", "5":[1,2,3]})
 *
 * @author benvanik@google.com (Ben Vanik)
 */


start
  = FilterStatement

FilterStatement "filter statement"
  = type_query:EventTypeExpression _ arg_query:Arguments {
    return {
      type_query: type_query,
      arg_query: arg_query
    };
  }
  / type_query:EventTypeExpression {
    return {
      type_query: type_query,
      arg_query: null
    };
  }
  / arg_query:Arguments {
    return {
      type_query: null,
      arg_query: arg_query
    };
  }

EventTypeExpression "event type expression"
  = RegularExpressionLiteral
  / SubstringEventTypeLiteral
SubstringEventTypeLiteral
  = value:([a-zA-Z0-9_\.#:\$\[\]\"\'\-]+) {
    return {
      type: 'substring',
      value: value.join('')
    };
  }

Arguments "a"
  = "(" _ args:ArgumentList? _ ")" {
    return args !== "" ? args : [];
  }
ArgumentList "arguments"
  = head:BinaryExpression tail:(_ "," _ BinaryExpression)* {
    var result = [head];
    for (var i = 0; i < tail.length; i++) {
      result.push(tail[i][3]);
    }
    return result;
  }
BinaryExpression "binary expression"
  = exp:ComparativeExpression / exp:RegularExpression {
    return {
      lhs: exp.lhs,
      op: exp.op,
      rhs: exp.rhs
    };
  }

ComparativeExpression "comparison expression"
  = lhs:ExpressionValue _ op:Operator _ rhs:ExpressionValue {
    return {
      lhs: lhs,
      op: op,
      rhs: rhs
    };
  }

RegularExpression "regular expression"
  = lhs:ExpressionValue _ op:RegexOperator _ regex:RegularExpressionLiteral {
    return {
      lhs: lhs,
      op: op,
      rhs: regex
    };
  }

Operator "operator"
  = "=="
  / "!="
  / "<="
  / ">="
  / "<"
  / ">"
  / "in"

RegexOperator "regex operator"
  = "=~"
  / "!~"

ExpressionValue "value"
  = value:String            { return { type: "string", value: value }; }
  / value:AdjustedNumber    { return { type: "number", value: value }; }
  / value:Object            { return { type: "object", value: value }; }
  / value:Array             { return { type: "array",  value: value }; }
  / "true" _                { return { type: "boolean", value: true }; }
  / "false" _               { return { type: "boolean", value: false }; }
  / "null" _                { return { type: "null", value: null }; }
  / value:VariableReference { return { type: "reference", value: value }; }
  / value:RegularExpressionLiteral { return { type: "regex", value: value }; }

VariableReference "reference"
  = base:Identifier accessors:(
        _ "[" _ name:Value _ "]" { return name; }
      / _ "." _ name:Identifier  { return name; }
    )* {
      var result = base;
      for (var n = 0; n < accessors.length; n++) {
        result = {
          type: "access",
          base: result,
          name: accessors[n]
        };
      }
      return result;
    }

Object "object"
  = "{" _ "}" _                       { return {};      }
  / "{" _ members:ObjectMembers "}" _ { return members; }

ObjectMembers
  = head:Pair tail:("," _ Pair)* {
      var result = {};
      result[head[0]] = head[1];
      for (var i = 0; i < tail.length; i++) {
        result[tail[i][2][0]] = tail[i][2][1];
      }
      return result;
    }

Pair
  = name:String ":" _ value:Value { return [name, value]; }

Array "array"
  = "[" _ "]" _                   { return [];       }
  / "[" _ elements:Elements "]" _ { return elements; }

Elements
  = head:Value tail:("," _ Value)* {
      var result = [head];
      for (var i = 0; i < tail.length; i++) {
        result.push(tail[i][2]);
      }
      return result;
    }

Value "value"
  = String
  / AdjustedNumber
  / Object
  / Array
  / "true" _     { return true; }
  / "false" _    { return false; }
  / "null" _     { return "null"; }

String "string"
  = '"' '"' _             { return ""; }
  / '"' chars:Chars '"' _ { return chars; }
Chars
  = chars:Char+ { return chars.join(""); }
Char
  = [^"\\\0-\x1F\x7f]
  / '\\"'  { return '"';  }
  / "\\\\" { return "\\"; }
  / "\\/"  { return "/";  }
  / "\\b"  { return "\b"; }
  / "\\f"  { return "\f"; }
  / "\\n"  { return "\n"; }
  / "\\r"  { return "\r"; }
  / "\\t"  { return "\t"; }
  / "\\u" digits:(HexDigit HexDigit HexDigit HexDigit) {
      return String.fromCharCode(parseInt("0x" + digits, 16));
    }

AdjustedNumber "number"
  = parts:(Number TimeUnit) { return parts[0] * parts[1]; }
  / Number
Number "number"
  = parts:(HexInt) _       { return parseInt(parts, 16); }
  / parts:(Int Frac Exp) _ { return parseFloat(parts.join('')); }
  / parts:(Int Frac) _     { return parseFloat(parts.join('')); }
  / parts:(Int Exp) _      { return parseFloat(parts.join('')); }
  / parts:(Int) _          { return parseFloat(parts); }
Int
  = a:Digit19 b:Digits     { return a + b; }
  / a:Digit                { return a; }
  / "-" a:Digit19 b:Digits { return '-' + a + b; }
  / "-" a:Digit            { return '-' + a; }
HexInt
  = "0x" value:Digits      { return "0x" + value; }
Frac
  = "." value:Digits       { return "." + value; }
Exp
  = E value:Digits         { return "e" + value; }
Digits
  = value:Digit+           { return value.join(''); }
E
  = [eE] [+-]?
Digit
  = [0-9]
Digit19
  = [1-9]
HexDigit
  = [0-9a-fA-F]
TimeUnit
  = "ms"                   { return 1; }
  / "s"                    { return 1000; }
  / "us"                   { return 1 / 1000; }

WhiteSpace "whitespace"
  = [ \t\n\r]
_
  = WhiteSpace*

Identifier "identifier"
  = name:IdentifierName { return name; }
IdentifierName "identifier"
  = start:IdentifierStart parts:IdentifierPart* {
      return start + parts.join("");
    }
IdentifierStart
  = [a-zA-Z]
  / "$"
  / "_"
  / "@"
IdentifierPart
  = IdentifierStart
  / Digit
  / UnicodeConnectorPunctuation
  / "\u200C" { return "\u200C"; } // zero-width non-joiner
  / "\u200D" { return "\u200D"; } // zero-width joiner
UnicodeConnectorPunctuation
  = [\u005F\u203F\u2040\u2054\uFE33\uFE34\uFE4D\uFE4E\uFE4F\uFF3F]

RegularExpressionLiteral "regular expression"
  = "/" body:RegularExpressionBody "/" flags:RegularExpressionFlags {
      return {
        type: 'regex',
        value:  body,
        flags: flags
      };
    }
RegularExpressionBody
  = char_:RegularExpressionFirstChar chars:RegularExpressionChars {
      return char_ + chars;
    }
RegularExpressionChars
  = chars:RegularExpressionChar* { return chars.join(""); }
RegularExpressionFirstChar
  = ![*\\/[] char_:RegularExpressionNonTerminator { return char_; }
  / RegularExpressionBackslashSequence
  / RegularExpressionClass
RegularExpressionChar
  = ![\\/[] char_:RegularExpressionNonTerminator { return char_; }
  / RegularExpressionBackslashSequence
  / RegularExpressionClass
RegularExpressionBackslashSequence
  = "\\" char_:RegularExpressionNonTerminator { return "\\" + char_; }
RegularExpressionNonTerminator
  = char_:. { return char_; }
RegularExpressionClass
  = "[" chars:RegularExpressionClassChars "]" { return "[" + chars + "]"; }
RegularExpressionClassChars
  = chars:RegularExpressionClassChar* { return chars.join(""); }
RegularExpressionClassChar
  = ![\]\\] char_:RegularExpressionNonTerminator { return char_; }
  / RegularExpressionBackslashSequence
RegularExpressionFlags
  = parts:IdentifierPart* { return parts.join(""); }
