import hashsum from 'hash-sum'
import ee from 'event-emitter'
import React from 'react'
import raf from 'raf'
import ReactDOM from 'react-dom'
import clone from 'clone'
import regeneratorRuntime from './vendor/regenerator'
import Bluebird, { Promise } from 'bluebird'

import 'reapp-object-assign'
import './lib/bluebirdErrorHandle'
import './shim/root'
import './shim/on'
import './shim/partial'
import log from './shim/log'
import onError from './shim/onError'
import createComponent from './createComponent'
import range from './lib/range'
import iff from './lib/iff'
import router from './lib/router'
import staticStyles from './lib/staticStyles'
import assignToGlobal from './lib/assignToGlobal'
import safeRun from './lib/safeRun'
import reportError from './lib/reportError'
import arrayDiff from './lib/arrayDiff'
import createElement from './tag/createElement'
import ErrorDefinedTwice from './views/ErrorDefinedTwice'
import NotFound from './views/NotFound'
import LastWorkingMainFactory from './views/LastWorkingMain'
import MainErrorView from './views/Main'

const originalWarn = console.warn
console.warn = (...args) => {
  if (args[0] && args[0].indexOf('Radium:') == 0) return
  originalWarn.call(console, ...args)
}

/*

  Welcome to Flint!

    This file deals mostly with setting up Flint,
    loading views and files, rendering,
    and exposing the public Flint functions

*/

Promise.longStackTraces()

// GLOBALS
root.global = root // for radium
root.regeneratorRuntime = regeneratorRuntime
root._history = history // for imported modules to use
root._bluebird = Bluebird // for imported modules to use
root.Promise = Promise // for modules to use
root.ReactDOM = ReactDOM
root.on = on
root.module = {}
root.fetch.json = (...args) => fetch(...args).then(res => res.json())

