{
  var builder = options.builder;

  var SELF_CLOSING_TAG = {
    area: true,
    base: true,
    br: true,
    col: true,
    command: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    keygen: true,
    link: true,
    meta: true,
    param: true,
    source: true,
    track: true,
    wbr: true
  };

  var KNOWN_TAGS = {
    figcaption: true, blockquote: true, plaintext: true, textarea: true, progress: true,
    optgroup: true, noscript: true, noframes: true, frameset: true, fieldset: true,
    datalist: true, colgroup: true, basefont: true, summary: true, section: true,
    marquee: true, listing: true, isindex: true, details: true, command: true,
    caption: true, bgsound: true, article: true, address: true, acronym: true,
    strong: true, strike: true, spacer: true, source: true, select: true,
    script: true, output: true, option: true, object: true, legend: true,
    keygen: true, iframe: true, hgroup: true, header: true, footer: true,
    figure: true, center: true, canvas: true, button: true, applet: true, video: true,
    track: true, title: true, thead: true, tfoot: true, tbody: true, table: true,
    style: true, small: true, param: true, meter: true, label: true, input: true,
    frame: true, embed: true, blink: true, audio: true, aside: true, time: true,
    span: true, samp: true, ruby: true, nobr: true, meta: true, menu: true,
    mark: true, main: true, link: true, html: true, head: true, form: true,
    font: true, data: true, code: true, cite: true, body: true, base: true,
    area: true, abbr: true, xmp: true, wbr: true, 'var': true, sup: true,
    sub: true, pre: true, nav: true, map: true, kbd: true, ins: true,
    img: true, div: true, dir: true, dfn: true, del: true, col: true,
    big: true, bdo: true, bdi: true, ul: true, tt: true, tr: true, th: true, td: true,
    rt: true, rp: true, ol: true, li: true, hr: true, h6: true, h5: true, h4: true,
    h3: true, h2: true, h1: true, em: true, dt: true, dl: true, dd: true, br: true,
    u: true, s: true, q: true, p: true, i: true, b: true, a: true
  };

  var KNOWN_EVENTS = {
    "touchStart": true, "touchMove": true, "touchEnd": true, "touchCancel": true,
    "keyDown": true, "keyUp": true, "keyPress": true, "mouseDown": true, "mouseUp": true,
    "contextMenu": true, "click": true, "doubleClick": true, "mouseMove": true,
    "focusIn": true, "focusOut": true, "mouseEnter": true, "mouseLeave": true,
    "submit": true, "input": true, "change": true, "dragStart": true,
    "drag": true, "dragEnter": true, "dragLeave": true,
    "dragOver": true, "drop": true, "dragEnd": true
  };

  function textNodesResult(first, tail) {
    var ret = [];
    if(first) {
      ret.push(first);
    }
    for(var i = 0; i < tail.length; ++i) {
      var t = tail[i];
      ret.push(t[0]);
      if(t[1]) {
        ret.push(t[1]);
      }
    }
    return ret;
  }

  function parseSexpr(path, params, hash){
    var actualParams = [];
    var attrs = {};
    var hasAttrs = false;

    // Convert shorthand html attributes (e.g. % = tagName, . = class, etc)
    for (var i = 0; i < params.length; ++i) {
      var p = params[i];
      var attrKey = p[0];
      if (attrKey === 'tagName' || attrKey === 'elementId' || attrKey === 'class') {
        hasAttrs = true;
        attrs[attrKey] = attrs[attrKey] || [];
        attrs[attrKey].push(p[1]);
      } else {
        actualParams.push(p);
      }
    }

    if (hasAttrs) {
      hash = hash || new AST.HashNode([]);
      for(var k in attrs) {
        if(!attrs.hasOwnProperty(k)) continue;
        hash.pairs.push([k, new AST.StringNode(attrs[k].join(' '))]);
      }
    }

    actualParams.unshift(path);
    return new AST.SexprNode(actualParams, hash);
  }

  function parseInHtml(h, inTagMustaches, fullAttributes) {

    var tagName = h[0] || 'div',
        shorthandAttributes = h[1] || [],
        id = shorthandAttributes[0],
        classes = shorthandAttributes[1] || [],
        tagOpenContent = [],
        updateMustacheNode;

    updateMustacheNode = function (node) {
      var pairs, pair, stringNode, original;
      if (!classes.length) {
        return;
      }
      if (!node.id || node.id.string !== 'bind-attr') {
        return;
      }
      if (node.hash && node.hash.pairs && (pairs = node.hash.pairs)) {
        for (var i2 in pairs) {
          if (!pairs.hasOwnProperty(i2)) { continue; }
          pair = pairs[i2];
          if (pair && pair[0] === 'class' && pair[1] instanceof AST.StringNode) {
            stringNode = pair[1];
            original = stringNode.original;
            stringNode.original = stringNode.string = stringNode.stringModeValue = ':' + classes.join(' :') + ' ' + original;
            classes = [];
          }
        }
      }
    };

    var elementNode = builder.element(tagName);
    builder.enter(elementNode);
    // tagOpenContent.push(new AST.ContentNode('<' + tagName));

    if(id) {
      builder.attribute('id', id);
      // tagOpenContent.push(new AST.ContentNode(' id="' + id + '"'));
    }

    // Pad in tag mustaches with spaces.
    var i;
    for(i = 0; i < inTagMustaches.length; ++i) {
      // Check if given mustache node has class bindings and prepend shorthand classes
      updateMustacheNode(inTagMustaches[i]);
      tagOpenContent.push(new AST.ContentNode(' '));
      tagOpenContent.push(inTagMustaches[i]);
    }

    for(i = 0; i < fullAttributes.length; ++i) {
      var currentAttr = fullAttributes[i];
      if (Array.isArray(currentAttr)) {  // a "normalAttribute", [attrName, attrContent]
        builder.attribute(currentAttr[0], currentAttr[1]);
      } else {
        for (var i2 in fullAttributes[i]) {
          if (fullAttributes[i][i2] instanceof AST.MustacheNode) {
            updateMustacheNode(fullAttributes[i][i2]);
          }
        }
      }

      // FIXME this is not correct. This is for dealing with emblem that specifies
      // class name in two ways, i.e.: h1.my-class class="foo"
      if (classes.length) {
        var isClassAttr = fullAttributes[i][1] && fullAttributes[i][1].string === 'class="';

        // Check if attribute is class attribute and has content
        if (isClassAttr && fullAttributes[i].length === 4) {
          if (fullAttributes[i][2].type === 'mustache') {
            var mustacheNode, classesContent, hash, params;
            // If class was mustache binding, transform attribute into bind-attr MustacheNode
            mustacheNode = fullAttributes[i][2];
            classesContent = ':' + classes.join(' :') + ' ' + mustacheNode.id.original;
            hash = new AST.HashNode([
                ['class', new AST.StringNode(classesContent)]
            ]);

            params = [new AST.IdNode([{ part: 'bind-attr'}])].concat(mustacheNode.params);
            fullAttributes[i] = [fullAttributes[i][0], astDelegate.createMustacheNode(params, hash, true)];
          } else {
            // Else prepend shorthand classes to attribute
            classes.push(fullAttributes[i][2].string);
            fullAttributes[i][2].string = classes.join(' ');
          }
          classes = [];
        }
      }

      tagOpenContent = tagOpenContent.concat(fullAttributes[i]);
    }

    if(classes && classes.length) {
      builder.attribute('class', classes.join(' ') );
      //tagOpenContent.push(new AST.ContentNode(' class="' + classes.join(' ') + '"'));
    }
    var closingTagSlashPresent = !!h[2];
    if(SELF_CLOSING_TAG[tagName] || closingTagSlashPresent) {
      tagOpenContent.push(new AST.ContentNode(' />'));
      return [tagOpenContent];
    } else {

      // tagOpenContent.push(new AST.ContentNode('>'));

      // return [tagOpenContent, new AST.ContentNode('</' + tagName + '>')];
      return [tagOpenContent, ""];
    }
  }
}

