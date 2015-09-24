import './lib/shimFlintMap'
import 'reapp-object-assign'
import ee from 'event-emitter'
import resolveStyles from 'flint-radium/lib/resolve-styles'
import React from 'react'
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

root.inView = false
root.__ = { update: () => {} }

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
        React.render(<MainComponent />, document.getElementById(browserNode))
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
    hotUpdates: {},
    activeViews: {},
    lastChangedViews: [],
    snapshots: [],
    snapshot: [],
    views: {},
    lastWorkingView: {},
    firstRender: true,
    // async functions needed before loading app
    preloaders: [],
    // for avoiding multiple updates
    isBatchingChanges: false,
    batchedChanges: [],
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
          if (this.beforeRender)
            this.beforeRender(nextProps);

          this.props = nextProps
          const id = this.entityId

          // main updates hot loading automatically
          if (id == 'Main') return

          if (Flint.hotUpdates[name]) {
            Flint.hotUpdates[name].call(this)
            Flint.setHotVars(id, beforeHot)
          }
        },

        update() {
          if (this.hasRun) {
            this.forceUpdate();
          }
        },

        style: {},
        el: createElement,
        Flint,
        name,

        getInitialState() {
          id = (name == 'Main') ? 'Main' : uuid();

          this.name = name;
          this.entityId = id;
          this.cachedChildren = {};
          this.appName = opts.app;

          this.events = {
            mount: [],
            props: []
          };

          this.updatedProps = false

          let ran = false; // watch for errors
          this._render = component.call(this, this) // run component render
          ran = true;

          if (ran) {
            this.hasRun = true;
            Flint.activeViews[id] = this;
          }

          return null;
        },

        componentDidMount() {
          if (this.events.mount.length)
            this.events.mount.forEach(e => e());
        },

        componentWillUnmount() {
          // if (id) {
          //   // TODO: this is fishy, ID is tied to class, not instance
          //   // see styles.js for where the fix should start
          //   delete Flint.cachedViewState[id]
          //   delete Flint.styleFunctions[id]
          //   delete Flint.activeViews[id]
          // }
        },

        render() {
          const els = this._render.call(this, this);
          const wrapperStyle = this.styles && this.styles['style']

          return els && resolveStyles(this, React.cloneElement(els, {
            __disableWrapper: wrapperStyle ? wrapperStyle() === false : false
          }));
        }
      }

      return React.createClass(spec);
    },

    // make all array methods non-mutative
    shimProperties(id, name, val) {
      if (Array.isArray(val)) {
        // add ref to array
        val.__flintRef = { id, name };
      }
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
      // console.log('define view', name, hash, component, Flint.firstRender)

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
        Flint.hotUpdates[name] = component
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
        delete Flint.hotUpdates[name]
      })

      onViewLoaded() //tools errors todo
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
