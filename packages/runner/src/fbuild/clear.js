import { p, recreateDir, mkdir } from '../lib/fns'
import log from '../lib/log'
import handleError from '../lib/handleError'
import opts from '../opts'

export async function outDir() {
  log('outDir')
  await recreateDir(p(opts.get('flintDir'), 'out'))
}

export async function buildDir() {
  log('buildDir')
  await recreateDir(p(opts.get('flintDir'), 'build'))
  log('buildDir: make _ dir')
  await mkdir(p(opts.get('flintDir'), 'build', '_'))
}

export default { outDir, buildDir }