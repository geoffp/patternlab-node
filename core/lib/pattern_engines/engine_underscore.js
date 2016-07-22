/*
 * underscore pattern engine for patternlab-node - v0.15.1 - 2015
 *
 * Geoffrey Pursell, Brian Muenzenmeyer, and the web community.
 * Licensed under the MIT license.
 *
 * Many thanks to Brad Frost and Dave Olsen for inspiration, encouragement, and advice.
 *
 */


/*
 * ENGINE SUPPORT LEVEL:
 *
 * Basic. We can't call partials from inside underscore templates yet, but we
 * can render templates with backing JSON.
 *
 */

(function () {
  "use strict";

  var _ = require('underscore');
  var partialRegistry = {};

  // extend underscore with partial-ing methods
  // HANDLESCORE! UNDERBARS!
  function addParentContext(data, currentContext) {
    return Object.assign({}, currentContext, data);
  }

  _.mixin({
    renderAtomicPartial: function (partialKey, data, currentContext) {
      return _.renderPartial(partialRegistry[partialKey], data, currentContext);
    },
    renderPartial: function (partial, dataIn, currentContext) {
      var data = dataIn || {};
      var compiled;
      if (dataIn && currentContext &&
          dataIn instanceof Object && currentContext instanceof Object) {
        data = addParentContext(data, currentContext);
      }

      compiled = _.template(partial);

      return compiled(data);
    },
    assignContext: function (viewModel, data) {
      return viewModel(data);
    },

    /* eslint-disable no-eval, no-unused-vars */
    getPath: function (pathString, currentContext, debug) {
      try {
        var result = eval('currentContext.' + pathString);
        if (debug) {
          console.log("getPath result = ", result);
        }
        return result;
      } catch (e) {
        return null;
      }
    }
  });

  var engine_underscore = {
    engine: _,
    engineName: 'underscore',
    engineFileExtension: '.html',

    // partial expansion is only necessary for Mustache templates that have
    // style modifiers or pattern parameters (I think)
    expandPartials: false,

    // regexes, stored here so they're only compiled once
    findPartialsRE: /<%=[ \t]*_\.renderPartial[ \t]*\((?:"([^"].*?)"|'([^'].*?)')/g, // TODO,
    findPartialsWithStyleModifiersRE: /<%= _.renderPartial\((.*?)\).*?%>/g, // TODO
    findPartialsWithPatternParametersRE: /<%= _.renderPartial\((.*?)\).*?%>/g, // TODO
    findListItemsRE: /({{#( )?)(list(I|i)tems.)(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)( )?}}/g,

    // render it
    renderPattern: function renderPattern(template, data, partials) {
      var renderedHTML;
      var compiled;

      try {
        compiled = _.template(template);
      } catch (e) {
        console.log('Error compiling template <name unknown until patlab 2.0>:', template);
      }

      // This try-catch is necessary because references to undefined variables
      // in underscore templates are eval()ed directly as javascript, and as
      // such will throw very real exceptions that will shatter the whole build
      // process if we don't handle them.
      try {
        renderedHTML = compiled(_.extend(data || {}, {
          _allData: data,
          _partials: partials
        }));
      } catch (e) {
        var errorMessage = "Error in underscore template <name unknown until patlab 2.0>:" + e.toString();
        console.log(errorMessage);
        renderedHTML = "<h1>Error in underscore template <name unknown until patlab 2.0></h1><p>" + e.toString() + "</p>";
        console.log(template);
        process.exit(0);
      }

      return renderedHTML;
    },

    registerPartial: function (oPattern) {
      partialRegistry[oPattern.key] = oPattern.template;
    },

    // find and return any {{> template-name }} within pattern
    findPartials: function findPartials(pattern) {
      var matches = pattern.template.match(this.findPartialsRE);
      return matches;
    },
    findPartialsWithStyleModifiers: function () {
      return [];
    },

    // returns any patterns that match {{> value(foo:"bar") }} or {{>
    // value:mod(foo:"bar") }} within the pattern
    findPartialsWithPatternParameters: function () {
      return [];
    },
    findListItems: function (pattern) {
      var matches = pattern.template.match(this.findListItemsRE);
      return matches;
    },

    // given a pattern, and a partial string, tease out the "pattern key" and
    // return it.
    findPartialKey: function (partialString) {
      var partialKey = partialString.replace(this.findPartialsRE, '$1$2');
      return partialKey;
    }
  };

  module.exports = engine_underscore;
})();
