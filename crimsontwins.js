var _ = require('underscore');
var http = require('http');
var now = require('now');
var nodestatic = require('node-static');
var irc = require('irc');

var fs = require('fs');
var path = require('path');


// Configuration
var defaults = {
    irc: {
        nick: 'crimsontwins'
    },
    web: {
        port: 8080
    }
};

var existsSync = fs.existsSync || path.existsSync;

// Config is a global variable.
if (existsSync('./config.json')) {
    config = require('./config.json');
} else {
  config = {};
}

config = _.extend({}, defaults, config);


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

everyone.disconnected(function() {
  console.log('screen disconnected ' + JSON.stringify(this));
  var index = screenIds.indexOf(this.user.clientId);
  if (index >= 0) {
    screenIds.splice(index, 1);
  }
  // Make sure that `currentScreen` is still valid.
  currentScreen = (currentScreen + 1) % screenIds.length;
});

everyone.connected(function() {
  console.log('screen connected');
  screenIds.push(this.user.clientId);
  // Make the next url go to this screen.
  currentScreen = screenIds.length - 1;
});

function setUrl(url) {
  console.log('setting url to ' + url);
  var id = screenIds[currentScreen];
  currentScreen = (currentScreen + 1) % screenIds.length;

  now.getClient(id, function() {
    if (/\.(png|jpe?g|gif)/.exec(url)) {
      this.now.setImage(url);
    } else {
      this.now.setUrl(url);
    }
  });
}


// IRC Bot
var IRC_TARGET_RE = RegExp('^' + config.irc.nick + ': (.*)$');
var ircClient = new irc.Client(config.irc.server, config.irc.nick, {
  channels: config.irc.channels
});

// On connected to IRC server
ircClient.on('registered', function(message) {
    // Store the nickname assigned by the server
    config.irc.nick = message.args[0];
    IRC_TARGET_RE = RegExp('^' + config.irc.nick + ': (.*)$');
});

// On receive IRC message.
ircClient.addListener('message', function(from, to, message) {
  var match = IRC_TARGET_RE.exec(message);
  if (match) {
    var url = match[1];
    setUrl(url);
  } else {
    console.log('no match');
  }
});
