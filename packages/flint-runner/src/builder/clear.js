import { p, log, handleError, recreateDir, mkdir } from '../lib/fns'
import opts from '../opts'

const LOG = 'clear'

export async function init() {
  // TODO: when cached startup works, re-enable reset flag
  if (opts.get('reset'))
    await recreateDir(opts.get('internalDir'))

  await mkdir(opts.get('internalDir'))
  await mkdir(opts.get('styleDir'))
  await mkdir(opts.get('outDir'))
}

export async function internalDir() {
  log(LOG, 'internalDir')
  await recreateDir(opts.get('internalDir'))
}

export async function outDir() {
  log(LOG, 'outDir')
  await recreateDir(opts.get('outDir'))
}

export async function styles() {
  log(LOG, 'outDir')
  await recreateDir(opts.get('styleDir'))
}

export async function buildDir() {
  log(LOG, 'buildDir')
  await recreateDir(opts.get('buildDir'))
  await mkdir(p(opts.get('buildDir'), '_'))
}

export default { init, outDir, buildDir, internalDir, styles }
