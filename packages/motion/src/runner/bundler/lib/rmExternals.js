const filters = [
  /^babel-runtime(\/.*)?$/,
  /^react(\/.*)?$/, // TODO allow subpaths
  /^motion-client$/,
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