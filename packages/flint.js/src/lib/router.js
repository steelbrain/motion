import Route from 'route-parser'
window.R = Route
import { createHistory } from 'history'

const history = createHistory()

let render
let activeID = 1
let routes = {}
let routesList = []
let params = {}
let location = window.location.pathname

const router = {
  init(_render) {
    render = _render
  },

  link(...args) {
    return () => router.go(...args)
  },

  go(path, dontPush) {
    if (!routesList.length) return
    location = path
    if (!dontPush) history.pushState(null, path)
    router.next()
    router.recognize()
    render()
    return new Promise((res) => setTimeout(res))
  },

  isActive(path) {
    return routes[path] == activeID
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

// router updates
history.listen(location => {
  router.go(location.pathname, true)
})

export default router