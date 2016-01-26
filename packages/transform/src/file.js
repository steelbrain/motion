import StyleSheet from './stilr/index'
import niceStyles from 'flint-nice-styles'
import hash from 'hash-sum'
import path from 'path'

function isUpperCase(str) {
  return str.charAt(0) == str.charAt(0).toUpperCase()
}

function viewMainSelector(viewName, options) {
  const pre = options.selectorPrefix || ''
  return `${pre}.View${viewName}`
}

function viewSelector(viewName, tag, options) {
  const pre = options.selectorPrefix || ''
  const selTag = `${tag}.${viewName}`
  const selClass = `.${viewName}.${tag}`
  const selSelfClass = `.View${viewName}.${tag}`
  const selChildClass = `.${viewName} > .${tag}` // for children views?
  return `${pre + selTag}, ${pre + selClass}, ${pre + selSelfClass}, ${pre + selChildClass}`
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

function findObjectName(obj) {
  if (obj.name) return obj.name
  if (obj.object) return findObjectName(obj.object)
}

function isInView(scope) {
  return scope.hasBinding("view")
}

function getTagName(JSXElement) {
  return JSXElement.openingElement.name.elements[0].value
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
let log = function() {}

export default function createPlugin(options) {
  if (options.Transformer) {
    // running directly (no user options)
    return FlintPlugin(options)
  }
  else {
    if (options.log)
      log = options.log
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
    let currentView = null

    // plugin helpers

    // return unique string based on value of node
    function nodeToStr(node) {
      if (t.isMemberExpression(node))
        return node.object.name + node.property.name
      if (t.isArrayExpression(node))
        return node.elements.reduce((acc, cur) => acc + nodeToStr(cur), '')
      if (t.isObjectExpression(node)) {
        return node.properties.reduce((acc, cur) => {
          return acc + typeof cur.key == 'object' && cur.key.name + nodeToStr(cur.value)
        }
        , '')
      }

      return node.value
    }

    function frozen(node) {
      return t.callExpression(t.identifier('Object.freeze'), [node])
    }

    function propChange(node) {
      return t.expressionStatement(
        t.callExpression(t.identifier('on.props'), [
          t.functionExpression(null, [], t.blockStatement(
            node.declarations.map(({ id: { name } }) =>
              t.expressionStatement(
                t.assignmentExpression('=', t.identifier(name),
                  t.identifier(`view.getProp('${name}')`)
                )
              )
            )
          ))
        ])
      )
    }

    function wrapSetter(name, node, scope, postfix, method = 'set') {
      if (node.hasSetter) return
      if (scope.hasBinding('view')) {
        let args = [t.literal(name), node]
        if (postfix) args = args.concat([postfix, t.identifier('true')])
        const expr = t.callExpression(t.identifier(`view.${method}`), args)
        node.hasSetter = true
        return expr
      }

      return node
    }

    function wrapDeclarator(name, node, scope) {
      return wrapSetter(name, node, scope, false, 'dec')
    }

    function wrapPropertyDeclarator(name, node, scope) {
      return wrapSetter(name, node, scope, false, 'prop')
    }

    function getter(name, val, ...args) {
      return t.callExpression(t.identifier('view.get'), [t.literal(name), val, ...args])
    }

    function viewGetter(name, val, scope, file) {
      let comesFromFile = file.scope.hasOwnBinding(val.name)

      if (comesFromFile)
        return getter(name, val, t.literal('fromFile'))

      return getter(name, val)
    }

    function wrapGetter(node, scope, file) {
      if (node.hasGetter) return
      if (scope.hasOwnBinding('view')) {
        if (node.left.object) return node
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

    function isViewState(name, scope) {
      return viewState[name] && !scope.hasOwnBinding(name)
    }

    function isJSXAttributeOfName(attr, name) {
      return attr.name == name
    }

    function tracker(name, type = 'dec') {
      return t.expressionStatement(t.callExpression(t.identifier(`view.${type}`), [t.literal(name), t.identifier(name)]))
    }

    function destructureTrackers(id, wrapType) {
      return id.properties.map(prop => {
        return tracker(prop.key.name, wrapType)
      })
    }

    let keyBase = {}
    let inJSX = false
    let inView = null // track current view name
    let hasView = false // if file has a view
    let hasExports = false
    let viewHasChildWithClass = false // if view calls for a child view
    let viewStyles = {} // store styles from views to be extracted
    let viewDynamicStyleKeys = {}
    let viewStaticStyleKeys = {}
    let viewRootNodes = [] // track root JSX elements
    let viewState = {} // track which state to wrap
    let viewStyleNames = {} // prevent duplicate style names
    let fileImports = []

    function getRootTagName() {
      if (!viewRootNodes.length) return ''
      return getTagName(viewRootNodes[0])
    }

    function shouldStyleAsRoot() {
      const numRoots = viewRootNodes.length
      let result = numRoots == 0
      if (numRoots == 1) {
        const hasRootProp = viewRootNodes[0].openingElement.attributes.filter(x => x.name && x.name.name === 'root').length

        result = (
          hasRootProp ||
          getRootTagName() == inView.toLowerCase()
        )
      }
      return result
    }



    // extract statics
    function getArrayStatics(node) {
      let rightEls = []
      let staticProps = []

      let result = () => dynamicStyleStatement(node, node.right)

      for (let el of node.right.elements) {
        // bail out if they arent using just objects (ternery, variable)
        if (!t.isObjectExpression(el))  {
          return result()
        }

        const extracted = extractStatics(node.left.name, el)
        if (!extracted) continue

        let { statics, dynamics } = extracted

        if (statics.length)
          staticProps = staticProps.concat(statics)

        if (dynamics.length) {
          rightEls.push(t.objectExpression(dynamics))
          continue
        }
      }

      node.right.elements = rightEls

      return result()
    }

    // splits styles into static/dynamic pieces
    function extractAndAssign(node) {
      // if array of objects
      if (t.isArrayExpression(node.right)) {
        return getArrayStatics(node)
      }

      // extract statics, but return just dynamics
      if (t.isObjectExpression(node.right)) {
        let name = node.left.name

        if (viewStyleNames[name])
          throw file.errorWithNode(node.left, `Duplicate style! view ${inView} { ${name} }`)

        viewStyleNames[name] = true

        let { statics, dynamics } = extractStatics(name, node.right)

        // sets dynamic keys for use in determining hot reload clear later
        const statKeys = viewStaticStyleKeys
        const dynKeys = viewDynamicStyleKeys

        statics.forEach(n => statKeys[n.key.name] = nodeToStr(n.value))
        dynamics.forEach(n => {
          if (!t.isSpreadProperty(n))
            dynKeys[n.key.name] = nodeToStr(n.value)
        })

        let hasStatics = statics.length
        let hasDynamics = dynamics.length

        let result = []

        // if no dynamics, leave empty
        if (!hasStatics && !hasDynamics)
          return result

        // hot reload uniq keys

        // keep statics hash inside view for child view styles (to trigger hot reloads)
        const isChildView = hasStatics && name[1] && name[1] == name[1].toUpperCase()
        const isChildViewClassed = hasStatics && viewHasChildWithClass && name != '$'

        if (isChildView || isChildViewClassed) {
          const uniq = hash(statKeys)
          result.push(exprStatement(t.literal(uniq)))
        }

        // if dynamic + static clash, put that inside view to trigger hot reloads
        if (hasStatics && !options.production && dynKeys.length) {
          let uniq = ''
          Object.keys(dynKeys).forEach(key => {
            if (statKeys[key]) {
              uniq += hash(statKeys[key] + dynKeys[key]) + hash(key)
            }
          })
          result.push(exprStatement(t.literal(uniq)))
        }

        // return statement

        if (hasDynamics) {
          result.push(dynamicStyleStatement(node, dynamics))
        }

        return result
      }

      else {
        return styleAssign(node)
      }
    }

    // find statics/dynamics in object
    function extractStatics(name, node) {
      let statics = []
      let dynamics = []

      viewStyles[inView] = viewStyles[inView] || {}
      viewStyles[inView][name] = []

      let duplicate = {}

      for (let prop of node.properties) {
        if (t.isSpreadProperty(prop)) {
          // TODO: make work
          dynamics.push(prop)
          continue
        }

        if (duplicate[prop.key.name])
          throw file.errorWithNode(prop, `Duplicate style prop! view ${inView} { ${name}.${prop.key.name} }`)

        duplicate[prop.key.name] = true

        if (isStatic(prop)) {
          viewStyles[inView][name].push(prop)
          statics.push(prop)
        }
        else {
          dynamics.push(prop)
        }
      }

      return { statics, dynamics }
    }

    // determine if property is static
    function isStatic(prop) {
      const staticKey = t.isIdentifier(prop.key)

      if (!staticKey)
        return false

      const staticVal = (
           t.isLiteral(prop.value)
        || t.isUnaryExpression(prop.value) && t.isLiteral(prop.value.argument)
      )

      if (staticVal)
        return true

      // determine if array is fully static
      if (t.isArrayExpression(prop.value)) {
        return prop.value.elements.reduce((acc, cur) => acc = acc && t.isLiteral(cur), true)
      }
    }

    // $["name"] = ...
    function dynamicStyleStatement(node, dynamics) {
      return exprStatement(
        styleAssign(node, t.isArrayExpression(dynamics)
          ? dynamics
          : t.objectExpression(dynamics))
      )
    }

    function styleLeft(node) {
      const prefix = '$'

      if (node.left.object) {
        return node.left
      }

      const name = node.left.name.slice(1) || '$'
      return t.identifier(`${prefix}["${name}"]`)
    }

    function styleAssign(node, _right) {
      let right = _right || node.right

      const assignment = t.assignmentExpression('=',
        styleLeft(node),
        styleFunction(right)
      )

      assignment.isStyle = true
      return assignment

      // (_index) => {}
      function styleFunction(inner) {
        return t.functionExpression(null, [t.identifier('_'), t.identifier('_index')],
          t.blockStatement([ t.returnStatement(inner) ])
        )
      }
    }

    function exprStatement(node) {
      return t.expressionStatement(node)
    }



    // meta-data for views for atom
    let meta

    return new Plugin("flint-transform", {
      metadata: {group: 'builtin-trailing'},
      visitor: {
        // program = file because we pass in one at a time
        Program: {
          enter() {
            hasView = false
            hasExports = false
            fileImports = []
            meta = { file: null, views: {} }
          },

          exit(node, parent, scope, file) {
            if (options.onImports) {
              options.onImports(file.opts.filename, fileImports)
            }

            const location = relativePath(file.opts.filename)
            meta.file = location

            if (options.onMeta) {
              options.onMeta(meta)
            }

            if (!hasExports) {
              // function(){ Flint.file('${location}',function(require, exports){ ${contents}\n  })\n}()
              node.body = [t.expressionStatement(
                // closure
                t.callExpression(t.functionExpression(null, [], t.blockStatement([
                  t.callExpression(t.identifier('Flint.file'), [t.literal(location),
                    t.functionExpression(null, [t.identifier('require')],
                      t.blockStatement(node.body)
                    )
                  ])
                ])), [])
              )]
            }
          }
        },

        ExportDeclaration() {
          hasExports = true

          if (hasView)
            throw new Error("Views shouldn't be exported! Put your exports into files without views.")
        },

        // transform local import paths
        ImportDeclaration(node, parent, scope, file) {
          const importPath = node.source.value
          fileImports.push(importPath)
        },

        ViewStatement: {
          enter(node, parent, scope, file) {
            hasView = true
            keyBase = {}

            const name = node.name.name
            const subName = node.subName && node.subName.name
            const fullName = name + (subName ? `.${subName}` : '')

            currentView = fullName
            meta.views[currentView] = {
              location: node.loc,
              file: file.opts.filename,
              styles: {},
              els: {},
            }

            inView = fullName
            viewRootNodes = []
            viewState = {}
            viewStyleNames = {}
            viewDynamicStyleKeys = {}
            viewStaticStyleKeys = {}
            viewHasChildWithClass = false

            return t.callExpression(t.identifier('Flint.view'), [t.literal(fullName),
              t.functionExpression(null, [t.identifier('view'), t.identifier('on'), t.identifier('$')], node.block)]
            )
          }
        },

        Statement: {
          exit(node) {
            if (node._flintViewParsed) return // avoid parsing twice

            if (inView && node.expression && node.expression.callee && node.expression.callee.name == 'Flint.view') {
              node._flintViewParsed = true

              // check if child tag is direct root
              const shouldStyleTagnameAsRoot = shouldStyleAsRoot()
              const viewName = inView
              const styles = viewStyles[viewName]

              if (!styles) return

              let rawStyles = {}

              // turns styles babel tree into js again
              Object.keys(styles).forEach(tag => {
                const styleProps = styles[tag]
                const viewstyle = styleProps.reduce((acc, cur) => {
                  acc[cur.key.name] = t.isArrayExpression(cur.value)
                    ? cur.value.elements.map(e => e.value)
                    : cur.value.value
                  return acc
                }, {})

                niceStyles(viewstyle)
                rawStyles[tag] = viewstyle
              })

              function getSelector(viewName, tag) {
                let cleanViewName = viewName.replace('.', '-')
                tag = tag.replace(/^\$/, '')

                log('styles', 'getSelector', 'viewName', viewName, 'tag', tag)

                // styling root tag
                if (shouldStyleTagnameAsRoot && tag == inView.toLowerCase() || tag == '')
                  return viewMainSelector(cleanViewName, options)

                // styling child view
                if (tag[0] == tag[0].toUpperCase())
                  return viewMainSelector(`${cleanViewName} .View${tag}`, options)

                // styling tag in view
                return viewSelector(cleanViewName, tag, options)
              }

              log('styles', 'rawStyles', rawStyles)
              const stylesheet = StyleSheet.create(rawStyles, {
                selector: tag => getSelector(viewName, tag)
              })

              const classNamesObject = t.objectExpression(
                Object.keys(stylesheet).reduce((acc, key) => {
                  acc.push(t.property(null, t.literal(key), t.literal(stylesheet[key])))
                  return acc
                }, [])
              )

              if (options.writeStyle)
                options.writeStyle(viewName, StyleSheet.render())

              StyleSheet.clear()

              // inline the static styles as js object for use when needing to override dynamics
              const stylesObject = t.objectExpression(
                Object.keys(styles).reduce((acc, key) => {
                  acc.push(t.property(null, t.literal(key), t.objectExpression(styles[key])))
                  return acc
                }, [])
              )

              // Flint.staticStyles('ViewName', {}, ``)
              const staticStyleExpr = t.expressionStatement(
                t.callExpression(t.identifier('Flint.staticStyles'), [
                  t.literal(viewName),
                  classNamesObject,
                  stylesObject
                ])
              )

              // Flint.viewRoots["Name"] = "RootElementName"
              if (shouldStyleAsRoot()) {
                const viewRootNodeExpr = t.expressionStatement(
                  t.assignmentExpression('=', t.identifier(`Flint.viewRoots["${viewName}"]`), t.literal(getRootTagName()))
                )
                return [ staticStyleExpr, viewRootNodeExpr, node ]
              }

              // reset
              inView = false
              viewStyles[viewName] = {}

              return [ staticStyleExpr, node ]
            }
          }
        },

        JSXElement: {
          enter(node, parent, scope, file) {
            const el = node.openingElement

            // avoid reprocessing
            if (node.flintJSXVisits != 2) {
              // add index keys for repeat elements
              if (node.flintJSXVisits == 1) {
                if (scope.hasBinding('_index')) {
                  el.name.elements.push(t.identifier('_'))
                  el.name.elements.push(t.identifier('_index'))
                }

                node.flintJSXVisits = 2
                return
              }

              // top level JSX element
              if (scope.hasOwnBinding('view')) {
                viewRootNodes.push(node)
              }

              inJSX = true

              node.flintJSXVisits = 1
              const name = nodeToNameString(el.name)

              // ['quotedname', key]
              let key

              if (keyBase[name])
                key = ++keyBase[name]
              else
                key = keyBase[name] = 1

              let arr = [t.literal(name), t.literal(key)]

              // track meta
              if (meta.views[currentView]) {
                meta.views[currentView].els[name + key] = el.loc.end
              }

              /*
                checks whether user is referencing variable or view
                check root to see if the variable exists
                  Modal.Footer would have a root of Modal
              */
              // safer, checks for file scope or view scope only
              let [rootName, ...children] = name.split('.')
              let isVariable = (scope.hasOwnBinding(rootName) || file.scope.hasOwnBinding(rootName)) && isUpperCase(rootName)

              // either gives <Modal> or <Modal.Header>
              const getVar = (rootName, name) =>
                rootName == name ?
                  t.identifier(name) :
                  t.memberExpression(t.identifier(rootName), t.identifier(children.join('.')))

              if (isVariable)
                arr = [getVar(rootName, name)].concat(arr)

              el.name = t.arrayExpression(arr)

              // process attributes
              if (!el.attributes) return

              let rpt = idFn
              let iff = idFn
              let route = idFn

              for (let attr of el.attributes) {
                const attrName = attr.name && attr.name.name
                const expr = attr.value && (attr.value.expression || t.literal(attr.value.value))

                if (attrName == 'class' && isUpperCase(name))
                  viewHasChildWithClass = true

                if (attrName == 'route') {
                  route = _node => t.logicalExpression('&&',
                    t.callExpression(t.identifier('Flint.routeMatch'), [expr]),
                    _node
                  )

                  // spread routeprops onto route
                  el.attributes.push(t.JSXSpreadAttribute(
                    t.callExpression(t.identifier('Flint.routeParams'), [expr])
                  ))
                }

                if (attrName == 'if') {
                  iff = _node => t.logicalExpression('&&', t.callExpression(t.identifier('Flint.iff'), [expr]), _node)
                }

                if (attrName == 'repeat') {
                  rpt = _node => {
                    // remove repeat from inner node
                    // const opening = _node.openingElement
                    // opening.attributes = opening.attributes.filter(attr => attr.name !== 'repeat')

                    return t.callExpression(
                      t.memberExpression(t.callExpression(t.identifier('Flint.range'), [expr]), t.identifier('map')),
                      [t.functionExpression(null, [t.identifier('_'), t.identifier('_index')], t.blockStatement([
                        t.returnStatement(_node)
                      ]))]
                    )
                  }
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
                t.JSXAttribute(t.literal('__flintValue'), node.value),
                t.JSXAttribute(t.literal('__flintOnChange'), t.functionExpression(null, [t.identifier('e')],
                  t.blockStatement([
                    t.assignmentExpression('_=_', node.value, t.identifier('e.target.value')),
                  ])
                )),
              ]
            }

            node.name.name = niceJSXAttributes(node.name.name)
          }
        },

        CallExpression: {
          exit(node, parent, scope) {
            // track require() statements
            if (node.callee && node.callee.name && node.callee.name == 'require') {
              const arg = node.arguments && node.arguments.length && node.arguments[0].value
              fileImports.push(arg)
            }

            // mutative array methods
            if (isInView(scope)) {
              if (isMutativeArrayFunc(node)) {
                const callee = node.callee

                // avoid doing stuff on Object.keys(x).sort()
                if (t.isCallExpression(callee.object))
                  return

                const name = callee.object ? findObjectName(callee.object) : callee.property.name

                if (isViewState(name, scope))
                  return wrapSetter(name, node, scope, t.identifier(name))
              }

              if (isObjectAssign(node)) {
                // if mutating an object in the view
                let name = node.arguments[0].name

                if (isViewState(name, scope))
                  return wrapSetter(name, node, scope)
              }
            }
          }
        },

        VariableDeclaration: {
          enter(node, parent, scope) {
            if (node.kind == 'prop' && !node._flintPropParsed) {
              node.kind = 'const'
              node._flintPropParsed = true

              node.declarations.map(dec => {
                let name = dec.id.name
                dec.init = wrapPropertyDeclarator(name, dec.init || t.identifier('undefined'), scope)
                return dec
              })

              return [ node, propChange(node) ]
            }
          },

          exit(node, parent, scope, file) {
            if (node.isStyle || node._flintDeclarationParsed) return
            node._flintDeclarationParsed = true

            // add getter
            if (scope.hasOwnBinding('view') && node.kind != 'const' && !node.flintTracked) {
              let destructNodes = []

              node.declarations.map(dec => {
                if (dec.flintTracked) return dec

                // destructures
                if (t.isObjectPattern(dec.id)) {
                  destructNodes = destructNodes.concat(destructureTrackers(dec.id, 'dec'))
                  return dec
                }

                let name = dec.id.name
                viewState[name] = true

                // avoid wrapping in production
                if (options.production)
                  return dec

                if (!dec.init) {
                  dec.init = wrapDeclarator(name, t.identifier('undefined'), scope)
                  dec.flintTracked = true
                  return dec
                }

                dec.init = wrapDeclarator(name, dec.init, scope)
                node.flintTracked = true
                return dec
              })

              // add destructure declarations
              if (destructNodes.length) {
                return [node, ...destructNodes]
              }
            }
          }
        },

        AssignmentExpression: {
          enter(node, parent, scope, file) {
            if (node.isStyle) return

            const isStyle = (
              // $variable = {}
              node.left.name && node.left.name.indexOf('$') == 0
            )

            if (!isStyle) return

            if (currentView)
              meta.views[currentView].styles[node.left.name.substr(1)] = node.loc.start

            // styles
            return extractAndAssign(node)
          },

          exit(node, parent, scope, file) {
            // non-styles
            if (node.flintTracked || node.hasSetter || node.hasGetter || node.isStyle) return

            // this is used internally to make setImmediate on sync
            const isImmediateAssign = node.operator === '_=_'
            if (isImmediateAssign) node.operator = '='

            const isBasicAssign = node.operator === "=" || node.operator === "-=" || node.operator === "+="
            if (!isBasicAssign) return

            // destructures
            if (scope.hasOwnBinding('view') && t.isObjectPattern(node.left)) {
              let destructNodes = destructureTrackers(node.left, 'set')
              node.flintTracked = true
              return [t.expressionStatement(node), ...destructNodes]
            }

            const isRender = hasObjWithProp(node, 'view', 'render')

            let id = x => x
            let sett = id
            let gett = id
            let added = false

            // view.set
            if (!isRender) {
              let name, post

              if (node.left.object) {
                name = findObjectName(node.left.object)
                post = t.identifier(name)
              }
              else if (t.isJSXExpressionContainer(node.left)) {
                const { expression } = node.left
                name = expression.object ?
                       findObjectName(expression.object) :
                       expression.name
              } else {
                name = node.left.name
              }

              if (isViewState(name, scope)) {
                sett = node => wrapSetter(name, node, scope, post, isImmediateAssign ? 'setImmediate' : 'set')
                added = true
              }
            }

            // add getter
            if (!options.production && !isRender && isViewState(node.left.name, scope)) {
              gett = node => wrapGetter(node, scope, file)
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
            if (node.operator == '++' || node.operator == '--') {
              let name

              if (node.argument.object)
                name = findObjectName(node.argument.object)
              else
                name = node.argument.name

              const postfix = !node.prefix ? t.identifier(name) : void 0
              return wrapSetter(name, node, scope, postfix)
            }
          }
        }
      }
    });

  }


  return FlintPlugin
}
