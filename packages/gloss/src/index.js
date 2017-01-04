import fancyElementFactory from './fancyElement'
import { StyleSheet } from 'aphrodite/no-important'
import { pickBy } from 'lodash'
import { applyNiceStyles, flattenThemes, isFunc } from './helpers'

// defaults
const defaultOpts = {}

module.exports = function motionStyle(opts = defaultOpts) {
  // option-based helpers
  const getDynamicStyles = (activeKeys: Array, props: Object, styles: Object, propPrefix = '$') => {
    const dynamicKeys = activeKeys
      .filter(k => styles[k] && typeof styles[k] === 'function')

    const dynamics = dynamicKeys
      .reduce((acc, key) => ({
        ...acc,
        [key]: styles[key](props[`${propPrefix}${key}`])
      }), {})

    return dynamics
  }

  const getDynamicSheets = dynamics => {
    const sheet = StyleSheet.create(applyNiceStyles(dynamics))
    return Object.keys(dynamics).map(key => ({ ...sheet[key], isDynamic: true, key }))
  }

  const getStyles = ({ name, style }, theme) => {
    const styles = { ...style, ...flattenThemes(theme) }
    const dynamics = pickBy(styles, isFunc)
    const statics = pickBy(styles, x => !isFunc(x))

    const niceStatics = applyNiceStyles(statics, `${name}:`)

    return {
      statics: StyleSheet.create(niceStatics),
      dynamics,
      theme
    }
  }

  let baseStyles

  if (opts.baseStyles) {
    baseStyles = getStyles({ name: 'Gloss Parent Styles', style: opts.baseStyles }, null)
  }

  // decorator
  const decorator = (Child) => {
    // add to Child.prototype, so the decorated class can access: this.fancyElement
    const styles = getStyles(Child, opts.dontTheme ? null : Child.theme)
    Child.prototype.fancyElement = fancyElementFactory(Child, baseStyles, styles, opts, getDynamicStyles, getDynamicSheets)

    // allows this.addTheme('theme') from within a component
    const setTheme = val => function(...names) {
      for (const name of names) {
        this.__activeThemes = this.__activeThemes || {}
        this.__activeThemes[name] = val
      }
    }
    Child.prototype.addTheme = setTheme(true)
    Child.prototype.removeTheme = setTheme(false)
    return Child
  }

  return decorator
}
