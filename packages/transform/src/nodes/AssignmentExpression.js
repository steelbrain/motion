import { t, options, findObjectName, hasObjWithProp, isViewState, normalizeLocation } from '../lib/helpers'
import { extractAndAssign } from '../lib/extractStatics'
import { wrapSetter, wrapGetter } from '../lib/wrapState'
import state from '../state'

export default {
  enter(node, parent, scope, file) {
    if (node.isStyle) return

    const isStyle = (
      // $variable = {}
      node.left.name && node.left.name.indexOf('$') == 0
    )

    if (!isStyle) return

    if (state.currentView) {
      const viewMeta = state.file.meta.views[state.currentView]
      const cleanName = node.left.name.substr(1)
      viewMeta.styles[cleanName] = { location: normalizeLocation(node.loc) }
    }

    // styles
    return extractAndAssign(node, file)
  },

  exit(node, parent, scope, file) {
    // non-styles
    if (node.motionTracked || node.hasSetter || node.hasGetter || node.isStyle) return

    const isBasicAssign = node.operator === "=" || node.operator === "-=" || node.operator === "+="
    if (!isBasicAssign) return

    // module.exports check
    if (t.isMemberExpression(node.left) && node.left.object.name === 'module') {
      options.onExports && options.onExports(true)
      state.file.hasExports = true
    }

    // destructures
    if (scope.hasOwnBinding('view') && t.isObjectPattern(node.left)) {
      let destructNodes = destructureTrackers(node.left, 'set')
      node.motionTracked = true
      return [t.expressionStatement(node), ...destructNodes]
    }

    const isRender = hasObjWithProp(node, 'view', 'render')

    let id = x => x
    let sett = id
    let gett = id
    let added = false

    // view.set
    if (!isRender) {
      let name, post

      if (node.left.object) {
        name = findObjectName(node.left.object)
        post = t.identifier(name)
      }
      else if (t.isJSXExpressionContainer(node.left)) {
        const { expression } = node.left
        name = expression.object ?
               findObjectName(expression.object) :
               expression.name
      }
      else {
        name = node.left.name
      }

      if (isViewState(name, scope)) {
        sett = node => wrapSetter(name, node, scope, post, 'set')
        added = true
      }
    }

    // add getter
    if (!options.production && !isRender && isViewState(node.left.name, scope)) {
      gett = node => wrapGetter(node, scope, file)
      added = true
    }

    node = sett(gett(node))

    if (added && node)
      node.motionTracked = 1

    return node
  }
}