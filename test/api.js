var assert = require('assert');
var promise = require('node-promise');
var supertest = require('supertest');

require('./setup');

var manager = require('../app/manager');
var mockConfig = require('./mocks/config');
var web = require('../app/web');

describe('api', function() {

  before(function() {
    web.start();
  });

  beforeEach(function() {
    web.screenManager.index = 0;
    web.contentManager.index = 0;
  });

  describe('ping', function(done) {
    it('should return pong', function(done) {
      supertest(web.app)
        .get('/api/ping')
        .expect(200, 'pong', done);
    });
  });

  describe('sendurl', function() {
    it('should change a screen', function(done) {
      var targetUrl = 'http://example.com/giraffe.gif';
      var url = '/api/sendurl?url=' + targetUrl;

      web.screenManager.once('screenChanged', function(screen) {
        assert.equal(screen.content.url, targetUrl);
        done();
      });

      supertest(web.app)
        .post(url)
        .expect(200, function(err) {
          if (err) {
            done(err);
          }
        });
    });

    it('should deal with 404', function(done) {
      var targetUrl = 'http://example.com/404';
      var url = '/api/sendurl?url=' + targetUrl;

      supertest(web.app)
        .post(url)
        .expect(404, done);
    });

    it('should throw an error if no url is given', function(done) {
      supertest(web.app)
        .post('/api/sendurl')
        .expect(400, done);
    });

    it('should target a particular screen', function(done) {
      var targetUrl = 'http://example.com/elephant.gif';
      var url = '/api/sendurl?screen=screen2&url=' + targetUrl;

      web.screenManager.once('screenChanged', function(screen) {
        assert.equal(screen.name, 'screen2');
        done();
      });

      supertest(web.app)
        .post(url)
        .expect(200, function(err) {
          if (err) {
            done(err);
          }
        });
    });
  });

  describe('reset', function() {
    it('reset all screens to a default url', function(done) {
      var i, screen, p, promises = [];

      for (i = 0; i < web.screenManager.screens.length; i++) {
        p = web.screenManager.sendUrl('http://example.com/oh_no.gif');
        promises.push(p);
      }

      promise.all(promises).then(function() {

        supertest(web.app)
          .post('/api/reset')
          .expect(204)
          .end(function(err, res) {
            if (err) {
              done(err);
            }
            var i, url, index;

            for (i = 0; i < web.screenManager.screens.length; i++) {
              url = web.screenManager.screens[i].content.url;
              index = mockConfig.resetUrls.indexOf(url);
              assert.notEqual(index, -1);
            }
            done();
          });
      });
    });
  });

});