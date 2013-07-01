(function() {

function pageInit() {
  makeSelectors();
}


function makeSelectors() {
  var $selectors = $('.selectors');
  console.log($selectors);

  ct.socket.emit('getScreens', null, function(screens) {
    console.log('screens', screens);
    _.each(screens, function(screen) {
      console.log(screen.name);
      var selector = ct.template('/fragments/screen_selector.html', {
        screen: screen
      });
      $selectors.append($(selector).data('screen', screen));
    });

    /*
    $selectors.append(makeScreenPreview({
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


  $selectors.on('click', '.preview.screen .content', function(ev) {
    ev.preventDefault();
    selectScreen($(this).parent().data('screen'));
    return false;
  });
}


function selectScreen(screen) {
  var selector = ct.template('fragments/full_screen_content.html', {
    screen: screen
  });
  $('body').append($(selector));

  var hash = '#screen={name}'.format(screen);
  window.history.pushState({screen: screen}, screen.name, hash);
}

$(pageInit);

})();
