import { updateState } from '../lib/wrapState'
import { t, parentFunctionNode, isComponentReturn, componentReturn, component } from '../lib/helpers'

export default {
  enter(node, parent, scope) {
    if (isComponentReturn(node.argument)) {
      node.argument = componentReturn(node.argument)
      let parentFunc = parentFunctionNode(scope)
      parentFunc.motionIsComponent = true
    }
  },

  exit(node, parent, scope) {
    // view.update() before return
    if (node.motionReturnTracked) return
    node.motionReturnTracked = true

    const parentFunc = parentFunctionNode(scope)

    if (parentFunc && parentFunc.body && !parentFunc.body.motionView && (parentFunc.motionStateMutativeFunction || parentFunc.hasSetter))
      return [updateState(), node]
  }
}