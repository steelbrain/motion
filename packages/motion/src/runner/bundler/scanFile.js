import { writeInternals } from './internals'
import { installExternals } from './externals'
import { log, handleError, emitter } from '../lib/fns'
import cache from '../cache'

export async function scanFile({ willInstall, relPath }) {
  log.externals('scanFile', relPath)

  try {
    // install new stuff
    await installExternals(relPath)
    await writeInternals({ force: willInstall })

    cache.setFileInstalling(relPath, false)
  }
  catch (e) {
    handleError(e)
  }
}
