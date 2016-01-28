import classnames from 'classnames'
import { niceAttrs } from './constants'

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

export default function elementProps({ name, tag, originalName, key, index, isView }, view, Flint, props) {
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
  if (isView || typeof component != 'function') {
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
    // also add component to class if its whitelisted
    if (typeof name == 'string' && name != originalName) {
      props.className = addClassName(props, name)
    }
  }

  return props
}

