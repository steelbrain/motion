import React from 'react'
import { css } from 'aphrodite/no-important'
import { omit } from 'lodash'
import { filterStyleKeys, filterParentStyleKeys } from './helpers'

const objToFlatArray = obj => Object.keys(obj).reduce((acc, cur) => [...acc, ...obj[cur]], [])
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

    // <... $one $two /> keys
    const propKeys = props ? Object.keys(props) : []
    const styleKeys = filterStyleKeys(propKeys)

    // remove $
    const activeKeys = styleKeys
      .filter(key => props[key] !== false && typeof props[key] !== 'undefined')
      .map(key => key.slice(1))

    // tag + $props
    // don't style <Components />!
    const isTag = typeof type === 'string'
    const allKeys = isTag ? [type, ...activeKeys] : activeKeys

    // collect styles, in order
    // { propKey: [styles] }
    const finalStyles = allKeys.reduce((acc, cur) => {
      acc[cur] = []
      return acc
    }, { parents: [] })

    //
    // 1. parent styles
    //
    const parentStyleKeys = filterParentStyleKeys(propKeys)

    if (parentStyles && parentStyleKeys.length) {
      const parentStyleNames = parentStyleKeys.map(k => k.replace('$$', ''))

      // dynamic
      if (parentStyles.dynamics) {
        const dynamics = getDynamicSheets(getDynamicStyles(parentStyleNames, props, parentStyles.dynamics, '$$'))
        for (const sheet of dynamics) {
          finalStyles.parents.push(sheet)
        }
      }

      // static
      if (parentStyles.statics) {
        for (const key of parentStyleNames) {
          finalStyles.parents.push(parentStyles.statics[key])
        }
      }
    }

    //
    // 2. own styles
    //
    // static
    if (hasOwnStyles) {
      if (styles.statics) {
        for (const key of allKeys) {
          finalStyles[key].push(styles.statics[key])
        }
      }

      // dynamic
      if (styles.dynamics && activeKeys.length) {
        const dynamics = getDynamicSheets(getDynamicStyles(activeKeys, props, styles.dynamics))
        for (const sheet of dynamics) {
          finalStyles[sheet.key].push(sheet)
        }
      }
    }

    //
    // 3. theme styles
    //
    if (shouldTheme) {
      // direct
      const themes = this.constructor.theme
      const themeProps = themes && Object.keys(themes)

      if (themes && themeProps.length) {
        for (const prop of themeProps) {
          // static theme
          if (this.props[prop] === true) {
            for (const key of allKeys) {
              finalStyles[key].push(styles.statics[`${prop}-${key}`])
            }
          } else if (typeof this.props[prop] !== 'undefined' && typeof styles.theme[prop] === 'function') {
            // dynamic themes
            const dynStyles = styles.theme[prop](this.props[prop])
            const dynKeys = Object.keys(dynStyles).filter(tag => allKeys.indexOf(tag) > -1)

            if (dynKeys.length) {
              const activeDynamics = dynKeys.reduce((acc, cur) => ({ ...acc, [cur]: dynStyles[cur] }), {})
              const dynamics = getDynamicSheets(activeDynamics)
              for (const sheet of dynamics) {
                finalStyles[sheet.key].push(sheet)
              }
            }
          }
          // media queries as themes
          // else if (prop[0] === '@') {
          //   for (const key of themeProps[prop]) {
          //   }
          // }
        }
      }
    }

    //
    // finish
    //

    // remove style props
    const newProps = omit(props, [...styleKeys, ...parentStyleKeys])

    // gather styles flat
    const activeStyles = objToFlatArray(finalStyles)

    if (activeStyles.length) {
      // apply styles
      newProps.className = css(...activeStyles)

      // keep original classNames
      if (props && props.className && typeof props.className === 'string') {
        newProps.className += ` ${props.className}`
      }
    }

    return originalCreateElement(type, newProps, ...children)
  }
}
