var makeConf = require('./webpack.base');

module.exports = makeConf({
  target: 'web',
  name: 'prod',
  prod: true,
  dedupe: true,
  env: 'production',
  minify: true
})
