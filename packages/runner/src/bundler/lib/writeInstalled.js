import normalize from './normalize'
import cache from '../../cache'
import { log, handleError } from '../../lib/fns'
import rmFlintExternals from './rmFlintExternals'
import readFullPaths from './readFullPaths'
import writeFullPaths from './writeFullPaths'
import filterExternalsWithPath from './filterExternalsWithPath'
import { readState, writeState } from '../../internal'

const LOG = 'externals'

export default async function writeInstalled(_packages) {
  try {
    const fullPaths = rmFlintExternals(normalize(_packages))
    const installed = filterExternalsWithPath(cache.getImports(), fullPaths)
    log(LOG, 'writeInstalled', 'fullPaths', fullPaths, 'installed', installed)

    const config = await readState()

    const oldState = config
    const oldFullPaths = await readFullPaths()

    try {
      config.installed = installed
      await writeState(config)
      await writeFullPaths(fullPaths)
    }
    catch(e) {
      console.log('Error writing new packages', e)
      await writeState(oldState)
      await writeFullPaths(oldFullPaths)
    }
  }
  catch(e) {
    handleError(e)
  }
}