start = invertibleContent

invertibleContent = c:content i:( DEDENT else _ TERM blankLine* indentation c:content {return c;})?
{
  /*
  var programNode = builder.createProgramNode(c);
  if(i) { programNode.inverse = astDelegate.createProgramNode(i); }
  return programNode;
  */
}

else
  = ('=' _)? 'else'

content = statements:statement*
{
  // Coalesce all adjacent ContentNodes into one.

  var compressedStatements = [];
  var buffer = [];

  /*
  for(var i = 0; i < statements.length; ++i) {
    var nodes = statements[i];

    for(var j = 0; j < nodes.length; ++j) {
      var node = nodes[j];
      if(node.type === "content") {
        if(node.string) {
          // Ignore empty strings (comments).
          buffer.push(node.string);
        }
        continue;
      }

      // Flush content if present.
      if(buffer.length) {
        compressedStatements.push(new AST.ContentNode(buffer.join('')));
        buffer = [];
      }
      compressedStatements.push(node);
    }
  }

  if(buffer.length) {
    compressedStatements.push(new AST.ContentNode(buffer.join('')));
  }
*/

  return compressedStatements;
}

// A statement is an array of nodes.
// Often they're single-element arrays, but for things
// like text lines, there might be multiple elements.
statement "BeginStatement"
  = blankLine
  / comment
  / contentStatement

