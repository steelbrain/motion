const parentFolderMatch = s => s.match(/\.\.\//g)

export default function requireFactory(root) {
  let app = ''

  function require(name, folder) {
    if (!name) return

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

      // try /index for directory shorthand
      return getInternal(cleanName, folder)
    }

    // exports
    if (name.indexOf('exports.') == 0)
      return root.exports[name.replace('exports.', '')]

    // get pkg
    let pkg = getExternal(name, folder)

    // we may be waiting for packages reload
    if (!pkg) return

    // may not export a default
    if (!pkg.default)
      pkg.default = pkg

    return pkg
  }

  function getExternal(name, folder) {
    return safeGet(root.exports, `externals`, [name], folder)
  }

  function getInternal(name, folder) {
    return safeGet(root.exports, `internals`, [name, `${name}/index`], folder)
  }

  function safeGet(obj, _ns, names, folder) {
    const ns = `${app}-${_ns}`
    if (!obj[ns]) {
      console.error(`exports["${ns}"] ${names[0]} not found`)
      return {}
    }

    let found, name, i, len = names.length

    for (i = 0; i < len; i++) {
      found = names[i]
      if (typeof obj[ns][found] != 'undefined') {
        name = found
        break
      }
    }

    if (typeof obj[ns][name] == 'undefined') {
      const where = folder ?
        ` into ${folder}` :
        ``

      console.error(`Can't find import "${names[0]}"${where} (using exports["${ns}"]["${names[0]}"])`)
      return {}
    }

    return obj[ns][name]
  }

  require.setApp = (appname) => {
    app = appname
  }

  return require
}