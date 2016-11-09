/* @flow */

import Path from 'path'
import * as FS from './fs'
import * as Helpers from './helpers'
import { MotionError, ERROR_CODE } from './error'
import type { Config as ConfigStruct } from './types'

export default class Config {
  config: ConfigStruct;
  configPath: string;
  projectPath: string;

  constructor(config: ConfigStruct, configPath: string, projectPath: string) {
    this.config = config
    this.configPath = configPath
    this.projectPath = projectPath
  }
  getBundleDirectory() {
    return Path.resolve(this.projectPath, this.get('bundleDirectory'))
  }
  getPublicDirectory() {
    return Path.resolve(this.projectPath, this.get('publicDirectory'))
  }
  get(key: $Keys<ConfigStruct>): any {
    return this.config[key]
  }
  async write(): Promise<void> {
    await FS.writeJSON(this.configPath, this.config)
  }
  static async create(projectPath: string): Promise<Config> {
    const config = {
      babel: {
        plugins: ['gloss/transform'],
        presets: ['babel-preset-motion']
      },
      pathType: 'filePath',
      webServerPort: Helpers.getRandomNumber(8000, 15000),
      saveNpmModules: true,
      bundleDirectory: '.',
      publicDirectory: './public',
      includePolyfills: true
    }
    const configPath = Path.join(projectPath, '.motion.json')
    try {
      Object.assign(config, await FS.readJSON(configPath))
    } catch (error) {
      if (error && error.name === 'SyntaxError') {
        throw new MotionError(ERROR_CODE.INVALID_MANIFEST)
      }
    }
    return new Config(config, configPath, projectPath)
  }
}
