var irc = require('irc');
var http = require('http');
var urllib = require('url');
var querystring = require('querystring');


(function checkConfig() {
  var i;
  var error = false;
  var requiredConfigs = ['CT_IRC_SERVER', 'CT_IRC_NICK', 'CT_IRC_CHANNELS',
                         'CT_API_URL'];
  for (i = 0; i < requiredConfigs.length; i++) {
    var key = requiredConfigs[i];
    if (process.env[key] === undefined) {
      console.log('Error: ' + key + ' must be defined.');
      error = true;
    }
  }
  if (error) process.exit(-1);
})();


var config = {
  server: process.env.CT_IRC_SERVER,
  nick: process.env.CT_IRC_NICK,
  channels: process.env.CT_IRC_CHANNELS.split(','),
  apiUrl: process.env.CT_API_URL
};


function api(method, url, query, cb) {
  var key, opts, res;

  if (query !== undefined) {
    url += '?' + querystring.stringify(query);
  }

  opts = urllib.parse(config.apiUrl + '/api' + url);
  opts.method = method.toUpperCase();

  res = http.request(opts, cb);
  res.end();
}


// IRC Bot
var ircClient = new irc.Client(config.server, config.nick, {
  channels: config.channels
});

// On connected to IRC server
ircClient.on('registered', function(message) {
  // Store the nickname assigned by the server
  config.nick = message.args[0];
});

// On receive IRC message.
ircClient.addListener('message', function(from, to, message) {
  var match;
  var screenName, url, opts;

  // Only listen to messages targeted at the bot.
  if (message.indexOf(config.nick + ': ') !== 0) {
    if (from === 'dashbot') {
      message = config.nick + ': ' + message;
    } else {
      return;
    }
  }

  args = message.slice(config.nick.length + 2).split(' ');

  if (args[0] === 'ohshit' || args[0] == 'reset' || args[0] === 'clear') {
    opts = {};
    screenName = args.slice(1).join(' ');
    if (screenName !== '') {
      opts.screen = screenName;
    }
    api('post', '/reset', opts);
  } else {
    opts = {
      url: args[0]
    };

    screenName = args.slice(1).join(' ');
    if (screenName) {
      opts.screen = screenName;
    }

    api('post', '/sendurl', opts, function(res) {
      var data = '';

      res.on('data', function(chunk) {
        data += chunk;
      });

      res.on('end', function() {
        try {
          data = JSON.parse(data);
          if (data.message) {
            ircClient.say(to, data.message);
          }
        } catch(e) {
          ircClient.say('Something went wrong (' + e + ')');
          console.log('Error sending url: ' + data);
        }
      });
    });
  }
});

