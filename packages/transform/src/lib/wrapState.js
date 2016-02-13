import { t, parentFunctionNode } from './helpers'

export function updateState() {
  return t.expressionStatement(t.callExpression(t.identifier('view.updateSoft'), []))
}

export function wrapSetter(name, node, scope, postfix, method = 'set') {
  if (node.hasSetter) return
  if (scope.hasBinding('view')) {
    let args = [t.literal(name), node]
    if (postfix) args = args.concat([postfix, t.identifier('true')])
    const expr = t.callExpression(t.identifier(`view.${method}`), args)
    node.hasSetter = true

    // for later view.update() insertion
    const scopeBlockIsFunc = (
      t.isArrowFunctionExpression(scope.block) || t.isFunctionExpression(scope.block) || t.isFunctionDeclaration(scope.block)
    )

    if (scopeBlockIsFunc) {
      scope.block.hasSetter = true
    }
    else {
      // or find parent
      const parentFunc = parentFunctionNode(scope)
      if (parentFunc) parentFunc.motionStateMutativeFunction = true
    }

    return expr
  }

  return node
}

export function wrapDeclarator(name, node, scope) {
  return wrapSetter(name, node, scope, false, 'dec')
}

export function wrapPropertyDeclarator(name, node, scope) {
  return wrapSetter(name, node, scope, false, 'prop')
}

export function getter(name, val, ...args) {
  return t.callExpression(t.identifier('view.get'), [t.literal(name), val, ...args])
}

export function viewGetter(name, val, scope, file) {
  let comesFromFile = file.scope.hasOwnBinding(val.name)

  if (comesFromFile)
    return getter(name, val, t.literal('fromFile'))

  return getter(name, val)
}

export function wrapGetter(node, scope, file) {
  if (node.hasGetter) return
  if (scope.hasOwnBinding('view')) {
    if (node.left.object) return node
    node.right = viewGetter(node.left.name, node.right, scope, file)
    node.hasGetter = true
  }
  return node
}


export function stateTrack(node) {
  if (node.body.motionView) return
  if (node.motionStateTracked) return
  node.motionStateTracked = true

  if (node.hasSetter || node.motionStateMutativeFunction) {
    if (t.isArrowFunctionExpression(node) && t.isCallExpression(node.body)) {
      node.body = wrapper(node.body)
    }
    else {
      node.body.body = wrapper(node.body.body)
    }
  }

  return node

  function wrapper(body) {
    if (Array.isArray(body)) {
      body.push(updateState())
    }
    else {
      body = t.blockStatement([t.expressionStatement(body), updateState()])
    }
    return body
  }
}
