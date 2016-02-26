import state from '../state'
import { t, options, getSelector, viewMainSelector, viewSelector, getRootTagName, shouldStyleAsRoot } from '../lib/helpers'

import niceStyles from 'motion-nice-styles'
import StyleSheet from '../stilr'

export default {
  exit(node) {
    // if (node._motionViewParsed) return // avoid parsing twice
    //
    // if (state.inView && node.expression && node.expression.callee && node.expression.callee.name == 'Motion.view') {
    //   node._motionViewParsed = true
    //
    //   // check if child tag is direct root
    //   const shouldStyleTagnameAsRoot = shouldStyleAsRoot()
    //   const viewName = state.inView
    //   const styles = state.viewStyles[viewName]
    //
    //   if (!styles) return
    //
    //   let rawStyles = {}
    //
    //   // turns styles babel tree into js again
    //   Object.keys(styles).forEach(tag => {
    //     const styleProps = styles[tag]
    //     const viewstyle = styleProps.reduce((acc, cur) => {
    //       // TODO this is way specific to what we extract
    //       // there should be a way to turn AST back into code here without rewriting babel itself
    //       acc[cur.key.name] = t.isArrayExpression(cur.value)
    //         ? cur.value.elements.map(e => e.value)
    //         : t.isUnaryExpression(cur.value)
    //           ? (cur.value.operator === '-' ? -1 : 1) * cur.value.argument.value
    //           : cur.value.value
    //       return acc
    //     }, {})
    //
    //     niceStyles(viewstyle)
    //     rawStyles[tag] = viewstyle
    //   })
    //
    //   function getSelector(viewName, tag) {
    //     let cleanViewName = viewName.replace('.', '-')
    //     tag = tag.replace(/^\$/, '')
    //
    //     // styling root tag
    //     if (shouldStyleTagnameAsRoot && tag == state.inView.toLowerCase() || tag == '')
    //       return viewMainSelector(cleanViewName, options)
    //
    //     // styling child view
    //     if (tag[0] == tag[0].toUpperCase())
    //       return viewMainSelector(`${cleanViewName} .View${tag}`, options)
    //
    //     // styling tag in view
    //     return viewSelector(cleanViewName, tag, options)
    //   }
    //
    //   const stylesheet = StyleSheet.create(rawStyles, {
    //     selector: tag => getSelector(viewName, tag)
    //   })
    //
    //   const classNamesObject = t.objectExpression(
    //     Object.keys(stylesheet).reduce((acc, key) => {
    //       acc.push(t.property(null, t.literal(key), t.literal(stylesheet[key])))
    //       return acc
    //     }, [])
    //   )
    //
    //   if (options.writeStyle)
    //     options.writeStyle(viewName, StyleSheet.render())
    //
    //   StyleSheet.clear()
    //
    //   // inline the static styles as js object for use when needing to override dynamics
    //   const stylesObject = t.objectExpression(
    //     Object.keys(styles).reduce((acc, key) => {
    //       acc.push(t.property(null, t.literal(key), t.objectExpression(styles[key])))
    //       return acc
    //     }, [])
    //   )
    //
    //   // Motion.staticStyles('ViewName', {}, ``)
    //   const staticStyleExpr = t.expressionStatement(
    //     t.callExpression(t.identifier('Motion.staticStyles'), [
    //       t.literal(viewName),
    //       classNamesObject,
    //       stylesObject
    //     ])
    //   )
    //
    //   // Motion.viewRoots["Name"] = "RootElementName"
    //   if (shouldStyleAsRoot()) {
    //     const viewRootNodeExpr = t.expressionStatement(
    //       t.assignmentExpression('=', t.identifier(`Motion.viewRoots["${viewName}"]`), t.literal(getRootTagName()))
    //     )
    //     return [ staticStyleExpr, viewRootNodeExpr, node ]
    //   }
    //
    //   // reset
    //   state.inView = false
    //   state.viewStyles[viewName] = {}
    //
    //   return [ staticStyleExpr, node ]
    // }
  }
}