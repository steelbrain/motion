const name = OPTS.saneName

const wrapTemplate = `

window.${wrapFnName} = function ${wrapFnName}(node, opts, cb) {
  var FlintInstace = opts.Flint || runFlint;
  var Flint = FlintInstace(node, opts, cb);

  (function(Flint) {
    <%= contents %>

    ;Flint.init()
  })(Flint);
  }

  if (typeof module !== 'undefined' && module.exports) {
  module.exports = ${wrapFnName}
}`

export default function FlintApp({ name }) {
  const wrapFnName = `flintRun_${name}`

  return new Plugin("flint-transform-app", {
    visitor: {
      Program: {
        exit(node) {
          node.body = [t.expressionStatement(
            t.assignmentExpression('=',
              t.identifier(`window.${wrapFnName}`),
              t.functionExpression(wrapFnName, [t.identifier('node'), t.identifier('opts'), t.identifier('cb')], t.blockStatement([

              ]))
            )
          )]
        }
      }
    }
  })
}