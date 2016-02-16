import { internals } from './internals'
import { installExternals } from './externals'
import handleError from '../lib/handleError'
import log from '../lib/log'

export async function scanFile(file) {
  log.externals('scanFile', file)
  try {
    // install new stuff
    await installExternals(file.path)
    await internals({ force: file.willInstall })
  }
  catch (e) {
    handleError(e)
  }
}
