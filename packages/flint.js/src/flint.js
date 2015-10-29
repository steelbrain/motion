import hashsum from 'hash-sum'
import ee from 'event-emitter'
import React from 'react'
import raf from 'raf'
import ReactDOM from 'react-dom'
import clone from 'clone'
import Bluebird, { Promise } from 'bluebird'

import 'reapp-object-assign'
import './shim/root'
import './shim/flintMap'
import './shim/on'
import './shim/partial'
import './lib/bluebirdErrorHandle'
import createComponent from './createComponent'
import range from './lib/range'
import iff from './lib/iff'
import router from './lib/router'
import assignToGlobal from './lib/assignToGlobal'
import safeRun from './lib/safeRun'
import reportError from './lib/reportError'
import arrayDiff from './lib/arrayDiff'
import createElement from './tag/createElement'
import ErrorDefinedTwice from './views/ErrorDefinedTwice'
import NotFound from './views/NotFound'
import Main from './views/Main'


const uuid = () => Math.floor(Math.random() * 1000000)
function pathToName(path) {
  let p = path.split(',')
  return p[p.length - 1].split('.')[0]
}

/*

  Welcome to Flint!

    This file deals mostly with setting up Flint,
    loading views and files, rendering,
    and exposing the public Flint functions

*/

Promise.longStackTraces()

// GLOBALS
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

  // error handling
  const flintOnError = (...args) => {
    reportError(...args)

    // restore last working views
    Object.keys(Internal.views).forEach(name => {
      Internal.views[name] = Internal.lastWorkingViews[name]
    })
  }

  root.onerror = flintOnError

  const Internal = root._Flint = {
    views: {},
    hashes: {},
    removeView(key) { delete Internal.views[key] },

    isRendering: 0,
    firstRender: true,

    viewCache: {}, // map of views in various files
    viewsInFile: {}, // current build up of running hot insertion
    currentFileViews: null, // tracks views as file loads, for hot reloading
    currentHotFile: null, // current file that is running
    getCache: {}, // stores { path: { name: val } } for use in view.get()
    getCacheInit: {}, // stores the vars after a view is first run
    propsHashes: {},

    changedViews: [],
    mountedViews: {},
    lastWorkingViews: {},
    lastWorkingRenders: {},
    preloaders: [], // async functions needed before loading app

    // devtools
    inspector: {},
    viewsAtPath: {},

    setCache(path, name, val) {
      Internal.getCache[path][name] = val
      // when devtools inspecting
      setInspector(path)
    }
  }

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
    const name = pathToName(path)
    // TODO: why is this using lastWorkingViews
    Internal.views[name] = Internal.lastWorkingViews[name]
    Flint.render()
  }

  function setInspector(path) {
    if (Internal.inspector.path && Internal.inspector.path == path) {
      const name = pathToName(path)
      let props = Internal.viewsAtPath[path].props
      const state = Internal.getCache[path]
      Internal.inspector.cb(name, props, state, writeBack)
    }
  }

  const emitter = ee({})

  let Flint = {
    router,
    range,
    iff,

    render() {
      Internal.firstRender = false

      if (Internal.preloaders.length)
        Promise.all(Internal.preloaders.map(loader => loader())).then(run)
      else
        run()

      function run() {
        Internal.isRendering++
        log(`render(), Internal.isRendering(${Internal.isRendering})`)
        if (Internal.isRendering > 3) return

        const MainComponent = (
            Internal.views.Main || Internal.lastWorkingViews.Main
        )

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
        Internal.isRendering = 0
      }
    },

    // internal events
    on(name, cb) { emitter.on(name, cb) },

    // for use in jsx
    debug: () => { debugger },

    // load a file
    file(file, run) {
      if (!process.env.production) {
        Internal.viewsInFile[file] = []
        Internal.changedViews = []
        Internal.currentHotFile = file
      }

      // capture exports
      let fileExports = {}

      // run file
      run(fileExports)

      Flint.setExports(fileExports)

      if (!process.env.production) {
        // check for removed
        if (Internal.viewCache[file]) {
          const cached = Internal.viewCache[file] || []
          const views = Internal.viewsInFile[file]
          const removed = arrayDiff(cached, views)
          removed.map(Internal.removeView)
        }

        Internal.currentHotFile = null
        Internal.viewCache[file] = Internal.viewsInFile[file]

        if (Internal.firstRender)
          return

        raf(() => {
          Internal.changedViews.forEach(name => {
            console.log(name)
            Internal.mountedViews[name] = Internal.mountedViews[name].map(view => {
              console.log('mounted view', view, view.isMounted())
              if (view.isMounted()) {
                view.forceUpdate()
                return view
              }
            }).filter(x => !!x)
          })
        })
      }
    },

    view(name, body) {
      const comp = createComponent.partial(Flint, Internal, name, body)

      function setView(name, component) {
        Internal.views[name] = component
      }

      if (process.env.production)
        setView(name, comp())

      const hash = hashsum(body)

      // if new
      if (!Internal.views[name]) {
        setView(name, comp({ hash, changed: true }))
        Internal.changedViews.push(name)
        return
      }

      // hot reloaded
      if (!process.env.production) {
        if (!Internal.mountedViews[name])
          Internal.mountedViews[name] = []

        Internal.viewsInFile[Internal.currentHotFile].push(name)

        // defined twice
        if (Internal.firstRender) {
          Internal.views[name] = ErrorDefinedTwice(name)
          throw new Error(`Defined a view twice: ${name}`)
        }

        // if unchanged
        if (Internal.hashes[name] == hash) {
          setView(name, comp({ hash, unchanged: true }))
          return
        }

        // update hash
        Internal.hashes[name] = hash

        // changed
        setView(name, comp({ hash, changed: true }))
        Internal.changedViews.push(name)

        // this resets tool errors
        window.onViewLoaded()
      }
    },

    deleteFile(name) {
      const weirdName = `/${name}`
      Internal.viewsInFile[weirdName].map(Internal.removeView)
      delete Internal.viewsInFile[weirdName]
      delete Internal.viewCache[weirdName]
      Flint.render()
    },

    getView(name, parentName) {
      let result

      // View.SubView
      const subName = `${parentName}.${name}`
      if (Internal.views[subName]) {
        result = Internal.views[subName]
      }
      // regular view
      else if (Internal.views[name]) {
        result = Internal.views[name]
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

function log(...args) {
  if (window.location.search == '?debug') console.log(...args)
}