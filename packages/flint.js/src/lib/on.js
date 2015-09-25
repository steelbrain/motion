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

const on = (scope, name) =>
  new Promise((resolve) => {
    if (!scope) scope = root
    if (typeof name != 'string') throw "Needs name of event string"

    if (scope.events && scope.events[name]) {
      scope.events[name].push(resolve)
      return
    }

    return scope.addEventListener(name, resolve);
  })

export default on
