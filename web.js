var express = require('express');
var http = require('http');
var config = require('./config');


var app = express();

app.set('port', config.web.port);

app.configure(function() {
  app.use('/', express.static(__dirname + '/static'));
});

exports.server = http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
