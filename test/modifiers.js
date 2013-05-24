require('./setup');

var assert = require('assert');

var modifiers = require('../app/modifiers');


describe('modifiers', function() {
  describe('blacklistNoodle', function() {
    it('should disallow noodle', function(done) {
      // Sorry Edna, it is just too funny.
      var url = 'http://noodletalk.org';
      var p = modifiers.blacklistNoodle({url: url});
      p.then(function(content) {
        assert.equal(content.message, 'NOPE');
        assert.notEqual(content.url, url);
        done();
      });
    });
  });

  describe('unpackImgur', function() {
    it('should unpack normal imgur links', function(done) {
      var url = 'http://imgur.com/WDS2IMB';
      var p = modifiers.unpackImgur({url: url});
      p.then(function(content) {
        assert.equal(content.url, 'http://i.imgur.com/WDS2IMB.png');
        assert.equal(content.type, 'image');
        done();
      });
    });
  });

  describe('embedYoutube', function() {
    it('should generate embed urls from normal youtube urls', function(done) {
      var url = 'http://www.youtube.com/watch?v=oHg5SJYRHA0';
      var p = modifiers.embedYoutube({url: url});
      p.then(function(content) {
        assert.equal(content.url, 'http://www.youtube.com/embed/oHg5SJYRHA0?rel=0&autoplay=1');
        assert.equal(content.type, 'url');
        done();
      });
    });

    it('should generate embed urls from shortened youtube urls', function(done) {
      var url = 'http://youtu.be/oHg5SJYRHA0';
      var p = modifiers.embedYoutube({url: url});
      p.then(function(content) {
        assert.equal(content.url, 'http://www.youtube.com/embed/oHg5SJYRHA0?rel=0&autoplay=1');
        assert.equal(content.type, 'url');
        done();
      });
    });
  });

  describe('unpackXkcd', function() {
    it('should get XKCD image urls', function(done) {
      var url = 'http://xkcd.com/614/';
      var p = modifiers.unpackXkcd({url: url});
      p.then(function(content) {
        assert.equal(content.url, 'http://imgs.xkcd.com/comics/woodpecker.png');
        assert.equal(content.type, 'image');
        done();
      });
    });
  });
});