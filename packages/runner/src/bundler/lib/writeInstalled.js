import log from '../../lib/log'
import handleError from '../../lib/handleError'
import rmFlintExternals from './rmFlintExternals'
import { readConfig, writeConfig } from '../../lib/config'

export default async function writeInstalled(deps) {
  try {
    log('writeInstalled()', deps)
    const config = await readConfig()
    config['installed'] = rmFlintExternals(deps)
    await writeConfig(config)
  }
  catch(e) {
    handleError(e)
  }
}
