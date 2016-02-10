var webpack = require('webpack')
var path = require('path')
var fs = require('fs')
var _ = require('lodash')

var nodeModules = fs.readdirSync('node_modules')

var banners = [
  'require("source-map-support").install();'
].join("\n")

module.exports = {
  entry: {
    // runner server separate
    serverProcess: './runner/serverProcess',

    // cli
    flint: './cli/flint',
    'flint-build': './cli/flint-build',
    'flint-new': './cli/flint-new',
    'flint-run': './cli/flint-run',
    'flint-update': './cli/flint-update',
    'flint-up': './cli/flint-up',
  },
  target: 'node',
  devtool: 'sourcemap',
  output: {
    library: 'flint',
    libraryTarget: 'umd',
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },
  node: {
    Buffer: false,
    global: false,
    exec: false,
    process: false,
    setImmediate: false,
    __filename: false,
    __dirname: false
  },
  externals: [
    function(context, request, callback) {
      if (/user-config$/.test(request)) {
        console.log(request)
        return callback(null, request)
      }

      var pathStart = request.split('/')[0];
      if (nodeModules.indexOf(pathStart) >= 0 && request != 'webpack/hot/signal.js') {
        return callback(null, "commonjs " + request);
      };
      callback();
    }
  ],
  plugins: [
    new webpack.BannerPlugin(banners, { raw: true, entryOnly: false })
  ],
  // resolve babel-loader, json-loader, webpack from root to avoid install time
  resolveLoader: { root: path.join(__dirname, '..', '..', 'node_modules') },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: { stage: 1 }
      },
      { test: /\.json$/, loader: 'json-loader' }
    ],
  }
}
