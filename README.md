CrimsonTwins
============

Mozilla WebDev recently got two big wall mounted screens for our nefarious
uses. We decided they should show some useful information, and be a source of
irc-based mayem. This is a Node.js app that starts and IRC bot and a HTTP
server, including a Now.js socket layer.

The main page served to the browser opens a now.js listener, and waits for
events from the server. The bot triggers events when the denizens of IRC tell
it URLs of images, websites, and hilarious Youtube videos. It relays these,
through Now.js, to the front end. The front end then dynamically loads the
content, either into an iframe, or, in the case of images, into a div's
background.

A second page is provided, called Hydra. Hydra will take URL parameters for 'x'
and 'y', and then build a grid of the main page tiled across the page. This is
useful if the screens on the wall are two or monitors all controlled from a
single browser, like we plan to do.
