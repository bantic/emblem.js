'use strict';

exports.compile = compile;

var process_opcodes = require('./process-opcodes');
var template_visitor = require('./template-visitor');
var quoting = require('./quoting');



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