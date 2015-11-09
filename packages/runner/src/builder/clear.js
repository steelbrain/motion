import { p, recreateDir, mkdir } from '../lib/fns'
import log from '../lib/log'
import handleError from '../lib/handleError'
import opts from '../opts'

export async function internalDir() {
  log('internalDir')
  await recreateDir(opts.get('internalDir'))
}

export async function outDir() {
  log('outDir')
  await recreateDir(opts.get('outDir'))
}

export async function styles() {
  log('outDir')
  await recreateDir(opts.get('styleDir'))
}

export async function buildDir() {
  log('buildDir')
  await recreateDir(opts.get('buildDir'))
  await mkdir(p(opts.get('buildDir'), '_'))
}

export default { outDir, buildDir, internalDir, styles }