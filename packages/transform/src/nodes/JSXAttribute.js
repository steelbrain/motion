import { t, niceJSXAttributes } from '../lib/helpers'

export default {
  enter(node, parent, scope) {
    if (node.name.name == 'sync') {
      return [
        t.JSXAttribute(t.literal('__motionValue'), node.value),
        t.JSXAttribute(t.literal('__motionOnChange'), t.functionExpression(null, [t.identifier('__motionval__')],
          t.blockStatement([
            t.expressionStatement(t.assignmentExpression('=', node.value, t.identifier('__motionval__'))),
          ])
        )),
      ]
    }

    node.name.name = niceJSXAttributes(node.name.name)
  }
}