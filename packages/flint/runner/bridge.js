import path from 'path'
import ws from 'nodejs-websocket'
import log from './lib/log'
import wport from './lib/wport'
import intCache from './cache'
import opts from './opts'

const LOG = 'bridge'

let wsServer
let connected = false
let connections = []
let queue = []

// cache to send on reconnects
// type : str => key : str => messages : arr
let messageCache = {}

function broadcast(data) {
  connections.forEach(conn => {
    conn.sendText(data)
  })
}

function runQueue() {
  if (queue.length && wsServer) {
    queue.forEach(broadcast)
    queue = []
  }
}

function sendInitialMessages(conn) {
  conn.sendText(makeMessage('flint:baseDir', { dir: intCache.baseDir() }))
  conn.sendText(makeMessage('flint:opts', opts()))

  // send cached stuff on connect
  Object.keys(messageCache).forEach(cat => {
    Object.keys(messageCache[cat]).forEach(key => {
      let { type, obj } = messageCache[cat][key]
      message(obj.type || type, obj)
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

export function cache(name, key, obj) {
  log(LOG, 'cache', key, name, obj)
  messageCache[name] = messageCache[name] || {}
  messageCache[name][key] = messageCache[name][key] || []
  messageCache[name][key] = obj
}

export function message(type, obj, cacheKey) {
  log(LOG, type)

  if (cacheKey)
    cache(cacheKey, 'last', { type, obj })

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
on('editor:state', msg => message('editor:state', msg, 'editor:state'))
on('browser', msg => message('browser', msg))

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
