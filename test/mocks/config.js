var assert = require('assert');
var _ = require('underscore');
var originalConfig = require('../../app/config');


// Test Configuration
var testConfig = {
    irc: {
        server: 'irc.example.com',
        nick: 'crimsontwins-test',
        channels: ['#channel1', '#channel2']
    },
    web: {
        port: 18080
    },
    resetTime: 60000,
    resetUrls: [
        'http://example.com/animated.gif',
        'http://example.com/webpage.html',
        'http://example.com/image.png'
    ],
    screens: ['screen1', 'screen2']
};

testConfig.save = function(cb) {
  setTimeout(cb, 0);
};

testConfig.reset = function() {
  _.extend(exports, originalConfig, testConfig);
};

_.extend(exports, originalConfig, testConfig);


describe('testConfig', function() {
  it('should have a port', function() {
    assert.equal(18080, testConfig.web.port);
  });
});