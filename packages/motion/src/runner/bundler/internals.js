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
    }
  }
  catch(e) {
    handleError(e)
  }
}

export function runInternals() {
  const bundler = webpack(webpackConfig('internals.js', {
    entry: opts('deps').internalsIn,
    externals: webpackUserExternals()
  }))

  const mode = !opts('build') ? 'watch' : 'run'

  bundler[mode]({}, (e, stats) => {
    log.externals('ran webpack internals')
    const err = getWebpackErrors('externals', e, stats)

    if (err) logError(err)
    else onInternalInstalled()
  })
}

// let internals use externals
function webpackUserExternals() {
  const imports = cache.getExternals()
  const externalsObj = imports.reduce((acc, cur) => {
    acc[cur] = cur
    return acc
  }, {})

  return externalsObj
}