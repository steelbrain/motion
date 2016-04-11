/* @flow */

import invariant from 'assert'
import Path from 'path'
// import express from 'express'
import { exists, copy, mkdir, realpath, writeFile } from 'motion-fs'
import { CompositeDisposable, Disposable, Emitter } from 'sb-event-kit'
import State from './state'
import CLI from './cli'
import { MotionError, ERROR_CODE } from './error'
import { fillConfig, getPundleInstance } from './helpers'
import type { Motion$Config } from './types'

class Motion {
  cli: CLI;
  state: State;
  config: Motion$Config;
  emitter: Emitter;
  watching: boolean;
  subscriptions: CompositeDisposable;

  constructor(state: State, config: Motion$Config) {
    invariant(state instanceof State && typeof config === 'object',
      'Use Motion.create instead of constructor')

    this.cli = new CLI(state, config)
    this.state = state
    this.config = config
    this.emitter = new Emitter()
    this.watching = false
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.emitter)
    this.subscriptions.add(this.cli)
    this.cli.onShouldBuild(async () => {
      await this.build(false)
    })
    this.cli.onShouldDispose(() => {
      this.dispose()
    })
  }
  async exists(): Promise<boolean> {
    return await exists(this.config.dataDirectory)
  }
  async watch(terminal: boolean = false): Promise<Disposable> {
    if (!await this.exists()) {
      throw new MotionError(ERROR_CODE.NOT_MOTION_APP)
    }

    this.state.get().running = true
    this.state.get().process_id = process.pid
    await this.state.write()

    if (terminal) {
      this.cli.activate()
    }
    const pundle = getPundleInstance(this.state, this.config, this.cli, terminal, true, error => {
      this.emitter.emit('did-error', error)
    })
    pundle.listen(this.state.get().web_server_port)
    // server.app.use('/client', express.static(Path.dirname(require.resolve('motion-client/package.json'))))
    const disposable = new Disposable(() => {
      this.state.get().running = false
      this.state.write()
      this.subscriptions.remove(disposable)
      pundle.dispose()
    })

    this.subscriptions.add(disposable)
    return disposable
  }
  async build(terminal: boolean = false): Promise {
    if (!await this.exists()) {
      throw new MotionError(ERROR_CODE.NOT_MOTION_APP)
    }
    const compilation = getPundleInstance(this.state, this.config, this.cli, terminal, false, error => {
      this.emitter.emit('did-error', error)
    })
    await writeFile(Path.join(this.config.dataDirectory, '_/bundle.js'), compilation.compile())
  }
  async init(): Promise {
    if (await this.exists()) {
      throw new MotionError(ERROR_CODE.ALREADY_MOTION_APP)
    }
    await mkdir(this.config.rootDirectory)
    await copy(Path.normalize(Path.join(__dirname, '..', 'template')), this.config.rootDirectory)
    this.state.write()
  }
  onDidError(callback: Function): Disposable {
    return this.emitter.on('did-error', callback)
  }
  dispose() {
    this.subscriptions.dispose()
  }

  static async create(config: Motion$Config): Promise<Motion> {
    if (await exists(config.rootDirectory)) {
      config.rootDirectory = await realpath(config.rootDirectory)
    }
    fillConfig(config)
    const state = await State.create(Path.join(config.dataDirectory, 'state.json'), Path.join(config.dataDirectory, 'config.json'))
    return new Motion(state, config)
  }
}

module.exports = Motion
