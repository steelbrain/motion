var makeConf = require('./webpack.base');

module.exports = makeConf({
  name: 'prod',
  prod: true,
  dedupe: true,
  env: 'production',
  minify: true
})
