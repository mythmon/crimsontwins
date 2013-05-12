var express = require('express');
var http = require('http');
var socketio = require('socket.io');

var config = require('./config');
var manager = require('./manager');
var utils = require('./utils');

var screenManager = new manager.ScreenManager();
var contentManager = screenManager.contentManager;
var app = express();

app.set('port', config.web.port);

// === VIEWS ===
app.post('/api/reset', function(req, res) {
  var screenName = req.query.screen || undefined;

  manager.reset(screenName);

  res.status(201);
  res.send('');
});

app.post('/api/sendurl', function(req, res) {
  var p;
  var url = req.query.url;
  var screenName = req.query.screen || undefined;

  if (url === undefined) {
    res.json(400, {error: 'URL is required.'});
    return;
  }

  p = manager.setUrl(url, screenName);
  p.then(
    function(obj) {
      res.json(200, obj);
    },
    function(obj) {
      res.json(500, obj);
    }
  );
});

app.use('/', express.static(__dirname + '/../static'));


// === Socket.IO ===

function getIO() {
  var io = socketio.listen(web.server);
  io.set('log level', 2);
  return io;
}

exports.getIO = getIO;


function start() {
  var server = http.createServer(app);
  server.listen(app.get('port'), function() {
    console.log('Listening on http://0.0.0.0:{0}'.format(app.get('port')));
  });

  var io = socketio.listen(server);
  io.set('log level', 2);

  io.sockets.on('connection', function(socket) {
    socket.on('addScreen', screenManager.add);

    socket.on('removeScreen', screenManager.remove);

    socket.on('setContentSetUrls', contentManager.setUrls);

    socket.on('getScreens', function(args, cb) {
      cb(screenManager.all());
    });

    socket.on('getContentSet', function(args, cb) {
      cb(contentManager.all());
    });
  });

  utils.eventRelay(screenManager, io.sockets, 'screenChanged');
  utils.eventRelay(screenManager, io.sockets, 'screenAdded');
  utils.eventRelay(screenManager, io.sockets, 'screenRemoved');

  contentManager.load();
}

exports.app = app;
exports.start = start;
