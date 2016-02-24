import state from '../state'
import { t, options, propChange, component } from '../lib/helpers'
import { wrapPropertyDeclarator, destructureTrackers, wrapDeclarator } from '../lib/wrapState'

export default {
  enter(node, parent, scope) {
    if (node.kind == 'prop' && !node._motionPropParsed) {
      node.kind = 'const'
      node._motionPropParsed = true

      node.declarations.map(dec => {
        let name = dec.id.name
        dec.init = wrapPropertyDeclarator(name, dec.init || t.identifier('undefined'), scope)
        return dec
      })

      return [ node, propChange(node) ]
    }
  },

  exit(node, parent, scope, file) {
    if (node.isStyle || node._motionDeclarationParsed) return
    node._motionDeclarationParsed = true

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

    // add getter
    if (scope.hasOwnBinding('view') && node.kind != 'const' && !node.motionTracked) {
      let destructNodes = []

      node.declarations.map(dec => {
        if (dec.motionTracked) return dec

        // destructures
        if (t.isObjectPattern(dec.id)) {
          destructNodes = destructNodes.concat(destructureTrackers(dec.id, 'dec'))
          return dec
        }

        let name = dec.id.name
        state.viewState[name] = true

        // avoid wrapping functions
        if (t.isFunctionExpression(dec.init) || t.isArrowFunctionExpression(dec.init))
          return dec

        // avoid wrapping in production
        if (options.production)
          return dec

        if (!dec.init) {
          dec.init = wrapDeclarator(name, t.identifier('undefined'), scope)
          dec.motionTracked = true
          return dec
        }

        dec.init = wrapDeclarator(name, dec.init, scope)
        node.motionTracked = true
        return dec
      })

      // add destructure declarations
      if (destructNodes.length) {
        return [node, ...destructNodes]
      }
    }
  }
}