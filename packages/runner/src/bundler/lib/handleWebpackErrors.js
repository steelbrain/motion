import log from '../../lib/log'

export default function handleWebpackErrors(err, stats, resolve, reject) {
  if (err)
    return reject(err)

  const jsonStats = stats.toJson()

  if (jsonStats.errors.length) {
    err = jsonStats.errors.join("\n")
    return reject(err)
  }

  if (jsonStats.warnings.length) {
    console.log('Webpack warnings: ', jsonStats.warnings[0].split("\n").slice(0, 3).join("\n"))
  }

  log('bundler', 'webpack finished')
  return resolve()
}