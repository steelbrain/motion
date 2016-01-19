//
// Flint internals, for storing runtime related stuff
//

let internals = {}

export function init(name) {
  function setInspector(path) {
    if (Internal.inspector[path]) {
      let props = Internal.viewsAtPath[path].props
      const state = Internal.getCache[path]
      Internal.inspector[path](props, state)
    }
  }

  const Internal = internals[name] = {
    opts: window.__flintopts, // sent from runner
    views: {},

    isRendering: 0,
    firstRender: true,
    isDevTools: name == 'devTools',

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
      delete Internal.mountedViews[key]
      delete Internal.lastWorkingViews[key]
    },

    isLive() {
      return Internal.editor && Internal.editor.live
    },

    // devtools
    inspector: {},
    viewsAtPath: {},
    editor: {},

    lastFileLoad: null,
    runtimeErrors: 0,

    setCache(path, name, val) {
      Internal.getCache[path][name] = val
      // when devtools inspecting
      setInspector(path)
    }
  }

  return Internal
}

export function get(name) {
  return internals[name]
}

export default { init, get }