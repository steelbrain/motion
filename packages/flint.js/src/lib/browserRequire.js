export default function(name) {
  if (name == 'bluebird')
    return window._bluebird

  let pkg = window.__flintPackages[name]

  // we may be waiting for packages reload
  if (!pkg)
    return

  // may not export a default
  if (!pkg.default)
    pkg.default = pkg

  return pkg
}
