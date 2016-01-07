import { p, log, handleError, recreateDir, mkdir } from '../lib/fns'
import opts from '../opts'
import disk from '../disk'

const LOG = 'clear'

export async function init() {
  let isDiffVersion = await differentFlintVersion()

  if (opts.get('reset') || isDiffVersion)
    await recreateDir(opts.get('internalDir'))

  // TODO may want to recreate all of depsDir?
  // recreate assets on re-run
  await recreateDir(opts.get('deps').assetsDir)

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


async function differentFlintVersion() {
  const version = opts.get('version')
  const state = await disk.state.read()
  const isSame = state && state.opts && version == state.opts.version
  const isDifferent = !isSame

  if (isDifferent)
    console.log(`New flint version, resetting internals\n`.grey)

  return isDifferent
}