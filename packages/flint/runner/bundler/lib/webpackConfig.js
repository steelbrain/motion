import deepmerge from 'deepmerge'
import path from 'path'
import opts from '../../opts'
import cache from '../../cache'
import flintjs from 'flint-js'

// __dirname == flint/dist directory (because we webpack this)
let runnerRoot = path.resolve(path.join(__dirname, '..'))
let runnerModules = path.join(runnerRoot, 'node_modules')

let flintRoot = path.resolve(path.join(__dirname, '..'))
let flintModules = path.join(flintRoot, 'node_modules')

// copy styles into .flint/static/styles
let fileStyleFolder = 'file?name=assets/styles/[name]-[hash].css'

export default (filename, config = {}) => deepmerge({
  context: runnerRoot,
  debug: opts.get('debug'),
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
    root: opts.get('flintDir'),
    modulesDirectories: ['node_modules'],
    extensions: ['', '.js', '.jsx', '.scss'],
    fallback: [ runnerModules, flintModules, /* babel-runtime may be in either depending on npm */ ]
  },
  module: {
    loaders: [
      { test: /\.(ttf|eot|woff|svg)$/, loader: 'file?name=assets/files/[name]-[hash].[ext]' },
      { test: /\.json$/, loader: 'json' },

      {
        test: /\.css$/,
        loaders: [
          fileStyleFolder,
          'css?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]'
        ]
      },

      {
        test: /\.(png|jpg|gif)$/,
        loader: 'url?limit=8192&name=[name]-[hash].[ext]'
      },

      // let users config this
      // {
      //   test: /\.scss$/,
      //   loaders: [
      //     fileStyleFolder,
      //     'style',
      //     'css?sourceMap&modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]',
      //     // 'sass?sourceMap'
      //   ]
      // }
    ]
  }
}, config)
