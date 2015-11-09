import log from '../../lib/log'
import handleError from '../../lib/handleError'
import rmFlintExternals from './rmFlintExternals'
import { readState, writeState } from '../../internal'

export default async function writeInstalled(deps) {
  try {
    log('writeInstalled()', deps)
    const config = await readState()
    config['installed'] = rmFlintExternals(deps)
    await writeState(config)
  }
  catch(e) {
    handleError(e)
  }
}
