function onUnmount(scope, cb) {
  if (!scope || !scope.events) return
  if (!scope.events.unmount) scope.events.unmount = []
  scope.events.unmount.push(cb)
}

function addListener({ scope, name, number, cb }) {
  if (name == 'delay') { // on('delay', 400, cb)
    let timer = setTimeout(cb, number)
    onUnmount(scope, () => clearTimeout(timer))
    return
  }

  if (name == 'every') { // on('every', 20, cb)
    let interval = setInterval(cb, number)
    onUnmount(scope, () => clearInterval(interval))
    return
  }

  return scope.addEventListener(name, cb)
}

function removeListener({ scope, name, cb }) {
  scope.removeEventListener(name, cb)
}

function ensureQueue(where, ...names) {
  names.forEach(name => {
    where[name] = where[name] || []
  })
}

function getRoot(scope) {
  return scope.refs.view
}

function hasEvents(events) {
  return events && typeof events.mount != 'undefined' && typeof events.unmount != 'undefined'
}

function onCb({ scope, name, number, cb }) {
  const finish = (...fargs) => cb && cb(...fargs)
  const events = scope && scope.events

  if (events && ['mount', 'unmount', 'change', 'render'].indexOf(name) >= 0) {
    if (events && events[name] != 'undefined') {
      ensureQueue(events, name)
      events[name].push(finish)
      return
    }
  }

  // if inside parent with mount/unmount events, do auto
  if (hasEvents(events)) {
    ensureQueue(events, 'mount', 'unmount')

    let listener

    events.mount.push(() => {
      listener = addListener({ scope: getRoot(scope), name, number, cb: finish })
    })

    if (typeof number == 'undefined') // number = setTimeout = we just push unmount event right in addListener
      events.unmount.push(() => {
          removeListener({ scope: getRoot(scope), name, cb: finish })
      })

    return listener
  }

  return addListener({ scope, name, cb: finish })
}

function on(scope, name, cb, number) {
  // dynamic arguments

  // delay/every
  if (name == 'delay' || name == 'every') {
    // swap
    let realCb = number
    number = cb
    cb = realCb
    return finish({ scope, name, number, cb })
  }

  // callback with no scope
  else if (typeof name == 'function') {
    cb = name
    name = scope
    scope = root
  }

  // no scope
  else if (typeof name == 'undefined') {
    name = scope
    scope = root
  }

  if (typeof name != 'string')
    throw new Error("When using on(), you must pass a name, like on('scroll')")

  return finish({ scope, name, cb })
}

function finish(opts) {
  return opts.cb ? onCb(opts) : new Promise(resolve => onCb({ ...opts, cb: resolve }))
}

// TODO shim this outside this file
root.on = on

export default on