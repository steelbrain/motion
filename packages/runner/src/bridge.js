import path from 'path'
import ws from 'nodejs-websocket'
import log from './lib/log'
import wport from './lib/wport'
import intCache from './cache'

const LOG = 'bridge'

let wsServer
let connected = false
let connections = []
let queue = []

// cache to send on reconnects
// type : ' => key : ' => messages : []
let messageCache = {
  error: {
    last: []
  },
  editor: {
    viewMeta: []
  }
}

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
  conn.sendText(makeMessage('flint:baseDir', { dir: intCache.baseDir() }))

  // send cached stuff on connect
  Object.keys(messageCache).forEach(cat => {
    Object.keys(messageCache[cat]).forEach(key => {
      let queue = messageCache[cat][key]
      queue.forEach(({ type, obj }) => message(type, obj))
    })
  })
}

function cleanError(obj) {
  if (obj.error.fileName)
    obj.error.file = path.relative(intCache.baseDir(), obj.error.fileName)

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

export function cache(key, type, obj) {
  log(LOG, 'cache', key, type, obj)
  messageCache[type] = messageCache[type] || {}
  messageCache[type][key] = messageCache[type][key] || []
  messageCache[type][key].push({ type, obj })
}

export function message(type, obj) {
  // store last error or success
  if (type == 'compile:error' || type == 'compile:success')
    messageCache.error = [{ type, obj }]

  log(LOG, '-[out]-', type)
  let msg = makeMessage(type, obj)

  if (connected)
    broadcast(msg)
  else
    queue.push(msg)
}

let listeners = {}
export function on(event, cb) {
  listeners[event] = listeners[event] || []
  listeners[event].push(cb)
}

// passes messages from/to browser/editor
on('editor', msg => message('editor', msg))
on('fromEditor', msg => message('fromEditor', msg))


function runListeners(data) {
  log(LOG, '-[in]-', data)

  let obj

  try {
    obj = JSON.parse(data)
  }
  catch(e) {
    console.error(e.stack)
    return
  }

  const { ...args, _type } = obj
  const ls = listeners[_type]
  if (!ls || !ls.length) return
  ls.forEach(l => l(args))
}

export function start() {
  const port = wport()

  wsServer = ws.createServer(conn => {
    connections.push(conn)

    conn.on('text', runListeners)
    conn.on('error', err => {})

    sendInitialMessages(conn)

    if (connected) return
    connected = true
    runQueue()
  }).listen(port)
}

export default { start, message, on, cache }
