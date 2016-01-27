import opts from '../../opts'
import { log, _ } from '../../lib/fns'

const LOG = 'webpack'

let lineSep = `\n  `
let takeWebpack = ls => lineSep + _.take(ls, 3).join(lineSep)
let split = s => s.split("\n")
let join = s => s.join("\n")

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

    let messages = errors.map(split).map(takeWebpack).join(`\n  `)
    let whereMsg = where == 'externals' ? 'NPM modules' : 'imported local modules'
    let message = `Webpack: ${whereMsg}\n`.yellow + `  ${messages}`.grey

    let file, line, col

    // this is ridiculous, but webpack only gives us errors as a big string stack dump
    // with the file at the bottom and line number at the end
    try {
      const lastError = errors[errors.length - 1].split("\n")
      const fileAndLine = lastError[lastError.length - 1].trim().split(' ') // on last line of webpack error
      file = fileAndLine[1]
      line = fileAndLine[2].split(':')[0]
      col = fileAndLine[2].split(':')[1]
    }
    catch(e) {
      console.log(e)
      handleError(e)
    }

    return reject({ message, file, line, col })
  }

  // check warnings
  if (jsonStats.warnings.length) {
    console.log('Webpack warnings: ', jsonStats.warnings[0].split("\n").slice(0, 3).join("\n"))
  }

  log(LOG, 'webpack finished')
  return resolve()
}