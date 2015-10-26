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
import range from './lib/range'
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

const uuid = () => Math.floor(Math.random() * 1000000)
const runEvents = (queue, name) =>
  queue && queue[name] && queue[name].length && queue[name].forEach(e => e())

export default function run(browserNode, userOpts, afterRenderCb) {
  const opts = Object.assign({
    namespace: {},
    entry: 'Main'
  }, userOpts)

  // error handling
  const prevOnError = root.onerror
  const flintOnError = (...args) => {
    prevOnError && prevOnError(...args)
    reportError(...args)
  }
  root.onerror = flintOnError

  const Internal = root._Flint = {
    viewCache: {}, // map of views in various files
    viewsInFile: {}, // current build up of running hot insertion
    currentHotFile: null, // current file that is running
    getCache: {}, // stores { path: { name: val } } for use in view.get()
    getCacheInit: {}, // stores the vars after a view is first run
    propsHashes: {}
  }

  let isRendering = 0
  let firstRender = true
  let mainHash
  let lastWorkingView = {}
  let preloaders = [] // async functions needed before loading app

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
    range,

    views: {},
    removeView(key) { delete Flint.views[key] },

    render() {
      const run = () => {
        isRendering++

        // prevent too many re-render tries on react errors
        if (isRendering > 4) return

        firstRender = false
        const MainComponent = Flint.views.Main.component || lastWorkingView.Main;

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
        isRendering = 0
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
      isRendering = 0
      Internal.viewsInFile[file] = []
      Internal.currentHotFile = file

      // run view, get exports
      let fileExports = {}
      run(fileExports)
      Flint.setExports(fileExports)

      const cached = Internal.viewCache[file] || []
      const _views = Internal.viewsInFile[file]

      // remove Internal.viewsInFile that werent made
      const removed = arrayDiff(cached, _views)
      removed.map(Flint.removeView)

      Internal.currentHotFile = null
      Internal.viewCache[file] = Internal.viewsInFile[file]

      // avoid tons of renders on start
      if (firstRender) return

      raf(() => {
        Flint.render()

        // its been updated
        Object.keys(Flint.views).forEach(key => {
          Flint.views[key].needsUpdate = false
        })
      })
    },

    deleteFile(name) {
      const weirdName = `/${name}`
      Internal.viewsInFile[weirdName].map(removeView)
      delete Internal.viewsInFile[weirdName]
      delete Internal.viewCache[weirdName]
      Flint.render()
    },

    makeReactComponent(name, view, options = {}) {
      const el = createElement(name)

      let component = React.createClass({
        displayName: name,
        name,
        Flint,
        el,

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
            Internal.getCache[path] = Internal.getCache[path] || {}
            Internal.getCache[path][name] = val
          }

          if (this.shouldUpdate())
            this.forceUpdate()
        },

        get(name, val) {
          // dont cache in prod / undefined
          if (process.env.production)
            return val

          const path = this.getPath()

          if (!Internal.getCache[path])
            Internal.getCache[path] = {}

          if (!Internal.getCacheInit[path])
            Internal.getCacheInit[path] = {}

          let originalValue, restore

          // if edited
          if (options.changed) {
            // initial value changed from last initial value
            // or an object (avoid work for now) TODO: compare objects(?)
            if (typeof Internal.getCacheInit[path][name] == 'undefined') {
              restore = false
            } else {
              restore = typeof val == 'object' || Internal.getCacheInit[path][name] === val
              originalValue = Internal.getCache[path][name]
            }
            // console.log('new value', val, 'before hot', Internal.getCache[path][name])
            // console.log('last init', Internal.getCacheInit[path][name], 'restore', restore)

            Internal.getCacheInit[path][name] = val
          }

          // we don't wrap view.set() on (var x = 1)
          const isUndef = typeof Internal.getCache[path][name] == 'undefined'

          if (isUndef)
            Internal.getCache[path][name] = val

          if (options.unchanged && isUndef)
            return Internal.getCache[path][name]

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

          this.renders = []

          // setter to capture view render
          this.render = renderFn => {
            this.renders.push(renderFn)
          }

          // call view
          view.call(this, viewOn)

          // reset original render
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
            Internal.propsHashes[this.context.path] = propsHash
            options.changed = 2
          }
          else if (!propsHash) {
            propsHash = Internal.propsHashes[this.context.path]

            if (!propsHash) {
              propsHash = phash(this.props)
              Internal.propsHashes[this.context.path] = propsHash
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
            if (!lastWorkingView[name] || options.changed || options.new) {
              lastWorkingView[name] = component
            }
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
          console.log(this.renders, this.renders.map(r => r.call(this)))
          let run = () =>
            <div>
              {this.renders.map(r => r.call(this))}
            </div>

          console.log(this.viewRender)
          if (process.env.production)
            els = run()
          else {
            // catch errors in dev
            try {
              els = run()
            } catch(e) {
              reportError(e)

              // restore last working view
              if (lastWorkingView[name]) {
                Flint.views[name] = lastWorkingView[name]
                setTimeout(Flint.render)
                throw e // keep stack here
              }
            }
          }

          // const wrapperStyle = this.styles && this.styles.$
          // const __disableWrapper = wrapperStyle ? wrapperStyle() === false : false
          // TODO: check if they returned something valid here
          console.log('els', els)
          // const withProps = React.cloneElement(els, { __disableWrapper, path: this.getPath() })
          const styled = els && resolveStyles(this, els)
          this.firstRender = false
          return styled

          // return els
        }
      })

      return component
    },

    getView(name, parentName) {
      let result

      // View.SubView
      const subName = `${parentName}.${name}`
      if (Flint.views[subName]) {
        result = Flint.views[subName].component
      }
      // regular view
      else if (Flint.views[name]) {
        result = Flint.views[name].component
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
      if (typeof hash == 'function') {
        body = hash
        hash = null
      }

      Internal.viewsInFile[Internal.currentHotFile].push(name)

      function  makeView(hash, component) {
        return { hash, component, needsUpdate: true }
      }

      function setView(name, component) {
        Flint.views[name] = makeView(hash, component)
        if (firstRender) return
      }

      // if new
      if (Flint.views[name] == undefined) {
        let component = Flint.makeReactComponent(name, body, { hash, changed: true })
        setView(name, component)
        return
      }

      // not new
      // if defined twice during first run
      if (firstRender) {
        console.error('Defined a view twice!', name, hash)
        Flint.views[name] = ErrorDefinedTwice(name)
        return
      }

      // if unchanged
      if (Flint.views[name].hash == hash) {
        let component = Flint.makeReactComponent(name, body, { hash, unchanged: true });
        setView(name, component)
        return
      }

      let component = Flint.makeReactComponent(name, body, { hash, changed: true })
      setView(name, component)

      // check for react-level errors and recover

      // check errors and restore last good view
      root.onerror = (...args) => {
        Flint.views[name] = makeView(hash, lastWorkingView[name])
        Flint.render()
        flintOnError(...args)
      }

      // then check for no errors and reset onerror
      emitter.on('afterRender', () => {
        root.onerror = flintOnError
      })


      Flint.render()

      // this resets tool errors
      window.onViewLoaded()
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