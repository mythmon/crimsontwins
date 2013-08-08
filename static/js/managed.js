(function() {

var socket;

// Trigger DOM ready event.
$(ready.bind(window, 'dom'));

function init() {
  $(window).on('resize', resize);
  resize();

  $(document).keyup(function(e) {
    if (e.keyCode == 27) { // Esc
      window.location.reload();
    }
  });

  makeSelectors();
  makeAdmin();
  makeConnectionStatus();
  makeFullScreen();
}

// When all readyParts are reported as ready, call init().
var readyParts = ['dom', 'socket'];
function ready(part) {
  if (readyParts.indexOf(part) >= 0) {
    readyParts = _.without(readyParts, part);
    if (!readyParts.length) {
      init();
    }
  }
}

function elementFor(content) {
  if (content === undefined) {
    return $('<div>');
  }
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

function resize() {
  $('.wrap').css({
    width: window.innerWidth,
    height: window.innerHeight
  });
}

function makeSelectors() {
  $('.wrap, .selector').remove();
  var $selector = $('<div>', {'class': 'selector'});
  var $selectorUl = $('<ul>');

  $selector.append('<h1>Select a screen to view</h1>');
  $selector.append($selectorUl);

  socket.emit('getScreens', null, function(screens) {
    _.each(screens, function(screen) {
      console.log(screen);
      $selectorUl.append(makeScreenPreview(screen));
    });

    $selectorUl.append(makeScreenPreview({
        name: 'New screen',
        content: {type: 'html', html: '<i class="add">'}
      }, false)
      .addClass('meta')
      .on('click', function(ev) {
        console.log('new clicked');
        ev.preventDefault();
        var name = prompt('Screen name?');
        socket.emit('addScreen', name);
      }));

    /*
    $selectorUl.append(makeScreenPreview({
        name: 'Hydra mode',
        content: {type: 'html', html: '<i class="hydra">'}
      }, false)
      .addClass('meta')
      .on('click', function(ev) {
        ev.preventDefault();
        console.log('hyrda clicked');
      }));
    */

  });

  $('body').append($selector);
}

var screenPreviewTemplate =
  '<li class="preview screen">' +
    '<h1>{name}</h1>' +
    '<div class="content"/>' +
  '</li>';

function makeScreenPreview(screen, events) {
  if (events === undefined) {
    events = true;
  }
  var $elem = $(screenPreviewTemplate.format(screen))
    .data('screen', screen)
    .attr('name', screen.name);
  if (events) {
    $elem.find('.content').on('click', function(ev) {
      ev.preventDefault();
      console.log('clicked on a screen');
      selectScreen($(this).parent());
    });
    $elem.find('h1').append(
      $('<button class="close">X</button>')
        .on('click', function() {
          console.log('removing screen');
          socket.emit('removeScreen', screen.name);
        }));
  }
  $elem.children('.content').html(elementFor(screen.content));
  return $elem;
}

var selectedScreenTemplate =
  '<div class="overlay screen" name="{name}">' +
    '<div class="content"></div>' +
    '<div class="meta">' +
      '<span class="name">{name}</span>' +
      '<span class="url">{content.url}</span>' +
    '</div>' +
  '</div>';

function selectScreen($elem) {
  var screen = $elem.data('screen');
  $wrap = $(selectedScreenTemplate.format(screen))
    .find('.content').html(elementFor(screen.content)).end()
    .css({
      width: window.innerWidth,
      height: window.innerHeight
    });

  $('body').append($wrap);

  var hash = '#screen={name}'.format(screen);
  window.history.pushState({screen: screen}, screen.name, hash);
}


var adminTemplate =
  '<div class="admin">' +
    '<h1>Admin</h1>' +
    '<div class="contentUI">' +
      '<h2>Default Content</h2>' +
      '<ul></ul>' +
      '<button class="add">Add</button>' +
      '<button class="save">Save</button>' +
    '</div>' +
    '<p>Press F after selecting a screen for full screen mode.</p>' +
  '</div>';

var contentRowTemplate =
  '<li class="content-row">' +
    '<button class="remove">Remove</button>' +
    '<input type="text" name="url" value="{url}" />' +
  '</li>';


function makeAdmin() {
  $('.admin').remove();
  var $admin = $(adminTemplate);

  var $contentUl = $admin.find('.contentUI ul');
  socket.emit('getContentSet', null, function(contentSet) {
    _.each(contentSet, function(content) {
      $contentUl.append($(contentRowTemplate.format(content)));
    });
  });

  $admin.on('click', '.contentUI .content-row .remove', function(ev) {
    $(this).parent().remove();
  });
  $admin.on('click', '.contentUI .add', function(ev) {
    $(this).siblings('ul').append(contentRowTemplate.format({url: ''}));
  });
  $admin.on('click', '.contentUI .save', function(ev) {
    var urls = [];
    $(this).siblings('ul').children('li').each(function() {
      var url = $(this).find('input[name=url]').val();
      if (url.length) {
        urls.push(url);
      }
    });
    console.log(urls);
    socket.emit('setContentSetUrls', urls);
  });

  $('body').append($admin);
}

function makeConnectionStatus() {
  $('<span />')
    .text('No connection')
    .attr('id', 'connection-status')
    .appendTo('body');
}

function makeFullScreen() {
  function requestFullscreen(elem) {
    (elem.requestFullscreen ||
     elem.mozRequestFullScreen ||
     elem.webkitRequestFullScreen).call(elem, Element.ALLOW_KEYBOARD_INPUT);
  }

  $(document).on('keydown', function(e) {
    if (e.keyCode === 70) {
      var elem = $('.overlay')[0];
      if (elem) {
        requestFullscreen(elem);
      }
    }
  });
}

window.onpopstate = function(ev) {
  var $elem;
  if (!ev.state) {
    $elem = [];
  } else {
    $elem = $('.preview[name="{name}"]'.format(ev.state.screen));
  }

  if ($elem.length > 0) {
    selectScreen($elem.first());
  } else {
    makeSelectors();
  }
};

/* Socket.IO connections */
socket = io.connect('/');

socket.on('connect', function() {
  console.log('connected');
  $('#connection-status').hide();
});

socket.on('disconnect', function(screen) {
  console.log('disconnected');
  $('#connection-status').show();
});

socket.on('reset', function() {
  console.log('reset');
  window.location.reload();
});

socket.on('screenAdded', function(screen) {
  console.log('screenAdded ' + JSON.stringify(screen));
  $('.selector .meta').first().before(makeScreenPreview(screen));
});

socket.on('screenChanged', function(screen) {
  console.log("screenChanged " + JSON.stringify(screen));
  $preview = $('.screen[name="{name}"]'.format(screen));
  $preview.find('.content').html(elementFor(screen.content));
  $preview.find('.meta .url').text(screen.content.url);
  $preview.data('screen', screen);
});

socket.on('screenRemoved', function(screen) {
  console.log('screenRemoved ' + JSON.stringify(screen));
  var makeIt = false;
  if ($('wrap.screen[name="{name}"]'.length > 0)) {
    makeIt = true;
  }
  $('.screen[name="{name}"]'.format(screen)).remove();
  if (makeIt) {
    makeSelectors();
  }
});

ready('socket');

})();
