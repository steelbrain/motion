// window.${wrapFnName} = function ${wrapFnName}(node, opts, cb) {
//   var FlintInstace = opts.Flint || runFlint;
//   var Flint = FlintInstace(node, opts, cb);
//
//   (function(Flint) {
//     <%= contents %>
//
//     ;Flint.init()
//   })(Flint);
// }
//
// if (typeof module !== 'undefined' && module.exports) {
//   module.exports = ${wrapFnName}
// }

export default function FlintApp({ name }) {
  const wrapFnName = `flintRun_${name}`

  return function FlintAppPlugin({ Plugin, types: t }) {
    return new Plugin("flint-transform-app", {
      visitor: {
        Program: {
          exit(node) {
            node.body = [t.expressionStatement(
              // window.flintRun_app = function(){}
              t.assignmentExpression('=',
                t.identifier(`exports["${wrapFnName}"]`),
                //wrapFnName
                t.functionExpression(null, [t.identifier('node'), t.identifier('runtime'), t.identifier('opts'), t.identifier('cb')], t.blockStatement([
                  // var Flint = runtime(node, opts, cb)
                  t.variableDeclaration('var', [
                    t.variableDeclarator(
                      t.identifier('Flint'),
                      t.callExpression(t.identifier('runtime'), [
                        t.identifier('node'), t.identifier('opts'), t.identifier('cb')
                      ])
                    )
                  ]),

                  // closure (function(Flint) {})(Flint)
                  t.callExpression(
                    t.functionExpression(null,
                      [t.identifier('Flint')],
                      t.blockStatement(
                        [].concat(
                          node.body,
                          t.expressionStatement(
                            t.callExpression(t.identifier('Flint.init'), [])
                          )
                        )
                      ) // end blockStatement
                    ) // end functionExpression
                  , [t.identifier('Flint')]) // end callExpression
                ]))
              )
            )]
          }
        }
      }
    })
  }
}