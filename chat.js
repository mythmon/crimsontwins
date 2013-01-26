var irc = require('irc');

var config = require('./config');
var manager = require('./manager');


// IRC Bot
var ircClient = new irc.Client(config.irc.server, config.irc.nick, {
  channels: config.irc.channels
});

// On connected to IRC server
ircClient.on('registered', function(message) {
  // Store the nickname assigned by the server
  config.irc.nick = message.args[0];
});

// On receive IRC message.
ircClient.addListener('message', function(from, to, message) {
  var match;

  // Only listen to messages targeted at the bot.
  if (message.indexOf(config.irc.nick) !== 0) {
    if (from === 'dashbot') {
      message = config.irc.nick + ': ' + message;
    } else {
      return;
    }
  }

  args = message.slice(config.irc.nick.length + 2).split(' ');

  if (args[0] === 'ohshit' || args[0] == 'reset' || args[0] === 'clear') {
    manager.reset(args.slice(1).join(' '));
  } else {
    var url = args[0];
    var screen_name = args.slice(1).join(' ');

    if(url) {
      manager.setUrl(url, screen_name, function(opts) {
        if (opts['message']) {
          ircClient.say(to, opts['message']);
        }
      });
    }
  }
});

exports = ircClient;
