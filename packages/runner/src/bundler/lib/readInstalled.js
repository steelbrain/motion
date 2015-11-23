import handleError from '../../lib/handleError'
import log from '../../lib/log'
import { readState } from '../../internal'

export default async function readInstalled() {
  try {
    const state = await readState()
    const installed = state.installed || []
    log('externals', 'readInstalled()', installed)
    return installed
  }
  catch(e) {
    console.log("Couldn't read installed packages")
    // handleError(e)
  }
}