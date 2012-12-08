;(function() {

var containerIndex = 0;
var $containers = $('.container');

function updateContents($element) {
  $prev = $containers.slice(containerIndex, containerIndex+1);
  containerIndex = (containerIndex + 1) % $containers.length;
  $next = $containers.slice(containerIndex, containerIndex+1);

  console.log($prev);
  console.log($next);

  //$next.css('z-index', 2);
  //$prev.css('z-index', 1);

  $next.html($element);

  $next.css('opacity', 1.0);
  $prev.css('opacity', 0.0);

  $prev.once('transitioned', function() {
    $prev.html('');
  });
}

now.ready(function() {
  now.setUrl = function(url) {
    console.log('Loading url in iframe');
    updateContents(
      $('<iframe>', {
        sandbox: 'allow-same-origin allow-scripts allow-forms',
        src: url
      })
    );
  };

  now.setImage = function(url) {
    console.log('Loading image');
    updateContents(
      $('<div class="imgbg"/>').css({
        'background-image': 'url(' + url + ')'
      })
    );
  };

  now.reset = function() {
    console.log('reset');
    $('#container').html('');
  };

  now.clientReady();
});

function resize() {
  $('.container, #wrap').css({
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
