'use strict';

var integration_assertions = require('../support/integration-assertions');

/*global QUnit*/

QUnit.module("haml style");

test("basic", function () {
  var emblem;
  emblem = "%borf";
  return integration_assertions.compilesTo(emblem, "<borf></borf>");
});

test("nested", function () {
  var emblem;
  emblem = "%borf\n    %sporf Hello";
  return integration_assertions.compilesTo(emblem, "<borf><sporf>Hello</sporf></borf>");
});

test("capitalized", function () {
  var emblem;
  emblem = "%Alex alex\n%Alex\n  %Woot";
  return integration_assertions.compilesTo(emblem, "<Alex>alex</Alex><Alex><Woot></Woot></Alex>");
});

test("funky chars", function () {
  var emblem;
  emblem = "%borf:narf\n%borf:narf Hello, {{foo}}.\n%alex = foo";
  return integration_assertions.compilesTo(emblem, "<borf:narf></borf:narf><borf:narf>Hello, {{foo}}.</borf:narf><alex>{{foo}}</alex>");
});