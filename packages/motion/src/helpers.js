/* @flow */

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
