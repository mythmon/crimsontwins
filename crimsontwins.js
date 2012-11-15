var http = require('http');
var now = require('now');
var nodestatic = require('node-static');
var irc = require('irc');

files = new (nodestatic.Server)('./static');

httpServer = http.createServer(function(request, response) {
  request.addListener('end', function() {
    files.serve(request, response);
  });
}).listen(8080);

var everyone = now.initialize(httpServer);
screenIds = [];
var currentScreen = 0;

everyone.connected(function() {
  console.log('client connected ' + JSON.stringify(this));
});

everyone.disconnected(function() {
  console.log('client disappeared ' + JSON.stringify(this));
  var index = screenIds.indexOf(this.user.clientId);
  if (index >= 0) {
    screenIds.splice(index, 1);
  }
});

everyone.now.imready = function() {
  console.log('client ready');
  screenIds.push(this.user.clientId);
};

function setUrl(url) {
  console.log('setting url to ' + url);
  var id = screenIds[currentScreen];
  currentScreen = (currentScreen + 1) % screenIds.length;

  now.getClient(id, function() {
    this.now.setImage(url);
  });
}

var ircClient = new irc.Client('irc.mozilla.org', 'crimsontwins', {
  channels: ['#mcooper']
});

ircClient.addListener('message', function(from, to, message) {
  var match = /^crimsontwins: (.*)$/.exec(message);
  if (match) {
    var url = match[1];
    setUrl(url);
  } else {
    console.log('no match');
  }
});
