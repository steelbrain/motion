var makeConf = require('./webpack.base');

module.exports = makeConf({
  name: 'node',
  entry: { flint: './src/flint' },
  env: 'production',
  target: 'node',
  libraryTarget: 'umd'
})
