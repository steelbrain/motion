import 'whatwg-fetch'
import 'reapp-object-assign'

import hashsum from 'hash-sum'
import ee from 'event-emitter'
import React from 'react'
import ReactDOM from 'react-dom'
import ReactCSSTransitionGroup from 'react/lib/ReactCSSTransitionGroup'
import ReactTransitionGroup from 'react/lib/ReactTransitionGroup'
import ReactCreateElement from './lib/ReactCreateElement'
import rafBatch from './lib/reactRaf'
import { StyleRoot, keyframes } from 'motion-radium'
import regeneratorRuntime from './vendor/regenerator'

import './shim/root'
import './shim/exports'
import './lib/promiseErrorHandle'
import $ from './$'
import cliOpts from './lib/opts'
import internal from './internal'
import onError from './shim/motion'
import CreateComponent from './createComponent'
import __motionRender from './lib/__motionRender.js'
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
  Welcome to Motion!

    This file deals mostly with setting up Motion,
    loading views and files, rendering,
    and exposing the public Motion functions
*/

const Motion = {
  // set up motion shims
  init() {
    const originalWarn = console.warn
    // filter radium warnings for now
    console.warn = (...args) => {
      if (args[0] && args[0].indexOf('Unsupported CSS property "display') == 0) return
      if (args[0] && args[0].indexOf('Radium:') == 0) return
      originalWarn.call(console, ...args)
    }

    if (process.env.production) {
      rafBatch.inject()
    }

    // shims
    root.require = requireFactory(root)
    root.React = React
    root.Component = React.Component
    root.ReactDOM = ReactDOM
    root.global = root // for radium
    root.regeneratorRuntime = regeneratorRuntime
    root.fetch.json = (a, b, c) => fetch(a, b, c).then(res => res.json())
    root.process = root.process || {
      env: {
        NODE_ENV: process.env.production ? 'production' : 'development'
      }
    }
  },

  // run an app
  run(name, _opts, afterRenderCb) {
    // default opts
    const opts = Object.assign({
      node: '_motionapp'
    }, _opts)

    const ID = ''+Math.random()

    // init require
    root.require.setApp(name)

    // init Internal
    const Internal = internal.init(ID)

    // tools bridge
    const Tools = root._DT

    // shim React.createElement to get proxies even on components
    // passed around to external things that render them through react
    if (!process.env.production) {
      React.createElement = function(el, ...args) {
        if (el.__motioninfo__) {
          return ReactCreateElement(Internal.views[el.__motioninfo__.name], ...args)
        }

        return ReactCreateElement(el, ...args)
      }
    }

    if (!process.env.production && Tools) {
      // pass data from tools to internal
      Tools.on('editor:state', () => {
        Internal.editor = Tools.editor
      })
    }

    // set up Internal
    // TODO cleanup
    root._Motion = Internal
    root.module = root.module || {}
    onError(Internal, Tools)
    const LastWorkingMain = LastWorkingMainFactory(Internal)

    const emitter = ee({})

    //
    // begin the motionception
    //

    let Motion = {}

    // pass in Motion
    let createComponent = CreateComponent(Motion, Internal)
    root.$ = $(Motion)
    root.exports = Object.assign(root.exports || {}, {
      Motion,
      ReactCSSTransitionGroup,
      ReactTransitionGroup
    })

    // Motion
    Motion = Object.assign(Motion, {
      start() {
        Internal.entry = Internal.entry || Internal.views.Main.component
        router.init(ID, { onChange: Motion.run })
        Motion.run()
      },

      views: {},
      viewTypes: {
        FN: 'FN',
        CLASS: 'CLASS'
      },

      createElement,
      keyframes,
      router,

      // async functions before loading app
      preloaders: [],
      preload(fn) { Motion.preloaders.push(fn) },

      // set entry to app
      entry(entry) {
        // allow `export default <dom />`
        if (React.isValidElement(entry))
          Internal.entry = () => entry
        else
          Internal.entry = Motion.getComponent(entry)
      },

      run() {
        if (Motion.preloaders.length) {
          return Promise
            .all(Motion.preloaders.map(loader => typeof loader == 'function' ? loader() : loader))
            .then(run)
        }
        else
          run()

        function run() {
          Internal.isRendering++
          if (Internal.isRendering > 3) return

          // find Main
          let Main = Internal.entry

          if (!Main) {
            if (Internal.lastWorkingRenders.Main)
              Main = LastWorkingMain
          }

          if (!Main) {
            console.log('No entry component, "export default" your entry from your entry file')
            return
          }

          // server render
          if (!opts.node) {
            Motion.renderedToString = React.renderToString(<Main />)
            afterRenderCb && afterRenderCb(Motion.renderedToString)
          }
          // browser render
          else {
            if (window.__isDevingDevTools)
              opts.node = '_motiondevtools'

            ReactDOM.render(
              <StyleRoot className="__motionRoot">
                <Main />
              </StyleRoot>,
              document.getElementById(opts.node)
            )

            Internal.firstRender = false
          }

          Internal.lastWorkingViews.Main = Main
          emitter.emit('render:done')
          Internal.isRendering = 0
        }
      },

      // motion events
      on(name, cb) {
        emitter.on(name, cb)
      },

      // for use in jsx
      debug: () => { debugger },

      getComponent(component) {
        if (!component.__motioninfo__)
          return component

        const { name, type } = component.__motioninfo__

        if (!Internal.views[name])
          Motion.makeComponent(name, component, type)

        // return proxied component
        return Internal.views[name]
      },

      componentClass(name, component) {
        // classes pass in just the class itself (no name)
        // name is put onto .__motion.name
        if (!component) {
          component = name
          name = component.prototype.__motion.name
          component.prototype.__motionRender = __motionRender
        }

        return Motion.markComponent(name, component, Motion.viewTypes.CLASS)
      },

      componentFn(name, component) {
        return Motion.markComponent(name, component, Motion.viewTypes.FN)
      },

      // classes pass through here for proxying and tagging
      markComponent(name, component, type) {
        console.log('make component', name, type)
        component.__motioninfo__ = { name, type }

        // so that it updates
        delete Internal.views[name]
        delete Motion.views[name]

        Motion.makeComponent(name, component, type)

        Internal.changedViews.push(name)
        let viewsInFile = Internal.viewsInFile[Internal.currentHotFile]
        if (viewsInFile) viewsInFile.push(name)

        return component
      },

      makeComponent(name, component, type) {
        Internal.views[name] = createComponent(name, component, { changed: true, type })
        Motion.views[name] = component

        return component
      },

      // TODO extract hash body stuff
      view(name, body) {
        function comp(opts = {}) {
          return createComponent(name, body, { ...opts, type: Motion.viewTypes.VIEW })
        }

        function setView(name, component) {
          Internal.views[name] = { hash, component, file: Internal.currentHotFile }
          Motion.views[name] = component
        }

        if (process.env.production)
          return setView(name, comp())

        const hash = hashsum(body)

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

      getView(name) {
        return Motion.views[name] || NotFound(name)
      },


      //
      //  private API (TODO move this)
      //


      // styles, TODO: move to Internal
      staticStyles,
      viewRoots: {},
      styleClasses: {},
      styleObjects: {},

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

        // run file!
        const oldRequire = root.require // change require during hot reload, ugly but necessary atm
        root.require = pkg => oldRequire(pkg, fileFolder)
        run()
        root.require = oldRequire // restore

        if (!process.env.production) {
          const cached = Internal.viewCache[file] || Internal.viewsInFile[file]
          const views = Internal.viewsInFile[file]
          // views.map(view => {
          //   Motion.timer.time(view, Motion.timer.lastMsgInfo)
          // })

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
            return Motion.run()

          // if outside of views the FILE changed, refresh all views in file
          if (!Internal.changedViews.length && Internal.fileChanged[file]) {
            Internal.changedViews = Internal.viewsInFile[file]
          }

          Internal.changedViews.forEach(name => {
            if (!Internal.mountedViews[name]) return

            Internal.mountedViews[name] = Internal.mountedViews[name].map(view => {
              // this keeps our mounted view array nicely filtered lazily
              if (view.isMounted()) {
                view.forceUpdate()
                return view
              }
            }).filter(x => !!x)

            emitter.emit('render:done')
            // views.map(view => Motion.timer.done(view))
            // Motion.timer.lastMsgInfo = null
          })
        }
      },

      removeFile(file) {
        const viewsFromFile = Internal.viewsInFile[file]
        viewsFromFile.forEach(Internal.removeView)

        delete Internal.viewCache[file]
        delete Internal.viewsInFile[file]
      },

      deleteFile(name) {
        const viewsInFile = Internal.viewsInFile[name]

        if (viewsInFile) {
          Internal.viewsInFile[name].map(Internal.removeView)
          delete Internal.viewsInFile[name]
        }

        delete Internal.viewCache[name]
        Motion.run()
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
      },

      reportError,
      range,
      iff,
      noop: function(){},
    })

    // prevent overwriting
    Object.freeze(Motion)

    // if given an app, run it
    if (name && root.exports[name]) {
      const app = root.exports[name]
      app(Motion, opts)
    }

    return Motion
  }
}

root.exports.motion = Motion
