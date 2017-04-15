/* @flow */

import promisify from 'sb-promisify'

const resolve = promisify(require('resolve'))

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

const NPM_ERROR_EXTRACTION_REGEX = /npm ERR! code .*?\n\nnpm ERR! .*? (.*)/gm
export function getNpmErrorMessage(contents: string): string {
  if (!contents.includes('npm ERR!')) {
    return contents
  }
  const match = NPM_ERROR_EXTRACTION_REGEX.exec(contents)
  if (match) {
    return match[1]
  }
  return contents
}

// TODO: Move this relative resolution logic to pundle
export async function normalizeBabelConfig(rootDirectory: string, config: Object): Promise<Object> {
  const plugins = []
  const presets = []

  if (Array.isArray(config.presets)) {
    for (const entry of config.presets) {
      // eslint-disable-next-line prefer-const
      let [name, options = null] = Array.isArray(entry) ? entry : [entry]
      if (name === 'babel-preset-steelbrain' || name === 'steelbrain') {
        name = require.resolve('babel-preset-steelbrain')
      } else if (typeof name === 'string') {
        name = await resolve(name, { basedir: rootDirectory })
      }
      if (options) {
        presets.push([name, options])
      }
      else {
        presets.push([name])
      }
    }
  }
  if (Array.isArray(config.plugins)) {
    for (const entry of config.plugins) {
      // eslint-disable-next-line prefer-const
      let [name, options = null] = Array.isArray(entry) ? entry : [entry]
      if (typeof name === 'string') {
        name = await resolve(name, { basedir: rootDirectory })
      }
      plugins.push([name, options])
    }
  }

  return {
    ...config,
    presets,
    plugins
  }
}
