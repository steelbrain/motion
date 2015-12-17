export default function depRequireString(name, onto, pathname = '') {
  return `
    // try {
      Flint.${onto}["${name}"] = require("${pathname}${name}")
    // }
    // catch(e) {
    //   console.log('Error bundling package ${name}!')
    //   console.error(e)
    //   Flint.reportError(e)
    // };
  `
}