contentStatement "ContentStatement"
  = legacyPartialInvocation
  / htmlElement
  / textLine
  / mustache

blankLine = _ TERM { return []; }

legacyPartialInvocation
  = '>' _ n:legacyPartialName params:inMustacheParam* _ TERM
{
  return [new AST.PartialNode(n, params[0], undefined, {})];
}

legacyPartialName
  = s:$[a-zA-Z0-9_$-/]+ {
    return new AST.PartialNameNode(new AST.StringNode(s));
  }

// Returns [MustacheNode] or [BlockNode]
mustache
  = m:(explicitMustache / lineStartingMustache)
{
  return [m];
}


commentContent
 = lineContent TERM ( indentation (commentContent)+ anyDedent)* { return []; }

comment
  = '/' commentContent { return []; }

inlineComment
  = '/' lineContent

lineStartingMustache
  = capitalizedLineStarterMustache / mustacheOrBlock

capitalizedLineStarterMustache
  = &[A-Z] ret:mustacheOrBlock
{
  return astDelegate.capitalizedLineStarterMustache(ret);
}

// (Possibly multi-line) text content beginning on the same
// line as the html tag. Examples (within *):
// p *Hello*
// p *This is a multi-line
//   text block*
// p *This has text and #{foo} mustaches*
htmlNestedTextNodes
  = ' ' ret:textNodes multilineContent:(indentation whitespaceableTextNodes+ DEDENT)?
{
  if(multilineContent) {
    multilineContent = multilineContent[1];
    for(var i = 0, len = multilineContent.length; i < len; ++i) {
      ret.push(' ');
      ret = ret.concat(multilineContent[i]);
    }
  }
  return ret;
}

indentedContent = blankLine* indentation c:content DEDENT { return c; }

// Only accessed from bracketed attributes
unindentedContent = blankLine* c:content DEDENT { return c; }

// The end of an HTML statement. Could be a bunch of
// text, a mustache, or a combination of html elements / mustaches
// that get nested within the HTML element, or could just be a line
// terminator.
htmlTerminator
  = colonContent
  / _ m:explicitMustache { return [m]; }
  / _ inlineComment? TERM c:indentedContent? { return c; }
  / _ inlineComment? ']' TERM  c:unindentedContent? { return c; } // bracketed
  / h:htmlNestedTextNodes { return h;}


