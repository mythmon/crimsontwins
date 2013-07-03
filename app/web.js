var path = require('path');
var http = require('http');
var fs = require('fs');

var express = require('express');
var socketio = require('socket.io');

var config = require('./config');
var manager = require('./manager');
var utils = require('./utils');

var screenManager = new manager.ScreenManager();
var contentManager = screenManager.contentManager;
var app = express();

app.set('port', config.web.port);

// === VIEWS ===
app.get('/api/ping', function(req, res) {
  res.status(200);
  res.end('pong');
});

app.post('/api/reset', function(req, res) {
  var screenName = req.query.screen || undefined;

  screenManager.reset(screenName);

  res.status(204);
  res.end();
});

app.post('/api/sendurl', function(req, res) {
  var url = req.query.url;
  var screenName = req.query.screen;
  var timeout = parseInt(req.query.timeout);
  if (isNaN(timeout)) {
    timeout = undefined;
  }

  if (!url) {
    res.json(400, {error: 'URL is required.'});
    return;
  }

  screenManager.sendUrl(url, screenName, timeout).then(
    function(obj) {
      res.json(200, obj);
    },
    function(obj) {
      var status = obj.error || 500;
      res.json(status, obj);
    }
  );
});

app.get('/api/config', function(req, res) {
  res.end(JSON.stringify(config, null, true));
});

app.get('/api/staticpath', function(req, res) {
  res.end(path.normalize(__dirname + '/../static'));
});

app.get('/api/env', function(req, res) {
  res.end(JSON.stringify(process.env));
});

app.use(express.static(path.normalize(__dirname + '/../static')));


// === Socket.IO ===

function start() {
  var key;
  var server = http.createServer(app);
  server.listen(app.get('port'), function() {
    console.log('Listening on http://0.0.0.0:{0}'.format(app.get('port')));
  });

  var io = socketio.listen(server);
  io.set('log level', 2);
  for (key in config.io) {
    io.set(key, config.io[key]);
  }

  io.sockets.on('connection', function(socket) {
    socket.on('addScreen', screenManager.add.bind(screenManager));

    socket.on('removeScreen', screenManager.remove.bind(screenManager));

    socket.on('setContentSetUrls', contentManager.setUrls.bind(contentManager));

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
exports.screenManager = screenManager;
exports.contentManager = contentManager;

