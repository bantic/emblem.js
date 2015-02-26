'use strict';

var Emblem = require('../../emblem');
var utils = require('../support/utils');
var integration_assertions = require('../support/integration-assertions');

/*global QUnit*/

QUnit.module("html: single line");

QUnit.test("element only", function () {
  integration_assertions.compilesTo("p", "<p></p>");
});

QUnit.test("with text", function () {
  integration_assertions.compilesTo("p Hello", "<p>Hello</p>");
});

QUnit.test("with more complex text", function () {
  integration_assertions.compilesTo("p Hello, how's it going with you today?", "<p>Hello, how's it going with you today?</p>");
});

QUnit.test("with trailing space", function () {
  integration_assertions.compilesTo("p Hello   ", "<p>Hello   </p>");
});

QUnit.test("can start with angle bracket html", function () {
  var emblem = "<span>Hello</span>";
  integration_assertions.compilesTo(emblem, "<span>Hello</span>");
});

QUnit.module("html: multiple lines");

QUnit.test("two lines", function () {
  var emblem = utils.w("p This is", "  pretty cool.");
  integration_assertions.compilesTo(emblem, "<p>This is pretty cool.</p>");
});

QUnit.test("three lines", function () {
  var emblem = utils.w("p This is", "  pretty damn", "  cool.");
  integration_assertions.compilesTo(emblem, "<p>This is pretty damn cool.</p>");
});

QUnit.test("three lines w/ embedded html", function () {
  var emblem = utils.w("p This is", "  pretty <span>damn</span>", "  cool.");
  integration_assertions.compilesTo(emblem, "<p>This is pretty <span>damn</span> cool.</p>");
});

QUnit.test("indentation doesn't need to match starting inline content's", function () {
  var emblem = utils.w("  span Hello,", "    How are you?");
  integration_assertions.compilesTo(emblem, "<span>Hello, How are you?</span>");
});

QUnit.test("indentation may vary between parent/child, must be consistent within inline-block", function () {
  var emblem = utils.w("div", "      span Hello,", "           How are you?", "           Excellent.", "      p asd");
  integration_assertions.compilesTo(emblem, "<div><span>Hello, How are you? Excellent.</span><p>asd</p></div>");

  emblem = utils.w("div", "  span Hello,", "       How are you?", "     Excellent.");
  QUnit.throws(function () {
    Emblem['default'].compile(emblem);
  });
});

QUnit.test("indentation may vary between parent/child, must be consistent within inline-block pt 2", function () {
  var emblem = utils.w("div", "  span Hello,", "       How are you?", "       Excellent.");

  integration_assertions.compilesTo(emblem, "<div><span>Hello, How are you? Excellent.</span></div>");
});


QUnit.test("w/ mustaches", function () {
  var emblem = utils.w("div", "  span Hello,", "       {{foo}} are you?", "       Excellent.");

  integration_assertions.compilesTo(emblem, "<div><span>Hello, {{foo}} are you? Excellent.</span></div>");
});

QUnit.test("with followup", function () {
  var emblem = utils.w("p This is", "  pretty cool.", "p Hello.");
  integration_assertions.compilesTo(emblem, "<p>This is pretty cool.</p><p>Hello.</p>");
});

QUnit.test("can start with angle bracket html and go to multiple lines", function () {
  var emblem = utils.w("<span>Hello dude,", "      what's up?</span>");
  integration_assertions.compilesTo(emblem, "<span>Hello dude, what's up?</span>");
});

QUnit.module("html: nested");

test("basic", function () {
  var emblem = utils.w("p", "  span Hello", "  strong Hi", "div", "  p Hooray");
  integration_assertions.compilesTo(emblem, "<p><span>Hello</span><strong>Hi</strong></p><div><p>Hooray</p></div>");
});

test("empty nest", function () {
  var emblem = utils.w("p", "  span", "    strong", "      i");
  integration_assertions.compilesTo(emblem, "<p><span><strong><i></i></strong></span></p>");
});

test("empty nest w/ attribute shorthand", function () {
  var emblem = utils.w("p.woo", "  span#yes", "    strong.no.yes", "      i");
  integration_assertions.compilesTo(emblem, "<p class=\"woo\"><span id=\"yes\"><strong class=\"no yes\"><i></i></strong></span></p>");
});

QUnit.module("html: self-closing html tags");

test("br", function () {
  var emblem;
  emblem = "br";
  integration_assertions.compilesTo(emblem, "<br>");
});

test("hr", function (assert) {
  var emblem;
  emblem = "hr";
  integration_assertions.compilesTo(emblem, "<hr>");
});

test("br paragraph example", function () {
  var emblem;
  emblem = "p\n  | LOL!\n  br\n  | BORF!";
  integration_assertions.compilesTo(emblem, "<p>LOL!<br>BORF!</p>");
});

test("input", function () {
  var emblem;
  emblem = "input type=\"text\"";
  integration_assertions.compilesTo(emblem, "<input type=\"text\">");
});

test("nested content under self-closing tag should fail", function () {
  var emblem = "hr\n | here is text";
  QUnit.throws(function () {
    Emblem['default'].compile(emblem);
  }, /cannot nest/i);
});