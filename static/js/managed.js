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
  if (content.type == 'html') {
    return $(content.html);
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

  now.addClient();
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
  if (readyParts.indexOf(part) >= 0) {
    readyParts = _.without(readyParts, part);
    if (!readyParts.length) {
      init();
    }
  }
}

function init() {
  makeSelector();
}

function makeSelector() {
  var $selectorUl = $('<ul>', {'class': 'selector'});

  var screens = now.getScreens(function(screens) {
    _.each(screens, function(screen) {
      $selectorUl.append(makeScreenPreview(screen));
    });

    $selectorUl.append(makeScreenPreview({
        name: 'New screen',
        content: {type: 'html', html: '<i class="add">'}
      })
      .addClass('meta')
      .on('click', function(ev) {
        ev.preventDefault();
        now.addScreen('herpderp ' + (new Date()).getMilliseconds());
      })
    );

    $selectorUl.append(makeScreenPreview({
        name: 'Hydra mode',
        content: {type: 'html', html: '<i class="hydra">'}
      })
      .addClass('meta')
      .on('click', function(ev) {
        ev.preventDefault();
      })
    );

    $('body').append('<h1>Select a screen to view</h1>').append($selectorUl);
  });
}

var screenPreviewTemplate =
  '<li class="preview">' +
    '<h1>{name}</h1>' +
    '<div class="content"/>' +
  '</li>';

function makeScreenPreview(screen) {
  var $elem = $(screenPreviewTemplate.format(screen))
    .data('screen', screen)
    .attr('id', 'screen-' + screen.id)
    .on('click', function(ev) {
      ev.preventDefault();
      console.log('clicked on a screen');
      var screen = $(this).data('screen');
      now.changeScreen(screen.name);
    });
  $elem.children('.content').html(elementFor(screen.content));
  return $elem;
}

now.screenAdded = function(screen) {
  console.log("Adding screen: " + JSON.stringify(screen));
  $('.selector .meta').first().before(makeScreenPreview(screen));
};

now.screenChanged = function(screen) {
  console.log("Changing screen: " + JSON.stringify(screen));
  $('#screen-{id} .content'.format(screen))
    .html(elementFor(screen.content))
    .data('screen', screen);
};

})();
