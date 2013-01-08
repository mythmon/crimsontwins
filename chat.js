var irc = require('irc');

var config = require('./config');
var manager = require('./manager');


// IRC Bot
var IRC_TARGET_RE = RegExp('^' + config.irc.nick + ': (.*)$');
var RESET_RE = RegExp(config.irc.nick + ': ohshit|reset|clear');

var ircClient = new irc.Client(config.irc.server, config.irc.nick, {
  channels: config.irc.channels
});

// On connected to IRC server
ircClient.on('registered', function(message) {
  // Store the nickname assigned by the server
  config.irc.nick = message.args[0];
  // Update regexes that use the nick.
  IRC_TARGET_RE = RegExp('^' + config.irc.nick + ': (.*)$');
  RESET_RE = RegExp(config.irc.nick + ': ohshit|reset|clear');
});

// On receive IRC message.
ircClient.addListener('message', function(from, to, message) {
  var match;
  match = RESET_RE.exec(message);
  if (match) {
    manager.reset();
    return;
  }

  match = IRC_TARGET_RE.exec(message);
  var url;
  if (match) {
    url = match[1];
  } else if (from == 'dashbot') {
    url = message;
  }
  if(url) {
    manager.setUrl(url, null, function(opts) {
      if (opts['message']) {
        ircClient.say(to, opts['message']);
      }
    });
  }
});

exports = ircClient;
