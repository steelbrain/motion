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

export function fillConfig(config: Motion$Config) {
  if (typeof config.dataDirectory !== 'string') {
    config.dataDirectory = Path.join(config.rootDirectory, DIRECTORY_NAME)
  }
}

// From: goo.gl/fZA6BF
export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min
}

export function getWebpackConfig(state: State, config: Motion$Config, cli: CLI, terminal: boolean, development: boolean): Object {
  const configuration = {
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
      modulesDirectories: [Path.join(config.dataDirectory, 'node_modules')],
      packageMains: ['webpack', 'browser', 'web', 'browserify', 'jsnext:main', 'main']
    }
  }

  if (development) {
    // $FlowIgnore: Why don't you let me replace a null with a string?!
    configuration.devtool = 'source-map'
    configuration.plugins.push(new webpack.HotModuleReplacementPlugin())
    configuration.entry.unshift(`webpack-dev-server/client?http://localhost:${state.get().web_server_port}/`,
      'webpack/hot/only-dev-server')
  }

  return configuration
}
