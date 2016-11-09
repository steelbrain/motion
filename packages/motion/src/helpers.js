/* @flow */

import Path from 'path'
import send from 'send'
import chalk from 'chalk'
import Pundle from 'pundle'
import PundleDev from 'pundle-dev'
import type CLI from './cli'
import type { Config } from './types'

export const X = '✗'
export const TICK = '✓'

// From: goo.gl/fZA6BF
export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min
}

// NOTE: The reason we are not replacing these in config is because when we then save the config
// We'd end up with absolute paths in it, using this function in every config user function
// will let us avoid that.
export function normalizeConfig(projectPath: string, givenConfig: Config): Config {
  const config: Config = Object.assign({}, givenConfig, {
    babel: Object.assign({}, givenConfig.babel)
  })
  if (config.bundleDirectory.substr(0, 1) === '.') {
    config.bundleDirectory = Path.resolve(projectPath, config.bundleDirectory)
  }
  if (config.publicDirectory.substr(0, 1) === '.') {
    config.publicDirectory = Path.resolve(projectPath, config.publicDirectory)
  }
  if (!config.babel || typeof config.babel !== 'object') {
    config.babel = { plugins: [], presets: [] }
  }
  if (!Array.isArray(config.babel.plugins)) {
    config.babel.plugins = []
  } else {
    config.babel.plugins = config.babel.plugins.slice()
  }
  if (!Array.isArray(config.babel.presets)) {
    config.babel.presets = []
  } else {
    config.babel.presets = config.babel.presets.slice()
  }
  if (config.babel.presets.indexOf('babel-preset-motion') !== -1) {
    config.babel.presets.splice(config.babel.presets.indexOf('babel-preset-motion'), 1,
      require.resolve(config.includePolyfills ? 'babel-preset-es2015' : 'babel-preset-es2015-sane'),
      require.resolve('babel-preset-motion'))
  }
  config.babel.plugins = config.babel.plugins.map(function(givenEntry) {
    if (!givenEntry) {
      return givenEntry
    }
    const entry = Array.isArray(givenEntry) ? givenEntry : [givenEntry, {}]
    if (entry[0] === 'gloss/transform') {
      entry[0] = require.resolve('gloss/transform')
    }
    if (!Path.isAbsolute(entry[0])) {
      if (entry[0].substr(0, 1) === '.') {
        entry[0] = Path.resolve(projectPath, entry[0])
      } else {
        entry[0] = Path.join(projectPath, 'node_modules', entry[0])
      }
    }
    return entry
  })
  return config
}

export async function getPundleInstance(
  cli: CLI,
  terminal: boolean,
  projectPath: string,
  development: boolean,
  givenConfig: Config,
  errorCallback: Function
): Object {
  const config = normalizeConfig(projectPath, givenConfig)
  const pundleEntry = config.includePolyfills &&
    Array.isArray(givenConfig.babel.presets) && givenConfig.babel.presets.indexOf('babel-preset-motion') !== -1 ?
    [require.resolve('babel-regenerator-runtime'), 'index.js'] :
    ['index.js']
  const pundleConfig = {
    entry: pundleEntry,
    pathType: config.pathType === 'number' ? 'number' : 'filePath',
    rootDirectory: config.bundleDirectory,
    replaceVariables: {
      'process.env.NODE_ENV': development ? 'development' : 'production'
    }
  }

  const plugins = [
    [require.resolve('pundle-npm-installer'), {
      save: config.saveNpmModules,
      rootDirectory: config.bundleDirectory,
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
    [require.resolve('babel-pundle'), { config: config.babel }]
  ]

  if (!development) {
    const pundle = new Pundle(pundleConfig)
    await pundle.loadPlugins(plugins)
    return pundle
  }
  const pundle = new PundleDev({
    server: {
      hmr: true,
      port: config.webServerPort,
      hmrPath: '/_/bundle_hmr',
      bundlePath: '/_/bundle.js',
      sourceRoot: config.publicDirectory,
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
    send(req, req.baseUrl, { root: config.publicDirectory, index: 'index.html' })
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
      cli.log(`${chalk.dim(filePath)} ${chalk.green(TICK)}`)
    }
  })
  return pundle
}
