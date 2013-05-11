var express = require('express');
var http = require('http');
var config = require('./config');
var manager = require('./manager');


function init() {
  var app = express();

  app.set('port', config.web.port);


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
    //p.then(res.json.bind(res, 200), res.json.bind(res, 500));
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

  exports.app = app;
  exports.server = http.createServer(app).listen(app.get('port'));
}

exports.init = init;
