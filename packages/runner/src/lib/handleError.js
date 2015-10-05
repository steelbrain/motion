module.exports = function handleError(res, rej) {
  return function(err, ...args) {
    if (err) {
      console.log(err)
      rej && rej(err)
      // process.exit(1);
      return
    }

    res && res(...args)
  }
}
