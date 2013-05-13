var promise = require('node-promise');
var uri = require('uri-js');

exports.blacklistNoodle = function(opts) {
  var p;
  var components = uri.parse(opts.url);

  if (components.host.indexOf('noodletalk.org') >= 0) {
    p = new promise.Promise();
    p.resolve({
      message:'NOPE',
      type: 'image',
      url: '/img/nope.gif'
    });
  }

  return p;
};

var youtube_re = RegExp('(youtube.com/.*\\?.*v=([A-Za-z0-9_-]+))|(youtu.be/([A-Za-z0-9_-]+))');
exports.embedYoutube = function(opts) {
  var p, id;
  var match = opts.url.match(youtube_re);

  if (match) {
    p = new promise.Promise();
    id = match[2] || match[4];
    p.resolve({
      url: 'http://www.youtube.com/embed/' + id + '?rel=0&autoplay=1',
      type: 'url'
    });
  }

  return p;
};

var imgur_re = RegExp('imgur.com.*/([A-Za-z0-9]+)$');
exports.unpackImgur = function(opts) {
  var p, id, match = opts.url.match(imgur_re);

  if (match) {
    p = new promise.Promise();
    id = match[1];
    p.resolve({
      url: 'http://i.imgur.com/' + id + '.png', // The extension doesn't matter.
      type: 'image'
    });
  }

  return p;
};

exports.all = [
  exports.blacklistNoodle,
  exports.embedYoutube,
  exports.unpackImgur
];