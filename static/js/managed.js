(function() {

var containerIndex = 0;
var $containers = $('.container');

function updateContents($element) {
  $prev = $containers.slice(containerIndex, containerIndex+1);
  containerIndex = (containerIndex + 1) % $containers.length;
  $next = $containers.slice(containerIndex, containerIndex+1);

  $next.html($element);

  $next.css('opacity', 1.0);
  $prev.css('opacity', 0.0);

  $prev.once('transitioned', function() {
    $prev.html('');
  });
}

function elementFor(content) {
  if (content.type == 'url') {
    return $('<iframe>', {
      sandbox: 'allow-same-origin allow-scripts allow-forms',
      src: content.url
    });
  }
  if (content.type == 'image') {
    return $('<div>', {
      'class': 'imgbg'
    }).css({
      'background-image': 'url({url})'.format(content)
    });
  }
}

now.ready(function() {
  now.setUrl = function(url) {
    console.log('Loading url in iframe');
    updateContents(elementFor({type: 'html', url: url}));
  };

  now.setImage = function(url) {
    console.log('Loading image');
    updateContents(elementFor({type: 'image', url: url}));
  };

  now.screenChange = function(message) {
  };

  now.reset = function() {
    console.log('reset');
    window.location.reload();
  };

  now.clientReadyManaged();
  ready('now');
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

  ready('dom');
});

readyParts = ['dom', 'now'];
function ready(part) {
  readyParts = _.without(readyParts, part);
  if (!readyParts.length) {
    init();
  }
}

function init() {
  var $selectorUl = $('<ul>', {'class': 'selector'});
  var template = '<li>' +
    '<h1 class="title">{title}</h1>' +
    '<div class="preview"/>' +
    '<div class="click-target"/>' +
    '</li>';

  var screens = now.getScreens(function(screens) {
    var $li;

    _.each(screens, function(screen) {
      var $li = $(template.format(screen));
      $li.children('.preview').html(elementFor(screen.content));
      $selectorUl.append($li);
    });

    $li = $(template.format({title: 'New screen'}));
    $li.find('.preview').html('<i class="add">');
    $selectorUl.append($li);

    $li = $(template.format({title: 'Hydra Mode'}));
    $li.find('.preview').html('<i class="hydra">');
    $selectorUl.append($li);

    $('body').html($selectorUl);
  });
}

})();
