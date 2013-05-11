var assert = require('assert');
var mockery = require('mockery');

var mockConfig = require('./mocks/config');
var mockHttp = require('./mocks/http');

describe('ContentManager', function() {

  var ContentManager, cm;

  before(function() {
    mockery.enable();
    mockery.warnOnUnregistered(false);

    mockery.registerMock('./config', mockConfig);
    mockery.registerMock('http', mockHttp);
    mockery.registerMock('https', mockHttp);

    ContentManager = require('../app/content-manager');
  });

  after(function() {
    mockery.deregisterAll();
    mockery.disable();
  });

  beforeEach(function(done) {
    cm = new ContentManager();
    cm.load().then(function() { done(); });
  });

  describe('all', function() {
    it('should return the mocked set of content urls', function() {
      var i;
      var expectedUrls = mockConfig.resetUrls;
      var actual = cm.all();

      assert.equal(actual.length, expectedUrls.length);
      for (i = 0; i < actual.length; i++) {
        assert.notEqual(-1, expectedUrls.indexOf(actual[i].url));
      }
    });
  });

  describe('load', function() {
    it('should make correct content objects', function() {
      var content = cm.content[0];
      assert.notEqual(undefined, content.url);
      assert.equal('image', content.type);
    });
  });

  describe('next', function() {
    it('should return a content object', function() {
      var content = cm.next();
      assert.notEqual(undefined, content);
      assert.notEqual(undefined, content.url);
      assert.equal('image', content.type);
    });

    it('should use all urls before looping', function() {
      var counts = {};
      var i;
      for (i = 0; i < mockConfig.resetUrls.length; i++) {
        counts[mockConfig.resetUrls[i]] = 0;
      }

      function drain() {
        var i;
        for (i = 0; i < mockConfig.resetUrls.length; i++) {
          counts[cm.next().url]++;
        }
      }

      function check(n) {
        var i;
        for (i = 0; i < mockConfig.resetUrls.length; i++) {
          assert.equal(n, counts[mockConfig.resetUrls[i]]);
        }
      }

      for (i = 0; i < 10; i++) {
        drain();
        check(i + 1);
      }
    });
  });

  describe('contentForUrl', function() {
    it('should return a content object', function(done) {
      var url = 'http://example.com/a.html';
      cm.contentForUrl(url).then(function(content) {
        assert.equal(content.url, url);
        assert.equal(content.type, 'url');
        done();
      });
    });

    it('should return an error on 404', function(done) {
      var url = 'http://example.com/404';
      cm.contentForUrl(url).then(
        function onSuccess(content) {
          done(Error('Unexpected success'));
        },
        function onErr(error) {
          assert.deepEqual({
            error: 404,
            message: 'There was a problem with the url (404)'
          }, error);
          done();
        });
    });

    it('should handle redirects', function(done) {
      var url = 'http://example.com/302';
      cm.contentForUrl(url).then(function(content) {
        assert.equal(content.url, 'http://example.com/redirect.html');
        assert.equal(content.type, 'url');
        done();
      });
    });
  });

});