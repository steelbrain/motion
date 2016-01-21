import opts from '../../opts'

export default function depRequireString(names, prefix = '') {
  const cleanNames = names.map(n => n.replace(/\.js$/, ''))

  // set them in a try/catch so if one fails they all dont fail

  return `
    var packages = {}

    ${cleanNames.map(name => {
      return `
      packages["${name}"] = require("${prefix}${name}")
      `
    }).join("\n")}

    window.require.setApp("${opts.get('saneName')}")
    module.exports = packages
  `
}