//
// Motion internals, for storing runtime related stuff
//

let internals = {}

export function init(name) {
  const Internal = internals[name] = {
    opts: window.__motionopts, // sent from runner
    views: {},

    isRendering: 0,
    firstRender: true,
    isDevTools: name == 'motiontools',

    paths: {}, // cache hotreload paths
    viewCache: {}, // map of views in various files
    viewsInFile: {}, // current build up of running hot insertion
    currentFileViews: null, // tracks views as file loads, for hot reloading
    currentHotFile: null, // current file that is running
    getCache: {}, // stores { path: { name: val } } for use in view.get()
    getCacheInit: {}, // stores the vars after a view is first run

    fileChanged: {},
    changedViews: [],
    getInitialStates: [],
    mountedViews: {},
    lastWorkingViews: {},
    lastWorkingRenders: {},

    // Motion.decorateView & Motion.onViewInstance
    viewDecorator: {},
    instanceDecorator: {},

    resetViewsInFile(file) {
      const views = Internal.viewsInFile[file]

      if (views && views.length) {
        views.forEach(Internal.removeView)
      }
    },

    resetViewState(views) {
      Internal.views = {}
      // Internal.mountedViews = {}
      Internal.lastWorkingViews = {}
    },

    removeView(name) {
      delete Internal.views[name]
      delete Internal.mountedViews[name]
      delete Internal.lastWorkingViews[name]
    },

    getFile(name) {
      return Internal.viewsInFile[name] || []
    },

    isLive() {
      return Internal.editor && Internal.editor.live
    },

    setInspector(path) {
      if (Internal.inspector[path]) {
        let props = Internal.viewsAtPath[path].props
        const state = Internal.getCache[path]
        Internal.inspector[path](props, state, (key, value) => {
          Internal.setCache(path, key, value)
          Internal.inspectorRefreshing = path
          Internal.getInitialStates[path]()
          Internal.viewsAtPath[path].forceUpdate()
          Internal.inspectorRefreshing = null
        })
      }
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
      Internal.setInspector(path)
    }
  }

  return Internal
}

export function get(name) {
  return internals[name]
}

export default { init, get }
