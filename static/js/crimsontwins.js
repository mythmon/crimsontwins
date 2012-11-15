;(function() {

now.ready(function() {
  now.setUrl = function(url) {
    console.log('Loading url in iframe');
    $('#container').html(
      $('<iframe>', {src: url})
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
});


})();
