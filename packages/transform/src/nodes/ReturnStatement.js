import { updateState } from '../lib/wrapState'
import { t, parentFunctionNode, isComponentReturn } from '../lib/helpers'

export default {
  exit(node, parent, scope) {
    if (isComponentReturn(node.argument)) {
      console.log('in return')
    }

    // view.update() before return
    if (node.motionReturnTracked) return
    node.motionReturnTracked = true

    const parentFunc = parentFunctionNode(scope)

    if (parentFunc && !parentFunc.body.motionView && (parentFunc.motionStateMutativeFunction || parentFunc.hasSetter))
      return [updateState(), node]
  }
}