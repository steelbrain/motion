import opts from '../../opts'

export default function requireString(names, { prefix = '', removeExt = false } = {}) {
  if (removeExt)
    names = names.map(str => str.replace(/\.js[xf]?$/, ''))

  // if you put them in a try/catch you get:
  //   + no big breakage if try and install bad package
  //   - no nice error line numbers / breaking

  return `
  var packages = {}

  ${names.map(name => {
    return `  packages["${name}"] = require("${prefix}${name}");\n`
  }).join('')}

  window.require.setApp("${opts('saneName')}")
  module.exports = packages
  `
}