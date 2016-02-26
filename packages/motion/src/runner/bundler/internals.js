import { finishedInstalling } from './install'
import webpack from './webpack'
import { onInternalInstalled } from './lib/messages'
import webpackConfig from './lib/webpackConfig'
import { userExternals } from './externals'
import getWebpackErrors from './lib/getWebpackErrors'
import requireString from './lib/requireString'
import bridge from '../bridge'
import disk from '../disk'
import cache from '../cache'
import opts from '../opts'
import { _, log, logError, handleError, writeFile } from '../lib/fns'

// TODO we need a better way to manage what files are about to be bundled,
// and then what actually gets picked up by webpack --watch, and then manage that queue
let RELOAD = false

export async function writeInternals({ force, reload } = {}) {
  try {
    await finishedInstalling()

    RELOAD = reload

    if (force || disk.internalsIn.hasChanged()) {
      await disk.internalsIn.write((current, write) => {
        const internals = cache.getAllNames()

        log.internals('internals', internals)

        // get user entry
        const main = opts('config').entry.replace('./', '')

        write(requireString(_.uniq([main, ...internals]), {
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
      externals: userExternals()
    }
  })
}
