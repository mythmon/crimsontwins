var _ = require('underscore');
var http = require('http');
var https = require('https');
var promise = require('node-promise');
var uri = require('uri-js');

var config = require('./config');
var utils = require('./utils');

/* Class ContentManager */
function ContentManager() {
  this.contentUrls = config.resetUrls;
  this.content = [];
  this.index = 0;
}

ContentManager.prototype.load = function() {
  var promises = [];
  var p;
  var self = this;

  this.content = [];
  _.each(this.contentUrls, function(url) {
    p = self.contentForUrl(url);
    promises.push(p);
    p.then(Array.prototype.push.bind(self.content));
  });

  return promise.all(promises);
};

ContentManager.prototype.all = function() {
  return this.content;
};

ContentManager.prototype.next = function() {
  var c = this.content[this.index];
  this.index++;
  if (this.index >= this.content.length) {
    utils.shuffle(this.content);
    this.index = 0;
  }
  return c;
};

ContentManager.prototype.contentForUrl = function(url) {
  var p = new promise.Promise();
  var self = this;

  var urlParts = uri.parse(url);
  var proto = urlParts.scheme === 'https' ? https : http;
  var port = urlParts.port || urlParts.scheme === 'https' ? 443 : 80;
  var path = urlParts.path;
  if (urlParts.query) {
    path += '?' + urlParts.query;
  }

  var options = {
    host: urlParts.host,
    port: port,
    path: path
  };

  proto.request(options, function(res) {
    var contentType, headers = {}, xframe;
    var content = {
      url: url,
      type: 'url'
    };

    _.each(res.headers, function(value, key) {
      headers[key.toLowerCase()] = value;
    });

    if (res.statusCode >= 300 && res.statusCode < 400) {
      self.contentForUrl(res.headers.location).then(
        function success(content) {
          p.resolve(content);
        },
        function error(error) {
          p.reject(error);
        }
      );
      return;
    }

    if (res.statusCode > 400) {
      p.reject({
        error: res.statusCode,
        message: 'There was a problem with the url ({statusCode})'.format(res)
      });
      return;
    }

    xframe = (headers['x-frame-options'] || '').toLowerCase();
    if (xframe === 'sameorigin' || xframe === 'deny') {
      // reject
    }

    contentType = (headers['content-type'] || '').toLowerCase();
    if(contentType.indexOf('image/') === 0) {
      content.type = 'image';
    }

    p.resolve(content);
  });

  return p;
};

module.exports = ContentManager;
/* end ContentManager */
