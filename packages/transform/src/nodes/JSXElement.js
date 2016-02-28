import state from '../state'
import { t, options, idFn, isUpperCase, nodeToNameString, normalizeLocation, getVar } from '../lib/helpers'

export default {
  enter(node, parent, scope, file) {
    const el = node.openingElement

    // avoid reprocessing
    if (node.motionJSXVisits != 2) {
      // add index keys for repeat elements
      if (node.motionJSXVisits == 1) {
        if (scope.hasBinding('_index')) {
          el.name.elements.push(t.identifier('_'))
          el.name.elements.push(t.identifier('_index'))
        }

        node.motionJSXVisits = 2
        return
      }

      // top level JSX element
      if (scope.hasOwnBinding('view')) {
        state.viewRootNodes.push(node)
      }

      node.motionJSXVisits = 1
      const name = nodeToNameString(el.name)

      // ['quotedname', key]
      let key

      if (state.keyBase[name])
        key = ++state.keyBase[name]
      else
        key = state.keyBase[name] = 1

      let arr = [t.literal(name), t.literal(key)]

      // track meta
      if (state.file.views[state.currentView]) {
        state.file.views[state.currentView].els[name] = {
          location: normalizeLocation(el.loc), key
        }
      }

      /*
        checks whether user is referencing variable or view
        check root to see if the variable exists
          Modal.Footer would have a root of Modal
      */
      // safer, checks for file scope or view scope only
      let [rootName, ...children] = name.split('.')
      let isVariable = (scope.hasOwnBinding(rootName) || file.scope.hasOwnBinding(rootName)) && isUpperCase(rootName)

      // either gives <Modal> or <Modal.Header>
      const getVar = (rootName, name) =>
        rootName == name ?
          t.identifier(name) :
          t.memberExpression(t.identifier(rootName), t.identifier(children.join('.')))

      if (isVariable)
        arr = [getVar(rootName, name)].concat(arr)

      el.name = t.arrayExpression(arr)

      // process attributes
      if (!el.attributes) return

      let rpt = idFn
      let iff = idFn
      let route = idFn

      for (let attr of el.attributes) {
        const attrName = attr.name && attr.name.name
        const expr = attr.value && (attr.value.expression || t.literal(attr.value.value))

        if (attrName == 'class' && isUpperCase(name))
          state.viewHasChildWithClass = true

        if (options.routing && attrName == 'route') {
          route = _node => t.logicalExpression('&&',
            t.callExpression(t.identifier('Motion.routeMatch'), [expr]),
            _node
          )

          // spread routeprops onto route
          el.attributes.push(t.JSXSpreadAttribute(
            t.callExpression(t.identifier('Motion.routeParams'), [expr])
          ))
        }

        if (attrName == 'if') {
          iff = _node => t.logicalExpression('&&', t.callExpression(t.identifier('Motion.iff'), [expr]), _node)
        }

        if (attrName == 'repeat') {
          rpt = _node => {
            // remove repeat from inner node
            // const opening = _node.openingElement
            // opening.attributes = opening.attributes.filter(attr => attr.name !== 'repeat')

            return t.callExpression(
              t.memberExpression(t.callExpression(t.identifier('Motion.range'), [expr]), t.identifier('map')),
              [t.functionExpression(null, [t.identifier('_'), t.identifier('_index')], t.blockStatement([
                t.returnStatement(_node)
              ]))]
            )
          }
        }
      }

      return iff(route(rpt(node)))
    }
  }
}
