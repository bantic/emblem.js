'use strict';

exports.compilesTo = compilesTo;

var Emblem = require('../../emblem');



function compilesTo(emblem, handlebars, message) {
  var output = Emblem['default'].compile(emblem);
  if (!message) {
    var maxLenth = 40;
    var messageEmblem = emblem.replace(/\n/g, "\\n");
    if (messageEmblem.length > maxLenth) {
      messageEmblem = messageEmblem.slice(0, maxLenth) + "...";
    }
    message = "Expected \"" + messageEmblem + "\" to compile to \"" + handlebars + "\"";
  }
  QUnit.push(output === handlebars, output, handlebars, message);
};