import { rmdir, touch, mkdir, log } from '../../lib/fns'
import writeInstalled from './writeInstalled'
import handleError from '../../lib/handleError'
import opts from '../../opts'

export default async function remakeInstallDir(redo) {
  log('bundler', 'remakeInstallDir', redo)
  const deps = opts.get('deps')

  try {
    await rmdir(deps.depsJSON)

    if (redo) {
      await writeInstalled([])

      try {
        await rmdir(deps.dir)
      }
      catch(e) {}
    }

    await mkdir(deps.dir)
    await* [
      touch(deps.depsJSON),
      touch(deps.depsJS),
      touch(deps.packagesJS),
      touch(deps.internalsOut)
    ]

    log('bundler', 'remakeInstallDir done')
  }
  catch(e) {
    handleError(e)
  }
}
