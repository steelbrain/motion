const parentFolderMatch = s => s.match(/\.\.\//g)

export default function requireFactory(Flint) {
  return function require(folder, name) {
    if (name.charAt(0) == '.') {
      let parentDirs = folder.split('/')
      let upDirs = parentFolderMatch(name)

      // remove from folder based on upwards ../
      if (upDirs && upDirs.length) {
        if (upDirs.length > parentDirs.length) {
          throw new Error(`The path ${name} is looking upwards above the root!`)
        }

        parentDirs.splice(-upDirs.length)
      }

      let parentPath = parentDirs.join('/')

      let cleanName = (parentPath ? parentPath + '/' : '')
        + name.replace(/^(\.\.?\/)+/, '')

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