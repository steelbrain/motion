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

          const isStyle = node.left && node.left.name && node.left.name == '$'
          const skipUpdate = (
            hasObjWithProp(node, 'view', 'render') ||
            hasObjWithProp(node, '$')
          )

          if (isStyle)
            return t.assignmentExpression(node.operator, `view.styles["${node.left.name}"]`, node.right)

          const inView = scope.hasBinding("view")

          if (inView && !skipUpdate)
            return t.callExpression(t.identifier('view.update'), [node])
        }
      }
    }
  });
}



        // return t.callExpression(t.identifier('view.update'), [t.literal('hello')])

        // // styles not wrapped
        // if (isBasicAssign)
        //   if (isStyle)
        //     this.insertBefore('view.styles.')
        //   else
        //     if (!skipUpdate)
        //       this.insertBefore("view.update(");
        //
        // if (isStyle)
        //   this.insertBefore('function(_index) { return ')
        //
        // if (isStyle)
        //   this.insertAfter('}')
        //
        // if (isBasicAssign && !isStyle && !skipUpdate)
        //   this.insertAfter(") /*_end_view_update_*/")

        //   console.log(result.join(''))
        // return t.expressionStatement(result.join(''))