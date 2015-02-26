'use strict';

var integration_assertions = require('../support/integration-assertions');

/*global QUnit*/

QUnit.module("attributes: shorthand");

test("id shorthand", function () {
  integration_assertions.compilesTo("#woot", "<div id=\"woot\"></div>");
  return integration_assertions.compilesTo("span#woot", "<span id=\"woot\"></span>");
});

test("class shorthand", function () {
  integration_assertions.compilesTo(".woot", "<div class=\"woot\"></div>");
  integration_assertions.compilesTo("span.woot", "<span class=\"woot\"></span>");
  return integration_assertions.compilesTo("span.woot.loot", "<span class=\"woot loot\"></span>");
});

test("class can come first", function () {
  integration_assertions.compilesTo(".woot#hello", "<div id=\"hello\" class=\"woot\"></div>");
  integration_assertions.compilesTo("span.woot#hello", "<span id=\"hello\" class=\"woot\"></span>");
  integration_assertions.compilesTo("span.woot.loot#hello", "<span id=\"hello\" class=\"woot loot\"></span>");
  return integration_assertions.compilesTo("span.woot.loot#hello.boot", "<span id=\"hello\" class=\"woot loot boot\"></span>");
});

QUnit.module("attributes: full attributes - tags with content");

test("class only", function () {
  return integration_assertions.compilesTo("p class=\"yes\" Blork", "<p class=\"yes\">Blork</p>");
});

test("id only", function () {
  return integration_assertions.compilesTo("p id=\"yes\" Hyeah", "<p id=\"yes\">Hyeah</p>");
});

test("class and id", function () {
  return integration_assertions.compilesTo("p id=\"yes\" class=\"no\" Blork", "<p id=\"yes\" class=\"no\">Blork</p>");
});

test("class and id and embedded html one-liner", function () {
  return integration_assertions.compilesTo("p id=\"yes\" class=\"no\" One <b>asd</b>!", "<p id=\"yes\" class=\"no\">One <b>asd</b>!</p>");
});

test("bracketed attributes", function () {
  var emblem;
  emblem = "p [\n  id=\"yes\"\n  class=\"no\" ]\n  | Bracketed Attributes FTW!";
  return integration_assertions.compilesTo(emblem, "<p id=\"yes\" class=\"no\">Bracketed Attributes FTW!</p>");
});

test("bracketed text", function () {
  var emblem;
  emblem = "p [ Bracketed text is cool ]";
  return integration_assertions.compilesTo(emblem, "<p>[ Bracketed text is cool ]</p>");
});

test("bracketed text indented", function () {
  var emblem;
  emblem = "p\n  | [ Bracketed text is cool ]";
  return integration_assertions.compilesTo(emblem, "<p>[ Bracketed text is cool ]</p>");
});

test("nesting", function () {
  var emblem;
  emblem = "p class=\"hello\" data-foo=\"gnarly\"\n  span Yes";
  return integration_assertions.compilesTo(emblem, "<p data-foo=\"gnarly\" class=\"hello\"><span>Yes</span></p>");
});


QUnit.module("attributes: full attributes - mixed quotes");

test("single empty", function () {
  return integration_assertions.compilesTo("p class=''", "<p class=\"\"></p>");
});

test("single full", function () {
  return integration_assertions.compilesTo("p class='woot yeah'", "<p class=\"woot yeah\"></p>");
});

test("mixed", function () {
  return integration_assertions.compilesTo("p class='woot \"oof\" yeah'", "<p class=\"woot \\\"oof\\\" yeah\"></p>");
});

QUnit.module("attributes: full attributes - tags without content");

test("empty", function () {
  return integration_assertions.compilesTo("p class=\"\"", "<p class=\"\"></p>");
});

test("class only", function () {
  return integration_assertions.compilesTo("p class=\"yes\"", "<p class=\"yes\"></p>");
});

