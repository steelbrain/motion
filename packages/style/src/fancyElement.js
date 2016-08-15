import React from 'react'
import { css } from 'aphrodite/no-important'
import { omit } from 'lodash'
import { filterStyleKeys, filterParentStyleKeys } from './helpers'

const originalCreateElement = React.createElement

// factory that return the this.fancyElement helper
export default (Child, parentStyles, styles, opts, getDynamicStyles, getDynamicSheets) => {
  const hasOwnStyles = !!(Child.style || Child.theme)
  const shouldTheme = hasOwnStyles && opts.themes

  return function fancyElement(type, props, ...children) {
    // check for no props, no this (functional component), or no style key match
    if (!this) {
      return originalCreateElement(type, props, ...children)
    }

    // <name $one $two /> keys
    const propKeys = props ? Object.keys(props) : []
    const styleKeys = filterStyleKeys(propKeys)

    // remove $
    const activeKeys = styleKeys
      .filter(key => props[key] !== false && typeof props[key] !== 'undefined')
      .map(key => key.slice(1))

    // tag + $props
    // don't style <Components />!
    const isTag = typeof type === 'string'
    const name = type
    const allKeys = isTag ? [name, ...activeKeys] : activeKeys
    let finalKeys = [...allKeys]

    // collect styles
    let finalStyles = []

    //
    // theme styles
    //
    if (shouldTheme) {
      const themeKeys = prop => allKeys.map(k => `${prop}-${k}`)
      const addTheme = (keys, prop) => [...keys, ...themeKeys(prop)]

      // direct
      const themes = this.constructor.theme
      const themeProps = themes && Object.keys(themes)

      if (themes && themeProps.length) {
        themeProps.forEach(prop => {
          if (this.props[prop] === true) {
            // static theme
            finalKeys = addTheme(finalKeys, prop)
          } else if (
            typeof this.props[prop] !== 'undefined' &&
            typeof styles.theme[prop] === 'function'
          ) {
            // dynamic themes
            const dynStyles = styles.theme[prop](this.props[prop])
            const dynKeys = Object.keys(dynStyles).filter(tag => allKeys.indexOf(tag) > -1)

            if (dynKeys.length) {
              const activeStyles = dynKeys.reduce((acc, cur) => ({ ...acc, [cur]: dynStyles[cur] }), {})
              finalStyles = [...finalStyles, ...getDynamicSheets(activeStyles)]
            }
          }
        })
      }
    }

    //
    // parent styles
    //
    let parentStyleKeys = []
    if (parentStyles) {
      parentStyleKeys = filterParentStyleKeys(propKeys)

      if (parentStyleKeys.length) {
        const keys = parentStyleKeys.map(k => k.replace('$$', ''))

        // dynamic
        if (parentStyles.dynamics) {
          finalStyles = [
            ...finalStyles,
            ...getDynamicSheets(getDynamicStyles(keys, props, parentStyles.dynamics, '$$'))
          ]
        }

        // static
        if (parentStyles.statics) {
          finalStyles = [
            ...finalStyles,
            ...keys.map(k => parentStyles.statics[k])
          ]
        }
      }
    }

    //
    // own styles
    //
    // static
    if (hasOwnStyles) {
      if (styles.statics) {
        finalStyles = [...finalStyles, ...finalKeys.map(i => styles.statics[i])]
      }

      // dynamic
      if (styles.dynamics && activeKeys.length) {
        finalStyles = [
          ...finalStyles,
          ...getDynamicSheets(getDynamicStyles(activeKeys, props, styles.dynamics))
        ]
      }
    }

    //
    // finish
    //
    // recreate child (without style props)
    const newProps = omit(props, [...styleKeys, ...parentStyleKeys])

    if (finalStyles.length) {
      // apply styles
      newProps.className = css(...finalStyles)

      // keep original classNames
      if (props && props.className && typeof props.className === 'string') {
        newProps.className += ` ${props.className}`
      }
    }

    return originalCreateElement(type, newProps, ...children)
  }
}
