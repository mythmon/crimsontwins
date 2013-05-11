var socketio = require('socket.io');
var web = require('./web');

function getIO() {
  var io = socketio.listen(web.server);
  io.set('log level', 2);
  return io;
}

exports.getIO = getIO;