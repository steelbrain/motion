var webpack = require('webpack');
var path = require('path');

module.exports = function(opts) {
  var entry = {
    motion: './client/motion',
    devtools: './tools/index',
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
    // splitBabelRuntime(opts.name)
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
    plugins.push(new webpack.optimize.CommonsChunkPlugin('react', 'react.'+name+'.js'))
    entry.react = ['react', 'react-dom']
  }

  // function splitBabelRuntime(name) {
  //   plugins.push(new webpack.optimize.CommonsChunkPlugin('babel-runtime', 'babel-runtime.'+name+'.js'))
  //   entry['babel-runtime'] = ['babel-runtime']
  // }

  var target = opts.libraryTarget || 'commonjs'

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
          loader: 'babel',
          query: {
            presets: [
              'es2015',
              'stage-2',
              'react'
            ],
            plugins: [
              'syntax-flow',
              'transform-flow-strip-types',
              'transform-runtime'
            ]
          },
          include: [path.resolve(__dirname, 'client'), path.resolve(__dirname, 'tools')],
          exclude: [path.resolve(__dirname, 'client', 'vendor')]
        },
        { test: /\.json$/, loader: 'json-loader' },
      ]
    },

    output: {
      path: path.join(__dirname, 'dist'),
      filename: opts.name ? '[name].'+opts.name+'.js' : '[name].js',
      // libraryTarget: target || opts.libraryTarget
    },

    plugins: plugins
  }
}
