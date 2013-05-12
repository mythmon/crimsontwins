require('./setup');

var events = require('events');

var assert = require('assert');
var utils = require('../app/utils.js');


describe('utils', function() {

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


  describe('async', function() {
    it('should call a function, but not right away', function(done) {
      var a = 0;
      function after() {
        assert.equal(1, a);
        done();
      }
      utils.async(function() {
        a = 1;
        after();
      });
      assert.equal(0, a);
    });
  });

  describe('eventRelay', function() {
    it('should relay events', function(done) {
      var source = new events.EventEmitter();
      var dest = new events.EventEmitter();

      utils.eventRelay(source, dest, 'foo');

      dest.on('foo', function() {
        done();
      });

      source.emit('foo');
    });
  });

});

