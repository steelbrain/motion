const filters = [
  /^babel-runtime(\/.*)?$/,
  /^react(\/.*)?$/, // TODO allow subpaths
  /^flint-js$/,
  /^react-dom$/,
  /^history$/,
  /^radium$/,
]

export default function rmFlintExternals(requires) {
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