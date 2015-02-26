'use strict';

var utils = require('../support/utils');
var Emblem = require('../../emblem');
var integration_assertions = require('../support/integration-assertions');

/*global QUnit*/

var runTextLineSuite;

QUnit.module("text lines: starting with '|'");

test("basic", function () {
  integration_assertions.compilesTo("| What what", "What what");
});

test("with html", function () {
  integration_assertions.compilesTo("| What <span id=\"woot\" data-t=\"oof\" class=\"f\">what</span>!", "What <span id=\"woot\" data-t=\"oof\" class=\"f\">what</span>!");
});

test("multiline", function () {
  var emblem;
  emblem = "| Blork\n  Snork";
  integration_assertions.compilesTo(emblem, "Blork Snork");
});

test("triple multiline", function () {
  var emblem;
  emblem = "| Blork\n  Snork\n  Bork";
  integration_assertions.compilesTo(emblem, "Blork Snork Bork");
});

test("quadruple multiline", function () {
  var emblem;
  emblem = "| Blork\n  Snork\n  Bork\n  Fork";
  integration_assertions.compilesTo(emblem, "Blork Snork Bork Fork");
});

test("multiline w/ trailing whitespace", function () {
  var emblem;
  emblem = "| Blork \n  Snork";
  integration_assertions.compilesTo(emblem, "Blork  Snork");
});

test("secondline", function () {
  var emblem;
  emblem = "|\n  Good";
  integration_assertions.compilesTo(emblem, "Good");
});

test("secondline multiline", function () {
  var emblem;
  emblem = "| \n  Good\n  Bork";
  integration_assertions.compilesTo(emblem, "Good Bork");
});

test("with a mustache", function () {
  var emblem;
  emblem = "| Bork {{foo}}!";
  integration_assertions.compilesTo(emblem, "Bork {{foo}}!");
});

test("with mustaches", function () {
  var emblem;
  emblem = "| Bork {{foo}} {{{bar}}}!";
  integration_assertions.compilesTo(emblem, "Bork {{foo}} {{{bar}}}!");
});

test("on each line", function () {
  var emblem;
  emblem = "\n  pre\n    | This\n    |   should\n    |  hopefully\n    |    work, and work well.";
  integration_assertions.compilesTo(emblem, "<pre>This  should hopefully   work, and work well.</pre>");
});

test("with blank", function () {
  var emblem;
  emblem = "\n  pre\n    | This\n    |   should\n    |\n    |  hopefully\n    |    work, and work well.";
  integration_assertions.compilesTo(emblem, "<pre>This  should hopefully   work, and work well.</pre>");
});

QUnit.module("text lines: starting with '`' -- backtick ADDS a trailing newline");

test("basic", function () {
  integration_assertions.compilesTo("` What what", "What what\n");
});

test("with html", function () {
  integration_assertions.compilesTo("` What <span id=\"woot\" data-t=\"oof\" class=\"f\">what</span>!", "What <span id=\"woot\" data-t=\"oof\" class=\"f\">what</span>!\n");
});

test("multiline", function () {
  var emblem;
  emblem = utils.w("` Blork", "  Snork");
  integration_assertions.compilesTo(emblem, "Blork Snork\n");
});

test("triple multiline", function () {
  var emblem;
  emblem = utils.w("` Blork", "  Snork", "  Bork");
  integration_assertions.compilesTo(emblem, "Blork Snork Bork\n");
});

test("quadruple multiline", function () {
  var emblem;
  emblem = utils.w("` Blork", "  Snork", "  Bork", "  Fork");
  integration_assertions.compilesTo(emblem, "Blork Snork Bork Fork\n");
});

test("multiline w/ trailing whitespace", function () {
  var emblem;
  emblem = utils.w("` Blork ", "  Snork");
  integration_assertions.compilesTo(emblem, "Blork  Snork\n");
});

test("secondline", function () {
  var emblem;
  emblem = utils.w("`", "  Good");
  integration_assertions.compilesTo(emblem, "Good\n");
});

test("secondline multiline", function () {
  var emblem;
  emblem = utils.w("` ", "  Good", "  Bork");
  integration_assertions.compilesTo(emblem, "Good Bork\n");
});

test("with a mustache", function () {
  var emblem;
  emblem = "` Bork {{foo}}!";
  integration_assertions.compilesTo(emblem, "Bork {{foo}}!\n");
});

test("with mustaches", function () {
  var emblem;
  emblem = "` Bork {{foo}} {{{bar}}}!";
  integration_assertions.compilesTo(emblem, "Bork {{foo}} {{{bar}}}!\n");
});

test("on each line", function () {
  var emblem;
  emblem = "\n  pre\n    ` This\n    `   should\n    `  hopefully\n    `    work, and work well.";
  var expected = "<pre>This\n  should\n hopefully\n   work, and work well.\n</pre>";
  integration_assertions.compilesTo(emblem, expected);
});

test("with blank", function () {
  var emblem;
  emblem = "\n  pre\n    ` This\n    `   should\n    `\n    `  hopefully\n    `    work, and work well.";
  integration_assertions.compilesTo(emblem, "<pre>This\n  should\n\n hopefully\n   work, and work well.\n</pre>");
});

QUnit.module("text lines: starting with \"'\" should add an extra space");

test("basic", function () {
  integration_assertions.compilesTo("' What what", "What what ");
});

test("with html", function () {
  integration_assertions.compilesTo("' What <span id=\"woot\" data-t=\"oof\" class=\"f\">what</span>!", "What <span id=\"woot\" data-t=\"oof\" class=\"f\">what</span>! ");
});

test("multiline", function () {
  var emblem;
  emblem = "' Blork\n              Snork";
  integration_assertions.compilesTo(emblem, "Blork Snork ");
});

test("triple multiline", function () {
  var emblem;
  emblem = "' Blork\n              Snork\n              Bork";
  integration_assertions.compilesTo(emblem, "Blork Snork Bork ");
});

test("quadruple multiline", function () {
  var emblem;
  emblem = "' Blork\n              Snork\n              Bork\n              Fork";
  integration_assertions.compilesTo(emblem, "Blork Snork Bork Fork ");
});

test("multiline w/ trailing whitespace", function () {
  var emblem;
  emblem = "' Blork \n              Snork";
  integration_assertions.compilesTo(emblem, "Blork  Snork ");
});

test("secondline", function () {
  var emblem;
  emblem = "'\n  Good";
  integration_assertions.compilesTo(emblem, "Good ");
});

test("secondline multiline", function () {
  var emblem;
  emblem = "' \n  Good\n  Bork";
  integration_assertions.compilesTo(emblem, "Good Bork ");
});

test("with a mustache", function () {
  var emblem;
  emblem = "' Bork {{foo}}!";
  integration_assertions.compilesTo(emblem, "Bork {{foo}}! ");
});

test("with mustaches", function () {
  var emblem;
  emblem = "' Bork {{foo}} {{{bar}}}!";
  integration_assertions.compilesTo(emblem, "Bork {{foo}} {{{bar}}}! ");
});

test("on each line", function () {
  var emblem;
  emblem = "\n  pre\n    ' This\n    '   should\n    '  hopefully\n    '    work, and work well.";
  integration_assertions.compilesTo(emblem, "<pre>This   should  hopefully    work, and work well. </pre>");
});

test("with blank", function () {
  var emblem;
  emblem = "\n  pre\n    ' This\n    '   should\n    '\n    '  hopefully\n    '    work, and work well.";
  var expected = "<pre>This   should   hopefully    work, and work well. </pre>";
  integration_assertions.compilesTo(emblem, expected);
});