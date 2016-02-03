import bridge from '../bridge'
import raven from 'raven'
import logError from './logError'
import unicodeToChar from './unicodeToChar'

const errorClient = new raven.Client('https://196a18bffe5f4859bb48bbdbef4d6375:d92602c84a694bd6ab31ef3051fe8bd5@app.getsentry.com/55034')

// TODO: document error shape

export default function handleError(handle) {
  if (!handle) {
    throw new Error('Null error returned')
  }

  // if used for callback
  if (typeof handle == 'function') {
    return function(err, ...args) {
      if (err) {
        console.error('ERROR'.red, err)
        process.exit(1)
        return
      }

      handle && handle(...args)
    }
  }
  // if used in try/catch
  else {
    // TODO type this
    const error = handle
    if (!error) return console.log('  No error!')
    errorClient.captureException(error)

    error.message = unicodeToChar(error.message)
    error.stack = unicodeToChar(error.stack || error.codeFrame)

    logError(error)

    bridge.broadcast('compile:error', { error }, 'error')
  }
}