test("id only", function () {
  return integration_assertions.compilesTo("p id=\"yes\"", "<p id=\"yes\"></p>");
});

test("class and id", function () {
  return integration_assertions.compilesTo("p id=\"yes\" class=\"no\"", "<p id=\"yes\" class=\"no\"></p>");
});

QUnit.module("attributes: full attributes w/ mustaches");

test("with mustache", function () {
  var emblem;
  integration_assertions.compilesTo("p class=\"foo {{yes}}\"", "<p class=\"foo {{yes}}\"></p>");
  integration_assertions.compilesTo("p class=\"foo {{yes}}\" Hello", "<p class=\"foo {{yes}}\">Hello</p>");
  emblem = "p class=\"foo {{yes}}\"\n  | Hello";
  return integration_assertions.compilesTo(emblem, "<p class=\"foo {{yes}}\">Hello</p>");
});

test("with mustache calling helper", function () {
  var emblem;

  integration_assertions.compilesTo("p class=\"foo {{{echo \"YES\"}}}\"", "<p class=\"foo {{{echo \\\"YES\\\"}}}\"></p>");

  integration_assertions.compilesTo("p class=\"foo #{echo \"NO\"} and {{{echo \"YES\"}}}\" Hello", "<p class=\"foo {{echo \\\"NO\\\"}} and {{{echo \\\"YES\\\"}}}\">Hello</p>");

  emblem = "p class=\"foo {{echo \"BORF\"}}\"\n  | Hello";
  integration_assertions.compilesTo(emblem, "<p class=\"foo {{echo \\\"BORF\\\"}}\">Hello</p>");
});

QUnit.module("attributes: boolean");

test("static", function () {
  integration_assertions.compilesTo("p borf=true", "<p borf></p>");
  integration_assertions.compilesTo("p borf=true Woot", "<p borf>Woot</p>");
  integration_assertions.compilesTo("p borf=false", "<p></p>");
  integration_assertions.compilesTo("p borf=false Nork", "<p>Nork</p>");
  integration_assertions.compilesTo("option selected=true Thingeroo", "<option selected>Thingeroo</option>");
});

QUnit.module("attributes: class name coalescing");

test("when literal class is used", function () {
  return integration_assertions.compilesTo("p.foo class=\"bar\"", "<p class=\"foo bar\"></p>");
});

test("when ember expression is used with variable", function () {
  integration_assertions.compilesTo("p.foo class=bar", "<p {{bind-attr class=\":foo bar\"}}></p>");
});

test("when ember expression is used with variable in braces", function () {
  integration_assertions.compilesTo("p.foo class={ bar }", "<p {{bind-attr class=\":foo bar\"}}></p>");
});

test("when ember expression is used with constant in braces", function () {
  integration_assertions.compilesTo("p.foo class={ :bar }", "<p class=\"foo bar\"></p>");
});

test("when ember expression is used with constant and variable in braces", function () {
  integration_assertions.compilesTo("p.foo class={ :bar bar }", "<p {{bind-attr class=\":foo :bar bar\"}}></p>");
});

QUnit.module("attributes: shorthand: mustache DOM attribute shorthand");

test("tagName w/o space", function () {
  var emblem = "App.FunView%span";
  integration_assertions.compilesTo(emblem, "{{view App.FunView tagName=\"span\"}}");
});

test("tagName w/ space", function () {
  var emblem = "App.FunView %span";
  integration_assertions.compilesTo(emblem, "{{view App.FunView tagName=\"span\"}}");
});

test("tagName block", function () {
  var emblem = "App.FunView%span\n  p Hello";
  integration_assertions.compilesTo(emblem, "{{#view App.FunView tagName=\"span\"}}<p>Hello</p>{{/view}}");
});

test("class w/ space (needs space)", function () {
  var emblem = "App.FunView .bork";
  integration_assertions.compilesTo(emblem, "{{view App.FunView class=\"bork\"}}");
});

