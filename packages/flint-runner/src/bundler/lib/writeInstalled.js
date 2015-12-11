import normalize from './normalize'
import cache from '../../cache'
import { log, handleError } from '../../lib/fns'
import rmFlintExternals from './rmFlintExternals'
import readFullPaths from './readFullPaths'
import writeFullPaths from './writeFullPaths'
import filterWithPath from './filterWithPath'
import { writeState } from '../../internal'

const LOG = 'externals'

export default async function writeInstalled(_packages, _paths) {
  try {
    log(LOG, 'writeInstalled')
    const packages = rmFlintExternals(normalize(_packages))
    const fullPaths = filterWithPath(_paths || cache.getImports(), _packages)
    log(LOG, 'writeInstalled', 'packages', packages, 'fullPaths', fullPaths)

    await writeState((state, write) => {
      state.installed = packages
      write(state)
    })

    await writeFullPaths(fullPaths)
  }
  catch(e) {
    handleError(e)
  }
}