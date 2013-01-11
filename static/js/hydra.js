$(function() {
  var i;

  var x = 1;
  var y = 1;

  var pairs = window.location.search.slice(1).split('&');
  console.log(pairs);
  for (i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    var k = pair[0];
    var v = pair[1];
    console.log(x + ', ' + y);
    if (k === 'x') {
      x = v;
    } else if (k === 'y') {
      y = v;
    }
  }

  function resize() {
    $('#container').css({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }

  $(window).on('resize', resize);
  resize();

  var iframeWidth = 100.0 / x;
  var iframeHeight = 100.0 / y;

  var subframeUrl = '/index.html';

  for (i = 0; i < x * y; i++) {
    $('#container').append(
      $('<iframe/>')
        .prop('src', subframeUrl)
        .css({
          width: iframeWidth + '%',
          height: iframeHeight + '%',
          float: 'left',
          border: 0
        })
    );
  }

  $(document).keyup(function(e) {
    if (e.keyCode == 27) { // Esc
      $('iframe').prop('src', '/index.html');
    }
  });
});
