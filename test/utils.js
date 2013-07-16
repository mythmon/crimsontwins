require('./setup');

var events = require('events');
var assert = require('assert');

var mockery = require('mockery');

var mockConfig = require('./mocks/config.js')
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

    it('should not error if callback is not a function', function() {
      utils.async(undefined);
    });
  });

  describe('eventRelay', function() {
    it('should relay events', function(done) {
      var source = new events.EventEmitter();
      var dest = new events.EventEmitter();

      utils.eventRelay(source, dest, 'foo');

      dest.once('foo', function() {
        done();
      });

      source.emit('foo');
    });
  });

  describe('proxify', function() {

    it('should set proxy variables', function() {
      var options = {
        host: 'example.com',
        port: 1234,
        path: '/lol.gif'
      };

      options = utils.proxify(options, false, 'http://proxy.example.com:1080');

      assert(options.proxied);

      assert.equal(options.host, 'proxy.example.com');
      assert.equal(options.port, 1080);
      assert.equal(options.path, 'http://example.com:1234/lol.gif');
    });

    it('should have a default ssl port', function() {
      var options = {
        host: 'example.com',
        port: 1234,
        path: '/lol.gif'
      };

      options = utils.proxify(options, true, 'http://ssl-proxy.example.com');
      assert(options.proxied);

      assert.equal(options.port, 443);
    });
  })

});

