/* @flow */

export default function({ types: t }: { types: Object }) {
  const classBodyVisitor = {
    JSXOpeningElement(path: Object, state: Object) {
      const styleKey = state.get('motion$style')
      path.node.attributes.push(t.jSXAttribute(
        t.jSXIdentifier('motion$style'),
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
          const id = path.scope.generateUidIdentifier('motion$style')
          path.scope.push({ id, init: t.objectExpression([]) })
          state.set('motion$style', id.name)
          node.body.body.push(t.classProperty(t.identifier('motion$style'), t.identifier(id.name)))
          path.traverse(classBodyVisitor, state)
        }
      }
    }
  }
}