export default function run(browserNode, userOpts, afterRenderCb) {
  const opts = Object.assign({
    namespace: {},
    entry: 'Main'
  }, userOpts)

  // flints internal state
  const Internal = root._Flint = {
    views: {},

    isRendering: 0,
    firstRender: true,
    isDevTools: opts.app == 'devTools',

    paths: {}, // cache hotreload paths
    viewCache: {}, // map of views in various files
    viewsInFile: {}, // current build up of running hot insertion
    currentFileViews: null, // tracks views as file loads, for hot reloading
    currentHotFile: null, // current file that is running
    getCache: {}, // stores { path: { name: val } } for use in view.get()
    getCacheInit: {}, // stores the vars after a view is first run

    changedViews: [],
    getInitialStates: [],
    mountedViews: {},
    lastWorkingViews: {},
    lastWorkingRenders: {},

    resetViewState() {
      Internal.views = {}
      Internal.mountedViews = {}
      Internal.lastWorkingViews = {}
    },

    removeView(key) {
      delete Internal.views[key]
    },

    // devtools
    inspector: {},
    viewsAtPath: {},
    editor: {},

    setCache(path, name, val) {
      Internal.getCache[path][name] = val
      // when devtools inspecting
      setInspector(path)
    }
  }

  // internals
  let Tools

  if (!process.env.production) {
    // Tools
    Tools = root._DT

    // pass data from tools to internal
    Tools.emitter.on('editorState', () => {
      Internal.editor = Tools.editor
    })
  }

  // setup shims that use Internal
  onError(Internal, Tools)
  log(Internal, Tools)
  const LastWorkingMain = LastWorkingMainFactory(Internal)

  // devtools edit
  function writeBack(path, writePath) {
    // update getCache
    writePath.reduce((acc, key) => {
      if (key == 'root') return acc
      if (Array.isArray(key))
        acc[key[0]] = key[1] // final index is arr: [key, val]
      else
        return acc[key]
    }, Internal.getCache[path])

    // update view
    // TODO: specific updates: const name = pathToName(path)
    Flint.render()
  }

  function setInspector(path) {
    if (Internal.inspector[path]) {
      let props = Internal.viewsAtPath[path].props
      const state = Internal.getCache[path]
      Internal.inspector[path](props, state, writeBack)
    }
  }

  const emitter = ee({})

  function require(name) {
    if (name.charAt(0) == '.')
      return Flint.internals[name.replace('./', '')]

    if (name == 'bluebird')
      return root._bluebird

    let pkg = Flint.packages[name]

    // we may be waiting for packages reload
    if (!pkg) return

    // may not export a default
    if (!pkg.default)
      pkg.default = pkg

    return pkg
  }

  root.require = require

  let Flint = {
    // visible but used internally
    packages: {},
    internals: {},

    init() {
      router.init({ onChange: Flint.render })
      Flint.render()
    },

    // semi private API
    reportError,
    range,
    iff,

    // external API
    router,
    decorateViews: decorator => Internal.viewDecorator = decorator,
    preloaders: [], // async functions needed before loading app

    // styles, TODO: move internal
    staticStyles,
    styleClasses: {},
    styleObjects: {},

    render() {
      if (Flint.preloaders.length)
        Promise.all(Flint.preloaders.map(loader => loader())).then(run)
      else
        run()

      function run() {
        Internal.isRendering++
        console.flint('render', `Internal.isRendering(${Internal.isRendering})`)
        if (Internal.isRendering > 3) return

        let Main = Internal.views.Main && Internal.views.Main.component

        if (!Main && Internal.lastWorkingRenders.Main)
          Main = LastWorkingMain

        if (!Main)
          Main = MainErrorView

        if (!browserNode) {
          Flint.renderedToString = React.renderToString(<Main />)
          afterRenderCb && afterRenderCb(Flint.renderedToString)
        }
        else {
          if (window.__isDevingDevTools)
            browserNode = '_flintdevtools'

          ReactDOM.render(<Main />, document.getElementById(browserNode))
        }

        Internal.lastWorkingViews.Main = Main
        emitter.emit('render:done')
        Internal.isRendering = 0
      }
    },

    // internal events
    on(name, cb) {
      emitter.on(name, cb)
    },

    // for use in jsx
    debug: () => { debugger },

    // load a file
    file(file, run) {
      if (!process.env.production) {
        Internal.viewsInFile[file] = []
        Internal.changedViews = []
        Internal.currentHotFile = file
        Internal.caughtRuntimeErrors = 0
      }

      // capture exports
      let fileExports = {}

      // run file
      run(fileExports)

      Flint.setExports(fileExports)

      if (!process.env.production) {
        const cached = Internal.viewCache[file] || Internal.viewsInFile[file]
        const views = Internal.viewsInFile[file]

        // remove Internal.viewsInFile that werent made
        const removed = arrayDiff(cached, views)
        removed.map(Internal.removeView)

        Internal.currentHotFile = null
        Internal.viewCache[file] = Internal.viewsInFile[file]

        if (Internal.firstRender)
          return

        setTimeout(() => {
          const added = arrayDiff(views, cached)

          // send runtime success before render
          Tools.emitter.emit('runtime:success')

          // if removed, just root
          if (removed.length || added.length)
            return Flint.render()

          Internal.changedViews.forEach(name => {
            if (!Internal.mountedViews[name]) return

            Internal.mountedViews[name] = Internal.mountedViews[name].map(view => {
              if (view.isMounted()) {
                view.forceUpdate()
                return view
              }
            }).filter(x => !!x)

            setTimeout(() => emitter.emit('render:done'))
          })
        })
      }
    },

    view(name, body) {
      const comp = opts => createComponent(Flint, Internal, name, body, opts)

      if (process.env.production)
        return setView(name, comp())

      const hash = hashsum(body)

      function setView(name, component) {
        Internal.views[name] = { hash, component }
      }

      // set view in cache
      let viewsInCurrentFile = Internal.viewsInFile[Internal.currentHotFile]

      viewsInCurrentFile.push(name)

      // if new
      if (!Internal.views[name]) {
        setView(name, comp({ hash, changed: true }))
        Internal.changedViews.push(name)
        return
      }

      // dev stuff
      if (!process.env.production) {
        if (!Internal.mountedViews[name])
          Internal.mountedViews[name] = []

        // not new
        // if defined twice during first run
        if (Internal.firstRender) {
          Internal.views[name] = ErrorDefinedTwice(name)
          throw new Error(`Defined a view twice: ${name}`)
        }

        // if unchanged
        if (Internal.views[name].hash == hash) {
          setView(name, comp({ hash, unchanged: true }))
          return
        }

        // changed
        setView(name, comp({ hash, changed: true }))
        Internal.changedViews.push(name)

        // this resets tool errors
        window.onViewLoaded()
      }
    },

    getFile(name) {
      return Internal.viewsInFile[name] || []
    },

    deleteFile(name) {
      const viewsInFile = Internal.viewsInFile[name]

      if (viewsInFile) {
        Internal.viewsInFile[name].map(Internal.removeView)
        delete Internal.viewsInFile[name]
      }

      delete Internal.viewCache[name]
      Flint.render()
    },

    getView(name, parentName) {
      let result

      // View.SubView
      const subName = `${parentName}.${name}`
      if (Internal.views[subName]) {
        result = Internal.views[subName].component
      }
      // regular view
      else if (Internal.views[name]) {
        result = Internal.views[name].component
      }
      else {
        result = NotFound(name)
      }

      return result
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
      Internal.inspector[path] = cb
      setInspector(path)
    }
  }

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
