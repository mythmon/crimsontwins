CrimsonTwins
============

Mozilla WebDev recently got two big wall mounted screens for our nefarious
uses. We decided they should show some useful information, and be a source of
irc-based mayem. This is a Node.js app that starts an IRC bot and a HTTP
server, including a Socket.IO layer.

The main page served to the browser opens a Socket.IO listener, and waits for
events from the server. The bot triggers events when the denizens of IRC tell
it URLs of images, websites, and hilarious Youtube videos. It relays these
to the front end. The front end then dynamically loads the content onto the
display. Content is loaded iwthout refreshing the page via iframes or other
methods.

A second page is provided, called Hydra. Hydra will take URL parameters for 'x'
and 'y', and then build a grid of the main page tiled across the page.
