var makeConf = require('./webpack.base');

module.exports = makeConf({
  name: 'dev',
  env: 'development',
  minify: false
})