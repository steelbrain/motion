import opts from '../../opts'
import { log, _ } from '../../lib/fns'

const LOG = 'webpack'

export default function handleWebpackErrors(err, stats, resolve, reject) {
  if (err)
    return reject(err)

  const jsonStats = stats.toJson({
    source: false
  })

  // debug
  if (opts.get('debug')) {
    log(LOG, '--- webpack output ---')
    log(LOG, jsonStats.modules.map(s => `${s.name}`[s.built && !s.failed ? 'green' : 'red']).join("\n"))
  }

  // check errors
  if (jsonStats.errors.length) {
    // debug output everything
    log(LOG, 'webpackErrors', jsonStats.errors)

    // take first three lines of error
    let take = s => _.take(s, 3)
    let split = s => s.split("\n")
    let join = s => s.join("\n")
    let messages = jsonStats.errors.map(split).map(take).map(join).join("\n")
    let message = 'Webpack: '.yellow + messages
    return reject(message)
  }

  // check warnings
  if (jsonStats.warnings.length) {
    console.log('Webpack warnings: ', jsonStats.warnings[0].split("\n").slice(0, 3).join("\n"))
  }

  log(LOG, 'webpack finished')
  return resolve()
}