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

  const target = (root || scope)
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

function onCb({ scope, name, number, cb }) {
  const finish = (...fargs) => cb && cb(...fargs)
  const events = scope && scope.events

  if (events && ['mount', 'unmount', 'change', 'render', 'props'].indexOf(name) >= 0) {
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
      listener = addListener({ scope, root: getRoot(scope), name, number, cb: finish })
    })

    if (typeof number == 'undefined') // number = setTimeout = we just push unmount event right in addListener
      events.unmount.push(() => {
          removeListener({ scope, root: getRoot(scope), name, cb: finish })
      })

    return listener
  }

  return addListener({ scope, name, cb: finish })
}

function finish(opts) {
  return opts.cb ? onCb(opts) : new Promise(resolve => onCb({ ...opts, cb: resolve }))
}

function On(parentScope) {
  this.run = (name, scope, cb, number) => {
    // delay/every
    if (name == 'delay' || name == 'every') {
      // from view
      if (number) {
        let realCb = number
        number = cb
        cb = realCb
      }
      else {
        number = scope
      }

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
      scope = parentScope || root
    }

    if (typeof name != 'string')
      throw new Error("When using on(), you must pass a name, like on('scroll')")

    return finish({ scope, name, cb })
  }
}

root.On = On//TODO

const proto = name => {
  On.prototype[name] = function(scope, cb, number) {
    this.run(name, scope, cb, number)
  }
}

// custom events
proto('event')

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