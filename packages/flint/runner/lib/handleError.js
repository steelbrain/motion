import bridge from '../bridge'
import raven from 'raven'

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
        console.error('ERROR'.bold.red, err)
        process.exit(1)
        return
      }

      handle && handle(...args)
    }
  }
  // if used in try/catch
  else {
    const error = handle
    errorClient.captureException(error)

    console.error((error && error.message || "\nEncountered an internal error").bold.red)

    if (Array.isArray(error))
      console.log(...error)

    if (typeof error == 'string')
      console.log(error)

    if (error.stack)
      console.log(error.stack)

    console.log(error)
    bridge.message('compile:error', { error }, 'error')
  }
}