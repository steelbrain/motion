/* @flow */

import Ora from 'ora'
import open from 'open'
import Path from 'path'
import chalk from 'chalk'
import unique from 'lodash.uniq'
import stripAnsi from 'strip-ansi'
import { exec } from 'sb-exec'
import { Emitter, CompositeDisposable } from 'sb-event-kit'

import Vorpal from './vorpal'
import type { Disposable } from 'sb-event-kit'
import type { Config } from '../types'

const SPINNER_GLUE = ' & '

export default class CLI {
  active: boolean;
  vorpal: Vorpal;
  config: Config;
  spinner: ?{
    texts: Array<string>,
    instance: Ora
  };
  emitter: Emitter;
  projectPath: string;
  subscriptions: CompositeDisposable;

  constructor(projectPath: string, config: Config) {
    this.vorpal = new Vorpal()
    this.active = false
    this.config = config
    this.emitter = new Emitter()
    this.projectPath = projectPath
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.emitter)
  }
  activate() {
    const serverAddress = `http://localhost:${this.config.webServerPort}/`
    const manifest = {}
    try {
      // $FlowIgnore: Flow doesn't like dynamic requires
      Object.assign({}, require(Path.join(this.projectPath), 'package.json'))
    } catch (_) { /* No Op */ }

    this.vorpal.activate(manifest.name || Path.basename(this.projectPath))
    this.vorpal.log(`${chalk.green('Server running at')} ${serverAddress}`)
    this.vorpal.log(`${chalk.yellow(`Type ${chalk.underline('help')} to get list of available commands`)}`)
    this.vorpal.addCommand('open', 'Open this app in Browser', () => {
      open(serverAddress)
    })
    this.vorpal.addCommand('editor', 'Open this app in Atom', async () => {
      const defaultEditor = 'atom'
      let editor = process.env.EDITOR || defaultEditor

      const editorName = Path.basename(editor)
      if (editorName === 'nano' || editorName === 'vi' || editorName === 'vim') {
        editor = defaultEditor
      }

      await exec(editor, [this.projectPath])
    })
    this.vorpal.addCommand('build', 'Build this app for production usage', async () => {
      await this.emitter.emit('should-build')
      this.vorpal.log('Dist files built successfully in', Path.relative(this.projectPath, this.config.outputDirectory))
    })
    this.vorpal.replaceCommand('exit', 'Exit motion daemon', () => {
      this.emitter.emit('should-dispose')
      process.exit()
    })
    this.active = true
  }
  deactivate() {
    this.vorpal.deactivate()
  }
  log(given: string) {
    let contents = given
    if (this.active) {
      this.vorpal.log(contents)
    } else {
      if (!process.stdout.isTTY) {
        contents = stripAnsi(contents)
      }
      console.log(contents)
    }
  }
  addSpinner(text: string) {
    if (!this.active) {
      this.log(text)
      return
    }

    const spinner = this.spinner
    if (spinner) {
      spinner.texts.push(text)
      spinner.instance.text = unique(spinner.texts).join(SPINNER_GLUE)
    } else {
      const instance = new Ora({
        text,
        color: 'yellow'
      })
      this.spinner = {
        texts: [text],
        instance
      }
      instance.start()
    }
  }
  removeSpinner(text: string) {
    if (!this.active) {
      return
    }

    const spinner = this.spinner
    if (spinner) {
      const index = spinner.texts.indexOf(text)
      if (index !== -1) {
        spinner.texts.splice(index, 1)
      }
      if (spinner.texts.length) {
        spinner.instance.text = unique(spinner.texts).join(SPINNER_GLUE)
      } else {
        this.removeAllSpinners()
      }
    }
  }
  removeAllSpinners() {
    if (!this.active) {
      return
    }
    const spinner = this.spinner
    if (spinner) {
      spinner.instance.stop()
      this.vorpal.instance.ui.refresh()
    }
  }
  onShouldBuild(callback: Function): Disposable {
    return this.emitter.on('should-build', callback)
  }
  onShouldDispose(callback: Function): Disposable {
    return this.emitter.on('should-dispose', callback)
  }
  dispose() {
    this.vorpal.dispose()
    this.subscriptions.dispose()
  }
}
