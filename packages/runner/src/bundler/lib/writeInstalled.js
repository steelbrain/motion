import { log, handleError } from '../../lib/fns'
import rmFlintExternals from './rmFlintExternals'
import { readState, writeState } from '../../internal'

export default async function writeInstalled(deps) {
  try {
    const config = await readState()
    config['installed'] = rmFlintExternals(deps)
    log('externals', 'writeInstalled()', config)
    await writeState(config)
  }
  catch(e) {
    handleError(e)
  }
}
