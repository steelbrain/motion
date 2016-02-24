import { p, log, handleError, rm, recreateDir, mkdir, exists } from '../lib/fns'
import opts from '../opts'
import disk from '../disk'

const LOG = 'clear'

export async function init() {
  let isDiffVersion = await differentMotionVersion()

  if (opts('reset') || isDiffVersion)
    await recreateDir(opts('internalDir'))

  await Promise.all([
    recreateDir(opts('deps').assetsDir),
    mkdir(opts('internalDir')),
    mkdir(opts('styleDir')),
    rm(p(opts('internalDir'), 'user-config'))
  ])

  if (opts('cached')) {
    await mkdir(opts('outDir'))
    await mkdir(opts('hotDir'))
  }
  else {
    await recreateDir(opts('outDir'))
    await recreateDir(opts('hotDir'))
  }
}

export async function internalDir() {
  log(LOG, 'internalDir')
  await recreateDir(opts('internalDir'))
}

export async function outDir() {
  log(LOG, 'outDir')
  await recreateDir(opts('outDir'))
}

export async function styles() {
  log(LOG, 'outDir')
  await recreateDir(opts('styleDir'))
}

export async function buildDir() {
  log(LOG, 'buildDir')
  await recreateDir(opts('buildDir'))
  await mkdir(p(opts('buildDir'), '_'))
}

export default { init, outDir, buildDir, internalDir, styles }


async function differentMotionVersion() {
  const version = opts('version')
  const state = await disk.state.read()
  const stateVersion = state && state.opts && state.opts.version

  if (!stateVersion)
    return true

  const isDiff = version != stateVersion

  if (isDiff)
    print(`  New motion version, updating...\n`.dim)

  return isDiff
}
