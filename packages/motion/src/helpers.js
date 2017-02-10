/* @flow */

import Path from 'path'
import chalk from 'chalk'
import Pundle from 'pundle'
import { createPlugin } from 'pundle-api'
import { createServer } from 'pundle-dev'
import { CompositeDisposable } from 'sb-event-kit'

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
      require.resolve('babel-preset-es2015-sane'),
      require.resolve('babel-preset-motion'))
  }
  config.babel.plugins = config.babel.plugins.map(function(givenEntry) {
    if (!givenEntry) {
      return givenEntry
    }
    const entry = Array.isArray(givenEntry) ? givenEntry : [givenEntry, {}]
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
): Promise<{ pundle: Object, subscription: CompositeDisposable }> {
  const config = normalizeConfig(projectPath, givenConfig)
  const pundleEntry = ['./']

  const subscription = new CompositeDisposable()
  const pundle = await Pundle.create({
    entry: pundleEntry,
    presets: [[require.resolve('pundle-preset-default'), {
      generator: {
        pathType: config.pathType === 'number' ? 'number' : 'filePath',
      },
      reporter: {
        log: o => cli.log(o),
      },
    }]],
    components: [
      require.resolve('pundle-plugin-dedupe'),
      [require.resolve('pundle-plugin-npm-installer'), {
        save: config.saveNpmModules,
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
            // ^ To insert a new line to allow default logger of Pundle to output
          } else if (error) {
            errorCallback(error)
          }
        },
        include: ['*.js'],
      }],
      [require.resolve('pundle-transformer-babel'), {
        babelPath: require.resolve('babel-core'),
        config: config.babel,
        extensions: ['js'],
      }],
      createPlugin(function(_: Object, file: Object) {
        if (development) {
          if ((file.filePath.indexOf(projectPath) === 0 && file.filePath.indexOf('node_modules') === -1) || process.env.MOTION_DEBUG_TICK_ALL) {
            const relative = Path.relative(projectPath, file.filePath)
            cli.log(`${chalk.dim(Path.join('$root', relative.substr(0, 2) === '..' ? file.filePath : relative))} ${chalk.green(TICK)}`)
          }
        }
      }),
    ],
    rootDirectory: projectPath,
    replaceVariables: {
      'process.env.NODE_ENV': JSON.stringify(development ? 'development' : 'production'),
    },
  })
  subscription.add(pundle)

  if (!development) {
    return { pundle, subscription }
  }
  const server = await createServer(pundle, {
    port: config.webServerPort,
    rootDirectory: config.publicDirectory,
    hmrPath: '/_/bundle_hmr',
    bundlePath: '/_/bundle.js',
    publicPath: '/',
    sourceMapPath: '/_/bundle.js.map',
    redirectNotFoundToIndex: true,
  })
  subscription.add(server)

  return { pundle, subscription }
}
