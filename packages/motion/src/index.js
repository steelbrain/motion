/* @flow */

import Path from 'path'
import invariant from 'assert'
import { CompositeDisposable, Disposable } from 'sb-event-kit'
import * as FS from './fs'
import CLI from './cli'
import Config from './config'

import { MotionError, ERROR_CODE } from './error'
import { getPundleInstance } from './helpers'

class Motion {
  cli: CLI;
  config: Config;
  watching: boolean;
  projectPath: string;
  subscriptions: CompositeDisposable;

  constructor(projectPath: string, config: Config) {
    invariant(config instanceof Config, 'Use Motion.create instead of constructor')

    this.cli = new CLI(config)
    this.config = config
    this.watching = false
    this.projectPath = projectPath
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.cli)
    this.cli.onShouldBuild(async () => {
      await this.build(false)
    })
    this.cli.onShouldDispose(() => {
      this.dispose()
    })
  }
  async exists(): Promise<boolean> {
    return await FS.exists(Path.join(this.projectPath, '.motion.json'))
  }
  async watch(terminal: boolean = false, useCache: boolean = true): Promise<Disposable> {
    if (!await this.exists()) {
      throw new MotionError(ERROR_CODE.NOT_MOTION_APP)
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
      throw new MotionError(ERROR_CODE.NOT_MOTION_APP)
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
      await FS.mkdir(Path.join(outputDirectory, '_'))

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
      throw new MotionError(ERROR_CODE.ALREADY_MOTION_APP)
    }
    await FS.mkdir(this.config.getBundleDirectory())
    await FS.mkdir(this.config.getPublicDirectory())
    await FS.copy(Path.normalize(Path.join(__dirname, '..', 'template', 'bundle')), this.config.getBundleDirectory())
    await FS.copy(Path.normalize(Path.join(__dirname, '..', 'template', 'public')), this.config.getPublicDirectory())
    await this.config.write()
  }
  dispose() {
    this.subscriptions.dispose()
  }

  static async create(projectRoot: string): Promise<Motion> {
    const config = await Config.create(projectRoot)
    return new Motion(projectRoot, config)
  }
}

module.exports = Motion
