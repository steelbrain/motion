import opts from '../../opts'
import { log, _ } from '../../lib/fns'

const LOG = 'webpack'

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

    let second = ls => ls[1]
    let split = s => s.split("\n")
    let join = s => s.join("\n")

    let messages = errors.map(split).map(second).join(`\n  `)
    let whereMsg = where == 'externals' ? 'NPM modules' : 'imported local modules'

    let message =
      `Webpack: ${whereMsg}\n`.yellow
      + `  ${messages}`.grey

    return reject(message)
  }

  // check warnings
  if (jsonStats.warnings.length) {
    console.log('Webpack warnings: ', jsonStats.warnings[0].split("\n").slice(0, 3).join("\n"))
  }

  log(LOG, 'webpack finished')
  return resolve()
}