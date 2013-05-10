var socketio = require('socket.io');
var web = require('./web');

var io = socketio.listen(web.server);
io.set('log level', 2);

exports.io = io;