// A whole HTML element, including the html tag itself
// and any nested content inside of it.
htmlElement = h:inHtmlTag nested:htmlTerminator
{
  // h is [[open tag content], closing tag ContentNode]
  var ret = h[0];
  if (nested && nested.length > 0) {
    for (var i=0, l= nested.length; i<l; i++) {
      if (nested[i].isMustache) {
        builder.mustache(nested[i].content);
      } else {
        builder.text(nested[i]);
      }
    }
    //ret = ret.concat(nested);
  }

  // Push the closing tag ContentNode if it exists (self-closing if not)
  builder.exit();
  //if(h[1]) { ret.push(h[1]); }

  return ret;
}

mustacheOrBlock = mustacheNode:inMustache _ inlineComment?nestedContentProgramNode:mustacheNestedContent
{
  if (!nestedContentProgramNode) {
    return mustacheNode;
  }

  var strip = {
    left: false,
    right: false
  };

  var block = new AST.BlockNode(mustacheNode, nestedContentProgramNode, nestedContentProgramNode.inverse, strip);

  block.path = mustacheNode.id;
  return block;
}

colonContent = ': ' _ c:contentStatement { return c; }

// Returns a ProgramNode
mustacheNestedContent
  = statements:(colonContent / textLine) { return astDelegate.createProgramNode(statements, []); }
  / _ ']' TERM statements:(colonContent / textLine) DEDENT { return astDelegate.createProgramNode(statements, []); }
  / TERM block:(blankLine* indentation invertibleContent DEDENT)? {return block && block[2]; }
  / _ ']' TERM block:invertibleContent DEDENT {
    return block;
  }


explicitMustache = e:equalSign ret:mustacheOrBlock
{
  var mustache = ret.mustache || ret;
  mustache.escaped = e;
  return ret;
}

inMustache
  = isPartial:'>'? !('[' TERM) _ mustacheContent:inMustacheContent+ inlineComment? {
  if(isPartial) {
    var n = new AST.PartialNameNode(new AST.StringNode(sexpr.id.string));
    return new AST.PartialNode(n, sexpr.params[0], undefined, {});
  }

  builder.mustache(mustacheContent.join('').trim());
}

inMustacheContent
 = $(mustacheTextNode+ stringWithQuotes?)

mustacheTextNode
  = $(alpha / [0-9] / '_' / '.' / '-' / ':' / '=' / whitespace)

sexpr
  = path:pathIdNode !' [' params:inMustacheParam* hash:hash?
  { return parseSexpr(path, params, hash); }
  / path:pathIdNode _ '[' _ TERM* INDENT* _ params:inMustacheBracketedParam* hash:bracketedHash?
  { return parseSexpr(path, params, hash); }

// %div converts to tagName="div", .foo.thing converts to class="foo thing", #id converst to id="id"
htmlMustacheAttribute
  = _ a:( t:tagNameShorthand  { return ['tagName', t]; }
        / i:idShorthand       { return ['elementId', i]; }
        / c:classShorthand    { return ['class', c]; })
{
  return a;
}

attributesAtLeastID
  = id:idShorthand classes:classShorthand* { return [id, classes]; }

attributesAtLeastClass
  = classes:classShorthand+ { return [null, classes]; }

inMustacheParam
  = a:(htmlMustacheAttribute / __ p:param { return p; } ) { return a; }

inMustacheBracketedParam
  = a:(htmlMustacheAttribute / p:param TERM* { return p; } ) { return a; }

hash
  = h:hashSegment+ { return new AST.HashNode(h); }

bracketedHash
  = INDENT* ' '* h:bracketedHashSegment+ { return new AST.HashNode(h); }

pathIdent "PathIdent"
  = '..'
  / '.'
  / s:$[a-zA-Z0-9_$\-!\?\^@]+ !'=' { return s; }
  / '[' segmentLiteral:$[^\]]* ']' { return segmentLiteral; }

key "Key"
  = $((nmchar / ':')*)

hashSegment
  = __ h:(key '=' param) { return [h[0], h[2]]; }

bracketedHashSegment
  = INDENT* _ h:(key '=' param) TERM* { return [h[0], h[2]];}

param
  = booleanNode
  / integerNode
  / pathIdNode
  / stringNode
  / sexprOpen s:sexpr sexprClose { s.isHelper = true; return s; }

