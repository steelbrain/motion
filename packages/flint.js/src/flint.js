import hashsum from 'hash-sum'
import ee from 'event-emitter'
import resolveStyles from 'flint-radium/lib/resolve-styles'
import React from 'react'
import ReactDOM from 'react-dom'
import raf from 'raf'
import clone from 'clone'
import Bluebird, { Promise } from 'bluebird'

import 'reapp-object-assign'
import './shim/root'
import './shim/flintMap'
import './shim/on'
import './shim/partial'
import './lib/bluebirdErrorHandle'
import runEvents from './lib/runEvents'
import range from './lib/range'
import router from './lib/router'
import assignToGlobal from './lib/assignToGlobal'
import safeRun from './lib/safeRun'
import reportError from './lib/reportError'
import arrayDiff from './lib/arrayDiff'
import createElement from './tag/createElement'
import ErrorDefinedTwice from './views/ErrorDefinedTwice'
import NotFound from './views/NotFound'
import Main from './views/Main'

Promise.longStackTraces()

// GLOBALS
root._history = history // for imported modules to use
root._bluebird = Bluebird // for imported modules to use
root.Promise = Promise // for modules to use
root.ReactDOM = ReactDOM
root.on = on
root.module = {}
root.fetch.json = (...args) => fetch(...args).then(res => res.json())

