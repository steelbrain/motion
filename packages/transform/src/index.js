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

function viewUpdateExpression(t, node) {
  return t.callExpression(t.identifier('view.update'), [node])
}

export default function ({ Plugin, types: t }) {
  return new Plugin("flint-transform", {
    visitor: {
      CallExpression: {
        exit(node, parent, scope) {
          // mutative array methods
          if (isInView(scope) && isMutativeArrayFunc(node))
            return viewUpdateExpression(t, node)
        }
      },

      AssignmentExpression: {
        exit(node, parent, scope) {
          const isBasicAssign = node.operator === "=" || node.operator === "-=" || node.operator === "+=";
          if (!isBasicAssign) return

          // styles
          const isStyle = node.left && node.left.name && node.left.name.indexOf('$') == 0
          if (isStyle)
            return t.assignmentExpression(node.operator, t.identifier(`view.styles["${node.left.name}"]`),
              t.functionExpression(null, [t.identifier('_index')],
                t.blockStatement([
                  t.returnStatement(node.right)
                ])
              )
            )

          // view.update
          const inView = isInView(scope)
          const skipUpdate = (
            hasObjWithProp(node, 'view', 'render')
          )
          if (inView && !skipUpdate)
            return viewUpdateExpression(t, node)
        }
      }
    }
  });
}