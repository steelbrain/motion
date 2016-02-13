require('shelljs/global')

cd(__dirname)
console.log(exec('webpack --config webpack.config.release.js').output)