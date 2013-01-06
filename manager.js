var _ = require('underscore');

var utils = require('./utils');

/* Class Manager
 *
 * Manages clients, screens, and content.
 *
 * - Client: A connected web browser. Shows one or more Screens.
 * - Screen: A place for content to live. Viewed by one or more clients.
 * - Content: A thing shown on a screen.
 */
function Manager(options) {
    _.extend(this, {
    }, options, {
        clients: [],
        screens: []
    });
}

Manager.prototype.addClient = function(client) {
    this.clients.push(client);
};

/* This is a now.js function. */
Manager.prototype.getScreens = function(callback) {
    var screens = [
        {
            title: "Tomax",
            content: {type: 'image', url: '/img/nope.gif'}
        },
        {
            title: "Xomat",
            content: {type: 'url', url: 'http://scrumbu.gs/t/james-rifles/2012.23/'}
        },
        {
            title: "PDX",
            content: {type: 'image', url: 'https://gs1.wac.edgecastcdn.net/8019B6/data.tumblr.com/tumblr_lxqes0ox2J1r5691eo1_400.gif'}
        }
    ];
    if (callback === undefined) {
        return screens;
    }
    utils.async(callback, screens);
};

exports.Manager = Manager;
