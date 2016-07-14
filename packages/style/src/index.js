import React from 'react'
import niceStyles from 'motion-nice-styles'
import { StyleSheet, css } from 'aphrodite'

module.exports = (opts = {
  theme: true,
  themeKey: 'theme'
}) => {
  const styleCache = {}

  return ComposedComponent => {
    // gather static styles into stylesheet
    if (ComposedComponent.style && !ComposedComponent.__motionStyleKey) {
      const componentKey = ComposedComponent.__motionStyleKey = `${Math.random()}`
      let styles = { ...ComposedComponent.style }

      // merge theme onto style
      // given this.props.theme == 'dark' and this.style == { dark: { h1: { color: 'red' } } }
      // flatten it to: { dark-button: { color: 'black' } }
      // why? because StyleSheet.create takes a flat object
      // and `-` not allowed in jsx tags/props so safe to use
      if (opts.theme) {
        Object.keys(styles.theme).forEach(themeKey => {
          const themeStyles = styles.theme[themeKey]

          if (typeof themeStyles === 'object') {
            styles = {
              ...styles,
              // flatten themes to `theme-tag: {}`
              ...Object.keys(themeStyles)
                  .reduce((res, key) => ({ ...res, [`${themeKey}-${key}`]: themeStyles[key] }), {})
            }
          } else {
            console.log(`Note: themes must be an object, "${themeKey}" isn't an object`)
          }
        })
      }

      // nice style them
      for (const style in styles) {
        if (!styles.hasOwnProperty(style) || style === opts.themeKey) {
          continue
        }
        const value = styles[style]
        if (value) {
          styles[style] = niceStyles(value)
        }
      }

      styleCache[componentKey] = StyleSheet.create(styles)
    }

    return class StyledComponent extends ComposedComponent {
      static displayName = ComposedComponent.displayName || ComposedComponent.name

      constructor() {
        super(...arguments)
        this.styles = ComposedComponent.__motionStyleKey && styleCache[ComposedComponent.__motionStyleKey]
      }

      render() {
        return this.styles ?
          this.styleAll.call(this, super.render()) :
          super.render()
      }

      styleAll(children) {
        if (!children || !Array.isArray(children) && !children.props || !this.styles) return children

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

        const styleKeys = [name, ...tagged]

        // styles
        let styles = styleKeys
          .map(i => this.styles[i])
          .reduce((acc, cur) => acc.concat(cur || []), [])

        // theme styles
        if (opts.theme && this.props[opts.themeKey]) {
          styles = [...styles, ...styleKeys.map(k => this.styles[`${this.props[opts.themeKey]}-${k}`])]
        }

        // gather properties to be cloned
        const cloneProps = {}

        if (styles.length) {
          // apply styles
          cloneProps.className = css(...styles)

          // keep original classNames
          if (child.props && child.props.className) {
            if (typeof child.props.className === 'string') {
              cloneProps.className += ` ${child.props.className}`
            }
          }
        }

        // recurse to children
        if (child.props && child.props.children) {
          cloneProps.children = this.styleAll(child.props.children)
        }

        return React.cloneElement(child, cloneProps)
      }
    }
  }
}
