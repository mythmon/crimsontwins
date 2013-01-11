//var _ = require('underscore');
var http = require('http');
//var https = require('https');
//var now = require('now');
var nodestatic = require('node-static');
//var uri = require('uri-js');

var config = require('./config');
//var utils = require('./utils');
//var modifiers = require('./modifiers');


// Web server
var files = new (nodestatic.Server)('./static');

exports.httpServer = http.createServer(function(request, response) {
  request.addListener('end', function() {
    files.serve(request, response);
  });
}).listen(config.web.port);
