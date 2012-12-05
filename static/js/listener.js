;(function() {

function updateContents($element) {
  var $container = $('#container');
  var $current = $container.children();
  if (!$current.length) {
    $container.html($element);
    return;
  }

  $current.css({'opacity': 1});
  $element.css({'opacity': 0});
  $container.append($element);

  $element.animate({opacity: 1}, {duration: 3000, queue: false});
  $current.animate({opacity: 0}, {duration: 3000, queue: false, complete: function() {
    console.log('done animating');
    $current.remove();
  }});
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
