import Route from 'route-parser'
import { createHistory } from 'history'
import internal from '../internal'

let Internal
let history, render
let activeID = 1
let routes = {}
let routesList = []
let params = {}
let location = window.location.pathname
let listeners = []

function runListeners(location) {
  listeners.forEach(listener => {
    listener(location)
  })
}

const router = {
  init(appName, { onChange }) {
    Internal = internal.get(appName)
    render = onChange
    history = createHistory()

    // router updates
    history.listen(location => {
      if (Internal.firstRender) return
      router.go(location.pathname, { dontPush: true })
      runListeners(location)
    })
  },

  onChange(cb) {
    if (typeof cb !== 'function')
      throw new Error('Must provide function to Motion.router.onChange')

    listeners.push(cb)

    return () => {
      listeners = listeners.filter(fn => fn !== cb)
    }
  },

  link(a, b) {
    return e => {
      e.preventDefault()
      router.go(a, b)
    }
  },

  back() { history.goBack() },
  forward() {history.goForward() },

  go(path, opts = {}) {
    // wait for after first render
    if (Internal.firstRender) return setTimeout(() => router.go(path, opts))
    if (!render) return

    // external links
    if (path.indexOf('http://') == 0 || path.indexOf('https://') == 0) {
      window.location.assign(path)
      return
    }

    // query changes
    if (path[0] === '?')
      path = location + path

    // ensure prefixed with /
    if (path[0] !== '/')
      path = '/' + path

    location = path

    if (!opts.dontPush) history.push(path)
    router.next()
    router.recognize()
    if (!opts.dontRender) render()
    if (!opts.keepScroll) window.scrollTo(0, 0)
  },

  isActive(path) {
    return (
      routes[path] == activeID // /article/:id
      || window.location.pathname == path // /article/123
    )
  },

  next() {
    activeID += 1 // on change route, reset matchers
  },

  recognize() {
    let matches = 0

    routesList.forEach(({ route, path }) => {
      let routeParams = route.match(location)
      if (routeParams) {
        matches++
        router.setActive(path, routeParams)
      }
    })

    // 404
    if (!matches && routes[404]) {
      router.setActive(404)
    }
  },

  setActive(path, newParams) {
    if (newParams) delete newParams._ // ??
    routes[path] = activeID
    params[path] = newParams
    router.params = newParams
  },

  add(path) {
    // this is ridiculous (at the moment, but it works)
    // matches all sub routes, so we can show the whole tree
    let lazy = '(/*_)(/*_)(/*_)(/*_)(/*_)(/*_)(/*_)(/*_)'

    if (typeof path == 'object') {
      let opts = path
      path = opts.path

      if (opts.strict)
        lazy = '/'

    }
    else {
      // TODO: babel needs to add unique key to routematch
      if (routes[path]) return
    }

    const _path = path + lazy
    const route = new Route(_path)

    routesList.push({ route, path })
    routes[path] = activeID

    router.next()
    router.recognize()
  },

  getParams(path) {
    return { params: params[path] }
  }
}

export default router
