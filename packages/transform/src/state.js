import { normalizeLocation } from './lib/helpers'

let state = {
  basePath: false,
  currentView: null,
  keyBase: null,
  inView: null, // track current view name
  viewHasChildWithClass: false, // if view calls for a child view
  viewStyles: {}, // store styles from views to be extracted
  viewDynamicStyleKeys: null,
  viewStaticStyleKeys: null,
  viewRootNodes: null, // track root JSX elements
  viewState: null, // track which state to wrap
  viewStyleNames: null, // prevent duplicate style names

  file: {}
}

export function init() {
  resetProgramState()
  resetViewState()
}

export function resetProgramState() {
  // TODO move the meta stuff directly into file
  state.file = {}

  // if file has a view
  state.file.hasView = false

  // if file has exports
  state.file.hasExports = false

  // meta-data for views for atom
  state.file.meta = {
    file: null,
    views: {},
    // track if file is can be really hot reloaded
    isHot: true
  }
}

export function resetViewState(fullName, file, loc) {
  state.keyBase = {}
  state.viewRootNodes = []
  state.viewState = {}
  state.viewStyleNames = {}
  state.viewDynamicStyleKeys = {}
  state.viewStaticStyleKeys = {}
  state.viewHasChildWithClass = false
}

export default state