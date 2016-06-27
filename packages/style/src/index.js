import React from 'react'
import niceStyles from 'motion-nice-styles'
import { StyleSheet, css } from 'aphrodite'

export default function Style(ComposedComponent) {
  class StyledComponent extends ComposedComponent {
    static displayName = ComposedComponent.displayName || ComposedComponent.name

    constructor() {
      super(...arguments)

      if (this.style) {
        const styles = Object.assign({}, this.style)

        for (const style in styles) {
          if (!styles.hasOwnProperty(style)) {
            continue
          }
          const value = styles[style]
          if (value) {
            styles[style] = niceStyles(value)
          }
        }

        this.stylesheet = StyleSheet.create(styles)
      }
    }

    render() {
      return this.stylesheet ?
        this.styleAll.call(this, super.render()) :
        super.render()
    }

    styleAll(children) {
      if (!children || !Array.isArray(children) && !children.props || !this.style) return children

      const styler = this.styleOne.bind(this)
      if (Array.isArray(children)) {
        return children.map(styler)
      }

      const count = React.Children.count(children)
      if (count > 1) {
        return React.Children.map(children, styler)
      }

      return styler(children)
    }

    styleOne(child) {
      if (Array.isArray(child)) return this.styleAll(child)
      if (!child || !React.isValidElement(child)) return child

      // <View /> + <tag /> keys
      const name = child.type && (child.type.name || child.type)

      // <name $tag /> keys
      const tagged = Object.keys(child.props)
        .filter(key => key[0] === '$' && child.props[key] === true) // only $props
        .map(key => key.slice(1)) // remove $

      // styles
      const styles = [name, ...tagged]
        .map(i => this.stylesheet[i])
        .reduce((acc, cur) => acc.concat(cur || []), [])

      const cloneProps = {}

      if (styles.length) {
        cloneProps.className = css(...styles)

        if (child.props && child.props.className) {
          if (typeof child.props.className === 'string') {
            cloneProps.className += ` ${child.props.className}`
          }
        }
      }

      if (child.props && child.props.children) {
        cloneProps.children = this.styleAll(child.props.children)
      }

      return React.cloneElement(child, cloneProps)
    }
  }

  return StyledComponent
}
