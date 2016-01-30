const externals = [
  { name: 'babel-runtime', removePaths: true  },
  { name: 'flint-js',      removePaths: true  },
  { name: 'react',         removePaths: false },
  { name: 'react-dom',     removePaths: false },
  { name: 'history',       removePaths: false },
  { name: 'radium',        removePaths: false },
  { name: '',              removePaths: false },
]

export default function rmFlintExternals(requires) {
  const result = requires.filter(fullPath => {
    // babel-runtime/xyz = false
    // react = true
    // otherpackage = false

    for (let { name, removePaths } of externals) {
      if (removePaths && fullPath.indexOf(name) === 0)
        return false
      else if (fullPath === name)
        return false
    }

    return true
  })

  return result
}