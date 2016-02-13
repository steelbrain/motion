import { updateState } from '../lib/wrapState'
import { t, parentFunctionNode } from '../lib/helpers'

export default {
  exit(node, parent, scope) {
    // view.update() before return
    if (node.motionReturnTracked) return
    node.motionReturnTracked = true

    const parentFunc = parentFunctionNode(scope)

    if (parentFunc && !parentFunc.body.motionView && (parentFunc.motionStateMutativeFunction || parentFunc.hasSetter))
      return [updateState(), node]
  }
}