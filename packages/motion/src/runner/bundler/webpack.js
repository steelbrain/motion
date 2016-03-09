import webpack from 'webpack'
import webpackConfig from './lib/webpackConfig'
import getWebpackErrors from './lib/getWebpackErrors'
import opts from '../opts'
import { log, logError, emitter, readFile } from '../lib/fns'

export default function webpacker({ name, config, onFinish }) {
  return new Promise((res, rej) => {
    const _conf = webpackConfig(`${name}.js`, config)
    const compiler = webpack(_conf)
    const watching = opts('watching')

    // continue if watching
    // if (watching) res()

    const run = watching ?
      compiler.watch.bind(compiler, {}) :
      compiler.run.bind(compiler)

    run((e, _stats) => {
      log.externals('ran webpack', name)

      const stats = _stats.toJson()
      const err = getWebpackErrors('externals', e, stats)

      if (err) {
        logError(err)
        rej(err)
      }
      else {
        emitter.emit('compiler:' + name)
        onFinish(stats)
        res()
      }
    })
  })
}
