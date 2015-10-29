import path from 'path'
import style from './style'

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
  return scope.hasBinding('view')
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

export default function createPlugin(options) {
  if (options.Transformer) {
    // running directly (no user options)
    return FlintPlugin(options)
  }

  // options
  const basePath = options.basePath || false

  // helpers
  function relativePath(filename) {
    if (filename && basePath) {
      return path.relative(basePath, filename)
    }
    return ''
  }

  // plugin
  function FlintPlugin({ Plugin, types: t }) {

    // plugin helpers
    function frozen(node) {
      return t.callExpression(t.identifier('Object.freeze'), [node])
    }

    function addSetter(name, node, scope) {
      if (node.hasSetter) return
      if (scope.hasBinding('view')) {
        const expr = t.callExpression(t.identifier('view.set'), [t.literal(name), node])
        node.hasSetter = true
        return expr
      }

      return node
    }

    function viewGetter(name, val, scope, file) {
      let isInView = scope.hasOwnBinding('view')
      let comesFromFile = file && file.scope.hasOwnBinding(val.name)

      if (comesFromFile)
        return getter(name, val, t.literal('fromFile'))

      if (isInView)
        return getter(name, val)

      function getter(name, val, ...args) {
        return t.callExpression(t.identifier('view.get'), [t.literal(name), val, ...args])
      }
    }

    function addGetter(node, scope, file) {
      if (scope.hasBinding('view')) {
        node.right = viewGetter(node.left.name, node.right, scope, file)
        node.hasGetter = true
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
    let inJSX = false


    return new Plugin("flint-transform", {
      visitor: {
        // Program: {
        //   exit(node, parent, scope, file) {
        //     const path = relativePath(file.opts.filename)
        //
        //      // add prefix / suffix
        //      console.log(node)
        //      node.body.unshift(t.expressionStatement(t.identifier(filePrefix(path))));
        //      node.body.push(t.identifier(fileSuffix))
        //   }
        // },

        ViewStatement(node) {
          keyBase = {}

          const name = node.name.name
          const subName = node.subName && node.subName.name
          const fullName = name + (subName ? `.${subName}` : '')

          return t.callExpression(t.identifier('Flint.view'), [t.literal(fullName),
            t.functionExpression(null, [t.identifier('view'), t.identifier('on'), t.identifier('$')], node.block)]
          )
        },

        JSXElement: {
          enter(node, parent, scope, file) {
            inJSX = true
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
              const isDirectChildOfView = scope.hasOwnBinding('view')

              if (isDirectChildOfView)
                wrap = node => t.callExpression(t.identifier('view.render'), [
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
                if (scope.hasBinding('view') && scope.hasBinding(node.arguments[0].name)) {
                  return addSetter(node.arguments[0].name, node, scope)
                }
              }
            }
          }
        },

        // JSXIdentifier: {
        //   exit(node, parent, scope) {
        //     console.log(t.isVariable(node), node.name)
        //     if (node.start && node.end && scope.hasOwnBinding('view') && !node.hasGetter)
        //       return t.callExpression(t.identifier('view.get'), [t.literal(node.name), node.val])
        //   }
        // },

        VariableDeclaration: {
          exit(node, parent, scope, file) {
            // add getter
            if (scope.hasOwnBinding('view') && node.kind != 'const' && !node.flintTracked) {
              node.declarations.map(dec => {
                if (dec.flintTracked) return dec
                if (!dec.init) {
                  dec.init = viewGetter(dec.id.name, t.identifier('undefined'), scope, file)
                  dec.flintTracked = true
                  return dec
                }
                dec.init = viewGetter(dec.id.name, dec.init, scope, file)
                node.flintTracked = true
                return dec
              })
            }
          }
        },

        AssignmentExpression: {
          exit(node, parent, scope, file) {
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
              return style(node)

            // non-styles
            if (node.flintTracked || node.hasSetter || node.hasGetter) return

            const isBasicAssign = node.operator === "=" || node.operator === "-=" || node.operator === "+="
            if (!isBasicAssign) return

            const isRender = hasObjWithProp(node, 'view', 'render')

            let id = x => x
            let sett = id
            let gett = id
            let added = false

            // view.set
            if (!isRender) {
              sett = node => addSetter(node.left.name, node, scope)
              added = true
            }

            // add getter
            if (!isRender) {
              gett = node => addGetter(node, scope, file)
              added = true
            }

            node = sett(gett(node))

            if (added && node)
              node.flintTracked = 1

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

  return FlintPlugin
}