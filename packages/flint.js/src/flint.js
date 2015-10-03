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

import './lib/shimFlintMap'
import arrayDiff from './lib/arrayDiff'
import on from './lib/on'
import createElement from './tag/createElement'
import Wrapper from './views/Wrapper'
import ErrorDefinedTwice from './views/ErrorDefinedTwice'
import mainComponent from './lib/mainComponent'

const inBrowser = typeof window != 'undefined'
const root = inBrowser ? window : global

if (inBrowser) window.root = window
else global.root = global

// GLOBALS
root._bluebird = Bluebird
root.on = on
root.Promise = Promise
root.module = {}
root.fetchJSON = (...args) => fetch(...args).then(res => res.json())

const uuid = () => Math.floor(Math.random() * 1000000)
const runEvents = (queue, name) =>
  queue && queue[name].length && queue[name].forEach(e => e())
const assignToGlobal = (name, val) => {
  // TODO reenable after solving the saving issue
  /*
  if (typeof root[name] != 'undefined')
    throw `You're attempting to define a global that is already defined:
        ${name} = ${JSON.stringify(root[name])}`
  */

  root[name] = val
}

root.inView = false

// shim view
root.view = { update: () => {} }

if (!inBrowser) {
  // for isomorphic help
  root.document = {}
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

  const render = () => {
    const MainComponent = getComponent('Main') || mainComponent;
    const preloaders = Flint.preloaders.map(loader => loader())

    Promise.all(preloaders).then(() => {
      if (!browserNode) {
        Flint.renderedToString = React.renderToString(<MainComponent />);
        if (afterRenderCb)
          afterRenderCb(Flint.renderedToString);
      }
      else {
        ReactDOM.render(<MainComponent />, document.getElementById(browserNode))
      }

      Flint.firstRender = false
      emitter.emit('afterRender')
    })
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
    firstRender: true,
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

    hotload(file, run) {
      Flint.viewsInFile[file] = []
      Flint.currentHotFile = file
      const exports = run({})
      Flint.setExports(exports)
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

        pause() { this.isPaused = true },
        resume() { this.isPaused = false },

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
          this._render = component.call(void 0, this, viewOn)
          ran = true;

          if (!ran) return null;

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

        componentDidUpdate() {
          Flint.isUpdating = true
          runEvents(this.events, 'update')
          Flint.isUpdating = false
        },

        render() {
          const els = this._render();
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

      // const subName = `${view}.${name}`
      //
      // // subview
      // if (Flint.views[subName])
      //   return Flint.views[subName].component

      // no view

      if (Flint.views[name]) {
        return Flint.views[name].component;
      }

      const namespaceView = opts.namespace[name] || root[name];

      if (namespaceView)
        return namespaceView;

      return class NotFound {
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
      // if first render & view is defined twice
      // we have a bug!
      else if (Flint.firstRender) {
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
        if (Flint.firstRender) return
      }

      let viewRanSuccessfully = true;

      // recover from errorful views
      root.onerror = (...args) => {
        viewRanSuccessfully = false;

        if (Flint.lastWorkingView[name]) {
          setView(name, Flint.lastWorkingView[name])
          render()
        }
        else {
          setView(name, ErrorDefinedTwice(name))
          render()
        }

        // run devtools
        if (!process.env.production) {
          if (root.flintRuntimeError)
            root.flintRuntimeError(...args)
          // catch errors if not in production
          return false
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
    setExports(exports) {
      const names = Object.keys(exports);

      if (names.length) {
        names.forEach(name => {
          if (name === 'default') {
            Object.keys(exports.default).forEach(key => {
              assignToGlobal(key, exports.default[key])
            })
          }

          assignToGlobal(name, exports[name])
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
