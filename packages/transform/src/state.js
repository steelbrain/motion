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
  state.file = {
    name: null,
    file: null,
    views: {},
    isHot: true,
    hasView: false,
    hasExports: false,
    imports: []
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
