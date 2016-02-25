import { t } from '../lib/helpers'

export default {
  exit(node, parent, scope) {
    if (node.superClass && node.superClass.name == 'Component') {
      const name = node.id.name

      node.body.body.push(t.methodDefinition(
        t.identifier('__motion'),
        t.objectExpression(
          [
            t.property(null, t.identifier('name'), t.literal(name)),
            t.property(null, t.identifier('styles'), t.objectExpression([])),
            t.property(null, t.identifier('styleObjects'), t.objectExpression([])),
          ]
        )
      ))

      node.decorators = [t.decorator(t.identifier('Motion.componentClass'))]

      return [
        t.expressionStatement(
          t.callExpression(t.identifier('Motion.nextComponent'), [t.literal(name)])
        ),
        node
      ]
    }
  }
}