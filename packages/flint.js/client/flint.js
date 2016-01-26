import 'whatwg-fetch'

import hashsum from 'hash-sum'
import ee from 'event-emitter'
import React from 'react'
import ReactDOM from 'react-dom'
import rafBatch from './lib/reactRaf'
import { StyleRoot, keyframes } from 'flint-radium'
import regeneratorRuntime from './vendor/regenerator'

import './shim/root'
import './shim/exports'
import './shim/on'
import './lib/promiseErrorHandle'
import internal from './internal'
import onError from './shim/flint'
import createComponent from './createComponent'
import range from './lib/range'
import iff from './lib/iff'
import router from './lib/router'
import requireFactory from './lib/requireFactory'
import staticStyles from './lib/staticStyles'
import safeRun from './lib/safeRun'
import reportError from './lib/reportError'
import arrayDiff from './lib/arrayDiff'
import createElement from './tag/createElement'
import ErrorDefinedTwice from './views/ErrorDefinedTwice'
import NotFound from './views/NotFound'
import LastWorkingMainFactory from './views/LastWorkingMain'
import MainErrorView from './views/Main'

const folderFromFile = (filePath) =>
  filePath.indexOf('/') < 0 ? '' : filePath.substring(0, filePath.lastIndexOf('/'))

/*
  Welcome to Flint!

    This file deals mostly with setting up Flint,
    loading views and files, rendering,
    and exposing the public Flint functions
*/

