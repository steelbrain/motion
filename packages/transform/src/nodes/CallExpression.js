import { t, options, isInView, isMutativeArrayFunc, findObjectName, isObjectAssign, isViewState } from '../lib/helpers'
import state from '../state'
import { wrapSetter } from '../lib/wrapState'

export default {
  exit(node, parent, scope, file) {
    const callee = node.callee

    // track require() statements
    if (callee && callee.name == 'require') {
      const arg = node.arguments && node.arguments.length && node.arguments[0].value
      options.onImports && options.onImports(arg)
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
}