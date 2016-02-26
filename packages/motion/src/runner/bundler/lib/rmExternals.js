const filters = [
  /^babel-runtime(\/.*)?$/,
  /^babel-polyfill$/,
  /^react(\/.*)?$/, // TODO allow subpaths
  /^motion-client$/,
  /^react-addons-css-transition-group$/,
  /^react-addons-transition-group$/,
  /^react-dom$/,
  /^history$/,
  /^radium$/,
]

export default function rmExternals(requires) {
  const result = requires.filter(fullPath => {
    // babel-runtime/xyz = filtered
    // react/lib = filtered

    for (let filter of filters) {
      if (filter.test(fullPath))
        return false
    }

    return true
  })

  return result
}