path = first:pathIdent tail:(s:seperator p:pathIdent { return { part: p, separator: s }; })*
{
  var ret = [{ part: first }];
  for(var i = 0; i < tail.length; ++i) {
    ret.push(tail[i]);
  }
  return ret;
}

seperator "PathSeparator" = [\/.]

pathIdNode = v:path
{
  var last = v[v.length - 1];
  var idNode;

  // Support for data keywords that are prefixed with @ in the each
  // block helper such as @index, @key, @first, @last
  if (last.part.charAt(0) === '@') {
    last.part = last.part.slice(1);
    idNode = new AST.IdNode(v);
    var dataNode = new AST.DataNode(idNode);
    return dataNode;
  }

  var match;
  var suffixModifier;
  if(match = last.part.match(/[!\?\^]$/)) {
    suffixModifier = match[0];
    last.part = last.part.slice(0, -1);
  }

  idNode = new AST.IdNode(v);
  idNode._emblemSuffixModifier = suffixModifier;

  return idNode;
}

stringNode  = v:string  { return new AST.StringNode(v); }
integerNode = v:integer { return new AST.NumberNode(v); }
booleanNode = v:boolean { return new AST.BooleanNode(v); }

boolean "Boolean" = 'true' / 'false'

integer "Integer" = s:$('-'? [0-9]+) { return parseInt(s); }

string = p:('"' hashDoubleQuoteStringValue '"' / "'" hashSingleQuoteStringValue "'") { return p[1]; }
stringWithQuotes = p:('"' hashDoubleQuoteStringValue '"' / "'" hashSingleQuoteStringValue "'") {
  return p;
}

