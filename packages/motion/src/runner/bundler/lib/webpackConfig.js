import { _, path, log } from '../../lib/fns'
import opts from '../../opts'
import cache from '../../cache'
import NpmInstallPlugin from 'npm-install-webpack-plugin'
import extend from 'deep-extend'

let runnerRoot = path.resolve(path.join(__dirname, '..', '..', '..', '..'))
let runnerModules = path.join(runnerRoot, 'node_modules')

// copy styles into .motion/static/styles
let fileStyleFolder = 'file?name=assets/styles/[name]-[hash].css'

export default function webpackConfig(filename, config = {}) {
  let result = extend({
    context: runnerRoot,
    debug: opts('debug'),
    output: {
      // app/.motion/.internal/deps
      path: opts('deps').dir,
      filename,
      library: `${opts('saneName')}-${filename.replace('.js', '')}`,
      libraryTarget: 'commonjs'
    },
    // from motion-client
    externals: {
      react: 'exports.React',
      'react-dom': 'exports.ReactDOM',
      'react-addons-css-transition-group': 'exports.ReactCSSTransitionGroup',
      'react-addons-transition-group': 'exports.ReactTransitionGroup',
      history: 'exports.history',
      radium: 'exports.radium',
      'babel-polyfill': 'var $',
    },
    devtool: 'source-map',
    node: {
      global: false,
      Buffer: false,
      setImmediate: false
    },
    resolveLoader: { root: runnerModules },
    resolve: {
      root: opts('motionDir'),
      modulesDirectories: ['node_modules'],
      extensions: ['', '.js', '.jsx'],
      fallback: [
        runnerModules,
        // path.join(motionRoot, '..') // fallback to app root for import css
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

  // const npmInstall = new NpmInstallPlugin()
  // result.plugins = [npmInstall]

  return result
}
