var assert = require('assert');
var mockery = require('mockery');

var testConfig = require('./testConfig');

describe('ContentManager', function() {

  var manager;
  var contentMan;

  before(function() {
    mockery.enable();
    mockery.warnOnUnregistered(false);
    mockery.registerMock('./config', testConfig);

    manager = require('../app/manager');
  });

  after(function() {
    mockery.deregisterAll();
    mockery.disable();
  });

  beforeEach(function(done) {
    contentMan = new manager.ContentManager();
    contentMan.load().then(function() { done(); });
  });

  describe('all', function() {
    it.skip('should return the mocked set of content urls', function() {
      var i;
      var expectedUrls = [
        'http://example.com/one.gif',
        'http://example.com/two.gif'
      ];
      var actual = contentMan.all();

      assert.equal(actual.length, expectedUrls.length);
      for (i = 0; i < actual.length; i++) {
        assert.equal(actual[i].url, expectedUrls[i]);
      }
    });
  });

});