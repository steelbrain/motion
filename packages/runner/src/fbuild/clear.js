import { p, recreateDir } from '../lib/fns'
import handleError from '../lib/handleError'
import opts from '../opts'

export const clearOutDir = () =>
  recreateDir(p(opts.get('flintDir'), 'out'))

export const clearBuildDir = () => {
  return new Promise((res) => {
    log('clearBuildDir')
    recreateDir(p(opts.get('flintDir'), 'build'))
    .then(async () => {
      log('clearBuildDir: make _ dir')
      try {
        await mkdir(p(opts.get('flintDir'), 'build', '_'))
        res()
      }
      catch(e) { handleError(e) }
    })
  })
}

export default { clearOutDir, clearBuildDir }