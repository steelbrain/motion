import opts from './opts'
import log from './lib/log'
import wport from './lib/wport'
import handleError from './lib/handleError'
import { readJSON, writeJSON } from './lib/fns'

let OPTS

export async function readState() {
  return await readJSON(opts.get('stateFile'))
}

// prompts for domain they want to use
export async function writeState(state) {
  try {
    await writeJSON(opts.get('stateFile'), state, { spaces: 2 })
  }
  catch(e) {
    handleError(e)
  }
}

export async function init() {
  try {
    await readState()
  }
  catch(e) {
    await writeState({})
  }

  let config
  try {
    config = await readJSON(opts.get('configFile'))
  }
  catch(e) {
    config = {}
    await writeJSON(opts.get('configFile'), config)
  }
  finally {
    opts.set('config', config)
  }
}

export async function setServerState() {
  const state = await readState()
  state.port = opts.get('port')
  state.wport = wport()
  await writeState(state)
}

export default { init, readState, writeState, setServerState }