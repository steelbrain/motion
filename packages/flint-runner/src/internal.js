import opts from './opts'
import wport from './lib/wport'
import safeWrite from './lib/safeWrite'
import handleError from './lib/handleError'

let read, write

export function readState() { return read() }
export function writeState(writer) { return write(writer) }

export async function init() {
  ({ read, write } = safeWrite(opts.get('stateFile'), { debug: 'writeState' }))

  try { await readState() }
  catch(e) {
    try { await writeState((state, write) => write({})) }
    catch(e) { handleError(e) }
  }

  initConfig()
}

async function initConfig() {
  let config = {}
  try { config = await readJSON(opts.get('configFile')) }
  catch(e) { await writeJSON(opts.get('configFile'), config) }
  finally { opts.set('config', config) }
}

export async function setServerState() {
  try {
    await writeState((state, write) => {
      state.port = opts.get('port')
      state.wport = wport()
      write(state)
    })
  }
  catch(e) {
    handleError(e)
  }
}

export default { init, readState, writeState, setServerState }
