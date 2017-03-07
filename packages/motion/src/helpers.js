/* @flow */

import Path from 'path'
import chalk from 'chalk'
import Pundle from 'pundle'
import PundleDevServer from 'pundle-dev'
import { createPlugin } from 'pundle-api'
import { CompositeDisposable } from 'sb-event-kit'

import type CLI from './cli'
import type { Config } from './types'

// From: goo.gl/fZA6BF
export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min
}

export const TICK = '✓'
export const CONFIG_FILE_NAME = '.motion.json'
export const CONFIG_FILE_DEFAULT = {
  babel: {
    plugins: [],
    presets: ['babel-preset-steelbrain']
  },
  pundle: {
    presets: [],
    components: [],
  },
  pathType: 'filePath',
  saveNpmModules: true,
  get webServerPort() {
    return getRandomNumber(8000, 15000)
  },
  outputDirectory: './dist',
}
export const CONFIG_FILE_OPTIONS = {
  prettyPrint: true,
  createIfNonExistent: false,
}

// NOTE: The reason we are not replacing these in config is because when we then save the config
// We'd end up with absolute paths in it, using this function in every config user function
// will let us avoid that.

export async function getPundleInstance(
  cli: CLI,
  terminal: boolean,
  projectPath: string,
  development: boolean,
  givenConfig: Config,
  useCache: boolean,
  errorCallback: Function
): Promise<{ pundle: Object, subscription: CompositeDisposable }> {
  // TODO: Fix this
  // const config = normalizeConfig(projectPath, givenConfig)
  const config = givenConfig

  const subscription = new CompositeDisposable()
  const pundle = await Pundle.create({
    entry: ['./'],
    presets: [[require.resolve('pundle-preset-default'), {
      generator: {
        pathType: config.pathType === 'number' ? 'number' : 'filePath',
      },
      reporter: {
        log: o => cli.log(o),
      },
    }]].concat(config.pundle.presets),
    components: [
      require.resolve('pundle-plugin-dedupe'),
      require.resolve('pundle-plugin-commons-chunk'),
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
        extensions: ['js'],
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
      ...config.pundle.components,
    ],
    output: {
      bundlePath: 'bundle.js',
      publicRoot: '/_/',
    },
    rootDirectory: config.bundleDirectory,
    replaceVariables: {
      'process.env.NODE_ENV': JSON.stringify(development ? 'development' : 'production'),
    },
  })
  subscription.add(pundle)

  if (!development) {
    return { pundle, subscription }
  }
  const server = new PundleDevServer(pundle, {
    port: config.webServerPort,
    rootDirectory: config.publicDirectory,
    hmrPath: '/_/bundle_hmr',
    bundlePath: '/_/bundle.js',
    useCache,
    publicPath: '/',
    sourceMapPath: '/_/bundle.js.map',
    redirectNotFoundToIndex: true,
  })
  subscription.add(server)
  await server.activate()

  return { pundle, subscription }
}
