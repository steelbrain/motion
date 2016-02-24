import { t, isComponentReturn, component } from '../lib/helpers'
import { stateTrack } from '../lib/wrapState'

export default {
  exit(node, parent, scope) {
    if (isComponentReturn(node.body) && t.isVariableDeclarator(scope.path.parent)) {
      const name = scope.path.parent.id.name
      return component({ name, node, type: component.SIMPLE })
    }

    return stateTrack(node)
  }
}