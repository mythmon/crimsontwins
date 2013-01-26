var _ = require('underscore');
var uri = require('uri-js');
var http = require('http');
var https = require('https');

var config = require('./config.js');
var utils = require('./utils');
var clientConnection = require('./clientConnection');
var modifiers = require('./modifiers');

var everyone = clientConnection.everyone;

/* Manages clients, screens, and content.
 *
 * - Client: A connected web browser. Shows one or more Screens.
 * - Screen: A place for content to live. Viewed by one or more clients.
 * - Content: A thing shown on a screen.
 */

var screens = [];
var nextScreen = 0;

/* This is a now.js function. */
exports.getScreens = function() {
  return screens;
};

var nextContent = 0;
var contentSet = [];
_.each(config.resetUrls, function(url) {
  contentForUrl(url, Array.prototype.push.bind(contentSet));
});
utils.shuffle(contentSet);

exports.addScreen = function(name) {
  var id = utils.getId();
  var screen = {
    id: id,
    name: name,
    content: null,
    resetId: null
  };
  screens.push(screen);
  cycleScreen(screen.id);
  sendScreenAdded(screen);
};

removeScreen = function(id) {
  var screen = findScreen('id', id);
  if (screen !== undefined) {
    clearTimeout(screen.timeout);
    screens = _.without(screens, screen);
    sendScreenRemoved(screen);
  }
};

findScreen = function(key, value, moveNextScreen) {
  var found, index;
  _.each(screens, function(s, i) {
    if (s[key] === value) {
      found = s;
      index = i;
    }
  });
  if (moveNextScreen && index === nextScreen) {
    nextScreen = (nextScreen + 1) % screens.length;
  }
  return found;
};

cycleScreen = function(screen_id) {
  var screen = findScreen('id', screen_id);
  if (screen === undefined) {
    return;
  }
  screen.content = getDefaultContent();

  sendScreenChanged(screen);

  screen.timeout = setTimeout(cycleScreen.bind(null, screen_id),
    config.resetTime);
};

/* Put new content on the next screen in the line up. */
exports.setUrl = function(url, screenName, callback) {
  var screen;

  if (screens.length === 0) {
    utils.async(callback, {msg: 'No screens.'});
    return;
  }

  if (screenName) {
    screen = findScreen('name', screenName, true);
  }
  // The above loop might fail, so check for that.
  if (screen === undefined) {
    screen = screens[nextScreen];
    nextScreen = (nextScreen + 1) % screens.length;
  }

  contentForUrl(url, function(content) {
    screen.content = content;
    sendScreenChanged(screen);
    clearTimeout(screen.timeout);
    screen.timeout = setTimeout(cycleScreen.bind(null, screen.id),
      config.resetTime);
    utils.async(callback, content);
  });
};

exports.reset = function(screenName) {
  var screen;

  if (screens.length === 0) {
    utils.async(callback, {msg: 'No screens.'});
    return;
  }

  if (screenName) {
    screen = findScreen('name', screenName, true);
  }

  if (screen === undefined) {
    screen = screens[nextScreen];
    nextScreen = (nextScreen + 1) % screens.length;

    _.each(screens, function(screen) {
      screen.content = getDefaultContent();
      sendScreenChanged(screen);
    });
  } else {
    screen.content = getDefaultContent();
    sendScreenChanged(screen);
  }
};

function getDefaultContent() {
  var content = contentSet[nextContent];
  if (++nextContent >= contentSet.length) {
    utils.shuffle(contentSet);
    nextContent = 0;
  }
  return content;
}

function contentForUrl(url, callback) {
  if (url.indexOf('://') === -1) {
    url = 'http://' + url;
  }

  var components = uri.parse(url);
  if (components.errors.length) {
    utils.async(callback, {
      message: "We couldn't parse a url from that."
    });
    return;
  }
  if (components.host === undefined) {
    utils.async(callback, {
      message: "Couldn't load URL. (Maybe a bad redirect?)"
    });
  }

  for (var i=0; i < modifiers.all.length; i++) {
    var out = modifiers.all[i]({url: url, components: components});
    if (out) {
      utils.async(callback, out);
      return;
    }
  }

  var path = components.path;
  if (components.query) {
    path += '?' + components.query;
  }
  var port = components.port;

  var proto = http;
  if (components.scheme === 'https') {
    proto = https;
    port = 443;
  }

  var options = {
    method: 'HEAD',
    host: components.host,
    port: port,
    path: path
  };

  var req = proto.request(options, function(res) {
    var headers = {};
    _.each(res.headers, function(value, key) {
      headers[key.toLowerCase()] = value;
    });
    console.log(url);

    if (res.statusCode >= 300 && res.statusCode < 400) {
      // redirect, handle it.
      console.log('redirect ' + headers.location);
      return contentForUrl(headers.location, callback);
    }

    if (res.statusCode >= 400) {
      utils.async(callback, {
        message: 'There was a problem with the url (' + res.statusCode + ')'
      });
      return;
    }

    var contentType = (headers['content-type'] || '').toLowerCase();
    if (contentType.indexOf('image/') === 0) {
      utils.async(callback, {
        url: url,
        type: 'image'
      });
      return;
    }

    var xframe = (headers['x-frame-options'] || '').toLowerCase();
    if (xframe === 'sameorigin' || xframe === 'deny') {
      utils.async(callback, {
        message: "That site prevents framing. It won't work."
      });
      return;
    }

    utils.async(callback, {type: 'url', url: url});
  });

  req.on('error', function(err) {
    console.log('Problem with HEAD request: ' + err.message);
    // We'll do it live.
    utils.async(callback, {
      type: 'url',
      url: url,
      message: "We're not sure about that, but we'll give it ago."
    });
  });

  req.end();
}

/********** Now.js connections **********/
// Now.js sometimes has some different calling conventions, so translate.

// Screen objects store some things that can't go over the wire. So don't
// include those.
function _getWireSafeScreen(screen) {
  return {
    'id': screen.id,
    'name': screen.name,
    'content': screen.content
  };
}

everyone.now.getScreens = function(callback) {
  var screens = exports.getScreens();
  screens = _.map(screens, _getWireSafeScreen);
  utils.async(callback, screens);
};

everyone.now.addScreen = exports.addScreen;

everyone.now.removeScreen = removeScreen;

function sendScreenAdded(screen) {
  everyone.now.screenAdded(_getWireSafeScreen(screen));
}

function sendScreenChanged(screen) {
  everyone.now.screenChanged(_getWireSafeScreen(screen));
}

function sendScreenRemoved(screen) {
  everyone.now.screenRemoved(_getWireSafeScreen(screen));
}
