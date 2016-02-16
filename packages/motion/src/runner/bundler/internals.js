import { finishedInstalling } from './install'
import webpack from 'webpack'
import { onInternalInstalled } from './lib/messages'
import webpackConfig from './lib/webpackConfig'
import getWebpackErrors from './lib/getWebpackErrors'
import requireString from './lib/requireString'
import bridge from '../bridge'
import disk from '../disk'
import cache from '../cache'
import opts from '../opts'
import { log, logError, handleError, writeFile } from '../lib/fns'

export async function internals(opts = {}) {
  try {
    log.internals('internals')
    await finishedInstalling()

    if (opts.force || disk.internalsIn.hasChanged()) {
      await disk.internalsIn.write((current, write) => {
        write(requireString(cache.getExported(), {
          prefix: './internal/',
          removeExt: true
        }))
      })

      await packInternals()
      onInternalInstalled()
    }
  }
  catch(e) {
    handleError(e)
  }
}

// let internals use externals
export function webpackUserExternals() {
  const imports = cache.getExternals()
  const externalsObj = imports.reduce((acc, cur) => {
    acc[cur] = cur
    return acc
  }, {})

  return externalsObj
}

function packInternals() {
  log.internals('packInternals')

  return new Promise((resolve, reject) => {
    const conf = webpackConfig('internals.js', {
      entry: opts('deps').internalsIn,
      externals: webpackUserExternals()
    })

    webpack(conf, (err, stats) => {
      logError(getWebpackErrors('internals', err, stats))
      resolve()
    })
  })
}
