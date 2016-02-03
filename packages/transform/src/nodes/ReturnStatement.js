import { updateState } from '../lib/wrapState'
import { t, parentFunctionNode } from '../lib/helpers'

export default {
  exit(node, parent, scope) {
    // view.update() before return
    if (node.flintReturnTracked) return
    node.flintReturnTracked = true

    const parentFunc = parentFunctionNode(scope)

    if (parentFunc && !parentFunc.body.flintView && (parentFunc.flintStateMutativeFunction || parentFunc.hasSetter))
      return [updateState(), node]
  }
}