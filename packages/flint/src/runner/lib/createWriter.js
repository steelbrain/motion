import { handleError, log, writeFile, readFile } from './fns'

// uses a simple lock to ensure reads and writes are done safely

export default async function createWriter(filePath, { debug = '', json = false, defaultValue = '' }) {
  // helpers
  const logw = log.writer.bind(null, debug.yellow)


  // constructor
  try {         await read() }
  catch(e) {
    try {       await write((_, write) => write(defaultValue)) }
    catch(e) {  handleError(e) }
  }

  // API
  return {
    read,
    write,
    hasChanged
  }

  // internal state
  let cache = null
  let cacheStr = null
  let _hasChanged = false

  // public
  async function read() {
    try {
      if (cache) return cache
      let state = await readFile(filePath)

      cacheStr = state

      if (json) {
        state = JSON.parse(state)
        cache = state
      }

      return state
    }
    catch(e) {
      logw('read error'.red, e)
      return defaultValue
    }
  }

  async function write(writer) {
    try {
      // logw('waiting...')
      if (lock) await lock
      const unlock = getLock()
      const state = await read()
      let result = await stateWriter(writer, state, unlock)
    }
    catch(e) {
      handleError(e)
    }
  }

  function hasChanged() {
    let result = _hasChanged
    logw('hasChanged?', result)
    _hasChanged = false
    return result
  }


  // private
  let lock = null
  let unlock = null

  function getLock() {
    // logw('lock', lock)

    if (lock)
      return unlock
    else {
      // logw('no lock, returning new')
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
    // logw('about to call writer...')
    return new Promise((res, rej) => {
      writer(state, async toWrite => {
        const finish = () => {
          unlock()
          res()
        }

        let toWriteRaw

        // do this before doing equality checks for cache
        if (json) {
          toWriteRaw = toWrite
          toWrite = JSON.stringify(toWrite)
        }

        if (cacheStr == toWrite) {
          logw('hasnt changed!'.bold)
          finish()
          return
        }

        try {
          await writeFile(filePath, toWrite)

          _hasChanged = true
          cacheStr = toWrite
          cache = toWriteRaw

          finish()
        }
        catch(e) {
          rej(e)
        }
      })
    })
  }

}