hashDoubleQuoteStringValue = $(!(TERM) [^"}])*
hashSingleQuoteStringValue = $(!(TERM) [^'}])*

alpha = [A-Za-z]

whitespaceableTextNodes
 = ind:indentation nodes:textNodes w:whitespaceableTextNodes* anyDedent
{
  nodes.unshift(ind);

  for(var i = 0; i < w.length; ++i) {
    nodes.push(ind);
    nodes = nodes.concat(w[i]);
    nodes.push("\n");
  }
  return nodes;
}
 / textNodes

textLineStart
 = s:[|`'] ' '?  { return s; }
 / &'<' { return '<'; }

textLine = s:textLineStart nodes:textNodes indentedNodes:(indentation whitespaceableTextNodes* DEDENT)?
{
  var i;

  if (nodes.length || !indentedNodes) {
    nodes.push("\n");
  }

  if (indentedNodes) {
    indentedNodes = indentedNodes[1];
    for (i = 0; i < indentedNodes.length; ++i) {
      nodes = nodes.concat(indentedNodes[i]); // object node
      nodes.push("\n");
    }
  }

  var ret = [];
  var strip = s !== '`';
  for (i = 0; i < nodes.length; ++i) {
    var node = nodes[i];
    if (node === "\n") {
      if (!strip) {
        ret.push( "\n" );
      }
    } else {
      ret.push(node); // object node
    }
  }

  if (s === "'") {
    ret.push(" ");
  }

  builder.text( ret.join('\n') );

  return ret;
}

textNodes = first:preMustacheText? tail:(rawMustache preMustacheText?)* TERM
{
  return textNodesResult(first, tail);
}

attributeTextNodes
  = '"' a:attributeTextNodesInner '"' { return a; }
  / "'" a:attributeTextNodesInnerSingle "'" { return a; }

attributeTextNodesInner = first:preAttrMustacheText? tail:(rawMustache preAttrMustacheText?)* { return textNodesResult(first, tail); }
attributeTextNodesInnerSingle = first:preAttrMustacheTextSingle? tail:(rawMustache preAttrMustacheTextSingle?)* { return textNodesResult(first, tail); }

rawMustache = rawMustacheUnescaped / rawMustacheEscaped

recursivelyParsedMustacheContent
  = !'{' text:$[^}]*
{
  return {
    isMustache: true,
    content: text
  };
}

rawMustacheEscaped
 = doubleOpen _ m:recursivelyParsedMustacheContent _ doubleClose { m.escaped = true; return m; }
 / hashStacheOpen _ m:recursivelyParsedMustacheContent _ hashStacheClose { m.escaped = true; return m; }

rawMustacheUnescaped
 = tripleOpen _ m:recursivelyParsedMustacheContent _ tripleClose { m.escaped = false; return m; }

preAttrMustacheText = a:$preAttrMustacheUnit+ {
  return a;
}
preAttrMustacheTextSingle = a:$preAttrMustacheUnitSingle+ { return new AST.ContentNode(a); }

preAttrMustacheUnit       = !(nonMustacheUnit / '"') c:. { return c; }
preAttrMustacheUnitSingle = !(nonMustacheUnit / "'") c:. { return c; }

preMustacheText
  = a:$preMustacheUnit+ { return a; }
preMustacheUnit
  = !nonMustacheUnit c:. { return c; }

nonMustacheUnit
  = tripleOpen / doubleOpen / hashStacheOpen / anyDedent / TERM

// Support for div#id.whatever{ bindAttr whatever="asd" }
rawMustacheSingle
 = singleOpen _ m:recursivelyParsedMustacheContent _ singleClose { m.escaped = true; return m; }
inTagMustache
  = rawMustacheSingle / rawMustacheUnescaped / rawMustacheEscaped

singleOpen "SingleMustacheOpen" = '{'
doubleOpen "DoubleMustacheOpen" = '{{'
tripleOpen "TripleMustacheOpen" = '{{{'
singleClose "SingleMustacheClose" = '}'
doubleClose "DoubleMustacheClose" = '}}'
tripleClose "TripleMustacheClose" = '}}}'

sexprOpen "SubexpressionOpen" = '('
sexprClose "SubexpressionClose" = ')'

hashStacheOpen  "InterpolationOpen"  = '#{'
hashStacheClose "InterpolationClose" = '}'

// Returns whether the mustache should be escaped.
equalSign = "==" ' '? { return false; } / "=" ' '? { return true; }


// Start of a chunk of HTML. Must have either tagName or shorthand
// class/id attributes or both. Examples:
// p#some-id
// #some-id
// .a-class
// span.combo#of.stuff
// NOTE: this returns a 2 element array of [h,s].
// The return is used to reject a when both h an s are falsy.
htmlStart = h:htmlTagName? s:shorthandAttributes? '/'? &{ return h || s; }

// Everything that goes in the angle brackets of an html tag. Examples:
// p#some-id class="asdasd"
// #some-id data-foo="sdsdf"
// p{ action "click" target="view" }
inHtmlTag
= h:htmlStart ' [' TERM* inTagMustaches:inTagMustache* fullAttributes:bracketedAttribute+
{
  return parseInHtml(h, inTagMustaches, fullAttributes);
}
/ h:htmlStart inTagMustaches:inTagMustache* fullAttributes:fullAttribute*
{
  return parseInHtml(h, inTagMustaches, fullAttributes);
}


shorthandAttributes
  = shorthands:(s:idShorthand    { return { shorthand: s, id: true}; } /
                s:classShorthand { return { shorthand: s }; } )+
{
  var id, classes = [];
  for(var i = 0, len = shorthands.length; i < len; ++i) {
    var shorthand = shorthands[i];
    if(shorthand.id) {
      id = shorthand.shorthand;
    } else {
      classes.push(shorthand.shorthand);
    }
  }

  return [id, classes];
}

fullAttribute
  = ' '+ a:(actionAttribute / booleanAttribute / boundAttribute / rawMustacheAttribute / normalAttribute)
{
  return a || [];
  /*
  if (a.length) {
    return a;
    return [new AST.ContentNode(' ')].concat(a);
  } else {
    return [];
  }
  */
}

bracketedAttribute
= INDENT* ' '* a:(actionAttribute / booleanAttribute / boundAttribute / rawMustacheAttribute / normalAttribute) TERM*
{
  if (a.length) {
    return [new AST.ContentNode(' ')].concat(a);
  } else {
    return [];
  }
}

boundAttributeValueChar = [A-Za-z\.0-9_\-] / nonSeparatorColon

// Value of an action can be an unwrapped string, or a single or double quoted string
actionValue
  = quotedActionValue
  / id:pathIdNode { return astDelegate.createMustacheNode([id], null, true); }

quotedActionValue = p:('"' inMustache '"' / "'" inMustache "'") { return p[1]; }

actionAttribute
  = event:knownEvent '=' mustacheNode:actionValue
{
  // Replace the IdNode with a StringNode to prevent unquoted action deprecation warnings
  mustacheNode.id = new AST.StringNode(mustacheNode.id.string);

  // Unshift the action helper and augment the hash
  return [astDelegate.unshiftParam(mustacheNode, 'action', [['on', new AST.StringNode(event)]])];
}

booleanAttribute
  = key:key '=' boolValue:('true'/'false')
{
  if (boolValue === 'true') {
    return [ new AST.ContentNode(key) ];
  } else {
    return [];
  }
}

boundAttributeValue
  = '{' _ value:$(boundAttributeValueChar / ' ')+ _ '}' { return value.replace(/ *$/, ''); }
  / $boundAttributeValueChar+

// With Ember-Handlebars variant,
// p class=something -> <p {{bindAttr class="something"}}></p>
boundAttribute
  = key:key '=' value:boundAttributeValue !'!' &{ return astDelegate.allowBoundAttributes; }
{
  var hashNode = new AST.HashNode([[key, new AST.StringNode(value)]]);
  var params = [new AST.IdNode([{part: 'bind-attr'}])];
  var mustacheNode = astDelegate.createMustacheNode(params, hashNode);

  return [mustacheNode];
}

// With vanilla Handlebars variant,
// p class=something -> <p class="{{something}}"></p>
rawMustacheAttribute
  = key:key '=' id:pathIdNode
{
  return astDelegate.rawMustacheAttribute(key, id);
}

normalAttribute
  = key:key '=' nodes:attributeTextNodes
{
  var result = [key, nodes.join('')];
  return result;
  //return result.concat([new AST.ContentNode('"')]);
}

attributeName = $attributeChar*
attributeChar = alpha / [0-9] /'_' / '-'

tagNameShorthand = '%' c:cssIdentifier { return c; }
idShorthand = '#' c:cssIdentifier { return c;}
classShorthand = '.' c:cssIdentifier { return c; }

cssIdentifier "CSSIdentifier" = ident

ident = $nmchar+

nmchar = [_a-zA-Z0-9-] / nonascii
nmstart = [_a-zA-Z] / nonascii
nonascii = [\x80-\xFF]

tagString
  = c:$tagChar+

htmlTagName "KnownHTMLTagName"
  = '%' _ s:tagString { return s; }
  / knownTagName

knownTagName = t:tagString &{ return !!KNOWN_TAGS[t]; }  { return t; }

tagChar = [_a-zA-Z0-9-] / nonSeparatorColon

nonSeparatorColon = c:':' !' ' { return c; }

knownEvent "a JS event" = t:tagString &{ return !!KNOWN_EVENTS[t]; }  { return t; }

indentation
  = INDENT s:__ { return s; }

INDENT "INDENT" = "\uEFEF" { return ''; }
DEDENT "DEDENT" = "\uEFFE" { return ''; }
UNMATCHED_DEDENT "Unmatched DEDENT" = "\uEFEE" { return ''; }
TERM  "LineEnd" = "\r"? "\uEFFF" "\n" { return false; }

anyDedent "ANYDEDENT" = (DEDENT / UNMATCHED_DEDENT)

__ "RequiredWhitespace"
  = $whitespace+

_ "OptionalWhitespace"
  = whitespace*

whitespace "InlineWhitespace"
  = [ \t]

lineChar = !(INDENT / DEDENT / TERM) c:. { return c; }
lineContent = $lineChar*

