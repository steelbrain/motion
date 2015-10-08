import 'reapp-object-assign'
import ee from 'event-emitter'
import resolveStyles from 'flint-radium/lib/resolve-styles'
// import Radium from 'radium'
import React from 'react'
import ReactDOM from 'react-dom'
import raf from 'raf'
import equal from 'deep-equal'
import clone from 'clone'
import Bluebird, { Promise } from 'bluebird'

import './lib/setRoot'
import './lib/shimFlintMap'
import arrayDiff from './lib/arrayDiff'
import assignToGlobal from './lib/assignToGlobal'
import on from './lib/on'
import createElement from './tag/createElement'
import Wrapper from './views/Wrapper'
import ErrorDefinedTwice from './views/ErrorDefinedTwice'
import mainComponent from './lib/mainComponent'
import reportError from './lib/reportError'

Promise.longStackTraces()

// GLOBALS
root._bluebird = Bluebird // for imported modules to use
root.on = on
root.Promise = Promise
root.module = {}
root.fetchJSON = (...args) => fetch(...args).then(res => res.json())
root.onerror = reportError
// shim view
root.view = { update: () => {} }

const uuid = () => Math.floor(Math.random() * 1000000)

const runEvents = (queue, name) =>
  queue && queue[name].length && queue[name].forEach(e => e())

const safeRun = fn => {
  if (process.env.production)
    fn()
  else {
    try {
      fn()
    }
    catch(e) {
      const { name, message, stack } = e
      console.error(e)
      reportError({ name, message, stack })
    }
  }
}

