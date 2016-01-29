import { t, options } from '../lib/helpers'

export default {
  enter() {
    hasView = false
    hasExports = false
    fileImports = []
    meta = { file: null, views: {} }
  },

  exit(node, parent, scope, file) {
    if (options.onImports) {
      options.onImports(file.opts.filename, fileImports)
    }

    const location = relativePath(file.opts.filename)
    meta.file = location

    if (options.onMeta) {
      options.onMeta(meta)
    }

    if (!hasExports) {
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