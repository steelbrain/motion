import niceStyles from 'motion-nice-styles'

// flatten theme key
// { theme: { dark: { h1: { color: 'red' } } } }
// => { dark-button: { h1: { color: 'red' } } }
export const flattenThemes = themes => {
  if (!themes) return {}

  let result = {}

  Object.keys(themes).forEach(tKey => {
    const theme = themes[tKey]

    if (typeof theme === 'object') {
      result = {
        ...result,
        // flatten themes to `theme-tag: {}`
        ...Object.keys(theme)
            .reduce((res, key) => ({ ...res, [`${tKey}-${key}`]: theme[key] }), {})
      }
    } else if (typeof theme === 'function') {
      // skip function themes
      return
    } else {
      console.log(`Note: themes must be an object or function, "${tKey}" is a ${typeof tKey}`)
    }
  })

  return result
}

export const applyNiceStyles = (styles, errorMessage) => {
  for (const style in styles) {
    if (!styles.hasOwnProperty(style)) {
      continue
    }
    const value = styles[style]
    if (value) {
      styles[style] = niceStyles(value, false, errorMessage)
    }
  }

  return styles
}

export const isFunc = x => typeof x === 'function'
export const filterStyleKeys = arr => arr.filter(key => key[0] === '$' && key[1] !== '$')
export const filterParentStyleKeys = arr => arr.filter(key => key[0] === '$' && key[1] === '$')
