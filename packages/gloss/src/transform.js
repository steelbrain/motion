/* @flow */

export default function({ types: t }: { types: Object }) {
  const classBodyVisitor = {
    ClassMethod(path: Object) {
      if (path.node.key.name === 'render') {
        path.node.body.body.unshift(
          t.expressionStatement(
            t.assignmentExpression('=',
              t.memberExpression(
                t.identifier('React'),
                t.identifier('createElement')
              ),
              t.identifier('this.fancyElement.bind(this)')
            )
          )
        )
      }
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
        const isMotionStyle = node.decorators.some(item => {
          if (!item.expression) {
            return false
          }
          if (item.expression.type === 'Identifier' && item.expression.name === decoratorName) {
            return true
          }
          if (
            item.expression.callee && t.isMemberExpression(item.expression.callee) &&
            item.expression.callee.object.name === decoratorName
          ) {
            return true
          }
          if (
            item.expression.object && item.expression.object.name === decoratorName
          ) {
            return true
          }

          return false
        })
        // -- Add a unique var to scope and all of JSX elements
        if (isMotionStyle) {
          path.traverse(classBodyVisitor, state)
        }
      }
    }
  }
}
