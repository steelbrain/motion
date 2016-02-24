import type { Identifier, Element } from './types'

import React from 'react'
import getElement from './getElement'
import elementStyles from './styles'
import elementProps from './props'
import stringifyObjects from './stringifyObjects'

/*

  Shim around React.createElement, that adds in our:

     - tag helpers (sync, yield, repeat, if, ...)
     - styling (radium, css classes, ...)
     - object to string

*/

const DIV = 'div'

export default function createElement(identifier : Identifier, _props, ...args) {
  // TODO remove or document
  if (_props && _props.__skipMotion)
    return React.createElement(identifier[1], _props, ...args)

  const view = this
  const Motion = view.Motion

  const el: Element = getElement(identifier, view, _props, Motion)
  const props = elementProps(el, view, Motion, _props)
  props.style = elementStyles(el, view, props)

  // TODO option to disable object stringifying
  if (!process.env.production)
    args = stringifyObjects(el, args, view)

  const tag = props.tagName || (el.whitelisted ? DIV : el.component || el.name)

  return React.createElement(tag, props, ...args)
}