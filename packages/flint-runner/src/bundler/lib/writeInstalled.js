import normalize from './normalize'
import cache from '../../cache'
import { log, handleError } from '../../lib/fns'
import rmFlintExternals from './rmFlintExternals'
import filterWithPath from './filterWithPath'
import internal from '../../internal'

const LOG = 'externals'

export default async function writeInstalled(_packages, _paths) {
  try {
    log(LOG, 'writeInstalled')
    const packages = rmFlintExternals(normalize(_packages))
    const paths = _paths || cache.getImports()

    // write state.installed
    await internal.state.write((state, write) => {
      state.installed = packages
      write(state)
    })

    // write full paths
    const fullPaths = filterWithPath(paths, packages)
    log(LOG, 'writeInstalled', 'packages', packages, 'fullPaths', fullPaths)
    await internal.externalsPaths.write((_, write) => write(fullPaths))
  }
  catch(e) {
    handleError(e)
  }
}