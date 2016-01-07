export default function depRequireString(name, onto, pathname = '') {
  return `Flint.${onto}["${name}"] = require("${pathname}${name}");\n`
}

// try {
//
// }
// catch(e) {
//   console.log('Error bundling package ${name}!')
//   console.error(e)
//   Flint.reportError(e)
// };