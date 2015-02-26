'use strict';

var integration_assertions = require('../support/integration-assertions');

/*global QUnit*/

QUnit.module("subexpressions");

/*
Handlebars.registerHelper('echo', function(param) {
  return "ECHO " + param;
});

Handlebars.registerHelper('echofun', function() {
  var options;
  options = Array.prototype.pop.call(arguments);
  return "FUN = " + options.hash.fun;
});

Handlebars.registerHelper('hello', function(param) {
  return "hello";
});

Handlebars.registerHelper('equal', function(x, y) {
  return x === y;
});
*/

test("arg-less helper", function () {
  var emblem = "p {{echo (hello)}}";
  integration_assertions.compilesTo(emblem, "<p>{{echo (hello)}}</p>");

  emblem = "= echo (hello)";
  integration_assertions.compilesTo(emblem, "{{echo (hello)}}");
});

test("helper w args", function () {
  var emblem = "p {{echo (equal 1 1)}}";
  integration_assertions.compilesTo(emblem, "<p>{{echo (equal 1 1)}}</p>");

  emblem = "= echo (equal 1 1)";
  integration_assertions.compilesTo(emblem, "{{echo (equal 1 1)}}");
});

test("supports much nesting", function () {
  var emblem = "p {{echo (equal (equal 1 1) true)}}";
  integration_assertions.compilesTo(emblem, "<p>{{echo (equal (equal 1 1) true)}}</p>");
  emblem = "= echo (equal (equal 1 1) true)";
  integration_assertions.compilesTo(emblem, "{{echo (equal (equal 1 1) true)}}");
});

test("with hashes", function () {
  var emblem = "p {{echo (equal (equal 1 1) true fun=\"yes\")}}";
  integration_assertions.compilesTo(emblem, "<p>{{echo (equal (equal 1 1) true fun=\"yes\")}}</p>");
  emblem = "= echo (equal (equal 1 1) true fun=\"yes\")";
  integration_assertions.compilesTo(emblem, "{{echo (equal (equal 1 1) true fun=\"yes\")}}");
});


test("as hashes", function () {
  var emblem = "p {{echofun fun=(equal 1 1)}}";
  integration_assertions.compilesTo(emblem, "<p>{{echofun fun=(equal 1 1)}}</p>");

  emblem = "= echofun fun=(equal 1 1)";
  integration_assertions.compilesTo(emblem, "{{echofun fun=(equal 1 1)}}");
});

test("complex expression", function () {
  var emblem = "p {{echofun true (hello how=\"are\" you=false) 1 not=true fun=(equal \"ECHO hello\" (echo (hello))) win=\"yes\"}}";
  integration_assertions.compilesTo(emblem, "<p>{{echofun true (hello how=\"are\" you=false) 1 not=true fun=(equal \"ECHO hello\" (echo (hello))) win=\"yes\"}}</p>");

  emblem = "= echofun true (hello how=\"are\" you=false) 1 not=true fun=(equal \"ECHO hello\" (echo (hello))) win=\"yes\"";
  var expected = "{{echofun true (hello how=\"are\" you=false) 1 not=true fun=(equal \"ECHO hello\" (echo (hello))) win=\"yes\"}}";
  integration_assertions.compilesTo(emblem, expected);
});