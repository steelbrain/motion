import state from '../state'
import { t, options, propChange, component } from '../lib/helpers'
import { wrapPropertyDeclarator, destructureTrackers, wrapDeclarator } from '../lib/wrapState'

export default {
  exit(node, parent, scope, file) {
    if (node.isStyle ) return

    // track React.createClass
    for (let dec of node.declarations) {
      if (t.isCallExpression(dec.init) && dec.init.callee.object) {
        const { object, property } = dec.init.callee

        if (object.name == 'React' && property.name == 'createClass') {
          const name = dec.id.name
          dec.init = component({ name, node: dec.init })
        }
      }
    }
  }
}