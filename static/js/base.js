(function() {

window.ct = window.ct || {};

if(!nunjucks.env) {
    // If nunjucks is precompiled, env will exist. If not, it needs created.
    nunjucks.env = new nunjucks.Environment(new nunjucks.HttpLoader('/templates'));
}
var template = window.ct.template = nunjucks.env.render.bind(nunjucks.env);

var socket = window.ct.socket = io.connect('/');

function init() {
  // $(window).on('resize', resizeHandler);
  // resizeHandler();

  $(document).keyup(function(e) {
    if (e.keyCode == 27) { // Esc
      window.location.reload();
    }
  });

  // makeSelectors();
  // makeAdmin();
  // makeConnectionStatus();
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

// function resizeHandler() {
//   $('.wrap').css({
//     width: window.innerWidth,
//     height: window.innerHeight
//   });
// }



var adminTemplate =
  '<div class="admin">' +
    '<h1>Admin</h1>' +
    '<div class="contentUI">' +
      '<h2>Default Content</h2>' +
      '<ul></ul>' +
      '<button class="add">Add</button>' +
      '<button class="save">Save</button>' +
    '</div>' +
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

$(init);

})();
