require('./setup');

var _ = require('underscore');
var assert = require('assert');
var sinon = require('sinon');

var manager = require('../app/manager');
var mockConfig = require('./mocks/config');


describe('ScreenManager', function() {

  // Requires must come here, to allow mocks to take affect.
  var screenMan;

  beforeEach(function() {
    screenMan = new manager.ScreenManager();
  });

  describe('#all', function() {
    it('should list all screens in the config file', function() {
      var i;
      var screenNames = ['screen1', 'screen2'];
      var screens = screenMan.all();

      assert.equal(screenNames.length, screens.length);
      for (i = 0; i < screens.length; i++) {
        assert.equal(screenNames[i], screens[i].name);
        assert.notEqual(undefined, screens[i].id);
      }
    });
  });

  describe('#add', function() {
    it('should add screens', function() {
      var before = screenMan.all();
      screenMan.add('screen3');
      var after = screenMan.all();

      assert.equal(before.length + 1, after.length);
      assert.equal('screen3', after.slice(-1)[0].name);
    });

    it('should reject duplicate screen names', function() {
      screenMan.add('screen3');
      screenMan.add('screen4');
      var before = screenMan.all();
      var ret = screenMan.add('screen3');
      var after = screenMan.all();

      assert.equal(0, ret.indexOf('Error: '));

      assert.equal(before.length, after.length);
      assert.equal('screen4', after.slice(-1)[0].name);
    });

    it('should emit a event', function(done) {
      screenMan.once('screenAdded', function(screen) {
        assert.equal('screen3', screen.name);
        done();
      });
      screenMan.add('screen3');
    });
  });

  describe('#remove', function() {
    it('should remove a screen', function() {
      screenMan.remove('screen1');
      assert.equal(1, screenMan.screens.length);
      assert.equal('screen2', screenMan.screens[0].name);
    });

    it('should have no effect with unknown names', function() {
      screenMan.remove('unknown');
      assert.equal(2, screenMan.screens.length);
      assert.equal('screen1', screenMan.screens[0].name);
      assert.equal('screen2', screenMan.screens[1].name);
    });

    it('should emit an event', function(done) {
      screenMan.once('screenRemoved', function(screen) {
        assert.equal('screen2', screen.name);
        done();
      });
      screenMan.remove('screen2');
    });
  });

  describe('#find', function() {
    it('should find screens by name', function() {
      var screen = screenMan.find('screen1');
      assert.notEqual(null, screen);
      assert.equal('screen1', screen.name);
    });
    it('should return null for nonexistant screens', function() {
      assert.equal(null, screenMan.find('nonexistant'));
    });
  });

  describe('#next', function() {
    it('should return a screen', function() {
      var screen = screenMan.next();
      assert.notEqual(undefined, screen);
    });

    it('should cycle screens', function() {
      assert.equal('screen1', screenMan.next().name);
      assert.equal('screen2', screenMan.next().name);
      assert.equal('screen1', screenMan.next().name);
      assert.equal('screen2', screenMan.next().name);
      assert.equal('screen1', screenMan.next().name);
      assert.equal('screen2', screenMan.next().name);
    });
  });

  describe('#sendUrl', function() {
    it('updates a screen', function(done) {
      var url = 'http://example.com/cat.gif';
      screenMan.sendUrl(url).then(function() {
        assert.equal(url, screenMan.screens[0].content.url);
        done();
      });
    });

    it('should emits a event', function(done) {
      var url = 'http://example.com/cat.gif';
      screenMan.once('screenChanged', function(screen) {
        assert.equal(url, screen.content.url);
        done();
      });
      screenMan.sendUrl(url);
    });
  });

  describe('#cycleScreen', function() {
    beforeEach(function(done) {
      screenMan.contentManager.load().then(function() {
        done();
      });
    });

    it('should change the right screen', function() {
      var screen = screenMan.screens[0];
      var before = screen.content.url;
      screenMan.cycleScreen(screen.name);
      var after = screen.content.url;

      assert.notEqual(before, after);
    });
  });

  describe('#makeTimeout', function() {
    var clock;

    beforeEach(function(done) {
      screenMan.contentManager.load().then(function() {
        done();
      });
      clock = sinon.useFakeTimers('setTimeout', 'clearTimeout');
    });

    afterEach(function() {
      clock.restore();
    });

    it('should cause a screen to change at the right time', function() {
      var screen = screenMan.screens[0];
      var before = screen.content.url;
      screenMan.makeTimeout(screen.name, 100);
      assert.equal(before, screen.content.url);
      clock.tick(101);
      assert.notEqual(before, screen.content.url);
    });
  });
});


describe('ContentManager', function() {

  var cm;

  beforeEach(function(done) {
    cm = new manager.ContentManager();
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

    it('should reject sites that prevent framing', function(done) {
      var url = 'http://example.com/frame/deny';
      cm.contentForUrl(url).then(
        function success(content) {
          done(Error('Unexpected success'));
        },
        function fail(error) {
          done();
        }
      );
    });

  });

  describe('#setUrls', function() {
    it('should replace all content items', function(done) {
      var urls = ['http://ha/ha', 'http://he/he', 'http://ho/ho'];
      cm.setUrls(urls).then(function() {
        var result = _.map(cm.all(), function(c) { return c.url; }).sort();
        assert.deepEqual(urls, result);
        done();
      });
    });
  });

});

// This tests some of the things that happen in the before() of the
// above test cases, so it has to be a seperate describe() clause.
describe('ContentManager', function() {
  describe('#load', function() {
    it('emits and event after loading', function(done) {
      var cm = new manager.ContentManager();
      cm.once('loaded', function() {
        done();
      });
      cm.load();
    });
  });
});