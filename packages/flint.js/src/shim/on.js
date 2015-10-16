const listeners = {};
const events = {};

function addListener(name, target, cb) {
  if (!listeners[name]) {
    listeners[name] = target['addEventListener'](name, () => {
      cb()
    })
  }
}

const onCb = (scope, name, cb) => {
  const finish = () => cb && cb()

  if (scope.events && scope.events[name] != 'undefined') {
    if (!scope.events[name])
      scope.events[name] = []

    scope.events[name].push(finish)
  }
  else
    return scope.addEventListener(name, finish);
}

const on = (scope, name, cb) => {
  // dynamic arguments

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

  if (cb)
    return onCb(scope, name, cb)
  else
    return new Promise((resolve) => {
      onCb(scope, name, resolve)
    })
}

root.on = on

export default on