if(!nunjucks.env) {
    // If nunjucks is precompiled, env will exist. If not, it needs created.
    nunjucks.env = new nunjucks.Environment(new nunjucks.HttpLoader('/templates'));
}
var template = nunjucks.env.render.bind(nunjucks.env);

var App = {
  views: {}
};

CTRouter = Backbone.Router.extend({
  routes: function() {
    var activeView = null;

    function v(name) {
      return App.views[name].activate.bind(App.views[name]);
    }

    return {
      "admin": v('admin'),
      "selector": v('screenSelectors'),
      // "": v('screenSelectors')
    };
  }
});


var SocketIOCollection = Backbone.Collection.extend({
});


var ScreenModel = Backbone.Model.extend({
});

var ScreensCollection = Backbone.Collection.extend({
  model: ScreenModel,

  fetch: function(options) {
    var self = this;

    this.trigger('request');

    socket.emit('getScreens', null, function(screens) {
      self.reset(screens);
      self.trigger('sync', self, this, options);
    });
  }
});


var MainView = {
  extend: function(view) {
    var combined = _.extend({}, MainView.view, view);
    if (view.defaults) {
      combined.defaults = _.extend({}, MainView.view.defaults, view.defaults);
    }
    return Backbone.View.extend(combined);
  },

  view: {
    defaults: {
      template: null,
      active: false
    },

    render: function() {
      if (!this.active) {
        console.log('skipping cause active is', this.active);
        return;
      }

      console.log('rendering', this.template);

      var tmpl
      this.$el.html(nunjucks.env.render(this.template, this.context()));
    },

    context: function() {
      return {};
    },

    activate: function() {
      _.invoke(App.views, 'deactivate');
      console.log(this.template, 'activate');
      this.active = true;
      this.render();
    },

    deactivate: function() {
      console.log(this.template, 'deactivate');
      this.active = false;
    }
  }
};

var AdminView = MainView.extend({
  template: 'admin.html'
});

var ScreenSelectorsView = MainView.extend({
  initialize: function() {
    this.collection.on('change reset set add', this.render.bind(this));
  },

  template: 'screenSelectors.html',

  context: function() {
    return {
      screens: _.pluck(this.collection.toArray(), 'attributes')
    };
  }
});


var socket = io.connect('/');

$(function init() {
  var screens = new ScreensCollection();

  App.views.admin = new AdminView({
    el: '#main'
  });

  App.views.screenSelectors = new ScreenSelectorsView({
    el: '#main',
    collection: screens
  });

  screens.fetch();

  App.router = new CTRouter();

  Backbone.history.start({pushState: true});
});