function run(browserNode, userOpts, afterRenderCb) {
  const opts = Object.assign({
    namespace: {},
    entry: 'Main'
  }, userOpts);

  // put Flint instance on root given app name
  // tools uses this (root.devTools)
  if (opts.namespace !== root && opts.app)
    root[opts.app] = opts.namespace

  const isTools = opts.app == 'devTools'
  let firstRun = false

  const render = () => {
    const run = () => {
      const MainComponent = getComponent('Main') || mainComponent;

      if (!browserNode) {
        Flint.renderedToString = React.renderToString(<MainComponent />)
        afterRenderCb && afterRenderCb(Flint.renderedToString)
      }
      else {
        ReactDOM.render(<MainComponent />, document.getElementById(browserNode))
      }

      firstRun = false
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

  const removeComponent = key => {
    Flint.views[key] = undefined
    root[key] = undefined
  }

  const setComponent = (key, val) => (opts.namespace[key] = val)
  const getComponent = (key) => opts.namespace[key]
  const emitter = ee({})

  let Flint = {
    id: uuid(),
    activeViews: {},
    isUpdating: false,
    views: {},
    lastWorkingView: {},
    // async functions needed before loading app
    preloaders: [],
    routes: null,

    element: createElement,
    render,

    on(name, cb) { emitter.on(name, cb) },

    // map of views in various files
    viewCache: {},
    // current build up of running hot insertion
    viewsInFile: {},
    // current file that is running
    currentHotFile: null,

    file(file, run) {
      Flint.viewsInFile[file] = []
      Flint.currentHotFile = file
      let fileExports

      fileExports = run({})

      Flint.setExports(fileExports)
      const cached = Flint.viewCache[file] || []
      const views = Flint.viewsInFile[file]
      const added = arrayDiff(views, cached)
      const removed = arrayDiff(cached, views)

      // remove views that werent made
      removed.map(removeComponent)
      Flint.currentHotFile = null
      Flint.viewCache[file] = Flint.viewsInFile[file]
      raf(() => {
        Flint.activeViews.Main &&
        Flint.activeViews.Main.isMounted &&
        Flint.activeViews.Main.forceUpdate()
      })
    },

    makeReactComponent(name, component, options = {}) {
      let id;

      const spec = {
        displayName: name,
        el: createElement,
        name,
        Flint,

        update() {
          if (!Flint.isUpdating && this.hasRun && this.isMounted && !this.isPaused)
            this.forceUpdate()
        },

        getInitialState() {
          id = (name == 'Main') ? 'Main' : uuid();

          this.styles = {};
          this.entityId = id;
          this.events = {
            mount: [],
            unmount: [],
            update: [],
            props: []
          };

          const viewOn = (scope, name, cb) => {
            // check if they defined their own scope
            if (name && typeof name == 'string')
              return on(scope, name, cb)
            else
              return on(this, scope, name)
          };

           // watch for errors with ran
          let ran = false;

          safeRun(() => {
            component.call(void 0, this, viewOn)
            ran = true
          })

          if (!ran)
            return null

          this.hasRun = true;
          Flint.activeViews[id] = this;

          return null;
        },

        componentWillReceiveProps(nextProps) {
          this.props = nextProps
          runEvents(this.events, 'props')
        },

        componentDidMount() {
          this.isMounted = true
          runEvents(this.events, 'mount')
        },

        componentWillUnmount() {
          this.isMounted = false
          runEvents(this.events, 'unmount')
          delete Flint.activeViews[id];
        },

        componentWillUpdate() {
          Flint.isUpdating = true
          runEvents(this.events, 'update')
          Flint.isUpdating = false
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

        // propTypes(obj) {
        //   if (!obj) return
        //
        //   this.constructor.propTypes = obj
        // },

        render() {
          let els

          if (process.env.production)
            els = this._render()
          else {
            try {
              els = this._render()
              this.goodRastRender = els // cache
            }
            catch(e) {
              const { name, message, stack } = e
              reportError({ name, message, stack })
              console.error('Error rendering JSX for view:', name, e)
              els = this.goodRastRender || null
            }
          }

          const wrapperStyle = this.style && this.style['$']
          const __disableWrapper = wrapperStyle ? wrapperStyle() === false : false
          const withProps = React.cloneElement(els, { __disableWrapper });
          const styled = els && resolveStyles(this, withProps)
          return styled
        }
      }

      return React.createClass(spec);
    },

    getView(name) {
      if (/Flint\.[\.a-zA-Z0-9]*Wrapper/.test(name))
        return Wrapper;

      // When importing something, babel may put it into __reactMotion.Spring,
      // which comes in as a string, so we need to lookup on root
      if (name.indexOf('.') !== -1) {
        const appView = name.split('.').reduce((acc, cur) => (acc || {})[cur], root);
        if (appView) return appView
      }

      // TODO: this fixes importing a react element, but its sloppy
      // import Element from 'some-element'; can be used <Element>
      if (root[name])
        return root[name];

      // View.SubView
      const subName = `${view}.${name}`
      if (Flint.views[subName])
        return Flint.views[subName].component

      // regular view
      if (Flint.views[name]) {
        return Flint.views[name].component;
      }

      // "global" views
      const namespaceView = opts.namespace[name] || root[name];
      if (namespaceView)
        return namespaceView;

      return class NotFound extends React.Component {
        render() {
          const message = `Flint: view "${name}" not found`
          return <div style={{ display: 'block' }}>{message}</div>
        }
      }
    },

    view(name, hash, component) {
      Flint.viewsInFile[Flint.currentHotFile].push(name)

      // if new view
      if (Flint.views[name] == undefined) {
        let fComponent = Flint.makeReactComponent(name, component, { isNew: true });
        Flint.views[name] = Flint.makeView(hash, fComponent);
        Flint.lastWorkingView[name] = Flint.views[name].component;
        setComponent(name, fComponent) // puts on namespace
        return
      }

      // not new view

      // if view was defined twice
      // (in codebase twice during first run)
      if (firstRun) {
        console.error('Defined a view twice!', name, hash)
        setComponent(name, ErrorDefinedTwice(name))
        return
      }

      // if unchanged
      if (Flint.views[name].hash == hash)
        return

      // start with a success and maybe an error will fire before next frame
      root._DT.emitter.emit('runtime:success')

      // if changed
      const setView = (name, flintComponent) => {
        Flint.views[name] = Flint.makeView(hash, flintComponent)
        setComponent(name, flintComponent) // puts on namespace
        if (firstRun) return
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

      let flintComponent = Flint.makeReactComponent(name, component, { isChanged: true });
      setView(name, flintComponent);
      window.onViewLoaded() //tools errors todo
    },

    // make all array methods non-mutative
    shimProperties(id, name, val) {
      if (Array.isArray(val)) {
        // add ref to array
        val.__flintRef = { id, name };
      }
    },

    makeView(hash, component) {
      return { hash, component };
    },

    getStyle(id, name) {
      return Flint.styles && Flint.styles[id][name]
    },

    addRoutes(routes) {
      Flint.routes = routes
    },

    // export globals
    setExports(_exports) {
      if (!_exports) return
      const names = Object.keys(_exports);

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

  // make mutative array methods trigger updates in views
  ['push', 'reverse', 'splice', 'shift', 'pop', 'unshift', 'sort'].map(method => {
    const vanilla = Array.prototype[method];

    Array.prototype[method] = function(...args) {
      const result = vanilla.apply(this, args);

      if (this.__flintRef) {
        Flint.set(this.__flintRef.id, this.__flintRef.name, this)
        Flint.setViews();
      }

      return result;
    }
  })

  // set flint onto namespace
  opts.namespace.Flint = Flint;

  return Flint;
}

export default run
