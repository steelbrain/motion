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
  return new Promise((resolve) => {
    // callback with no scope
    if (typeof name == 'function') {
      cb = name
      name = scope
      scope = root
    }

    // no scope
    if (!name) {
      name = scope
      scope = root
    }

    if (typeof name != 'string')
      throw "Needs name of event string"

    const finish = () => {
      console.log('finish', name, cb)
      if (cb) cb();
      else resolve()
    }

    if (scope.events && scope.events[name]) {
      scope.events[name].push(finish)
    }
    else
      return scope.addEventListener(name, finish);
  })
}

export default on
