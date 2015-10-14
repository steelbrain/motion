import raven from 'raven'

const errorClient = new raven.Client('https://196a18bffe5f4859bb48bbdbef4d6375:d92602c84a694bd6ab31ef3051fe8bd5@app.getsentry.com/55034')

export default function handleError(handle) {
  // if used for callback
  if (typeof handle == 'function') {
    return function(err, ...args) {
      if (err) {
        console.error('Error'.bold.red, err)
        process.exit(1)
        return
      }

      handle && handle(...args)
    }
  }
  // if used in try/catch
  else {
    console.log(handle.stack)
    errorClient.captureException(handle)
  }
}
