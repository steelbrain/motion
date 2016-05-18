/* @flow */

import Path from 'path'
import Pundle from 'pundle'
import PundleDev from 'pundle-dev'
import send from 'send'
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

export async function getPundleInstance(state: State, config: Motion$Config, cli: CLI, terminal: boolean, development: boolean, errorCallback: Function): Object {
  const pundleConfig = {
    hmr: development,
    entry: [require.resolve('babel-regenerator-runtime'), config.rootDirectory],
    rootDirectory: config.rootDirectory,
    resolve: {
      root: config.rootDirectory
    },
    replaceVariables: {
      'process.env.NODE_ENV': `"${development ? 'development' : 'production'}"`
    }
  }
  const plugins = [[require.resolve('pundle-npm-installer'), {
    save: state.get().npm_save,
    rootDirectory: config.rootDirectory,
    onBeforeInstall(id, name) {
      if (terminal) {
        const message = `Installing ${name}`
        cli.addSpinner(message)
      }
    },
    onAfterInstall(id, name, error) {
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
  }], [require.resolve('babel-pundle'), {
    config: {
      presets: [require.resolve('babel-preset-motion')]
    },
    ignored: /(node_modules|bower_components|\.motion)/
  }], require.resolve('./pundle/resolver')]
  if (!development) {
    const pundle = new Pundle(pundleConfig)
    await pundle.loadPlugins(plugins)
    return pundle
  }
  const pundle = new PundleDev({
    pundle: pundleConfig,
    watcher: {
      onError(error) {
        errorCallback(error)
      }
    },
    middleware: {
      sourceMap: true,
      sourceRoot: config.dataDirectory,
      publicPath: '/',
      publicBundlePath: '/_/bundle.js'
    },
    server: {
      port: state.get().web_server_port
    }
  })
  await pundle.pundle.loadPlugins(plugins)
  pundle.server.use('*', function serveRequest(req, res, next, error = false) {
    // Ignore both bundle and it's map
    if (req.baseUrl.indexOf('/_/bundle.js') === 0) {
      next()
      return
    }
    send(req, req.baseUrl, { root: config.dataDirectory, index: 'index.html' })
      .on('error', function() {
        if (error) {
          next()
        } else {
          req.baseUrl = '/index.html'
          serveRequest(req, res, next, true)
        }
      })
      .on('directory', function() {
        next()
      })
      .pipe(res)
  })
  return pundle
}
