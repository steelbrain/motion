/* @flow */

import invariant from 'assert'
import Path from 'path'
import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import { exists, copy, mkdir, realpath } from 'motion-fs'
import { CompositeDisposable, Disposable } from 'sb-event-kit'
import State from './state'
import CLI from './cli'
import { MotionError, ERROR_CODE } from './error'
import { fillConfig, getWebpackConfig } from './helpers'
import type { Motion$Config } from './types'

const EXECUTING_ON: Set<string> = new Set()

class Motion {
  cli: CLI;
  state: State;
  config: Motion$Config;
  watching: boolean;
  subscriptions: CompositeDisposable;

  constructor(state: State, config: Motion$Config) {
    invariant(state instanceof State && typeof config === 'object',
      'Use Motion.create instead of constructor')

    this.cli = new CLI(state, config)
    this.state = state
    this.config = config
    this.watching = false
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.cli)
    this.cli.onShouldBuild(async () => {
      await this.build(false, true)
    })
  }

  async exists(): Promise<boolean> {
    return await exists(this.config.dataDirectory)
  }

  async watch(terminal: boolean = false): Promise<Disposable> {
    if (!await this.exists()) {
      throw new MotionError(ERROR_CODE.NOT_MOTION_APP)
    }
    if (EXECUTING_ON.has(this.config.rootDirectory)) {
      throw new MotionError(ERROR_CODE.ALREADY_EXECUTING)
    }
    EXECUTING_ON.add(this.config.dataDirectory)
    process.chdir(this.config.dataDirectory)
    if (terminal) {
      this.cli.activate()
    }
    const compiler = webpack(getWebpackConfig(this.state, this.config, this.cli, terminal, true))
    const server = new WebpackDevServer(compiler, {
      hot: true,
      quiet: true,
      inline: true,
      publicPath: '/_/'
    })
    const disposable = new Disposable(() => {
      this.subscriptions.remove(disposable)
      this.cli.deactivate()
      server.close()
      EXECUTING_ON.delete(this.config.dataDirectory)
    })

    this.subscriptions.add(disposable)
    server.listen(this.state.get().web_server_port)
    return disposable
  }

  async build(terminal: boolean = false, ignoreExecution: boolean = false): Promise {
    if (!await this.exists()) {
      throw new MotionError(ERROR_CODE.NOT_MOTION_APP)
    }
    if (!ignoreExecution && EXECUTING_ON.has(this.config.dataDirectory)) {
      throw new MotionError(ERROR_CODE.ALREADY_EXECUTING)
    }
    process.chdir(this.config.dataDirectory)
    await new Promise((resolve, reject) => {
      webpack(getWebpackConfig(this.state, this.config, this.cli, terminal, false), function(error) {
        if (error) {
          reject(error)
        } else resolve()
      })
    })
  }

  async init(): Promise {
    if (await this.exists()) {
      throw new MotionError(ERROR_CODE.ALREADY_MOTION_APP)
    }
    await mkdir(this.config.rootDirectory)
    await copy(Path.normalize(Path.join(__dirname, '..', 'template')), this.config.rootDirectory)
    this.state.write()
  }

  dispose() {
    this.subscriptions.dispose()
  }

  static async create(config: Motion$Config): Promise<Motion> {
    if (await exists(config.rootDirectory)) {
      config.rootDirectory = await realpath(config.rootDirectory)
    }
    fillConfig(config)
    const state = await State.create(Path.join(config.dataDirectory, 'state.json'))
    return new Motion(state, config)
  }
}

module.exports = Motion
