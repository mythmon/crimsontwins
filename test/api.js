var assert = require('assert');
var mockery = require('mockery');
var supertest = require('supertest');

var testConfig = require('./mocks/config');

describe('api', function() {

  var web;

  before(function() {
    mockery.enable();
    mockery.warnOnUnregistered(false);
    mockery.registerMock('./config', testConfig);

    web = require('../app/web');
    web.init();
  });

  after(function() {
    mockery.deregisterAll();
    mockery.disable();
  });

  describe('ping', function() {
    it('should return pong', function() {
      supertest(web.app)
        .get('/api/ping')
        .expect('pong');
    });
  });

});