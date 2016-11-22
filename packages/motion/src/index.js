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
  async watch(terminal: boolean = false): Promise<Disposable> {
    if (!await this.exists()) {
      throw new MotionError(ERROR_CODE.NOT_MOTION_APP)
    }

    if (terminal) {
      this.cli.activate()
    }
    const { subscription } = await getPundleInstance(this.cli, terminal, this.projectPath, true, this.config.config, error => {
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
    const { subscription, pundle } = await getPundleInstance(this.cli, terminal, this.projectPath, false, this.config.config, givenError => {
      error = givenError
    })
    try {
      if (error) {
        throw error
      }
      const generated = await pundle.generate({
        sourceMap: false,
      })
      await FS.mkdir(Path.join(this.config.getPublicDirectory(), '_'))
      await FS.writeFile(Path.join(this.config.getPublicDirectory(), '_/bundle.js'), generated.contents)
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
    return new Motion(projectRoot, await Config.create(projectRoot))
  }
}

module.exports = Motion
