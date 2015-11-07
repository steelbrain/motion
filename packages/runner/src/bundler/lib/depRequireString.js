export default function depRequireString(name, onto, pathname = '') {
  return `
    try {
      Flint.${onto}["${name}"] = require("${pathname}${name}")
    }
    catch(e) {
      console.log('Error running package!')
      console.error(e)
    };
  `
}
