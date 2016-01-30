import state from '../state'
import { t, options, exprStatement, nodeToStr } from './helpers'
import hash from 'hash-sum'

// splits styles into static/dynamic pieces
export function extractAndAssign(node, file) {
  // if array of objects
  if (t.isArrayExpression(node.right)) {
    return getArrayStatics(node, file)
  }

  // extract statics, but return just dynamics
  if (t.isObjectExpression(node.right)) {
    let name = node.left.name

    if (state.viewStyleNames[name])
      throw file.errorWithNode(node.left, `Duplicate style: view ${state.inView} { ${name} }`)

    state.viewStyleNames[name] = true

    let { statics, dynamics } = extractStatics(name, node.right, file)

    // sets dynamic keys for use in determining hot reload clear later
    const statKeys = state.viewStaticStyleKeys
    const dynKeys = state.viewDynamicStyleKeys

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
    const isChildViewClassed = hasStatics && state.viewHasChildWithClass && name != '$'

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
function extractStatics(name, node, file) {
  let statics = []
  let dynamics = []

  state.viewStyles[state.inView] = state.viewStyles[state.inView] || {}
  state.viewStyles[state.inView][name] = []

  let duplicate = {}

  for (let prop of node.properties) {
    if (t.isSpreadProperty(prop)) {
      // TODO: make work
      dynamics.push(prop)
      continue
    }

    if (duplicate[prop.key.name])
      throw file.errorWithNode(prop, `Duplicate style property: view ${state.inView} { ${name} = { ${prop.key.name} } }`)

    duplicate[prop.key.name] = true

    if (isStatic(prop)) {
      state.viewStyles[state.inView][name].push(prop)
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
export function dynamicStyleStatement(node, dynamics) {
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


// extract statics
function getArrayStatics(node, file) {
  let rightEls = []
  let staticProps = []

  let result = () => dynamicStyleStatement(node, node.right)

  for (let el of node.right.elements) {
    // bail out if they arent using just objects (ternery, variable)
    if (!t.isObjectExpression(el))  {
      return result()
    }

    const extracted = extractStatics(node.left.name, el, file)
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
