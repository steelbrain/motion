import { rmdir, touch, mkdir } from '../../lib/fns'
import handleError from '../../lib/handleError'

export default async function remakeInstallDir(redo) {
  try {
    if (redo) {
      await writeInstalled([])

      try {
        await rmdir(DEPS.dir)
      }
      catch(e) {}
    }

    await mkdir(DEPS.dir)
    await* [
      touch(DEPS.depsJSON),
      touch(DEPS.depsJS),
      touch(DEPS.packagesJS),
      touch(DEPS.internalsOut)
    ]
  }
  catch(e) {
    handleError(e)
  }
}
