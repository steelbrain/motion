import opts from './opts'
import wport from './lib/wport'
import { log, handleError, readJSON, writeJSON } from './lib/fns'

let OPTS
const LOG = 'writeState'

export async function readState() {
  try {
    const state = await readJSON(opts.get('stateFile'))
    opts.set('state', state)
    return state
  }
  catch(e) {
    // console.log('error reading state', e)
    return {}
  }
}

let lock = null

function getLock() {
  log(LOG, 'lock', lock)
  if (lock) return lock
  else {
    log(LOG, 'no lock, returning new')
    let resolver
    lock = new Promise(res => {
      resolver = () => {
        lock = null
        res()
      }
    })
    return resolver
  }
}

function stateWriter(writer, state, unlock) {
  return new Promise((res, rej) => {
    log(LOG, 'calling writer')
    writer(state, async next => {
      try {
        log(LOG, 'next state', next)
        await writeJSON(opts.get('stateFile'), next, { spaces: 2 })
        log(LOG, 'unlocking')
        unlock()
        res()
      }
      catch(e) {
        rej(e)
      }
    })
  })
}

// prompts for domain they want to use
export async function writeState(writer) {
  try {
    log(LOG, 'waiting...')
    if (lock) await lock
    log(LOG, 'get lock')
    const unlock = getLock()
    log(LOG, 'got lock', unlock)
    const state = await readState()
    await stateWriter(writer, state, unlock)
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
    await writeState((state, write) => {
      write({})
    })
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
  await writeState((state, write) => {
    state.port = opts.get('port')
    state.wport = wport()
    write(state)
  })
}

export default { init, readState, writeState, setServerState }