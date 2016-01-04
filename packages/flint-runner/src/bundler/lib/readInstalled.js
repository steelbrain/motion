import handleError from '../../lib/handleError'
import log from '../../lib/log'
import internal from '../../internal'

export default async function readInstalled() {
  try {
    const state = await internal.state.read()
    const installed = state.installed || []
    log('externals', 'readInstalled()', installed)
    return installed
  }
  catch(e) {
    console.log("Couldn't read installed packages")
    // handleError(e)
  }
}