import type { Identifier, Element } from './types'
import { blacklist } from './constants'
import ReactCreateElement from '../lib/ReactCreateElement'

/*

  Handles a variety of cases from:
      'ViewName'
      'tagname'
      variable

*/


export default function getElement(Motion, identifier: Identifier, view, props): Element {
  let name, tagName, key, index, component, repeatItem

  // used directly by user
  if (typeof identifier == 'string') {
    name = identifier
  }
  // passing in a variable as the view
  else if (typeof identifier[0] != 'string') {
    [component, name, key, repeatItem, index] = identifier

    component = Motion.getComponent(component)
  }
  // passing in string ref as view
  else {
    [name, key, repeatItem, index] = identifier
  }

  if (!name)
    return ReactCreateElement('div', null, 'No name given!')

  let blacklisted

  // find element
  if (typeof name != 'string') {
    component = Motion.getComponent(name)
  }
  else {
    let isHTMLElement = name[0].toLowerCase() == name[0]

    if (isHTMLElement) {
      tagName = (
        // TODO this is definitely a bug but works in single element case, move this to props.js
        // yield isnt merged in at this point so we check for it
        view && view.props && view.props.yield && view.props.tagName
        // otherwise use prop tagname
        || props && props.tagName
      )

      // blacklist
      blacklisted = blacklist.indexOf(name) >= 0
    }
  }

  return {
    name,
    tagName,
    key,
    index,
    repeatItem,
    component,
    blacklisted,
  }
}
