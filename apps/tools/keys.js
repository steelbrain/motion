import keycode from 'keycode'

export let keys = {}
let listeners = {}
let pressListeners = {}

on.keydown(window, e => {
  const code = keycode(e.keyCode)
  keys[code] = true
  keyDown(code)
})

on.keyup(window, e => {
  const code = keycode(e.keyCode)
  keys[code] = false
  keyUp(code)
})

on.keypress(window, e => {
  const code = keycode(e.keyCode)
  const queue = pressListeners[code]
  queue && queue.forEach(listener => listener())
})

function keyDown(code) {
  if (!listeners[code]) return
  listeners[code].forEach(listener => listener(true))
}

function keyUp(code) {
  if (!listeners[code]) return
  listeners[code].forEach(listener => listener(false))
}

export function onKey(code, fn) {
  listeners[code] = listeners[code] || []
  listeners[code].push(fn)
}

export function onKeyPress(code, fn) {
  pressListeners[code] = pressListeners[code] || []
  pressListeners[code].push(fn)
}

export function onKeyDown(code, fn) {
  onKey(code, val => val && fn())
}