;(function() {

now.ready(function() {
  now.setUrl = function(url) {
    console.log('Loading url in iframe');
    $('#container').html(
      $('<iframe>', {sandbox: 'allow-same-origin', src: url})
    );
  };

  now.setImage = function(url) {
    console.log('Loading image');
    $('#container').html(
      $('<div class="imgbg"/>').css({
        'background-image': 'url(' + url + ')'
      })
    );
  };

  now.reset = function() {
    console.log('reset');
    $('#container').html('');
  };
});

function resize() {
  $('#container').css({
    width: window.innerWidth,
    height: window.innerHeight
  });
}

$(function() {
  $(window).on('resize', resize);
  resize();

  $(document).keyup(function(e) {
    if (e.keyCode == 27) { // Esc
      now.reset();
    }
  });
});


})();
