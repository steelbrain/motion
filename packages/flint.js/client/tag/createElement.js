import React from 'react'
import classnames from 'classnames'
import elementStyles from './styles'
import reportError from '../lib/reportError'
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

const niceAttrs = {
  class: 'className',
  for: 'htmlFor',
  srcset: 'srcSet',
  novalidate: 'noValidate',
  autoplay: 'autoPlay',
  frameborder: 'frameBorder',
  allowfullscreen: 'allowFullScreen',
  tabindex: 'tabIndex',
}

export default function createElement(viewName) {
  // identifier = [id, name]
  return function el(identifier, props, ...args) {
    // TODO remove or make official
    if (props && props.skipFlint)
      return React.createElement(identifier[1], props, ...args)

    const view = this
    const Flint = view.Flint

    const { name, key, index, repeatItem, tag, originalTag, isView } = getElement(identifier, view, props, viewName, Flint.getView)

    props = getProps(view, viewName, Flint, props, view.props, name, tag, originalTag, key, index, isView)

    const styles = elementStyles(key, index, repeatItem, view, name, originalTag || tag, props)
    if (styles) props.style = styles

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

    // TODO option to disable object stringifying
    // convert object to string for debugging in dev mode only
    if (!process.env.production) {
      args = args.map(arg => {
        const type = typeof arg

        if (arg && type != 'string' && !Array.isArray(arg) && !React.isValidElement(arg)) {
          const isObj = String(arg) === '[object Object]'

          if (isObj) {
            // stringify for error
            let str = ''
            try { str = JSON.stringify(arg) } catch(e) {}

            reportError({
              message: `You passed an object to ${viewName} <${name}>. In production this will error! Object: ${str}`,
              fileName: _Flint.views[viewName] && _Flint.views[viewName].file
            })

            return str || '{}'
          }
        }

        return arg
      })
    }

    return React.createElement(tag, props, ...args)
  }
}

// tagName comes directly from <el tagName="" />
function getElement(identifier, view, props, viewName, getView) {
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

      if (divWhitelist.indexOf(tag) >= 0) {
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

function getProps(view, viewName, Flint, props, viewProps, name, tag, originalTag, key, index, isView) {
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
      viewProps,
      // take parent style
      props.style && { style: props.style },
      // merge parent classname
      props.className && { className: classnames(props.className, viewProps.className) }
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
      props.__flintOnChange(e)
    }

    if (props.__flintValue)
      props.value = props.__flintValue
  }

  // if not external component
  if (isView || typeof tag != 'function') {
    props.__flint = {
      parentStyles: view.styles,
      parentName: viewName,
      key,
      index,
      tagName: name
    }

    // only for tags
    if (name[0] == name[0].toLowerCase()) {
      props.className = addClassName(props, viewName.replace('.', '-'))
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