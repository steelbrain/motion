/* @flow */

import invariant from 'assert'
import Path from 'path'
import { exists, copy, mkdir, realpath } from 'motion-fs'
import { CompositeDisposable } from 'sb-event-kit'
import State from './state'
import CLI from './cli'
import { MotionError, ERROR_CODE } from './error'
import { fillConfig } from './helpers'
import type { Motion$Config } from './types'

class Motion {
  cli: CLI;
  state: State;
  config: Motion$Config;
  subscriptions: CompositeDisposable;

  constructor(state: State, config: Motion$Config) {
    invariant(state instanceof State && typeof config === 'object',
      'Use Motion.create instead of constructor')

    this.cli = new CLI(state, config)
    this.state = state
    this.config = config
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.cli)
  }

  async exists(): Promise<boolean> {
    return await exists(this.config.dataDirectory)
  }

  async watch(terminal: boolean = false): Promise {
    if (!await this.exists()) {
      throw new MotionError(ERROR_CODE.NOT_MOTION_APP)
    }
    if (terminal && process.stdin.isTTY) {
      this.cli.activate()
    }
    this.cli.log('I should build the app')
  }

  async build(terminal: boolean = false): Promise {
    if (!await this.exists()) {
      throw new MotionError(ERROR_CODE.NOT_MOTION_APP)
    }
    this.cli.log('I should build the app')
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
