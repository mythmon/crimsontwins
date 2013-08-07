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

CrimsonTwins is a node app, so you'll need a copy of node in your path. Pull
down the repo, install dependencies with npm, edit your configuration, and start
the process. The whole process looks like:

```shell
git checkout git@github.com:mythmon/crimsontwins.git
cd crimsontwins
npm install
cp config.json-dist cp config.json
vi config.json
node crimsontwins.js
```

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
edit it appropriately. The options you can set in this file are:

- `resetUrls` - An array of urls for the default rotation.
- `resetTime` - The time it takes to automatically cycle a screen.
- `screens` - An array of screens to automatically create.
- `web`
  - `host` - The host to bind to.
  - `port` - The port to bind to.

> Warning! This file may be overwritten at run time. Things that can
> change are currently limited to the resetUrls and screens, which are
> editable from the web interface.

Run
===

The main file is `crimsontwins.js`. Run that like

```shell
> node crimsontwins.js
```

If you encounter `warn  - error raised: Error: listen EACCES`, you probably
set a port you don't have access to listen on, such as ports below 1024. You
may need to escalate privileges of the user running the account and execute it as:

```shell
> sudo node crimsontwins.js
```

You should now have a running crimsontwins instance.

Development
===========

Make a feature branch and hack away. When you're ready, open a pull request.
Use `make test` to run tests locally.

Running the IRC bot
===================

We've bundled an IRC bot for issuing commands to the server. The bot is a
separate Node.js app, located at `/ext/chat.js`, and is not required to run or
use the crimsontwins server. It may eventually graduate to its own repo.

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
> export CT_IRC_SERVER=irc.server.org
> export CT_IRC_NICK=crimsontwins
> export CT_IRC_CHANNELS='#foo,#bar'
> export CT_API_URL=http://myct.example.com
> node ext/chat.js
```

API
---

Your CrimsonTwins instance will expose an API that can be directly queried by
external tools and services.

`GET /api/ping`

Returns "pong". Useful as a heartbeat monitor or general sanity check.

---

`POST /api/sendurl`
```
params: timeout    - an integer for how long to keep this on the page
        screenName - the name of the screen that should display the content
                     (optional)
        url        - the url to display (http and all)
```

Send a particular url to a particular CT screen

---

`GET /api/config`

Returns the current configuration of the server.
This is probably onl useful for debugging.

---

`GET /api/staticpath`

Returns the file system path of crimsontwins's static assets.
This is probably onl useful for debugging.

---

`GET /api/env`

Returns the crimsontwin's process environment.
This is probably onl useful for debugging.
