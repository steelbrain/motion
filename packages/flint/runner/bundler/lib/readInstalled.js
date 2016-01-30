import handleError from '../../lib/handleError'
import log from '../../lib/log'
import disk from '../../disk'
import opts from '../../opts'

export async function readInstalled() {
  try {
    const state = await disk.state.read()
    const installed = state.installed || []
    log.externals('readInstalled', installed.join(' '))
    return installed
  }
  catch(e) {
    console.log("Couldn't read installed packages")
    // handleError(e)
  }
}

export async function readPackageJSON() {
  try {
    return await readJSON(p(opts('flintDir'), 'package.json'))
  }
  catch(e) {
    handleError(e)
  }
}