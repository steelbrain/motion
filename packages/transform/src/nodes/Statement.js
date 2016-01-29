import state from '../state'
import { t, options, getSelector, viewMainSelector, viewSelector, getRootTagName, shouldStyleAsRoot } from '../lib/helpers'

import niceStyles from 'flint-nice-styles'
import StyleSheet from '../stilr'

export default {
  exit(node) {
    if (node._flintViewParsed) return // avoid parsing twice

    if (state.inView && node.expression && node.expression.callee && node.expression.callee.name == 'Flint.view') {
      node._flintViewParsed = true

      // check if child tag is direct root
      const shouldStyleTagnameAsRoot = shouldStyleAsRoot()
      const viewName = state.inView
      const styles = state.viewStyles[viewName]

      if (!styles) return

      let rawStyles = {}

      // turns styles babel tree into js again
      Object.keys(styles).forEach(tag => {
        const styleProps = styles[tag]
        const viewstyle = styleProps.reduce((acc, cur) => {
          acc[cur.key.name] = t.isArrayExpression(cur.value)
            ? cur.value.elements.map(e => e.value)
            : cur.value.value
          return acc
        }, {})

        niceStyles(viewstyle)
        rawStyles[tag] = viewstyle
      })

      function getSelector(viewName, tag) {
        let cleanViewName = viewName.replace('.', '-')
        tag = tag.replace(/^\$/, '')

        // styling root tag
        if (shouldStyleTagnameAsRoot && tag == state.inView.toLowerCase() || tag == '')
          return viewMainSelector(cleanViewName, options)

        // styling child view
        if (tag[0] == tag[0].toUpperCase())
          return viewMainSelector(`${cleanViewName} .View${tag}`, options)

        // styling tag in view
        return viewSelector(cleanViewName, tag, options)
      }

      const stylesheet = StyleSheet.create(rawStyles, {
        selector: tag => getSelector(viewName, tag)
      })

      const classNamesObject = t.objectExpression(
        Object.keys(stylesheet).reduce((acc, key) => {
          acc.push(t.property(null, t.literal(key), t.literal(stylesheet[key])))
          return acc
        }, [])
      )

      if (options.writeStyle)
        options.writeStyle(viewName, StyleSheet.render())

      StyleSheet.clear()

      // inline the static styles as js object for use when needing to override dynamics
      const stylesObject = t.objectExpression(
        Object.keys(styles).reduce((acc, key) => {
          acc.push(t.property(null, t.literal(key), t.objectExpression(styles[key])))
          return acc
        }, [])
      )

      // Flint.staticStyles('ViewName', {}, ``)
      const staticStyleExpr = t.expressionStatement(
        t.callExpression(t.identifier('Flint.staticStyles'), [
          t.literal(viewName),
          classNamesObject,
          stylesObject
        ])
      )

      // Flint.viewRoots["Name"] = "RootElementName"
      if (shouldStyleAsRoot()) {
        const viewRootNodeExpr = t.expressionStatement(
          t.assignmentExpression('=', t.identifier(`Flint.viewRoots["${viewName}"]`), t.literal(getRootTagName()))
        )
        return [ staticStyleExpr, viewRootNodeExpr, node ]
      }

      // reset
      state.inView = false
      state.viewStyles[viewName] = {}

      return [ staticStyleExpr, node ]
    }
  }
}