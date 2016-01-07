var execSync = require('child_process').execSync

var result = execSync(
  'node ../../node_modules/webpack/bin/webpack --config webpack.config.release.js'
)

console.log(result.toString())