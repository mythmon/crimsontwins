require('./setup');

var _ = require('lodash');
var assert = require('assert');
var promise = require('node-promise');
var sinon = require('sinon');

var manager = require('../app/manager');
var mockConfig = require('./mocks/config');


describe('ScreenManager', function() {

  var screenMan;

  beforeEach(function() {
    screenMan = new manager.ScreenManager();
  });

  afterEach(function() {
    mockConfig.reset();
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

    it('can remove screens with globs', function() {
      screenMan.add('junk1');
      screenMan.add('junk2');
      screenMan.remove('*1');
      assert.deepEqual(_.pluck(screenMan.screens, 'name'), ['screen2', 'junk2']);
    });
  });

  describe('#find', function() {
    it('should find screens by name', function() {
      var screens = screenMan.find('screen1');
      assert.equal(screens.length, 1);
      assert.equal(screens[0].name, 'screen1');
    });

    it('should return an empty array for nonexistant screens', function() {
      assert.deepEqual(screenMan.find('nonexistant'), []);
    });

    it('should find sceens by glob', function() {
      screenMan.add('tv1');
      screenMan.add('tv2');

      assert.deepEqual(_.pluck(screenMan.find('tv*'), 'name'), ['tv1', 'tv2']);
      assert.deepEqual(_.pluck(screenMan.find('*1'), 'name'), ['screen1', 'tv1']);
      assert.equal(screenMan.find('*').length, 4);
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
    afterEach(function() {
      screenMan.removeAllListeners();
    });

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

    it('should deal with screenNames', function(done) {
      var url = 'http://example.com/cat.gif';
      screenMan.once('screenChanged', function(screen) {
        assert.equal('screen2', screen.name);
        done();
      });
      screenMan.sendUrl(url, 'screen2');
    });

    it('should glob screens', function(done) {
      var url = 'http://example.com/lol.png';
      expected = ['screen1', 'screen2', 'screen3'];
      screenMan.add('screen3');
      screenMan.add('foobar');

      screenMan.on('screenChanged', function(screen) {
        assert.notEqual(expected.indexOf(screen.name), -1)
        assert.equal(screen.content.url, url);
        expected = _.without(expected, screen.name);
        if (expected.length === 0) {
          done();
        }
      });

      screenMan.sendUrl(url, 'screen*');
    });
  });

  describe('#cycleScreen', function() {
    beforeEach(function(done) {
      // done can't take any arguments, and the load promise will pass
      // one, which is why there is a function wrapper here.
      screenMan.contentManager.load().then(function() { done(); });
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
      // done can't take any arguments, and the load promise will pass
      // one, which is why there is a function wrapper here.
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

    it('should cancel previous timeouts', function() {
      var screen = screenMan.screens[0];
      var before = screen.content.url;
      screenMan.makeTimeout(screen.name, 100);
      clock.tick(60);
      screenMan.makeTimeout(screen.name, 100);
      clock.tick(60);
      assert.equal(screen.content.url, before);
      clock.tick(60);
      assert.notEqual(screen.content.url, before);
    });

    it('should not timeout when passed a negative time', function() {
      var screen = screenMan.screens[0];
      var before = screen.content.url;
      screenMan.makeTimeout(screen.name, -1);
      clock.tick(mockConfig.resetTime);
      assert.equal(screen.content.url, before);
      clock.tick(mockConfig.resetTime + 1); // induction step
      assert.equal(screen.content.url, before);
    })
  });

  describe('#reset', function() {
    beforeEach(function(done) {
      screenMan.contentManager.load().then(function() {
        done();
      });
    });

    it('should set all screens to default urls', function(done) {
      var p = screenMan.sendUrl('http://example.com/omg.gif', '*');

      p.then(function() {
        var index, url;
        screenMan.reset();

        for (var i = 0; i < screenMan.screens.length; i++) {
          url = screenMan.screens[i].content.url;
          index = mockConfig.resetUrls.indexOf(url);
          assert.notEqual(index, -1);
        }

        done();
      });
    });

    it('should target a screen', function(done) {
      var p, promises = [];
      var okUrl = 'http://example.com/ok.gif';
      var badUrl = 'http://example.com/omg.gif';
      promises.push(screenMan.sendUrl(okUrl, 'screen1'));
      promises.push(screenMan.sendUrl(badUrl, 'screen2'));

      promise.all(promises).then(function() {
        screenMan.reset('screen2');
        assert.equal(screenMan.screens[0].content.url, okUrl);
        assert.notEqual(screenMan.screens[1].content.url, badUrl);
        done();
      });
    });

    it('should target globs', function(done) {
      var i, p;
      var url = 'http://example.com/tv.gif';

      screenMan.add('tv1');
      screenMan.add('tv2');

      p = screenMan.sendUrl(url, '*');

      p.then(function() {
        screenMan.reset('screen*');

        _.each(screenMan.find('tv*'), function(screen) {
          assert.equal(screen.content.url, url);
        });
        _.each(screenMan.find('screen*'), function(screen) {
          assert.notEqual(screen.content.url, url);
        });

        done();
      });
    });

    it('should accept timeouts', function(done) {
      var url = 'http://example.com/dealwithit.gif';

      screenMan.sendUrl(url, 'screen1', 50).then(function() {
        assert.equal(screenMan.screens[0].content.url, url);

        // This is horrible, I know. But async mocha tests and Sinon's fake
        // timers don't work together.
        setTimeout(function() {
          assert.notEqual(screenMan.screens[0].content.url, url);
          done();
        }, 100);
      });
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

    it('should use modifiers', function(done) {
      var url = 'http://imgur.com/DYO6X';
      cm.contentForUrl(url).then(function(content) {
        assert.equal(content.url, 'http://i.imgur.com/DYO6X.png');
        done();
      });
    });

    it('should accept alternate ports', function(done) {
      var url = 'http://example.com:8080/';
      cm.contentForUrl(url).then(function(content) {
        assert.equal('http://example.com/8080/', content.url);
        done();
      });
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
