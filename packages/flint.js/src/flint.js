import hash from 'hash-sum'
import ee from 'event-emitter'
import resolveStyles from 'flint-radium/lib/resolve-styles'
import React from 'react'
import ReactDOM from 'react-dom'
import raf from 'raf'
import equal from 'deep-equal'
import clone from 'clone'
import Bluebird, { Promise } from 'bluebird'

import 'reapp-object-assign'
import './shim/root'
import './shim/flintMap'
import './shim/on'
import './shim/partial'
import './lib/bluebirdErrorHandle'
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

  let firstRender = true
  let views = {}
  let mainHash
  let lastWorkingView = {}
  let preloaders = [] // async functions needed before loading app
  let viewCache = {} // map of views in various files
  let viewsInFile = {} // current build up of running hot insertion
  let currentHotFile // current file that is running
  let getCache = {} // stores { path: { name: val } } for use in view.get()
  let getCacheInit = {} // stores the vars after a view is first run
  let propsHashes = {}

  const removeView = key => delete views[key]
  const emitter = ee({})

  function phash(_props) {
    const props = Object.keys(_props).reduce((acc, key) => {
      const prop = _props[key]

      if (React.isValidElement(prop)) {
        // TODO: traverse children
        acc[key] = prop.key
      }
      else {
        acc[key] = prop
      }

      return acc
    }, {})

    return hash(props)
  }

  let Flint = {
    router,
    getCache,
    getCacheInit,

    render() {
      const run = () => {
        firstRender = false
        const MainComponent = views.Main.component || lastWorkingView.Main;

        if (!browserNode) {
          Flint.renderedToString = React.renderToString(<MainComponent />)
          afterRenderCb && afterRenderCb(Flint.renderedToString)
        }
        else {
          if (window.__isDevingDevTools)
            browserNode = '_flintdevtools'

          ReactDOM.render(<MainComponent />, document.getElementById(browserNode))
        }

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
      removed.map(removeView)

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
      viewsInFile[weirdName].map(removeView)
      delete viewsInFile[weirdName]
      delete viewCache[weirdName]
      Flint.render()
    },

    makeReactComponent(name, view, options = {}) {
      const el = createElement(name)

      let component = React.createClass({
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
          if (process.env.production) return {}
          return { path: this.getPath() }
        },

        // TODO: shouldComponentUpdate based on hot load for perf
        shouldComponentUpdate() {
          return !this.isPaused
        },

        shouldUpdate() {
          return (
            this.didMount && !this.isUpdating &&
            !this.isPaused && !this.firstRender
          )
        },

        set(name, val) {
          if (!process.env.production) {
            const path = this.getPath()
            getCache[path] = getCache[path] || {}
            getCache[path][name] = val
          }

          if (this.shouldUpdate())
            this.forceUpdate()
        },

        get(name, val) {
          // dont cache in prod / undefined
          if (process.env.production)
            return val

          const path = this.getPath()

          if (!getCache[path])
            getCache[path] = {}

          if (!getCacheInit[path])
            getCacheInit[path] = {}

          let originalValue, restore

          // if edited
          if (options.changed) {
            // initial value changed from last initial value
            // or an object (avoid work for now) TODO: compare objects(?)
            if (getCacheInit[path][name]===undefined) {
              restore = false
            } else {
              restore = typeof val == 'object' || getCacheInit[path][name] === val
              originalValue = getCache[path][name]
            }
            // console.log('new value', val, 'before hot', getCache[path][name])
            // console.log('last init', getCacheInit[path][name], 'restore', restore)

            getCacheInit[path][name] = val
          }

          // we don't wrap view.set() on (var x = 1)
          if (typeof getCache[path][name] == 'undefined')
            getCache[path][name] = val

          if (options.unchanged && typeof getCache[path] != 'undefined')
            return getCache[path][name]

          // if ending init, live inject old value for hotloading, or return actual value
          return restore ? originalValue : val
        },

        // LIFECYCLES

        getInitialState() {
          this.setPath()

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
          view(this, viewOn)

          // reset original render, cache view render
          this.viewRender = this.render
          this.render = flintRender

          return null
        },

        getPath() {
          return `${this.path}-${this.props.__key || ''}`
        },

        setPath() {
          if (process.env.production)
            return

          let propsHash

          // get the props hash, but lets cache it so its not a ton of work
          if (options.changed === true) {
            propsHash = phash(this.props)
            propsHashes[this.context.path] = propsHash
            options.changed = 2
          }
          else if (!propsHash) {
            propsHash = propsHashes[this.context.path]

            if (!propsHash) {
              propsHash = phash(this.props)
              propsHashes[this.context.path] = propsHash
            }
          }

          this.path = (this.context.path || '') + ',' + name + '.' + propsHash
        },

        componentWillReceiveProps(nextProps) {
          this.props = nextProps
          runEvents(this.events, 'props')
        },

        componentDidMount() {
          this.didMount = true
          runEvents(this.events, 'mount')

          // set last working view for this hash
          if (!process.env.production) {
            if (!lastWorkingView[name] || options.changed || options.new)
              lastWorkingView[name] = component
          }
        },

        componentWillUnmount() {
          this.didMount = false
          runEvents(this.events, 'unmount')
        },

        componentWillMount() {
          // componentWillUpdate only runs after first render
          runEvents(this.events, 'update')
          runEvents(this.events, 'props')
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
        update() { this.forceUpdate() },

        // helpers for context
        childContext(obj) {
          if (!obj) return

          Object.keys(obj).forEach(key => {
            this.constructor.childContextTypes[key] =
              React.PropTypes[typeof obj[key]]
          })

          this.getChildContext = () => obj
        },

        render() {
          let els

          if (process.env.production)
            els = this.viewRender()
          else {
            // catch errors in dev
            try {
              els = this.viewRender()
            } catch(e) {
              reportError(e)

              // restore last working view
              if (lastWorkingView[name]) {
                console.log('restoring last working for', name)
                views[name] = lastWorkingView[name]
                setTimeout(Flint.render)
                throw e // keep stack
              }
            }
          }

          const wrapperStyle = this.styles && this.styles.$
          const __disableWrapper = wrapperStyle ? wrapperStyle() === false : false
          const withProps = React.cloneElement(els, { __disableWrapper, path: this.getPath() });
          const styled = els && resolveStyles(this, withProps)
          this.firstRender = false
          return styled
        }
      })

      return component
    },

    getView(name, parentName) {
      let result

      // View.SubView
      const subName = `${parentName}.${name}`
      if (views[subName]) {
        result = views[subName].component
      }
      // regular view
      else if (views[name]) {
        result = views[name].component
      }
      // wrapper
      else if (/Flint\.[\.a-zA-Z0-9]*Wrapper/.test(name)) {
        result = Wrapper
      }
      else {
        result = NotFound(name)
      }

      return result
    },

    /*
      hash is the build systems hash of the view contents
        used for detecting changed views
    */
    view(name, hash, body) {
      viewsInFile[currentHotFile].push(name)

      function setView(name, component) {
        views[name] = Flint.makeView(hash, component)
        if (firstRender) return
      }

      // if new
      if (views[name] == undefined) {
        let component = Flint.makeReactComponent(name, body, { hash, changed: true })
        setView(name, component)
        // lastWorkingView[name] = component
        return
      }

      // not new
      // if defined twice during first run
      if (firstRender) {
        console.error('Defined a view twice!', name, hash)
        views[name] = ErrorDefinedTwice(name)
        return
      }

      // if unchanged
      if (views[name].hash == hash) {
        let component = Flint.makeReactComponent(name, body, { hash, unchanged: true });
        setView(name, component)
        return
      }

      let component = Flint.makeReactComponent(name, body, { hash, changed: true })
      setView(name, component)
      Flint.render()

      // this resets tool errors
      window.onViewLoaded()
    },

    makeView(hash, component) {
      return { hash, component, needsUpdate: true };
    },

    routeMatch(path) {
      router.add(path)
      return router.isActive(path)
    },

    routeParams(path) {
      return router.params(path)
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
  opts.namespace.Flint = Flint

  // prevent overwriting
  Object.freeze(Flint)

  return Flint
}