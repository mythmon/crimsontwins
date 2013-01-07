var _ = require('underscore');

var config = require('./config.js');
var utils = require('./utils');
var clientConnection = require('./clientConnection');

var everyone = clientConnection.everyone;

/* Manages clients, screens, and content.
 *
 * - Client: A connected web browser. Shows one or more Screens.
 * - Screen: A place for content to live. Viewed by one or more clients.
 * - Content: A thing shown on a screen.
 */

var clients = [];
var screens = [];

var addClient = function(client) {
  clients.push(client);
};

/* This is a now.js function. */
var getScreens = function() {
  return screens;
};


var nextContent = 0;
var contentSet = [
  {type: 'url', url: 'http://wikipedia.org'},
  {type: 'image', url: '/img/nope.gif'},
  {type: 'image', url: 'http://i.imgur.com/46xWL.gif'},
  {type: 'image', url: 'https://s3.amazonaws.com/data.tumblr.com/tumblr_lxf2q5Rdcz1r1ibsxo1_500.gif'},
  {type: 'image', url: 'https://images.4chan.org/wsg/src/1357060530091.gif'},
];

var addScreen = function(name) {
  var screen = {
    id: utils.getId(),
    name: name,
    content: contentSet[nextContent]
  };
  nextContent = (nextContent + 1) % contentSet.length;
  screens.push(screen);
  everyone.now.screenAdded(screen);
};

/********** Now.js connections **********/
// Now.js sometimes has some different calling conventions, so translate.
everyone.now.addClient = function() {
  addClient(this);
};

everyone.now.getScreens = function(callback) {
  var screens = getScreens();
  utils.async(callback, screens);
};

everyone.now.addScreen = function(name) {
  addScreen(name);
};

everyone.now.changeScreen = function(name) {
  var screen;
  _.each(screens, function(s) {
    if (s.name === name) {
      screen = s;
    }
  });
  if (screen !== undefined) {
    screen.content = contentSet[nextContent];
    nextContent = (nextContent + 1) % contentSet.length;
    everyone.now.screenChanged(screen);
  }
};
