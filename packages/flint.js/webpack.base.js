var webpack = require('webpack');
var path = require('path');

module.exports = function(opts) {
  var entry = {
    flint: './src/main',
    devtools: './src/tools/main',
  }

  var plugins = [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(opts.env || 'production'),
        production: opts.env == 'production'
      }
    })
  ]

  // split react if not node
  if (opts.target != 'node') {
    splitReact(opts.name)
  }

  // if node, shim fetch
  if (opts.target == 'node') {
    plugins.push(
      new webpack.ProvidePlugin({
        'fetch': 'imports?this=>global!exports?global.fetch!node-fetch'
      })
    )
  }

  if (opts.minify)
    plugins.push(
      new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } })
    )

  if (opts.dedupe)
    plugins.push(new webpack.optimize.DedupePlugin())

  function splitReact(name) {
    plugins.push(
      new webpack.optimize.CommonsChunkPlugin('react', 'react.'+name+'.js')
    )
    entry.react = ['react', 'react-dom']
  }

  return {
    target: opts.target || 'web',
    entry: opts.entry || entry,
    devtool: 'source-map',

    node: {
      global: false,
      process: false,
      Buffer: false,
      setImmediate: false
    },

    module: {
      loaders: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          query: {
            stage: 2
          },
          include: [path.resolve(__dirname, 'src')],
          exclude: [path.resolve(__dirname, 'src', 'vendor')]
        },
        { test: /\.json$/, loader: 'json-loader' },
      ]
    },

    output: {
      path: path.join(__dirname, 'dist'),
      filename: opts.name ? '[name].'+opts.name+'.js' : '[name].js'
      // libraryTarget: opts.libraryTarget
    },

    plugins: plugins,

    resolve: {
      root: path.resolve(__dirname, 'node_modules')
    }
  }
}
