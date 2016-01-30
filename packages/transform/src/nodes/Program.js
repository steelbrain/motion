import state, { resetProgramState } from '../state'
import { t, options, relativePath } from '../lib/helpers'

export default {
  enter() {
    resetProgramState()
  },

  exit(node, parent, scope, file) {
    if (options.onImports) {
      options.onImports(file.opts.filename, state.fileImports)
    }

    if (options.onExports) {
      options.onExports(file.opts.filename, state.hasExports)
    }

    const location = relativePath(file.opts.filename)
    state.meta.file = location

    if (options.onMeta) {
      options.onMeta(state.meta)
    }

    if (!state.hasExports) {
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