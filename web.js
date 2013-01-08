//var _ = require('underscore');
var http = require('http');
//var https = require('https');
//var now = require('now');
var nodestatic = require('node-static');
//var uri = require('uri-js');

var config = require('./config');
//var utils = require('./utils');
//var modifiers = require('./modifiers');


// Web server
var files = new (nodestatic.Server)('./static');

exports.httpServer = http.createServer(function(request, response) {
  request.addListener('end', function() {
    files.serve(request, response);
  });
}).listen(config.web.port);


/*
// Now.js connection
var everyone = now.initialize(httpServer);
screenIds = [];
var currentScreen = 0;
var resetTimers = {};

everyone.now.clientReady = function() {
  screenIds.push(this.user.clientId);
  // Make the next url go to this screen.
  currentScreen = screenIds.length - 1;
  exports.showDefault(this.user.clientId);
};

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

  now.getClient(screenId, function() {
    var screen = this;
    if (!screen || !screen.now) {
      console.log("Can't talk to screen: " + screen);
      clearTimeout(resetTimers[screenId]);
      return;
    }
    _processUrl(url, function(opts) {
      if (opts.url) {
        if (opts.type === 'image') {
          screen.now.setImage(opts.url);
        } else {
          screen.now.setUrl(opts.url);
        }
      }

      clearTimeout(resetTimers[screenId]);
      resetTimers[screenId] = setTimeout(function() {
        exports.showDefault(screenId);
      }, config.resetTime);

      utils.async(callback, _.extend({}, {screenId: screenId}, opts));
    });
  });
};
*/
