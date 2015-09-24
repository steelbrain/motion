var WebSocketServer = require('ws').Server
var WSS;
var connected = false;
var queue = [];

function message(type, obj) {
  if (!obj) obj = {};

  obj._type = type;
  obj.timestamp = Date.now();

  // console.log('sending message', type, obj)

  var msg = JSON.stringify(obj);

  if (connected && WSS)
    WSS.broadcast(msg);
  else
    queue.push(msg)
}

function runQueue() {
  if (queue.length && WSS) {
    queue.forEach(function(msg) {
      WSS.broadcast(msg);
    })

    queue = [];
  }
}

module.exports = {
  message: message,
  start: function(port) {
    WSS = new WebSocketServer({ port: port });

    WSS.broadcast = function broadcast(data) {
      WSS.clients.forEach(function each(client) {
        client.send(data);
      });
    }

    WSS.on('connection', function() {
      if (!connected) {
        runQueue()
      }

      connected = true;
    });
  }
}
