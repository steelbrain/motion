import path from 'path'
import state, { resetProgramState } from '../state'
import { t, options, relativePath } from '../lib/helpers'

export default {
  enter(node, parent, scope, file) {
    options.onStart && options.onStart()
    resetProgramState()
    state.file.name = path.relative(options.basePath, file.opts.filename)
    state.file.file = file.opts.filename
  },

  exit(node, parent, scope, file) {
    if (options.onMeta) {
      options.onMeta(state.file)
    }

    const location = relativePath(file.opts.filename)

    if (!options.firstRun && state.file.isHot) {
      // function(){ Motion.file('${location}',function(require, exports){ ${contents}\n  })\n}()
      node.body = [t.expressionStatement(
        // closure
        t.callExpression(t.functionExpression(null, [], t.blockStatement([
          t.callExpression(t.identifier('Motion.file'), [t.literal(location),
            t.functionExpression(null, [],
              t.blockStatement(node.body)
            )
          ])
        ])), [])
      )]
    }

    options.onFinish && options.onFinish(state.file)
  }
}
