var _ = require('underscore');
var http = require('http');
var https = require('https');
var now = require('now');
var nodestatic = require('node-static');
var uri = require('uri-js');

var config = require('./config');
var utils = require('./utils');


// Web server
files = new (nodestatic.Server)('./static');

httpServer = http.createServer(function(request, response) {
  request.addListener('end', function() {
    files.serve(request, response);
  });
}).listen(config.web.port);


// Now.js connection
var everyone = now.initialize(httpServer);
screenIds = [];
var currentScreen = 0;
var resetTimers = {};

everyone.disconnected(function() {
  console.log('screen disconnected ' + JSON.stringify(this));
  var index = screenIds.indexOf(this.user.clientId);
  if (index >= 0) {
    screenIds.splice(index, 1);
  }
  // Make sure that `currentScreen` is still valid.
  currentScreen = (currentScreen + 1) % screenIds.length;
  clearInterval(resetTimers[this.user.clientId]);
});

everyone.connected(function() {
  console.log('screen connected');
  screenIds.push(this.user.clientId);
  // Make the next url go to this screen.
  currentScreen = screenIds.length - 1;
  exports.showDefault(this.user.clientId);
});

// Pick a screen to show a URL on, and kick off the process.
exports.setUrl = function(url, screenId, callback) {
  if (screenId === -1) {
    screenId = screenIds[currentScreen];
    if (screenId === undefined) {
      utils.async(callback, "No screens connected.");
      return;
    }
    currentScreen = (currentScreen + 1) % screenIds.length;
  }

  console.log(screenId);
  now.getClient(screenId, function() {
    var screen = this;
    if (!this) {
      return;
    }
    _processUrl(url, function(opts) {
      if (opts.url) {
        if (!screen) {
          return;
        }
        if (opts.type === 'image') {
          screen.now.setImage(opts.url);
        } else {
          screen.now.setUrl(opts.url);
        }
      }
      utils.async(callback, _.extend({}, {screenId: screenId}, opts));
    });
  });

  clearTimeout(resetTimers[screenId]);
  resetTimers[screenId] = setTimeout(function() {
    exports.showDefault(screenId);
  }, config.resetTime);
};

function _processUrl(url, callback) {
  var components = uri.parse(url);
  if (components.errors.length) {
    utils.async(callback, {
      message: "I couldn't parse a url from that."
    });
    return;
  }

  if (components.host.indexOf('noodletalk.org') >= 0) {
    utils.async(callback, {
      message:'NOPE',
      type: 'image',
      url: '/img/nope.gif'
    });
    return;
  }

  var path = components.path;
  if (components.query) {
    path += '?' + components.query;
  }
  var port = components.port;

  var proto = http;
  if (components.scheme === 'https') {
    proto = https;
    port = 443;
  }

  var options = {
    method: 'HEAD',
    host: components.host,
    port: port,
    path: path
  };

  var req = proto.request(options, function(res) {
    var headers = {};
    _.each(res.headers, function(value, key) {
      headers[key.toLowerCase()] = value;
    });
    console.log(url);
    console.log(JSON.stringify(headers));

    if (res.statusCode >= 300 && res.statusCode < 400) {
      // redirect, handle it.
      console.log('redirect ' + headers.location);
      return _processUrl(headers.location, callback);
    }

    if (res.statusCode >= 400) {
      utils.async(callback, {
        message: 'There was a problem with the url (' + res.statusCode + ')'
      });
      return;
    }

    var contentType = (headers['content-type'] || '').toLowerCase();
    if (contentType.indexOf('image/') === 0) {
      utils.async(callback, {
        url: url,
        type: 'image'
      });
      return;
    }

    var xframe = (headers['x-frame-options'] || '').toLowerCase();
    if (xframe === 'sameorigin' || xframe === 'deny') {
      utils.async(callback, {
        message: "That site prevents framing. It won't work."
      });
      return;
    }

    utils.async(callback, {url: url});
    return;
  });

  req.on('error', function(err) {
    console.log('Problem with HEAD request: ' + err.message);
    // We'll do it live.
    utils.async(callback, {url: url});
  });

  req.end();
}

exports.reset = function() {
    everyone.now.reset();
};

exports.showDefault = function(screenId) {
  var defaultUrl = config.resetUrls[0];
  config.resetUrls = utils.shuffle(config.resetUrls);

  config.resetUrls.push(defaultUrl);
  exports.setUrl(defaultUrl, screenId, function() {});
};
