'use strict';

var utils = require('../support/utils');
var integration_assertions = require('../support/integration-assertions');

/*global QUnit*/

QUnit.module("mustache: simple");

test("various one-liners", function () {
  var emblem = utils.w("= foo", "arf", "p = foo", "span.foo", "p data-foo=\"yes\" = goo");
  integration_assertions.compilesTo(emblem, "{{foo}}{{arf}}<p>{{foo}}</p><span class=\"foo\"></span><p data-foo=\"yes\">{{goo}}</p>");
});


test("double =='s un-escape", function () {
  var emblem = utils.w("== foo", "foo", "p == foo");
  integration_assertions.compilesTo(emblem, "{{{foo}}}{{foo}}<p>{{{foo}}}</p>");
});

test("nested combo syntax", function () {
  var emblem = utils.w("ul = each items", "  li = foo");
  integration_assertions.compilesTo(emblem, "<ul>{{#each items}}<li>{{foo}}</li>{{/each}}</ul>");
});

QUnit.module("mustache: capitalized line-starter");

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

test("should not kick in explicit {{mustache}}", function () {
  var emblem = utils.w("p Yeah {{SomeView}}");
  integration_assertions.compilesTo(emblem, "<p>Yeah {{SomeView}}</p>");
});

QUnit.module("mustache: lower-case starting string");

test("recognizes double-quoted attrs", function () {
  var emblem = "frank text=\"yes\"";
  integration_assertions.compilesTo(emblem, "{{frank text=\"yes\"}}");
});

test("recognizes single-quoted attrs", function () {
  var emblem = "frank text='yes'";
  integration_assertions.compilesTo(emblem, "{{frank text='yes'}}");
});

test("recognizes unquoted attrs", function () {
  var emblem = "frank foo=bar";
  integration_assertions.compilesTo(emblem, "{{frank foo=bar}}");
});

test("sub-expressions are ok", function () {
  var emblem = "\n    = link-to 'content-manage.social' (query-params groupId=defaultGroup.id) tagName=\"li\"\n  ";
  integration_assertions.compilesTo(emblem, "{{link-to 'content-manage.social' (query-params groupId=defaultGroup.id) tagName=\"li\"}}");
});

test("percent sign in quoted attr value", function () {
  var emblem = "\n      = input placeholder=\"100%\"\n  ";
  integration_assertions.compilesTo(emblem, "{{input placeholder=\"100%\"}}");
});

test("colon and semicolon in quoted attr value", function () {
  var emblem = "\n      = input style=\"outline:blue; color:red\"\n  ";
  integration_assertions.compilesTo(emblem, "{{input style=\"outline:blue; color:red\"}}");
});

QUnit.module("mustache: raw mustache unescaped");
// _ Bork {{foo}} {{{bar}}}!

test("triple mustache in text line", function () {
  var emblem = "| bork {{{bar}}}";
  integration_assertions.compilesTo(emblem, "bork {{{bar}}}");
});

test("double mustache in text line", function () {
  var emblem = "| bork {{bar}}";
  integration_assertions.compilesTo(emblem, "bork {{bar}}");
});

test("hash stache in text line", function () {
  var emblem = "| bork #{bar}";
  integration_assertions.compilesTo(emblem, "bork {{bar}}");
});

QUnit.module("mustache: hash brace syntax, #{}");

test("acts like {{}}", function () {
  var emblem = "span Yo #{foo}, I herd.";
  integration_assertions.compilesTo(emblem, "<span>Yo {{foo}}, I herd.</span>");
});

test("can start inline content", function () {
  var emblem = "span #{foo}, I herd.";
  integration_assertions.compilesTo(emblem, "<span>{{foo}}, I herd.</span>");
});

test("can end inline content", function () {
  var emblem = "span I herd #{foo}";
  integration_assertions.compilesTo(emblem, "<span>I herd {{foo}}</span>");
});

test("doesn't screw up parsing when # used in text nodes", function () {
  var emblem = "span OMG #YOLO";
  integration_assertions.compilesTo(emblem, "<span>OMG #YOLO</span>");
});

test("# can be only thing on line", function () {
  var emblem = "span #";
  integration_assertions.compilesTo(emblem, "<span>#</span>");
});

QUnit.module("mustache: inline block helper");

test("text only", function () {
  var emblem;
  emblem = "view SomeView | Hello";
  integration_assertions.compilesTo(emblem, "{{#view SomeView}}Hello{{/view}}");
});

test("multiline", function () {
  var emblem;
  emblem = utils.w("view SomeView | Hello,", "  How are you?", "  Sup?");
  integration_assertions.compilesTo(emblem, "{{#view SomeView}}Hello, How are you? Sup?{{/view}}");
});

