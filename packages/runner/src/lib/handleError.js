module.exports = function handleError(cb) {
  return function(err, ...args) {
    if (err) {
      console.log(err)
      // process.exit(1);
      return
    }

    cb && cb(...args)
  }
}
