import { handleError, log, readJSON, writeJSON, writeFile, readFile } from './fns'

// uses a simple lock to ensure reads and writes are done safely

export default async function createWriter(filePath, { debug = '', json = false, defaultValue = '' }) {
  const logw = log.writer.bind(null, debug.yellow)

  let doRead = json ? readJSON : readFile
  let doWrite = json ? (a, b) => writeJSON(a, b, { spaces: 2 }) : writeFile

  // init file
  try {
    await read()
  }
  catch(e) {
    try {
      await write((_, write) => write(defaultValue))
    }
    catch(e) {
      handleError(e)
    }
  }

  // return API
  return { read, write }

  async function read() {
    try {
      const state = await doRead(filePath)
      return state
    }
    catch(e) {
      logw('read error'.red, e)
      return defaultValue
    }
  }

  async function write(writer) {
    try {
      logw('waiting...')
      if (lock) await lock
      logw('get lock')
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
    logw('lock', lock)

    if (lock)
      return unlock
    else {
      logw('no lock, returning new')
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
    logw('about to call writer...')
    return new Promise((res, rej) => {
      writer(state, async next => {
        try {
          await doWrite(filePath, next)
          logw('unlocking')
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