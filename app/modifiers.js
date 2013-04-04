exports.all = [];

exports.all.push(function blacklistNoodle(opts) {
  if (opts.components.host.indexOf('noodletalk.org') >= 0) {
    return {
      message:'NOPE',
      type: 'image',
      url: '/img/nope.gif'
    };
  }
});

var youtube_re = RegExp('(youtube.com/.*\\?.*v=([A-Za-z0-9_-]+))|(youtu.be/([A-Za-z0-9_-]+))');
exports.all.push(function embedYoutube(opts) {
  var match = opts.url.match(youtube_re);
  if (match) {
    var id = match[2] || match[4];
    return {
      url: 'http://www.youtube.com/embed/' + id + '?rel=0&autoplay=1',
      type: 'url'
    };
  }
});

var imgur_re = RegExp('imgur.com/([A-Za-z0-9]+)');
exports.all.push(function unpackImgur(opts) {
  var match = opts.url.match(imgur_re);
  if (match) {
    var id = match[1];
    return {
      url: 'http://i.imgur.com/' + id + '.png', // The extension doesn't matter.
      type: 'image'
    };
  }
});