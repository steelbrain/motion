import React from 'react'
import classnames from 'classnames'
import elementStyles from './styles'
import tags from './tags'

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

function getProps(props, viewProps, name, key, index) {
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
    props = Object.assign(props, viewProps, { style: props.style });

  props.__key = key
  props.__tagName = name

  return props
}

export default function createElement(viewName) {
  return function el(identifier, props, ...args) {
    const view = this
    const { fullname, name, key, index, tag, originalTag } = getElement(identifier, viewName, view.Flint.getView)
    props = getProps(props, view.props, name, key, index)
    props.style = elementStyles([key, index], view, name, originalTag || tag, props)
    return React.createElement(tag, props, ...args)
  }
}