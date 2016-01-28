import type { Identifier, Element } from './types'

import { whitelist } from './constants'

// tagName comes from prop <el tagName="" />
export default function getElement(identifier: Identifier, view, props, getView): Element {
  let isView = false
  let name, key, index, component, repeatItem

  // used directly by user
  if (typeof identifier == 'string') {
    name = identifier
  }
  // passing in a variable as the view
  else if (typeof identifier[0] !== 'string') {
    [component, name, key, repeatItem, index] = identifier
  }
  // passing in string ref as view
  else {
    [name, key, repeatItem, index] = identifier
  }

  if (!name)
    return React.createElement('div', null, 'No name given!')

  let originalName

  // find element
  if (typeof name != 'string') {
    component = name
  }
  else {
    let isHTMLElement = name[0].toLowerCase() == name[0]

    if (isHTMLElement) {
      const tagName = (
        // yield isnt merged in at this point so we check for it
        view.props && view.props.yield && view.props.tagName
        // otherwise use prop tagname
        || props && props.tagName
      )

      // whitelist (before tagName to allow override)
      if (whitelist.indexOf(name) >= 0) {
        originalName = name
        name = 'div'
      }

      if (tagName) {
        originalName = name
        name = tagName
      }
    }
    // find a view
    else if (!component) {
      isView = true
      component = getView(name)
    }
  }

  return {
    name,
    key,
    index,
    repeatItem,
    component,
    originalName,
    isView
  }
}
