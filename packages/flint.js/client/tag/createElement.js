import React from 'react'
import classnames from 'classnames'
import elementStyles from './styles'
import reportError from '../lib/reportError'
import tags from './tags'
import stringifyObjects from './stringifyObjects'
import { whitelist, niceAttrs } from './constants'

type Element = {
  name: string;
  key: number;
  index: number;
  repeatItem: any;
  tag: string | Function;
  originalTag: string;
  isView: boolean;
}

export default function createElement() {
  return function elementCreator(identifier, _props, ...args) {
    // TODO remove or document
    if (_props && _props.__skipFlint) return React.createElement(identifier[1], _props, ...args)

    const view = this
    const Flint = view.Flint

    const el: Element = getElement(identifier, view, _props, Flint.getView)
    const props = getProps(el, view, Flint, _props)
    const styles = elementStyles(el, view, props) // key, index, repeatItem, view, name, originalTag || tag, props

    if (styles)
      props.style = styles

    // TODO option to disable object stringifying
    if (!process.env.production)
      args = stringifyObjects(el, args, view)

    return React.createElement(el.tag, props, ...args)
  }
}

// tagName comes directly from <el tagName="" />
function getElement(identifier, view, props, getView) {
  let name, key, index, tag, isView, repeatItem

  // used directly by user
  if (typeof identifier == 'string') {
    name = identifier
  }
  // passing in a variable as the view
  else if (typeof identifier[0] !== 'string') {
    [tag, name, key, repeatItem, index] = identifier
  }
  // passing in string ref as view
  else {
    [name, key, repeatItem, index] = identifier
  }

  if (!name)
    return React.createElement('div', null, 'No name given!')

  let originalTag

  // find element
  if (typeof name != 'string') {
    tag = name
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

      if (tagName) {
        originalTag = tag
        tag = tagName
      }
      else {
        tag = name
      }

      if (whitelist.indexOf(tag) >= 0) {
        originalTag = tag
        tag = 'div'
      }
    }
    // find a view
    else if (!tag) {
      isView = true
      tag = getView(name)
    }
  }

  return { name, key, index, repeatItem, tag, originalTag, isView }
}

function getProps({ name, tag, originalTag, key, index, isView }, view, Flint, props) {
  if (props) {
    props = niceProps(props)
  }

  if (props && props.className) {
    props.className = classnames(props.className)
  }

  props = props || {}

  if (!props.key && !props.nokey) {
    props.key = name + key
    if (index) props.key += index
  }

  if (props.onEnter) {
    let originalKeyDown = props.onKeyDown

    props.onKeyDown = function(e) {
      if (e.keyCode === 13) props.onEnter(e.target.value)
      originalKeyDown && originalKeyDown(e)
    }
  }

  if (props.yield) {
    props = Object.assign(
      props,
      view.props,
      // take parent style
      props.style && { style: props.style },
      // merge parent classname
      props.className && { className: classnames(props.className, view.props.className) }
    )
  }

  if (props.onClick) {
    const originalOnClick = props.onClick

    props.onClick = function(...args) {
      if (_Flint.isInspecting) return false
      return originalOnClick.call(this, ...args)
    }
  }

  // sync
  if (props.__flintOnChange) {
    let userOnChange = props.onChange

    props.onChange = function(e) {
      if (userOnChange) userOnChange.call(this, e)

      // TODO: handle checkbox/radio/select differently
      props.__flintOnChange(e)
    }

    if (props.__flintValue) {
      props.value = props.__flintValue
    }
  }

  // if not external component
  if (isView || typeof tag != 'function') {
    props.__flint = {
      parentStyles: view.styles,
      parentStylesStatic: Flint.styleObjects[view.name],
      parentName: view.name,
      key,
      index,
      tagName: name
    }

    // only for tags
    if (name[0] == name[0].toLowerCase()) {
      props.className = addClassName(props, view.name.replace('.', '-'))
    }
  }

  // lowercase tags
  if (name[0] == name[0].toLowerCase()) {
    // TODO remove
    // this switches the name onto the classname, when you
    // do tags like <name-h2>, so styles still attach
    if (typeof tag == 'string' && tag !== name) {
      props.className = addClassName(props, name)
    }

    // also add tag to class if its whitelisted
    if (typeof tag == 'string' && tag != originalTag) {
      props.className = addClassName(props, tag)
    }
  }

  return props
}



// helpers TODO move

function addClassName(props, name) {
  return props.className ? `${props.className} ${name}` : name
}

function niceProps(props) {
  Object.keys(props).forEach(key => {
    if (niceAttrs[key]) {
      props[niceAttrs[key]] = props[key]
      delete props[key]
    }
  })
  return props
}