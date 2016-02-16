import { writeInternals } from './internals'
import { installExternals } from './externals'
import { log, handleError, emitter } from '../lib/fns'

export async function scanFile(file) {
  log.externals('scanFile', file.path)
  try {
    // install new stuff
    await installExternals(file.path)
    await writeInternals({ force: file.willInstall })

    // notify finished installing
    // if (file.willInstall) {
    //   let e = emitter.on('bundler:internals', () => {
    //     log.externals('done bundling, send scanned')
    //     e.dispose()
    //     emitter.emit('file:scanned', file.path)
    //   })
    // }
  }
  catch (e) {
    handleError(e)
  }
}
