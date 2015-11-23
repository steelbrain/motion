import StyleSheet from 'flint-stilr'
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
  const selChildClass = `.${viewName} > .${tag}`
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

    // plugin helpers
    function frozen(node) {
      return t.callExpression(t.identifier('Object.freeze'), [node])
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


    function wrapDeclaration(name, node, scope) {
      return wrapSetter(name, node, scope, false, 'dec')
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

    let keyBase = {}
    let inJSX = false
    let inView = null // track current view name
    let hasView = false // if file has a view
    let viewStyles = {} // store styles from views to be extracted
    let viewRootNodes = [] // track root JSX elements
    let viewState = {} // track which state to wrap
    let viewStyleNames = {} // prevent duplicate style names

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

        File() {
          hasView = false
        },

        ExportDeclaration() {
          if (hasView)
            throw new Error("Views don't need to be exported! Put your exports into files without views.")
        },

        // transform local import paths
        ImportDeclaration(node, parent, scope, file) {
          const isInternal = node.source.value.charAt(0) == '.'

          // this ensures all paths are relative to the root, not the current file
          if (isInternal) {
            const importPath = path.join(path.dirname(file.opts.filename), node.source.value)
            const relImportPath = './' + relativePath(importPath)
            node.source.value = relImportPath
            node.source.rawValue = relImportPath
            node.source.raw = `\'${relImportPath}\'`
          }
        },

        ViewStatement: {
          enter(node) {
            // hasView = true
            keyBase = {}

            const name = node.name.name
            const subName = node.subName && node.subName.name
            const fullName = name + (subName ? `.${subName}` : '')

            inView = fullName
            viewRootNodes = []
            viewState = {}
            viewStyleNames = {}

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

              let rootTag = '$'

              // check if child tag is direct root
              const numRoots = viewRootNodes.length

              let shouldStyleTagnameAsRoot = numRoots == 0

              if (numRoots == 1) {
                const tagName = inView.toLowerCase()
                const rootTagName = viewRootNodes[0].openingElement.name.elements[0].value
                shouldStyleTagnameAsRoot = rootTagName == tagName
              }

              const viewName = inView
              const styles = viewStyles[viewName]

              if (!styles) return

              let rawStyles = {}

              Object.keys(styles).forEach(tag => {
                const styleProps = styles[tag]
                const viewstyle = styleProps.reduce((acc, cur) => {
                  acc[cur.key.name] = cur.value.value
                  return acc
                }, {})

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
              inView = false
              viewStyles[viewName] = {}

              // inline the static styles as js object for use when needing to override dynamics
              const stylesObject = t.objectExpression(
                Object.keys(styles).reduce((acc, key) => {
                  acc.push(t.property(null, t.literal(key), t.objectExpression(styles[key])))
                  return acc
                }, [])
              )

              const expr = t.expressionStatement(
                t.callExpression(t.identifier('Flint.staticStyles'), [
                  t.literal(viewName),
                  classNamesObject,
                  stylesObject
                ])
              )

              return [ expr, node ]
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
                  iff = _node => t.logicalExpression('&&', t.callExpression(t.identifier('Flint.iff'), [expr]), _node)
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
                t.JSXAttribute(t.literal('__flintValue'), node.value),
                t.JSXAttribute(t.literal('__flintOnChange'), t.functionExpression(null, [t.identifier('e')],
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
          exit(node, parent, scope, file) {
            if (node.isStyle) return

            // add getter
            if (scope.hasOwnBinding('view') && node.kind != 'const' && !node.flintTracked) {
              node.declarations.map(dec => {
                if (dec.flintTracked) return dec

                if (t.isObjectPattern(dec.id)) {
                  // let setters = dec.id.properties.map(prop => {
                  //   // console.log(prop.key.name)
                  //   return wrapSetter(prop.key.name, prop, scope)
                  // })
                  return dec
                }

                let name = dec.id.name
                viewState[name] = true

                if (!dec.init) {
                  dec.init = wrapDeclaration(name, t.identifier('undefined'), scope)
                  dec.flintTracked = true
                  return dec
                }

                dec.init = wrapDeclaration(name, dec.init, scope)
                node.flintTracked = true
                return dec
              })
            }
          }
        },

        AssignmentExpression: {
          enter(node, parent, scope, file) {
            if (node.isStyle) return

            const isStyle = (
              // $variable = {}
              node.left.name && node.left.name.indexOf('$') == 0 ||
              // $.variable = {}
              node.left.object && node.left.object.name == '$'
            )

            if (!isStyle) return

            // styles
            return extractAndAssign(node)

            // splits styles into static/dynamic pieces
            function extractAndAssign(node) {
              // TODO: only do this is the array is just objects, if they use a variable
              // it wont work with the static classname extraction
              // // if array of objects
              // if (t.isArrayExpression(node.right)) {
              //   let staticProps = []
              //
              //   node.right.elements = node.right.elements.map(el => {
              //     if (!t.isObjectExpression(el)) return el
              //     const extracted = extractStatics(node.left.name, el)
              //     if (!extracted) return null
              //     let { statics, dynamics } = extracted
              //     if (statics.length) staticProps = staticProps.concat(statics)
              //     if (dynamics.length) return t.objectExpression(dynamics)
              //     else return null
              //   }).filter(x => !!x)
              //
              //   return [
              //     staticStyleStatement(node, t.objectExpression(staticProps)),
              //     dynamicStyleStatement(node, node.right)
              //   ]
              // }

              // extract statics, but return just dynamics
              if (t.isObjectExpression(node.right)) {
                let name = node.left.name

                if (viewStyleNames[name])
                  throw file.errorWithNode(node.left, `Duplicate style! view ${inView} { ${name} }`)

                viewStyleNames[name] = true

                let { statics, dynamics } = extractStatics(name, node.right)

                let hasStatics = statics.length
                let hasDynamics = dynamics.length
                let isChildView = name && name.length > 1 && name[1] == name[1].toUpperCase()

                let result = []

                // if no dynamics, leave empty
                if (!hasStatics && !hasDynamics)
                  return result

                // keep statics inside view for child view styles (to trigger hot reloads)
                if (isChildView && hasStatics)
                  result.push(staticStyleStatement(node, t.objectExpression(statics)))

                if (hasDynamics)
                  result.push(dynamicStyleStatement(node, node.right))

                return result
              }

              else if (t.isLiteral(node.right) && node.right.value === false) {
                return staticStyleStatement(node, node.right)
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
                if (duplicate[prop.key.name])
                  throw file.errorWithNode(prop, `Duplicate style prop! view ${inView} { ${name}.${prop.key.name} }`)

                duplicate[prop.key.name] = true

                if (t.isLiteral(prop.value) && t.isIdentifier(prop.key)) {
                  viewStyles[inView][name].push(prop)
                  statics.push(prop)
                }
                else {
                  dynamics.push(prop)
                }
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

            function styleAssign(node, _right) {
              let right = _right || node.right

              const assignment = t.assignmentExpression('=',
                styleLeft(node),
                styleFunction(right)
              )

              assignment.isStyle = true

              // attempt to make $circles as a variable
              // let result = t.variableDeclaration('let', [
              //   t.variableDeclarator(
              //     t.identifier(node.left.name),
              //     assignment
              //   ),
              // ])
              //
              // result.isStyle = true

              return assignment

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
          },

          exit(node, parent, scope, file) {
            // non-styles
            if (node.flintTracked || node.hasSetter || node.hasGetter || node.isStyle) return

            const isBasicAssign = node.operator === "=" || node.operator === "-=" || node.operator === "+="
            if (!isBasicAssign) return

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
              else if (t.isJSXExpressionContainer(node.left))
                name = node.left.expression.name
              else
                name = node.left.name

              if (isViewState(name, scope)) {
                sett = node => wrapSetter(name, node, scope, post)
                added = true
              }
            }

            // add getter
            if (!isRender && isViewState(node.left.name, scope)) {
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