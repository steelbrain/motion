import { updateState } from '../lib/wrapState'
import { parentFunctionNode } from '../lib/helpers'

export default {
  exit(node, parent, scope) {
    // view.update() before return
    if (node.flintReturnTracked) return
    node.flintReturnTracked = true
    parent.flintHasReturnStatement = true

    const parentFunc = parentFunctionNode(scope)

    if (parentFunc && !parentFunc.body.flintView && parentFunc.flintStateMutativeFunction)
      return [updateState(), node]
  }
}