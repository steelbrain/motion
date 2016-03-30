import type { Identifier, Element } from './types'

import ReactCreateElement from '../lib/ReactCreateElement'
import getElement from './getElement'
import elementStyles from './styles'
import elementProps from './props'
import stringifyObjects from './stringifyObjects'

/*

  Shim around ReactCreateElement, that adds in our:

     - tag helpers (sync, yield, repeat, if, ...)
     - styling (radium, css classes, ...)
     - object to string

*/

const DIV = 'div'

export default function createElement(identifier : Identifier, _props, ...args) {
  // if imported view from external
  const isComponent = typeof identifier[0] == 'function'

  if (isComponent && !identifier[0].__motioninfo__) {
    return ReactCreateElement(identifier[0], _props, ...args)
  }

  // TODO remove or document
  if (_props && _props.__skipMotion)
    return ReactCreateElement(identifier[1], _props, ...args)

  const component = createElement.activeComponent
  const Motion = component && component.Motion || root.exports.Motion

  const el: Element = getElement(Motion, identifier, component, _props)
  const props = elementProps(Motion, el, component, _props)
  props.style = elementStyles(Motion, el, component, props)

  // TODO option to disable object stringifying
  if (!process.env.production)
    args = stringifyObjects(el, args, component)

  const tag = props.tagName || (el.blacklisted ? DIV : el.component || el.name)

  return ReactCreateElement(tag, props, ...args)
}