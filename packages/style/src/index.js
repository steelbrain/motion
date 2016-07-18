import React from 'react'
import niceStyles from 'motion-nice-styles'
import { StyleSheet, css } from 'aphrodite'

const filterObject = (obj, cond) => Object.keys(obj)
  .filter(cond)
  .reduce((acc, cur) => ({ ...acc, [cur]: obj[cur] }))

// flatten theme key
// { theme: { dark: { h1: { color: 'red' } } } }
// => { dark-button: { h1: { color: 'red' } } }
const flattenThemes = styles => {
  if (!styles.theme) return styles
  let result = styles

  Object.keys(styles.theme).forEach(themeKey => {
    const themeStyles = styles.theme[themeKey]

    if (typeof themeStyles === 'object') {
      result = {
        ...result,
        // flatten themes to `theme-tag: {}`
        ...Object.keys(themeStyles)
            .reduce((res, key) => ({ ...res, [`${themeKey}-${key}`]: themeStyles[key] }), {})
      }
    } else {
      console.log(`Note: themes must be an object, "${themeKey}" isn't an object`)
    }
  })

  return result
}

// TODO: rewrite functionally
const applyNiceStyles = (styles, themeKey) => {
  for (const style in styles) {
    if (!styles.hasOwnProperty(style) || style === themeKey) {
      continue
    }
    const value = styles[style]
    if (value) {
      styles[style] = niceStyles(value)
    }
  }

  return styles
}

module.exports = function motionStyle(opts = {
  theme: true,
  themeKey: 'theme'
}) {
  return Child => {
    let styles = Child.style

    // gather static styles into stylesheet
    if (styles) {
      // filter functions
      styles = filterObject(styles, style => typeof style !== 'function')
      // flatten themes
      if (opts.theme) styles = flattenThemes(styles)
      // nice style them
      styles = applyNiceStyles(styles, opts.themeKey)
      // cache styles
      styles = StyleSheet.create(styles)
    }

    return class StyledComponent extends Child {
      static displayName = Child.displayName || Child.name

      render() {
        return styles ?
          this.styleAll.call(this, super.render()) :
          super.render()
      }

      styleAll(children) {
        if (!children || !Array.isArray(children) && !children.props || !styles) return children

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
        let tagStyles = styleKeys
          .map(i => styles[i])
          .reduce((acc, cur) => acc.concat(cur || []), [])

        if (opts.theme) {
          // theme styles from theme prop
          if (this.props[opts.themeKey]) {
            tagStyles = [...tagStyles, ...styleKeys.map(k => tagStyles[`${this.props[opts.themeKey]}-${k}`])]
          }

          // theme styles from booleans
          if (this.constructor.themeProps) {
            Object.keys(this.constructor.themeProps).forEach(prop => {
              // if active
              if (this.props[prop]) {
                tagStyles = [...tagStyles, ...styleKeys.map(k => tagStyles[`${prop}-${k}`])]
              }
            })
          }
        }

        // gather properties to be cloned
        const cloneProps = {}

        if (tagStyles.length) {
          // apply styles
          cloneProps.className = css(...tagStyles)

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
