import opts from '../../opts'

export default function depRequireString(names, prefix = '') {
  const cleanNames = names.map(str => str.charAt(0) == '.' ? str.replace(/\.js$/, '') : str)

  // if you put them in a try/catch you get:
  //   + no big breakage if try and install bad package
  //   - no nice error line numbers / breaking

  return `
  var packages = {}

  ${cleanNames.map(name => {
    return `  packages["${name}"] = require("${prefix}${name}");\n`
  }).join('')}

  window.require.setApp("${opts('saneName')}")
  module.exports = packages
  `
}