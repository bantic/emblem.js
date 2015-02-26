'use strict';

var utils = require('../support/utils');
var integration_assertions = require('../support/integration-assertions');

/* global QUnit*/

QUnit.module("actions");

test("basic (click)", function () {
  var emblem = "button click=\"submitComment\" Submit Comment";
  integration_assertions.compilesTo(emblem, "<button {{action \"submitComment\" on=\"click\"}}>Submit Comment</button>");
});

test("basic (click) followed by attr", function () {
  var emblem = "button click=\"submitComment\" class=\"foo\" Submit Comment";
  integration_assertions.compilesTo(emblem, "<button {{action \"submitComment\" on=\"click\"}} class=\"foo\">Submit Comment</button>");

  emblem = "button click=\"submitComment 'omg'\" class=\"foo\" Submit Comment";
  integration_assertions.compilesTo(emblem, "<button {{action submitComment 'omg' on=\"click\"}} class=\"foo\">Submit Comment</button>");
});

test("nested (mouseEnter)", function () {
  var emblem = utils.w("a mouseEnter='submitComment target=view'", "  | Submit Comment");
  integration_assertions.compilesTo(emblem, "<a {{action submitComment target=view on=\"mouseEnter\"}}>Submit Comment</a>");
});

test("explicitly single-quoted action name stays quoted", function () {
  var emblem = "a mouseEnter=\"'hello' target=controller\"";
  integration_assertions.compilesTo(emblem, "<a {{action 'hello' target=controller on=\"mouseEnter\"}}></a>");
});

test("explicitly dobule-quoted action name stays quoted", function () {
  var emblem = "a mouseEnter='\"hello\" target=controller'";
  integration_assertions.compilesTo(emblem, "<a {{action \"hello\" target=controller on=\"mouseEnter\"}}></a>");
});

test("nested (mouseEnter, singlequoted)", function () {
  var emblem = utils.w("a mouseEnter='submitComment target=\"view\"'", "  | Submit Comment");
  integration_assertions.compilesTo(emblem, "<a {{action submitComment target=\"view\" on=\"mouseEnter\"}}>Submit Comment</a>");
});

test("nested (mouseEnter, doublequoted)", function () {
  var emblem = utils.w("a mouseEnter=\"submitComment target='view'\"", "  | Submit Comment");
  integration_assertions.compilesTo(emblem, "<a {{action submitComment target='view' on=\"mouseEnter\"}}>Submit Comment</a>");
});

test("manual", function () {
  var emblem = "a{action someBoundAction target=view} Submit Comment";
  integration_assertions.compilesTo(emblem, "<a {{action someBoundAction target=view}}>Submit Comment</a>");
});

test("manual nested", function () {
  var emblem = utils.w("a{action 'submitComment' target=view}", "  p Submit Comment");
  integration_assertions.compilesTo(emblem, "<a {{action 'submitComment' target=view}}><p>Submit Comment</p></a>");
});

test("single quote test", function () {
  var emblem;
  emblem = "button click='p' Frank";
  integration_assertions.compilesTo(emblem, "<button {{action \"p\" on=\"click\"}}>Frank</button>");
});

test("double quote test", function () {
  var emblem;
  emblem = "button click=\"p\" Frank";
  integration_assertions.compilesTo(emblem, "<button {{action \"p\" on=\"click\"}}>Frank</button>");
});

test("no quote remains unquoted in output", function () {
  var emblem;
  emblem = "button click=p Frank";
  integration_assertions.compilesTo(emblem, "<button {{action p on=\"click\"}}>Frank</button>");
});