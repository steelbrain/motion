import { p, recreateDir, mkdir } from '../lib/fns'
import log from '../lib/log'
import handleError from '../lib/handleError'
import opts from '../opts'

const LOG = 'clear'

export async function internalDir() {
  log(LOG, 'internalDir')
  await recreateDir(opts.get('internalDir'))
}

export async function outDir() {
  log(LOG, 'outDir')
  // await recreateDir(opts.get('outDir'))
  await mkdir(opts.get('outDir'))
}

export async function styles() {
  log(LOG, 'outDir')
  // await recreateDir(opts.get('styleDir'))
  await mkdir(opts.get('styleDir'))
}

export async function buildDir() {
  log(LOG, 'buildDir')
  await recreateDir(opts.get('buildDir'))
  await mkdir(p(opts.get('buildDir'), '_'))
}

export default { outDir, buildDir, internalDir, styles }