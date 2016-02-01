import { p, log, handleError, recreateDir, mkdir } from '../lib/fns'
import opts from '../opts'
import disk from '../disk'

const LOG = 'clear'

export async function init() {
  let isDiffVersion = await differentFlintVersion()

  if (opts('reset') || isDiffVersion)
    await recreateDir(opts('internalDir'))

  // TODO may want to recreate all of depsDir?
  // recreate assets on re-run
  await recreateDir(opts('deps').assetsDir)

  await mkdir(opts('internalDir'))
  await mkdir(opts('styleDir'))

  if (opts('cached'))
    await mkdir(opts('outDir'))
  else
    await recreateDir(opts('outDir'))
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


async function differentFlintVersion() {
  const version = opts('version')
  const state = await disk.state.read()
  const stateVersion = state && state.opts && state.opts.version

  if (!stateVersion)
    return true

  const isDiff = version != stateVersion

  if (isDiff)
    console.log(`  New flint version, updating...\n`.dim)

  return isDiff
}