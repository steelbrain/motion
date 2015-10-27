function isUpperCase(str) {
  return str.charAt(0) == str.charAt(0).toUpperCase()
}

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
  return scope.hasBinding("__")
}

const mutativeFuncs = ['push', 'reverse', 'splice', 'shift', 'pop', 'unshift', 'sort']

function isMutativeArrayFunc(node) {
  const name = node.callee &&
    node.callee.property &&
    node.callee.property.name

  return (name && mutativeFuncs.indexOf(name) >= 0)
}

function isObjectAssign(node) {
  if (!node.callee) return

  const propName = node.callee.property && node.callee.property.name
  const objName = node.callee.object && node.callee.object.name

  return objName == 'Object' && propName == 'assign'
}

let niceAttrs = {
  className: 'class',
  htmlFor: 'for',
  srcSet: 'srcset',
  noValidate: 'novalidate',
  autoPlay: 'autoplay',
  frameBorder: 'frameborder',
  allowFullScreen: 'allowfullscreen',
  tabIndex: 'tabindex'
}

function niceJSXAttributes(name) {
  for (let key in niceAttrs) {
    if (name == niceAttrs[key]) {
      return key
    }
  }
  return name
}

const idFn = x => x

export default function ({ Plugin, types: t }) {

  function frozen(node) {
    return t.callExpression(t.identifier('Object.freeze'), [node])
  }

  function addSetter(name, node, scope) {
    if (node.hasSetter) return
    if (scope.hasBinding('__')) {
      node.hasSetter = true
      return t.callExpression(t.identifier('__.set'), [t.literal(name), node])
    }

    return node
  }

  function viewGetter(name, val) {
    return t.callExpression(t.identifier('__.get'), [t.literal(name), val])
  }

  function addGetter(node, scope) {
    if (scope.hasOwnBinding('__')) {
      node.right = viewGetter(node.left.name, node.right)
    }
    return node
  }

  function nodeToNameString(node) {
    if (typeof node.name == 'string') return node.name

    if (t.isJSXMemberExpression(node)) {
      const isNested = t.isJSXMemberExpression(node.object)
      return (isNested ? nodeToNameString(node.object) : '')
        + `${node.object.name || ''}.${node.property.name}`
    }
  }

  let keyBase = {}

  return new Plugin("flint-transform", {
    visitor: {
      ViewStatement(node) {
        keyBase = {}

        const name = node.name.name
        const subName = node.subName && node.subName.name
        const fullName = name + (subName ? `.${subName}` : '')

        return t.callExpression(t.identifier('Flint.view'), [t.literal(fullName),
          t.functionExpression(null, [t.identifier('__'), t.identifier('on'), t.identifier('$')], node.block)]
        )
      },

      JSXElement: {
        enter(node, parent, scope, file) {
          const el = node.openingElement

          // avoid reprocessing
          if (node.flintJSXVisits != 2) {
            // add index keys for repeat elements
            if (node.flintJSXVisits == 1) {
              if (scope.hasBinding('_index')) {
                el.name.elements.push(t.identifier('_index'))
              }

              node.flintJSXVisits = 2
              return
            }

            node.flintJSXVisits = 1
            const name = nodeToNameString(el.name)

            // ['quotedname', key]
            let key

            if (keyBase[name])
              key = ++keyBase[name]
            else
              key = keyBase[name] = 1

            let arr = [t.literal(name), t.literal(key)]

            // safer, checks for file scope or view scope only
            if ((scope.hasOwnBinding(name) || file.scope.hasOwnBinding(name)) && isUpperCase(name))
              arr = [t.identifier(name)].concat(arr)

            el.name = t.arrayExpression(arr)

            // process attributes
            if (!el.attributes) return

            let rpt = idFn
            let iff = idFn
            let route = idFn

            for (let attr of el.attributes) {
              const name = attr.name && attr.name.name
              const expr = attr.value && (attr.value.expression || t.literal(attr.value.value))

              if (name == 'route') {
                route = _node => t.logicalExpression('&&',
                  t.callExpression(t.identifier('Flint.routeMatch'), [expr]),
                  _node
                )

                // spread routeprops onto route
                el.attributes.push(t.JSXSpreadAttribute(
                  t.callExpression(t.identifier('Flint.routeParams'), [expr])
                ))
              }

              if (name == 'if') {
                iff = _node => t.logicalExpression('&&', expr, _node)
              }

              if (name == 'repeat') {
                rpt = _node => t.callExpression(
                  t.memberExpression(t.callExpression(t.identifier('Flint.range'), [expr]), t.identifier('map')),
                  [t.functionExpression(null, [t.identifier('_'), t.identifier('_index')], t.blockStatement([
                    t.returnStatement(_node)
                  ]))]
                )
              }
            }

            // wrap outermost JSX elements (in views) in this.render()
            let wrap = idFn
            const isDirectChildOfView = scope.hasOwnBinding('__')

            if (isDirectChildOfView)
              wrap = node => t.callExpression(t.identifier('__.render'), [
                t.functionExpression(null, [], t.blockStatement([
                  t.returnStatement(node)
                ]))
              ])

            return wrap(iff(route(rpt(node))))
          }
        }
      },

      JSXAttribute: {
        enter(node, parent, scope) {
          if (node.name.name == 'sync') {
            return [
              t.JSXAttribute(t.literal('value'), node.value),
              t.JSXAttribute(t.literal('onChange'), t.functionExpression(null, [t.identifier('e')],
                t.blockStatement([
                  t.assignmentExpression('=', node.value, t.identifier('e.target.value'))
                ])
              )),
            ]
          }

          node.name.name = niceJSXAttributes(node.name.name)
        }
      },

      CallExpression: {
        exit(node, parent, scope) {
          // mutative array methods
          if (isInView(scope)) {
            if (isMutativeArrayFunc(node)) {
              return addSetter(node.callee.property.name, node, scope)
            }

            if (isObjectAssign(node)) {
              // if mutating an object in the view
              if (scope.hasOwnBinding(node.arguments[0].name)) {
                return addSetter(node.arguments[0].name, node, scope)
              }
            }
          }
        }
      },

      VariableDeclaration: {
        exit(node, parent, scope) {
          // add getter
          if (scope.hasOwnBinding('__') && node.kind != 'const' && !node.flintAssignState) {
            node.declarations.map(dec => {
              if (!dec.init) {
                dec.init = viewGetter(dec.id.name, t.identifier('undefined'))
                return dec
              }
              dec.init = viewGetter(dec.id.name, dec.init)
              node.flintAssignState = true
              return dec
            })
          }
        }
      },

      AssignmentExpression: {
        exit(node, parent, scope) {
          if (node.isStyle) return

          // styles
          const isStyle = (
            // $variable = {}
            node.left.name && node.left.name.indexOf('$') == 0 ||
            // $.variable = {}
            node.left.object && node.left.object.name == '$'
          )

          // styles
          if (isStyle)
            return extractAndAssign(node)

          // splits styles into static/dynamic pieces
          function extractAndAssign(node) {
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
                return styleAssign(node, t.objectExpression(dynamics))
              }
            }

            else {
              return styleAssign(node)
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

          // $._static["name"] = ...
          function staticStyleStatement(node, statics) {
            let result = exprStatement(t.assignmentExpression(node.operator, styleLeft(node, true), statics))
            result.expression.isStyle = true
            return result
          }

          // $["name"] = ...
          function dynamicStyleStatement(node, dynamics) {
            return exprStatement(styleAssign(node, dynamics))
          }

          function styleLeft(node, isStatic) {
            const prefix = isStatic ? '$._static' : '$'

            if (node.left.object) {
              if (isStatic) {
                const object = t.identifier(prefix)
                const props = node.left.properties || [node.left.property]
                return t.memberExpression(object, ...props)
              }

              return node.left
            }

            const name = node.left.name.slice(1) || '$'
            return t.identifier(`${prefix}["${name}"]`)
          }

          function styleAssign(node, right) {
            let result = t.assignmentExpression('=', styleLeft(node), styleFunction(right || node.right))
            result.isStyle = true
            return result

            // (_index) => {}
            function styleFunction(inner) {
              return t.functionExpression(null, [t.identifier('_index')],
                t.blockStatement([ t.returnStatement(inner) ])
              )
            }
          }

          function exprStatement(node) {
            return t.expressionStatement(node)
          }

          // non-styles

          if (node.flintAssignState) return

          const isBasicAssign = node.operator === "=" || node.operator === "-=" || node.operator === "+=";
          if (!isBasicAssign) return

          const isRender = hasObjWithProp(node, '__', 'render')

          let id = x => x
          let sett = id
          let gett = id

          // view.set
          if (!isRender) {
            sett = node => addSetter(node.left.name, node, scope)
          }

          // add getter
          if (!isRender) {
            gett = node => addGetter(node, scope)
          }

          node = sett(gett(node))
          node.flintAssignState = 1

          return node
        }
      },

      UpdateExpression: {
        exit(node, _, scope) {
          if (node.operator == '++' || node.operator == '--')
            return addSetter(node.argument.name, node, scope)
        }
      }
    }
  });
}