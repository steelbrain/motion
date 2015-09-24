module.exports = function handleError(cb) {
  return function(err) {
    if (err) {
      console.log(err)
      // process.exit(1);
    }
    else {
      cb.apply(
        this,
        Array.prototype.slice.call(arguments, 1)
      )
    }
  }
}
