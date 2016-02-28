import { t, options, findObjectName, hasObjWithProp, isViewState, normalizeLocation } from '../lib/helpers'
import { extractAndAssign } from '../lib/extractStatics'
import { wrapSetter, wrapGetter } from '../lib/wrapState'
import state from '../state'

export default {
  enter(node, parent, scope, file) {
    // if (node.isStyle) return
    //
    // const isStyle = (
    //   // $variable = {}
    //   node.left.name && node.left.name.indexOf('$') == 0
    // )
    //
    // if (!isStyle) return
    //
    // if (state.currentView) {
    //   const viewMeta = state.file.views[state.currentView]
    //   const cleanName = node.left.name.substr(1)
    //   viewMeta.styles[cleanName] = { location: normalizeLocation(node.loc) }
    // }
    //
    // // styles
    // return extractAndAssign(node, file)
  },

  exit(node, parent, scope, file) {
    // module.exports check
    if (t.isMemberExpression(node.left) && node.left.object.name === 'module') {
      options.onExports && options.onExports(true)
      state.file.hasExports = true
    }
  }
}
