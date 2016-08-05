import niceStyles from 'motion-nice-styles'

// flatten theme key
// { theme: { dark: { h1: { color: 'red' } } } }
// => { dark-button: { h1: { color: 'red' } } }
export const flattenThemes = styles => {
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
    } else if (typeof themeStyles === 'function') {
      // skip function themes
      return
    } else {
      console.log(`Note: themes must be an object or function, "${themeKey}" is a ${typeof themeKey}`)
    }
  })

  delete result.theme
  return result
}

export const applyNiceStyles = (styles, themeKey) => {
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

export const isFunc = x => typeof x === 'function'
export const filterStyleKeys = arr => arr.filter(key => key[0] === '$' && key[1] !== '$')
export const filterParentStyleKeys = arr => arr.filter(key => key[0] === '$' && key[1] === '$')
