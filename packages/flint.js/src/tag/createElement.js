import React from 'react'
import classnames from 'classnames'

import eventShorthands from './eventShorthands'
import elementStyles from './styles'
import tags from './tags'

const add = (a, b) => a + b
const contains = (i, ls) => ls.indexOf(i) != -1
const upper = s => s.toUpperCase()
const capital = s => upper(s.substr(0, 1)) + s.slice(1)
const mapObj = (fn, o) => {
  let newO = {}
  let pairs = Object.keys(o).map((k) => fn(k, o[k]))
  pairs.map(pair => newO[pair[0]] = pair[1])
  return newO
}

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

export default function createElement(viewName) {
  return function el(identifier, props, ...args) {
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

    if (props) {
      props = niceProps(props)
    }

    props = props || {}
    const view = this

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
        tag = view.Flint.getView(name, viewName)
      }
    }

    if (props && props.className)
      props.className = classnames(props.className)

    // TRANSFORMATIONS:
    elementStyles([key, index], view, name, originalTag || tag, props)

    if (!props.key && !props.nokey) {
      props.key = name + key
      if (index) props.key += index
    }

    // map shorthand events to onEvent
    props = mapObj((k, v) => {
      let key = contains(k, eventShorthands) ? ('on' + capital(k)) : k
      return [key, v]
    }, props)

    // onEnter
    if (props.onEnter) {
      let originalKeyDown = props.onKeyDown

      props.onKeyDown = function(e) {
        if (e.keyCode === 13)
          props.onEnter(e.target.value)

        if (originalKeyDown)
          originalKeyDown(e)
      }
    }

    if (props.yield)
      props = Object.assign(props, view.props, { style: props.style });

    props.__key = key
    props.__tagName = name

    // whitelist tags
    if (typeof tag == 'string' && !tags[tag])
      tag = 'div'

    return React.createElement(tag, props, ...args)
  }
}