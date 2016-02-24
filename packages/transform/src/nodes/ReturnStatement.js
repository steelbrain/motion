import { updateState } from '../lib/wrapState'
import { t, parentFunctionNode, isComponentReturn, component } from '../lib/helpers'

export default {
  enter(node, parent, scope) {
    if (isComponentReturn(node.argument)) {
      console.log('in return')

      let parentFunc = parentFunctionNode(scope)

      parentFunc.motionIsComponent = true
    }
  },

  exit(node, parent, scope) {
    // view.update() before return
    if (node.motionReturnTracked) return
    node.motionReturnTracked = true

    const parentFunc = parentFunctionNode(scope)

    if (parentFunc && !parentFunc.body.motionView && (parentFunc.motionStateMutativeFunction || parentFunc.hasSetter))
      return [updateState(), node]
  }
}