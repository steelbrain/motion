import hash from 'hash-sum'
import ee from 'event-emitter'
import resolveStyles from 'flint-radium/lib/resolve-styles'
import React from 'react'
import ReactDOM from 'react-dom'
import raf from 'raf'
import equal from 'deep-equal'
import clone from 'clone'
import Bluebird, { Promise } from 'bluebird'

import './lib/bluebirdErrorHandle'

import 'reapp-object-assign'
import './shim/root'
import './shim/flintMap'
import './shim/on'
import './shim/partial'

import router from './lib/router'
import assignToGlobal from './lib/assignToGlobal'
import safeRun from './lib/safeRun'
import reportError from './lib/reportError'
import arrayDiff from './lib/arrayDiff'
import createElement from './tag/createElement'
import Wrapper from './views/Wrapper'
import ErrorDefinedTwice from './views/ErrorDefinedTwice'
import NotFound from './views/NotFound'
import Main from './views/Main'

Promise.longStackTraces()

// GLOBALS
root._history = history // for imported modules to use
root._bluebird = Bluebird // for imported modules to use
root.Promise = Promise // for modules to use
root.on = on
root.module = {}
root.fetchJSON = (...args) => fetch(...args).then(res => res.json())

// error handling
root.onerror = reportError

const uuid = () => Math.floor(Math.random() * 1000000)
const runEvents = (queue, name) =>
  queue && queue[name] && queue[name].length && queue[name].forEach(e => e())

