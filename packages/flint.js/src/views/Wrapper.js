import React from 'react'

const getFirstChild = children => {
  let child;
  React.Children.forEach(children, c => {
    if (!child) child = c
  });
  return child;
}

const Wrapper = ({ children, style, onClick, __disableWrapper, view }) => {
  let viewProps;

  if (style || onClick)
    viewProps = {};

  if (onClick)
    viewProps.onClick = onClick;

  if (style)
    viewProps.style = style;

  // Check if a user manually disabled the wrapper with `$ = false`
  if (__disableWrapper)
    return children;

  // Check if we have our only element === viewname, for not wrapping
  if (React.Children.count(children) == 1) {
    let first = getFirstChild(children)
    let type = first && first.type

    // if tagname === viewname
    if (type && type.toLowerCase && type.toLowerCase() == view.name.toLowerCase())
      return first
    else
      return wrapped(view.name, viewProps, children);
  }
  else {
    return wrapped(view.name, viewProps, children);
  }
}

function wrapped(name, props, children) {
  return (
    <div className={name && name.toLowerCase()} {...props}>
      {children}
    </div>
  )
}

export default Wrapper