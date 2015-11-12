import ReactDOM from 'react-dom'

function onUnmount(scope, cb) {
  if (!scope || !scope.events) return
  if (!scope.events.unmount) scope.events.unmount = []
  scope.events.unmount.push(cb)
}

function addListener({ root, scope, name, number, cb }) {
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

  if (name == 'frame') {
    let active = true
    let loop = () => requestAnimationFrame(() => {
      cb()
      if (active) loop()
    })
    loop()
    onUnmount(scope, () => active = false)
  }

  const target = (scope || root)
  const listener = target.addEventListener(name, cb)
  const removeListener = target.removeEventListener.bind(null, name, cb)

  return removeListener
}

function removeListener({ scope, name, cb }) {
  if (scope.removeEventListener)
    scope.removeEventListener(name, cb)
}

function ensureQueue(where, ...names) {
  names.forEach(name => {
    where[name] = where[name] || []
  })
}

function getRoot(scope) {
  return ReactDOM.findDOMNode(scope)
}

function hasEvents(events) {
  return events && typeof events.mount != 'undefined' && typeof events.unmount != 'undefined'
}

const viewEvents = ['mount', 'unmount', 'change', 'render', 'props']

function onCb({ view, scope, name, number, cb }) {
  const finish = (...fargs) => cb && cb(...fargs)
  const events = view && view.events

  if (events && viewEvents.indexOf(name) >= 0) {
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
      listener = addListener({ scope, root: getRoot(view), name, number, cb: finish })
    })

    // number = setTimeout = we just push unmount event right in addListener
    if (typeof number == 'undefined') {
      events.unmount.push(() => {
        removeListener({ scope, root: getRoot(view), name, cb: finish })
      })
    }

    return listener
  }

  return addListener({ scope, name, cb: finish })
}

function finish(opts) {
  return opts.cb ? onCb(opts) : new Promise(resolve => onCb({ ...opts, cb: resolve }))
}

function On(view) {
  this.run = (name, scope, cb) => {
    // delay/every
    if (name == 'delay' || name == 'every') {
      let number = scope
      scope = view
      return finish({ scope, name, number, cb })
    }

    // callback with no scope
    else if (typeof scope == 'function') {
      cb = scope
      scope = root
    }

    if (typeof name != 'string')
      throw new Error("When using on(), you must pass a name, like on('scroll')")

    return finish({ scope, name, cb, view })
  }
}

root.On = On//TODO

const proto = name => {
  On.prototype[name] = function(scope, cb, number) {
    this.run(name, scope, cb, number)
  }
}

// custom events
On.prototype.event = function(name, scope, cb, number) {
  this.run(name, scope, cb, number)
}

// flint
proto('delay')
proto('every')
proto('frame')

proto('mount')
proto('unmount')
proto('change')
proto('render')
proto('props')

// DOM level 2 at most

// mouse
proto('click')
proto('mousedown')
proto('mouseenter')
proto('mouseleave')
proto('mousemove')
proto('mouseover')
proto('mouseout')
proto('mouseup')

// keyboard
proto('keydown')
proto('keypress')
proto('keyup')

// frame/object
proto('abort')
proto('beforeunload')
proto('error')
proto('load')
proto('resize')
proto('scroll')
proto('unload')

// form
proto('blur')
proto('change')
proto('focus')
proto('reset')
proto('select')
proto('submit')

const on = new On()

// TODO shim this outside this file
root.on = on

export default on