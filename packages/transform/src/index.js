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

  function viewUpdateExpression(name, node) {
    return t.callExpression(t.identifier('view.set'), [t.literal(name), node])
  }

  function viewGetter(name, val) {
    return t.callExpression(t.identifier('view.get'), [t.literal(name), val])
  }

  function addGetter(node, scope) {
    if (scope.hasOwnBinding('view')) {
      node.right = viewGetter(node.left.name, node.right)
    }
    return node
  }

  return new Plugin("flint-transform", {
    visitor: {
      JSXElement: {
        exit(node, parent, scope) {
          if (node.openingElement.attributes) {
            for (let attr of node.openingElement.attributes) {
              const name = attr.name.name
              const val = attr.value.value || attr.value.expression
              console.log(attr)

              if (name == 'if') {
                return t.logicalExpression(
                  '&&',
                  val,
                  node
                )
              }
            }
          }
        }
      },

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
            return viewUpdateExpression(node.callee.property.name, node)
        }
      },

      VariableDeclaration: {
        exit(node, parent, scope) {
          // add getter
          if (scope.hasOwnBinding('view') && node.kind != 'const') {
            node.declarations.map(dec => {
              if (!dec.init) {
                dec.init = viewGetter(dec.id.name, t.identifier('undefined'))
                return dec
              }
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
            // if array of objects
            if (t.isArrayExpression(node.right)) {
              let staticProps = []

              node.right.elements = node.right.elements.map(el => {
                if (!t.isObjectExpression(el)) return el
                let { statics, dynamics } = extractStatics(el)
                if (statics.length) staticProps = staticProps.concat(statics)
                if (dynamics.length) return t.objectExpression(dynamics)
                else return null
              }).filter(x => x !== null)

              return [
                staticStyleStatement(node, t.objectExpression(staticProps)),
                dynamicStyleStatement(node, node.right)
              ]
            }

            // if just object
            else if (t.isObjectExpression(node.right)) {
              let { statics, dynamics } = extractStatics(node.right)

              if (statics.length) {
                const staticStatement = staticStyleStatement(node, t.objectExpression(statics))

                if (dynamics.length)
                  return [
                    staticStatement,
                    dynamicStyleStatement(node, t.objectExpression(dynamics))
                  ]
                else
                  return staticStatement
              }
              else {
                return viewStyle(node, t.objectExpression(dynamics))
              }
            }

            else {
              return viewStyle(node)
            }
          }

          // find statics/dynamics in object
          function extractStatics(node) {
            let statics = []
            let dynamics = []

            for (let prop of node.properties) {
              if (t.isLiteral(prop.value) && t.isIdentifier(prop.key))
                statics.push(prop)
              else
                dynamics.push(prop)
            }

            return { statics, dynamics }
          }

          // view.styles._static["name"] = ...
          function staticStyleStatement(node, statics) {
            return t.expressionStatement(t.assignmentExpression(node.operator,
              t.identifier(`view.styles._static["${node.left.name}"]`),
              statics
            ))
          }

          // view.styles["name"] = ...
          function dynamicStyleStatement(node, dynamics) {
            return t.expressionStatement(viewStyle(node, dynamics))
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
          const isRender = hasObjWithProp(node, 'view', 'render')
          const isStyle = node.left && node.left.name && node.left.name.indexOf('$') == 0

          // add getter
          if (!isRender)
            node = addGetter(node, scope)

          // view.set
          if (inView && !isRender)
            return viewUpdateExpression(node.left.name, node)
        }
      },

      UpdateExpression: {
        exit(node) {
          if (node.operator == '++' || node.operator == '--')
            return viewUpdateExpression(node.argument.name, node)
        }
      }
    }
  });
}