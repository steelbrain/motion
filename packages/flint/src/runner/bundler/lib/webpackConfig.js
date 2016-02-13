import deepmerge from 'deepmerge'
import { path, log } from '../../lib/fns'
import opts from '../../opts'
import cache from '../../cache'
import flintjs from 'flint-js'

let runnerRoot = path.resolve(path.join(__dirname, '..', '..', '..', '..'))
let runnerModules = path.join(runnerRoot, 'node_modules')

// copy styles into .flint/static/styles
let fileStyleFolder = 'file?name=assets/styles/[name]-[hash].css'

export default function webpackConfig(filename, config = {}) {
  const conf = deepmerge({
    context: runnerRoot,
    debug: opts('debug'),
    output: {
      // app/.flint/.internal/deps
      path: opts('deps').dir,
      filename,
      library: `${opts('saneName')}-${filename.replace('.js', '')}`,
      libraryTarget: 'commonjs'
    },
    // come from flint.js
    externals: {
      react: 'exports.React',
      'react-dom': 'exports.ReactDOM',
      history: 'exports.history',
      radium: 'exports.radium',
    },
    devtool: 'source-map',
    node: {
      global: false,
      Buffer: false,
      setImmediate: false
    },
    resolveLoader: { root: runnerModules },
    resolve: {
      root: opts('flintDir'),
      modulesDirectories: ['node_modules'],
      extensions: ['', '.js', '.jsx', '.css'],
      fallback: [
        runnerModules,
        // path.join(flintRoot, '..') // fallback to app root for import css
      ]
    },
    module: {
      loaders: [
        { test: /\.(ttf|eot|woff|svg)$/, loader: 'file?name=assets/files/[name]-[hash].[ext]' },
        { test: /\.json$/, loader: 'json' },

        {
          test: /\.css$/,
          loaders: [
            fileStyleFolder,
            'css?module&importLoaders=1'
          ]
        },

        {
          test: /\.(png|jpg|gif)$/,
          loader: 'url?limit=8192&name=[name]-[hash].[ext]'
        }
      ]
    }
  }, config)

  log('bundler', '------------webpackConfig------------'.yellow, conf)

  return conf
}