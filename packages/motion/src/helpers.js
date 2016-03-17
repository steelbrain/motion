/* @flow */

import Path from 'path'
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

export function getWebpackConfig(state: State, config: Motion$Config, cli: CLI, terminal: boolean): Object {
  const configuration = {
    entry: {
      app: './index.js'
    },
    output: {
      path: Path.join(config.dataDirectory, 'dist'),
      filename: 'bundle.js'
    },
    plugins: [
      new WebPackPluginNPM({
        save: state.get().npm_save,
        onStarted(jobID: number, dependencies: Array<Array<string>>) {
          if (terminal) {
            const dependencyNames = dependencies.map(function(dependency) {
              return dependency[0]
            })
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
    ]
  }
  return configuration
}
