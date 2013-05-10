var assert = require('assert');
var _ = require('underscore');
var originalConfig = require('../app/config');


// Test Configuration
var testConfig = {
    irc: {
        server: 'irc.example.com',
        nick: 'crimsontwins-test',
        channels: ['#channel1', '#channel2']
    },
    web: {
        port: 8080
    },
    resetTime: 60000,
    resetUrls: [
        'http://example.com/one.gif',
        'http://example.com/two.gif'
    ],
    screens: ['screen1']
};

testConfig.save = function(cb) {
  setTimeout(cb, 0);
};

_.extend(exports, originalConfig, testConfig);


describe('testConfig', function() {
  it('should have a port', function() {
    assert.equal(8080, testConfig.web.port);
  });
});