// wraps your app in closure / export

export default function FlintApp({ name }) {
  return function FlintAppPlugin({ Plugin, types: t }) {
    return new Plugin("flint-transform-app", {
      visitor: {
        Program: {
          exit(node) {
            // wrap program in commonjs + iife
            node.body = [t.expressionStatement(
              // exports["name"] = function(){}
              t.assignmentExpression('=',
                t.identifier(`exports["${name}"]`),
                //wrapFnName
                t.functionExpression(null, [t.identifier('Flint'), t.identifier('opts')], t.blockStatement([
                  // closure (function(Flint) {})(Flint)
                  t.callExpression(
                    t.functionExpression(null,
                      [t.identifier('Flint')],
                      t.blockStatement(
                        [].concat(
                          node.body,
                          t.expressionStatement(
                            t.callExpression(t.identifier('Flint.start'), [])
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