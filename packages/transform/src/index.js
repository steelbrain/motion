function hasObjWithProp(node, base, prop) {
  return node.left
    && node.left.object
    && node.left.object.name == base
    && (
      !prop ||
      (
        node.left.property
        && node.left.property.name == prop
      )
    )
}

function isInView(scope) {
  return scope.hasBinding("view")
}

const mutativeFuncs = ['push', 'reverse', 'splice', 'shift', 'pop', 'unshift', 'sort']

function isMutativeArrayFunc(node) {
  const name = node.callee &&
    node.callee.property &&
    node.callee.property.name

  return (name && mutativeFuncs.indexOf(name) >= 0)
}

function niceJSXAttributes(name, obj) {
  for (let key in obj) {
    if (name == obj[key]) {
      return key
    }
  }
  return name
}

export default function ({ Plugin, types: t }) {

  function viewUpdateExpression(node) {
    return t.callExpression(t.identifier('view.update'), [node])
  }

  function viewGetter(name, val) {
    return t.callExpression(t.identifier('view.get'), [t.literal(name), val])
  }

  return new Plugin("flint-transform", {
    visitor: {
      // TODO: finish rest of jsx stuff here
      JSXAttribute: {
        exit(node, parent, scope) {
          node.name.name = niceJSXAttributes(node.name.name, {
            className: 'class',
            htmlFor: 'for',
            srcSet: 'srcset'
          })
        }
      },

      CallExpression: {
        exit(node, parent, scope) {
          // mutative array methods
          if (isInView(scope) && isMutativeArrayFunc(node))
            return viewUpdateExpression(node)
        }
      },

      VariableDeclaration: {
        exit(node, parent, scope) {
          // add getter
          if (scope.hasOwnBinding('view') && node.kind != 'const') {
            node.declarations.map(dec => {
              if (!dec.init) return dec
              dec.init = viewGetter(dec.id.name, dec.init)
              return dec
            })
          }
        }
      },

      AssignmentExpression: {
        enter(node) {
          const isStyle = node.left && node.left.name && node.left.name.indexOf('$') == 0

          // styles
          if (isStyle)
            return styleAssignment(node)

          // splits styles into static/dynamic pieces
          function styleAssignment(node) {
            if (t.isArrayExpression(node.right)) {
              let staticProps = []
              let dynamicProps = []

              node.right.elements.map(el => {
                if (t.isObjectExpression(el)) {
                  let { static, dynamic } = extractStatics(el)
                  if (static.length) staticProps.push(static)
                  if (dynamic.length) dynamicProps.push(dynamic)
                }
              })

              return t.expressionStatement(
                t.arrayExpression(node.right.elements)
              )
            }

            if (t.isObjectExpression(node.right)) {
              let { static, dynamic } = extractStatics(node.right)

              if (static.length) {
                const staticStatement = t.expressionStatement(t.assignmentExpression(node.operator,
                  t.identifier(`view.styles._static["${node.left.name}"]`),
                  t.objectExpression(static)
                ))

                if (dynamic.length)
                  return [
                    staticStatement,
                    t.expressionStatement(viewStyle(node, t.objectExpression(dynamic)))
                  ]
                else
                  return staticStatement
              }
              else {
                return viewStyle(node, t.objectExpression(dynamic))
              }
            }
          }

          function extractStatics(node) {
            let static = []
            let dynamic = []

            for (let prop of node.right.properties) {
              if (t.isLiteral(prop.value) && t.isIdentifier(prop.key))
                static.push(prop)
              else
                dynamic.push(prop)
            }

            return { static, dynamic }
          }

          function viewStyle(node, right) {
            return t.assignmentExpression(node.operator, t.identifier(`view.styles["${node.left.name}"]`),
              t.functionExpression(null, [t.identifier('_index')],
                t.blockStatement([
                  t.returnStatement(right || node.right)
                ])
              )
            )
          }
        },

        exit(node, parent, scope) {
          const isBasicAssign = node.operator === "=" || node.operator === "-=" || node.operator === "+=";
          if (!isBasicAssign) return

          const isAlreadyStyle = node.left.type == 'Identifier' && node.left.name.indexOf('view.styles') == 0
          if (isAlreadyStyle) return

          const inView = isInView(scope)
          const skipUpdate = hasObjWithProp(node, 'view', 'render')
          const isStyle = node.left && node.left.name && node.left.name.indexOf('$') == 0

          // add getter
          if (scope.hasOwnBinding('view') && !skipUpdate && node.operator === "=") {
            node.right = t.callExpression(t.identifier('view.get'), [node.right])
          }

          // view.update
          if (inView && !skipUpdate)
            return viewUpdateExpression(node)
        }
      },

      UpdateExpression: {
        exit(node) {
          if (node.operator == '++' || node.operator == '--')
            return viewUpdateExpression(node)
        }
      }
    }
  });
}