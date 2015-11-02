import path from 'path'
import ws from 'nodejs-websocket'
import log from '../lib/log'
import wport from '../lib/wport'
import cache from '../cache'

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

function sendInitialMessages(conn) {
  conn.sendText(curError)
  // conn.sendText(makeMessage('flint:baseDir', { dir: cache.baseDir() }))
}

function cleanError(obj) {
  obj.error.file = path.relative(cache.baseDir(), obj.error.fileName)
  return obj
}

function makeMessage(type, obj) {
  obj = obj || {}
  obj._type = type
  obj.timestamp = Date.now()

  // formatting
  switch(type) {
    case 'compile:error':
      obj = cleanError(obj)
      break
  }

  let msg = JSON.stringify(obj)

  return msg
}

export function message(type, obj) {
  let msg = makeMessage(type, obj)

  // store last error or success
  if (type.indexOf('compile:error') > 0 || type.indexOf('compile:success') > 0) {
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

export function start() {
  const port = wport()

  wsServer = ws.createServer(conn => {
    connections.push(conn)

    if (curError) {
      sendInitialMessages(conn)
    }

    conn.on('error', err => {})

    if (connected) return
    connected = true
    runQueue()
  }).listen(port)
}

export default { start, message, once }