import { updateState } from '../lib/wrapState'
import { t, parentFunctionNode, isComponentReturn, componentReturn, component } from '../lib/helpers'

export default {
  enter(node, parent, scope) {
    if (isComponentReturn(node.argument)) {
      node.argument = componentReturn(node.argument)
      let parentFunc = parentFunctionNode(scope)
      parentFunc.motionIsComponent = true
    }
  }
}