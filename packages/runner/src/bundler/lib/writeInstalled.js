import normalize from './normalize'
import cache from '../../cache'
import { log, handleError } from '../../lib/fns'
import rmFlintExternals from './rmFlintExternals'
import readFullPaths from './readFullPaths'
import writeFullPaths from './writeFullPaths'
import filterWithPath from './filterWithPath'
import { readState, writeState } from '../../internal'

const LOG = 'externals'

export default async function writeInstalled(_packages, _paths) {
  try {
    log(LOG, 'writeInstalled')
    const packages = rmFlintExternals(normalize(_packages))
    const fullPaths = filterWithPath(_paths || cache.getImports(), _packages)
    log(LOG, 'writeInstalled', 'packages', packages, 'fullPaths', fullPaths)

    const config = await readState()

    const oldState = config
    const oldFullPaths = await readFullPaths()

    try {
      config.installed = packages
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
