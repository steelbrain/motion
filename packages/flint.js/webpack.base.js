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
        NODE_ENV: JSON.stringify(opts.env || 'production')
      }
    })
    // , new webpack.PrefetchPlugin(['react'])
  ]

  if (opts.target != 'node') {
    splitReact(opts.env)
  }

  if (opts.target == 'node') {
    plugins.push(
      new webpack.ProvidePlugin({
        'fetch': 'imports?this=>global!exports?global.fetch!node-fetch'
      })
    )
  }

  if (opts.minify)
    plugins.push(
      new webpack.optimize.UglifyJsPlugin({
        compress: { warnings: false }
      })
    )

  if (opts.dedupe)
    plugins.push(
      new webpack.optimize.DedupePlugin()
    )

  function splitReact(env) {
    plugins.push(new webpack.optimize.CommonsChunkPlugin('react', 'react.'+env+'.js'))
    entry.react = ['react']
  }

  return {
    target: opts.target || 'web',
    entry: opts.entry || entry,
    module: {
      loaders: [
        {
          test: /\.js$/,
          loader: 'babel-loader?{"stage": 0}',
          include: [path.resolve(__dirname, 'src')]
        },
        { test: /\.json$/, loader: 'json-loader' },
      ]
    },

    output: {
      path: path.join(__dirname, 'dist'),
      filename: opts.name ? '[name].'+opts.name+'.js' : '[name].js',
      libraryTarget: opts.libraryTarget
    },

    plugins: plugins,

    resolve: {
      root: path.resolve(__dirname, 'node_modules')
    }
  }
}
