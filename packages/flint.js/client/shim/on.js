import ReactDOM from 'react-dom'

// ok delayed attempt to make sense of this
// this file needs refactor love
// start from bottom and read to top:
// function On()
//   => this.run
//   => finish
//   => onEventInit
//   => addListener

const viewEvents = ['mount', 'unmount', 'change', 'render', 'props']

// starts a listener
// returns the off event to remove the listener
// TODO split this into individual functions for each type
function addListener({ rootNode, scope, name, number, cb, uid }) {
  if (name == 'delay') { // on('delay', 400, cb)
    let timer = setTimeout(cb, number)
    return () => clearTimeout(timer)
  }

  if (name == 'every') { // on('every', 20, cb)
    let interval = setInterval(cb, number)
    return () => clearInterval(interval)
  }

  if (name == 'frame') {
    let active = true
    let loop = () => requestAnimationFrame(() => {
      cb()
      if (active) loop()
    })
    loop()
    return () => active = false
  }

  const target = (scope || rootNode || window)

  // this will pass data automatically for custom on.event
  const smartCb = (e) => {
    const isCustom = typeof e == 'object' && typeof e.detail == 'object'
    cb(isCustom ? e.detail : e)
  }

  target.addEventListener(name, smartCb)

  // return off event
  return () => target.removeEventListener(name, smartCb)
}

function onEventInit({ view, scope, name, number, cb }) {
  const finish = (...fargs) => cb && cb(...fargs)
  const events = view && view.events

  if (events && viewEvents.indexOf(name) >= 0) {
    if (events && events[name] != 'undefined') {
      ensureQueue(events, name)
      events[name].push(finish)
      return
    }
  }

  // if not in view
  if (!hasEvents(events)) {
    return addListener({ scope, name, cb: finish })
  }

  // if inside view
  ensureQueue(events, 'mount', 'unmount')
  // to return
  let result

  let eventFn = uid => {
    let rootNode = getRoot(view)
    removeByUids[uid] = addListener({ scope, rootNode, name, number, cb: finish })
    return removeByUids[uid]
  }

  // attach to mount depending
  if (view.mounted)
    result = eventFn()
  else {
    let uid = getUid()
    events.mount.push(() => eventFn(uid))
    result = unlistenFromUid(uid)
  }

  // unmount push
  events.unmount.push(result)

  return result
}

function On(view) {
  this.run = (name, scope, cb) => {
    // delay/every
    if (name == 'delay' || name == 'every') {
      let number = scope
      return finish({ view, name, number, cb })
    }

    // callback with no scope
    else if (typeof scope == 'function') {
      cb = scope
      scope = null
    }

    if (typeof name != 'string')
      throw new Error("When using on(), you must pass a name, like on('scroll')")

    return finish({ scope, name, cb, view })
  }

  function finish(opts) {
    return opts.cb
      ? onEventInit(opts)
      : new Promise(resolve => onEventInit({ ...opts, cb: resolve }))
  }
}

// TODO not on global
root.On = On

const proto = name => {
  On.prototype[name] = function(scope, cb, number) {
    return this.run(name, scope, cb, number)
  }
}

// custom events
On.prototype.event = function(name, scope, cb, number) {
  // firing
  if (typeof scope == 'undefined' || typeof scope == 'object') {
    let event = new CustomEvent(name, scope ? { detail: scope } : null)
    return window.dispatchEvent(event)
  }

  // firing on custom scope
  if (typeof scope != 'function' && typeof cb == 'function') {
    console.error('we need to implement custom scoped events still :)')
    return
  }

  // listening
  if (typeof scope == 'function') {
    return this.run(name, window, scope)
  }

  throw new Error("You called an event without name or scope!")
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

// touch
proto('touchdown')
proto('touchenter')
proto('touchleave')
proto('touchmove')
proto('touchout')
proto('touchup')

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



// helpers

let removeByUids = {}
let uid = 0
function getUid() { return uid++ % Number.MAX_VALUE }
function unlistenFromUid(uid) {
  return () => {
    if (removeByUids[uid]) {
      removeByUids[uid]()
    }
    delete removeByUids[uid]
  }
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
  return events && Object.keys(events).length
}
