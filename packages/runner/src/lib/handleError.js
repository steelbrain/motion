module.exports = function handleError(handle) {
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
  }
}
