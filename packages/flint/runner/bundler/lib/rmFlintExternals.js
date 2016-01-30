const externals = [
  { name: 'babel-runtime', stripPath: true  },
  { name: 'flint-js',      stripPath: false  },
  // TODO to allow users to have their own react need to patch webpackConfig to allow that then set this true
  { name: 'react',         stripPath: true },
  { name: 'react-dom',     stripPath: false },
  { name: 'history',       stripPath: false },
  { name: 'radium',        stripPath: false },
  { name: '',              stripPath: false },
]

export default function rmFlintExternals(requires) {
  const result = requires.filter(fullPath => {
    // babel-runtime/xyz = false
    // react = true
    // otherpackage = false

    for (let { name, stripPath } of externals) {
      if (stripPath && fullPath.indexOf(name) === 0)
        return false
      else if (fullPath === name)
        return false
    }

    return true
  })

  return result
}