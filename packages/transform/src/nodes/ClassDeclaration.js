import { t } from '../lib/helpers'

export default {
  exit(node, parent, scope) {
    if (node.superClass && node.superClass.name == 'Component') {
      node.decorators = [t.decorator(t.identifier('Motion.componentClass'))]

      return [
        t.expressionStatement(
          t.callExpression(t.identifier('Motion.nextComponent'), [t.literal(node.id.name)])
        ),
        node
      ]
    }
  }
}