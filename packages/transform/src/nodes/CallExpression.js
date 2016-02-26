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
  }
}