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
            // window.flintRun_app = function(){}
            t.assignmentExpression('=',
              t.identifier(`window.${wrapFnName}`),
              t.functionExpression(wrapFnName, [t.identifier('node'), t.identifier('runtime'), t.idenfitier('opts'), t.identifier('cb')], t.blockStatement([
                // var Flint = runtime(node, opts, cb)
                t.assignmentExpression('=', t.identifier('Flint'), t.callExpression(t.idenfitier('runtime'), [
                  t.idenfitier('node'), t.idenfitier('opts'), t.idenfitier('cb')
                ])),

                // closure (function(Flint) {})(Flint)
                t.callExpression(
                  t.functionExpression(null,
                    [t.identifier('Flint')],
                    t.blockStatement(node.body)
                  ),
                  [t.idenfitier('Flint')]
                )
              ]))
            )
          )]
        }
      }
    }
  })
}