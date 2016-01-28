import type { Identifier, Element } from './types'

import React from 'react'
import getElement from './getElement'
import elementStyles from './styles'
import elementProps from './props'
import stringifyObjects from './stringifyObjects'

export default function createElement(identifier : Identifier, _props, ...args) {
  // TODO remove or document
  if (_props && _props.__skipFlint) return React.createElement(identifier[1], _props, ...args)

  const view = this
  const Flint = view.Flint

  const el: Element = getElement(identifier, view, _props, Flint.getView)
  console.log(el)
  const props = elementProps(el, view, Flint, _props)
  const styles = elementStyles(el, view, props)

  if (styles)
    props.style = styles

  // TODO option to disable object stringifying
  if (!process.env.production)
    args = stringifyObjects(el, args, view)

  return React.createElement(el.component || el.name, props, ...args)
}