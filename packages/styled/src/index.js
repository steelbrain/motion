import React from 'react'
import niceStyles from 'motion-nice-styles'

const mergeStyles = (obj, ...styles)  => {
  return styles.reduce((acc, style) => {
    if (style && style.constructor === Array)
     for (var i = 0; i < style.length; i++)
       acc = mergeStyles(acc, style[i])
    else if (typeof style === 'object' && style !== null) {
      if (!acc) acc = {}
      Object.assign(acc, style)
    }

    return acc
  }, obj)
}

export default function Styled(ComposedComponent) {
  return class extends ComposedComponent {
    constructor() {
      super(...arguments)
    }

    render() {
      return this.styleAll.call(this, super.render())
    }

    styleAll(children) {
      if (!Array.isArray(children) && !children.props)
        return children

      const count = React.Children.count(children)
      const styler = this.styleOne.bind(this)

      if (Array.isArray(children))
        return children.map(styler)
      if (count > 1)
        return React.Children.map(children, styler)
      else
        return styler(children)
    }

    styleOne(child) {
      if (!child) return child

      let cloneProps = {}

      if (React.isValidElement(child)) {
        // <name style={} /> styles
        const style$ = child.props.style || []

        // <View /> or <tag /> styles
        const name = child.type && (child.type.name || child.type)
        const name$ = this.style[name] || []

        // <name $tag /> styles
        const styleKeys = Object.keys(child.props)
          .filter(key => key[0] == '$') // only $props
          .map(key => key.slice(1)) // remove $

        const tagged$ = styleKeys.length ?
          styleKeys.map(key => this.style[key]) :
          []

        // set style prop
        cloneProps.style = mergeStyles({}, [
          name$,
          ...tagged$,
          style$
        ])

        // helpers for array styles
        niceStyles(cloneProps.style)
      }

      if (child.props && child.props.children)
        cloneProps.children = this.styleAll(child.props.children)

      return React.cloneElement(child, cloneProps)
    }
  }
}
