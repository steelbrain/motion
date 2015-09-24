import React from 'react';

const getFirstChild = children => {
  let child;
  React.Children.forEach(children, c => {
    if (!child) child = c
  });
  return child;
}

export default class Wrapper {
  render() {
    const children = this.props.children;
    let viewProps;

    if (this.props.style || this.props.onClick)
      viewProps = {};

    if (this.props.onClick)
      viewProps.onClick = this.props.onClick;

    if (this.props.style)
      viewProps.style = this.props.style;

    // Check if a user manually disabled the wrapper with `$ = false`
    if (this.props.__disableWrapper)
      return children;

    // Check if we have our only element === viewname, for not wrapping
    if (React.Children.count(children) == 1) {
      let first = getFirstChild(children)
      let type = first && first.type

      // if tagname === viewname
      if (type && type.toLowerCase && type.toLowerCase() == this.props.view.name.toLowerCase())
        return first
      else
        return wrapped(this.props.view.name, viewProps, children);
    }
    else {
      return wrapped(this.props.view.name, viewProps, children);
    }
  }
}

function wrapped(name, props, children) {
  return (
    <div className={name && name.toLowerCase()} {...props}>
      {children}
    </div>
  )
}
