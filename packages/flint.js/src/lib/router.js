import Route from 'route-parser'
import { createHistory } from 'history'

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
  init({ onChange }) {
    render = onChange
    history = createHistory()

    // router updates
    history.listen(location => {
      router.go(location.pathname, true)
      runListeners(location)
    })
  },

  onChange(cb) {
    if (typeof cb !== 'function')
      throw new Error('Must provide function to Flint.router.onChange')

    listeners.push(cb)
  },

  link(...args) {
    return () => router.go(...args)
  },

  back() { history.goBack() },
  forward() {history.goForward() },

  go(path, dontPush) {
    if (!render) return

    // ensure prefixed with /
    if (path[0] !== '/')
      path = '/' + path

    if (path == location)
      return // already at this route

    location = path

    if (!dontPush)
      history.pushState(null, path)

    router.next()
    router.recognize()
    render()
    return new Promise((res) => setTimeout(res))
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
    routesList.forEach(({ route, path }) => {
      let routeParams = route.match(location)
      if (routeParams) {
        delete routeParams._
        routes[path] = activeID
        params[path] = routeParams
      }
    })
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

  params(path) {
    return { params: params[path] }
  }
}

export default router