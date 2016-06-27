import React from 'react'
import niceStyles from 'motion-nice-styles'
import { StyleSheet, css } from 'aphrodite'

let opts = {
  theme: true,
}

function Style(ComposedComponent) {
  return class StyledComponent extends ComposedComponent {
    static displayName = ComposedComponent.displayName || ComposedComponent.name

    constructor() {
      super(...arguments)

      if (this.style) {
        let styles = Object.assign({}, this.style)

        // merge theme onto style
        // like so, given this.props.theme === 'dark' and this.style:
        //   { dark: { button: { color: 'black' } } }
        // then flatten it to:
        //   { dark-button: { color: 'black' } }
        // why? because StyleSheet.create takes a flat object,
        // and `-` not allowed in jsx tags/props so safe to use

        const themeKey = this.props.theme

        if (opts.theme && themeKey) {
          const themeStyles = styles[themeKey]

          if (typeof themeStyles === 'object') {
            styles = {
              ...styles,
              ...Object.keys(themeStyles)
                  .reduce((res, key) => ({ ...res, [`${themeKey}-${key}`]: themeStyles[key] }), {})
            }
          }
          else {
            console.log(`Note: you have a matching key for your theme prop ${themeKey}, but it isn't an object`)
          }
        }

        // nice style them
        for (const style in styles) {
          if (style) niceStyles(styles[style])
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

      const styleKeys = [name, ...tagged]

      // styles
      let styles = styleKeys
        .map(i => this.stylesheet[i])
        .reduce((acc, cur) => acc.concat(cur || []), [])

      // theme styles
      if (opts.theme && this.props.theme) {
        styles = [...styles, ...styleKeys.map(k => this.stylesheet[`${this.props.theme}-${k}`])]
      }

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
}

Style.configure = _opts => {
  opts = _opts
}

export default Style
