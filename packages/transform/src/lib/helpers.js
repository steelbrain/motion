import path from 'path'
import state from '../state'

let T

export default function init(_options, _t) {
  // redefine t??
  t = t.t = _t
  options = _options
}

export function t() {}
export function options() {}

export function isComponentReturn(node) {
  return (
    t.isCallExpression(node) && node.callee.name == '$'
  )
}

// array of dom+style
export function componentReturn(node) {
  const args = node.arguments

  for (let i = 0; i < args.length; i++) {
    let el = args[i]

    if (t.isJSXElement(el)) {
      args[i] = t.functionExpression(null, [], t.blockStatement([ t.returnStatement(el) ]))
    }
  }

  node = t.callExpression(t.identifier('this.__motionRender'), [node])

  return node
}

export function component({ name, node, type = component.CLASS }) {
  if (type == component.SIMPLE) {
    // add view as first parameter
    node.params = [ t.identifier('view'), ...node.params ]
  }

  const wrapped = t.callExpression(t.identifier(type), [t.literal(name), node])
  wrapped.isMotionHot = true
  return wrapped
}

component.SIMPLE = 'Motion.componentFn'
component.CLASS = 'Motion.componentClass'

component.simple = opts => component({ ...opts, type: component.SIMPLE })
component.class = opts => component({ ...opts, type: component.CLASS })

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

export function niceJSXAttributes(name) {
  for (let key in niceAttrs) {
    if (name == niceAttrs[key]) {
      return key
    }
  }
  return name
}

export function isUpperCase(str) {
  return str.charAt(0) == str.charAt(0).toUpperCase()
}

export function viewMainSelector(viewName, options) {
  const pre = options.selectorPrefix || ''
  return `${pre}.View${viewName}`
}

export function viewSelector(viewName, tag, options) {
  const pre = options.selectorPrefix || ''
  const selTag = `${tag}.${viewName}`
  const selClass = `.${viewName}.${tag}`
  const selSelfClass = `.View${viewName}.${tag}`
  // const selChildClass = `.${viewName} > .${tag}` // for children views?
  return `${pre + selTag}, ${pre + selClass}, ${pre + selSelfClass}`
}

export function hasObjWithProp(node, base, prop) {
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

export function findObjectName(obj) {
  if (obj.name) return obj.name
  if (obj.object) return findObjectName(obj.object)
}

export function isInView(scope) {
  return scope.hasBinding("view")
}

export function getRootTagName() {
  if (!state.viewRootNodes.length) return ''
  return getTagName(state.viewRootNodes[0])
}

export function getTagName(JSXElement) {
  return JSXElement.openingElement.name.elements[0].value
}

const mutativeFuncs = ['push', 'reverse', 'splice', 'shift', 'pop', 'unshift', 'sort']

export function isMutativeArrayFunc(node) {
  const name = node.callee &&
    node.callee.property &&
    node.callee.property.name

  return (name && mutativeFuncs.indexOf(name) >= 0)
}

export function isObjectAssign(node) {
  if (!node.callee) return

  const propName = node.callee.property && node.callee.property.name
  const objName = node.callee.object && node.callee.object.name

  return objName == 'Object' && propName == 'assign'
}

export const idFn = x => x

// helpers
export function relativePath(filename) {
  if (filename && options.basePath) {
    return path.relative(options.basePath, filename)
  }
  return ''
}

export function exprStatement(node) {
  return t.expressionStatement(node)
}

export function normalizeLocation(location) {
  return [[location.start.line - 1, location.start.column], [location.end.line - 1, location.end.column]]
}

// return unique string based on value of node
export function nodeToStr(node) {
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

  return node && node.value
}

export function frozen(node) {
  return t.callExpression(t.identifier('Object.freeze'), [node])
}

export function propChange(node) {
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

export function nodeToNameString(node) {
  if (typeof node.name == 'string') return node.name

  if (t.isJSXMemberExpression(node)) {
    const isNested = t.isJSXMemberExpression(node.object)
    return (isNested ? nodeToNameString(node.object) : '')
      + `${node.object.name || ''}.${node.property.name}`
  }
}

export function isJSXAttributeOfName(attr, name) {
  return attr.name == name
}

export function tracker(name, type = 'dec') {
  return t.expressionStatement(t.callExpression(t.identifier(`view.${type}`), [t.literal(name), t.identifier(name)]))
}

export function destructureTrackers(id, wrapType) {
  return id.properties.map(prop => {
    return tracker(prop.key.name, wrapType)
  })
}

export function parentFunctionNode(scope) {
  if (t.isArrowFunctionExpression(scope.parentBlock.init))
    return scope.parentBlock.init

  const parentFunc = scope.path.findParent(p => {
    // console.log(p.type)
    return p.isFunction() || p.isMethodDefinition()
  })

  return parentFunc && parentFunc.node
}

export function shouldStyleAsRoot() {
  const numRoots = state.viewRootNodes.length
  let result = numRoots == 0
  if (numRoots == 1) {
    const hasRootProp = state.viewRootNodes[0].openingElement.attributes.filter(x => x.name && x.name.name === 'root').length

    result = (
      hasRootProp ||
      getRootTagName() == state.inView.toLowerCase()
    )
  }
  return result
}

export function isViewState(name, scope) {
  return state.viewState[name] && !scope.hasOwnBinding(name)
}