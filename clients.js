var socketio = require('socket.io');

var web = require('./web');

exports.io = socketio.listen(web.server);