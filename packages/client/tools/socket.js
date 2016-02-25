import { favicon } from './favicon'

let opts
let browser
let actions

let isOpening = false
let isOpen = false
let ws = null

export default function socket(_browser, _opts, _actions) {
  opts = _opts
  browser = _browser
  actions = _actions
  open()

  browser.messageEditor = obj => {
    socket.send('broadcast:editor', obj)
  }
}

socket.send = function send(type, obj) {
  obj = obj || {}
  obj._type = type
  ws.send(JSON.stringify(obj))
}

function open() {
  if (isOpening) return
  isOpening = true

  ws = new WebSocket('ws://localhost:' + opts.websocketPort + '/')
  ws.onopen = onOpen
  ws.onmessage = onMessage
  ws.onerror = reconnect
  ws.onclose = reconnect
}

function onOpen() {
  isOpen = true
  isOpening = false
  reconnecting = false
  favicon.good()
}

function onMessage(message) {
  message = JSON.parse(message.data)
  if (localStorage.getItem('__motionLog'))
    console.log('socket', 'onMessage', 'message', message && message._type, message)

  if (!message) return

  const action = actions[message._type]
  if (action) action(message)

  browser.data = message
  browser.emitter.emit(message._type)
}

let tries
let reconnecting = false

function reconnect() {
  favicon.off()
  isOpening = false
  isOpen = false

  if (ws) ws.close()
  if (reconnecting) return
  reconnecting = true
  tries = 0
  reconnector()
}

function reconnector() {
  if (isOpen || tries > 50) return

  open()

  // delay more and more in between
  tries++
  let delay = tries * 1000
  setTimeout(reconnector, delay)
}
