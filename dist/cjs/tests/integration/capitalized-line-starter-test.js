'use strict';

var utils = require('../support/utils');
var integration_assertions = require('../support/integration-assertions');

/*global QUnit*/

QUnit.module("capitalized line-starter");

test("should invoke `view` helper by default", function () {
  var emblem = utils.w("SomeView");
  integration_assertions.compilesTo(emblem, "{{view SomeView}}");
});

test("should support block mode", function () {
  var emblem = utils.w("SomeView", "  p View content");
  integration_assertions.compilesTo(emblem, "{{#view SomeView}}<p>View content</p>{{/view}}");
});

test("should not kick in if preceded by equal sign", function () {
  var emblem = utils.w("= SomeView");
  integration_assertions.compilesTo(emblem, "{{SomeView}}");
});

test("should not kick in if preceded by equal sign (example with partial)", function () {
  var emblem = utils.w("= partial \"cats\"");
  integration_assertions.compilesTo(emblem, "{{partial \"cats\"}}");
});

test("should not kick in explicit {{mustache}}", function () {
  var emblem = utils.w("p Yeah {{SomeView}}");
  integration_assertions.compilesTo(emblem, "<p>Yeah {{SomeView}}</p>");
});