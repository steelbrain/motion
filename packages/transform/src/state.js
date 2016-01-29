import { normalizeLocation } from './lib/helpers'

let state = {
  basePath: false,
  currentView: null,
  meta: null, // meta-data for views for atom
  keyBase: null,
  inJSX: false,
  inView: null, // track current view name
  hasView: false, // if file has a view
  hasExports: false,
  viewHasChildWithClass: false, // if view calls for a child view
  viewStyles: {}, // store styles from views to be extracted
  viewDynamicStyleKeys: null,
  viewStaticStyleKeys: null,
  viewRootNodes: null, // track root JSX elements
  viewState: null, // track which state to wrap
  viewStyleNames: null, // prevent duplicate style names
  fileImports: null,

  init() {
    state.resetProgramState()
    state.resetViewState()
  },

  resetProgramState() {
    state.hasView = false
    state.hasExports = false
    state.fileImports = []
    state.meta = { file: null, views: {} }
  },

  resetViewState(fullName, file, loc) {
    state.hasView = true
    state.keyBase = {}
    state.viewRootNodes = []
    state.viewState = {}
    state.viewStyleNames = {}
    state.viewDynamicStyleKeys = {}
    state.viewStaticStyleKeys = {}
    state.viewHasChildWithClass = false
  }
}

export default state