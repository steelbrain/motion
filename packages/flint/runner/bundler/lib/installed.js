import normalize from './normalize'
import cache from '../../cache'
import disk from '../../disk'
import opts from '../../opts'
import { log, handleError } from '../../lib/fns'
import rmFlintExternals from './rmFlintExternals'
import filterWithPath from './filterWithPath'

let installed = []

export async function readInstalled({ fromCache = false } = {}) {
  if (fromCache) return installed

  try {
    const state = await disk.state.read()
    const installed = state.installed || []
    log.externals('readInstalled', installed.join(' '))
    return installed
  }
  catch(e) {
    console.log("Couldn't read installed packages")
    // handleError(e)
  }
}

export async function writeInstalled(_packages, _paths) {
  try {
    log.externals('writeInstalled', '_packages', _packages, '_paths', _paths)
    const packages = rmFlintExternals(normalize(_packages))
    const paths = _paths || cache.getExternals()

    installed = packages

    // write state.installed
    await disk.state.write((state, write) => {
      state.installed = packages
      write(state)
    })

    // write full paths
    const fullPaths = filterWithPath(paths, packages)
    log.externals('writeInstalled', 'packages', packages, 'fullPaths', fullPaths)
    await disk.externalsPaths.write((_, write) => write(fullPaths))
  }
  catch(e) {
    handleError(e)
  }
}

export async function readPackageJSON() {
  try {
    return await readJSON(p(opts('flintDir'), 'package.json'))
  }
  catch(e) {
    handleError(e)
  }
}