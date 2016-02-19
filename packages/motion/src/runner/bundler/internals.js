import { finishedInstalling } from './install'
import webpack from './webpack'
import { onInternalInstalled } from './lib/messages'
import webpackConfig from './lib/webpackConfig'
import getWebpackErrors from './lib/getWebpackErrors'
import requireString from './lib/requireString'
import bridge from '../bridge'
import disk from '../disk'
import cache from '../cache'
import opts from '../opts'
import { log, logError, handleError, writeFile } from '../lib/fns'

export async function writeInternals(opts = {}) {
  try {
    await finishedInstalling()

    if (opts.force || disk.internalsIn.hasChanged()) {
      await disk.internalsIn.write((current, write) => {
        const internals = cache.getExported()

        log.internals('internals', internals)

        write(requireString(internals, {
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
  return webpack({
    name: 'internals',
    onFinish: onInternalInstalled,
    config: {
      entry: opts('deps').internalsIn,
      externals: webpackUserExternals(),
    }
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