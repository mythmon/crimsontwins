var _ = require('lodash');
var fs = require('fs');
var path = require('path');


// Configuration
var defaults = {
  web: {
      port: 8080
  },
  resetTime: 60000,
  resetUrls: [],
  io: {}
};

var existsSync = fs.existsSync || path.existsSync;
var config, json, key, i, obj, parts;
var configDir = './';
var configStack = [exports, defaults];


function configFromFile(path) {
  var json, config = {};

  if (existsSync(path)) {
    try {
      json = fs.readFileSync(path);
      config = JSON.parse(json);
    } catch(e) {
      console.log('Error: ', e);
      // Well ok.
    }
  } else {
    console.log('path ' + path + ' not found');
  }

  return config;
}

function configFromEnv() {
  var key, obj;
  var config = {
    web: {}
  };

  config.web.port = process.env.PORT;

  for (key in process.env) {
    if (key.indexOf('CT_') === 0) {
      parts = key.slice(3).split('_');
      obj = config;

      for (i = 0; i < parts.length; i++) {
        if (i === parts.length - 1) {
          try {
            obj[parts[i]] = JSON.parse(process.env[key]);
          } catch(e) {
            obj[parts[i]] = process.env[key];
          }
        } else {
          obj = obj[parts[i]] = obj[parts[i]] || {};
        }
      }
    }
  }

  return config;
}

configStack.push(configFromFile('./config.json'));
if (process.env.STACKATO_FILESYSTEM) {
  configStack.push(configFromFile(process.env.STACKATO_FILESYSTEM + '/config.json'));
}
configStack.push(configFromEnv());

config = _.merge.apply(null, configStack);

config.save = function(cb) {
  var confStr = JSON.stringify(config, null, 4);
  var count = 1;
  function counter() {
    count--;
    if (count === 0) {
      cb.apply(this, arguments);
    }
  }

  if (process.env.STACKATO_FILESYSTEM) {
    count++
    fs.writeFile(process.env.STACKATO_FILESYSTEM + '/config.json', confStr, counter);
  }
  fs.writeFile('./config.json', confStr, counter);
};
