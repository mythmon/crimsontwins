var promise = require('node-promise');
var uri = require('uri-js');
var http = require('http');
var https = require('https');


(function() {
  var noodle_re = /noodletalk.org/;
  exports.blacklistNoodle = function(opts) {
    var p;
    var components = uri.parse(opts.url);

    if (opts.url.match(noodle_re)) {
      p = new promise.Promise();
      p.resolve({
        message:'NOPE',
        type: 'image',
        url: '/img/nope.gif'
      });
    }

    return p;
  };
})();


(function() {
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
})();


(function() {
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
})();


(function() {
  var xkcd_re = RegExp('xkcd.com(/\d+)?/?');

  exports.unpackXkcd = function(opts) {
    var p, match = opts.url.match(xkcd_re);

    proto = /https/.exec(opts.url) ? https : http;

    if (match) {
      p = new promise.Promise();

      proto.get(opts.url + '/info.0.json', function(res) {
        var data = '';

        res.on('data', function(d) {
          data += d;
        });

        res.on('end', function() {
          try {
            data = JSON.parse(data);
            p.resolve({
              url: data.img,
              type: 'image'
            });
          } catch(e) {
            p.reject({
              message: 'Could not load xkcd url from: ' + e
            });
          }
        });
      }).on('error', function(e) {
        p.reject({
          message: 'Could not load xkcd url from: ' + opts.url
        });
      });
    }

    return p;
  }
})();


exports.all = [
  exports.blacklistNoodle,
  exports.embedYoutube,
  exports.unpackImgur,
  exports.unpackXkcd
];