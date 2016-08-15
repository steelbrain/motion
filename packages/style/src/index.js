import fancyElementFactory from './fancyElement'
import { StyleSheet } from 'aphrodite/no-important'
import { pickBy } from 'lodash'
import { applyNiceStyles, flattenThemes, isFunc } from './helpers'

// defaults
const defaultOpts = {
  themes: true
}

module.exports = function motionStyle(opts = defaultOpts) {
  // option-based helpers
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

  const getStyles = (userStyles, theme) => {
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
    // add to Child.prototype, so the decorated class can access: this.fancyElement
    const styles = getStyles(Child.style, opts.themes ? Child.theme : null)
    Child.prototype.fancyElement = fancyElementFactory(Child, parentStyles, styles, opts, getDynamicStyles, getDynamicSheets)
    return Child
  }

  // parent decorator
  decorator.parent = styles => {
    const parentStyles = getStyles(styles)
    return Child => decorator(Child, parentStyles)
  }

  return decorator
}
