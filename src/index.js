/* @flow */

import FS from 'sb-fs'
import copy from 'sb-copy'
import Path from 'path'
import ConfigFile from 'sb-config-file'
import { CompositeDisposable, Disposable } from 'sb-event-kit'

import Compilation from './compilation'
import type { Config, Options } from './types'
import { CONFIG_FILE_NAME, CONFIG_FILE_DEFAULT, CONFIG_FILE_OPTIONS } from './helpers'

const PRIVATE_VAR = {}

class Motion {
  config: Config;
  options: Options;
  projectPath: string;
  compilation: Compilation;
  subscriptions: CompositeDisposable;

  constructor(privateVar: Object, projectPath: string, config: Config, options: Options) {
    if (privateVar !== PRIVATE_VAR) {
      throw new Error('Invalid invocation of new Motion(). Use Motion.get() instead')
    }

    this.config = config
    this.options = options
    this.projectPath = projectPath
    this.compilation = new Compilation(projectPath, config, options)
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.compilation)
  }
  async exists(): Promise<boolean> {
    return await FS.exists(Path.join(this.projectPath, CONFIG_FILE_NAME))
  }
  async watch(): Promise<Disposable> {
    if (!await this.exists()) {
      throw new Error('Unable to run, directory is not a motion app')
    }
    await this.compilation.watch(this.options.useCache)
  }
  async build(): Promise<void> {
    if (!await this.exists()) {
      throw new Error('Unable to run, directory is not a motion app')
    }
    await this.compilation.build(this.options.useCache)
  }
  async init(overwrite: boolean = true): Promise<void> {
    if (await this.exists()) {
      throw new Error('Directory is already a motion app')
    }
    await FS.mkdirp(this.projectPath)
    await FS.mkdirp(this.config.outputDirectory)
    await copy(Path.normalize(Path.join(__dirname, '..', 'template', 'bundle')), this.projectPath, {
      overwrite,
      failIfExists: false,
    })
    await copy(Path.normalize(Path.join(__dirname, '..', 'template', 'dist')), this.config.outputDirectory, {
      overwrite,
      failIfExists: false,
    })
    await FS.writeFile(Path.join(this.projectPath, CONFIG_FILE_NAME), JSON.stringify(CONFIG_FILE_DEFAULT, null, 2))
  }
  dispose() {
    this.subscriptions.dispose()
  }

  static async create(projectRoot: string, options: Options): Promise<Motion> {
    const configFile = await ConfigFile.get(Path.join(projectRoot, CONFIG_FILE_NAME), CONFIG_FILE_DEFAULT, CONFIG_FILE_OPTIONS)
    const config: Config = await configFile.get()

    config.outputDirectory = Path.resolve(projectRoot, config.outputDirectory)

    return new Motion(PRIVATE_VAR, projectRoot, config, options)
  }
}

module.exports = Motion
