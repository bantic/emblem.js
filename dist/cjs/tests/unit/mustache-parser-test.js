'use strict';

var parse = require('../../emblem/mustache-parser');

/* global QUnit */
QUnit.module("mustache-parser");

test("capitalized start", function (assert) {
  var text = "App.Funview";

  assert.deepEqual(parse['default'](text), {
    name: "App.Funview",
    attrs: []
  });
});

test("lowercase start", function (assert) {
  var text = "frank";

  assert.deepEqual(parse['default'](text), {
    name: "frank",
    attrs: []
  });
});

test("lowercase unquoted attr value", function (assert) {
  var text = "frank foo=bar";

  assert.deepEqual(parse['default'](text), {
    name: "frank",
    attrs: ["foo=bar"]
  });
});

test("attrs with spaces", function (assert) {
  var text = "frank foo = bar boo = far";

  assert.deepEqual(parse['default'](text), {
    name: "frank",
    attrs: ["foo=bar", "boo=far"]
  });
});

test("multiple attrs", function (assert) {
  var text = "frank foo=bar boo=far";

  assert.deepEqual(parse['default'](text), {
    name: "frank",
    attrs: ["foo=bar", "boo=far"]
  });
});

test("lowercase double-quoted attr value", function (assert) {
  var doubleQuote = "input placeholder=\"'100% /^%&*()x12#\"";

  assert.deepEqual(parse['default'](doubleQuote), {
    name: "input",
    attrs: ["placeholder=\"'100% /^%&*()x12#\""]
  });
});

test("lowercase single-quoted attr value", function (assert) {
  var singleQuote = "input placeholder='\"100% /^%&*()x12#'";

  assert.deepEqual(parse['default'](singleQuote), {
    name: "input",
    attrs: ["placeholder='\"100% /^%&*()x12#'"]
  });
});

test("attr value with underscore", function (assert) {
  var text = "input placeholder=cat_name";
  assert.deepEqual(parse['default'](text), {
    name: "input",
    attrs: ["placeholder=cat_name"]
  });
});

test("attr value is subexpression", function (assert) {
  var text = "echofun fun=(equal 1 1)";
  assert.deepEqual(parse['default'](text), {
    name: "echofun",
    attrs: ["fun=(equal 1 1)"]
  });
});

test("attr value is complex subexpression", function (assert) {
  var text = "echofun true (hello how=\"are\" you=false) 1 not=true fun=(equal \"ECHO hello\" (echo (hello))) win=\"yes\"";
  assert.deepEqual(parse['default'](text), {
    name: "echofun",
    attrs: ["true", "(hello how=\"are\" you=false)", "1", "not=true", "fun=(equal \"ECHO hello\" (echo (hello)))", "win=\"yes\""]
  });
});

test("query-params", function (assert) {
  var text = "frank (query-params groupId=defaultGroup.id)";

  assert.deepEqual(parse['default'](text), {
    name: "frank",
    attrs: ["(query-params groupId=defaultGroup.id)"]
  });
});

test("nested query-params", function (assert) {
  var text = "frank (query-params groupId=defaultGroup.id (more-qp x=foo))";

  assert.deepEqual(parse['default'](text), {
    name: "frank",
    attrs: ["(query-params groupId=defaultGroup.id (more-qp x=foo))"]
  });
});

test("mixed query-params and key-value attrs", function (assert) {
  var text = "frank (query-params abc=def) fob=bob (qp-2 dog=fog) dab=tab  ";

  assert.deepEqual(parse['default'](text), {
    attrs: ["(query-params abc=def)", "fob=bob", "(qp-2 dog=fog)", "dab=tab"],
    name: "frank"
  });
});

test("mustache name with dash", function (assert) {
  var text = "link-to foo=bar";

  assert.deepEqual(parse['default'](text), {
    name: "link-to",
    attrs: ["foo=bar"]
  });
});

test("mustache with quoted param", function (assert) {
  var text = "link-to \"abc.def\"";

  assert.deepEqual(parse['default'](text), {
    name: "link-to",
    attrs: ["\"abc.def\""]
  });
});

test("mustache with unquoted param", function (assert) {
  var text = "link-to dog";

  assert.deepEqual(parse['default'](text), {
    name: "link-to",
    attrs: ["dog"]
  });
});

test("mustache with multiple params", function (assert) {
  var text = "link-to \"dog.tag\" dog";

  assert.deepEqual(parse['default'](text), {
    name: "link-to",
    attrs: ["\"dog.tag\"", "dog"]
  });
});

test("mustache with shorthand % syntax", function (assert) {
  var text = "frank%span";

  assert.deepEqual(parse['default'](text), {
    name: "frank",
    attrs: ["tagName=\"span\""]
  });
});

test("mustache with shorthand # syntax", function (assert) {
  var text = "frank#id-name";

  assert.deepEqual(parse['default'](text), {
    name: "frank",
    attrs: ["elementId=\"id-name\""]
  });
});

test("mustache with shorthand . syntax with required space", function (assert) {
  var text = "frank .class-name";

  assert.deepEqual(parse['default'](text), {
    name: "frank",
    attrs: ["class=\"class-name\""]
  });
});

test("mustache with multiple classes", function (assert) {
  var text = "frank .class-name1.class-name2";

  assert.deepEqual(parse['default'](text), {
    name: "frank",
    attrs: ["class=\"class-name1\"", "class=\"class-name2\""]
  });
});

test("mustache with multiple shorthands", function (assert) {
  var text = "frank%span#my-id.class-name";

  assert.deepEqual(parse['default'](text), {
    name: "frank",
    attrs: ["tagName=\"span\"", "elementId=\"my-id\"", "class=\"class-name\""]
  });
});

test("mustache cannot start with a dot, a dash or a digit", function (assert) {
  assert.throws(function () {
    parse['default'](".frank");
  });
  assert.throws(function () {
    parse['default']("-frank");
  });
  assert.throws(function () {
    parse['default']("9frank");
  });
});

test("bang modifier", function (assert) {
  var text = "foo!";

  assert.deepEqual(parse['default'](text), {
    name: "foo",
    attrs: [],
    modifier: "!"
  });
});

test("conditional modifier", function (assert) {
  var text = "foo?";

  assert.deepEqual(parse['default'](text), {
    name: "foo",
    attrs: [],
    modifier: "?"
  });
});