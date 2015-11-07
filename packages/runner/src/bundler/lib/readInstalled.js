import handleError from '../../lib/handleError'
import log from '../../lib/log'
import { readConfig } from '../../lib/config'

export default async function readInstalled() {
  try {
    const config = await readConfig()
    const installed = config['installed'] || []
    log('readInstalled()', installed)
    return installed
  }
  catch(e) {
    handleError(e)
  }
}