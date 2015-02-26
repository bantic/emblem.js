define('emblem', ['exports', 'emblem/parser', 'emblem/compiler', 'emblem/bootstrap'], function (exports, Parser, compiler) {

  'use strict';

  exports['default'] = {
    Parser: Parser['default'],
    registerPartial: compiler.registerPartial,
    parse: compiler.parse,
    compile: compiler.compile,
    VERSION: "VERSION_STRING_PLACEHOLDER"
  };

});
define('emblem/ast-builder', ['exports', 'emblem/utils/void-elements'], function (exports, isVoidElement) {

  'use strict';

  exports.generateBuilder = generateBuilder;

  function generateBuilder() {
    reset(builder);
    return builder;
  }function reset(builder) {
    var programNode = {
      type: "program",
      childNodes: []
    };
    builder.currentNode = programNode;
    builder.previousNodes = [];
    builder._ast = programNode;
  }

  var builder = {
    toAST: function () {
      return this._ast;
    },

    generateText: function (content) {
      return { type: "text", content: content };
    },

    text: function (content) {
      var node = this.generateText(content);
      this.currentNode.childNodes.push(node);
      return node;
    },

    generateElement: function (tagName) {
      return {
        type: "element",
        tagName: tagName,
        isVoid: isVoidElement['default'](tagName),
        attrStaches: [],
        classNameBindings: [],
        childNodes: []
      };
    },

    element: function (tagName) {
      var node = this.generateElement(tagName);
      this.currentNode.childNodes.push(node);
      return node;
    },

    generateMustache: function (content, escaped) {
      return {
        type: "mustache",
        escaped: escaped !== false,
        content: content
      };
    },

    mustache: function (content, escaped) {
      var node = this.generateMustache(content, escaped);
      this.currentNode.childNodes.push(node);
      return node;
    },

    generateBlock: function (content) {
      return {
        type: "block",
        content: content,
        childNodes: [],
        inverseChildNodes: []
      };
    },

    block: function (content) {
      var node = this.generateBlock(content);
      this.currentNode.childNodes.push(node);
      return node;
    },

    attribute: function (attrName, attrContent) {
      var node = {
        type: "attribute",
        name: attrName,
        content: attrContent
      };

      this.currentNode.attrStaches.push(node);
      return node;
    },

    generateClassNameBinding: function (classNameBinding) {
      return {
        type: "classNameBinding",
        name: classNameBinding // could be "color", or could be "hasColor:red" or ":color"
      };
    },

    classNameBinding: function (classNameBinding) {
      var node = this.generateClassNameBinding(classNameBinding);
      this.currentNode.classNameBindings.push(node);
      return node;
    },

    enter: function (node) {
      this.previousNodes.push(this.currentNode);
      this.currentNode = node;
    },

    exit: function () {
      var lastNode = this.currentNode;
      this.currentNode = this.previousNodes.pop();
      return lastNode;
    },

    add: function (label, node) {
      if (Array.isArray(node)) {
        for (var i = 0, l = node.length; i < l; i++) {
          this.add(label, node[i]);
        }
      } else {
        this.currentNode[label].push(node);
      }
    }
  };

});
define('emblem/bootstrap', ['emblem/compiler'], function (compiler) {

  'use strict';

  function compileScriptTags(scope) {
    var Handlebars = scope.Handlebars;
    var Ember = scope.Ember;

    if (typeof Ember === "undefined" || Ember === null) {
      throw new Error("Can't run Emblem.enableEmber before Ember has been defined");
    }
    if (typeof document !== "undefined" && document !== null) {
      return Ember.$("script[type=\"text/x-emblem\"], script[type=\"text/x-raw-emblem\"]", Ember.$(document)).each(function () {
        var handlebarsVariant, script, templateName;
        script = Ember.$(this);
        handlebarsVariant = script.attr("type") === "text/x-raw-handlebars" ? Handlebars : Ember.Handlebars;
        templateName = script.attr("data-template-name") || script.attr("id") || "application";
        Ember.TEMPLATES[templateName] = compiler.compile(handlebarsVariant, script.html());
        return script.remove();
      });
    }
  }

  if (typeof window !== "undefined" && window !== null) {
    var ENV = window.ENV || (window.ENV = {});
    ENV.EMBER_LOAD_HOOKS = ENV.EMBER_LOAD_HOOKS || {};
    ENV.EMBER_LOAD_HOOKS.application = ENV.EMBER_LOAD_HOOKS.application || [];
    ENV.EMBER_LOAD_HOOKS.application.push(compileScriptTags);
    ENV.EMBER_LOAD_HOOKS["Ember.Application"] = ENV.EMBER_LOAD_HOOKS["Ember.Application"] || [];
    ENV.EMBER_LOAD_HOOKS["Ember.Application"].push(function (Application) {
      if (Application.initializer) {
        return Application.initializer({
          name: "emblemDomTemplates",
          before: "registerComponentLookup",
          initialize: compileScriptTags
        });
      } else {
        return window.Ember.onLoad("application", compileScriptTags);
      }
    });
  }

});
define('emblem/compiler', ['exports', 'emblem/parser', 'emblem/parser-delegate/ember', 'emblem/preprocessor', 'emblem/template-compiler', 'emblem/ast-builder'], function (exports, parser, EmberDelegate, preprocessor, template_compiler, ast_builder) {

  'use strict';

  exports.compile = compile;

  function compile(emblem) {
    var builder = ast_builder.generateBuilder();
    var processedEmblem = preprocessor.processSync(emblem);
    parser.parse(processedEmblem, { builder: builder });
    var ast = builder.toAST();
    var result = template_compiler.compile(ast);
    return result;
  }

});
define('emblem/mustache-parser', ['exports', 'emblem/ast-builder'], function (exports, ast_builder) {

  'use strict';

  /*jshint newcap: false, laxbreak: true */
  var Parser = (function() {
    /*
     * Generated by PEG.js 0.8.0.
     *
     * http://pegjs.majda.cz/
     */

    function peg$subclass(child, parent) {
      function ctor() { this.constructor = child; }
      ctor.prototype = parent.prototype;
      child.prototype = new ctor();
    }

    function SyntaxError(message, expected, found, offset, line, column) {
      this.message  = message;
      this.expected = expected;
      this.found    = found;
      this.offset   = offset;
      this.line     = line;
      this.column   = column;

      this.name     = "SyntaxError";
    }

    peg$subclass(SyntaxError, Error);

    function parse(input) {
      var options = arguments.length > 1 ? arguments[1] : {},

          peg$FAILED = {},

          peg$startRuleFunctions = { start: peg$parsestart },
          peg$startRuleFunction  = peg$parsestart,

          peg$c0 = peg$FAILED,
          peg$c1 = [],
          peg$c2 = function(name, attrs) {
            attrs = attrs.concat(name.shorthands);

            var ret = {
              name: name.name,
              attrs: attrs
            };
            if (name.modifier) {
              ret.modifier = name.modifier;
            }

            return ret;
          },
          peg$c3 = function(name, shorthands) {
            return {
              name: name.name,
              modifier: name.modifier,
              shorthands: shorthands
            };
          },
          peg$c4 = "%",
          peg$c5 = { type: "literal", value: "%", description: "\"%\"" },
          peg$c6 = function(tagName) {
            return 'tagName="' + tagName + '"';
          },
          peg$c7 = "#",
          peg$c8 = { type: "literal", value: "#", description: "\"#\"" },
          peg$c9 = function(idName) {
            return 'elementId="' + idName + '"';
          },
          peg$c10 = ".",
          peg$c11 = { type: "literal", value: ".", description: "\".\"" },
          peg$c12 = function(className) {
            return 'class="' + className + '"';
          },
          peg$c13 = /^[A-Za-z0-9\-]/,
          peg$c14 = { type: "class", value: "[A-Za-z0-9\\-]", description: "[A-Za-z0-9\\-]" },
          peg$c15 = void 0,
          peg$c16 = null,
          peg$c17 = function(name, modifier) {
            return {
              name: name,
              modifier: modifier
            };
          },
          peg$c18 = "-",
          peg$c19 = { type: "literal", value: "-", description: "\"-\"" },
          peg$c20 = /^[0-9]/,
          peg$c21 = { type: "class", value: "[0-9]", description: "[0-9]" },
          peg$c22 = "!",
          peg$c23 = { type: "literal", value: "!", description: "\"!\"" },
          peg$c24 = "?",
          peg$c25 = { type: "literal", value: "?", description: "\"?\"" },
          peg$c26 = /^[A-Za-z0-9\-_]/,
          peg$c27 = { type: "class", value: "[A-Za-z0-9\\-_]", description: "[A-Za-z0-9\\-_]" },
          peg$c28 = "=",
          peg$c29 = { type: "literal", value: "=", description: "\"=\"" },
          peg$c30 = function(attrName, attrValue) {
            return attrName + '=' + attrValue;
          },
          peg$c31 = function(v) {
            return v;
          },
          peg$c32 = "\"",
          peg$c33 = { type: "literal", value: "\"", description: "\"\\\"\"" },
          peg$c34 = "'",
          peg$c35 = { type: "literal", value: "'", description: "\"'\"" },
          peg$c36 = /^[^'"]/,
          peg$c37 = { type: "class", value: "[^'\"]", description: "[^'\"]" },
          peg$c38 = /^[^()]/,
          peg$c39 = { type: "class", value: "[^()]", description: "[^()]" },
          peg$c40 = "/",
          peg$c41 = { type: "literal", value: "/", description: "\"/\"" },
          peg$c42 = function(p) {
            return p;
          },
          peg$c43 = "(",
          peg$c44 = { type: "literal", value: "(", description: "\"(\"" },
          peg$c45 = ")",
          peg$c46 = { type: "literal", value: ")", description: "\")\"" },
          peg$c47 = " ",
          peg$c48 = { type: "literal", value: " ", description: "\" \"" },

          peg$currPos          = 0,
          peg$reportedPos      = 0,
          peg$cachedPos        = 0,
          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
          peg$maxFailPos       = 0,
          peg$maxFailExpected  = [],
          peg$silentFails      = 0,

          peg$result;

      if ("startRule" in options) {
        if (!(options.startRule in peg$startRuleFunctions)) {
          throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
        }

        peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
      }

      function text() {
        return input.substring(peg$reportedPos, peg$currPos);
      }

      function offset() {
        return peg$reportedPos;
      }

      function line() {
        return peg$computePosDetails(peg$reportedPos).line;
      }

      function column() {
        return peg$computePosDetails(peg$reportedPos).column;
      }

      function expected(description) {
        throw peg$buildException(
          null,
          [{ type: "other", description: description }],
          peg$reportedPos
        );
      }

      function error(message) {
        throw peg$buildException(message, null, peg$reportedPos);
      }

      function peg$computePosDetails(pos) {
        function advance(details, startPos, endPos) {
          var p, ch;

          for (p = startPos; p < endPos; p++) {
            ch = input.charAt(p);
            if (ch === "\n") {
              if (!details.seenCR) { details.line++; }
              details.column = 1;
              details.seenCR = false;
            } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
              details.line++;
              details.column = 1;
              details.seenCR = true;
            } else {
              details.column++;
              details.seenCR = false;
            }
          }
        }

        if (peg$cachedPos !== pos) {
          if (peg$cachedPos > pos) {
            peg$cachedPos = 0;
            peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
          }
          advance(peg$cachedPosDetails, peg$cachedPos, pos);
          peg$cachedPos = pos;
        }

        return peg$cachedPosDetails;
      }

      function peg$fail(expected) {
        if (peg$currPos < peg$maxFailPos) { return; }

        if (peg$currPos > peg$maxFailPos) {
          peg$maxFailPos = peg$currPos;
          peg$maxFailExpected = [];
        }

        peg$maxFailExpected.push(expected);
      }

      function peg$buildException(message, expected, pos) {
        function cleanupExpected(expected) {
          var i = 1;

          expected.sort(function(a, b) {
            if (a.description < b.description) {
              return -1;
            } else if (a.description > b.description) {
              return 1;
            } else {
              return 0;
            }
          });

          while (i < expected.length) {
            if (expected[i - 1] === expected[i]) {
              expected.splice(i, 1);
            } else {
              i++;
            }
          }
        }

        function buildMessage(expected, found) {
          function stringEscape(s) {
            function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

            return s
              .replace(/\\/g,   '\\\\')
              .replace(/"/g,    '\\"')
              .replace(/\x08/g, '\\b')
              .replace(/\t/g,   '\\t')
              .replace(/\n/g,   '\\n')
              .replace(/\f/g,   '\\f')
              .replace(/\r/g,   '\\r')
              .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
              .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
              .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
              .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
          }

          var expectedDescs = new Array(expected.length),
              expectedDesc, foundDesc, i;

          for (i = 0; i < expected.length; i++) {
            expectedDescs[i] = expected[i].description;
          }

          expectedDesc = expected.length > 1
            ? expectedDescs.slice(0, -1).join(", ")
                + " or "
                + expectedDescs[expected.length - 1]
            : expectedDescs[0];

          foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

          return "Expected " + expectedDesc + " but " + foundDesc + " found.";
        }

        var posDetails = peg$computePosDetails(pos),
            found      = pos < input.length ? input.charAt(pos) : null;

        if (expected !== null) {
          cleanupExpected(expected);
        }

        return new SyntaxError(
          message !== null ? message : buildMessage(expected, found),
          expected,
          found,
          pos,
          posDetails.line,
          posDetails.column
        );
      }

      function peg$parsestart() {
        var s0;

        s0 = peg$parsenewMustache();

        return s0;
      }

      function peg$parsenewMustache() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$parsenewMustacheStart();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parsem_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsem_();
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parsenewMustacheAttr();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parsenewMustacheAttr();
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c2(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsenewMustacheStart() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$parsenewMustacheName();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parsem_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsem_();
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parsenewMustacheShortHand();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parsenewMustacheShortHand();
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c3(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsenewMustacheShortHand() {
        var s0;

        s0 = peg$parsem_shortHandTagName();
        if (s0 === peg$FAILED) {
          s0 = peg$parsem_shortHandIdName();
          if (s0 === peg$FAILED) {
            s0 = peg$parsem_shortHandClassName();
          }
        }

        return s0;
      }

      function peg$parsem_shortHandTagName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 37) {
          s1 = peg$c4;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c5); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsenewMustacheShortHandName();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c6(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsem_shortHandIdName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 35) {
          s1 = peg$c7;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c8); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsenewMustacheShortHandName();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c9(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsem_shortHandClassName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 46) {
          s1 = peg$c10;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c11); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsenewMustacheShortHandName();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c12(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsenewMustacheShortHandName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        if (peg$c13.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c14); }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            if (peg$c13.test(input.charAt(peg$currPos))) {
              s2 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c14); }
            }
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsenewMustacheName() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        s2 = peg$parsem_invalidNameStartChar();
        peg$silentFails--;
        if (s2 === peg$FAILED) {
          s1 = peg$c15;
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = [];
          s4 = peg$parsenewMustacheNameChar();
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parsenewMustacheNameChar();
            }
          } else {
            s3 = peg$c0;
          }
          if (s3 !== peg$FAILED) {
            s3 = input.substring(s2, peg$currPos);
          }
          s2 = s3;
          if (s2 !== peg$FAILED) {
            s3 = peg$parsem_modifierChar();
            if (s3 === peg$FAILED) {
              s3 = peg$c16;
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c17(s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsem_invalidNameStartChar() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 46) {
          s0 = peg$c10;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c11); }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 45) {
            s0 = peg$c18;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c19); }
          }
          if (s0 === peg$FAILED) {
            if (peg$c20.test(input.charAt(peg$currPos))) {
              s0 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c21); }
            }
          }
        }

        return s0;
      }

      function peg$parsem_modifierChar() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 33) {
          s0 = peg$c22;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c23); }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 63) {
            s0 = peg$c24;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c25); }
          }
        }

        return s0;
      }

      function peg$parsenewMustacheNameChar() {
        var s0;

        if (peg$c26.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c27); }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 46) {
            s0 = peg$c10;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c11); }
          }
        }

        return s0;
      }

      function peg$parsenewMustacheAttr() {
        var s0;

        s0 = peg$parsem_keyValue();
        if (s0 === peg$FAILED) {
          s0 = peg$parsem_parenthetical();
          if (s0 === peg$FAILED) {
            s0 = peg$parsenewMustacheAttrValue();
          }
        }

        return s0;
      }

      function peg$parsem_keyValue() {
        var s0, s1, s2, s3, s4, s5, s6, s7;

        s0 = peg$currPos;
        s1 = peg$parsenewMustacheAttrName();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parsem_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsem_();
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 61) {
              s3 = peg$c28;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c29); }
            }
            if (s3 !== peg$FAILED) {
              s4 = [];
              s5 = peg$parsem_();
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                s5 = peg$parsem_();
              }
              if (s4 !== peg$FAILED) {
                s5 = peg$parsenewMustacheAttrValue();
                if (s5 !== peg$FAILED) {
                  s6 = [];
                  s7 = peg$parsem_();
                  while (s7 !== peg$FAILED) {
                    s6.push(s7);
                    s7 = peg$parsem_();
                  }
                  if (s6 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c30(s1, s5);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsenewMustacheAttrName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsenewMustacheNameChar();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parsenewMustacheNameChar();
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsenewMustacheAttrValue() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = peg$parsem_quotedString();
        if (s1 === peg$FAILED) {
          s1 = peg$parsem_valuePath();
          if (s1 === peg$FAILED) {
            s1 = peg$parsem_parenthetical();
          }
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parsem_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsem_();
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c31(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsem_valuePath() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsenewMustacheNameChar();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parsenewMustacheNameChar();
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsem_quotedString() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 34) {
          s2 = peg$c32;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c33); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsem_stringWithoutDouble();
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 34) {
              s4 = peg$c32;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c33); }
            }
            if (s4 !== peg$FAILED) {
              s2 = [s2, s3, s4];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$c0;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c34;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c35); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parsem_stringWithoutSingle();
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 39) {
                s4 = peg$c34;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c35); }
              }
              if (s4 !== peg$FAILED) {
                s2 = [s2, s3, s4];
                s1 = s2;
              } else {
                peg$currPos = s1;
                s1 = peg$c0;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$c0;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
          if (s1 !== peg$FAILED) {
            s1 = input.substring(s0, peg$currPos);
          }
          s0 = s1;
        }

        return s0;
      }

      function peg$parsem_stringWithoutDouble() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsem_inStringChar();
        if (s2 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c34;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c35); }
          }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parsem_inStringChar();
            if (s2 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 39) {
                s2 = peg$c34;
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c35); }
              }
            }
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsem_stringWithoutSingle() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsem_inStringChar();
        if (s2 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 34) {
            s2 = peg$c32;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c33); }
          }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parsem_inStringChar();
            if (s2 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 34) {
                s2 = peg$c32;
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c33); }
              }
            }
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsem_inStringChar() {
        var s0;

        if (peg$c36.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c37); }
        }

        return s0;
      }

      function peg$parsem_inParensChar() {
        var s0;

        if (peg$c38.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c39); }
        }

        return s0;
      }

      function peg$parsem_commentChar() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 47) {
          s0 = peg$c40;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c41); }
        }

        return s0;
      }

      function peg$parsem_parenthetical() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsem_();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsem_();
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = peg$currPos;
          s4 = peg$parsem_OPEN_PAREN();
          if (s4 !== peg$FAILED) {
            s5 = [];
            s6 = peg$parsem_inParensChar();
            while (s6 !== peg$FAILED) {
              s5.push(s6);
              s6 = peg$parsem_inParensChar();
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parsem_parenthetical();
              if (s6 === peg$FAILED) {
                s6 = peg$c16;
              }
              if (s6 !== peg$FAILED) {
                s7 = [];
                s8 = peg$parsem_inParensChar();
                while (s8 !== peg$FAILED) {
                  s7.push(s8);
                  s8 = peg$parsem_inParensChar();
                }
                if (s7 !== peg$FAILED) {
                  s8 = peg$parsem_CLOSE_PAREN();
                  if (s8 !== peg$FAILED) {
                    s4 = [s4, s5, s6, s7, s8];
                    s3 = s4;
                  } else {
                    peg$currPos = s3;
                    s3 = peg$c0;
                  }
                } else {
                  peg$currPos = s3;
                  s3 = peg$c0;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
          if (s3 !== peg$FAILED) {
            s3 = input.substring(s2, peg$currPos);
          }
          s2 = s3;
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parsem_();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parsem_();
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c42(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsem_OPEN_PAREN() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 40) {
          s0 = peg$c43;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c44); }
        }

        return s0;
      }

      function peg$parsem_CLOSE_PAREN() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 41) {
          s0 = peg$c45;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c46); }
        }

        return s0;
      }

      function peg$parsem_() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 32) {
          s0 = peg$c47;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c48); }
        }

        return s0;
      }

      peg$result = peg$startRuleFunction();

      if (peg$result !== peg$FAILED && peg$currPos === input.length) {
        return peg$result;
      } else {
        if (peg$result !== peg$FAILED && peg$currPos < input.length) {
          peg$fail({ type: "end", description: "end of input" });
        }

        throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
      }
    }

    return {
      SyntaxError: SyntaxError,
      parse:       parse
    };
  })();
  var parse = Parser.parse, ParserSyntaxError = Parser.SyntaxError;
  exports['default'] = parse;

  exports.ParserSyntaxError = ParserSyntaxError;
  exports.parse = parse;

});
define('emblem/parser-delegate/base', ['exports'], function (exports) {

  'use strict';

  var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

  var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  var ParserDelegate = (function () {
    function ParserDelegate(AST, parse) {
      _classCallCheck(this, ParserDelegate);

      _get(Object.getPrototypeOf(ParserDelegate.prototype), "constructor", this).call(this, AST, parse);
    }

    _prototypeProperties(ParserDelegate, null, {
      capitalizedLineStarterMustache: {
        value: function capitalizedLineStarterMustache(node) {
          if (node.mustache) {
            node.mustache = this.handleCapitalizedMustache(node.mustache);
            return node;
          } else {
            return this.handleCapitalizedMustache(node);
          }
        },
        writable: true,
        configurable: true
      },
      handleCapitalizedMustache: {
        value: function handleCapitalizedMustache(mustache) {
          return mustache;
        },
        writable: true,
        configurable: true
      },
      rawMustacheAttribute: {
        value: function rawMustacheAttribute(key, id) {
          var mustacheNode = this.createMustacheNode([id], null, true);

          mustacheNode = this.handleUnboundSuffix(mustacheNode, id);

          return [new this.AST.ContentNode(key + "=" + "\""), mustacheNode, new this.AST.ContentNode("\"")];
        },
        writable: true,
        configurable: true
      },
      handleUnboundSuffix: {
        value: function handleUnboundSuffix(mustacheNode, id) {
          return mustacheNode;
        },
        writable: true,
        configurable: true
      },
      unshiftParam: {

        // Returns a new MustacheNode with a new preceding param (id).
        value: function unshiftParam(mustacheNode, helperName, newHashPairs) {
          var hash = mustacheNode.hash;

          // Merge hash.
          if (newHashPairs) {
            hash = hash || new this.AST.HashNode([]);

            for (var i = 0; i < newHashPairs.length; ++i) {
              hash.pairs.push(newHashPairs[i]);
            }
          }

          var params = [mustacheNode.id].concat(mustacheNode.params);
          params.unshift(new this.AST.IdNode([{ part: helperName }]));
          return this.createMustacheNode(params, hash, mustacheNode.escaped);
        },
        writable: true,
        configurable: true
      },
      createMustacheNode: {
        value: function createMustacheNode(params, hash, escaped) {
          var open = escaped ? "{{" : "{{{";
          return new this.AST.MustacheNode(params, hash, open, { left: false, right: false });
        },
        writable: true,
        configurable: true
      },
      createProgramNode: {
        value: function createProgramNode(statements, inverse) {
          return new this.AST.ProgramNode(statements, { left: false, right: false }, inverse, null);
        },
        writable: true,
        configurable: true
      }
    });

    return ParserDelegate;
  })();

  exports['default'] = ParserDelegate;

});
define('emblem/parser-delegate/ember', ['exports', 'emblem/parser-delegate/base'], function (exports, ParserDelegate) {

  'use strict';

  var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

  var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  /* jshint proto: true */

  var EmberParserDelegate = (function (ParserDelegate) {
    function EmberParserDelegate(AST, parse) {
      _classCallCheck(this, EmberParserDelegate);

      this.AST = AST;
      this.recursiveParse = parse;
    }

    _inherits(EmberParserDelegate, ParserDelegate);

    _prototypeProperties(EmberParserDelegate, null, {
      handleCapitalizedMustache: {
        value: function handleCapitalizedMustache(mustache) {
          return this.unshiftParam(mustache, "view");
        },
        writable: true,
        configurable: true
      },
      handleUnboundSuffix: {
        value: function handleUnboundSuffix(mustacheNode, id) {
          if (id._emblemSuffixModifier === "!") {
            return this.unshiftParam(mustacheNode, "unbound");
          } else {
            return mustacheNode;
          }
        },
        writable: true,
        configurable: true
      }
    });

    return EmberParserDelegate;
  })(ParserDelegate['default']);

  exports['default'] = EmberParserDelegate;

});
define('emblem/parser', ['exports', 'emblem/ast-builder'], function (exports, ast_builder) {

  'use strict';

  /*jshint newcap: false, laxbreak: true */
  var Parser = (function() {
    /*
     * Generated by PEG.js 0.8.0.
     *
     * http://pegjs.majda.cz/
     */

    function peg$subclass(child, parent) {
      function ctor() { this.constructor = child; }
      ctor.prototype = parent.prototype;
      child.prototype = new ctor();
    }

    function SyntaxError(message, expected, found, offset, line, column) {
      this.message  = message;
      this.expected = expected;
      this.found    = found;
      this.offset   = offset;
      this.line     = line;
      this.column   = column;

      this.name     = "SyntaxError";
    }

    peg$subclass(SyntaxError, Error);

    function parse(input) {
      var options = arguments.length > 1 ? arguments[1] : {},

          peg$FAILED = {},

          peg$startRuleFunctions = { start: peg$parsestart },
          peg$startRuleFunction  = peg$parsestart,

          peg$c0 = peg$FAILED,
          peg$c1 = null,
          peg$c2 = [],
          peg$c3 = function(c) {return c;},
          peg$c4 = function(c, i) {
            builder.add('childNodes', c);
          },
          peg$c5 = function(c, i) {
            return [c,i];
          },
          peg$c6 = "=",
          peg$c7 = { type: "literal", value: "=", description: "\"=\"" },
          peg$c8 = "else",
          peg$c9 = { type: "literal", value: "else", description: "\"else\"" },
          peg$c10 = function(statements) {
            return statements;
          },
          peg$c11 = { type: "other", description: "BeginStatement" },
          peg$c12 = { type: "other", description: "ContentStatement" },
          peg$c13 = function() { return []; },
          peg$c14 = ">",
          peg$c15 = { type: "literal", value: ">", description: "\">\"" },
          peg$c16 = function(n, params) {
            return [new AST.PartialNode(n, params[0], undefined, {})];
          },
          peg$c17 = /^[a-zA-Z0-9_$-\/]/,
          peg$c18 = { type: "class", value: "[a-zA-Z0-9_$-\\/]", description: "[a-zA-Z0-9_$-\\/]" },
          peg$c19 = function(s) {
              return new AST.PartialNameNode(new AST.StringNode(s));
            },
          peg$c20 = function(mustacheTuple) {
            var mustacheOrBlock = createBlockOrMustache(mustacheTuple);

            return [mustacheOrBlock];
          },
          peg$c21 = "/",
          peg$c22 = { type: "literal", value: "/", description: "\"/\"" },
          peg$c23 = function(mustacheTuple) {
            return mustacheTuple;
          },
          peg$c24 = void 0,
          peg$c25 = /^[A-Z]/,
          peg$c26 = { type: "class", value: "[A-Z]", description: "[A-Z]" },
          peg$c27 = function(mustacheTuple) {
            var mustache = mustacheTuple[0];
            var block = mustacheTuple[1];
            mustache.isViewHelper = true;

            return [mustache, block];
          },
          peg$c28 = " ",
          peg$c29 = { type: "literal", value: " ", description: "\" \"" },
          peg$c30 = function(ret, multilineContent) {
            if(multilineContent) {
              multilineContent = multilineContent[1];
              for(var i = 0, len = multilineContent.length; i < len; ++i) {
                ret.push(' ');
                ret = ret.concat(multilineContent[i]);
              }
            }
            return ret;
          },
          peg$c31 = function(c) { return c; },
          peg$c32 = function(mustacheTuple) {
              var blockOrMustache = createBlockOrMustache(mustacheTuple);
              return [blockOrMustache];
            },
          peg$c33 = "]",
          peg$c34 = { type: "literal", value: "]", description: "\"]\"" },
          peg$c35 = function(h) { return h;},
          peg$c36 = function(h, nested) {
            if (nested && nested.length > 0) {
              nested = castStringsToTextNodes(nested);
              builder.add('childNodes', nested);
            }

            return [builder.exit()];
          },
          peg$c37 = function(mustacheContent, blockTuple) {
            if (blockTuple) {
              return [mustacheContent, blockTuple];
            } else {
              return [mustacheContent];
            }
          },
          peg$c38 = ": ",
          peg$c39 = { type: "literal", value: ": ", description: "\": \"" },
          peg$c40 = function(statements) { return statements; },
          peg$c41 = function(statements) { return astDelegate.createProgramNode(statements, []); },
          peg$c42 = function(i) { return i },
          peg$c43 = function(block) {
              return block;
            },
          peg$c44 = function(e, mustacheTuple) {
            var mustache = mustacheTuple[0];
            var block = mustacheTuple[1];

            mustache.isEscaped = e;

            return [mustache, block];
          },
          peg$c45 = "[",
          peg$c46 = { type: "literal", value: "[", description: "\"[\"" },
          peg$c47 = function(isPartial, mustache) {
            if(isPartial) {
              var n = new AST.PartialNameNode(new AST.StringNode(sexpr.id.string));
              return new AST.PartialNode(n, sexpr.params[0], undefined, {});
            }
            return mustache;
          },
          peg$c48 = function(t) { return ['tagName', t]; },
          peg$c49 = function(i) { return ['elementId', i]; },
          peg$c50 = function(c) { return ['class', c]; },
          peg$c51 = function(a) {
            return a;
          },
          peg$c52 = function(p) { return p; },
          peg$c53 = function(a) { return a; },
          peg$c54 = { type: "other", description: "PathIdent" },
          peg$c55 = "..",
          peg$c56 = { type: "literal", value: "..", description: "\"..\"" },
          peg$c57 = ".",
          peg$c58 = { type: "literal", value: ".", description: "\".\"" },
          peg$c59 = /^[a-zA-Z0-9_$\-!?\^@]/,
          peg$c60 = { type: "class", value: "[a-zA-Z0-9_$\\-!?\\^@]", description: "[a-zA-Z0-9_$\\-!?\\^@]" },
          peg$c61 = function(s) { return s; },
          peg$c62 = /^[^\]]/,
          peg$c63 = { type: "class", value: "[^\\]]", description: "[^\\]]" },
          peg$c64 = function(segmentLiteral) { return segmentLiteral; },
          peg$c65 = { type: "other", description: "Key" },
          peg$c66 = ":",
          peg$c67 = { type: "literal", value: ":", description: "\":\"" },
          peg$c68 = function(s, p) { return { part: p, separator: s }; },
          peg$c69 = function(first, tail) {
            var ret = [{ part: first }];
            for(var i = 0; i < tail.length; ++i) {
              ret.push(tail[i]);
            }
            return ret;
          },
          peg$c70 = { type: "other", description: "PathSeparator" },
          peg$c71 = /^[\/.]/,
          peg$c72 = { type: "class", value: "[\\/.]", description: "[\\/.]" },
          peg$c73 = function(v) {
            var last = v[v.length - 1];
            var idNode;

            // Support for data keywords that are prefixed with @ in the each
            // block helper such as @index, @key, @first, @last
            if (last.part.charAt(0) === '@') {
              last.part = last.part.slice(1);
              idNode = new AST.IdNode(v);
              var dataNode = new AST.DataNode(idNode);
              return dataNode;
            }

            var match;
            var suffixModifier;

            // FIXME probably need to handle this better?
            if (match = last.part.match(/!$/)) {
              last.part = 'unbound ' + last.part.slice(0, -1);
            }
            if(match = last.part.match(/[\?\^]$/)) {
              suffixModifier = match[0];
              throw "unhandled path terminated: " + suffixModifier;
            }

            return last.part;
          },
          peg$c74 = function(v) { return new AST.StringNode(v); },
          peg$c75 = function(v) { return new AST.NumberNode(v); },
          peg$c76 = function(v) { return new AST.BooleanNode(v); },
          peg$c77 = { type: "other", description: "Boolean" },
          peg$c78 = "true",
          peg$c79 = { type: "literal", value: "true", description: "\"true\"" },
          peg$c80 = "false",
          peg$c81 = { type: "literal", value: "false", description: "\"false\"" },
          peg$c82 = { type: "other", description: "Integer" },
          peg$c83 = "-",
          peg$c84 = { type: "literal", value: "-", description: "\"-\"" },
          peg$c85 = /^[0-9]/,
          peg$c86 = { type: "class", value: "[0-9]", description: "[0-9]" },
          peg$c87 = function(s) { return parseInt(s); },
          peg$c88 = "\"",
          peg$c89 = { type: "literal", value: "\"", description: "\"\\\"\"" },
          peg$c90 = "'",
          peg$c91 = { type: "literal", value: "'", description: "\"'\"" },
          peg$c92 = function(p) { return p[1]; },
          peg$c93 = function(p) {
            return p;
          },
          peg$c94 = /^[^"}]/,
          peg$c95 = { type: "class", value: "[^\"}]", description: "[^\"}]" },
          peg$c96 = /^[^'}]/,
          peg$c97 = { type: "class", value: "[^'}]", description: "[^'}]" },
          peg$c98 = /^[A-Za-z]/,
          peg$c99 = { type: "class", value: "[A-Za-z]", description: "[A-Za-z]" },
          peg$c100 = function(nodes) {
            return nodes;
          },
          peg$c101 = /^[|`']/,
          peg$c102 = { type: "class", value: "[|`']", description: "[|`']" },
          peg$c103 = "<",
          peg$c104 = { type: "literal", value: "<", description: "\"<\"" },
          peg$c105 = function() { return '<'; },
          peg$c106 = function(w) { return w;},
          peg$c107 = function(s, nodes, indentedNodes) {
            var i, l;

            var hasNodes = nodes && nodes.length,
                hasIndentedNodes = indentedNodes && indentedNodes.length;

            // add a space after the first line if it had content and
            // there are indented nodes to follow
            if (hasNodes && hasIndentedNodes) { nodes.push(' '); }

            // concat indented nodes
            if (indentedNodes) {
              for (i=0, l=indentedNodes.length; i<l; i++) {
                nodes = nodes.concat(indentedNodes[i]);

                // connect logical lines with a space, skipping the next-to-last line
                if (i < l - 1) { nodes.push(' '); }
              }
            }

            // add trailing space to non-indented nodes if special modifier
            if (s === LINE_SPACE_MODIFIERS.SPACE) {
              nodes.push(' ');
            } else if (s === LINE_SPACE_MODIFIERS.NEWLINE) {
              nodes.push('\n');
            }

            return castStringsToTextNodes(nodes);
          },
          peg$c108 = function(first, tail) {
            return flattenArray(first, tail);
          },
          peg$c109 = function(first, tail) { return flattenArray(first, tail); },
          peg$c110 = "{",
          peg$c111 = { type: "literal", value: "{", description: "\"{\"" },
          peg$c112 = /^[^}]/,
          peg$c113 = { type: "class", value: "[^}]", description: "[^}]" },
          peg$c114 = function(text) {
            return text;
          },
          peg$c115 = function(content) {
            return builder.generateMustache( prepareMustachValue(content), true);
          },
          peg$c116 = function(content) {
            return builder.generateMustache( prepareMustachValue(content), false);
          },
          peg$c117 = { type: "any", description: "any character" },
          peg$c118 = function(m) {
              return builder.generateMustache( m, true );
            },
          peg$c119 = { type: "other", description: "SingleMustacheOpen" },
          peg$c120 = { type: "other", description: "DoubleMustacheOpen" },
          peg$c121 = "{{",
          peg$c122 = { type: "literal", value: "{{", description: "\"{{\"" },
          peg$c123 = { type: "other", description: "TripleMustacheOpen" },
          peg$c124 = "{{{",
          peg$c125 = { type: "literal", value: "{{{", description: "\"{{{\"" },
          peg$c126 = { type: "other", description: "SingleMustacheClose" },
          peg$c127 = "}",
          peg$c128 = { type: "literal", value: "}", description: "\"}\"" },
          peg$c129 = { type: "other", description: "DoubleMustacheClose" },
          peg$c130 = "}}",
          peg$c131 = { type: "literal", value: "}}", description: "\"}}\"" },
          peg$c132 = { type: "other", description: "TripleMustacheClose" },
          peg$c133 = "}}}",
          peg$c134 = { type: "literal", value: "}}}", description: "\"}}}\"" },
          peg$c135 = { type: "other", description: "SubexpressionOpen" },
          peg$c136 = "(",
          peg$c137 = { type: "literal", value: "(", description: "\"(\"" },
          peg$c138 = { type: "other", description: "SubexpressionClose" },
          peg$c139 = ")",
          peg$c140 = { type: "literal", value: ")", description: "\")\"" },
          peg$c141 = { type: "other", description: "InterpolationOpen" },
          peg$c142 = "#{",
          peg$c143 = { type: "literal", value: "#{", description: "\"#{\"" },
          peg$c144 = { type: "other", description: "InterpolationClose" },
          peg$c145 = "==",
          peg$c146 = { type: "literal", value: "==", description: "\"==\"" },
          peg$c147 = function() { return false; },
          peg$c148 = function() { return true; },
          peg$c149 = function(h, s) { return h || s; },
          peg$c150 = " [",
          peg$c151 = { type: "literal", value: " [", description: "\" [\"" },
          peg$c152 = function(h, inTagMustaches, fullAttributes) {
            return parseInHtml(h, inTagMustaches, fullAttributes);
          },
          peg$c153 = function(s) { return { shorthand: s, id: true}; },
          peg$c154 = function(s) { return { shorthand: s }; },
          peg$c155 = function(shorthands) {
            var id, classes = [];
            for(var i = 0, len = shorthands.length; i < len; ++i) {
              var shorthand = shorthands[i];
              if(shorthand.id) {
                id = shorthand.shorthand;
              } else {
                classes.push(shorthand.shorthand);
              }
            }

            return [id, classes];
          },
          peg$c156 = function(a) {
            return a || [];
          },
          peg$c157 = function(a) {
            if (a.length) {
              return a;
            } else {
              return [];
            }
          },
          peg$c158 = /^[A-Za-z.0-9_\-]/,
          peg$c159 = { type: "class", value: "[A-Za-z.0-9_\\-]", description: "[A-Za-z.0-9_\\-]" },
          peg$c160 = function(id) { return id; },
          peg$c161 = function(event, mustacheNode) {
            var actionBody, parts;

            if (typeof mustacheNode === 'string') {
              actionBody = mustacheNode;
            } else {
              parts = mustacheNode[1].split(' ');
              if (parts.length === 1) {
                actionBody = '"' + parts[0] + '"';
              } else {
                actionBody = mustacheNode[1];
              }
            }

            var actionContent = ['action'];
            actionContent.push(actionBody);
            actionContent.push('on="'+event+'"');
            return builder.generateMustache(actionContent.join(' '));
          },
          peg$c162 = function(key, boolValue) {
            if (boolValue === 'true') {
              return [key];
            }
          },
          peg$c163 = function(value) { return value.replace(/ *$/, ''); },
          peg$c164 = "!",
          peg$c165 = { type: "literal", value: "!", description: "\"!\"" },
          peg$c166 = function(key, value) {
            if (key === 'class') {
              return value.split(' ').map(function(v){
                return builder.generateClassNameBinding(v);
              });
            } else {
              return [builder.generateMustache('bind-attr ' + key + '=' + value)];
            }
          },
          peg$c167 = function(key, id) {
            return [key, '{{' + id + '}}'];
          },
          peg$c168 = function(key, nodes) {
            var strings = [];
            nodes.forEach(function(node){
              if (typeof node === 'string') {
                strings.push(node);
              } else {
                // FIXME here we transform a mustache attribute
                // This should be handled higher up instead, not here.
                // This happens when the attribute is something like:
                // src="{{unbound post.showLogoUrl}}".
                // key = "src", nodes[0] = "unbound post.showLogoUrl"
                if (node.escaped) {
                  strings.push('{{' + node.content + '}}');
                } else {
                  strings.push('{{{' + node.content + '}}}');
                }
              }
            });
            var result = [key, strings.join('')];
            return result;
          },
          peg$c169 = "_",
          peg$c170 = { type: "literal", value: "_", description: "\"_\"" },
          peg$c171 = "%",
          peg$c172 = { type: "literal", value: "%", description: "\"%\"" },
          peg$c173 = "#",
          peg$c174 = { type: "literal", value: "#", description: "\"#\"" },
          peg$c175 = function(c) { return c;},
          peg$c176 = { type: "other", description: "CSSIdentifier" },
          peg$c177 = /^[_a-zA-Z0-9\-]/,
          peg$c178 = { type: "class", value: "[_a-zA-Z0-9\\-]", description: "[_a-zA-Z0-9\\-]" },
          peg$c179 = /^[_a-zA-Z]/,
          peg$c180 = { type: "class", value: "[_a-zA-Z]", description: "[_a-zA-Z]" },
          peg$c181 = /^[\x80-\xFF]/,
          peg$c182 = { type: "class", value: "[\\x80-\\xFF]", description: "[\\x80-\\xFF]" },
          peg$c183 = { type: "other", description: "KnownHTMLTagName" },
          peg$c184 = function(t) { return !!KNOWN_TAGS[t]; },
          peg$c185 = function(t) { return t; },
          peg$c186 = { type: "other", description: "a JS event" },
          peg$c187 = function(t) { return !!KNOWN_EVENTS[t]; },
          peg$c188 = { type: "other", description: "INDENT" },
          peg$c189 = "\uEFEF",
          peg$c190 = { type: "literal", value: "\uEFEF", description: "\"\\uEFEF\"" },
          peg$c191 = function() { return ''; },
          peg$c192 = { type: "other", description: "DEDENT" },
          peg$c193 = "\uEFFE",
          peg$c194 = { type: "literal", value: "\uEFFE", description: "\"\\uEFFE\"" },
          peg$c195 = { type: "other", description: "Unmatched DEDENT" },
          peg$c196 = "\uEFEE",
          peg$c197 = { type: "literal", value: "\uEFEE", description: "\"\\uEFEE\"" },
          peg$c198 = { type: "other", description: "LineEnd" },
          peg$c199 = "\r",
          peg$c200 = { type: "literal", value: "\r", description: "\"\\r\"" },
          peg$c201 = "\uEFFF",
          peg$c202 = { type: "literal", value: "\uEFFF", description: "\"\\uEFFF\"" },
          peg$c203 = "\n",
          peg$c204 = { type: "literal", value: "\n", description: "\"\\n\"" },
          peg$c205 = { type: "other", description: "ANYDEDENT" },
          peg$c206 = { type: "other", description: "RequiredWhitespace" },
          peg$c207 = { type: "other", description: "OptionalWhitespace" },
          peg$c208 = { type: "other", description: "InlineWhitespace" },
          peg$c209 = /^[ \t]/,
          peg$c210 = { type: "class", value: "[ \\t]", description: "[ \\t]" },
          peg$c211 = function(name, attrs) {
            attrs = attrs.concat(name.shorthands);

            var ret = {
              name: name.name,
              attrs: attrs
            };
            if (name.modifier) {
              ret.modifier = name.modifier;
            }

            return ret;
          },
          peg$c212 = function(name, shorthands) {
            return {
              name: name.name,
              modifier: name.modifier,
              shorthands: shorthands
            };
          },
          peg$c213 = function(tagName) {
            return 'tagName="' + tagName + '"';
          },
          peg$c214 = function(idName) {
            return 'elementId="' + idName + '"';
          },
          peg$c215 = function(className) {
            return 'class="' + className + '"';
          },
          peg$c216 = /^[A-Za-z0-9\-]/,
          peg$c217 = { type: "class", value: "[A-Za-z0-9\\-]", description: "[A-Za-z0-9\\-]" },
          peg$c218 = function(name, modifier) {
            return {
              name: name,
              modifier: modifier
            };
          },
          peg$c219 = "?",
          peg$c220 = { type: "literal", value: "?", description: "\"?\"" },
          peg$c221 = /^[A-Za-z0-9\-_]/,
          peg$c222 = { type: "class", value: "[A-Za-z0-9\\-_]", description: "[A-Za-z0-9\\-_]" },
          peg$c223 = function(attrName, attrValue) {
            return attrName + '=' + attrValue;
          },
          peg$c224 = function(v) {
            return v;
          },
          peg$c225 = /^[^'"]/,
          peg$c226 = { type: "class", value: "[^'\"]", description: "[^'\"]" },
          peg$c227 = /^[^()]/,
          peg$c228 = { type: "class", value: "[^()]", description: "[^()]" },

          peg$currPos          = 0,
          peg$reportedPos      = 0,
          peg$cachedPos        = 0,
          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
          peg$maxFailPos       = 0,
          peg$maxFailExpected  = [],
          peg$silentFails      = 0,

          peg$result;

      if ("startRule" in options) {
        if (!(options.startRule in peg$startRuleFunctions)) {
          throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
        }

        peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
      }

      function text() {
        return input.substring(peg$reportedPos, peg$currPos);
      }

      function offset() {
        return peg$reportedPos;
      }

      function line() {
        return peg$computePosDetails(peg$reportedPos).line;
      }

      function column() {
        return peg$computePosDetails(peg$reportedPos).column;
      }

      function expected(description) {
        throw peg$buildException(
          null,
          [{ type: "other", description: description }],
          peg$reportedPos
        );
      }

      function error(message) {
        throw peg$buildException(message, null, peg$reportedPos);
      }

      function peg$computePosDetails(pos) {
        function advance(details, startPos, endPos) {
          var p, ch;

          for (p = startPos; p < endPos; p++) {
            ch = input.charAt(p);
            if (ch === "\n") {
              if (!details.seenCR) { details.line++; }
              details.column = 1;
              details.seenCR = false;
            } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
              details.line++;
              details.column = 1;
              details.seenCR = true;
            } else {
              details.column++;
              details.seenCR = false;
            }
          }
        }

        if (peg$cachedPos !== pos) {
          if (peg$cachedPos > pos) {
            peg$cachedPos = 0;
            peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
          }
          advance(peg$cachedPosDetails, peg$cachedPos, pos);
          peg$cachedPos = pos;
        }

        return peg$cachedPosDetails;
      }

      function peg$fail(expected) {
        if (peg$currPos < peg$maxFailPos) { return; }

        if (peg$currPos > peg$maxFailPos) {
          peg$maxFailPos = peg$currPos;
          peg$maxFailExpected = [];
        }

        peg$maxFailExpected.push(expected);
      }

      function peg$buildException(message, expected, pos) {
        function cleanupExpected(expected) {
          var i = 1;

          expected.sort(function(a, b) {
            if (a.description < b.description) {
              return -1;
            } else if (a.description > b.description) {
              return 1;
            } else {
              return 0;
            }
          });

          while (i < expected.length) {
            if (expected[i - 1] === expected[i]) {
              expected.splice(i, 1);
            } else {
              i++;
            }
          }
        }

        function buildMessage(expected, found) {
          function stringEscape(s) {
            function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

            return s
              .replace(/\\/g,   '\\\\')
              .replace(/"/g,    '\\"')
              .replace(/\x08/g, '\\b')
              .replace(/\t/g,   '\\t')
              .replace(/\n/g,   '\\n')
              .replace(/\f/g,   '\\f')
              .replace(/\r/g,   '\\r')
              .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
              .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
              .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
              .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
          }

          var expectedDescs = new Array(expected.length),
              expectedDesc, foundDesc, i;

          for (i = 0; i < expected.length; i++) {
            expectedDescs[i] = expected[i].description;
          }

          expectedDesc = expected.length > 1
            ? expectedDescs.slice(0, -1).join(", ")
                + " or "
                + expectedDescs[expected.length - 1]
            : expectedDescs[0];

          foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

          return "Expected " + expectedDesc + " but " + foundDesc + " found.";
        }

        var posDetails = peg$computePosDetails(pos),
            found      = pos < input.length ? input.charAt(pos) : null;

        if (expected !== null) {
          cleanupExpected(expected);
        }

        return new SyntaxError(
          message !== null ? message : buildMessage(expected, found),
          expected,
          found,
          pos,
          posDetails.line,
          posDetails.column
        );
      }

      function peg$parsestart() {
        var s0;

        s0 = peg$parseprogram();

        return s0;
      }

      function peg$parseprogram() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

        s0 = peg$currPos;
        s1 = peg$parsecontent();
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = peg$parseDEDENT();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseelse();
            if (s4 !== peg$FAILED) {
              s5 = peg$parse_();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseTERM();
                if (s6 !== peg$FAILED) {
                  s7 = [];
                  s8 = peg$parseblankLine();
                  while (s8 !== peg$FAILED) {
                    s7.push(s8);
                    s8 = peg$parseblankLine();
                  }
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseindentation();
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parsecontent();
                      if (s9 !== peg$FAILED) {
                        peg$reportedPos = s2;
                        s3 = peg$c3(s9);
                        s2 = s3;
                      } else {
                        peg$currPos = s2;
                        s2 = peg$c0;
                      }
                    } else {
                      peg$currPos = s2;
                      s2 = peg$c0;
                    }
                  } else {
                    peg$currPos = s2;
                    s2 = peg$c0;
                  }
                } else {
                  peg$currPos = s2;
                  s2 = peg$c0;
                }
              } else {
                peg$currPos = s2;
                s2 = peg$c0;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$c0;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c0;
          }
          if (s2 === peg$FAILED) {
            s2 = peg$c1;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c4(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parseinvertibleContent() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

        s0 = peg$currPos;
        s1 = peg$parsecontent();
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = peg$parseDEDENT();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseelse();
            if (s4 !== peg$FAILED) {
              s5 = peg$parse_();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseTERM();
                if (s6 !== peg$FAILED) {
                  s7 = [];
                  s8 = peg$parseblankLine();
                  while (s8 !== peg$FAILED) {
                    s7.push(s8);
                    s8 = peg$parseblankLine();
                  }
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseindentation();
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parsecontent();
                      if (s9 !== peg$FAILED) {
                        peg$reportedPos = s2;
                        s3 = peg$c3(s9);
                        s2 = s3;
                      } else {
                        peg$currPos = s2;
                        s2 = peg$c0;
                      }
                    } else {
                      peg$currPos = s2;
                      s2 = peg$c0;
                    }
                  } else {
                    peg$currPos = s2;
                    s2 = peg$c0;
                  }
                } else {
                  peg$currPos = s2;
                  s2 = peg$c0;
                }
              } else {
                peg$currPos = s2;
                s2 = peg$c0;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$c0;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c0;
          }
          if (s2 === peg$FAILED) {
            s2 = peg$c1;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c5(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parseelse() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 61) {
          s2 = peg$c6;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c7); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_();
          if (s3 !== peg$FAILED) {
            s2 = [s2, s3];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
        if (s1 === peg$FAILED) {
          s1 = peg$c1;
        }
        if (s1 !== peg$FAILED) {
          if (input.substr(peg$currPos, 4) === peg$c8) {
            s2 = peg$c8;
            peg$currPos += 4;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c9); }
          }
          if (s2 !== peg$FAILED) {
            s1 = [s1, s2];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsecontent() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsestatement();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsestatement();
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c10(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsestatement() {
        var s0, s1;

        peg$silentFails++;
        s0 = peg$parseblankLine();
        if (s0 === peg$FAILED) {
          s0 = peg$parsecomment();
          if (s0 === peg$FAILED) {
            s0 = peg$parsecontentStatement();
          }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c11); }
        }

        return s0;
      }

      function peg$parsecontentStatement() {
        var s0, s1;

        peg$silentFails++;
        s0 = peg$parselegacyPartialInvocation();
        if (s0 === peg$FAILED) {
          s0 = peg$parsehtmlElement();
          if (s0 === peg$FAILED) {
            s0 = peg$parsetextLine();
            if (s0 === peg$FAILED) {
              s0 = peg$parsemustache();
            }
          }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c12); }
        }

        return s0;
      }

      function peg$parseblankLine() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = peg$parse_();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseTERM();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c13();
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parselegacyPartialInvocation() {
        var s0, s1, s2, s3, s4, s5, s6;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 62) {
          s1 = peg$c14;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c15); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_();
          if (s2 !== peg$FAILED) {
            s3 = peg$parselegacyPartialName();
            if (s3 !== peg$FAILED) {
              s4 = [];
              s5 = peg$parseinMustacheParam();
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                s5 = peg$parseinMustacheParam();
              }
              if (s4 !== peg$FAILED) {
                s5 = peg$parse_();
                if (s5 !== peg$FAILED) {
                  s6 = peg$parseTERM();
                  if (s6 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c16(s3, s4);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parselegacyPartialName() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = [];
        if (peg$c17.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c18); }
        }
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            if (peg$c17.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c18); }
            }
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          s2 = input.substring(s1, peg$currPos);
        }
        s1 = s2;
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c19(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsemustache() {
        var s0, s1;

        s0 = peg$currPos;
        s1 = peg$parseexplicitMustache();
        if (s1 === peg$FAILED) {
          s1 = peg$parselineStartingMustache();
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c20(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsecommentContent() {
        var s0, s1, s2, s3, s4, s5, s6, s7;

        s0 = peg$currPos;
        s1 = peg$parselineContent();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseTERM();
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$currPos;
            s5 = peg$parseindentation();
            if (s5 !== peg$FAILED) {
              s6 = [];
              s7 = peg$parsecommentContent();
              if (s7 !== peg$FAILED) {
                while (s7 !== peg$FAILED) {
                  s6.push(s7);
                  s7 = peg$parsecommentContent();
                }
              } else {
                s6 = peg$c0;
              }
              if (s6 !== peg$FAILED) {
                s7 = peg$parseanyDedent();
                if (s7 !== peg$FAILED) {
                  s5 = [s5, s6, s7];
                  s4 = s5;
                } else {
                  peg$currPos = s4;
                  s4 = peg$c0;
                }
              } else {
                peg$currPos = s4;
                s4 = peg$c0;
              }
            } else {
              peg$currPos = s4;
              s4 = peg$c0;
            }
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$currPos;
              s5 = peg$parseindentation();
              if (s5 !== peg$FAILED) {
                s6 = [];
                s7 = peg$parsecommentContent();
                if (s7 !== peg$FAILED) {
                  while (s7 !== peg$FAILED) {
                    s6.push(s7);
                    s7 = peg$parsecommentContent();
                  }
                } else {
                  s6 = peg$c0;
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseanyDedent();
                  if (s7 !== peg$FAILED) {
                    s5 = [s5, s6, s7];
                    s4 = s5;
                  } else {
                    peg$currPos = s4;
                    s4 = peg$c0;
                  }
                } else {
                  peg$currPos = s4;
                  s4 = peg$c0;
                }
              } else {
                peg$currPos = s4;
                s4 = peg$c0;
              }
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c13();
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsecomment() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 47) {
          s1 = peg$c21;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c22); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsecommentContent();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c13();
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parseinlineComment() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 47) {
          s1 = peg$c21;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c22); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parselineContent();
          if (s2 !== peg$FAILED) {
            s1 = [s1, s2];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parselineStartingMustache() {
        var s0, s1;

        s0 = peg$currPos;
        s1 = peg$parsecapitalizedLineStarterMustache();
        if (s1 === peg$FAILED) {
          s1 = peg$parsemustacheOrBlock();
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c23(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsecapitalizedLineStarterMustache() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        if (peg$c25.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c26); }
        }
        peg$silentFails--;
        if (s2 !== peg$FAILED) {
          peg$currPos = s1;
          s1 = peg$c24;
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsemustacheOrBlock();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c27(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsehtmlNestedTextNodes() {
        var s0, s1, s2, s3, s4, s5, s6;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 32) {
          s1 = peg$c28;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c29); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsetextNodes();
          if (s2 !== peg$FAILED) {
            s3 = peg$currPos;
            s4 = peg$parseindentation();
            if (s4 !== peg$FAILED) {
              s5 = [];
              s6 = peg$parsewhitespaceableTextNodes();
              if (s6 !== peg$FAILED) {
                while (s6 !== peg$FAILED) {
                  s5.push(s6);
                  s6 = peg$parsewhitespaceableTextNodes();
                }
              } else {
                s5 = peg$c0;
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parseDEDENT();
                if (s6 !== peg$FAILED) {
                  s4 = [s4, s5, s6];
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$c0;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
            if (s3 === peg$FAILED) {
              s3 = peg$c1;
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c30(s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parseindentedContent() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parseblankLine();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parseblankLine();
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseindentation();
          if (s2 !== peg$FAILED) {
            s3 = peg$parsecontent();
            if (s3 !== peg$FAILED) {
              s4 = peg$parseDEDENT();
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c31(s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parseunindentedContent() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parseblankLine();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parseblankLine();
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsecontent();
          if (s2 !== peg$FAILED) {
            s3 = peg$parseDEDENT();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c31(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsehtmlTerminator() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$parsecolonContent();
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parse_();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseexplicitMustache();
            if (s2 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c32(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parse_();
            if (s1 !== peg$FAILED) {
              s2 = peg$parseinlineComment();
              if (s2 === peg$FAILED) {
                s2 = peg$c1;
              }
              if (s2 !== peg$FAILED) {
                s3 = peg$parseTERM();
                if (s3 !== peg$FAILED) {
                  s4 = peg$parseindentedContent();
                  if (s4 === peg$FAILED) {
                    s4 = peg$c1;
                  }
                  if (s4 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c31(s4);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parse_();
              if (s1 !== peg$FAILED) {
                s2 = peg$parseinlineComment();
                if (s2 === peg$FAILED) {
                  s2 = peg$c1;
                }
                if (s2 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 93) {
                    s3 = peg$c33;
                    peg$currPos++;
                  } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c34); }
                  }
                  if (s3 !== peg$FAILED) {
                    s4 = peg$parseTERM();
                    if (s4 !== peg$FAILED) {
                      s5 = peg$parseunindentedContent();
                      if (s5 === peg$FAILED) {
                        s5 = peg$c1;
                      }
                      if (s5 !== peg$FAILED) {
                        peg$reportedPos = s0;
                        s1 = peg$c31(s5);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parsehtmlNestedTextNodes();
                if (s1 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c35(s1);
                }
                s0 = s1;
              }
            }
          }
        }

        return s0;
      }

      function peg$parsehtmlElement() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = peg$parseinHtmlTag();
        if (s1 !== peg$FAILED) {
          s2 = peg$parsehtmlTerminator();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c36(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsemustacheOrBlock() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$parseinMustache();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_();
          if (s2 !== peg$FAILED) {
            s3 = peg$parseinlineComment();
            if (s3 === peg$FAILED) {
              s3 = peg$c1;
            }
            if (s3 !== peg$FAILED) {
              s4 = peg$parsemustacheNestedContent();
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c37(s1, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsecolonContent() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c38) {
          s1 = peg$c38;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c39); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_();
          if (s2 !== peg$FAILED) {
            s3 = peg$parsecontentStatement();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c31(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsemustacheNestedContent() {
        var s0, s1, s2, s3, s4, s5, s6;

        s0 = peg$currPos;
        s1 = peg$parsecolonContent();
        if (s1 === peg$FAILED) {
          s1 = peg$parsetextLine();
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c40(s1);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parse_();
          if (s1 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 93) {
              s2 = peg$c33;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c34); }
            }
            if (s2 !== peg$FAILED) {
              s3 = peg$parseTERM();
              if (s3 !== peg$FAILED) {
                s4 = peg$parsecolonContent();
                if (s4 === peg$FAILED) {
                  s4 = peg$parsetextLine();
                }
                if (s4 !== peg$FAILED) {
                  s5 = peg$parseDEDENT();
                  if (s5 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c41(s4);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parseTERM();
            if (s1 !== peg$FAILED) {
              s2 = peg$currPos;
              s3 = [];
              s4 = peg$parseblankLine();
              while (s4 !== peg$FAILED) {
                s3.push(s4);
                s4 = peg$parseblankLine();
              }
              if (s3 !== peg$FAILED) {
                s4 = peg$parseindentation();
                if (s4 !== peg$FAILED) {
                  s5 = peg$parseinvertibleContent();
                  if (s5 !== peg$FAILED) {
                    s6 = peg$parseDEDENT();
                    if (s6 !== peg$FAILED) {
                      peg$reportedPos = s2;
                      s3 = peg$c42(s5);
                      s2 = s3;
                    } else {
                      peg$currPos = s2;
                      s2 = peg$c0;
                    }
                  } else {
                    peg$currPos = s2;
                    s2 = peg$c0;
                  }
                } else {
                  peg$currPos = s2;
                  s2 = peg$c0;
                }
              } else {
                peg$currPos = s2;
                s2 = peg$c0;
              }
              if (s2 === peg$FAILED) {
                s2 = peg$c1;
              }
              if (s2 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c43(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parse_();
              if (s1 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 93) {
                  s2 = peg$c33;
                  peg$currPos++;
                } else {
                  s2 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c34); }
                }
                if (s2 !== peg$FAILED) {
                  s3 = peg$parseTERM();
                  if (s3 !== peg$FAILED) {
                    s4 = peg$parseinvertibleContent();
                    if (s4 !== peg$FAILED) {
                      s5 = peg$parseDEDENT();
                      if (s5 !== peg$FAILED) {
                        peg$reportedPos = s0;
                        s1 = peg$c43(s4);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            }
          }
        }

        return s0;
      }

      function peg$parseexplicitMustache() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = peg$parseequalSign();
        if (s1 !== peg$FAILED) {
          s2 = peg$parsemustacheOrBlock();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c44(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parseinMustache() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 62) {
          s1 = peg$c14;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c15); }
        }
        if (s1 === peg$FAILED) {
          s1 = peg$c1;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          peg$silentFails++;
          s3 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 91) {
            s4 = peg$c45;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c46); }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parseTERM();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
          peg$silentFails--;
          if (s3 === peg$FAILED) {
            s2 = peg$c24;
          } else {
            peg$currPos = s2;
            s2 = peg$c0;
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_();
            if (s3 !== peg$FAILED) {
              s4 = peg$parsenewMustache();
              if (s4 !== peg$FAILED) {
                s5 = peg$parseinlineComment();
                if (s5 === peg$FAILED) {
                  s5 = peg$c1;
                }
                if (s5 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c47(s1, s4);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsehtmlMustacheAttribute() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = peg$parse_();
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = peg$parsetagNameShorthand();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s2;
            s3 = peg$c48(s3);
          }
          s2 = s3;
          if (s2 === peg$FAILED) {
            s2 = peg$currPos;
            s3 = peg$parseidShorthand();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s2;
              s3 = peg$c49(s3);
            }
            s2 = s3;
            if (s2 === peg$FAILED) {
              s2 = peg$currPos;
              s3 = peg$parseclassShorthand();
              if (s3 !== peg$FAILED) {
                peg$reportedPos = s2;
                s3 = peg$c50(s3);
              }
              s2 = s3;
            }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c51(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parseinMustacheParam() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = peg$parsehtmlMustacheAttribute();
        if (s1 === peg$FAILED) {
          s1 = peg$currPos;
          s2 = peg$parse__();
          if (s2 !== peg$FAILED) {
            s3 = peg$parseparam();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s1;
              s2 = peg$c52(s3);
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$c0;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c53(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsepathIdent() {
        var s0, s1, s2, s3, s4;

        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c55) {
          s0 = peg$c55;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c56); }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 46) {
            s0 = peg$c57;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c58); }
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$currPos;
            s2 = [];
            if (peg$c59.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c60); }
            }
            if (s3 !== peg$FAILED) {
              while (s3 !== peg$FAILED) {
                s2.push(s3);
                if (peg$c59.test(input.charAt(peg$currPos))) {
                  s3 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c60); }
                }
              }
            } else {
              s2 = peg$c0;
            }
            if (s2 !== peg$FAILED) {
              s2 = input.substring(s1, peg$currPos);
            }
            s1 = s2;
            if (s1 !== peg$FAILED) {
              s2 = peg$currPos;
              peg$silentFails++;
              if (input.charCodeAt(peg$currPos) === 61) {
                s3 = peg$c6;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c7); }
              }
              peg$silentFails--;
              if (s3 === peg$FAILED) {
                s2 = peg$c24;
              } else {
                peg$currPos = s2;
                s2 = peg$c0;
              }
              if (s2 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c61(s1);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              if (input.charCodeAt(peg$currPos) === 91) {
                s1 = peg$c45;
                peg$currPos++;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c46); }
              }
              if (s1 !== peg$FAILED) {
                s2 = peg$currPos;
                s3 = [];
                if (peg$c62.test(input.charAt(peg$currPos))) {
                  s4 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s4 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c63); }
                }
                while (s4 !== peg$FAILED) {
                  s3.push(s4);
                  if (peg$c62.test(input.charAt(peg$currPos))) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                  } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c63); }
                  }
                }
                if (s3 !== peg$FAILED) {
                  s3 = input.substring(s2, peg$currPos);
                }
                s2 = s3;
                if (s2 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 93) {
                    s3 = peg$c33;
                    peg$currPos++;
                  } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c34); }
                  }
                  if (s3 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c64(s2);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            }
          }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c54); }
        }

        return s0;
      }

      function peg$parsekey() {
        var s0, s1, s2;

        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsenmchar();
        if (s2 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 58) {
            s2 = peg$c66;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c67); }
          }
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsenmchar();
          if (s2 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 58) {
              s2 = peg$c66;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c67); }
            }
          }
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c65); }
        }

        return s0;
      }

      function peg$parseparam() {
        var s0;

        s0 = peg$parsebooleanNode();
        if (s0 === peg$FAILED) {
          s0 = peg$parseintegerNode();
          if (s0 === peg$FAILED) {
            s0 = peg$parsepathIdNode();
            if (s0 === peg$FAILED) {
              s0 = peg$parsestringNode();
            }
          }
        }

        return s0;
      }

      function peg$parsepath() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        s1 = peg$parsepathIdent();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$currPos;
          s4 = peg$parseseparator();
          if (s4 !== peg$FAILED) {
            s5 = peg$parsepathIdent();
            if (s5 !== peg$FAILED) {
              peg$reportedPos = s3;
              s4 = peg$c68(s4, s5);
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$currPos;
            s4 = peg$parseseparator();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsepathIdent();
              if (s5 !== peg$FAILED) {
                peg$reportedPos = s3;
                s4 = peg$c68(s4, s5);
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c69(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parseseparator() {
        var s0, s1;

        peg$silentFails++;
        if (peg$c71.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c72); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c70); }
        }

        return s0;
      }

      function peg$parsepathIdNode() {
        var s0, s1;

        s0 = peg$currPos;
        s1 = peg$parsepath();
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c73(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsestringNode() {
        var s0, s1;

        s0 = peg$currPos;
        s1 = peg$parsestring();
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c74(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parseintegerNode() {
        var s0, s1;

        s0 = peg$currPos;
        s1 = peg$parseinteger();
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c75(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsebooleanNode() {
        var s0, s1;

        s0 = peg$currPos;
        s1 = peg$parseboolean();
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c76(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parseboolean() {
        var s0, s1;

        peg$silentFails++;
        if (input.substr(peg$currPos, 4) === peg$c78) {
          s0 = peg$c78;
          peg$currPos += 4;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c79); }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 5) === peg$c80) {
            s0 = peg$c80;
            peg$currPos += 5;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c81); }
          }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c77); }
        }

        return s0;
      }

      function peg$parseinteger() {
        var s0, s1, s2, s3, s4, s5;

        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 45) {
          s3 = peg$c83;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c84); }
        }
        if (s3 === peg$FAILED) {
          s3 = peg$c1;
        }
        if (s3 !== peg$FAILED) {
          s4 = [];
          if (peg$c85.test(input.charAt(peg$currPos))) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c86); }
          }
          if (s5 !== peg$FAILED) {
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              if (peg$c85.test(input.charAt(peg$currPos))) {
                s5 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c86); }
              }
            }
          } else {
            s4 = peg$c0;
          }
          if (s4 !== peg$FAILED) {
            s3 = [s3, s4];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$c0;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          s2 = input.substring(s1, peg$currPos);
        }
        s1 = s2;
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c87(s1);
        }
        s0 = s1;
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c82); }
        }

        return s0;
      }

      function peg$parsestring() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 34) {
          s2 = peg$c88;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c89); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsehashDoubleQuoteStringValue();
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 34) {
              s4 = peg$c88;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c89); }
            }
            if (s4 !== peg$FAILED) {
              s2 = [s2, s3, s4];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$c0;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
        if (s1 === peg$FAILED) {
          s1 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c90;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c91); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parsehashSingleQuoteStringValue();
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 39) {
                s4 = peg$c90;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c91); }
              }
              if (s4 !== peg$FAILED) {
                s2 = [s2, s3, s4];
                s1 = s2;
              } else {
                peg$currPos = s1;
                s1 = peg$c0;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$c0;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c92(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsestringWithQuotes() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 34) {
          s2 = peg$c88;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c89); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsehashDoubleQuoteStringValue();
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 34) {
              s4 = peg$c88;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c89); }
            }
            if (s4 !== peg$FAILED) {
              s2 = [s2, s3, s4];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$c0;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
        if (s1 === peg$FAILED) {
          s1 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c90;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c91); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parsehashSingleQuoteStringValue();
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 39) {
                s4 = peg$c90;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c91); }
              }
              if (s4 !== peg$FAILED) {
                s2 = [s2, s3, s4];
                s1 = s2;
              } else {
                peg$currPos = s1;
                s1 = peg$c0;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$c0;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c93(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsehashDoubleQuoteStringValue() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$currPos;
        s3 = peg$currPos;
        peg$silentFails++;
        s4 = peg$parseTERM();
        peg$silentFails--;
        if (s4 === peg$FAILED) {
          s3 = peg$c24;
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        if (s3 !== peg$FAILED) {
          if (peg$c94.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c95); }
          }
          if (s4 !== peg$FAILED) {
            s3 = [s3, s4];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$c0;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$c0;
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$currPos;
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseTERM();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = peg$c24;
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
          if (s3 !== peg$FAILED) {
            if (peg$c94.test(input.charAt(peg$currPos))) {
              s4 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c95); }
            }
            if (s4 !== peg$FAILED) {
              s3 = [s3, s4];
              s2 = s3;
            } else {
              peg$currPos = s2;
              s2 = peg$c0;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c0;
          }
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsehashSingleQuoteStringValue() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$currPos;
        s3 = peg$currPos;
        peg$silentFails++;
        s4 = peg$parseTERM();
        peg$silentFails--;
        if (s4 === peg$FAILED) {
          s3 = peg$c24;
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        if (s3 !== peg$FAILED) {
          if (peg$c96.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c97); }
          }
          if (s4 !== peg$FAILED) {
            s3 = [s3, s4];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$c0;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$c0;
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$currPos;
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parseTERM();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = peg$c24;
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
          if (s3 !== peg$FAILED) {
            if (peg$c96.test(input.charAt(peg$currPos))) {
              s4 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c97); }
            }
            if (s4 !== peg$FAILED) {
              s3 = [s3, s4];
              s2 = s3;
            } else {
              peg$currPos = s2;
              s2 = peg$c0;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c0;
          }
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsealpha() {
        var s0;

        if (peg$c98.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c99); }
        }

        return s0;
      }

      function peg$parsewhitespaceableTextNodes() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$parseindentation();
        if (s1 !== peg$FAILED) {
          s2 = peg$parsetextNodes();
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parsewhitespaceableTextNodes();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parsewhitespaceableTextNodes();
            }
            if (s3 !== peg$FAILED) {
              s4 = peg$parseanyDedent();
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c100(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$parsetextNodes();
        }

        return s0;
      }

      function peg$parsetextLineStart() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (peg$c101.test(input.charAt(peg$currPos))) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c102); }
        }
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 32) {
            s2 = peg$c28;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c29); }
          }
          if (s2 === peg$FAILED) {
            s2 = peg$c1;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c61(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$currPos;
          peg$silentFails++;
          if (input.charCodeAt(peg$currPos) === 60) {
            s2 = peg$c103;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c104); }
          }
          peg$silentFails--;
          if (s2 !== peg$FAILED) {
            peg$currPos = s1;
            s1 = peg$c24;
          } else {
            s1 = peg$c0;
          }
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c105();
          }
          s0 = s1;
        }

        return s0;
      }

      function peg$parsetextLine() {
        var s0, s1, s2, s3, s4, s5, s6;

        s0 = peg$currPos;
        s1 = peg$parsetextLineStart();
        if (s1 !== peg$FAILED) {
          s2 = peg$parsetextNodes();
          if (s2 !== peg$FAILED) {
            s3 = peg$currPos;
            s4 = peg$parseindentation();
            if (s4 !== peg$FAILED) {
              s5 = [];
              s6 = peg$parsewhitespaceableTextNodes();
              while (s6 !== peg$FAILED) {
                s5.push(s6);
                s6 = peg$parsewhitespaceableTextNodes();
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parseDEDENT();
                if (s6 !== peg$FAILED) {
                  peg$reportedPos = s3;
                  s4 = peg$c106(s5);
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$c0;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
            if (s3 === peg$FAILED) {
              s3 = peg$c1;
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c107(s1, s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsetextNodes() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        s1 = peg$parsepreMustacheText();
        if (s1 === peg$FAILED) {
          s1 = peg$c1;
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$currPos;
          s4 = peg$parserawMustache();
          if (s4 !== peg$FAILED) {
            s5 = peg$parsepreMustacheText();
            if (s5 === peg$FAILED) {
              s5 = peg$c1;
            }
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$currPos;
            s4 = peg$parserawMustache();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsepreMustacheText();
              if (s5 === peg$FAILED) {
                s5 = peg$c1;
              }
              if (s5 !== peg$FAILED) {
                s4 = [s4, s5];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parseTERM();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c108(s1, s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parseattributeTextNodes() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 34) {
          s1 = peg$c88;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c89); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseattributeTextNodesInner();
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 34) {
              s3 = peg$c88;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c89); }
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c53(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 39) {
            s1 = peg$c90;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c91); }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parseattributeTextNodesInnerSingle();
            if (s2 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 39) {
                s3 = peg$c90;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c91); }
              }
              if (s3 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c53(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }

        return s0;
      }

      function peg$parseattributeTextNodesInner() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        s1 = peg$parsepreAttrMustacheText();
        if (s1 === peg$FAILED) {
          s1 = peg$c1;
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$currPos;
          s4 = peg$parserawMustache();
          if (s4 !== peg$FAILED) {
            s5 = peg$parsepreAttrMustacheText();
            if (s5 === peg$FAILED) {
              s5 = peg$c1;
            }
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$currPos;
            s4 = peg$parserawMustache();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsepreAttrMustacheText();
              if (s5 === peg$FAILED) {
                s5 = peg$c1;
              }
              if (s5 !== peg$FAILED) {
                s4 = [s4, s5];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c109(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parseattributeTextNodesInnerSingle() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        s1 = peg$parsepreAttrMustacheTextSingle();
        if (s1 === peg$FAILED) {
          s1 = peg$c1;
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$currPos;
          s4 = peg$parserawMustache();
          if (s4 !== peg$FAILED) {
            s5 = peg$parsepreAttrMustacheTextSingle();
            if (s5 === peg$FAILED) {
              s5 = peg$c1;
            }
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$currPos;
            s4 = peg$parserawMustache();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsepreAttrMustacheTextSingle();
              if (s5 === peg$FAILED) {
                s5 = peg$c1;
              }
              if (s5 !== peg$FAILED) {
                s4 = [s4, s5];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c109(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parserawMustache() {
        var s0;

        s0 = peg$parserawMustacheUnescaped();
        if (s0 === peg$FAILED) {
          s0 = peg$parserawMustacheEscaped();
        }

        return s0;
      }

      function peg$parserecursivelyParsedMustacheContent() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 123) {
          s2 = peg$c110;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c111); }
        }
        peg$silentFails--;
        if (s2 === peg$FAILED) {
          s1 = peg$c24;
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = [];
          if (peg$c112.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c113); }
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            if (peg$c112.test(input.charAt(peg$currPos))) {
              s4 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c113); }
            }
          }
          if (s3 !== peg$FAILED) {
            s3 = input.substring(s2, peg$currPos);
          }
          s2 = s3;
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c114(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parserawMustacheEscaped() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        s1 = peg$parsedoubleOpen();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_();
          if (s2 !== peg$FAILED) {
            s3 = peg$parserecursivelyParsedMustacheContent();
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_();
              if (s4 !== peg$FAILED) {
                s5 = peg$parsedoubleClose();
                if (s5 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c115(s3);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsehashStacheOpen();
          if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
              s3 = peg$parserecursivelyParsedMustacheContent();
              if (s3 !== peg$FAILED) {
                s4 = peg$parse_();
                if (s4 !== peg$FAILED) {
                  s5 = peg$parsehashStacheClose();
                  if (s5 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c115(s3);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }

        return s0;
      }

      function peg$parserawMustacheUnescaped() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        s1 = peg$parsetripleOpen();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_();
          if (s2 !== peg$FAILED) {
            s3 = peg$parserecursivelyParsedMustacheContent();
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_();
              if (s4 !== peg$FAILED) {
                s5 = peg$parsetripleClose();
                if (s5 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c116(s3);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsepreAttrMustacheText() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsepreAttrMustacheUnit();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parsepreAttrMustacheUnit();
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsepreAttrMustacheTextSingle() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsepreAttrMustacheUnitSingle();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parsepreAttrMustacheUnitSingle();
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsepreAttrMustacheUnit() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        s2 = peg$parsenonMustacheUnit();
        if (s2 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 34) {
            s2 = peg$c88;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c89); }
          }
        }
        peg$silentFails--;
        if (s2 === peg$FAILED) {
          s1 = peg$c24;
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c117); }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c31(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsepreAttrMustacheUnitSingle() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        s2 = peg$parsenonMustacheUnit();
        if (s2 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c90;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c91); }
          }
        }
        peg$silentFails--;
        if (s2 === peg$FAILED) {
          s1 = peg$c24;
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c117); }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c31(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsepreMustacheText() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsepreMustacheUnit();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parsepreMustacheUnit();
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsepreMustacheUnit() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        s2 = peg$parsenonMustacheUnit();
        peg$silentFails--;
        if (s2 === peg$FAILED) {
          s1 = peg$c24;
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c117); }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c31(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsenonMustacheUnit() {
        var s0;

        s0 = peg$parsetripleOpen();
        if (s0 === peg$FAILED) {
          s0 = peg$parsedoubleOpen();
          if (s0 === peg$FAILED) {
            s0 = peg$parsehashStacheOpen();
            if (s0 === peg$FAILED) {
              s0 = peg$parseanyDedent();
              if (s0 === peg$FAILED) {
                s0 = peg$parseTERM();
              }
            }
          }
        }

        return s0;
      }

      function peg$parserawMustacheSingle() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        s1 = peg$parsesingleOpen();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_();
          if (s2 !== peg$FAILED) {
            s3 = peg$parserecursivelyParsedMustacheContent();
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_();
              if (s4 !== peg$FAILED) {
                s5 = peg$parsesingleClose();
                if (s5 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c118(s3);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parseinTagMustache() {
        var s0;

        s0 = peg$parserawMustacheSingle();
        if (s0 === peg$FAILED) {
          s0 = peg$parserawMustacheUnescaped();
          if (s0 === peg$FAILED) {
            s0 = peg$parserawMustacheEscaped();
          }
        }

        return s0;
      }

      function peg$parsesingleOpen() {
        var s0, s1;

        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 123) {
          s0 = peg$c110;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c111); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c119); }
        }

        return s0;
      }

      function peg$parsedoubleOpen() {
        var s0, s1;

        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c121) {
          s0 = peg$c121;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c122); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c120); }
        }

        return s0;
      }

      function peg$parsetripleOpen() {
        var s0, s1;

        peg$silentFails++;
        if (input.substr(peg$currPos, 3) === peg$c124) {
          s0 = peg$c124;
          peg$currPos += 3;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c125); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c123); }
        }

        return s0;
      }

      function peg$parsesingleClose() {
        var s0, s1;

        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 125) {
          s0 = peg$c127;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c128); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c126); }
        }

        return s0;
      }

      function peg$parsedoubleClose() {
        var s0, s1;

        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c130) {
          s0 = peg$c130;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c131); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c129); }
        }

        return s0;
      }

      function peg$parsetripleClose() {
        var s0, s1;

        peg$silentFails++;
        if (input.substr(peg$currPos, 3) === peg$c133) {
          s0 = peg$c133;
          peg$currPos += 3;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c134); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c132); }
        }

        return s0;
      }

      function peg$parsesexprOpen() {
        var s0, s1;

        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 40) {
          s0 = peg$c136;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c137); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c135); }
        }

        return s0;
      }

      function peg$parsesexprClose() {
        var s0, s1;

        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 41) {
          s0 = peg$c139;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c140); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c138); }
        }

        return s0;
      }

      function peg$parsehashStacheOpen() {
        var s0, s1;

        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c142) {
          s0 = peg$c142;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c143); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c141); }
        }

        return s0;
      }

      function peg$parsehashStacheClose() {
        var s0, s1;

        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 125) {
          s0 = peg$c127;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c128); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c144); }
        }

        return s0;
      }

      function peg$parseequalSign() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c145) {
          s1 = peg$c145;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c146); }
        }
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 32) {
            s2 = peg$c28;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c29); }
          }
          if (s2 === peg$FAILED) {
            s2 = peg$c1;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c147();
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 61) {
            s1 = peg$c6;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c7); }
          }
          if (s1 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 32) {
              s2 = peg$c28;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c29); }
            }
            if (s2 === peg$FAILED) {
              s2 = peg$c1;
            }
            if (s2 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c148();
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }

        return s0;
      }

      function peg$parsehtmlStart() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$parsehtmlTagName();
        if (s1 === peg$FAILED) {
          s1 = peg$c1;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseshorthandAttributes();
          if (s2 === peg$FAILED) {
            s2 = peg$c1;
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 47) {
              s3 = peg$c21;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c22); }
            }
            if (s3 === peg$FAILED) {
              s3 = peg$c1;
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = peg$currPos;
              s4 = peg$c149(s1, s2);
              if (s4) {
                s4 = peg$c24;
              } else {
                s4 = peg$c0;
              }
              if (s4 !== peg$FAILED) {
                s1 = [s1, s2, s3, s4];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parseinHtmlTag() {
        var s0, s1, s2, s3, s4, s5, s6;

        s0 = peg$currPos;
        s1 = peg$parsehtmlStart();
        if (s1 !== peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c150) {
            s2 = peg$c150;
            peg$currPos += 2;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c151); }
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parseTERM();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parseTERM();
            }
            if (s3 !== peg$FAILED) {
              s4 = [];
              s5 = peg$parseinTagMustache();
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                s5 = peg$parseinTagMustache();
              }
              if (s4 !== peg$FAILED) {
                s5 = [];
                s6 = peg$parsebracketedAttribute();
                if (s6 !== peg$FAILED) {
                  while (s6 !== peg$FAILED) {
                    s5.push(s6);
                    s6 = peg$parsebracketedAttribute();
                  }
                } else {
                  s5 = peg$c0;
                }
                if (s5 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c152(s1, s4, s5);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsehtmlStart();
          if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$parseinTagMustache();
            while (s3 !== peg$FAILED) {
              s2.push(s3);
              s3 = peg$parseinTagMustache();
            }
            if (s2 !== peg$FAILED) {
              s3 = [];
              s4 = peg$parsefullAttribute();
              while (s4 !== peg$FAILED) {
                s3.push(s4);
                s4 = peg$parsefullAttribute();
              }
              if (s3 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c152(s1, s2, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }

        return s0;
      }

      function peg$parseshorthandAttributes() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$currPos;
        s3 = peg$parseidShorthand();
        if (s3 !== peg$FAILED) {
          peg$reportedPos = s2;
          s3 = peg$c153(s3);
        }
        s2 = s3;
        if (s2 === peg$FAILED) {
          s2 = peg$currPos;
          s3 = peg$parseclassShorthand();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s2;
            s3 = peg$c154(s3);
          }
          s2 = s3;
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$currPos;
            s3 = peg$parseidShorthand();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s2;
              s3 = peg$c153(s3);
            }
            s2 = s3;
            if (s2 === peg$FAILED) {
              s2 = peg$currPos;
              s3 = peg$parseclassShorthand();
              if (s3 !== peg$FAILED) {
                peg$reportedPos = s2;
                s3 = peg$c154(s3);
              }
              s2 = s3;
            }
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c155(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsefullAttribute() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        if (input.charCodeAt(peg$currPos) === 32) {
          s2 = peg$c28;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c29); }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            if (input.charCodeAt(peg$currPos) === 32) {
              s2 = peg$c28;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c29); }
            }
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseactionAttribute();
          if (s2 === peg$FAILED) {
            s2 = peg$parsebooleanAttribute();
            if (s2 === peg$FAILED) {
              s2 = peg$parseboundAttribute();
              if (s2 === peg$FAILED) {
                s2 = peg$parserawMustacheAttribute();
                if (s2 === peg$FAILED) {
                  s2 = peg$parsenormalAttribute();
                }
              }
            }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c156(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsebracketedAttribute() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parseINDENT();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parseINDENT();
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          if (input.charCodeAt(peg$currPos) === 32) {
            s3 = peg$c28;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c29); }
          }
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            if (input.charCodeAt(peg$currPos) === 32) {
              s3 = peg$c28;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c29); }
            }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parseactionAttribute();
            if (s3 === peg$FAILED) {
              s3 = peg$parsebooleanAttribute();
              if (s3 === peg$FAILED) {
                s3 = peg$parseboundAttribute();
                if (s3 === peg$FAILED) {
                  s3 = peg$parserawMustacheAttribute();
                  if (s3 === peg$FAILED) {
                    s3 = peg$parsenormalAttribute();
                  }
                }
              }
            }
            if (s3 !== peg$FAILED) {
              s4 = [];
              s5 = peg$parseTERM();
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                s5 = peg$parseTERM();
              }
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c157(s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parseboundAttributeValueChar() {
        var s0;

        if (peg$c158.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c159); }
        }
        if (s0 === peg$FAILED) {
          s0 = peg$parsenonSeparatorColon();
        }

        return s0;
      }

      function peg$parseactionValue() {
        var s0, s1;

        s0 = peg$parsestringWithQuotes();
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsepathIdNode();
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c160(s1);
          }
          s0 = s1;
        }

        return s0;
      }

      function peg$parseactionAttribute() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = peg$parseknownEvent();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 61) {
            s2 = peg$c6;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c7); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parseactionValue();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c161(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsebooleanAttribute() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = peg$parsekey();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 61) {
            s2 = peg$c6;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c7); }
          }
          if (s2 !== peg$FAILED) {
            if (input.substr(peg$currPos, 4) === peg$c78) {
              s3 = peg$c78;
              peg$currPos += 4;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c79); }
            }
            if (s3 === peg$FAILED) {
              if (input.substr(peg$currPos, 5) === peg$c80) {
                s3 = peg$c80;
                peg$currPos += 5;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c81); }
              }
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c162(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parseboundAttributeValue() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 123) {
          s1 = peg$c110;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c111); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_();
          if (s2 !== peg$FAILED) {
            s3 = peg$currPos;
            s4 = [];
            s5 = peg$parseboundAttributeValueChar();
            if (s5 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 32) {
                s5 = peg$c28;
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c29); }
              }
            }
            if (s5 !== peg$FAILED) {
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                s5 = peg$parseboundAttributeValueChar();
                if (s5 === peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 32) {
                    s5 = peg$c28;
                    peg$currPos++;
                  } else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c29); }
                  }
                }
              }
            } else {
              s4 = peg$c0;
            }
            if (s4 !== peg$FAILED) {
              s4 = input.substring(s3, peg$currPos);
            }
            s3 = s4;
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_();
              if (s4 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 125) {
                  s5 = peg$c127;
                  peg$currPos++;
                } else {
                  s5 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c128); }
                }
                if (s5 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c163(s3);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = [];
          s2 = peg$parseboundAttributeValueChar();
          if (s2 !== peg$FAILED) {
            while (s2 !== peg$FAILED) {
              s1.push(s2);
              s2 = peg$parseboundAttributeValueChar();
            }
          } else {
            s1 = peg$c0;
          }
          if (s1 !== peg$FAILED) {
            s1 = input.substring(s0, peg$currPos);
          }
          s0 = s1;
        }

        return s0;
      }

      function peg$parseboundAttribute() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        s1 = peg$parsekey();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 61) {
            s2 = peg$c6;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c7); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parseboundAttributeValue();
            if (s3 !== peg$FAILED) {
              s4 = peg$currPos;
              peg$silentFails++;
              if (input.charCodeAt(peg$currPos) === 33) {
                s5 = peg$c164;
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c165); }
              }
              peg$silentFails--;
              if (s5 === peg$FAILED) {
                s4 = peg$c24;
              } else {
                peg$currPos = s4;
                s4 = peg$c0;
              }
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c166(s1, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parserawMustacheAttribute() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = peg$parsekey();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 61) {
            s2 = peg$c6;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c7); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parsepathIdNode();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c167(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsenormalAttribute() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = peg$parsekey();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 61) {
            s2 = peg$c6;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c7); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parseattributeTextNodes();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c168(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parseattributeName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parseattributeChar();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parseattributeChar();
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parseattributeChar() {
        var s0;

        s0 = peg$parsealpha();
        if (s0 === peg$FAILED) {
          if (peg$c85.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c86); }
          }
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 95) {
              s0 = peg$c169;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c170); }
            }
            if (s0 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 45) {
                s0 = peg$c83;
                peg$currPos++;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c84); }
              }
            }
          }
        }

        return s0;
      }

      function peg$parsetagNameShorthand() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 37) {
          s1 = peg$c171;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c172); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsecssIdentifier();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c31(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parseidShorthand() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 35) {
          s1 = peg$c173;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c174); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsecssIdentifier();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c175(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parseclassShorthand() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 46) {
          s1 = peg$c57;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c58); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsecssIdentifier();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c31(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsecssIdentifier() {
        var s0, s1;

        peg$silentFails++;
        s0 = peg$parseident();
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c176); }
        }

        return s0;
      }

      function peg$parseident() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsenmchar();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parsenmchar();
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsenmchar() {
        var s0;

        if (peg$c177.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c178); }
        }
        if (s0 === peg$FAILED) {
          s0 = peg$parsenonascii();
        }

        return s0;
      }

      function peg$parsenmstart() {
        var s0;

        if (peg$c179.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c180); }
        }
        if (s0 === peg$FAILED) {
          s0 = peg$parsenonascii();
        }

        return s0;
      }

      function peg$parsenonascii() {
        var s0;

        if (peg$c181.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c182); }
        }

        return s0;
      }

      function peg$parsetagString() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsetagChar();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parsetagChar();
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsehtmlTagName() {
        var s0, s1, s2, s3;

        peg$silentFails++;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 37) {
          s1 = peg$c171;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c172); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_();
          if (s2 !== peg$FAILED) {
            s3 = peg$parsetagString();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c61(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$parseknownTagName();
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c183); }
        }

        return s0;
      }

      function peg$parseknownTagName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = peg$parsetagString();
        if (s1 !== peg$FAILED) {
          peg$reportedPos = peg$currPos;
          s2 = peg$c184(s1);
          if (s2) {
            s2 = peg$c24;
          } else {
            s2 = peg$c0;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c185(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsetagChar() {
        var s0;

        if (peg$c177.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c178); }
        }
        if (s0 === peg$FAILED) {
          s0 = peg$parsenonSeparatorColon();
        }

        return s0;
      }

      function peg$parsenonSeparatorColon() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 58) {
          s1 = peg$c66;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c67); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          peg$silentFails++;
          if (input.charCodeAt(peg$currPos) === 32) {
            s3 = peg$c28;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c29); }
          }
          peg$silentFails--;
          if (s3 === peg$FAILED) {
            s2 = peg$c24;
          } else {
            peg$currPos = s2;
            s2 = peg$c0;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c31(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parseknownEvent() {
        var s0, s1, s2;

        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$parsetagString();
        if (s1 !== peg$FAILED) {
          peg$reportedPos = peg$currPos;
          s2 = peg$c187(s1);
          if (s2) {
            s2 = peg$c24;
          } else {
            s2 = peg$c0;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c185(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c186); }
        }

        return s0;
      }

      function peg$parseindentation() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = peg$parseINDENT();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse__();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c61(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parseINDENT() {
        var s0, s1;

        peg$silentFails++;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 61423) {
          s1 = peg$c189;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c190); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c191();
        }
        s0 = s1;
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c188); }
        }

        return s0;
      }

      function peg$parseDEDENT() {
        var s0, s1;

        peg$silentFails++;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 61438) {
          s1 = peg$c193;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c194); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c191();
        }
        s0 = s1;
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c192); }
        }

        return s0;
      }

      function peg$parseUNMATCHED_DEDENT() {
        var s0, s1;

        peg$silentFails++;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 61422) {
          s1 = peg$c196;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c197); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c191();
        }
        s0 = s1;
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c195); }
        }

        return s0;
      }

      function peg$parseTERM() {
        var s0, s1, s2, s3;

        peg$silentFails++;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 13) {
          s1 = peg$c199;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c200); }
        }
        if (s1 === peg$FAILED) {
          s1 = peg$c1;
        }
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 61439) {
            s2 = peg$c201;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c202); }
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 10) {
              s3 = peg$c203;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c204); }
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c147();
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c198); }
        }

        return s0;
      }

      function peg$parseanyDedent() {
        var s0, s1;

        peg$silentFails++;
        s0 = peg$parseDEDENT();
        if (s0 === peg$FAILED) {
          s0 = peg$parseUNMATCHED_DEDENT();
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c205); }
        }

        return s0;
      }

      function peg$parse__() {
        var s0, s1, s2;

        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsewhitespace();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parsewhitespace();
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c206); }
        }

        return s0;
      }

      function peg$parse_() {
        var s0, s1;

        peg$silentFails++;
        s0 = [];
        s1 = peg$parsewhitespace();
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          s1 = peg$parsewhitespace();
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c207); }
        }

        return s0;
      }

      function peg$parsewhitespace() {
        var s0, s1;

        peg$silentFails++;
        if (peg$c209.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c210); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c208); }
        }

        return s0;
      }

      function peg$parselineChar() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        s2 = peg$parseINDENT();
        if (s2 === peg$FAILED) {
          s2 = peg$parseDEDENT();
          if (s2 === peg$FAILED) {
            s2 = peg$parseTERM();
          }
        }
        peg$silentFails--;
        if (s2 === peg$FAILED) {
          s1 = peg$c24;
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c117); }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c31(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parselineContent() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parselineChar();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parselineChar();
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsenewMustache() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$parsenewMustacheStart();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parsem_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsem_();
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parsenewMustacheAttr();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parsenewMustacheAttr();
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c211(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsenewMustacheStart() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$parsenewMustacheName();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parsem_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsem_();
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parsenewMustacheShortHand();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parsenewMustacheShortHand();
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c212(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsenewMustacheShortHand() {
        var s0;

        s0 = peg$parsem_shortHandTagName();
        if (s0 === peg$FAILED) {
          s0 = peg$parsem_shortHandIdName();
          if (s0 === peg$FAILED) {
            s0 = peg$parsem_shortHandClassName();
          }
        }

        return s0;
      }

      function peg$parsem_shortHandTagName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 37) {
          s1 = peg$c171;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c172); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsenewMustacheShortHandName();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c213(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsem_shortHandIdName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 35) {
          s1 = peg$c173;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c174); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsenewMustacheShortHandName();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c214(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsem_shortHandClassName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 46) {
          s1 = peg$c57;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c58); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsenewMustacheShortHandName();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c215(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsenewMustacheShortHandName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        if (peg$c216.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c217); }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            if (peg$c216.test(input.charAt(peg$currPos))) {
              s2 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c217); }
            }
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsenewMustacheName() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        s2 = peg$parsem_invalidNameStartChar();
        peg$silentFails--;
        if (s2 === peg$FAILED) {
          s1 = peg$c24;
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = [];
          s4 = peg$parsenewMustacheNameChar();
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parsenewMustacheNameChar();
            }
          } else {
            s3 = peg$c0;
          }
          if (s3 !== peg$FAILED) {
            s3 = input.substring(s2, peg$currPos);
          }
          s2 = s3;
          if (s2 !== peg$FAILED) {
            s3 = peg$parsem_modifierChar();
            if (s3 === peg$FAILED) {
              s3 = peg$c1;
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c218(s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsem_invalidNameStartChar() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 46) {
          s0 = peg$c57;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c58); }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 45) {
            s0 = peg$c83;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c84); }
          }
          if (s0 === peg$FAILED) {
            if (peg$c85.test(input.charAt(peg$currPos))) {
              s0 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c86); }
            }
          }
        }

        return s0;
      }

      function peg$parsem_modifierChar() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 33) {
          s0 = peg$c164;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c165); }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 63) {
            s0 = peg$c219;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c220); }
          }
        }

        return s0;
      }

      function peg$parsenewMustacheNameChar() {
        var s0;

        if (peg$c221.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c222); }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 46) {
            s0 = peg$c57;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c58); }
          }
        }

        return s0;
      }

      function peg$parsenewMustacheAttr() {
        var s0;

        s0 = peg$parsem_keyValue();
        if (s0 === peg$FAILED) {
          s0 = peg$parsem_parenthetical();
          if (s0 === peg$FAILED) {
            s0 = peg$parsenewMustacheAttrValue();
          }
        }

        return s0;
      }

      function peg$parsem_keyValue() {
        var s0, s1, s2, s3, s4, s5, s6, s7;

        s0 = peg$currPos;
        s1 = peg$parsenewMustacheAttrName();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parsem_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsem_();
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 61) {
              s3 = peg$c6;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c7); }
            }
            if (s3 !== peg$FAILED) {
              s4 = [];
              s5 = peg$parsem_();
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                s5 = peg$parsem_();
              }
              if (s4 !== peg$FAILED) {
                s5 = peg$parsenewMustacheAttrValue();
                if (s5 !== peg$FAILED) {
                  s6 = [];
                  s7 = peg$parsem_();
                  while (s7 !== peg$FAILED) {
                    s6.push(s7);
                    s7 = peg$parsem_();
                  }
                  if (s6 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c223(s1, s5);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsenewMustacheAttrName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsenewMustacheNameChar();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parsenewMustacheNameChar();
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsenewMustacheAttrValue() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = peg$parsem_quotedString();
        if (s1 === peg$FAILED) {
          s1 = peg$parsem_valuePath();
          if (s1 === peg$FAILED) {
            s1 = peg$parsem_parenthetical();
          }
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parsem_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsem_();
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c224(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsem_valuePath() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsenewMustacheNameChar();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parsenewMustacheNameChar();
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsem_quotedString() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 34) {
          s2 = peg$c88;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c89); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsem_stringWithoutDouble();
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 34) {
              s4 = peg$c88;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c89); }
            }
            if (s4 !== peg$FAILED) {
              s2 = [s2, s3, s4];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$c0;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c90;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c91); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parsem_stringWithoutSingle();
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 39) {
                s4 = peg$c90;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c91); }
              }
              if (s4 !== peg$FAILED) {
                s2 = [s2, s3, s4];
                s1 = s2;
              } else {
                peg$currPos = s1;
                s1 = peg$c0;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$c0;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
          if (s1 !== peg$FAILED) {
            s1 = input.substring(s0, peg$currPos);
          }
          s0 = s1;
        }

        return s0;
      }

      function peg$parsem_stringWithoutDouble() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsem_inStringChar();
        if (s2 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c90;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c91); }
          }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parsem_inStringChar();
            if (s2 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 39) {
                s2 = peg$c90;
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c91); }
              }
            }
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsem_stringWithoutSingle() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsem_inStringChar();
        if (s2 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 34) {
            s2 = peg$c88;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c89); }
          }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parsem_inStringChar();
            if (s2 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 34) {
                s2 = peg$c88;
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c89); }
              }
            }
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parsem_inStringChar() {
        var s0;

        if (peg$c225.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c226); }
        }

        return s0;
      }

      function peg$parsem_inParensChar() {
        var s0;

        if (peg$c227.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c228); }
        }

        return s0;
      }

      function peg$parsem_commentChar() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 47) {
          s0 = peg$c21;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c22); }
        }

        return s0;
      }

      function peg$parsem_parenthetical() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsem_();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsem_();
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = peg$currPos;
          s4 = peg$parsem_OPEN_PAREN();
          if (s4 !== peg$FAILED) {
            s5 = [];
            s6 = peg$parsem_inParensChar();
            while (s6 !== peg$FAILED) {
              s5.push(s6);
              s6 = peg$parsem_inParensChar();
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parsem_parenthetical();
              if (s6 === peg$FAILED) {
                s6 = peg$c1;
              }
              if (s6 !== peg$FAILED) {
                s7 = [];
                s8 = peg$parsem_inParensChar();
                while (s8 !== peg$FAILED) {
                  s7.push(s8);
                  s8 = peg$parsem_inParensChar();
                }
                if (s7 !== peg$FAILED) {
                  s8 = peg$parsem_CLOSE_PAREN();
                  if (s8 !== peg$FAILED) {
                    s4 = [s4, s5, s6, s7, s8];
                    s3 = s4;
                  } else {
                    peg$currPos = s3;
                    s3 = peg$c0;
                  }
                } else {
                  peg$currPos = s3;
                  s3 = peg$c0;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
          if (s3 !== peg$FAILED) {
            s3 = input.substring(s2, peg$currPos);
          }
          s2 = s3;
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parsem_();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parsem_();
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c93(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }

        return s0;
      }

      function peg$parsem_OPEN_PAREN() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 40) {
          s0 = peg$c136;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c137); }
        }

        return s0;
      }

      function peg$parsem_CLOSE_PAREN() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 41) {
          s0 = peg$c139;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c140); }
        }

        return s0;
      }

      function peg$parsem_() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 32) {
          s0 = peg$c28;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c29); }
        }

        return s0;
      }


        var builder = options.builder;

        var UNBOUND_MODIFIER = '!';
        var CONDITIONAL_MODIFIER = '?';

        var LINE_SPACE_MODIFIERS = {
          NEWLINE: '`',
          SPACE: "'"
        };

        var KNOWN_TAGS = {
          figcaption: true, blockquote: true, plaintext: true, textarea: true, progress: true,
          optgroup: true, noscript: true, noframes: true, frameset: true, fieldset: true,
          datalist: true, colgroup: true, basefont: true, summary: true, section: true,
          marquee: true, listing: true, isindex: true, details: true, command: true,
          caption: true, bgsound: true, article: true, address: true, acronym: true,
          strong: true, strike: true, spacer: true, source: true, select: true,
          script: true, output: true, option: true, object: true, legend: true,
          keygen: true, iframe: true, hgroup: true, header: true, footer: true,
          figure: true, center: true, canvas: true, button: true, applet: true, video: true,
          track: true, title: true, thead: true, tfoot: true, tbody: true, table: true,
          style: true, small: true, param: true, meter: true, label: true, input: true,
          frame: true, embed: true, blink: true, audio: true, aside: true, time: true,
          span: true, samp: true, ruby: true, nobr: true, meta: true, menu: true,
          mark: true, main: true, link: true, html: true, head: true, form: true,
          font: true, data: true, code: true, cite: true, body: true, base: true,
          area: true, abbr: true, xmp: true, wbr: true, 'var': true, sup: true,
          sub: true, pre: true, nav: true, map: true, kbd: true, ins: true,
          img: true, div: true, dir: true, dfn: true, del: true, col: true,
          big: true, bdo: true, bdi: true, ul: true, tt: true, tr: true, th: true, td: true,
          rt: true, rp: true, ol: true, li: true, hr: true, h6: true, h5: true, h4: true,
          h3: true, h2: true, h1: true, em: true, dt: true, dl: true, dd: true, br: true,
          u: true, s: true, q: true, p: true, i: true, b: true, a: true
        };

        var KNOWN_EVENTS = {
          "touchStart": true, "touchMove": true, "touchEnd": true, "touchCancel": true,
          "keyDown": true, "keyUp": true, "keyPress": true, "mouseDown": true, "mouseUp": true,
          "contextMenu": true, "click": true, "doubleClick": true, "mouseMove": true,
          "focusIn": true, "focusOut": true, "mouseEnter": true, "mouseLeave": true,
          "submit": true, "input": true, "change": true, "dragStart": true,
          "drag": true, "dragEnter": true, "dragLeave": true,
          "dragOver": true, "drop": true, "dragEnd": true
        };

        function prepareMustachValue(content){
          var parts = content.split(' '),
              first,
              match;

          // check for '!' unbound helper
          first = parts.shift();
          if (match = first.match(/(.*)!$/)) {
            parts.unshift( match[1] );
            content = 'unbound ' + parts.join(' ');
          } else {
            parts.unshift(first);
          }

          // check for '?' if helper
          first = parts.shift();
          if (match = first.match(/(.*)\?$/)) {
            parts.unshift( match[1] );
            content = 'if ' + parts.join(' ');
          } else {
            parts.unshift(first);
          }
          return content;
        }

        function castToAst(nodeOrString) {
          if (typeof nodeOrString === 'string') {
            return builder.generateText(nodeOrString);
          } else {
            return nodeOrString;
          }
        }

        function castStringsToTextNodes(possibleStrings) {
          var ret = [];
          var nodes = [];

          var currentString = null;
          var possibleString;

          for(var i=0, l=possibleStrings.length; i<l; i++) {
            possibleString = possibleStrings[i];
            if (typeof possibleString === 'string') {
              currentString = (currentString || '') + possibleString;
            } else {
              if (currentString) {
                ret.push( textNode(currentString) );
                currentString = null;
              }
              ret.push( possibleString ); // not a string, it is a node here
            }
          }
          if (currentString) {
            ret.push( textNode(currentString) );
          }
          return ret;
        }

        // attrs are simple strings,
        // combine all the ones that start with 'class='
        function coalesceAttrs(attrs){
          var classes = [];
          var newAttrs = [];
          var classRegex = /^class="(.*)"$/;
          var match;

          for (var i=0,l=attrs.length; i<l; i++) {
            var attr = attrs[i];
            if (match = attr.match(classRegex)) {
              classes.push(match[1]);
            } else {
              newAttrs.push(attr);
            }
          }

          if (classes.length) {
            newAttrs.push('class="' + classes.join(' ') + '"');
          }
          return newAttrs;
        }

        function createBlockOrMustache(mustacheTuple) {
          var mustache   = mustacheTuple[0];
          var blockTuple = mustacheTuple[1];

          var escaped    = mustache.isEscaped;
          var mustacheContent = mustache.name;
          var mustacheAttrs = mustache.attrs;

          if (mustacheAttrs.length) {
            var attrs = coalesceAttrs(mustacheAttrs);
            mustacheContent += ' ' + attrs.join(' ');
          }

          if (mustache.isViewHelper) {
            mustacheContent = 'view ' + mustacheContent;
          }

          if (mustache.modifier === UNBOUND_MODIFIER) {
            mustacheContent = 'unbound ' + mustacheContent;
          } else if (mustache.modifier === CONDITIONAL_MODIFIER) {
            mustacheContent = 'if ' + mustacheContent;
          }

          if (blockTuple) {
            var block = builder.generateBlock(mustacheContent, escaped);
            builder.enter(block);
            builder.add('childNodes', blockTuple[0]);
            if (blockTuple[1]) {
              builder.add('inverseChildNodes', blockTuple[1]);
            }
            return builder.exit();
          } else {
            return builder.generateMustache(mustacheContent, escaped);
          }
        }

        function flattenArray(first, tail) {
          var ret = [];
          if(first) {
            ret.push(first);
          }
          for(var i = 0; i < tail.length; ++i) {
            var t = tail[i];
            ret.push(t[0]);
            if(t[1]) {
              ret.push(t[1]);
            }
          }
          return ret;
        }

        function textNode(content){
          return builder.generateText(content);
        }

        function parseInHtml(h, inTagMustaches, fullAttributes) {
          var tagName = h[0] || 'div',
              shorthandAttributes = h[1] || [],
              id = shorthandAttributes[0],
              classes = shorthandAttributes[1] || [];
          var i, l;

          var elementNode = builder.generateElement(tagName);
          builder.enter(elementNode);

          for (i=0, l=classes.length;i<l;i++) {
            if (classes[i].type === 'classNameBinding') {
              builder.add('classNameBindings', classes[i]);
            } else {
              builder.classNameBinding(':'+classes[i]);
            }
          }

          if (id) {
            builder.attribute('id', id);
          }

          for(i = 0; i < inTagMustaches.length; ++i) {
            builder.add('attrStaches', inTagMustaches[i]);
          }

          for(i = 0; i < fullAttributes.length; ++i) {
            var currentAttr = fullAttributes[i];
            if (Array.isArray(currentAttr) && typeof currentAttr[0] === 'string') {  // a "normalAttribute", [attrName, attrContent]
              if (currentAttr.length) { // a boolean false attribute will be []

                // skip classes now, coalesce them later
                if (currentAttr[0] === 'class') {
                  builder.classNameBinding(':'+currentAttr[1]);
                } else {
                  builder.attribute(currentAttr[0], currentAttr[1]);
                }
              }
            } else if (Array.isArray(currentAttr)) {
              currentAttr.forEach(function(attrNode){
                builder.add(
                  attrNode.type === 'classNameBinding' ? 'classNameBindings' : 'attrStaches',
                  attrNode
                );
              });
            } else {
              builder.add(
                currentAttr.type === 'classNameBinding' ? 'classNameBindings' : 'attrStaches',
                currentAttr
              );
            }
          }
        }


      peg$result = peg$startRuleFunction();

      if (peg$result !== peg$FAILED && peg$currPos === input.length) {
        return peg$result;
      } else {
        if (peg$result !== peg$FAILED && peg$currPos < input.length) {
          peg$fail({ type: "end", description: "end of input" });
        }

        throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
      }
    }

    return {
      SyntaxError: SyntaxError,
      parse:       parse
    };
  })();
  var parse = Parser.parse, ParserSyntaxError = Parser.SyntaxError;
  exports['default'] = parse;

  exports.ParserSyntaxError = ParserSyntaxError;
  exports.parse = parse;

});
define('emblem/preprocessor', ['exports', 'string-scanner'], function (exports, StringScanner) {

  'use strict';

  exports.processSync = processSync;

  var DEDENT, INDENT, TERM, UNMATCHED_DEDENT, anyWhitespaceAndNewlinesTouchingEOF, any_whitespaceFollowedByNewlines_, processInput, ws;

  ws = "\\t\\x0B\\f \\xA0\\u1680\\u180E\\u2000-\\u200A\\u202F\\u205F\\u3000\\uFEFF";

  INDENT = "";

  DEDENT = "";

  UNMATCHED_DEDENT = "";

  TERM = "";

  anyWhitespaceAndNewlinesTouchingEOF = new RegExp("[" + ws + "\\r?\\n]*$");

  any_whitespaceFollowedByNewlines_ = new RegExp("(?:[" + ws + "]*\\r?\\n)+");

  function Preprocessor() {
    this.base = null;
    this.indents = [];
    this.context = [];
    this.ss = new StringScanner['default']("");
    this.context.peek = function () {
      if (this.length) {
        return this[this.length - 1];
      } else {
        return null;
      }
    };
    this.context.err = function (c) {
      throw new Error("Unexpected " + c);
    };
    this.output = "";
    this.context.observe = function (c) {
      var top;
      top = this.peek();
      switch (c) {
        case INDENT:
          this.push(c);
          break;
        case DEDENT:
          if (top !== INDENT) {
            this.err(c);
          }
          this.pop();
          break;
        case "\r":
          if (top !== "/") {
            this.err(c);
          }
          this.pop();
          break;
        case "\n":
          if (top !== "/") {
            this.err(c);
          }
          this.pop();
          break;
        case "/":
          this.push(c);
          break;
        case "end-\\":
          if (top !== "\\") {
            this.err(c);
          }
          this.pop();
          break;
        default:
          throw new Error("undefined token observed: " + c);
      }
      return this;
    };
  }

  Preprocessor.prototype.p = function (s) {
    if (s) {
      this.output += s;
    }
    return s;
  };

  Preprocessor.prototype.scan = function (r) {
    return this.p(this.ss.scan(r));
  };

  Preprocessor.prototype.discard = function (r) {
    return this.ss.scan(r);
  };

  processInput = function (isEnd) {
    return function (data) {
      var b, d, indent, s;
      if (!isEnd) {
        this.ss.concat(data);
        this.discard(any_whitespaceFollowedByNewlines_);
      }
      while (!this.ss.eos()) {
        switch (this.context.peek()) {
          case null:
          case INDENT:
            if (this.ss.bol() || this.discard(any_whitespaceFollowedByNewlines_)) {
              if (this.discard(new RegExp("[" + ws + "]*\\r?\\n"))) {
                this.p("" + TERM + "\n");
                continue;
              }
              if (this.base != null) {
                if (this.discard(this.base) == null) {
                  throw new Error("inconsistent base indentation");
                }
              } else {
                b = this.discard(new RegExp("[" + ws + "]*"));
                this.base = new RegExp("" + b);
              }
              if (this.indents.length === 0) {
                if (this.ss.check(new RegExp("[" + ws + "]+"))) {
                  this.p(INDENT);
                  this.context.observe(INDENT);
                  this.indents.push(this.scan(new RegExp("([" + ws + "]+)")));
                }
              } else {
                indent = this.indents[this.indents.length - 1];
                if (d = this.ss.check(new RegExp("(" + indent + ")"))) {
                  this.discard(d);
                  if (this.ss.check(new RegExp("([" + ws + "]+)"))) {
                    this.p(INDENT);
                    this.context.observe(INDENT);
                    this.indents.push(d + this.scan(new RegExp("([" + ws + "]+)")));
                  }
                } else {
                  while (this.indents.length) {
                    indent = this.indents[this.indents.length - 1];
                    if (this.discard(new RegExp("(?:" + indent + ")"))) {
                      break;
                    }
                    this.context.observe(DEDENT);
                    this.p(DEDENT);
                    this.indents.pop();
                  }
                  if (s = this.discard(new RegExp("[" + ws + "]+"))) {
                    this.output = this.output.slice(0, -1);
                    this.output += UNMATCHED_DEDENT;
                    this.p(INDENT);
                    this.context.observe(INDENT);
                    this.indents.push(s);
                  }
                }
              }
            }
            this.scan(/[^\r\n]+/);
            if (this.discard(/\r?\n/)) {
              this.p("" + TERM + "\n");
            }
        }
      }
      if (isEnd) {
        this.scan(anyWhitespaceAndNewlinesTouchingEOF);
        while (this.context.length && INDENT === this.context.peek()) {
          this.context.observe(DEDENT);
          this.p(DEDENT);
        }
        if (this.context.length) {
          throw new Error("Unclosed " + this.context.peek() + " at EOF");
        }
      }
    };
  };

  Preprocessor.prototype.processData = processInput(false);

  Preprocessor.prototype.processEnd = processInput(true);function processSync(input) {
    var pre;
    input += "\n";
    pre = new Preprocessor();
    pre.processData(input);
    pre.processEnd();
    return pre.output;
  }exports['default'] = Preprocessor;

});
define('emblem/process-opcodes', ['exports'], function (exports) {

  'use strict';

  exports.processOpcodes = processOpcodes;

  function processOpcodes(compiler, opcodes) {
    for (var i = 0, l = opcodes.length; i < l; i++) {
      var method = opcodes[i][0];
      var params = opcodes[i][1];
      if (params) {
        compiler[method].apply(compiler, params);
      } else {
        compiler[method].call(compiler);
      }
    }
  }

});
define('emblem/quoting', ['exports'], function (exports) {

  'use strict';

  exports.repeat = repeat;
  exports.escapeString = escapeString;
  exports.string = string;

  function escapeString(str) {
    str = str.replace(/\\/g, "\\\\");
    str = str.replace(/"/g, "\\\"");
    str = str.replace(/\n/g, "\\n");
    return str;
  }

  function string(str) {
    return "\"" + escapeString(str) + "\"";
  }

  function repeat(chars, times) {
    var str = "";
    while (times--) {
      str += chars;
    }
    return str;
  }

});
define('emblem/template-compiler', ['exports', 'emblem/process-opcodes', 'emblem/template-visitor', 'emblem/quoting'], function (exports, process_opcodes, template_visitor, quoting) {

  'use strict';

  exports.compile = compile;

  function compile(ast) {
    var opcodes = [];
    template_visitor.visit(ast, opcodes);
    reset(compiler);
    process_opcodes.processOpcodes(compiler, opcodes);
    return flush(compiler);
  }function reset(compiler) {
    compiler._content = [];
  }

  function flush(compiler) {
    return compiler._content.join("");
  }

  function pushContent(compiler, content) {
    compiler._content.push(content);
  }

  var classNameBindings, hasBoundClassNameBindings;

  var compiler = {

    startProgram: function () {},
    endProgram: function () {},

    text: function (content) {
      pushContent(this, content);
    },

    attribute: function (name, content) {
      var attrString = " " + name;
      if (content === undefined) {} else {
        attrString += "=" + quoting.string(content);
      }
      pushContent(this, attrString);
    },

    openElementStart: function (tagName) {
      this._insideElement = true;
      pushContent(this, "<" + tagName);
    },

    openElementEnd: function () {
      pushContent(this, ">");
      this._insideElement = false;
    },

    closeElement: function (tagName) {
      pushContent(this, "</" + tagName + ">");
    },

    openClassNameBindings: function () {
      classNameBindings = [];
      hasBoundClassNameBindings = false;
    },

    classNameBinding: function (name) {
      if (!hasBoundClassNameBindings) {
        hasBoundClassNameBindings = name.indexOf(":") === -1;
      }
      classNameBindings.push(name);
    },

    closeClassNameBindings: function () {
      if (hasBoundClassNameBindings) {
        pushContent(this, " {{bind-attr class=" + quoting.string(classNameBindings.join(" ")) + "}}");
      } else {
        pushContent(this, " class=" + quoting.string(classNameBindings.map(function (c) {
          return c.slice(1);
        }).join(" ")));
      }
    },

    startBlock: function (content) {
      pushContent(this, "{{#" + content + "}}");
    },

    endBlock: function (content) {
      var parts = content.split(" ");

      pushContent(this, "{{/" + parts[0] + "}}");
    },

    mustache: function (content, escaped) {
      var prepend = this._insideElement ? " " : "";
      if (escaped) {
        pushContent(this, prepend + "{{" + content + "}}");
      } else {
        pushContent(this, prepend + "{{{" + content + "}}}");
      }
    }

  };
  // boolean attribute with a true value, this is a no-op

});
define('emblem/template-visitor', ['exports'], function (exports) {

  'use strict';

  exports.visit = visit;

  function visit(node, opcodes) {
    visitor[node.type](node, opcodes);
  }function visitArray(nodes, opcodes) {
    if (!nodes || nodes.length === 0) {
      return;
    }
    for (var i = 0, l = nodes.length; i < l; i++) {
      visit(nodes[i], opcodes);
    }
  }

  var visitor = {

    program: function (node, opcodes) {
      opcodes.push(["startProgram"]);
      visitArray(node.childNodes, opcodes);
      opcodes.push(["endProgram"]);
    },

    text: function (node, opcodes) {
      opcodes.push(["text", [node.content]]);
    },

    attribute: function (node, opcodes) {
      opcodes.push(["attribute", [node.name, node.content]]);
    },

    classNameBinding: function (node, opcodes) {
      opcodes.push(["classNameBinding", [node.name]]);
    },

    element: function (node, opcodes) {
      opcodes.push(["openElementStart", [node.tagName]]);
      visitArray(node.attrStaches, opcodes);
      if (node.classNameBindings && node.classNameBindings.length) {
        opcodes.push(["openClassNameBindings"]);
        visitArray(node.classNameBindings, opcodes);
        opcodes.push(["closeClassNameBindings"]);
      }
      opcodes.push(["openElementEnd"]);

      if (node.isVoid) {
        if (node.childNodes.length) {
          throw new Error("Cannot nest under void element " + node.tagName);
        }
      } else {
        visitArray(node.childNodes, opcodes);
        opcodes.push(["closeElement", [node.tagName]]);
      }
    },

    block: function (node, opcodes) {
      opcodes.push(["startBlock", [node.content]]);
      visitArray(node.childNodes, opcodes);

      if (node.inverseChildNodes && node.inverseChildNodes.length > 0) {
        opcodes.push(["mustache", ["else", true]]);
        visitArray(node.inverseChildNodes, opcodes);
      }

      opcodes.push(["endBlock", [node.content]]);
    },

    mustache: function (node, opcodes) {
      opcodes.push(["mustache", [node.content, node.escaped]]);
    }

  };

});
define('emblem/utils/void-elements', ['exports'], function (exports) {

  'use strict';

  // http://www.w3.org/TR/html-markup/syntax.html#syntax-elements
  var voidElementTags = ["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];

  function isVoidElement(tagName) {
    return voidElementTags.indexOf(tagName) > -1;
  }

  exports['default'] = isVoidElement;

});
define('string-scanner', ['exports'], function (exports) {

  'use strict';

  var module = {};

  (function() {
    var StringScanner;
    StringScanner = (function() {
      function StringScanner(str) {
        this.str = str != null ? str : '';
        this.str = '' + this.str;
        this.pos = 0;
        this.lastMatch = {
          reset: function() {
            this.str = null;
            this.captures = [];
            return this;
          }
        }.reset();
        this;
      }
      StringScanner.prototype.bol = function() {
        return this.pos <= 0 || (this.str[this.pos - 1] === "\n");
      };
      StringScanner.prototype.captures = function() {
        return this.lastMatch.captures;
      };
      StringScanner.prototype.check = function(pattern) {
        var matches;
        if (this.str.substr(this.pos).search(pattern) !== 0) {
          this.lastMatch.reset();
          return null;
        }
        matches = this.str.substr(this.pos).match(pattern);
        this.lastMatch.str = matches[0];
        this.lastMatch.captures = matches.slice(1);
        return this.lastMatch.str;
      };
      StringScanner.prototype.checkUntil = function(pattern) {
        var matches, patternPos;
        patternPos = this.str.substr(this.pos).search(pattern);
        if (patternPos < 0) {
          this.lastMatch.reset();
          return null;
        }
        matches = this.str.substr(this.pos + patternPos).match(pattern);
        this.lastMatch.captures = matches.slice(1);
        return this.lastMatch.str = this.str.substr(this.pos, patternPos) + matches[0];
      };
      StringScanner.prototype.clone = function() {
        var clone, prop, value, _ref;
        clone = new this.constructor(this.str);
        clone.pos = this.pos;
        clone.lastMatch = {};
        _ref = this.lastMatch;
        for (prop in _ref) {
          value = _ref[prop];
          clone.lastMatch[prop] = value;
        }
        return clone;
      };
      StringScanner.prototype.concat = function(str) {
        this.str += str;
        return this;
      };
      StringScanner.prototype.eos = function() {
        return this.pos === this.str.length;
      };
      StringScanner.prototype.exists = function(pattern) {
        var matches, patternPos;
        patternPos = this.str.substr(this.pos).search(pattern);
        if (patternPos < 0) {
          this.lastMatch.reset();
          return null;
        }
        matches = this.str.substr(this.pos + patternPos).match(pattern);
        this.lastMatch.str = matches[0];
        this.lastMatch.captures = matches.slice(1);
        return patternPos;
      };
      StringScanner.prototype.getch = function() {
        return this.scan(/./);
      };
      StringScanner.prototype.match = function() {
        return this.lastMatch.str;
      };
      StringScanner.prototype.matches = function(pattern) {
        this.check(pattern);
        return this.matchSize();
      };
      StringScanner.prototype.matched = function() {
        return this.lastMatch.str != null;
      };
      StringScanner.prototype.matchSize = function() {
        if (this.matched()) {
          return this.match().length;
        } else {
          return null;
        }
      };
      StringScanner.prototype.peek = function(len) {
        return this.str.substr(this.pos, len);
      };
      StringScanner.prototype.pointer = function() {
        return this.pos;
      };
      StringScanner.prototype.setPointer = function(pos) {
        pos = +pos;
        if (pos < 0) {
          pos = 0;
        }
        if (pos > this.str.length) {
          pos = this.str.length;
        }
        return this.pos = pos;
      };
      StringScanner.prototype.reset = function() {
        this.lastMatch.reset();
        this.pos = 0;
        return this;
      };
      StringScanner.prototype.rest = function() {
        return this.str.substr(this.pos);
      };
      StringScanner.prototype.scan = function(pattern) {
        var chk;
        chk = this.check(pattern);
        if (chk != null) {
          this.pos += chk.length;
        }
        return chk;
      };
      StringScanner.prototype.scanUntil = function(pattern) {
        var chk;
        chk = this.checkUntil(pattern);
        if (chk != null) {
          this.pos += chk.length;
        }
        return chk;
      };
      StringScanner.prototype.skip = function(pattern) {
        this.scan(pattern);
        return this.matchSize();
      };
      StringScanner.prototype.skipUntil = function(pattern) {
        this.scanUntil(pattern);
        return this.matchSize();
      };
      StringScanner.prototype.string = function() {
        return this.str;
      };
      StringScanner.prototype.terminate = function() {
        this.pos = this.str.length;
        this.lastMatch.reset();
        return this;
      };
      StringScanner.prototype.toString = function() {
        return "#<StringScanner " + (this.eos() ? 'fin' : "" + this.pos + "/" + this.str.length + " @ " + (this.str.length > 8 ? "" + (this.str.substr(0, 5)) + "..." : this.str)) + ">";
      };
      return StringScanner;
    })();
    StringScanner.prototype.beginningOfLine = StringScanner.prototype.bol;
    StringScanner.prototype.clear = StringScanner.prototype.terminate;
    StringScanner.prototype.dup = StringScanner.prototype.clone;
    StringScanner.prototype.endOfString = StringScanner.prototype.eos;
    StringScanner.prototype.exist = StringScanner.prototype.exists;
    StringScanner.prototype.getChar = StringScanner.prototype.getch;
    StringScanner.prototype.position = StringScanner.prototype.pointer;
    StringScanner.StringScanner = StringScanner;
    module.exports = StringScanner;
  }).call(undefined);

  exports['default'] = module.exports;

});