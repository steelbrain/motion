var supportGen = require('node-generator-detector')

if (supportGen()) {
  module.exports = require('./lib/modern')
}
else {
  module.exports = require('./lib/compat')
}