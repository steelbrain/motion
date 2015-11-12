import React from 'react'
import classnames from 'classnames'
import elementStyles from './styles'
import tags from './tags'

// tags that shouldn't map out to real names
const divWhitelist = [
  'title',
  'meta',
  'head',
  'circle',
  'col',
  'body'
]

let niceAttrs = {
  class: 'className',
  for: 'htmlFor',
  srcset: 'srcSet',
  novalidate: 'noValidate',
  autoplay: 'autoPlay',
  frameborder: 'frameBorder',
  allowfullscreen: 'allowFullScreen',
  tabindex: 'tabIndex',
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

function getElement(identifier, viewName, getView) {
  let fullname, key, index, tag

  // used directly by user
  if (typeof identifier == 'string') {
    fullname = identifier
  }
  // passing in a variable as the view
  else if (typeof identifier[0] !== 'string') {
    [tag, fullname, key, index] = identifier
  }
  // passing in string ref as view
  else {
    [fullname, key, index] = identifier
  }

  if (!fullname)
    return React.createElement('div', null, 'No name given!')

  let name = fullname
  let originalTag

  // find element
  if (typeof fullname != 'string') {
    tag = fullname
  }
  else {
    let isHTMLElement = fullname[0].toLowerCase() == fullname[0]

    // get tag type and name of tag
    if (isHTMLElement) {
      if (fullname.indexOf('-') > 0) {
        [name, tag] = fullname.split('-')
      }
      else {
        tag = fullname
      }

      if (divWhitelist.indexOf(tag) >= 0) {
        originalTag = tag
        tag = 'div'
      }
    }
    // find a view
    else if (!tag) {
      tag = getView(name, viewName)
    }
  }

  if (process.env.production)
    tag = 'div'

  return { fullname, name, key, index, tag, originalTag }
}

function addClassName(props, name) {
  return props.className ? `${props.className} ${name}` : name
}

function getProps(view, viewName, Flint, props, viewProps, name, tag, originalTag, key, index) {
  if (props)
    props = niceProps(props)

  if (props && props.className)
    props.className = classnames(props.className)

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

  if (props.yield)
    props = Object.assign(props, viewProps, { style: props.style })

  props.__parentStyles = view.styles
  props.__parentName = viewName
  props.__key = key
  props.__tagName = name

  // only for tags
  if (name[0] == name[0].toLowerCase()) {
    props.className = addClassName(props, viewName.replace('.', '-'))
  }

  return props
}

export default function createElement(viewName) {
  return function el(identifier, props, ...args) {
    const view = this
    const Flint = view.Flint
    const { fullname, name, key, index, tag, originalTag } = getElement(identifier, viewName, Flint.getView)
    props = getProps(view, viewName, Flint, props, view.props, name, tag, originalTag, key, index)
    props.style = elementStyles([key, index], view, name, originalTag || tag, props)

    // only for tags
    if (name[0] == name[0].toLowerCase()) {
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

    return React.createElement(tag, props, ...args)
  }
}