test("multiple classes", function () {
  var emblem = "App.FunView .bork.snork";
  integration_assertions.compilesTo(emblem, "{{view App.FunView class=\"bork snork\"}}");
});

test("elementId", function () {
  var emblem = "App.FunView#ohno";
  integration_assertions.compilesTo(emblem, "{{view App.FunView elementId=\"ohno\"}}");
});

test("mixed w/ hash`", function () {
  var emblem = "App.FunView .bork.snork funbags=\"yeah\"";
  integration_assertions.compilesTo(emblem, "{{view App.FunView funbags=\"yeah\" class=\"bork snork\"}}");
});

test("mixture of all`", function () {
  var emblem = "App.FunView%alex#hell.bork.snork funbags=\"yeah\"";
  integration_assertions.compilesTo(emblem, "{{view App.FunView funbags=\"yeah\" tagName=\"alex\" elementId=\"hell\" class=\"bork snork\"}}");
});

QUnit.module("attributes: bound and unbound");

test("path with dot", function () {
  var emblem = "iframe src=post.pdfAttachment";
  integration_assertions.compilesTo(emblem, "<iframe {{bind-attr src=post.pdfAttachment}}></iframe>");

  emblem = "iframe src=post.pdfAttachmentUrl width=\"96%\" height=\"400\" view=\"FitV\" frameborder=\"0\" style=\"z-index: 0 !important;\"";
  integration_assertions.compilesTo(emblem, "<iframe {{bind-attr src=post.pdfAttachmentUrl}} width=\"96%\" height=\"400\" view=\"FitV\" frameborder=\"0\" style=\"z-index: 0 !important;\"></iframe>");
});

test("mustache in attribute", function () {
  var emblem = "img src=\"{{unbound post.showLogoUrl}}\" onerror=\"this.src='{{unbound orgSettings.onErrorBlankLogoImage}}'\"";
  integration_assertions.compilesTo(emblem, "<img src=\"{{unbound post.showLogoUrl}}\" onerror=\"this.src='{{unbound orgSettings.onErrorBlankLogoImage}}'\">");
});

test("mustache in attribute with exclamation point", function () {
  var emblem = "a href=postLink! target='_blank'";
  integration_assertions.compilesTo(emblem, "<a href=\"{{unbound postLink}}\" target=\"_blank\"></a>");
});

test("mustache attribute value has comma", function () {
  var emblem = "a name='my, cool, name'";
  integration_assertions.compilesTo(emblem, "<a name=\"my, cool, name\"></a>");
});

test("mustache class binding", function () {
  var emblem = "iframe.foo class=dog";
  integration_assertions.compilesTo(emblem, "<iframe {{bind-attr class=\":foo dog\"}}></iframe>");
});

test("numbers in shorthand", function () {
  integration_assertions.compilesTo("#4a", "<div id=\"4a\"></div>");
  integration_assertions.compilesTo(".4a", "<div class=\"4a\"></div>");
  integration_assertions.compilesTo(".4", "<div class=\"4\"></div>");
  integration_assertions.compilesTo("#4", "<div id=\"4\"></div>");
  integration_assertions.compilesTo("%4", "<4></4>");
  integration_assertions.compilesTo("%4 ermagerd", "<4>ermagerd</4>");
  integration_assertions.compilesTo("%4#4.4 ermagerd", "<4 id=\"4\" class=\"4\">ermagerd</4>");
});

test("negative numbers should work", function () {
  integration_assertions.compilesTo("foo positive=100 negative=-100", "{{foo positive=100 negative=-100}}");
});

test("booleans with and without quoting", function () {
  integration_assertions.compilesTo("foo what=false", "{{foo what=false}}");
  integration_assertions.compilesTo("foo what=\"false\"", "{{foo what=\"false\"}}");
  integration_assertions.compilesTo("foo what='false'", "{{foo what='false'}}");
});