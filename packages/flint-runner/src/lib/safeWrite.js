import { handleError, log, readJSON, writeJSON } from './fns'

// uses a simple lock to ensure reads and writes are done safely

export default function factory(filePath, { debug = 'safeWrite' }) {

  // return read/write
  return { read, write }

  async function read() {
    try {
      const state = await readJSON(filePath)
      return state
    }
    catch(e) {
      // console.log('error reading state', e)
      return {}
    }
  }

  async function write(writer) {
    try {
      log(debug, 'waiting...')
      if (lock) await lock
      log(debug, 'get lock')
      const unlock = getLock()
      const state = await read()
      await stateWriter(writer, state, unlock)
    }
    catch(e) {
      handleError(e)
    }
  }

  // private

  let lock = null
  let unlock = null

  function getLock() {
    log(debug, 'lock', lock)

    if (lock)
      return unlock
    else {
      log(debug, 'no lock, returning new')
      lock = new Promise(res => {
        unlock = () => {
          lock = null
          res()
        }
      })

      return unlock
    }
  }

  function stateWriter(writer, state, unlock) {
    log(debug, 'about to call writer...')
    return new Promise((res, rej) => {
      writer(state, async next => {
        try {
          log(debug, 'next state', next)
          await writeJSON(filePath, next, { spaces: 2 })
          log(debug, 'unlocking')
          unlock()
          res()
        }
        catch(e) {
          rej(e)
        }
      })
    })
  }

}