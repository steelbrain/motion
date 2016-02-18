import normalize from './normalize'
import cache from '../../cache'
import disk from '../../disk'
import opts from '../../opts'
import { log, handleError } from '../../lib/fns'
import rmExternals from './rmExternals'
import filterWithPath from './filterWithPath'

let installed = []

export function readInstalledCache() {
  return installed
}

export async function readInstalled() {
  try {
    const state = await disk.state.read()
    const installed = state.installed || []
    log.externals('readInstalled', installed.join(' '))
    return installed
  }
  catch(e) {
    print("Couldn't read installed packages")
    // handleError(e)
  }
}

export async function writeInstalled(_packages, _paths) {
  try {
    log.externals('writeInstalled', '_packages', _packages.join(','), '_paths', _paths)
    const packages = rmExternals(normalize(_packages))
    const paths = _paths || cache.getExternals()

    installed = packages

    // write state.installed
    await disk.state.write((state, write) => {
      state.installed = packages
      write(state)
    })

    // write full paths
    const fullPaths = filterWithPath(packages, paths)
    log.externals('writeInstalled', 'fullPaths', fullPaths.join(','))
    await disk.externalsPaths.write((_, write) => write(fullPaths))
  }
  catch(e) {
    handleError(e)
  }
}

export async function readPackageJSON() {
  try {
    return await readJSON(p(opts('motionDir'), 'package.json'))
  }
  catch(e) {
    handleError(e)
  }
}