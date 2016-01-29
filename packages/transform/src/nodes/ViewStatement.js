import { resetViewState } from '../state'
import { normalizeLocation } from '../helpers'

export default {
  enter(node, parent, scope, file) {
    resetViewState(file)

    const name = node.name.name
    const subName = node.subName && node.subName.name
    const fullName = name + (subName ? `.${subName}` : '')

    node.block.flintView = true

    return t.callExpression(t.identifier('Flint.view'), [t.literal(fullName),
      t.functionExpression(null, [t.identifier('view'), t.identifier('on'), t.identifier('$')], node.block)]
    )
  }
}