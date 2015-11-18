var supportGen = require('node-generator-detector')

if (supportGen()) {
  var runner = require('./lib/modern')
  module.exports = runner.run
}
else {
  var runner = require('./lib/compat')
  module.exports = runner.run
}