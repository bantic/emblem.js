'use strict';

var utils = require('../support/utils');
var integration_assertions = require('../support/integration-assertions');

/*global QUnit*/

QUnit.module("preprocessor");

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