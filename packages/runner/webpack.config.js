var webpack = require('webpack')
var path = require('path')
var fs = require('fs')
var nodeModules = fs.readdirSync('node_modules')

module.exports = {
  entry: './src/index.js',
  target: 'node',
  output: {
    library: 'flint-runner',
    libraryTarget: 'umd',
    path: path.join(__dirname, 'dist'),
    filename: 'index.js'
  },
  node: {
    Buffer: false,
    global: false,
    process: false,
    setImmediate: false,
    __filename: true,
    __dirname: true
  },
  externals: [
    function(context, request, callback) {
      var pathStart = request.split('/')[0];
      if (nodeModules.indexOf(pathStart) >= 0 && request != 'webpack/hot/signal.js') {
        return callback(null, "commonjs " + request);
      };
      callback();
    }
  ],
  plugins: [
    new webpack.IgnorePlugin(/\.(css|less)$/),
    // new webpack.BannerPlugin('require("source-map-support").install()',
    //                          { raw: true, entryOnly: false })
  ],
  // devtool: 'sourcemap',
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