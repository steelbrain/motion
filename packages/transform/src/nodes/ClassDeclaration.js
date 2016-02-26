import { t } from '../lib/helpers'

export default {
  exit(node, parent, scope) {
    const ext = node.superClass

    if (ext && (
      // extends React.Component
      ext.object && ext.object.name == 'React' && ext.property.name == 'Component' ||
      // or just extends Component
      ext.name == 'Component'
    )) {
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

      return node
    }
  }
}