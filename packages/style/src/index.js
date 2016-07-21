import React from 'react'
import niceStyles from 'motion-nice-styles'
import { StyleSheet, css } from 'aphrodite'
import { omit } from 'lodash'

const filterObject = (obj, cond) => Object.keys(obj)
  .filter(item => cond(obj[item]))
  .reduce((acc, cur) => ({ ...acc, [cur]: obj[cur] }), {})

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

  delete result.theme
  return result
}

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

const isFunc = x => typeof x === 'function'
const filterStyleKeys = arr => arr.filter(key => key[0] === '$' && key[1] !== '$')
const filterParentStyleKeys = arr => arr.filter(key => key[0] === '$' && key[1] === '$')


module.exports = function motionStyle(opts = {
  theme: true,
  themeKey: 'theme'
}) {
  // helpers
  const makeNiceStyles = styles => applyNiceStyles(styles, opts.themeKey)
  const getDynamicStyles = (active, props, styles) => {
    const dynamicKeys = active.filter(k => styles[k])
    const dynamicsReduce = (acc, k) => ({ ...acc, [k]: styles[k](props[`$${k}`]) })
    const dynamics = dynamicKeys.reduce(dynamicsReduce, {})
    const sheet = StyleSheet.create(makeNiceStyles(dynamics))
    return { sheet, dynamicKeys, dynamics }
  }

  const processStyles = _styles => {
    let styles = { ..._styles }

    // flatten themes
    styles = opts.theme ? flattenThemes(styles) : styles

    // split dynamic/static
    const dynamics = filterObject(styles, isFunc)
    const statics = filterObject(styles, x => !isFunc(x))

    return {
      statics: StyleSheet.create(makeNiceStyles(statics)),
      dynamics
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

        // add theme keys
        if (opts.theme) {
          const addTheme = (keys, prop) => [...keys, ...allKeys.map(k => `${prop}-${k}`)]

          // theme prop
          if (opts.themeKey && this.props[opts.themeKey]) {
            finalKeys = addTheme(finalKeys, this.props[opts.themeKey])
          }

          // boolean prop
          const themeProps = this.constructor.themeProps
          if (themeProps && themeProps.length) {
            themeProps.forEach(prop => {
              if (this.props[prop]) finalKeys = addTheme(finalKeys, prop)
            })
          }
        }

        // add static styles
        let finalStyles = []

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
                ...getDynamicStyles(keys, child.props, parentStyles.dynamics)
              ]
            }

            // static
            if (parentStyles.statics) {
              const parentStaticStyles = keys.map(k => parentStyles.statics[k])
              finalStyles = [...finalStyles, ...parentStaticStyles]
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
          const { dynamicKeys, sheet } = getDynamicStyles(activeKeys, child.props, styles.dynamics)
          this.__dynamicStylesResolved = sheet
          finalStyles = [...finalStyles, ...dynamicKeys.map(k => sheet[k])]
        }

        // recreate child (without style props)
        const { key, ref, props, type } = child
        const newProps = omit(props, [...styleKeys, ...parentStyleKeys])
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

  decorator.parent = styles => Child => decorator(Child, processStyles(styles))

  return decorator
}
