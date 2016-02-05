import state, { resetProgramState } from '../state'
import { t, options, relativePath } from '../lib/helpers'

export default {
  enter() {
    resetProgramState()
  },

  exit(node, parent, scope, file) {
    state.meta.file = file.opts.filename

    if (options.onMeta) {
      options.onMeta(state.meta)
    }

    const location = relativePath(file.opts.filename)

    if (!file.metadata.exports) {
      // function(){ Flint.file('${location}',function(require, exports){ ${contents}\n  })\n}()
      node.body = [t.expressionStatement(
        // closure
        t.callExpression(t.functionExpression(null, [], t.blockStatement([
          t.callExpression(t.identifier('Flint.file'), [t.literal(location),
            t.functionExpression(null, [t.identifier('require')],
              t.blockStatement(node.body)
            )
          ])
        ])), [])
      )]
    }
  }
}
