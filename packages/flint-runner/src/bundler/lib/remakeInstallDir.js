import { rm, touch, mkdir, log, writeJSON } from '../../lib/fns'
import writeInstalled from './writeInstalled'
import handleError from '../../lib/handleError'
import opts from '../../opts'

export default async function remakeInstallDir(redo) {
  log('bundler', 'remakeInstallDir', redo)
  const deps = opts.get('deps')

  try {
    await mkdir(deps.dir)

    if (redo) {
      await writeInstalled([])
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
      writeJSON(deps.externalsPaths, [])
    ]

    log('bundler', 'remakeInstallDir done')
  }
  catch(e) {
    handleError(e)
  }
}
