/* @flow */

export default function() {
  return {
    visitor: {
      ClassExpression(path: Object, state: Object) {
        if (!path.node.decorators || !path.node.decorators.length) {
          return
        }
        // Default to @style
        const decoratorName = state.opts.decoratorName || 'style'
        const isMotionStyle = path.node.decorators.some(function(item) {
          return item.expression && item.expression.type === 'Identifier' && item.expression.name === decoratorName
        })
        console.log(isMotionStyle)
      }
    }
  }
}
