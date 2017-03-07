/* @flow */

import FS from 'sb-fs'
import copy from 'sb-copy'
import Path from 'path'
import ConfigFile from 'sb-config-file'
import { CompositeDisposable, Disposable } from 'sb-event-kit'

import Compilation from './compilation'
import type { Config } from './types'
import { CONFIG_FILE_NAME, CONFIG_FILE_DEFAULT, CONFIG_FILE_OPTIONS } from './helpers'

const PRIVATE_VAR = {}

class Motion {
  config: Config;
  projectPath: string;
  compilation: Compilation;
  subscriptions: CompositeDisposable;

  constructor(privateVar: Object, projectPath: string, config: Config) {
    if (privateVar !== PRIVATE_VAR) {
      throw new Error('Invalid invocation of new Motion(). Use Motion.get() instead')
    }

    this.config = config
    this.projectPath = projectPath
    this.compilation = new Compilation(config, projectPath)
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.config)
  }
  async exists(): Promise<boolean> {
    return await FS.exists(Path.join(this.projectPath, CONFIG_FILE_NAME))
  }
  async watch(terminal: boolean = false, useCache: boolean = true): Promise<Disposable> {
    if (!await this.exists()) {
      throw new Error('Unable to run, directory is not a motion app')
    }

    if (terminal) {
      this.cli.activate()
    }
    const { subscription } = await getPundleInstance(this.cli, terminal, this.projectPath, true, this.config.config, useCache, error => {
      this.cli.log(error)
    })
    const disposable = new Disposable(() => {
      this.subscriptions.delete(disposable)
      subscription.dispose()
    })

    this.subscriptions.add(disposable)
    return disposable
  }
  async build(terminal: boolean = false): Promise<void> {
    if (!await this.exists()) {
      throw new Error('Unable to run, directory is not a motion app')
    }
    let error
    const { subscription, pundle } = await getPundleInstance(this.cli, terminal, this.projectPath, false, this.config.config, false, givenError => {
      error = givenError
    })
    try {
      if (error) {
        throw error
      }
      const outputs = await pundle.generate(null, {
        sourceMap: false,
      })
      const outputDirectory = this.config.getPublicDirectory()
      await FS.mkdirp(Path.join(outputDirectory, '_'))

      await Promise.all(outputs.map(function(output) {
        return FS.writeFile(Path.join(outputDirectory, '_', `bundle.${output.label}.js`), output.contents)
      }))

      const indexHtmlSource = Path.join(this.config.getBundleDirectory(), 'index.html')
      const indexHtmlTarget = Path.join(outputDirectory, 'index.html')
      const indexHtml = pundle.fill(await FS.readFile(indexHtmlSource, 'utf8'), outputs.map(o => o.chunk), {
        publicRoot: pundle.config.output.publicRoot,
        bundlePath: pundle.config.output.bundlePath,
      })
      await FS.writeFile(indexHtmlTarget, indexHtml)
    } finally {
      subscription.dispose()
    }
  }
  async init(): Promise<void> {
    if (await this.exists()) {
      throw new Error('Directory is already a motion app')
    }
    await FS.mkdirp(this.projectPath)
    await FS.mkdirp(this.config.outputDirectory)
    await copy(Path.normalize(Path.join(__dirname, '..', 'template', 'bundle')), this.projectPath, {
      failIfExists: false,
    })
    await copy(Path.normalize(Path.join(__dirname, '..', 'template', 'dist')), this.config.outputDirectory, {
      failIfExists: false,
    })
    await FS.writeFile(Path.join(this.projectPath, CONFIG_FILE_NAME), JSON.stringify(CONFIG_FILE_DEFAULT, null, 2))
  }
  dispose() {
    this.subscriptions.dispose()
  }

  static async create(projectRoot: string): Promise<Motion> {
    const configFile = await ConfigFile.get(Path.join(projectRoot, CONFIG_FILE_NAME), CONFIG_FILE_DEFAULT, CONFIG_FILE_OPTIONS)
    const config: Config = await configFile.get()

    config.outputDirectory = Path.resolve(projectRoot, config.outputDirectory)

    return new Motion(PRIVATE_VAR, projectRoot, config)
  }
}

module.exports = Motion
