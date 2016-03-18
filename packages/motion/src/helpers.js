/* @flow */

import Path from 'path'
import webpack from 'webpack'
import WebPackPluginNPM from 'motion-webpack-npm'
import { DIRECTORY_NAME } from './config'
import type CLI from './cli'
import type State from './state'
import type { Motion$Config } from './types'

const INSTALLATION_MESSAGE: Map<number, string> = new Map()

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
    entry: ['motion-runtime', '../index.js'],
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
            const dependencyNames = dependencies.map(dependency => dependency[0])
            const installationMessage = `Installing ${dependencyNames.join(', ')}`
            INSTALLATION_MESSAGE.set(jobID, installationMessage)
            cli.addSpinner(installationMessage)
          }
        },
        onProgress(_: number, packageName: string, error: ?Error) {
          if (terminal && error) {
            cli.log('Error installing dependency', packageName, error)
          }
        },
        onComplete(jobID: number) {
          const message = INSTALLATION_MESSAGE.get(jobID)
          if (message) {
            cli.removeSpinner(message)
            INSTALLATION_MESSAGE.delete(jobID)
          }
        }
      })
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
    configuration.entry.unshift(`webpack-dev-server/client?http://localhost:${state.get().web_server_port}/`, 'webpack/hot/only-dev-server')
  }

  return configuration
}
