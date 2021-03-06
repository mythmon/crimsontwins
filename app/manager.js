var _ = require('lodash');
var events = require('events');
var http = require('http');
var https = require('https');

var promise = require('node-promise');
var uri = require('uri-js');
var Minimatch = require('minimatch').Minimatch;

var config = require('./config');
var modifiers = require('./modifiers');
var utils = require('./utils');


/* class ScreenManager */
function ScreenManager() {
  this.contentManager = new ContentManager();
  this.contentManager.on('loaded', this.onContentLoad.bind(this));

  this.screens = _.map(config.screens, function(name) {
    return new Screen(name);
  });
  this.index = 0;
  this.timeouts = {};

  events.EventEmitter.call(this);
}

ScreenManager.prototype = Object.create(events.EventEmitter.prototype);

ScreenManager.prototype.all = function() {
  var screens = this.screens.slice();
  return screens;
};

ScreenManager.prototype.add = function(name) {
  // duplicate names and empty names are both bad.
  if (!name) return "Error: name can't be empty.";
  if (this.find(name, 'noglob').length > 0) {
    return "Error: Duplicate name {0}".format(name);
  }

  var screen = new Screen(name);
  screen.content = this.contentManager.next();
  this.screens.push(screen);
  this.emit('screenAdded', screen);
  config.screens = _.map(this.screens, function(s) { return s.name; });
  config.save();
};

ScreenManager.prototype.remove = function(name) {
  var screens = this.find(name);
  var self = this;

  if (screens.length > 0) {
    _.each(screens, function(screen) {
      self.screens = _.reject(self.screens, {name: screen.name});
      self.emit('screenRemoved', screen);
    });

    config.screens = _.map(this.screens, function(s) { return s.name; });
    config.save();
  } else {
    return "Error: screen not found.";
  }
};

ScreenManager.prototype.find = function(name, noGlob) {
  var mm, glob, screens = [];

  if (name === undefined) {
    return screens;
  }

  if (noGlob) {
    glob = function(s) {
      return s.toLowerCase() == name.toLowerCase();
    };
  } else {
    mm = new Minimatch(name, {'nocase': true});
    glob = mm.match.bind(mm);
  }

  for (var i = 0; i < this.screens.length; i++) {
    if (glob(this.screens[i].name)) {
      screens.push(this.screens[i]);
    }
  }

  return screens;
};

ScreenManager.prototype.next = function() {
  var screen = this.screens[this.index];
  this.index = (this.index + 1) % this.screens.length;
  return screen;
};

ScreenManager.prototype.sendUrl = function(url, screenName, timeout) {
  var p = new promise.Promise();
  var self = this;

  this.contentManager.contentForUrl(url).then(
    function success(content) {
      var screens = self.find(screenName);

      if (screens.length === 0) {
        screens = [self.next()];
      }

      _.each(screens, function(screen) {
        screen.content = content;
        self.makeTimeout(screen.name, timeout);
        self.emit('screenChanged', screen);
      });

      p.resolve(content);
    },
    function fail(error) {
      p.reject(error);
    }
  );

  return p;
};

ScreenManager.prototype.onContentLoad = function(first_argument) {
  var self = this;
  var skew = config.resetTime;
  var skewIncr = config.resetTime / this.screens.length;

  _.each(this.screens, function(screen) {
    if (screen.waiting) {
      screen.waiting = false;
      screen.content = self.contentManager.next();
      self.emit('screenChanged', screen);

      // ensure all screens don't change at once
      self.makeTimeout(screen.name, skew);
      skew += skewIncr;
    }
  });
};

ScreenManager.prototype.cycleScreen = function(name) {
  var self = this;
  _.each(this.find(name), function(screen) {
    screen.content = self.contentManager.next();
    self.emit('screenChanged', screen);
    self.makeTimeout(screen.name);
  });
};

/* Set a timeout to change a screen named `name` to a default url in
 * time` milliseconds. */
ScreenManager.prototype.makeTimeout = function(name, time) {
  var oldTimeout = this.timeouts[name];
  if (time === undefined || isNaN(time)) {
    time = config.resetTime;
  }

  if (oldTimeout) {
    clearTimeout(oldTimeout);
  }

  if (time > -1) {
    this.timeouts[name] = setTimeout(this.cycleScreen.bind(this, name), time);
  }
};

