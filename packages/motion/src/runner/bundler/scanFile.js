import { writeInternals } from './internals'
import { installExternals } from './externals'
import { log, handleError, emitter } from '../lib/fns'
import cache from '../cache'

export async function scanFile(file) {
  const path = file.relativePath
  log.externals('scanFile', path)

  try {
    // install new stuff
    await installExternals(path)
    await writeInternals({ force: file.willInstall })

    cache.setFileInstalling(path, false)
  }
  catch (e) {
    handleError(e)
  }
}
