'use strict';

var Handlebars;

if (typeof window === "undefined") {
  Handlebars = require("handlebars");
} else {
  Handlebars = window.Handlebars;
}

exports['default'] = Handlebars;