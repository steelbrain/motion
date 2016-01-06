import deepmerge from 'deepmerge'
import path from 'path'
import opts from '../../opts'
import cache from '../../cache'
import flintjs from 'flint-js'

// __dirname == flint-runner/dist directory (because we webpack this)
let runnerRoot = path.resolve(path.join(__dirname, '..'))
let runnerModules = path.join(runnerRoot, 'node_modules')

let flintRoot = flintjs()
let flintModules = path.join(flintRoot, 'node_modules')

// copy styles into .flint/static/styles
let styleFileLoader = 'file?name=assets/styles/[name]-[hash].css'

export default (filename, config = {}) => deepmerge({
  context: runnerRoot,
  output: {
    // app/.flint/.internal/deps
    path: opts.get('deps').dir,
    filename
  },
  // come from flint.js
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    bluebird: '_bluebird'
  },
  devtool: 'source-map',
  node: {
    global: false,
    Buffer: false,
    setImmediate: false
  },
  resolveLoader: { root: runnerModules },
  resolve: {
    root: [
      opts.get('flintDir'), // user modules in app/.flint
      runnerModules, // babel-runtime in runner
      flintModules // react, react-dom, bluebird in flint.js
    ],
    extensions: ['', '.js', '.jsx', '.scss']
  },
  module: {
    loaders: [
      { test: /\.(ttf|eot|woff|svg)$/, loader: 'file?name=assets/files/[name]-[hash].[ext]' },
      { test: /\.json$/, loader: 'json' },
      { test: /\.jsx$/, loader: 'babel' },

      {
        test: /\.css$/,
        loaders: [
          styleFileLoader,
          'css?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]'
        ]
      },

      {
        test: /\.(png|jpg|gif)$/,
        loader: 'url?limit=8192&name=[name]-[hash].[ext]'
      },

      {
        test: /\.scss$/,
        loaders: [
          styleFileLoader,
          // 'resolve-url',
          // 'style',
          'css?sourceMap&modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]',
          'sass?sourceMap'
        ]
      }
    ]
  }
}, config)
