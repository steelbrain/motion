import { checkInternals } from './internals'
import { installExternals } from './externals'
import handleError from '../lib/handleError'
import log from '../lib/log'

export function scanFile(file) {
  console.log('scanning', file)

  log.externals('scanFile', file)
  try {
    // install new stuff
    checkInternals(file)
    installExternals(file)
  }
  catch (e) {
    handleError(e)
  }
}
