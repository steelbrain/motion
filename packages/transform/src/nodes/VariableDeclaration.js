import state from '../state'
import { t, options, propChange } from '../lib/helpers'
import { wrapPropertyDeclarator, destructureTrackers, wrapDeclarator } from '../lib/wrapState'

export default {
  enter(node, parent, scope) {
    if (node.kind == 'prop' && !node._flintPropParsed) {
      node.kind = 'const'
      node._flintPropParsed = true

      node.declarations.map(dec => {
        let name = dec.id.name
        dec.init = wrapPropertyDeclarator(name, dec.init || t.identifier('undefined'), scope)
        return dec
      })

      return [ node, propChange(node) ]
    }
  },

  exit(node, parent, scope, file) {
    if (node.isStyle || node._flintDeclarationParsed) return
    node._flintDeclarationParsed = true

    // add getter
    if (scope.hasOwnBinding('view') && node.kind != 'const' && !node.flintTracked) {
      let destructNodes = []

      node.declarations.map(dec => {
        if (dec.flintTracked) return dec

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
          dec.flintTracked = true
          return dec
        }

        dec.init = wrapDeclarator(name, dec.init, scope)
        node.flintTracked = true
        return dec
      })

      // add destructure declarations
      if (destructNodes.length) {
        return [node, ...destructNodes]
      }
    }
  }
}