import webpack from 'webpack'
import opts from '../../opts'
import getWebpackErrors from './getWebpackErrors'
import { log, logError, emitter, readFile } from '../../lib/fns'

export default function webpacker(name, config, cb) {
  return new Promise(async (res, rej) => {
    const compiler = webpack(config)
    const watching = opts('watching')

    // continue if watching
    if (watching) res()

    const run = watching ?
      compiler.watch.bind(compiler, {}) :
      compiler.run.bind(compiler)

    run((e, stats) => {
      log.externals('ran webpack', name)
      const err = getWebpackErrors('externals', e, stats)

      if (err) {
        logError(err)
        rej(err)
      }
      else {
        emitter.emit('compiler:' + name)
        cb()
        res()
      }
    })
  })
}