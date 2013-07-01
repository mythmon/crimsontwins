var fs = require('fs');
var http = require('http');
var path = require('path');

var express = require('express');
var nib = require('nib');
var nunjucks = require('nunjucks');
var socketio = require('socket.io');
var stylus = require('stylus');

var api = require('./api');
var config = require('./config');
var manager = require('./manager');
var utils = require('./utils');


var app = express();
app.set('port', config.web.port);

// Nunjucks
var tmplLoader = new nunjucks.FileSystemLoader(utils.appPath('templates'));
var env = new nunjucks.Environment(tmplLoader);
env.express(app);

var screenManager = new manager.ScreenManager();
var contentManager = screenManager.contentManager;


// === Static files ===

// Normal static files
app.use(express.static(utils.appPath('static')));

// Stylus
app.use(stylus.middleware({
  src: utils.appPath('static'),
  force: config.debug,
  compile: function(str, path) {
    return stylus(str)
      .set('filename', path)
      .set('compress', !config.debug)
      .use(nib());
  }
}));

// Nunjucks needs to be able to access templates in development.
if (config.debug) {
  app.use('/templates', express.static(utils.appPath('templates')));
}

// Define a shortcut if you want
var env = nunjucks.env;
// === Views ===

api.setup(app, screenManager);

// Fall back just serves the primary view.
app.get('/', function(res, req, next) {
  req.render('selectors.html');
});

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


var utils = require('./utils');
