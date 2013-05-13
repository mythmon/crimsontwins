var assert = require('assert');
var supertest = require('supertest');

require('./setup');

var web = require('../app/web');
var manager = require('../app/manager');

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

});