import { writeInternals } from './internals'
import { installExternals } from './externals'
import { log, handleError, emitter } from '../lib/fns'
import cache from '../cache'

export async function scanFile(file) {
  log.externals('scanFile', file.path)
  try {
    // install new stuff
    await installExternals(file.path)
    await writeInternals({ force: file.willInstall })

    cache.setFileInstalling(file.path, false)
  }
  catch (e) {
    handleError(e)
  }
}
