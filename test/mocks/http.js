var _ = require('lodash');
var assert = require('assert');
var events = require('events');
var urlParse = require('url').parse;

var _ = require('lodash');

var utils = require('../../app/utils');

var realHttp = require('http');


var mockHttp = {
  request: function(req, cb) {
    var p = parseInt(req.port, 10);
    if (3456 <= p && p <= 3500) {
      console.log(p);
      // this is the port supertest uses. We shouldn't mock supertest.
      return realHttp.request.apply(this, arguments);
    }

    var match, ext, host;
    var res = new events.EventEmitter();

    if (typeof req === 'string') {
      req = urlParse(req);
    }

    _.extend(res, {
      statusCode: 200,
      headers: {
        'content-length': 0,
        'content-type': 'text/html'
      }
    });

    if (req.path) {
      ext = req.path.split('.').slice(-1)[0];
      switch (ext) {
        case 'gif': res.headers['content-type'] = 'image/gif'; break;
        case 'png': res.headers['content-type'] = 'image/png'; break;
      }

      match = /^\/(\d+)$/.exec(req.path);
      if (match) {
        res.statusCode = parseInt(match[1], 10);
      }

      match = /^\/frame\/(.*)$/.exec(req.path);
      if (match) {
        res.headers['x-frame-options'] = match[1];
      }
    }

    if (res.statusCode >= 300 && res.statusCode < 400) {
      host = req.host || 'example.com';
      res.headers.location = 'http://' + host + '/redirect.html';
    } else {
      if (req.port !== undefined && req.port !== 80 && req.port !== 443) {
        host = req.host || 'example.com';
        res.headers.location = 'http://' + host + '/' + req.port + req.path;
        res.statusCode = 302;
      }
    }

    utils.async(cb, res);

    if (/xkcd.com/.exec(req.host) && /614\/+info.0.json/.exec(req.path)) {
      utils.async(res.emit.bind(res), 'data', '{"img": "http:\/\/imgs.xkcd.com\/comics\/woodpecker.png"}');
    }

    utils.async(res.emit.bind(res), 'end');

    var req = new events.EventEmitter();
    req.setHeader = function(){};
    req.getHeader = function(){};
    req.end = function(){};
    req.path = res.path || '';

    return req;
  }
};

var http = _.extend(exports, realHttp, mockHttp);


describe('mockHttp', function() {
  describe('request', function() {

    it('should return a response with headers', function(done) {
      function cb(res) {
         assert.equal(0, res.headers['content-length']);
         done();
      }
      var options = {};
      var response = http.request(options, cb);
    });

    function contentTypeTest(ext, mime) {
      return function(done) {
        function cb(res) {
          assert.equal(mime, res.headers['content-type']);
          done();
        }
        var options = {
          path: '/a.' + ext
        };
        http.request(options, cb);
      };
    }

    it('should return the right content type for gifs',
       contentTypeTest('gif', 'image/gif'));
    it('should return the right content type for pngs',
       contentTypeTest('png', 'image/png'));
    it('should return the right content type for html',
       contentTypeTest('html', 'text/html'));

    it('should return a 302 when requested', function(done) {
      function cb(res) {
        assert.equal(302, res.statusCode);
        assert.equal('http://example.com/redirect.html', res.headers.location);
        done();
      }
      var options = {
        path: '/302'
      };
      http.request(options, cb);
    });

    it('should return a 404 when requested', function(done) {
      function cb(res) {
        assert.equal(404, res.statusCode);
        done();
      }
      var options = {
        path: '/404'
      };
      http.request(options, cb);
    });

    function frameTest(option) {
      return function(done) {
        function cb(res) {
          assert.equal(option, res.headers['x-frame-options']);
          done();
        }
        var options = {
          path: '/frame/' + option
        };
        http.request(options, cb);
      };
    }

    it('should return a frame denying page when requested', frameTest('deny'));
    it('should return a frame allowing page when requested', frameTest('allow'));
    it('should return a frame sameorigin page when requested', frameTest('sameorigin'));

    it('should do the port dance', function(done) {
      function cb(res) {
        assert.equal(res.headers.location, 'http://example.com/8080/');
        assert.equal(res.statusCode, 302);
        done();
      }
      var options = {
        host: 'example.com',
        path: '/',
        port: 8080
      };
      http.request(options, cb);
    });
  });
});