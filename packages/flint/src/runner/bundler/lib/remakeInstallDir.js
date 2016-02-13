import { handleError, rm, touch, mkdir, log, writeJSON } from '../../lib/fns'
import opts from '../../opts'
import disk from '../../disk'

export default async function remakeInstallDir(reset) {
  log('bundler', 'remakeInstallDir')
  const deps = opts('deps')

  try {
    await mkdir(deps.dir)

    if (reset) {
      await* [
        rm(deps.externalsIn),
        rm(deps.externalsPaths),
        rm(deps.externalsOut),
        rm(deps.internalsIn),
        rm(deps.internalsOut),
      ]
    }

    await* [
      touch(deps.externalsIn),
      touch(deps.externalsOut),
      touch(deps.internalsIn),
      touch(deps.internalsOut),
      // disk.externalsPaths.write((_, write) => write([]))
    ]
  }
  catch(e) {
    handleError(e)
  }
}
