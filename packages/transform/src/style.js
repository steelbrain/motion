// splits styles into static/dynamic pieces
export default function extractAndAssign(node) {
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
