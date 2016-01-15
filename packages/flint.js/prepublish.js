var execSync = require('child_process').execSync

var result = execSync('webpack --config webpack.config.release.js')

console.log(result.toString())