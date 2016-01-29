import { t, niceJSXAttributes } from '../lib/helpers'

export default {
  enter(node, parent, scope) {
    if (node.name.name == 'sync') {
      return [
        t.JSXAttribute(t.literal('__flintValue'), node.value),
        t.JSXAttribute(t.literal('__flintOnChange'), t.functionExpression(null, [t.identifier('__flintval__')],
          t.blockStatement([
            t.expressionStatement(t.assignmentExpression('=', node.value, t.identifier('__flintval__'))),
          ])
        )),
      ]
    }

    node.name.name = niceJSXAttributes(node.name.name)
  }
}