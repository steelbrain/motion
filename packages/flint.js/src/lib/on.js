const inBrowser = typeof window != 'undefined'
const root = inBrowser ? window : global

const listeners = {};
const events = {};

function addListener(name, target, cb) {
  if (!listeners[name]) {
    listeners[name] = target['addEventListener'](name, () => {
      cb()
    })
  }
}

const on = (scope, name, cb) => {
  if (!scope) scope = root
  if (typeof cb != 'function') throw "Needs callback function"
  if (typeof name != 'string') throw "Needs name of event string"

  if (scope.events && scope.events[name]) {
    scope.events[name].push(cb)
    return
  }

  return scope.addEventListener(name, cb);
}

export default on
