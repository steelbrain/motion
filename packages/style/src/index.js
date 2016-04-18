import React from 'react'
import niceStyles from 'motion-nice-styles'
import { StyleSheet, css } from 'motion-aphrodite'

export default function Style(ComposedComponent) {
  class StyledComponent extends ComposedComponent {
    constructor() {
      super(...arguments)

      if (this.style) {
        const styles = Object.assign({}, this.style)

        for (let style in styles)
          niceStyles(styles[style])

        this.stylesheet = StyleSheet.create(styles)
      }
    }

    render() {
      return this.stylesheet ?
        this.styleAll.call(this, super.render()) :
        super.render()
    }

    styleAll(children) {
      if (!children || !Array.isArray(children) && !children.props)
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
      if (!child || !React.isValidElement(child))
        return child

      let cloneProps = {}

      if (this.style) {
        // <View /> or <tag /> styles
        const name = child.type && (child.type.name || child.type)
        // <name $tag /> styles
        const tagged = Object.keys(child.props)
          .filter(key => key[0] == '$') // only $props
          .map(key => key.slice(1)) // remove $

        const styles =  [name, ...tagged]
          .map(i => this.stylesheet[i])
          .reduce((acc, cur) => acc.concat(cur || []), [])

        cloneProps.className = css(...styles)
      }

      if (child.props && child.props.children)
        cloneProps.children = this.styleAll(child.props.children)

      return React.cloneElement(child, cloneProps)
    }
  }

  return StyledComponent
}
