// wraps your app in closure / export

export default function MotionApp({ name }) {
  return function MotionAppPlugin({ Plugin, types: t }) {
    return new Plugin("motion-transform-app", {
      visitor: {
        Program: {
          exit(node) {
            // wrap program in commonjs + iife
            node.body = [t.expressionStatement(
              // exports["name"] = function(){}
              t.assignmentExpression('=',
                t.identifier(`exports["${name}"]`),
                //wrapFnName
                t.functionExpression(null, [t.identifier('Motion'), t.identifier('opts')], t.blockStatement([
                  // closure (function(Motion) {})(Motion)
                  t.callExpression(
                    t.functionExpression(null,
                      [t.identifier('Motion')],
                      t.blockStatement(
                        [].concat(
                          node.body,
                          t.expressionStatement(
                            t.callExpression(t.identifier('Motion.start'), [])
                          )
                        )
                      ) // end blockStatement
                    ) // end functionExpression
                  , [t.identifier('Motion')]) // end callExpression
                ]))
              )
            )]
          }
        }
      }
    })
  }
}