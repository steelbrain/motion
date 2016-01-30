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
      return getInternal(cleanName)
    }

    // exports
    if (name.indexOf('exports.') == 0)
      return root.exports[name.replace('exports.', '')]

    // get pkg
    let pkg = getExternal(name)

    // we may be waiting for packages reload
    if (!pkg) return

    // may not export a default
    if (!pkg.default)
      pkg.default = pkg

    return pkg
  }

  function getExternal(name) {
    return safeGet(root.exports, `externals`, [name])
  }

  function getInternal(name) {
    return safeGet(root.exports, `internals`, [name, `${name}/index`])
  }

  function safeGet(obj, _ns, names) {
    const ns = `${app}-${_ns}`
    if (!obj[ns]) {
      console.error(`${_ns} not bundled, looking for ${names[0]}`)
      return {}
    }

    let name
    for (let _ of names) {
      if (typeof obj[ns][_] != undefined) {
        name = _
        break
      }
    }

    if (typeof obj[ns][name] == 'undefined') {
      console.error(`Package ${name} was not loaded`)
      return {}
    }

    return obj[ns][name]
  }

  require.setApp = (appname) => {
    app = appname
  }

  return require
}