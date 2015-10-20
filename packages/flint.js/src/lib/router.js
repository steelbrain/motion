import RouteRecognizer from 'route-recognizer'
import { createHistory } from 'history'

const rr = new RouteRecognizer()
const history = createHistory()

let render
let lastMatchId = 1
let routes = {}
let numRoutes = 0
let location = window.location.pathname

const router = {
  init(_render) {
    render = _render
  },
  link(...args) {
    return () => router.go(...args)
  },
  go(path, dontPush) {
    if (!numRoutes) return
    location = path
    if (!dontPush) history.pushState(null, path)
    router.next()
    router.recognize()
    render()
  },
  isActive(path) {
    return routes[path] == lastMatchId
  },
  next() {
    lastMatchId += 1 // on change route, reset matchers
  },
  recognize() {
    const results = rr.recognize(location)
    if (!results) return
    // why the f** is this not a normal array
    for (let i = 0; i < results.length; i++)
      results[i].handler()
  },
  add(path) {
    if (routes[path]) return
    numRoutes += 1
    routes[path] = lastMatchId
    rr.add([{ path: path, handler: router.handler.bind(void 0, path) }])
    router.next()
    router.recognize()
  },
  handler(path) {
    routes[path] = lastMatchId
  }
}

// router updates
history.listen(location => {
  router.go(location.pathname, true)
})

export default router