export default function requireFactory(Flint) {
  return function require(folder, name) {
    if (name.charAt(0) == '.') {
      let cleanName = folder + name.replace('./', '')
      return (
        Flint.internals[cleanName]
        // try /index for directory shorthand
        || Flint.internals[`${cleanName}/index`]
      )
    }

    if (name == 'bluebird')
      return root._bluebird

    let pkg = Flint.packages[name]

    // we may be waiting for packages reload
    if (!pkg) return

    // may not export a default
    if (!pkg.default)
      pkg.default = pkg

    return pkg
  }
}