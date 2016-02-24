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

let RELOAD = false

export async function writeInternals({ force, reload } = {}) {
  try {
    await finishedInstalling()

    RELOAD = reload

    if (force || disk.internalsIn.hasChanged()) {
      await disk.internalsIn.write((current, write) => {
        const internals = cache.getExported()

        log.internals('internals', internals)

        // get user entry
        const main = opts('config').entry.replace('./', '')

        write(requireString([main, ...internals], {
          prefix: './out/',
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
    onFinish: () => RELOAD && onInternalInstalled(),
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