// wraps your app in closure / export

export default function FlintApp({ name }) {
  return function FlintAppPlugin({ Plugin, types: t }) {
    return new Plugin("flint-transform-app", {
      visitor: {
        Program: {
          exit(node) {
            node.body = [t.expressionStatement(
              // exports["name"] = function(){}
              t.assignmentExpression('=',
                t.identifier(`exports["${name}"]`),
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