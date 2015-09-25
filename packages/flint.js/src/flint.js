import './lib/shimFlintMap'
import 'reapp-object-assign'
import ee from 'event-emitter'
import resolveStyles from 'flint-radium/lib/resolve-styles'
import Radium from 'radium'
import React from 'react'
import ReactDOM from 'react-dom'
import equal from 'deep-equal'
import clone from 'clone'
import createElement from './tag/createElement'
import Wrapper from './views/Wrapper'
import ErrorDefinedTwice from './views/ErrorDefinedTwice'
import mainComponent from './lib/mainComponent'
import { Promise } from 'bluebird'

const inBrowser = typeof window != 'undefined'
const root = inBrowser ? window : global

const raf = (fn) => inBrowser ? requestAnimationFrame(fn) : setTimeout(fn)
const uuid = () => Math.floor(Math.random() * 1000000)
const runEvents(queue, name) => queue && queue.length && queue[name].forEach(e => e())

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

  const setComponent = (key, val) => (opts.namespace[key] = val)
  const getComponent = (key) => opts.namespace[key]
  const emitter = ee({})

  let Flint = {
    // if hasn't rendered main, don't push snapshots
    stores: {},
    id: uuid(),
    activeViews: {},
    snapshots: [],
    snapshot: [],
    views: {},
    lastWorkingView: {},
    firstRender: true,
    // async functions needed before loading app
    preloaders: [],
    routes: null,

    element: createElement,
    render,

    on(name, cb) { emitter.on(name, cb) },

    makeReactComponent(name, component, options = {}) {
      let id;
      const Flint = this;

      const spec = {
        displayName: name,

        componentWillUpdate(nextProps) {
          this.props = nextProps
        },

        update() {
          if (this.hasRun) {
            this.forceUpdate();
          }
        },

        el: createElement,
        Flint,
        name,

        getInitialState() {
          id = (name == 'Main') ? 'Main' : uuid();

          this.style = {};
          this.entityId = id;
          this.cachedChildren = {};
          this.updatedProps = false
          this.events = {
            mount: [],
            unmount: [],
            update: [],
            props: []
          };

           // watch for errors with ran
          let ran = false;
          this._render = component.call(void 0, this)
          ran = true;

          if (!ran) return null;

          this.hasRun = true;
          Flint.activeViews[id] = this;

          return null;
        },

        componentWillReceiveProps(nextProps) {
          runEvents(this.events, 'props')
        },

        componentDidMount() {
          runEvents(this.events, 'mount')
        },

        componentWillUnmount() {
          runEvents(this.events, 'unmount')
          delete Flint.activeViews[id];
        },

        componentDidUpdate() {
          runEvents(this.events, 'update')
        },

        render() {
          const els = this._render.call(this);
          const wrapperStyle = this.styles && this.styles['style']

          return els && resolveStyles(this, React.cloneElement(els, {
            __disableWrapper: wrapperStyle ? wrapperStyle() === false : false
          }));
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
      if (Flint.views[name])
        return Flint.views[name].component;

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
        setComponent(name, ErrorDefinedTwice)
        return
      }

      // if unchanged
      if (Flint.views[name].hash == hash) return
      // start with a success and maybe an error will fire before next frame
      root._DT.emitter.emit('runtime:success')

      // if changed
      const setView = (name, flintComponent) => {
        Flint.views[name] = Flint.makeView(hash, flintComponent)
        setComponent(name, flintComponent) // puts on namespace
        if (Flint.firstRender) return
      }

      let viewRanSuccessfully = true;

      root.onerror = (...args) => {
        viewRanSuccessfully = false;

        if (Flint.lastWorkingView[name]) {
          setView(name, Flint.lastWorkingView[name])
          render()
        }

        flintRuntimeError(...args)
        return false
      }

      Flint.on("afterRender", () => {
        if (viewRanSuccessfully)
          Flint.lastWorkingView[name] = Flint.views[name].component
      })

      let flintComponent = Flint.makeReactComponent(name, component, { isChanged: true });
      setView(name, flintComponent);

      let active = Flint.activeViews
      let activeViewsToRemove = Object.keys(active).filter(id => active[id].name == name)

      raf(() => {
        activeViewsToRemove.map(id => delete Flint.activeViews[id])
      })

      onViewLoaded() //tools errors todo
    },

    // make all array methods non-mutative
    shimProperties(id, name, val) {
      if (Array.isArray(val)) {
        // add ref to array
        val.__flintRef = { id, name };
      }
    },

    setHotVars(id, values) {
      if (!values) return

      const nowValues = clone(Flint.values[id])
      if (!Flint.cachedViewState[id]) Flint.cachedViewState[id] = {}
      let original = Flint.cachedViewState[id]

      Object.keys(values).map(key => {
        if (Flint.values[id][key] === original[key]) {
          Flint.set(id, key, values[key])
        }
      })
      Flint.cachedViewState[id] = nowValues
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
        var i = 0;
        var len = names.length;

        for (; i < len; i++) {
          var name = names[i]

          if (root[name])
            throw (
              "You're attempting to define a global that is already defined: "
              + name
              + " = "
              + JSON.stringify(root[name])
            );

          root[name] = exports[name]
        }
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