ScreenManager.prototype.reset = function(screenName) {
  var screens, self = this;

  if (screenName) {
    screens = this.find(screenName);
  } else {
    screens = this.screens;
  }

  _.each(screens, function(s) {
    s.content = self.contentManager.next();
    self.emit('screenChanged', s);
  });
};
/* end ScreenManager */


/* class Screen */
function Screen(name) {
  this.name = name;
  this.id = utils.getId();
  this.content = {type: 'html', content: '<div>Loading...</div>'};
  this.waiting = true;
}
/* end Screen */


/* Class ContentManager */
function ContentManager() {
  this.contentUrls = config.resetUrls;
  this.content = [];
  this.index = 0;
  events.EventEmitter.call(this);
}

ContentManager.prototype = Object.create(events.EventEmitter.prototype);

ContentManager.prototype.load = function() {
  var promises = [];
  var p;
  var self = this;

  this.content = [];
  _.each(this.contentUrls, function(url) {
    p = self.contentForUrl(url);
    promises.push(p);
    p.then(
      function success(c) {
        self.content.push(c);
      },
      function fail(err) {
        console.log('Error loading "{0}": {1}'
                    .format(url, JSON.stringify(err)));
      }
    );
  });

  p = promise.all(promises);
  p.then(this.emit.bind(this, 'loaded'));
  return p;
};

ContentManager.prototype.all = function() {
  return this.content;
};

ContentManager.prototype.next = function() {
  var c = this.content[this.index];
  this.index++;
  if (this.index >= this.content.length) {
    utils.shuffle(this.content);
    this.index = 0;
  }
  return c;
};

ContentManager.prototype.setUrls = function(urls) {
  this.contentUrls = urls;
  config.resetUrls = urls;
  config.save();
  return this.load();
};

ContentManager.prototype.contentForUrl = function(url) {
  var i, p = new promise.Promise();
  var self = this;
  var modified;
  var urlParts, proto, port, path;
  var options, req;

  for (i = 0; i < modifiers.all.length; i++) {
    modified = modifiers.all[i]({url: url});

    if (modified !== undefined) {
      modified.then(p.resolve.bind(p), p.reject.bind(p));
      return p;
    }
  }

  urlParts = uri.parse(url);

  if (urlParts.errors.length) {
    p.reject({
      error: 400,
      message: "Couldn't parse a URL from that ({0})"
               .format(urlParts.errors.join(', '))
    });
    return p;
  }

  proto = urlParts.scheme === 'https' ? https : http;
  port = urlParts.port || (urlParts.scheme === 'https' ? 443 : 80);
  path = urlParts.path;
  if (urlParts.query) {
    path += '?' + urlParts.query;
  }

  options = {
    method: 'HEAD',
    host: urlParts.host,
    port: port,
    path: path
  };

  utils.proxify(options, urlParts.scheme === 'https');

  req = proto.request(options, function success(res) {
    var contentType, headers = {}, xframe;
    var content = {
      url: url,
      type: 'url'
    };

    _.each(res.headers, function(value, key) {
      headers[key.toLowerCase()] = value;
    });

    if (res.statusCode >= 300 && res.statusCode < 400) {
      self.contentForUrl(res.headers.location).then(
        function success(content) {
          p.resolve(content);
        },
        function error(obj) {
          p.reject(obj);
        }
      );
      return;
    }

    if (res.statusCode > 400) {
      p.reject({
        error: res.statusCode,
        message: 'There was a problem with the url ({statusCode})'.format(res)
      });
      return;
    }

    xframe = (headers['x-frame-options'] || '').toLowerCase();
    if (xframe === 'sameorigin' || xframe === 'deny') {
      p.reject({
        error: 403,
        message: "That site prevents framing. It won't work."
      });
      return;
    }

    contentType = (headers['content-type'] || '').toLowerCase();
    if(contentType.indexOf('image/') === 0) {
      content.type = 'image';
    }

    p.resolve(content);
  });

  req.on('error', function(err) {
    console.log('Problem during load: ' + err);
    p.reject({
      error: 500,
      message: err
    });
  });

  req.end();

  return p;
};
/* end ContentManager */


exports.ScreenManager = ScreenManager;
exports.Screen = Screen;
exports.ContentManager = ContentManager;
