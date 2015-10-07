import ws from 'nodejs-websocket'

let wsServer
let connected = false
let queue = []

function broadcast(data) {
  wsServer.connections.forEach(conn => {
    conn.sendText(data)
  })
}

function runQueue() {
  if (queue.length && wsServer) {
    queue.forEach(broadcast)
    queue = [];
  }
}

export function message(type, obj) {
  obj = obj || {}
  obj._type = type
  obj.timestamp = Date.now()

  let msg = JSON.stringify(obj)

  if (connected && wsServer) {
    broadcast(msg)
  }
  else
    queue.push(msg)
}

// receive a message one time
export function once(type, cb) {
  let recieved = false

  wsServer.connections.forEach(conn => {
    conn.on('data', message => {
      if (message.type != type) return
      if (recieved) return
      recieved = true
      cb(message)
    })
  })
}

export function start(port) {
  wsServer = ws.createServer(conn => {
    conn.on('error', err => {
      // console.log(err)
    })

    if (connected) return
    connected = true
    runQueue()
  }).listen(port)
}

export default { start, message, once }