test("more complicated", function () {
  var emblem;
  emblem = "view SomeView borf=\"yes\" | Hello, How are you? Sup?";
  integration_assertions.compilesTo(emblem, "{{#view SomeView borf=\"yes\"}}Hello, How are you? Sup?{{/view}}");
});

test("GH-26: no need for space before equal sign", function () {
  var emblem;
  emblem = "span= foo";
  integration_assertions.compilesTo(emblem, "<span>{{foo}}</span>");
  emblem = "span.foo= foo";
  integration_assertions.compilesTo(emblem, "<span class=\"foo\">{{foo}}</span>");
  emblem = "span#hooray.foo= foo";
  integration_assertions.compilesTo(emblem, "<span id=\"hooray\" class=\"foo\">{{foo}}</span>");
  emblem = "#hooray= foo";
  integration_assertions.compilesTo(emblem, "<div id=\"hooray\">{{foo}}</div>");
  emblem = ".hooray= foo";
  return integration_assertions.compilesTo(emblem, "<div class=\"hooray\">{{foo}}</div>");
});

QUnit.module("mustache: in-tag explicit mustache");

test("single", function () {
  return integration_assertions.compilesTo("p{inTagHelper foo}", "<p {{inTagHelper foo}}></p>");
});

test("double", function () {
  return integration_assertions.compilesTo("p{{inTagHelper foo}}", "<p {{inTagHelper foo}}></p>");
});

test("triple", function () {
  return integration_assertions.compilesTo("p{{{inTagHelper foo}}}", "<p {{{inTagHelper foo}}}></p>");
});

test("with singlestache", function () {
  return integration_assertions.compilesTo("p{insertClass foo} Hello", "<p {{insertClass foo}}>Hello</p>");
});

test("singlestache can be used in text nodes", function () {
  return integration_assertions.compilesTo("p Hello {dork}", "<p>Hello {dork}</p>");
});

test("with doublestache", function () {
  return integration_assertions.compilesTo("p{{insertClass foo}} Hello", "<p {{insertClass foo}}>Hello</p>");
});

test("with triplestache", function () {
  return integration_assertions.compilesTo("p{{{insertClass foo}}} Hello", "<p {{{insertClass foo}}}>Hello</p>");
});

test("multiple", function () {
  return integration_assertions.compilesTo("p{{{insertClass foo}}}{{{insertClass boo}}} Hello", "<p {{{insertClass foo}}} {{{insertClass boo}}}>Hello</p>");
});

test("with nesting", function () {
  var emblem;
  emblem = "p{{bind-attr class=\"foo\"}}\n  span Hello";
  return integration_assertions.compilesTo(emblem, "<p {{bind-attr class=\"foo\"}}><span>Hello</span></p>");
});

test("more nesting", function () {
  var emblem = utils.w("", "sally", "  p Hello");
  integration_assertions.compilesTo(emblem, "{{#sally}}<p>Hello</p>{{/sally}}");
});

test("recursive nesting", function () {
  var emblem = utils.w("", "sally", "  sally", "    p Hello");
  integration_assertions.compilesTo(emblem, "{{#sally}}{{#sally}}<p>Hello</p>{{/sally}}{{/sally}}");
});

test("recursive nesting part 2", function () {
  var emblem = utils.w("", "sally", "  sally thing", "    p Hello");
  integration_assertions.compilesTo(emblem, "{{#sally}}{{#sally thing}}<p>Hello</p>{{/sally}}{{/sally}}");
});

test("use of \"this\"", function () {
  var emblem = utils.w("", "each foo", "  p = this", "  this");
  integration_assertions.compilesTo(emblem, "{{#each foo}}<p>{{this}}</p>{{this}}{{/each}}");
});

test("mustache attr with underscore", function () {
  var emblem = "input placeholder=cat_name";
  integration_assertions.compilesTo(emblem, "<input {{bind-attr placeholder=cat_name}}>");
});


// FIXME
/*
test('bracketed nested statement', function(){
  var emblem = w('',
                 'sally [',
                 '  \'foo\'',
                 '  something="false" ]',
                 '  |  Bracketed helper attrs!');
  compilesTo(
    emblem, '{{#sally \'foo\' something="false"}}Bracketed helper attrs!{{/sally}}');
});

test('bracketed nested block', function(){
  var emblem = w('',
                 'sally [',
                 '  \'foo\'',
                 '  something="false" ]',
                 '  p Bracketed helper attrs!');
  compilesTo(
    emblem, '{{#sally \'foo\' something="false"}}<p>Bracketed helper attrs!</p>{{/sally}}');
});
*/