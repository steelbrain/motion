import { t, findObjectName } from '../lib/helpers'
import { wrapSetter } from '../lib/wrapState'

export default {
  exit(node, _, scope) {
    if (node.operator == '++' || node.operator == '--') {
      let name

      if (node.argument.object)
        name = findObjectName(node.argument.object)
      else
        name = node.argument.name

      const postfix = !node.prefix ? t.identifier(name) : void 0
      return wrapSetter(name, node, scope, postfix)
    }
  }
}