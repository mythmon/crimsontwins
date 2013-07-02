(function() {

window.ct = window.ct || {};


ct.Selectors = function(opts) {
  this.elem = opts.elem;
  this.events();
};

ct.Selectors.prototype.getData = function() {
  // Check for an outstanding reqeuest.
  if (this._data) {
    return this._data;
  }
  var d = this._data = $.Deferred();

  var self = this;
  ct.socket.emit('getScreens', null, function(screens) {
    d.resolve(screens);
    this._data = null;
  });

  return this._data;
};

ct.Selectors.prototype.render = function() {
  var self = this;
  var html, $selector;
  this.getData().then(function(screens) {
    _.each(screens, function(screen) {
      var html = ct.template('/fragments/screen_selector.html', {
        screen: screen
      });
      $selector = $(html).data('screen', screen);
      self.elem.append($selector);
    });
  });
};

ct.Selectors.prototype.events = function() {
  var self = this;
  this.elem.on('click', '.preview.screen .content', function(ev) {
    ev.preventDefault();
    self.selectScreen($(this).parent().data('screen'));
    return false;
  });
};

ct.Selectors.prototype.selectScreen = function(screen) {
  var selector = ct.template('fragments/full_screen_content.html', {
    screen: screen
  });
  $('body').append($(selector));

  var hash = '#screen={name}'.format(screen);
  window.history.pushState({screen: screen}, screen.name, hash);
}


var sel = new ct.Selectors({elem: $('.selectors')});
sel.getData();
$(sel.render.bind(sel));

})();
