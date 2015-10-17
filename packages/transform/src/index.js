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

export default function ({ Plugin, types: t }) {
  return new Plugin("flint-transform", {
    visitor: {
      AssignmentExpression: {
        exit(node, parent, scope, file) {
          const isBasicAssign = node.operator === "=" || node.operator === "-=" || node.operator === "+=";

          const isStyle = node.left && node.left.name && node.left.name.indexOf('$') == 0

          if (isStyle)
            return t.assignmentExpression(node.operator, t.identifier(`view.styles["${node.left.name}"]`),
              t.functionExpression(null, [t.identifier('_index')],
                t.blockStatement([
                  t.returnStatement(node.right)
                ])
              )
            )

          const inView = scope.hasBinding("view")
          const skipUpdate = (
            hasObjWithProp(node, 'view', 'render')
          )

          if (inView && !skipUpdate)
            return t.callExpression(t.identifier('view.update'), [node])
        }
      }
    }
  });
}