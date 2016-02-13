var makeConf = require('./webpack.base');

module.exports = makeConf({
  name: 'node',
  entry: { motion: './src/motion' },
  env: 'production',
  target: 'node',
  libraryTarget: 'umd'
})
