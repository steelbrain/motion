/* @flow */
import { STYLE_KEY } from './constants'

export default function({ types: t }: { types: Object }) {
  const classBodyVisitor = {
    JSXOpeningElement(path: Object, state: Object) {
      const styleKey = state.get(STYLE_KEY)
      path.node.attributes.push(t.jSXAttribute(
        t.jSXIdentifier(STYLE_KEY),
        t.jSXExpressionContainer(t.identifier(styleKey))
      ))
    }
  }

  return {
    visitor: {
      ClassExpression(path: Object, state: Object) {
        const node = path.node
        if (!node.decorators || !node.decorators.length) {
          return
        }
        // -- Validate if class is what we're looking for
        // Default to @style
        const decoratorName = state.opts.decoratorName || 'style'
        const isMotionStyle = node.decorators.some(function(item) {
          return item.expression && item.expression.type === 'Identifier' && item.expression.name === decoratorName
        })
        // -- Add a unique var to scope and all of JSX elements
        if (isMotionStyle) {
          const id = path.scope.generateUidIdentifier(STYLE_KEY)
          path.scope.push({ id, init: t.objectExpression([]) })
          state.set(STYLE_KEY, id.name)
          node.body.body.push(t.classProperty(t.identifier(STYLE_KEY), t.identifier(id.name)))
          path.traverse(classBodyVisitor, state)
        }
      }
    }
  }
}
