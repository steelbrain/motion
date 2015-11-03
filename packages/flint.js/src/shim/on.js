const listeners = {};
const events = {};

function addListener(name, target, cb) {
  if (!listeners[name]) {
    listeners[name] = target['addEventListener'](name, () => {
      cb()
    })
  }
}

function ensureQueue(where, ...names) {
  names.forEach(name => {
    where[name] = where[name] || []
  })
}

function getRoot(scope) {
  return scope.refs.view
}

const onCb = (scope, name, cb) => {
  const finish = () => cb && cb()
  const events = scope.events

  if (!events)
    return scope.addEventListener(name, finish)

  if (['mount', 'unmount', 'change', 'render'].indexOf(name) >= 0) {
    if (events && events[name] != 'undefined') {
      ensureQueue(events, name)
      events[name].push(finish)
      return
    }
  }

  // if inside parent with mount/unmount events, do auto
  if (events && typeof events.mount != 'undefined' && typeof events.unmount != 'undefined') {
    ensureQueue(events, 'mount', 'unmount')

    events.mount.push(() => {
      getRoot(scope).addEventListener(name, finish)
    })

    events.unmount.push(() => {
      getRoot(scope).removeEventListener(name, finish)
    })
  }
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