export let keys = {}
let listeners = {}

on.keydown(window, e => {
  const code = ___keycode(e.keyCode)
  keys[code] = true
  keyDown(code)
})

on.keyup(window, e => {
  const code = ___keycode(e.keyCode)
  keys[code] = false
  keyUp(code)
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