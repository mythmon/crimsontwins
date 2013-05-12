require('./setup');

var assert = require('assert');
var supertest = require('supertest');

var web = require('../app/web');

describe('api', function() {

  before(function() {
    web.start();
  });

  describe('ping', function() {
    it('should return pong', function() {
      supertest(web.app)
        .get('/api/ping')
        .expect('pong');
    });
  });

});