const Flint = {
  // set up flint shims
  init() {
    const originalWarn = console.warn
    // filter radium warnings for now
    console.warn = (...args) => {
      if (args[0] && args[0].indexOf('Unsupported CSS property "display') == 0) return
      if (args[0] && args[0].indexOf('Radium:') == 0) return
      originalWarn.call(console, ...args)
    }

    // prevent breaking when writing $ styles in auto-save mode
    if (!process.env.production) {
      root.$ = null
    }

    if (process.env.production) {
      rafBatch.inject()
    }

    // shims
    root.React = React
    root.ReactDOM = ReactDOM
    root.global = root // for radium
    root.regeneratorRuntime = regeneratorRuntime
    root.on = on
    root.fetch.json = (a, b, c) => fetch(a, b, c).then(res => res.json())
    root.require = requireFactory(root)
  },

  // run an app
  run(name, _opts, afterRenderCb) {
    // default opts
    const opts = Object.assign({
      node: '_flintapp'
    }, _opts)

    const ID = ''+Math.random()

    // init require
    root.require.setApp(name)

    // init Internal
    const Internal = internal.init(ID)
    root._Flint = Internal

    // tools bridge
    const Tools = root._DT

    if (!process.env.production && Tools) {
      // pass data from tools to internal
      Tools.emitter.on('editor:state', () => {
        Internal.editor = Tools.editor
      })
    }

    // setup shims that use Internal
    onError(Internal, Tools)
    const LastWorkingMain = LastWorkingMainFactory(Internal)

    const emitter = ee({})

    //
    // begin the flintception
    //

    const Flint = {
      start() {
        router.init(ID, { onChange: Flint.render })
        Flint.render()
      },

      // private API
      reportError,
      range,
      iff,
      noop: function(){},

      // alpha
      _onViewInstance: (name, decorator) => !decorator
        ? Internal.instanceDecorator.all = name
        : Internal.instanceDecorator[name] = decorator,
      _decorateView: (name, decorator) => !decorator
        ? Internal.viewDecorator.all = name
        : Internal.viewDecorator[name] = decorator,

      // external API
      keyframes,
      router,
      preloaders: [], // async functions needed before loading app

      preload(fn) {
        Flint.preloaders.push(fn)
      },

      // styles, TODO: move internal
      staticStyles,
      viewRoots: {},
      styleClasses: {},
      styleObjects: {},
      timer: {
        // received info through script:add so we can time
        lastMsgInfo: null,

        //maps views to original time
        timing: {},
        lastTimes: {},
        hasLogged: false,
        done(view) {
          const timing = Flint.timer.timing[view]
          if (!time) return

          const time = +(Date.now()) - timing.start
          if (timing) {
            Flint.timer.lastTimes[view] = time
            delete Flint.timer.timing[view]
          }
          if (!Flint.timer.hasLogged) {
            setTimeout(() => Flint.timer.hasLogged = false)
            Flint.timer.lastTimes[view] = +(Date.now()) - timing.start
            on.event('hot:finished', { time })
          }
          Flint.timer.hasLogged = true
        },
        time(view, info) {
          Flint.timer.timing[view] = info
        },
      },

      render() {
        if (Flint.preloaders.length) {
          return Promise
            .all(Flint.preloaders.map(loader => typeof loader == 'function' ? loader() : loader))
            .then(run)
        }
        else
          run()

        function run() {
          Internal.isRendering++
          if (Internal.isRendering > 3) return

          // find Main
          let Main = Internal.views.Main && Internal.views.Main.component
          if (!Main && Internal.lastWorkingRenders.Main)
            Main = LastWorkingMain
          if (!Main)
            Main = MainErrorView

          // server render
          if (!opts.node) {
            Flint.renderedToString = React.renderToString(<Main />)
            afterRenderCb && afterRenderCb(Flint.renderedToString)
          }
          // browser render
          else {
            if (window.__isDevingDevTools)
              opts.node = '_flintdevtools'

            ReactDOM.render(
              <StyleRoot className="__flintRoot">
                <Main />
              </StyleRoot>,
              document.getElementById(opts.node)
            )
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

          // send runtime success before render
          Tools && Tools.emitter.emit('runtime:success')
          Internal.lastFileLoad = Date.now()
        }

        // set up require for file that resolves relative paths
        const fileFolder = folderFromFile(file)
        const scopedRequire = pkg => root.require(pkg, fileFolder)

        // run file!
        run(scopedRequire)

        if (!process.env.production) {
          const cached = Internal.viewCache[file] || Internal.viewsInFile[file]
          const views = Internal.viewsInFile[file]
          views.map(view => {
            Flint.timer.time(view, Flint.timer.lastMsgInfo)
          })

          // remove Internal.viewsInFile that werent made
          const removedViews = arrayDiff(cached, views)
          removedViews.map(Internal.removeView)

          Internal.currentHotFile = null
          Internal.viewCache[file] = Internal.viewsInFile[file]

          if (Internal.firstRender)
            return

          const isNewFile = !cached.length
          const addedViews = arrayDiff(views, cached)

          // safe re-render
          if (isNewFile || removedViews.length || addedViews.length)
            return Flint.render()

          // if outside of views the FILE changed, refresh all views in file
          if (!Internal.changedViews.length && Internal.fileChanged[file]) {
            Internal.changedViews = Internal.viewsInFile[file]
          }

          Internal.changedViews.forEach(name => {
            if (!Internal.mountedViews[name]) return

            Internal.mountedViews[name] = Internal.mountedViews[name].map(view => {
              if (view.isMounted()) {
                view.forceUpdate()
                return view
              }
            }).filter(x => !!x)

            emitter.emit('render:done')
            views.map(Flint.timer.done)
            Flint.timer.lastMsgInfo = null
          })
        }
      },

      removeFile(file) {
        const viewsFromFile = Internal.viewsInFile[file]
        viewsFromFile.forEach(Internal.removeView)

        delete Internal.viewCache[file]
        delete Internal.viewsInFile[file]
      },

      view(name, body) {
        const comp = opts => createComponent(Flint, Internal, name, body, opts)

        if (process.env.production)
          return setView(name, comp())

        const hash = hashsum(body)

        function setView(name, component) {
          Internal.views[name] = { hash, component, file: Internal.currentHotFile }
        }

        // set view in cache
        let viewsInFile = Internal.viewsInFile[Internal.currentHotFile]
        if (viewsInFile)
          viewsInFile.push(name)

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
          if (Internal.firstRender && !Internal.runtimeErrors) {
            Internal.views[name] = ErrorDefinedTwice(name)
            throw new Error(`Defined a view twice: ${name}`)
          }

          // if unchanged
          if (Internal.views[name].hash == hash) {
            setView(name, comp({ hash }))
            return
          }

          // changed
          setView(name, comp({ hash, changed: true }))
          Internal.changedViews.push(name)

          // this resets tool errors
          window.onViewLoaded()
        }
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

      getView(name) {
        let result

        // regular view
        if (Internal.views[name]) {
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
        return router.getParams(path)
      },

      inspect(path, cb) {
        Internal.inspector[path] = cb
        Internal.setInspector(path)
      }
    }

    // view shim (TODO freeze)
    root.view = {
      el(info, props, ...children) {
        if (typeof info[0] === 'string' && info[0].charAt(0).toUpperCase() === info[0].charAt(0)) {
          return React.createElement(Flint.getView(info[0]), props)
        }

        return React.createElement(info[0], props, ...children);
      }
    }

    // prevent overwriting
    Object.freeze(Flint)

    // if given an app, run it
    if (name && root.exports[name]) {
      const app = root.exports[name]
      app(Flint, opts)
    }

    return Flint
  }
}

root.exports.flint = Flint
