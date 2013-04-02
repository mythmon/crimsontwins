var now = require('now');
var web = require('./web');
exports.everyone = now.initialize(web.server);
