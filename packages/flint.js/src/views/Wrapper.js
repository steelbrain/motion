import React from 'react'

const getFirstChild = children => {
  let child;
  React.Children.forEach(children, c => {
    if (!child) child = c
  });
  return child;
}

class Wrapper extends React.Component {
  render() {
    return this.props.children

    const { children, style, onClick, __disableWrapper, view, path } = this.props;

    let viewProps = { view }

    if (onClick)
      viewProps.onClick = onClick

    if (style)
      viewProps.style = style

    // Check if a user manually disabled the wrapper with `$ = false`
    if (__disableWrapper)
      return children

    // Check if we have our only element === viewname, for not wrapping
    if (React.Children.count(children) == 1) {
      let first = getFirstChild(children)
      let type = first && first.type

      // if tagname === viewname
      if (type && type.toLowerCase && type.toLowerCase() == view.name.toLowerCase())
        return React.cloneElement(first, { 'data-flintid': path })
      else
        return wrapped(view.name, viewProps, children, path)
    }
    else {
      return wrapped(view.name, viewProps, children, path)
    }
  }
}

function wrapped(name, props, children, path) {
  return React.createElement(
    'div', // why not name? because view Circle needs to be whitelisted (svg element)
    Object.assign(props, {
      'data-flintid': path,
      className: name && name.toLowerCase()
    }),
    children
  )
}

export default Wrapper