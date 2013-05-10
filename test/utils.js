var assert = require('assert');
var utils = require('../app/utils.js');


describe('String', function() {

  describe('format', function() {
    it('should format strings in index style', function() {
      assert.equal('Hello, World', '{0}, {1}'.format('Hello', 'World'));
    });

    it('should format strings in object style', function() {
      assert.equal('Hello, Mike', 'Hello, {name}'.format({name: 'Mike'}));
    });
  });

});


describe('utils', function() {

  describe('dottedGet', function() {
    it('should get objects one deep', function() {
      var fruit = {apple: 'red', banana: 'yellow'};
      assert.equal('red', utils.dottedGet(fruit, 'apple'));
    });

    it('should get objects two deep', function() {
      var fruit = {
        apple: {color: 'red', shape: 'round'},
        banana: {color: 'yellow', shape: 'oblong'}
      };
      assert.equal('round', utils.dottedGet(fruit, 'apple.shape'));
    });
  });

});

