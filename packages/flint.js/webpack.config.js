var makeConf = require('./webpack.base');

module.exports = makeConf({
  env: 'development',
  minify: false
})