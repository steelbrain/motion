import ws from 'nodejs-websocket'
import log from '../lib/log'

let wsServer
let connected = false
let connections = []
let queue = []
let curError = null

function broadcast(data) {
  connections.forEach(conn => {
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

  // store last error or success
  if (type.indexOf(':error') > 0 || type.indexOf(':success') > 0) {
    curError = msg
  }

  log('-[socket msg]-', msg)

  if (connected)
    broadcast(msg)
  else
    queue.push(msg)
}

// receive a message one time
export function once(type, cb) {
  let recieved = false

  connections.forEach(conn => {
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
    connections.push(conn)

    if (curError) {
      conn.sendText(curError)
    }

    conn.on('error', err => {})

    if (connected) return
    connected = true
    runQueue()
  }).listen(port)
}

export default { start, message, once }