import opts from '../../opts'
import { p, log, _ } from '../../lib/fns'

const LOG = 'webpack'

let lineSep = `\n  `
let takeWebpack = ls => lineSep + _.take(ls, 2).join(lineSep)
let split = s => s.split("\n")
let join = s => s.join("\n")

function cleanPath(str) {
  return str
    .trim()
    .replace(/\.\/\.flint(\/\.internal)?(\/deps(\/internal)?)?/g, '')
    .replace(new RegExp(opts('appDir'), 'g'), '')
    .replace(new RegExp('Module not found: ', 'g'), '')
}

export default function handleWebpackErrors(where, err, stats, resolve, reject) {
  if (err)
    return reject(err)

  const jsonStats = stats.toJson({
    source: false
  })

  // debug
  if (opts('debug')) {
    log(LOG, '--- webpack output ---')
    log(LOG, jsonStats.modules.map(s => `${s.name}`[s.built && !s.failed ? 'green' : 'red']).join("\n"))
  }

  // check errors
  let errors = jsonStats.errors

  if (errors.length) {
    // debug output everything
    log(LOG, 'webpackErrors', errors)

    let messages = errors.map(split).map(takeWebpack)[0].dim

    let whereMsg = where == 'externals' ? 'NPM modules' : 'imported local modules'
    let message = cleanPath(`Webpack: ${whereMsg}`.yellow + `  ${messages}`).grey

    let file, line, column

    // this is ridiculous, but webpack only gives us errors as a big string stack dump
    // with the file at the bottom and line number at the end
    try {
      const lastError = errors[errors.length - 1].split("\n")
      const fileAndLine = cleanPath(lastError[lastError.length - 1]).split(' ') // on last line of webpack error
      file = fileAndLine[1]
      line = fileAndLine[2].split(':')[0]
      column = fileAndLine[2].split(':')[1]
    }
    catch(e) {
      handleError(e)
    }

    return reject({ message, file, loc: { line, column } })
  }

  // check warnings
  if (jsonStats.warnings.length) {
    console.log('Webpack warnings: ', jsonStats.warnings[0].split("\n").slice(0, 3).join("\n"))
  }

  log(LOG, 'webpack finished')
  return resolve()
}