export default function run(browserNode, userOpts, afterRenderCb) {
  const opts = Object.assign({
    namespace: {},
    entry: 'Main'
  }, userOpts)

  // either on window or namespace
  if (opts.namespace !== root && opts.app)
    root[opts.app] = opts.namespace

  let firstRender = true
  let views = {}
  let lastWorkingView = {}
  let preloaders = [] // async functions needed before loading app
  let viewCache = {} // map of views in various files
  let viewsInFile = {} // current build up of running hot insertion
  let currentHotFile // current file that is running
  let getCache = {} // stores { path: { name: val } } for use in view.get()
  let propsHashes = {}

  const removeComponent = key => {
    delete views[key]
    delete opts.namespace[key]
  }

  const setComponent = (key, val) => (opts.namespace[key] = val)
  const getComponent = (key) => opts.namespace[key]
  const emitter = ee({})

  function propsHash(obj) {
    return hash(obj)
  }

  let Flint = {
    render() {
      const run = () => {
        const MainComponent = getComponent('Main') || Main;

        if (!browserNode) {
          Flint.renderedToString = React.renderToString(<MainComponent />)
          afterRenderCb && afterRenderCb(Flint.renderedToString)
        }
        else {
          ReactDOM.render(<MainComponent />, document.getElementById(browserNode))
        }

        firstRender = false
        emitter.emit('afterRender')
      }

      if (preloaders.length) {
        Promise.all(preloaders.map(loader => loader())).then(run)
      }
      else {
        run()
      }
    },

    // internal events
    on(name, cb) { emitter.on(name, cb) },

    // for use in jsx
    debug: () => { debugger },

    file(file, run) {
      viewsInFile[file] = []
      currentHotFile = file

      // run view, get exports
      let fileExports = {}
      run(fileExports)
      Flint.setExports(fileExports)

      const cached = viewCache[file] || []
      const _views = viewsInFile[file]

      // remove viewsInFile that werent made
      const removed = arrayDiff(cached, _views)
      removed.map(removeComponent)

      currentHotFile = null
      viewCache[file] = viewsInFile[file]

      // avoid tons of renders on start
      if (firstRender) return

      raf(() => {
        Flint.render()

        // its been updated
        Object.keys(views).forEach(key => {
          views[key].needsUpdate = false
        })
      })
    },

    deleteFile(name) {
      const weirdName = `/${name}`
      viewsInFile[weirdName].map(removeComponent)
      delete viewsInFile[weirdName]
      delete viewCache[weirdName]
      Flint.render()
      debugger
    },

    makeReactComponent(name, component, options = {}) {
      const el = createElement(name)

      const spec = {
        displayName: name,
        name,
        el,
        Flint,

        childContextTypes: {
          path: React.PropTypes.string
        },

        contextTypes: {
          path: React.PropTypes.string
        },

        getChildContext() {
          // no need for paths/cache in production
          if (process.env.production)
            return {}

          let propsPath

          // get the props hash, but lets cache it so its not a ton of work
          if (options.changed === true) {
            this.propsPath = propsHash(this.props)
            propsHashes[this.context.path] = this.propsPath
            options.changed = 2
          }
          else if (!this.propsPath) {
            this.propsPath = (
              propsHashes[this.context.path] ||
              propsHash(this.props)
            )
          }

          return {
            path: (this.context.path || '') + name + '$' + this.propsPath
          }
        },

        // TODO: shouldComponentUpdate based on hot load

        shouldUpdate() {
          return (
            this.didMount && !this.isUpdating &&
            !this.isPaused && !this.firstRender
          )
        },

        set(name, val) {
          if (!process.env.production) {
            getCache[this.path] = getCache[this.path] || {}
            getCache[this.path][name] = val
          }

          if (this.shouldUpdate())
            this.forceUpdate()
        },

        get(name, val) {
          if (process.env.production)
            return val

          // if hot reloaded but not changed
          if (options.unchanged) {
            if (getCache[this.path])
              return getCache[this.path][name]
            else
              return val
          }
          else {
            // on first get, we may not have even set
            if (!getCache[this.path]) getCache[this.path] = {}
            if (typeof getCache[this.path][name] == 'undefined')
              getCache[this.path][name] = val

            return val
          }
        },

        // LIFECYCLES

        getInitialState() {
          this.path = (this.context.path || '') + name

          if (!options.unchanged)
            delete getCache[this.path]

          let u = void 0
          this.firstRender = true
          this.styles = { _static: {} }
          this.events = { mount: u, unmount: u, update: u, props: u }

          const viewOn = (scope, name, cb) => {
            // check if they defined their own scope
            if (name && typeof name == 'string')
              return on(scope, name, cb)
            else
              return on(this, scope, name)
          }

          // cache original render
          const flintRender = this.render
          component(this, viewOn)

          // reset original render, cache view render
          this.viewRender = this.render
          this.render = flintRender

          return null
        },

        componentWillReceiveProps(nextProps) {
          this.props = nextProps
          runEvents(this.events, 'props')
        },

        componentDidMount() {
          this.didMount = true
          runEvents(this.events, 'mount')
        },

        componentWillUnmount() {
          this.didMount = false
          runEvents(this.events, 'unmount')
        },

        componentWillMount() {
          // componentWillUpdate only runs after first render
          runEvents(this.events, 'update')
        },

        componentWillUpdate() {
          this.isUpdating = true
          runEvents(this.events, 'update')
        },

        componentDidUpdate() {
          this.isUpdating = false
        },

        // FLINT HELPERS

        // helpers for controlling re-renders
        pause() { this.isPaused = true },
        resume() { this.isPaused = false },

        // helpers for context
        childContext(obj) {
          if (!obj) return

          Object.keys(obj).forEach(key => {
            this.constructor.childContextTypes[key] =
              React.PropTypes[typeof obj[key]]
          })

          this.getChildContext = () => obj
        },

        // routing
        go(route) {
          router.go(route)
        },

        render() {
          let els
          const render = this.viewRender
          this.firstRender = false

          // safeRun(`${name}.render()`, () => {
            els = render()
          // })

          const wrapperStyle = this.styles && this.styles.$
          const __disableWrapper = wrapperStyle ? wrapperStyle() === false : false
          const withProps = React.cloneElement(els, { __disableWrapper });
          const styled = els && resolveStyles(this, withProps)
          return styled
        }
      }

      return React.createClass(spec);
    },

    getView(name, parentName) {
      let result

      // View.SubView
      const subName = `${parentName}.${name}`
      if (views[subName])
        result = views[subName].component

      // regular view
      else if (views[name])
        result = views[name].component

      // wrapper
      else if (/Flint\.[\.a-zA-Z0-9]*Wrapper/.test(name))
        result = Wrapper

      else
        result = NotFound(name)

       return result
    },

    /*
      hash is the build systems hash of the view contents
        used for detecting changed views
    */
    view(name, hash, component) {
      viewsInFile[currentHotFile].push(name)

      function setView(name, Component) {
        views[name] = Flint.makeView(hash, Component)
        setComponent(name, Component)
        if (firstRender) return
      }

      // if new
      if (views[name] == undefined) {
        let Component = Flint.makeReactComponent(name, component, { hash, changed: true });
        setView(name, Component)
        lastWorkingView[name] = views[name].component
        return
      }

      // not new

      // if defined twice during first run
      if (firstRender) {
        console.error('Defined a view twice!', name, hash)
        setComponent(name, ErrorDefinedTwice(name))
        return
      }

      // if unchanged
      if (views[name].hash == hash) {
        let Component = Flint.makeReactComponent(name, component, { hash, unchanged: true });
        setView(name, Component)
        return
      }

      // start with a success and an error will fire before next frame
      if (root._DT)
        root._DT.emitter.emit('runtime:success')

      let viewRanSuccessfully = true

      // recover from bad views
      window.onerror = (...args) => {
        viewRanSuccessfully = false

        if (lastWorkingView[name]) {
          setView(name, lastWorkingView[name])
          Flint.render()
        }
        else {
          setView(name, ErrorDefinedTwice(name))
          Flint.render()
        }
      }

      Flint.on('afterRender', () => {
        if (viewRanSuccessfully)
          lastWorkingView[name] = views[name].component
      })

      let flintComponent = Flint.makeReactComponent(name, component, { changed: true })
      setView(name, flintComponent)

      // this resets tool errors
      window.onViewLoaded()
    },

    makeView(hash, component) {
      return { hash, component, needsUpdate: true };
    },

    getStyle(id, name) {
      return Flint.styles && Flint.styles[id][name]
    },


    matchRoute(path) {
      router.add(path)
      return router.isActive(path)
    },

    // export globals
    setExports(_exports) {
      if (!_exports) return
      Object.freeze(_exports)
      const names = Object.keys(_exports)

      if (names.length) {
        names.forEach(name => {
          if (name === 'default') {
            Object.keys(_exports.default).forEach(key => {
              assignToGlobal(key, _exports.default[key])
            })
          }

          assignToGlobal(name, _exports[name])
        })
      }
    }
  };

  router.init(Flint.render)

  // shim root view
  opts.namespace.view = {
    update: () => {},
    el: createElement('_'),
    Flint
  }

  // set flint onto namespace
  opts.namespace.Flint = Flint

  Object.freeze(Flint)

  return Flint;
}