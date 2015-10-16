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

import reportError from './lib/reportError'
import arrayDiff from './lib/arrayDiff'
import createElement from './tag/createElement'
import Wrapper from './views/Wrapper'
import ErrorDefinedTwice from './views/ErrorDefinedTwice'
import NotFound from './views/NotFound'
import Main from './views/Main'

Promise.longStackTraces()

// GLOBALS
root._bluebird = Bluebird // for imported modules to use
root.on = on
root.Promise = Promise
root.module = {}
root.fetchJSON = (...args) => fetch(...args).then(res => res.json())
root.onerror = reportError

const uuid = () => Math.floor(Math.random() * 1000000)
const runEvents = (queue, name) =>
  queue && queue[name] && queue[name].length && queue[name].forEach(e => e())

function safeRun(fn) {
  if (process.env.production) fn()
  else {
    try { fn() }
    catch(e) {
      const { name, message, stack } = e
      reportError({ name, message, stack })
      throw e
    }
  }
}

function run(browserNode, userOpts, afterRenderCb) {
  const opts = Object.assign({
    namespace: {},
    entry: 'Main'
  }, userOpts)

  // either on window or namespace
  if (opts.namespace !== root && opts.app)
    root[opts.app] = opts.namespace

  const render = () => {
    const run = () => {
      const MainComponent = getComponent('Main') || Main;

      if (!browserNode) {
        Flint.renderedToString = React.renderToString(<MainComponent />)
        afterRenderCb && afterRenderCb(Flint.renderedToString)
      }
      else {
        ReactDOM.render(<MainComponent />, document.getElementById(browserNode))
      }

      Flint.firstRender = false
      emitter.emit('afterRender')
    }

    if (Flint.preloaders.length) {
      const preloaders = Flint.preloaders.map(loader => loader())
      Promise.all(preloaders).then(run)
    }
    else {
      run()
    }
  }

  // exported tracks previous exports so we can overwrite
  let exported = {}
  const assignToGlobal = (name, val) => {
    if (!exported[name] && typeof root[name] != 'undefined')
      throw `You're attempting to define a global that is already defined:
          ${name} = ${JSON.stringify(root[name])}`

    exported[name] = true
    root[name] = val
  }

  const removeComponent = key => {
    delete Flint.views[key]
    delete opts.namespace[key]
  }

  const setComponent = (key, val) => (opts.namespace[key] = val)
  const getComponent = (key) => opts.namespace[key]
  const emitter = ee({})

  let Flint = {
    views: {},
    lastWorkingView: {},
    // async functions needed before loading app
    preloaders: [],
    render,
    // internal events
    on(name, cb) { emitter.on(name, cb) },
    // map of views in various files
    viewCache: {},
    // current build up of running hot insertion
    viewsInFile: {},
    // current file that is running
    currentHotFile: null,
    // track first render
    firstRender: true,

    file(file, run) {
      Flint.viewsInFile[file] = []
      Flint.currentHotFile = file
      let fileExports

      fileExports = run({})

      Flint.setExports(fileExports)
      const cached = Flint.viewCache[file] || []
      const views = Flint.viewsInFile[file]

      // remove views that werent made
      const removed = arrayDiff(cached, views)
      removed.map(removeComponent)

      Flint.currentHotFile = null
      Flint.viewCache[file] = Flint.viewsInFile[file]

      if (Flint.firstRender)
        return

      raf(() => {
        Flint.isLoadingFile = true
        render()
        Flint.isLoadingFile = false

        // its been updated
        Object.keys(Flint.views).forEach(key => {
          Flint.views[key].needsUpdate = false
        })
      })
    },

    deleteFile(name) {
      const weirdName = `/${name}`
      Flint.viewsInFile[weirdName].map(removeComponent)
      delete Flint.viewsInFile[weirdName]
      delete Flint.viewCache[weirdName]
      render()
      debugger
    },

    makeReactComponent(name, component, options = {}) {
      const el = createElement(name)

      const spec = {
        displayName: name,
        name,
        el,
        Flint,

        shouldUpdate() {
          return (
            this.didMount &&
            !this.isUpdating &&
            !this.isPaused
          )
        },

        update() {
          // if (this.isUpdating)
            // raf(() => this.update())
          if (this.shouldUpdate())
            this.forceUpdate()
        },

        // LIFECYCLES

        getInitialState() {
          if (name == 'Main')
            Flint.mainView = this

          this.firstRender = true
          this.styles = {}
          this.events = {
            mount: null, unmount: null,
            update: null, props: null
          }

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
          this.isUpdating = true
          runEvents(this.events, 'update')
        },

        // we don't actually need this because we call forceupdate
        componentWillUpdate() {
        },

        componentDidUpdate() {
          this.isUpdating = false
        },

        // FLINT HELPERS

        // helpers for controlling re-renders
        pause() { this.isPaused = true },
        resume() { this.isPaused = false },

        // helpers for context
        childContextTypes: {},
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
          const render = this.viewRender

          safeRun(() => {
            els = render()
          })

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
      if (Flint.views[subName])
        result = Flint.views[subName].component

      // regular view
      else if (Flint.views[name])
        result = Flint.views[name].component;

      // wrapper
      else if (/Flint\.[\.a-zA-Z0-9]*Wrapper/.test(name))
        result = Wrapper

      // global views
      else if (opts.namespace[name])
        result = namespaceView

      else
        result = NotFound(name)

       return result
    },

    /*
      hash is the build systems hash of the view contents
        used for detecting changed views
    */
    view(name, hash, component) {
      Flint.viewsInFile[Flint.currentHotFile].push(name)

      // if new
      if (Flint.views[name] == undefined) {
        let fComponent = Flint.makeReactComponent(name, component, {
          isNew: true,
          hash
        });

        Flint.views[name] = Flint.makeView(hash, fComponent);
        Flint.lastWorkingView[name] = Flint.views[name].component;
        setComponent(name, fComponent) // puts on namespace
        return
      }

      // not new

      // if defined twice during first run
      if (Flint.firstRun) {
        console.error('Defined a view twice!', name, hash)
        setComponent(name, ErrorDefinedTwice(name))
        return
      }

      // if unchanged
      if (Flint.views[name].hash == hash)
        return

      // start with a success and an error will fire before next frame
      if (root._DT)
        root._DT.emitter.emit('runtime:success')

      // if changed

      const setView = (name, flintComponent) => {
        Flint.views[name] = Flint.makeView(hash, flintComponent)
        setComponent(name, flintComponent) // puts on namespace
        if (Flint.firstRun) return
      }

      let viewRanSuccessfully = true

      // recover from bad views
      window.onerror = (...args) => {
        viewRanSuccessfully = false

        if (Flint.lastWorkingView[name]) {
          setView(name, Flint.lastWorkingView[name])
          render()
        }
        else {
          setView(name, ErrorDefinedTwice(name))
          render()
        }
      }

      Flint.on('afterRender', () => {
        if (viewRanSuccessfully)
          Flint.lastWorkingView[name] = Flint.views[name].component
      })

      let flintComponent = Flint.makeReactComponent(name, component, { isChanged: true })
      setView(name, flintComponent)

      // tools errors todo
      window.onViewLoaded()
    },

    makeView(hash, component) {
      return { hash, component, needsUpdate: true };
    },

    getStyle(id, name) {
      return Flint.styles && Flint.styles[id][name]
    },

    // export globals
    setExports(_exports) {
      if (!_exports) return
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
  }

  // shim root view
  opts.namespace.view = {
    update: () => {},
    el: createElement('_'),
    Flint
  }

  // make mutative array methods trigger updates in views
  const mutators = ['push', 'reverse', 'splice', 'shift', 'pop', 'unshift', 'sort']
  mutators.map(method => {
    const vanilla = Array.prototype[method]

    Array.prototype[method] = function(...args) {
      const result = vanilla.apply(this, args)

      // do view update

      return result
    }
  })

  // set flint onto namespace
  opts.namespace.Flint = Flint;

  return Flint;
}

export default run
