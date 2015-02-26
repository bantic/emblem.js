'use strict';

var utils = require('../support/utils');
var Emblem = require('../../emblem');
var integration_assertions = require('../support/integration-assertions');

/*global QUnit*/

QUnit.module("text: pipe character");

test("pipe (|) creates text", function () {
  integration_assertions.compilesTo("| hello there", "hello there");
});

test("pipe (|) multiline creates text", function () {
  integration_assertions.compilesTo(utils.w("| hello there", "   and more"), "hello there and more");
});

test("pipe lines preserves leading spaces", function () {
  var fourSpaces = "    ";
  var threeSpaces = "   ";
  integration_assertions.compilesTo("|" + fourSpaces + "hello there", threeSpaces + "hello there");
});

test("multiple pipe lines are concatenated", function () {
  integration_assertions.compilesTo(utils.w("| hi there", "| and more"), "hi thereand more");
});

QUnit.module("text: whitespace fussiness");

test("spaces after html elements", function () {
  integration_assertions.compilesTo("p \n  span asd", "<p><span>asd</span></p>");
  integration_assertions.compilesTo("p \nspan  \n\ndiv\nspan", "<p></p><span></span><div></div><span></span>");
});

test("spaces after mustaches", function () {
  integration_assertions.compilesTo("each foo    \n  p \n  span", "{{#each foo}}<p></p><span></span>{{/each}}");
});

QUnit.module("text: preprocessor");

QUnit.test("it strips out preceding whitespace", function () {
  var emblem = utils.w("", "p Hello");
  integration_assertions.compilesTo(emblem, "<p>Hello</p>");
});

QUnit.test("it handles preceding indentation", function () {
  var emblem = utils.w("  p Woot", "  p Ha");
  integration_assertions.compilesTo(emblem, "<p>Woot</p><p>Ha</p>");
});

QUnit.test("it handles preceding indentation and newlines", function () {
  var emblem = utils.w("", "  p Woot", "  p Ha");
  integration_assertions.compilesTo(emblem, "<p>Woot</p><p>Ha</p>");
});

QUnit.test("it handles preceding indentation and newlines pt 2", function () {
  var emblem = utils.w("  ", "  p Woot", "  p Ha");
  integration_assertions.compilesTo(emblem, "<p>Woot</p><p>Ha</p>");
});

test("multiple text lines", function () {
  var emblem = "\n     span Your name is name\n       and my name is name";
  integration_assertions.compilesTo(emblem, "<span>Your name is name and my name is name</span>");
});

test("use an \"'\" to add a space", function () {
  var emblem = "span\n                 ' trailing space";
  integration_assertions.compilesTo(emblem, "<span>trailing space </span>");
});

QUnit.module("text: copy paste html");

test("indented", function () {
  var emblem;
  emblem = utils.w("<p>", "  <span>This be some text</span>", "  <title>Basic HTML Sample Page</title>", "</p>");
  integration_assertions.compilesTo(emblem, "<p> <span>This be some text</span> <title>Basic HTML Sample Page</title></p>");
});

test("flatlina", function () {
  var emblem;
  emblem = "<p>\n<span>This be some text</span>\n<title>Basic HTML Sample Page</title>\n</p>";
  integration_assertions.compilesTo(emblem, "<p><span>This be some text</span><title>Basic HTML Sample Page</title></p>");
});

QUnit.module("text: indentation");

test("it doesn't throw when indenting after a line with inline content", function () {
  var emblem = utils.w("p Hello", "  p invalid");
  integration_assertions.compilesTo(emblem, "<p>Hello p invalid</p>");
});

test("it throws on half dedent", function () {
  var emblem = utils.w("p", "    span This is ok", "  span This aint");
  QUnit.throws(function () {
    Emblem['default'].compile(emblem);
  });
});

test("new indentation levels don't have to match parents'", function () {
  var emblem = utils.w("p ", "  span", "     div", "      span yes");
  integration_assertions.compilesTo(emblem, "<p><span><div><span>yes</span></div></span></p>");
});

test("Windows line endings", function () {
  var emblem;
  emblem = ".navigation\r\n  p Hello\r\n#main\r\n  | hi";
  integration_assertions.compilesTo(emblem, "<div class=\"navigation\"><p>Hello</p></div><div id=\"main\">hi</div>");
});

test("backslash doesn't cause infinite loop", function () {
  var emblem;
  emblem = "| \\";
  integration_assertions.compilesTo(emblem, "\\");
});

test("backslash doesn't cause infinite loop with letter", function () {
  var emblem;
  emblem = "| \\a";
  integration_assertions.compilesTo(emblem, "\\a");
});

test("self closing tag with forward slash", function () {
  var emblem = "hr/";
  integration_assertions.compilesTo(emblem, "<hr>");

  // non-void elements are still closed correctly
  emblem = "p/";
  integration_assertions.compilesTo(emblem, "<p></p>");
});

test("tagnames and attributes with colons", function () {
  var emblem;
  emblem = "%al:ex match:neer=\"snork\" Hello!";
  integration_assertions.compilesTo(emblem, "<al:ex match:neer=\"snork\">Hello!</al:ex>");
});

test("windows newlines", function () {
  var emblem;
  emblem = "\r\n  \r\n  p Hello\r\n\r\n";
  integration_assertions.compilesTo(emblem, "<p>Hello</p>");
});

QUnit.module("text: EOL Whitespace");

test("shouldn't be necessary to insert a space", function () {
  var emblem;
  emblem = "p Hello,\n  How are you?\np I'm fine, thank you.";
  integration_assertions.compilesTo(emblem, "<p>Hello, How are you?</p><p>I'm fine, thank you.</p>");
});

QUnit.module("text: indent/predent");

test("mixture", function () {
  var emblem;
  emblem = "        \n";
  emblem += "  p Hello\n";
  emblem += "  p\n";
  emblem += "    | Woot\n";
  emblem += "  span yes\n";
  return integration_assertions.compilesTo(emblem, "<p>Hello</p><p>Woot</p><span>yes</span>");
});

test("mixture w/o opening blank", function () {
  var emblem;
  emblem = "  p Hello\n";
  emblem += "  p\n";
  emblem += "    | Woot\n";
  emblem += "  span yes\n";
  return integration_assertions.compilesTo(emblem, "<p>Hello</p><p>Woot</p><span>yes</span>");
});

test("w/ blank lines", function () {
  var emblem;
  emblem = "  p Hello\n";
  emblem += "  p\n";
  emblem += "\n";
  emblem += "    | Woot\n";
  emblem += "\n";
  emblem += "  span yes\n";
  return integration_assertions.compilesTo(emblem, "<p>Hello</p><p>Woot</p><span>yes</span>");
});

test("w/ blank whitespaced lines", function () {
  var emblem;
  emblem = "  p Hello\n";
  emblem += "  p\n";
  emblem += "\n";
  emblem += "    | Woot\n";
  emblem += "        \n";
  emblem += "       \n";
  emblem += "         \n";
  emblem += "\n";
  emblem += "  span yes\n";
  emblem += "\n";
  emblem += "  sally\n";
  emblem += "\n";
  emblem += "         \n";
  emblem += "    | Woot\n";
  return integration_assertions.compilesTo(emblem, "<p>Hello</p><p>Woot</p><span>yes</span>{{#sally}}Woot{{/sally}}");
});