const uuid = () => Math.floor(Math.random() * 1000000)

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
    propsHashes: {},

    lastWorkingView: {},
    preloaders: [], // async functions needed before loading app

    // devtools
    inspector: {},
    viewsAtPath: {}
  }

  function pathToName(path) {
    let p = path.split(',')
    return p[p.length - 1].split('.')[0]
  }

  // devtools edit
  function writeBack(key, val) {
    Internal.getCache[inspector.path][key] = val
    Internal.viewsAtPath[path].forceUpdate()
  }

  function setInspector(path) {
    if (Internal.inspector.path && Internal.inspector.path == path) {
      const name = pathToName(path)
      let props = Object.assign({}, Internal.viewsAtPath[path].props)
      delete props.__key
      const state = Internal.getCache[path]
      Internal.inspector.cb(name, props, state, writeBack)
    }
  }

  function setCache(path, name, val) {
    Internal.getCache[path][name] = val
    // when devtools inspecting
    setInspector(path)
  }

  let isRendering = 0
  let firstRender = true
  let mainHash

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

    return hashsum(props)
  }

  let Flint = {
    router,
    range,

    views: {},
    removeView(key) { delete Flint.views[key] },

    render() {
      if (Internal.preloaders.length)
        Promise.all(Internal.preloaders.map(loader => loader())).then(run)
      else
        run()

      function run() {
        isRendering++

        // prevent too many re-render tries on react errors
        if (isRendering > 3) return

        firstRender = false
        const MainComponent = Flint.views.Main.component || Internal.lastWorkingView.Main

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
    },

    // internal events
    on(name, cb) { emitter.on(name, cb) },

    // for use in jsx
    debug: () => { debugger },

    file(file, run) {
      // prevent infinite loop of re-renders on errors
      isRendering = 0

      Internal.viewsInFile[file] = []
      Internal.currentHotFile = file

      // capture exports
      let fileExports = {}

      // run file
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

      setTimeout(Flint.render)
    },

    deleteFile(name) {
      const weirdName = `/${name}`
      Internal.viewsInFile[weirdName].map(Flint.removeView)
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

        shouldReRender() {
          return (
            this.didMount && !this.isUpdating &&
            !this.isPaused && !this.firstRender
          )
        },

        set(name, val) {
          if (!process.env.production) {
            const path = this.getPath()
            Internal.getCache[path] = Internal.getCache[path] || {}
            setCache(path, name, val)
          }

          if (this.shouldReRender())
            this.forceUpdate()
        },

        get(name, val, where) {
          // dont cache in prod / undefined
          if (process.env.production)
            return val

          // file scoped stuff always updates
          if (options.unchanged && where == 'fromFile')
            return val

          const path = this.getPath()

          // setup caches
          if (!Internal.getCache[path])
            Internal.getCache[path] = {}
          if (!Internal.getCacheInit[path])
            Internal.getCacheInit[path] = {}

          const isComparable = (
            typeof val == 'number' ||
            typeof val == 'string' ||
            typeof val == 'boolean' ||
            typeof val == 'undefined'
          )

          const cacheVal = Internal.getCache[path][name]
          const cacheInitVal = Internal.getCacheInit[path][name]

          let originalValue, restore

          // if edited
          if (options.changed) {
            // initial value not undefined
            if (typeof cacheInitVal != 'undefined') {
              // only hot update changed variables
              if (isComparable && cacheInitVal === val) {
                restore = true
                originalValue = Internal.getCache[path][name]
              }
            }

            Internal.getCacheInit[path][name] = val
          }

          if (options.changed && typeof cacheVal == 'undefined')
            setCache(path, name, val)

          // return cached
          if (isComparable)
            if (options.unchanged && cacheVal !== cacheInitVal)
              return cacheVal

          // if restore, restore
          return restore ? originalValue : val
        },

        // LIFECYCLES

        getInitialState() {
          this.setPath()

          let u = void 0
          this.firstRender = true
          this.styles = { _static: {} }
          this.events = { mount: u, unmount: u, update: u, props: u }

          this.viewOn = (scope, name, cb) => {
            // check if they defined their own scope
            if (name && typeof name == 'string')
              return on(scope, name, cb)
            else
              return on(this, scope, name)
          }

          // cache Flint view render() (defined below)
          const flintRender = this.render

          this.renders = []

          // setter to capture view render
          this.render = renderFn => {
            this.renders.push(renderFn)
          }

          // call view
          view.call(this, this, this.viewOn, this.styles)

          // reset original render
          this.render = flintRender

          // ensure something renders
          if (!this.renders.length)
            this.renders.push(() => this.el([name.toLowerCase(), 0], { yield: true }))

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

        runEvents(name) {
          runEvents(this.events, name)
        },

        componentWillReceiveProps(nextProps) {
          this.props = nextProps
          this.runEvents('props')
        },

        componentDidMount() {
          this.didMount = true
          this.runEvents('mount')

          if (!process.env.production) {
            Internal.viewsAtPath[this.getPath()] = this

            // set last working view for this hash
            if (!Internal.lastWorkingView[name] || options.changed || options.new) {
              Internal.lastWorkingView[name] = component
            }
          }
        },

        componentWillUnmount() {
          // fixes unmount errors #60
          if (!process.env.production) {
            this.render()
          }

          this.didMount = false
          this.runEvents('unmount')
        },

        componentWillMount() {
          // componentWillUpdate only run after first render
          this.runEvents('update')
          this.runEvents('props')
        },

        componentWillUpdate() {
          this.isUpdating = true
          this.runEvents('update')
        },

        componentDidUpdate() {
          this.isUpdating = false

          if (!process.env.production) {
            // set flintID for state inspect
            const node = ReactDOM.findDOMNode(this)
            node.__flintID = this.getPath()
          }
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
          this.firstRender = false

          const singleTopEl = this.renders.length == 1
          let tags
          let wrap = true

          if (singleTopEl) {
            tags = [this.renders[0].call(this)]

            // if child tag name == view name, no wrapper
            if (tags[0].type == name.toLowerCase())
              wrap = false
          }
          else {
            tags = this.renders.map(r => r.call(this))
          }

          let els = !wrap ? tags[0] : this.el(`view.${name}`,
            // props
            {
              style: Object.assign(
                {},
                this.props.style,
                this.styles.$ && this.styles.$(),
                this.styles._static && this.styles._static.$
              )
            },
            ...tags
          )

          return els && resolveStyles(this, els)
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
      else {
        result = NotFound(name)
      }

      return result
    },

    /*
      hash is the build systems hash of the view contents
        used for detecting changed views
    */
    view(name, body) {
      const comp = Flint.makeReactComponent.partial(name, body)

      if (process.env.production)
        setView(name, comp())

      const hash = hashsum(body)

      Internal.viewsInFile[Internal.currentHotFile].push(name)

      function makeView(hash, component) {
        return { hash, component }
      }

      function setView(name, component) {
        Flint.views[name] = makeView(hash, component)
        if (firstRender) return
      }

      // if new
      if (Flint.views[name] == undefined) {
        setView(name, comp({ hash, changed: true }))
        return
      }

      // not new
      // if defined twice during first run
      if (firstRender) {
        throw new Error(`Defined a view twice: ${name}`)
        Flint.views[name] = ErrorDefinedTwice(name)
        return
      }

      // if unchanged
      if (Flint.views[name].hash == hash) {
        setView(name, comp({ hash, unchanged: true }))
        return
      }

      setView(name, comp({ hash, changed: true }))

      // check errors and restore last good view
      root.onerror = (...args) => {
        console.log('error, restore last view', name)
        Flint.views[name] = makeView(hash, Internal.lastWorkingView[name])
        flintOnError(...args)
        setTimeout(Flint.render)
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
    },

    inspect(path, cb) {
      Internal.inspector = { path, cb }
      setInspector(path)
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