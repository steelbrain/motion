import React from 'react'
import { StyleSheet, css } from 'aphrodite/no-important'
import { omit, pickBy } from 'lodash'
import { applyNiceStyles, flattenThemes, isFunc, filterStyleKeys, filterParentStyleKeys } from './helpers'
import { STYLE_KEY } from './constants'

const defaultOpts = {
  themes: true
}

module.exports = function motionStyle(opts = defaultOpts) {
  // helpers
  const getDynamicStyles = (active: Array, props: Object, styles: Object, propPrefix = '$') => {
    const dynamicKeys = active.filter(k => styles[k] && typeof styles[k] === 'function')
    const dynamicsReduce = (acc, k) => ({ ...acc, [k]: styles[k](props[`${propPrefix}${k}`]) })
    const dynamics = dynamicKeys.reduce(dynamicsReduce, {})
    return dynamics
  }

  const getDynamicSheets = dynamics => {
    const sheet = StyleSheet.create(applyNiceStyles(dynamics))
    return Object.keys(dynamics).map(k => sheet[k])
  }

  const processStyles = (userStyles, theme) => {
    const styles = { ...userStyles, ...flattenThemes(theme) }
    const dynamics = pickBy(styles, isFunc)
    const statics = pickBy(styles, x => !isFunc(x))

    return {
      statics: StyleSheet.create(applyNiceStyles(statics)),
      dynamics,
      theme
    }
  }

  // decorator
  const decorator = (Child, parentStyles) => {
    if (!Child.style && !parentStyles) return Child

    const styles = processStyles(Child.style, opts.themes ? Child.theme : null)
    const hasOwnStyles = !!(Child.style || Child.theme)

    // add to Child.prototype, so the decorated class can access:
    // this.fancyElement

    Child.prototype.fancyElement = function(type, props, children) {
      // only style tags from within current view
      if (!props || props[STYLE_KEY] !== this[STYLE_KEY]) {
        return React.createElement(type, props, children)
      }

      // <name $one $two /> keys
      const propKeys = Object.keys(props)
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
      if (hasOwnStyles && opts.themes) {
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
      const newProps = omit(props, [...styleKeys, ...parentStyleKeys, STYLE_KEY])

      if (finalStyles.length) {
        // apply styles
        newProps.className = css(...finalStyles)

        // keep original classNames
        if (props && props.className && typeof props.className === 'string') {
          newProps.className += ` ${props.className}`
        }
      }

      return React.createElement(type, newProps, children)
    }

    return Child
  }

  decorator.parent = styles => {
    const parentStyles = processStyles(styles)
    return Child => decorator(Child, parentStyles)
  }

  return decorator
}
