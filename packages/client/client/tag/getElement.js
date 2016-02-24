import type { Identifier, Element } from './types'
import { whitelist } from './constants'

/*

  Handles a variety of cases from:
      'ViewName'
      'tagname'
      variable

*/


export default function getElement(identifier: Identifier, view, props, Motion): Element {
  let isView = false
  let name, tagName, key, index, component, repeatItem

  // used directly by user
  if (typeof identifier == 'string') {
    name = identifier
  }
  // passing in a variable as the view
  else if (typeof identifier[0] !== 'string') {
    [component, name, key, repeatItem, index] = identifier

    component = Motion.getComponent(component)
  }
  // passing in string ref as view
  else {
    [name, key, repeatItem, index] = identifier
  }

  if (!name)
    return React.createElement('div', null, 'No name given!')

  let whitelisted

  // find element
  if (typeof name != 'string') {
    component = Motion.getComponent(name)
  }
  else {
    let isHTMLElement = name[0].toLowerCase() == name[0]

    if (isHTMLElement) {
      tagName = (
        // yield isnt merged in at this point so we check for it
        view.props && view.props.yield && view.props.tagName
        // otherwise use prop tagname
        || props && props.tagName
      )

      // whitelist
      whitelisted = whitelist.indexOf(name) >= 0
    }
    // find a view
    else if (!component) {
      isView = true
      component = Motion.getView(name)
    }
  }

  return {
    name,
    tagName,
    key,
    index,
    repeatItem,
    component,
    whitelisted,
    isView
  }
}
