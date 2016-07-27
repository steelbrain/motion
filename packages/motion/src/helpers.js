/* @flow */

import Path from 'path'
import send from 'send'
import chalk from 'chalk'
import Pundle from 'pundle'
import PundleDev from 'pundle-dev'
import { DIRECTORY_NAME } from './config'
import type CLI from './cli'
import type State from './state'
import type { Motion$Config } from './types'

export const X = '✗'
export const TICK = '✓'

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

export async function getPundleInstance(
  state: State,
  config: Motion$Config,
  cli: CLI,
  terminal: boolean,
  development: boolean,
  errorCallback: Function
): Object {
  const pundleConfig = {
    entry: [require.resolve('babel-regenerator-runtime'), 'index.js'],
    pathType: development ? 'filePath' : 'number',
    rootDirectory: config.rootDirectory,
    replaceVariables: {
      'process.env.NODE_ENV': development ? 'development' : 'production'
    }
  }

  const userPlugins = (state.config.babel && state.config.babel.plugins || [])
    .map(function(plugin) {
      return plugin.substr(0, 1) === '.' ? Path.join(config.rootDirectory, plugin) : Path.join(config.rootDirectory, 'node_modules', plugin)
    })

  const plugins = [
    [require.resolve('pundle-npm-installer'), {
      save: state.get().npm_save,
      rootDirectory: config.rootDirectory,
      beforeInstall(name) {
        if (terminal) {
          const message = `Installing ${name}`
          cli.addSpinner(message)
        }
      },
      afterInstall(name, error) {
        if (terminal) {
          const message = `Installing ${name}`
          cli.removeSpinner(message)
          if (error) {
            cli.log(`Install ${name} ${X}`)
            cli.log(error)
          } else {
            cli.log(`Install ${name} ${TICK}`)
          }
        } else if (error) {
          errorCallback(error)
        }
      }
    }],
    [require.resolve('babel-pundle'), {
      config: {
        presets: [require.resolve('babel-preset-motion')],
        plugins: userPlugins
      },
      ignored: /(node_modules|bower_components|\.motion)/
    }]
  ]

  if (!development) {
    const pundle = new Pundle(pundleConfig)
    await pundle.loadPlugins(plugins)
    return pundle
  }
  const pundle = new PundleDev({
    server: {
      hmr: true,
      port: state.get().web_server_port,
      hmrPath: '/_/bundle_hmr',
      bundlePath: '/_/bundle.js',
      sourceRoot: config.dataDirectory,
      sourceMapPath: '/_/bundle.js.map',
      error(error) {
        errorCallback(error)
      }
    },
    pundle: pundleConfig,
    watcher: { },
    generator: {
      wrapper: 'hmr',
      sourceMap: true
    }
  })
  await pundle.pundle.loadPlugins(plugins)
  pundle.server.use('*', function serveRequest(req, res, next, error = false) {
    if (['/_/bundle.js', '/_/bundle.js.map', '/_/bundle_hmr'].indexOf(req.baseUrl) !== -1) {
      next()
      return
    }
    send(req, req.baseUrl, { root: config.dataDirectory, index: 'index.html' })
      .on('error', function() {
        if (error) {
          next()
          return
        }
        req.baseUrl = '/index.html'
        serveRequest(req, res, next, true)
      })
      .on('directory', () => next()).pipe(res)
  })
  pundle.pundle.onDidProcess(function({ filePath }) {
    if (filePath.indexOf('$root') === 0 && filePath.indexOf('node_modules') === -1 && filePath.indexOf('../') === -1) {
      cli.log(`${chalk.dim(filePath)} ${chalk.green('✓')}`)
    }
  })
  return pundle
}
