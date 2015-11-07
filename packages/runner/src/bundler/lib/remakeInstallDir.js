import { rmdir, touch, mkdir } from '../../lib/fns'
import writeInstalled from './writeInstalled'
import handleError from '../../lib/handleError'
import opts from '../../opts'

export default async function remakeInstallDir(redo) {
  const deps = opts.get('deps')

  try {
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
  }
  catch(e) {
    handleError(e)
  }
}
