CrimsonTwins
============

[![Build Status](https://travis-ci.org/mythmon/crimsontwins.png?branch=master)](https://travis-ci.org/mythmon/crimsontwins)

Mozilla WebDev recently got two big wall mounted screens for our nefarious
uses. We decided they should show some useful information, and be a source of
irc-based mayem. This is a Node.js app that starts an IRC bot and a HTTP
server, including a Socket.IO layer.

The main page served to the browser opens a Socket.IO listener, and waits for
events from the server. The bot triggers events when the denizens of IRC tell
it URLs of images, websites, and hilarious Youtube videos. It relays these
to the front end. The front end then dynamically loads the content onto the
display. Content is loaded, without refreshing the page, via iframes or other
methods.

A second page is provided, called Hydra. Hydra will take URL parameters for 'x'
and 'y', and then build a grid of the main page tiled across the page. This is
useful if you want to give the impression of multiple screens on a single
monitor.

Installation
============

Crimsontwins is a Node.js application. That should tell you a lot about how to
run it.

Requirements
------------

Dependencies are listed in ``package.json``. You can install everything
automatically with:

```shell
> npm install
```

Configuration
-------------

You'll need to configure things. Copy `config.json-dist` to `config.json`, and
edit it appropriately. Things you will probably want to change are:

- `irc`
    - `server` - The IRC server to connect to.
    - `nick` - The name the bot should use.
    - `channels` - An array of channels to join.
- `resetUrls` - An array of urls for the default rotation.

> Warning! This file may be overwritten at run time. Things that can change are
> currently limited to the resetUrls, which are editable from the web
> interface. If this is a problem, be sure to make a backup of the config file.

Run
===

The main file is `crimsontwins.js`. Run that like

```shell
> node crimsontwins.js
```

You should now have a running crimsontwins instance.

Development
===========

Make a feature branch and hack away. When you're ready, open a pull request. Use `make test` to run tests locally.


Running the IRC bot
===================

The bot is a separate Node.js app, located at /ext/chat.js. It might
eventually graduate to its own repo, but it's bundled for now.

Configuration
-------------

The bot doesn't read from the same config file as the main app. You'll need to
set some environment variables:

* `CT_IRC_SERVER` - IRC server name
* `CT_IRC_NICK` - IRC bot's nick
* `CT_IRC_CHANNELS` - comma-separated list of IRC channels
* `CT_API_URL` - Crimsontwins URL

Run
---

Here's an example:

```shell
> CT_IRC_SERVER=irc.server.org CT_IRC_NICK=crimsontwins \
  CT_IRC_CHANNELS=#foo,#bar CT_API_URL=http://myct.example.com node ext/chat.js
```
