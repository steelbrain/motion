import { server as WebSocketServer } from 'websocket'
import http from 'http'

let wsServer, server
let connected = false
let clients = []
let queue = []

function broadcast(data) {
  clients.forEach(client => client.send(data))
}

function runQueue() {
  if (queue.length && wsServer) {
    queue.forEach(broadcast)
    queue = [];
  }
}

export function message(type, obj) {
  if (!connected) return

  obj = obj || {}
  obj._type = type
  obj.timestamp = Date.now()

  let msg = JSON.stringify(obj)
  // console.log('sending message', connected, type, obj)
  if (connected && wsServer)
    broadcast(msg)
  else
    queue.push(msg)
}

// receive a message one time
export function once(type, cb) {
  let recieved = false

  clients.forEach(client => {
    client.on('message', message => {
      if (message.type != type) return
      if (recieved) return
      recieved = true
      cb(message)
    })
  })
}

export function start(port) {
  server = http.createServer((_, res) => res.writeHead(404) && res.end())
  server.listen(port)

  wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: true
  })

  wsServer.on('connect', req => {
    clients.push(req)
    if (connected) return
    connected = true
    runQueue()
  })
}

export default { start, message }