/*
 * underscore pattern engine for patternlab-node - v0.15.1 - 2015
 *
 * Geoffrey Pursell, Brian Muenzenmeyer, and the web community.
 * Licensed under the MIT license.
 *
 * Many thanks to Brad Frost and Dave Olsen for inspiration, encouragement, and advice.
 *
 */

(function () {
  "use strict";

  var _ = require('underscore');

  // extend underscore with partial-ing methods
  // HANDLESCORE! UNDERBARS!
  _.mixin({
    renderPartial: function(partial, data) {
      var data = data || {};
      var compiled = _.template(partial);
      return compiled(data);
    },
    assignContext: function(viewModel, data) {
      return viewModel(data);
    }
  });

  var engine_underscore = {
    engine: _,
    engineName: 'underscore',
    engineFileExtension: '.underscore',

    // partial expansion is only necessary for Mustache templates that have
    // style modifiers or pattern parameters (I think)
    expandPartials: false,

    // regexes, stored here so they're only compiled once
    findPartialsRE: null, // TODO,
    findPartialsWithStyleModifiersRE: null, // TODO
    findPartialsWithPatternParametersRE: null, // TODO
    findListItemsRE: /({{#( )?)(list(I|i)tems.)(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)( )?}}/g,

    // render it
    renderPattern: function renderPattern(template, data, partials) {
      if (partials) {
        _.registerPartial(partials);
      }
      var compiled = _.template(template);
      return compiled(data);
    },

    // registerPartial: function (oPattern) {
    //   debugger;
    //   _.registerPartial(oPattern.key, oPattern.template);
    // },

    // find and return any {{> template-name }} within pattern
    findPartials: function findPartials(pattern) {
      var matches = pattern.template.match(this.findPartialsRE);
      return matches;
    },
    findPartialsWithStyleModifiers: function(pattern) {
      return [];
    },
    // returns any patterns that match {{> value(foo:"bar") }} or {{>
    // value:mod(foo:"bar") }} within the pattern
    findPartialsWithPatternParameters: function(pattern) {
      return [];
    },
    findListItems: function(pattern) {
      var matches = pattern.template.match(this.findListItemsRE);
      return matches;
    },
    // given a pattern, and a partial string, tease out the "pattern key" and
    // return it.
    findPartialKey: function(partialString) {
      var partialKey = partialString.replace(this.findPartialsRE, '$1');
      return partialKey;
    }
  };

  module.exports = engine_underscore;
})();
