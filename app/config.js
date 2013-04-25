var _ = require('underscore');
var fs = require('fs');
var path = require('path');


// Configuration
var defaults = {
  irc: {
      nick: 'crimsontwins'
  },
  web: {
      port: 8080
  },
  "resetTime": 60000,
  "resetUrls": []
};

var existsSync = fs.existsSync || path.existsSync;

var config, json;

if (existsSync('config.json')) {
  json = fs.readFileSync('config.json');
  config = JSON.parse(json);
} else {
  config = {};
}

config = _.extend(exports, defaults, config);

config.save = function(cb) {
  var confStr = JSON.stringify(config, null, 4);
  fs.writeFile('config.json', confStr, cb);
};