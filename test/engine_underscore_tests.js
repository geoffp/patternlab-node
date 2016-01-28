(function () {
  "use strict";

  var path = require('path');
  var pa = require('../builder/pattern_assembler');
  var object_factory = require('../builder/object_factory');
  var testPatternsPath = path.resolve(__dirname, 'files', '_underscore-test-patterns');

  try {
    require('underscore');
  } catch (err) {
    console.log('underscore renderer not installed; skipping tests');
    return;
  }

  // fake pattern lab constructor:
  // sets up a fake patternlab object, which is needed by the pattern processing
  // apparatus.
  function fakePatternLab() {
    var fpl = {
      partials: {},
      patterns: [],
      footer: '',
      header: '',
      listitems: {},
      listItemArray: [],
      data: {
        link: {}
      },
      config: require('../config.json'),
      package: {}
    };

    // patch the pattern source so the pattern assembler can correctly determine
    // the "subdir"
    fpl.config.paths.source.patterns = testPatternsPath;

    return fpl;
  }


  // function for testing sets of partials
  function testFindPartials(test, partialTests) {
    test.expect(partialTests.length + 1);

    // setup current pattern from what we would have during execution
    // docs on partial syntax are here:
    // http://patternlab.io/docs/pattern-including.html
    var currentPattern = object_factory.oPattern.create(
      '/home/fakeuser/pl/source/_patterns/01-molecules/00-testing/00-test-mol.underscore', // abspath
      '01-molecules\\00-testing', // subdir
      '00-test-mol.underscore', // filename,
      null, // data
      {
        template: partialTests.join()
      }
    );

    // act
    var results = currentPattern.findPartials();

    // assert
    test.equals(results.length, partialTests.length);
    partialTests.forEach(function(testString, index) {
      test.equals(results[index], testString);
    });

    test.done();
  }

  exports['engine_underscore'] = {
    'hello world underscore pattern renders': function (test) {
      test.expect(1);

      var patternPath = path.resolve(
        testPatternsPath,
        '00-atoms',
        '00-global',
        '00-helloworld.underscore'
      );

      // do all the normal processing of the pattern
      var patternlab = new fakePatternLab();
      var assembler = new pa();
      var helloWorldPattern = assembler.process_pattern_iterative(patternPath, patternlab);
      assembler.process_pattern_recursive(patternPath, patternlab);

      test.equals(helloWorldPattern.render(), 'Hello world!\n');
      test.done();
    },
    'hello worlds underscore pattern can see the atoms-helloworld partial and renders it twice': function (test) {
      test.expect(1);

      // pattern paths
      var pattern1Path = path.resolve(
        testPatternsPath,
        '00-atoms',
        '00-global',
        '00-helloworld.underscore'
      );
      var pattern2Path = path.resolve(
        testPatternsPath,
        '00-molecules',
        '00-global',
        '00-helloworlds.underscore'
      );

      // set up environment
      var patternlab = new fakePatternLab(); // environment
      var assembler = new pa();

      // do all the normal processing of the pattern
      assembler.process_pattern_iterative(pattern1Path, patternlab);
      var helloWorldsPattern = assembler.process_pattern_iterative(pattern2Path, patternlab);
      assembler.process_pattern_recursive(pattern1Path, patternlab);
      assembler.process_pattern_recursive(pattern2Path, patternlab);

      // test
      test.equals(helloWorldsPattern.render(), 'Hello world!\n and Hello world!\n\n');
      test.done();
    },
    'underscore partials can render JSON values': function (test) {
      test.expect(1);

      // pattern paths
      var pattern1Path = path.resolve(
        testPatternsPath,
        '00-atoms',
        '00-global',
        '00-helloworld-withdata.underscore'
      );

      // set up environment
      var patternlab = new fakePatternLab(); // environment
      var assembler = new pa();

      // do all the normal processing of the pattern
      var helloWorldWithData = assembler.process_pattern_iterative(pattern1Path, patternlab);
      assembler.process_pattern_recursive(pattern1Path, patternlab);

      // test
      test.equals(helloWorldWithData.render(), 'Hello world!\nYeah, we got the subtitle from the JSON.\n');
      test.done();
    },
    'underscore partials use the JSON environment from the calling pattern and can accept passed parameters': function (test) {
      test.expect(1);

      debugger;

      // pattern paths
      var atomPath = path.resolve(
        testPatternsPath,
        '00-atoms',
        '00-global',
        '00-helloworld-withdata.underscore'
      );
      var molPath = path.resolve(
        testPatternsPath,
        '00-molecules',
        '00-global',
        '00-call-atom-with-molecule-data.underscore'
      );

      // set up environment
      var patternlab = new fakePatternLab(); // environment
      var assembler = new pa();

      // do all the normal processing of the pattern
      var atom = assembler.process_pattern_iterative(atomPath, patternlab);
      var mol = assembler.process_pattern_iterative(molPath, patternlab);
      assembler.process_pattern_recursive(atomPath, patternlab);
      assembler.process_pattern_recursive(molPath, patternlab);

      // test
      test.equals(mol.render(), '<h2>Call with default JSON environment:</h2>\nThis is Hello world!\nfrom the default JSON.\n\n\n<h2>Call with passed parameter:</h2>\nHowever, this is Hello world!\nfrom a totally different blob.\n\n');
      test.done();
    },
    'find_pattern_partials finds partials': function(test){
      testFindPartials(test, [
        "<%= _.renderPartial(deliveryTpl['delivery/delivery-auth-contact-info'], obj) %>",
        "<%= _.renderPartial(obj.templates['delivery/delivery-freemobile-giftcard'],giftItem)%>"
      ]);
    },
    'find_pattern_partials finds verbose partials': function(test){
      testFindPartials(test, [
        '{{> 01-molecules/06-components/03-comment-header.underscore }}',
        "{{> 01-molecules/06-components/02-single-comment.underscore(description: 'A life is like a garden. Perfect moments can be had, but not preserved, except in memory.') }}",
        '{{> molecules-single-comment:foo }}',
        "{{>atoms-error(message: 'That\'s no moon...')}}",
        "{{> atoms-error(message: 'That\'s no moon...') }}",
        '{{> 00-atoms/00-global/06-test }}'
      ]);
    }
  };
})();
