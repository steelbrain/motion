import normalize from './normalize'
import cache from '../../cache'
import { log, handleError } from '../../lib/fns'
import rmFlintExternals from './rmFlintExternals'
import filterWithPath from './filterWithPath'
import disk from '../../disk'

const LOG = 'externals'

// this writes the full paths to all installed packages

export default async function writeInstalled(_packages, _paths) {
  try {
    log(LOG, 'writeInstalled', '_packages', _packages, '_paths', _paths)
    const packages = rmFlintExternals(normalize(_packages))
    const paths = _paths || cache.getExternals()

    // write state.installed
    await disk.state.write((state, write) => {
      state.installed = packages
      write(state)
    })

    // write full paths
    const fullPaths = filterWithPath(paths, packages)
    log(LOG, 'writeInstalled', 'packages', packages, 'fullPaths', fullPaths)
    await disk.externalsPaths.write((_, write) => write(fullPaths))
  }
  catch(e) {
    handleError(e)
  }
}