import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import { omit, identity, pickBy } from 'lodash'
import { applyNiceStyles, flattenThemes, isFunc, filterStyleKeys, filterParentStyleKeys } from './helpers'

const styleKey = 'motion$style'

const defaultOpts = {
  themes: true,
  themeKey: 'theme'
}

module.exports = function motionStyle(opts = defaultOpts) {
  // helpers
  const makeNiceStyles = styles => applyNiceStyles(styles, opts.themeKey)

  const getDynamicStyles = (active, props, styles, propPrefix = '$') => {
    const dynamicKeys = active.filter(k => styles[k] && typeof styles[k] === 'function')
    const dynamicsReduce = (acc, k) => ({ ...acc, [k]: styles[k](props[`${propPrefix}${k}`]) })
    const dynamics = dynamicKeys.reduce(dynamicsReduce, {})
    return dynamics
  }

  const getDynamicSheets = dynamics => {
    const sheet = StyleSheet.create(makeNiceStyles(dynamics))
    return Object.keys(dynamics).map(k => sheet[k])
  }

  const processStyles = _styles => {
    const preprocess = opts.theme ? flattenThemes : identity
    const styles = preprocess(Object.assign({}, _styles))
    const dynamics = pickBy(styles, isFunc)
    const statics = pickBy(styles, x => !isFunc(x))

    return {
      statics: StyleSheet.create(makeNiceStyles(statics)),
      dynamics,
      theme: _styles.theme
    }
  }

  // decorator
  const decorator = (Child, parentStyles) => {
    if (!Child.style) return Child

    const styles = processStyles(Child.style)

    return class StyledComponent extends Child {
      static displayName = Child.displayName || Child.name

      __styles = styles

      render() {
        return this.styleAll.call(this, super.render())
      }

      styleAll(children) {
        if (!children || !Array.isArray(children) && !children.props) return children

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

        // only style tags from within current view
        if (child[styleKey] !== this[styleKey]) return child

        // <View /> + <tag /> keys
        const name = child.type && (child.type.name || child.type)

        // <name $one $two /> keys
        const propKeys = Object.keys(child.props)
        const styleKeys = filterStyleKeys(propKeys)

        // remove $
        const activeKeys = styleKeys
          .filter(key => child.props[key] !== false && typeof child.props[key] !== 'undefined')
          .map(key => key.slice(1))

        // tag + $props
        const allKeys = [name, ...activeKeys]
        let finalKeys = [...allKeys]

        // collect styles
        let finalStyles = []

        //
        // theme styles
        //
        if (opts.theme) {
          const themeKeys = prop => allKeys.map(k => `${prop}-${k}`)
          const addTheme = (keys, prop) => [...keys, ...themeKeys(prop)]

          // theme=""
          if (opts.themeKey && this.props[opts.themeKey]) {
            finalKeys = addTheme(finalKeys, this.props[opts.themeKey])
          }

          // direct
          const themeProps = this.constructor.themeProps
          if (themeProps && themeProps.length) {
            themeProps.forEach(prop => {
              if (this.props[prop] === true) {
                // static theme
                finalKeys = addTheme(finalKeys, prop)
              } else if (
                typeof this.props[prop] !== 'undefined' &&
                styles.theme[prop]
              ) {
                // dynamic themes
                const dynStyles = getDynamicStyles([prop], this.props, styles.theme, '')[prop]

                if (dynStyles) {
                  finalStyles = [...finalStyles, ...getDynamicSheets(dynStyles)]
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
                ...getDynamicSheets(getDynamicStyles(keys, child.props, parentStyles.dynamics, '$$'))
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
        finalStyles = [...finalStyles, ...finalKeys.map(i => styles.statics[i])]
        // dynamic
        if (styles.dynamics && activeKeys.length) {
          finalStyles = [
            ...finalStyles,
            ...getDynamicSheets(getDynamicStyles(activeKeys, child.props, styles.dynamics))
          ]
        }

        // recreate child (without style props)
        const { key, ref, props, type } = child
        const newProps = omit(props, [...styleKeys, ...parentStyleKeys, 'motion$style'])
        if (ref) newProps.ref = ref
        if (key) newProps.key = key

        if (finalStyles.length) {
          // apply styles
          newProps.className = css(...finalStyles)

          // keep original classNames
          if (props && props.className && typeof props.className === 'string') {
            newProps.className += ` ${props.className}`
          }
        }

        // recurse to children
        if (newProps && newProps.children) {
          newProps.children = this.styleAll(child.props.children)
        }

        return React.createElement(type, newProps)
      }
    }
  }

  decorator.parent = styles => {
    const parentStyles = processStyles(styles)
    return Child => decorator(Child, parentStyles)
  }

  return decorator
}
