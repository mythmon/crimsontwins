var _ = require('underscore');
var assert = require('assert');
var utils = require('../../app/utils');

var realHttp = require('http');


var mockHttp = {
  request: function(req, cb) {
    var match, ext, host;
    var res = {
      statusCode: 200,
      headers: {
        'content-length': 0,
        'content-type': 'text/html'
      }
    };

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
    }

    if (res.statusCode >= 300 && res.statusCode < 400) {
      host = req.host || 'example.com';
      res.headers.location = 'http://' + host + '/redirect.html';
    }

    utils.async(cb, res);
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
  });
});