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

var youtube_re = RegExp('(youtube.com/watch\\?v=([A-Za-z0-9_]+))|(youtu.be/([A-Za-z0-9]+))');
exports.all.push(function embedYoutube(opts) {
  var match = youtube_re.exec(opts.url);
  if (match) {
    var id = match[2] || match[4];
    return {
      url: 'http://www.youtube.com/embed/' + id + '?rel=0&autoplay=1',
      type: 'url'
    };
  }
});
