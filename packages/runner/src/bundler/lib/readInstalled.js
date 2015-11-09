import handleError from '../../lib/handleError'
import log from '../../lib/log'
import { readState } from '../../internal'

export default async function readInstalled() {
  try {
    const state = await readState()
    const installed = state['installed'] || []
    log('readInstalled()', installed)
    return installed
  }
  catch(e) {
    handleError(e)
  }
}