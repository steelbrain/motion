import { t, isComponentReturn, componentReturn, component } from '../lib/helpers'
import { stateTrack } from '../lib/wrapState'

export default {
  exit(node, parent, scope) {
    if (node.motionIsComponent || isComponentReturn(node.body) && t.isVariableDeclarator(scope.path.parent)) {
      node.body = componentReturn(node.body)
      const name = scope.path.parent.id.name
      return component.simple({ name, node })
    }
  }
}