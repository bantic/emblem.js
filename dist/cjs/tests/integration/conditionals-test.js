'use strict';

var utils = require('../support/utils');
var integration_assertions = require('../support/integration-assertions');

/*global QUnit*/

QUnit.module("conditionals");

test("simple if statement", function () {
  var emblem = utils.w("if foo", "  | Foo", "if bar", "  | Bar");
  integration_assertions.compilesTo(emblem, "{{#if foo}}Foo{{/if}}{{#if bar}}Bar{{/if}}");
});

test("if else ", function () {
  var emblem = utils.w("if foo", "  | Foo", "  if bar", "    | Bar", "  else", "    | Woot", "else", "  | WRONG", "if bar", "  | WRONG", "else", "  | Hooray");
  integration_assertions.compilesTo(emblem, "{{#if foo}}Foo{{#if bar}}Bar{{else}}Woot{{/if}}{{else}}WRONG{{/if}}{{#if bar}}WRONG{{else}}Hooray{{/if}}");
});

test("else with preceding `=`", function () {
  var emblem = utils.w("= if foo", "  p Yeah", "= else", "  p No", "= if bar", "  p Yeah!", "= else", "  p No!", "=if bar", "  p Yeah!", "=else", "  p No!");
  integration_assertions.compilesTo(emblem, "{{#if foo}}<p>Yeah</p>{{else}}<p>No</p>{{/if}}{{#if bar}}<p>Yeah!</p>{{else}}<p>No!</p>{{/if}}{{#if bar}}<p>Yeah!</p>{{else}}<p>No!</p>{{/if}}");
});


test("unless", function () {
  var emblem = utils.w("unless bar", "  | Foo", "  unless foo", "    | Bar", "  else", "    | Woot", "else", "  | WRONG", "unless foo", "  | WRONG", "else", "  | Hooray");
  integration_assertions.compilesTo(emblem, "{{#unless bar}}Foo{{#unless foo}}Bar{{else}}Woot{{/unless}}{{else}}WRONG{{/unless}}{{#unless foo}}WRONG{{else}}Hooray{{/unless}}");
});

test("else followed by newline doesn't gobble else content", function () {
  var emblem = utils.w("if something", "  p something", "else", "", "  if nothing", "    p nothing", "  else", "    p not nothing");
  integration_assertions.compilesTo(emblem, "{{#if something}}<p>something</p>{{else}}{{#if nothing}}<p>nothing</p>{{else}}<p>not nothing</p>{{/if}}{{/if}}");
});