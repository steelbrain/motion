import { normalizeLocation } from './lib/helpers'
// state + state mutation

export default  {
  basePath: false,
  currentView: null,
  meta: null, // meta-data for views for atom
  keyBase, {}
  inJSX, false
  inView, null // track current view name
  hasView, false // if file has a view
  hasExports, false
  viewHasChildWithClass, false // if view calls for a child view
  viewStyles, {} // store styles from views to be extracted
  viewDynamicStyleKeys, {}
  viewStaticStyleKeys, {}
  viewRootNodes, [] // track root JSX elements
  viewState, {} // track which state to wrap
  viewStyleNames, {} // prevent duplicate style names
  fileImports, []
}

export resetViewState(file) {
  state.hasView = true
  state.keyBase = {}
  state.currentView = fullName
  state.meta.views[currentView] = {
    location: normalizeLocation(node.loc),
    file: file.opts.filename,
    styles: {},
    els: {}
  }
  state.inView = fullName
  state.viewRootNodes = []
  state.viewState = {}
  state.viewStyleNames = {}
  state.viewDynamicStyleKeys = {}
  state.viewStaticStyleKeys = {}
  state.viewHasChildWithClass = false
}

export function getRootTagName() {
  if (!state.viewRootNodes.length) return ''
  return getTagName(state.viewRootNodes[0])
}

export function shouldStyleAsRoot() {
  const numRoots = state.viewRootNodes.length
  let result = numRoots == 0
  if (numRoots == 1) {
    const hasRootProp = state.viewRootNodes[0].openingElement.attributes.filter(x => x.name && x.name.name === 'root').length

    result = (
      hasRootProp ||
      getRootTagName() == state.inView.toLowerCase()
    )
  }
  return result
}

export function isViewState(name, scope) {
  return viewState[name] && !scope.hasOwnBinding(name)
}
