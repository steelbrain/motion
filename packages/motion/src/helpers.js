/* @flow */

import Path from 'path'
import webpack from 'webpack'
import WebPackPluginNPM from 'motion-webpack-npm'
import WebPackResolver from './webpack/resolver'
import { DIRECTORY_NAME } from './config'
import type CLI from './cli'
import type State from './state'
import type { Motion$Config } from './types'

const installationsInProgress: Map<number, {
  names: Array<string>,
  status: boolean,
  message: string
}> = new Map()

export const X = '✗'
export const TICK = '✓'
const WEBPACK_ERROR_REGEX = /ERROR in (.*)\n([\S \n]+)/

export function fillConfig(config: Motion$Config) {
  if (typeof config.dataDirectory !== 'string') {
    config.dataDirectory = Path.join(config.rootDirectory, DIRECTORY_NAME)
  }
}

export function getLocalModulePath(name: string): string {
  return Path.dirname(require.resolve(`${name}/package.json`))
}

// From: goo.gl/fZA6BF
export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min
}

export function getWebpackConfig(state: State, config: Motion$Config, cli: CLI, terminal: boolean, development: boolean): Object {
  const configuration = {
    context: config.dataDirectory,
    devtool: null,
    entry: ['motion-runtime/lib/app'],
    output: {
      path: Path.join(config.dataDirectory, '_'),
      filename: 'bundle.js',
      publicPath: '/_/'
    },
    plugins: [
      new WebPackPluginNPM({
        save: state.get().npm_save,
        onStarted(jobID: number, dependencies: Array<Array<string>>) {
          if (terminal) {
            const names = dependencies.map(dependency => dependency[0])
            const message = `Installing ${names.join(', ')}`
            installationsInProgress.set(jobID, {
              names,
              status: true,
              message
            })
            cli.addSpinner(message)
          }
        },
        onProgress(jobID: number, packageName: string, error: ?Error) {
          if (terminal && error) {
            cli.log('Error installing dependency', packageName, error)
            const info = installationsInProgress.get(jobID)
            if (info) {
              info.status = false
            }
          }
        },
        onComplete(jobID: number) {
          const info = installationsInProgress.get(jobID)
          if (info) {
            cli.removeSpinner(info.message)
            cli.log(`Install ${info.names.join(', ')} ${info.status ? TICK : X}`)
          }
        }
      }),
      new WebPackResolver(config)
    ],
    resolve: {
      root: config.rootDirectory,
      modulesDirectories: [
        Path.join(config.dataDirectory, 'node_modules'),
        Path.join(Path.normalize(Path.join(__dirname, '..')), 'node_modules'),
        Path.join(Path.normalize(Path.join(__dirname, '..', '..')), 'node_modules')
      ],
      packageMains: ['webpack', 'browser', 'web', 'browserify', 'main', 'jsnext:main']
    },
    module: {
      loaders: [{
        test: /\.js$/,
        loader: require.resolve('babel-loader'),
        include: Path.join(config.rootDirectory),
        exclude: /(node_modules|bower_components|\.motion)/,
        query: {
          presets: [require.resolve('babel-preset-motion')]
        }
      }]
    }
  }

  if (state.getConfig().include_polyfills) {
    configuration.entry.unshift('babel-polyfill')
  }

  if (development) {
    // $FlowIgnore: Why don't you let me replace a null with a string?!
    configuration.devtool = 'source-map'
    configuration.plugins.push(new webpack.HotModuleReplacementPlugin())
    configuration.entry.unshift(`webpack-dev-server/client?http://localhost:${state.get().web_server_port}/`,
      'webpack/hot/dev-server')
  }

  const bundledPackages = ['webpack', 'webpack-dev-server', 'motion-runtime', 'babel-core', 'babel-loader']
  for (const packageName of bundledPackages) {
    configuration.resolve.modulesDirectories.push(Path.join(getLocalModulePath(packageName), 'node_modules'))
  }

  return configuration
}

export function webPackErrorFromStats(stats: Object): ?Error {
  if (!(stats.hasErrors() || stats.hasWarnings())) {
    return null
  }
  const stringish = stats.toString()
  const matches = WEBPACK_ERROR_REGEX.exec(stringish)
  if (matches) {
    return new Error(matches[2], matches[1])
  }
  return stringish
}
